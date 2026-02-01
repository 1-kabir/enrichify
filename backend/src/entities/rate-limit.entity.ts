import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RateLimitScope {
  USER = 'user',
  GLOBAL = 'global',
}

@Entity('rate_limits')
export class RateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RateLimitScope,
  })
  scope: RateLimitScope;

  @Column({ nullable: true })
  userId: string;

  @Column()
  endpoint: string;

  @Column({ type: 'int' })
  maxRequests: number;

  @Column({ type: 'int' })
  windowMs: number;

  @Column({ type: 'int', default: 0 })
  currentCount: number;

  @Column({ type: 'timestamp', nullable: true })
  windowStart: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
