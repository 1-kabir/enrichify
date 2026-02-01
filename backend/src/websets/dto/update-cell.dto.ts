import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';

export class UpdateCellDto {
  @IsInt()
  row: number;

  @IsString()
  column: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsNumber()
  confidenceScore?: number;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString()
  changeDescription?: string;
}
