import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationService } from './configuration.service';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';
import { LLMProvider } from '../entities/llm-provider.entity';
import { SearchProvider } from '../entities/search-provider.entity';

@Global()
@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([User, LLMProvider, SearchProvider])],
    providers: [ConfigurationService, SeedService],
    exports: [ConfigurationService],
})
export class ConfigurationModule { }
