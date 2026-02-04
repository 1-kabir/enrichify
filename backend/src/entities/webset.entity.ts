import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { WebsetVersion } from './webset-version.entity';
import { WebsetCell } from './webset-cell.entity';
import { WebsetExport } from './webset-export.entity';

export enum WebsetStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    ARCHIVED = 'archived',
}

export interface ColumnDefinition {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: string;
}

@Entity('websets')
export class Webset {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column('uuid')
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'jsonb' })
    columnDefinitions: ColumnDefinition[];

    @Column({
        type: 'enum',
        enum: WebsetStatus,
        default: WebsetStatus.DRAFT,
    })
    status: WebsetStatus;

    @Column({ type: 'int', default: 1 })
    currentVersion: number;

    @Column({ type: 'int', default: 0 })
    rowCount: number;

    @OneToMany(() => WebsetVersion, (version) => version.webset, { cascade: true })
    versions: WebsetVersion[];

    @OneToMany(() => WebsetCell, (cell) => cell.webset, { cascade: true })
    cells: WebsetCell[];

    @OneToMany(() => WebsetExport, (exportRecord) => exportRecord.webset, { cascade: true })
    exports: WebsetExport[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
