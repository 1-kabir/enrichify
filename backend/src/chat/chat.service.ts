import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { Webset } from '../entities/webset.entity';
import { WebsetCell } from '../entities/webset-cell.entity';
import { WebsetCitation } from '../entities/webset-citation.entity';
import { LLMProvidersService, LLMRequest } from '../providers/llm/llm-providers.service';
import { EnrichmentService } from '../enrichment/enrichment.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(Webset)
    private websetRepository: Repository<Webset>,
    @InjectRepository(WebsetCell)
    private cellRepository: Repository<WebsetCell>,
    @InjectRepository(WebsetCitation)
    private citationRepository: Repository<WebsetCitation>,
    private llmService: LLMProvidersService,
    private enrichmentService: EnrichmentService,
  ) {}

  async createConversation(
    dto: CreateConversationDto,
    userId: string,
  ): Promise<ChatConversation> {
    const webset = await this.websetRepository.findOne({
      where: { id: dto.websetId },
    });

    if (!webset) {
      throw new NotFoundException(`Webset with ID ${dto.websetId} not found`);
    }

    if (webset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this webset');
    }

    const conversation = this.conversationRepository.create({
      websetId: dto.websetId,
      userId,
      title: dto.title,
    });

    return this.conversationRepository.save(conversation);
  }

  async findAllConversations(userId: string): Promise<ChatConversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      relations: ['webset'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findConversationsByWebset(
    websetId: string,
    userId: string,
  ): Promise<ChatConversation[]> {
    const webset = await this.websetRepository.findOne({
      where: { id: websetId },
    });

    if (!webset) {
      throw new NotFoundException(`Webset with ID ${websetId} not found`);
    }

    if (webset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this webset');
    }

    return this.conversationRepository.find({
      where: { websetId, userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findConversation(id: string, userId: string): Promise<ChatConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['webset', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  async updateConversation(
    id: string,
    dto: UpdateConversationDto,
    userId: string,
  ): Promise<ChatConversation> {
    const conversation = await this.findConversation(id, userId);
    Object.assign(conversation, dto);
    return this.conversationRepository.save(conversation);
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    const conversation = await this.findConversation(id, userId);
    await this.conversationRepository.remove(conversation);
  }

  async getMessages(conversationId: string, userId: string): Promise<ChatMessage[]> {
    const conversation = await this.findConversation(conversationId, userId);
    return this.messageRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    userId: string,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const conversation = await this.findConversation(conversationId, userId);

    const userMessage = this.messageRepository.create({
      conversationId: conversation.id,
      role: MessageRole.USER,
      content: dto.content,
    });
    await this.messageRepository.save(userMessage);

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
      throw new NotFoundException('No active LLM provider found');
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

    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    return { userMessage, assistantMessage };
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

  async getCellDetails(
    websetId: string,
    row: number,
    column: string,
    userId: string,
  ): Promise<WebsetCell> {
    const webset = await this.websetRepository.findOne({
      where: { id: websetId },
    });

    if (!webset) {
      throw new NotFoundException(`Webset with ID ${websetId} not found`);
    }

    if (webset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this webset');
    }

    const cell = await this.cellRepository.findOne({
      where: { websetId, row, column },
      relations: ['citations'],
    });

    if (!cell) {
      throw new NotFoundException(
        `Cell at row ${row}, column ${column} not found`,
      );
    }

    return cell;
  }

  async getCitationsForCell(
    websetId: string,
    row: number,
    column: string,
    userId: string,
  ): Promise<WebsetCitation[]> {
    const cell = await this.getCellDetails(websetId, row, column, userId);
    
    return this.citationRepository.find({
      where: { cellId: cell.id },
      order: { createdAt: 'DESC' },
    });
  }

  async triggerEnrichment(
    conversationId: string,
    websetId: string,
    column: string,
    rows: number[],
    userId: string,
  ): Promise<{ jobId: string }> {
    await this.findConversation(conversationId, userId);

    const enrichCellDto = {
      websetId,
      column,
      rows,
      prompt: '',
    };

    return this.enrichmentService.enrichCells(enrichCellDto, userId);
  }
}
