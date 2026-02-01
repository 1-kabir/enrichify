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

export class CreateWebsetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnDefinitionDto)
  columnDefinitions: ColumnDefinitionDto[];

  @IsOptional()
  @IsEnum(WebsetStatus)
  status?: WebsetStatus;
}
