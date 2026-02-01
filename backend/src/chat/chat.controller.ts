import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: any,
  ) {
    return this.chatService.createConversation(dto, req.user.id);
  }

  @Get('conversations')
  async getAllConversations(@Req() req: any) {
    return this.chatService.findAllConversations(req.user.id);
  }

  @Get('conversations/webset/:websetId')
  async getConversationsByWebset(
    @Param('websetId') websetId: string,
    @Req() req: any,
  ) {
    return this.chatService.findConversationsByWebset(websetId, req.user.id);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @Req() req: any) {
    return this.chatService.findConversation(id, req.user.id);
  }

  @Patch('conversations/:id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @Req() req: any,
  ) {
    return this.chatService.updateConversation(id, dto, req.user.id);
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @Req() req: any) {
    await this.chatService.deleteConversation(id, req.user.id);
    return { message: 'Conversation deleted successfully' };
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string, @Req() req: any) {
    return this.chatService.getMessages(id, req.user.id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    return this.chatService.sendMessage(id, dto, req.user.id);
  }

  @Get('websets/:websetId/cell/:row/:column')
  async getCellDetails(
    @Param('websetId') websetId: string,
    @Param('row') row: number,
    @Param('column') column: string,
    @Req() req: any,
  ) {
    return this.chatService.getCellDetails(websetId, +row, column, req.user.id);
  }

  @Get('websets/:websetId/cell/:row/:column/citations')
  async getCellCitations(
    @Param('websetId') websetId: string,
    @Param('row') row: number,
    @Param('column') column: string,
    @Req() req: any,
  ) {
    return this.chatService.getCitationsForCell(
      websetId,
      +row,
      column,
      req.user.id,
    );
  }
}
