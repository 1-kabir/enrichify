import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { WebsetCell } from './webset-cell.entity';
import { SearchProvider } from './search-provider.entity';

@Entity('webset_citations')
export class WebsetCitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    cellId: string;

    @ManyToOne(() => WebsetCell, (cell) => cell.citations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cellId' })
    cell: WebsetCell;

    @Column()
    url: string;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    contentSnippet: string;

    @Column('uuid', { nullable: true })
    searchProviderId: string;

    @ManyToOne(() => SearchProvider)
    @JoinColumn({ name: 'searchProviderId' })
    searchProvider: SearchProvider;

    @CreateDateColumn()
    createdAt: Date;
}
