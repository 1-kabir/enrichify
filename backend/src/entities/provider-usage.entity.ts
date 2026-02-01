import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LLMProvider } from './llm-provider.entity';
import { SearchProvider } from './search-provider.entity';
import { User } from './user.entity';

export enum ProviderUsageType {
  LLM = 'llm',
  SEARCH = 'search',
}

@Entity('provider_usage')
export class ProviderUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ProviderUsageType,
  })
  type: ProviderUsageType;

  @ManyToOne(() => LLMProvider, (provider) => provider.usages, { nullable: true })
  @JoinColumn({ name: 'llm_provider_id' })
  llmProvider: LLMProvider;

  @Column({ nullable: true })
  llm_provider_id: string;

  @ManyToOne(() => SearchProvider, (provider) => provider.usages, { nullable: true })
  @JoinColumn({ name: 'search_provider_id' })
  searchProvider: SearchProvider;

  @Column({ nullable: true })
  search_provider_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_id: string;

  @Column({ type: 'int', default: 1 })
  requestCount: number;

  @Column({ type: 'int', nullable: true })
  tokensUsed: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
