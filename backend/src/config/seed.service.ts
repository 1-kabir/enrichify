import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { LLMProvider, LLMProviderType } from '../entities/llm-provider.entity';
import { SearchProvider, SearchProviderType } from '../entities/search-provider.entity';
import { AuthUtils } from '../utils/auth.utils';

/**
 * Service to seed initial data (admin user and providers) on app startup
 */
@Injectable()
export class SeedService implements OnModuleInit {
    private logger = new Logger('SeedService');

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(LLMProvider)
        private llmProviderRepository: Repository<LLMProvider>,
        @InjectRepository(SearchProvider)
        private searchProviderRepository: Repository<SearchProvider>,
    ) { }

    async onModuleInit() {
        await this.createAdminUser();
        await this.seedLLMProviders();
        await this.seedSearchProviders();
    }

    private async createAdminUser() {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminEmail || !adminPassword) {
            return;
        }

        try {
            const existingAdmin = await this.userRepository.findOne({
                where: [{ username: adminUsername }, { email: adminEmail }],
            });

            if (existingAdmin) {
                this.logger.log(`Admin user "${adminUsername}" already exists. Skipping creation.`);
                return;
            }

            const hashedPassword = await AuthUtils.hashPassword(adminPassword);
            const admin = this.userRepository.create({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                role: UserRole.ADMIN,
                isActive: true,
            });

            await this.userRepository.save(admin);
            this.logger.log(`✓ Created admin user: "${adminUsername}" (${adminEmail})`);
        } catch (error) {
            this.logger.error(`Failed to create admin user: ${error.message}`);
        }
    }

    private async seedLLMProviders() {
        const providers = [
            { env: 'OPENAI_API_KEY', type: LLMProviderType.OPENAI, name: 'OpenAI' },
            { env: 'ANTHROPIC_API_KEY', type: LLMProviderType.CLAUDE, name: 'Anthropic' },
            { env: 'GOOGLE_API_KEY', type: LLMProviderType.GEMINI, name: 'Google Gemini' },
            { env: 'GROQ_API_KEY', type: LLMProviderType.GROQ, name: 'Groq' },
            { env: 'OPENROUTER_API_KEY', type: LLMProviderType.OPENROUTER, name: 'OpenRouter' },
            { env: 'MISTRAL_API_KEY', type: LLMProviderType.MISTRAL, name: 'Mistral' },
        ];

        for (const p of providers) {
            const apiKey = process.env[p.env];
            if (apiKey) {
                const existing = await this.llmProviderRepository.findOne({ where: { type: p.type } });
                if (!existing) {
                    const provider = this.llmProviderRepository.create({
                        name: p.name,
                        type: p.type,
                        apiKey,
                        isActive: true,
                    });
                    await this.llmProviderRepository.save(provider);
                    this.logger.log(`✓ Seeded LLM Provider: ${p.name}`);
                }
            }
        }
    }

    private async seedSearchProviders() {
        const providers = [
            { env: 'EXA_API_KEY', type: SearchProviderType.EXA, name: 'Exa' },
            { env: 'BRAVE_API_KEY', type: SearchProviderType.BRAVE, name: 'Brave Search' },
            { env: 'TAVILY_API_KEY', type: SearchProviderType.TAVILY, name: 'Tavily' },
            { env: 'SERPER_API_KEY', type: SearchProviderType.SERPER, name: 'Serper' },
        ];

        for (const p of providers) {
            const apiKey = process.env[p.env];
            if (apiKey) {
                const existing = await this.searchProviderRepository.findOne({ where: { type: p.type } });
                if (!existing) {
                    const provider = this.searchProviderRepository.create({
                        name: p.name,
                        type: p.type,
                        apiKey,
                        isActive: true,
                    });
                    await this.searchProviderRepository.save(provider);
                    this.logger.log(`✓ Seeded Search Provider: ${p.name}`);
                }
            }
        }
    }
}
