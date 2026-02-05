import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Webset } from '../entities/webset.entity';
import { User } from '../entities/user.entity';

export enum EnrichmentJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

@Entity('enrichment_job_history')
export class EnrichmentJobHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  websetId: string;

  @ManyToOne(() => Webset, (webset) => webset.id)
  @JoinColumn({ name: 'websetId' })
  webset: Webset;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  jobId: string; // The BullMQ job ID

  @Column({
    type: 'enum',
    enum: EnrichmentJobStatus,
    default: EnrichmentJobStatus.PENDING,
  })
  status: EnrichmentJobStatus;

  @Column({ type: 'jsonb', nullable: true })
  parameters?: Record<string, any>; // Job parameters

  @Column({ type: 'jsonb', nullable: true })
  summary?: Record<string, any>; // Job summary statistics

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'int', nullable: true })
  totalRows?: number;

  @Column({ type: 'int', nullable: true })
  processedRows?: number;

  @Column({ type: 'int', nullable: true })
  failedRows?: number;

  @Column({ type: 'text', nullable: true })
  llmProviderId?: string;

  @Column({ type: 'text', nullable: true })
  searchProviderId?: string;

  @Column({ type: 'text', nullable: true })
  targetColumn?: string;

  @CreateDateColumn()
  startTime: Date;

  @UpdateDateColumn()
  endTime: Date;

  @Column({ type: 'float', nullable: true })
  durationSeconds?: number; // Duration in seconds

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Additional metadata
}