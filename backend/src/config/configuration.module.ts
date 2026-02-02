import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationService } from './configuration.service';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [ConfigurationService, SeedService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
