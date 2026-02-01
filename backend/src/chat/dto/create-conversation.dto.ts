import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  @IsNotEmpty()
  websetId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
