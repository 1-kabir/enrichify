import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Webset } from './webset.entity';
import { WebsetVersion } from './webset-version.entity';
import { WebsetCitation } from './webset-citation.entity';

@Entity('webset_cells')
@Index(['websetId', 'row', 'column'], { unique: true })
export class WebsetCell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  websetId: string;

  @ManyToOne(() => Webset, (webset) => webset.cells)
  @JoinColumn({ name: 'websetId' })
  webset: Webset;

  @Column('uuid', { nullable: true })
  versionId: string;

  @ManyToOne(() => WebsetVersion)
  @JoinColumn({ name: 'versionId' })
  version: WebsetVersion;

  @Column({ type: 'int' })
  row: number;

  @Column()
  column: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ type: 'float', nullable: true, default: 1.0 })
  confidenceScore: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @OneToMany(() => WebsetCitation, (citation) => citation.cell)
  citations: WebsetCitation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
