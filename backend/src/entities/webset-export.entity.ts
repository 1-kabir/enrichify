import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Webset } from './webset.entity';
import { User } from './user.entity';

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  GSHEET = 'gsheet',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('webset_exports')
export class WebsetExport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  websetId: string;

  @ManyToOne(() => Webset, (webset) => webset.exports)
  @JoinColumn({ name: 'websetId' })
  webset: Webset;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({ nullable: true })
  exportUrl: string;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
