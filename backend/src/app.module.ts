import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigurationModule } from './config/configuration.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { ProvidersModule } from './providers/providers.module';
import { WebsetsModule } from './websets/websets.module';
import { CitationsModule } from './citations/citations.module';
import { ExportModule } from './export/export.module';
import { HealthModule } from './health/health.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER || 'enrichify',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'enrichify',
      autoLoadEntities: true,
      synchronize: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        retryDelayOnFailover: 1000,
        maxLoadingAttempts: 3,
        connectTimeout: 60000,
        disconnectTimeout: 60000,
      },
    }),
    AuthModule,
    UsersModule,
    ConfigurationModule,
    RateLimitModule,
    ProvidersModule,
    WebsetsModule,
    CitationsModule,
    ExportModule,
    EnrichmentModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}