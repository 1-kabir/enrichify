import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExportFormat } from '../../entities/webset-export.entity';

export class CreateExportDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsString()
  googleAccessToken?: string;
}
