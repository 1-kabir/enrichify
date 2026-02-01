import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCitationDto {
  @IsUUID()
  cellId: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  contentSnippet?: string;

  @IsOptional()
  @IsUUID()
  searchProviderId?: string;
}
