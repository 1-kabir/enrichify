import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { UserApiKey } from './user-api-key.entity';
import { Webset } from './webset.entity';
import { UserProviderConfig } from './user-provider-config.entity';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    // Default provider relationships
    @Column({ nullable: true })
    defaultLlmProviderId: string;

    @Column({ nullable: true })
    defaultSearchProviderId: string;

    // New fields for user provider config defaults
    @Column({ nullable: true })
    defaultLlmProviderConfigId: string;

    @Column({ nullable: true })
    defaultSearchProviderConfigId: string;

    @OneToMany(() => UserApiKey, (apiKey) => apiKey.user)
    apiKeys: UserApiKey[];

    @OneToMany(() => Webset, (webset) => webset.user, { cascade: true })
    websets: Webset[];

    @OneToMany(() => UserProviderConfig, (config) => config.user)
    providerConfigs: UserProviderConfig[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
