import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class RevertVersionDto {
  @IsOptional()
  @IsInt()
  version?: number;

  @IsOptional()
  @IsUUID()
  versionId?: string;

  @IsOptional()
  @IsString()
  changeDescription?: string;
}
