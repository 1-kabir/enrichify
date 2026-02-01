import { IsInt, IsOptional, IsString } from 'class-validator';

export class RevertVersionDto {
  @IsInt()
  version: number;

  @IsOptional()
  @IsString()
  changeDescription?: string;
}
