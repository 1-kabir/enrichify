import { IsString, IsUUID, IsOptional, IsArray } from 'class-validator';

export class EnrichCellDto {
  @IsUUID()
  websetId: string;

  @IsString()
  column: string;

  @IsArray()
  rows: number[];

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsUUID()
  llmProviderId?: string;

  @IsOptional()
  @IsUUID()
  searchProviderId?: string;
}
