import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { LLMProvidersService, LLMRequest } from '../providers/llm/llm-providers.service';
import { MessageRole } from '../entities/chat-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userRooms = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private llmService: LLMProvidersService,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(Webset)
    private websetRepository: Repository<Webset>,
    @InjectRepository(WebsetCell)
    private cellRepository: Repository<WebsetCell>,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
    if (client.userId && this.userRooms.has(client.userId)) {
      const rooms = this.userRooms.get(client.userId);
      rooms.forEach((room) => {
        client.leave(room);
      });
      this.userRooms.delete(client.userId);
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.userId = data.userId;
    return { success: true, userId: data.userId };
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const conversation = await this.chatService.findConversation(
        data.conversationId,
        data.userId,
      );

      const roomId = `conversation:${conversation.id}`;
      client.join(roomId);

      if (!this.userRooms.has(data.userId)) {
        this.userRooms.set(data.userId, new Set());
      }
      this.userRooms.get(data.userId).add(roomId);

      client.userId = data.userId;

      return { success: true, conversationId: conversation.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomId = `conversation:${data.conversationId}`;
    client.leave(roomId);

    if (this.userRooms.has(data.userId)) {
      this.userRooms.get(data.userId).delete(roomId);
    }

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string; userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const conversation = await this.chatService.findConversation(
        data.conversationId,
        data.userId,
      );

      const userMessage = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: data.content,
      });
      await this.messageRepository.save(userMessage);

      const roomId = `conversation:${conversation.id}`;
      this.server.to(roomId).emit('messageReceived', {
        message: userMessage,
      });

      const webset = await this.websetRepository.findOne({
        where: { id: conversation.websetId },
        relations: ['cells', 'cells.citations'],
      });

      const context = await this.buildWebsetContext(webset);

      const previousMessages = await this.messageRepository.find({
        where: { conversationId: conversation.id },
        order: { createdAt: 'ASC' },
        take: 20,
      });

      const llmMessages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(webset, context),
        },
        ...previousMessages
          .slice(-10)
          .map((msg) => ({
            role: msg.role === MessageRole.SYSTEM ? 'system' : msg.role,
            content: msg.content,
          })),
      ];

      const activeProviders = await this.llmService.findActive();
      if (!activeProviders.length) {
        throw new Error('No active LLM provider found');
      }

      const llmRequest: LLMRequest = {
        messages: llmMessages,
        temperature: 0.7,
        maxTokens: 2000,
      };

      this.server.to(roomId).emit('assistantTyping', { typing: true });

      const llmResponse = await this.llmService.makeRequest(
        activeProviders[0].id,
        llmRequest,
        data.userId,
      );

      const assistantMessage = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        content: llmResponse.content,
        metadata: {
          model: llmResponse.model,
          tokensUsed: llmResponse.tokensUsed,
          finishReason: llmResponse.finishReason,
        },
      });
      await this.messageRepository.save(assistantMessage);

      this.server.to(roomId).emit('assistantTyping', { typing: false });
      this.server.to(roomId).emit('messageReceived', {
        message: assistantMessage,
      });

      return { success: true, userMessage, assistantMessage };
    } catch (error) {
      const roomId = `conversation:${data.conversationId}`;
      this.server.to(roomId).emit('assistantTyping', { typing: false });
      this.server.to(roomId).emit('error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('streamMessage')
  async handleStreamMessage(
    @MessageBody() data: { conversationId: string; content: string; userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const conversation = await this.chatService.findConversation(
        data.conversationId,
        data.userId,
      );

      const userMessage = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: data.content,
      });
      await this.messageRepository.save(userMessage);

      const roomId = `conversation:${conversation.id}`;
      this.server.to(roomId).emit('messageReceived', {
        message: userMessage,
      });

      this.server.to(roomId).emit('streamStart', {
        conversationId: conversation.id,
      });

      const fullResponse = await this.simulateStreamedResponse(
        conversation.id,
        data.userId,
        roomId,
      );

      const assistantMessage = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        content: fullResponse,
        metadata: {
          streamed: true,
        },
      });
      await this.messageRepository.save(assistantMessage);

      this.server.to(roomId).emit('streamEnd', {
        conversationId: conversation.id,
        messageId: assistantMessage.id,
      });

      return { success: true };
    } catch (error) {
      const roomId = `conversation:${data.conversationId}`;
      this.server.to(roomId).emit('streamError', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  private async simulateStreamedResponse(
    conversationId: string,
    userId: string,
    roomId: string,
  ): Promise<string> {
    const conversation = await this.chatService.findConversation(
      conversationId,
      userId,
    );

    const webset = await this.websetRepository.findOne({
      where: { id: conversation.websetId },
      relations: ['cells', 'cells.citations'],
    });

    const context = await this.buildWebsetContext(webset);

    const previousMessages = await this.messageRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    const llmMessages = [
      {
        role: 'system',
        content: this.buildSystemPrompt(webset, context),
      },
      ...previousMessages
        .slice(-10)
        .map((msg) => ({
          role: msg.role === MessageRole.SYSTEM ? 'system' : msg.role,
          content: msg.content,
        })),
    ];

    const activeProviders = await this.llmService.findActive();
    if (!activeProviders.length) {
      throw new Error('No active LLM provider found');
    }

    const llmRequest: LLMRequest = {
      messages: llmMessages,
      temperature: 0.7,
      maxTokens: 2000,
    };

    const llmResponse = await this.llmService.makeRequest(
      activeProviders[0].id,
      llmRequest,
      userId,
    );

    const words = llmResponse.content.split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      accumulated += (i > 0 ? ' ' : '') + words[i];
      this.server.to(roomId).emit('streamChunk', {
        chunk: words[i] + (i < words.length - 1 ? ' ' : ''),
        accumulated,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return llmResponse.content;
  }

  private async buildWebsetContext(webset: Webset): Promise<string> {
    let context = `Webset: ${webset.name}\n`;
    if (webset.description) {
      context += `Description: ${webset.description}\n`;
    }

    context += `\nColumns:\n`;
    webset.columnDefinitions.forEach((col) => {
      context += `- ${col.name} (${col.type})${col.required ? ' [required]' : ''}\n`;
    });

    context += `\nTotal Rows: ${webset.rowCount}\n`;

    const sampleCells = await this.cellRepository.find({
      where: { websetId: webset.id },
      take: 50,
      relations: ['citations'],
    });

    if (sampleCells.length > 0) {
      context += `\nSample Data (first ${Math.min(50, sampleCells.length)} cells):\n`;

      const cellsByRow = new Map<number, WebsetCell[]>();
      sampleCells.forEach((cell) => {
        if (!cellsByRow.has(cell.row)) {
          cellsByRow.set(cell.row, []);
        }
        cellsByRow.get(cell.row).push(cell);
      });

      let rowCount = 0;
      for (const [row, cells] of cellsByRow.entries()) {
        if (rowCount >= 5) break;
        context += `\nRow ${row}:\n`;
        cells.forEach((cell) => {
          context += `  ${cell.column}: ${cell.value || '[empty]'}`;
          if (cell.confidenceScore !== null && cell.confidenceScore !== undefined) {
            context += ` (confidence: ${cell.confidenceScore.toFixed(2)})`;
          }
          if (cell.citations && cell.citations.length > 0) {
            context += ` [${cell.citations.length} citation(s)]`;
          }
          context += '\n';
        });
        rowCount++;
      }
    }

    return context;
  }

  private buildSystemPrompt(webset: Webset, context: string): string {
    return `You are an AI assistant helping users interact with their webset data in Enrichify.

${context}

Your capabilities:
1. Answer questions about the webset structure, columns, and data
2. Provide information about specific cells, including their values and confidence scores
3. Explain citations and sources used for specific cells
4. Help users understand data quality and confidence levels
5. Suggest enrichment operations when appropriate

When asked about:
- "What resources were used for cell X?": Provide citation information
- "What is the confidence score of cell Y?": Provide confidence score and context
- Cell data: Provide the value, confidence, and any available metadata
- Enrichment: Explain how to enrich data but note that enrichment operations must be triggered separately

Be concise, helpful, and data-focused. If you don't have information about a specific cell or row, say so clearly.`;
  }
}
