import { IsString, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { WebsetStatus } from '../../entities/webset.entity';

class ColumnDefinitionDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  required?: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string;
}

export class UpdateWebsetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnDefinitionDto)
  columnDefinitions?: ColumnDefinitionDto[];

  @IsOptional()
  @IsEnum(WebsetStatus)
  status?: WebsetStatus;
}
