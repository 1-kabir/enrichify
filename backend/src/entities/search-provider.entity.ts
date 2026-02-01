import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProviderUsage } from './provider-usage.entity';

export enum SearchProviderType {
  EXA = 'exa',
  BRAVE = 'brave',
  BING = 'bing',
  GOOGLE = 'google',
  FIRECRAWL = 'firecrawl',
  TAVILY = 'tavily',
  SERPER = 'serper',
  JINA = 'jina',
  SEARXNG = 'searxng',
}

@Entity('search_providers')
export class SearchProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SearchProviderType,
  })
  type: SearchProviderType;

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

  @OneToMany(() => ProviderUsage, (usage) => usage.searchProvider)
  usages: ProviderUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
