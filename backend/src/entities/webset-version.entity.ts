import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Webset } from './webset.entity';
import { User } from './user.entity';

@Entity('webset_versions')
export class WebsetVersion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    websetId: string;

    @ManyToOne(() => Webset, (webset) => webset.versions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'websetId' })
    webset: Webset;

    @Column({ type: 'int' })
    version: number;

    @Column({ type: 'jsonb' })
    data: any;

    @Column('uuid')
    changedBy: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'changedBy' })
    user: User;

    @Column({ nullable: true })
    changeDescription: string;

    @CreateDateColumn()
    createdAt: Date;
}
