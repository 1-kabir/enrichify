import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';
import { LLMProviderType } from '../../entities/llm-provider.entity';

export class CreateLLMProviderDto {
  @IsString()
  name: string;

  @IsEnum(LLMProviderType)
  type: LLMProviderType;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsInt()
  rateLimit?: number;

  @IsOptional()
  @IsInt()
  dailyLimit?: number;
}

export class UpdateLLMProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(LLMProviderType)
  type?: LLMProviderType;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsInt()
  rateLimit?: number;

  @IsOptional()
  @IsInt()
  dailyLimit?: number;
}
