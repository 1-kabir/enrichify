import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

export interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  providers?: {
    llm?: Array<{
      name: string;
      type: string;
      endpoint?: string;
      apiKey?: string;
      isActive?: boolean;
      config?: Record<string, any>;
      rateLimit?: number;
      dailyLimit?: number;
    }>;
    search?: Array<{
      name: string;
      type: string;
      endpoint?: string;
      apiKey?: string;
      isActive?: boolean;
      config?: Record<string, any>;
      rateLimit?: number;
      dailyLimit?: number;
    }>;
  };
}

@Injectable()
export class ConfigurationService {
  private yamlConfig: any;

  constructor(private nestConfig: NestConfigService) {
    this.loadYamlConfig();
  }

  private loadYamlConfig(): void {
    try {
      const configPath = path.join(process.cwd(), 'config.yml');
      if (fs.existsSync(configPath)) {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        this.yamlConfig = yaml.load(fileContents) as Record<string, any>;
      } else {
        this.yamlConfig = {};
      }
    } catch (error) {
      console.warn('Failed to load config.yml, using ENV variables only:', error.message);
      this.yamlConfig = {};
    }
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const envValue = this.nestConfig.get<T>(key);
    if (envValue !== undefined && envValue !== null) {
      return envValue;
    }

    const yamlValue = this.getNestedValue(this.yamlConfig, key);
    if (yamlValue !== undefined && yamlValue !== null) {
      return yamlValue;
    }

    return defaultValue;
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  getAppConfig(): AppConfig {
    return {
      port: parseInt(this.get('PORT', '3000'), 10),
      database: {
        host: this.get('DATABASE_HOST', 'localhost'),
        port: parseInt(this.get('DATABASE_PORT', '5432'), 10),
        username: this.get('DATABASE_USER', 'enrichify'),
        password: this.get('DATABASE_PASSWORD', 'password'),
        database: this.get('DATABASE_NAME', 'enrichify'),
      },
      redis: {
        host: this.get('REDIS_HOST', 'localhost'),
        port: parseInt(this.get('REDIS_PORT', '6379'), 10),
      },
      jwt: {
        secret: this.get('JWT_SECRET', 'your-secret-key'),
        expiresIn: this.get('JWT_EXPIRES_IN', '7d'),
      },
      providers: this.get('providers'),
    };
  }
}
