import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { LLMProviderType, SearchProviderType } from './llm-provider.entity';

export enum ProviderType {
  LLM = 'llm',
  SEARCH = 'search',
}

@Entity('user_provider_configs')
export class UserProviderConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ProviderType,
  })
  providerType: ProviderType;

  @Column()
  providerId: string; // ID of the provider in the LLM or Search provider table

  @Column()
  providerName: string; // Custom name for the user's provider config

  @Column({ type: 'text' }) // Store encrypted API key
  encryptedApiKey: string;

  @Column({ type: 'jsonb', nullable: true })
  config?: Record<string, any>; // Additional configuration

  @Column({ default: false })
  isDefault: boolean; // Whether this is the default provider for the user

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}