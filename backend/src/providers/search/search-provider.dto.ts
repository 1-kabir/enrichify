import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';
import { SearchProviderType } from '../../entities/search-provider.entity';

export class CreateSearchProviderDto {
  @IsString()
  name: string;

  @IsEnum(SearchProviderType)
  type: SearchProviderType;

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

export class UpdateSearchProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SearchProviderType)
  type?: SearchProviderType;

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
