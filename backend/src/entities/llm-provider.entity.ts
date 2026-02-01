import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProviderUsage } from './provider-usage.entity';

export enum LLMProviderType {
  OPENAI = 'openai',
  OPENAI_COMPATIBLE = 'openai-compatible',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  GROQ = 'groq',
  OPENROUTER = 'openrouter',
  VERCEL_AI = 'vercel-ai',
}

@Entity('llm_providers')
export class LLMProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: LLMProviderType,
  })
  type: LLMProviderType;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  rateLimit: number;

  @Column({ type: 'int', nullable: true })
  dailyLimit: number;

  @OneToMany(() => ProviderUsage, (usage) => usage.llmProvider)
  usages: ProviderUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
