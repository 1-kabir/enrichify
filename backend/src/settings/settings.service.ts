import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProviderConfig, ProviderType } from '../entities/user-provider-config.entity';
import { LLMProvidersService } from '../providers/llm/llm-providers.service';
import { SearchProvidersService } from '../providers/search/search-providers.service';
import { LLMProvider } from '../entities/llm-provider.entity';
import { SearchProvider } from '../entities/search-provider.entity';

export interface CreateProviderConfigDto {
  providerType: ProviderType;
  providerId: string; // ID of the provider in the LLM or Search provider table
  providerName: string;
  apiKey: string;
  config?: Record<string, any>;
  isDefault?: boolean;
}

export interface UpdateProviderConfigDto {
  providerName?: string;
  apiKey?: string;
  config?: Record<string, any>;
  isDefault?: boolean;
}

export interface UpdateDefaultProvidersDto {
  defaultLlmProviderId?: string;
  defaultSearchProviderId?: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProviderConfig)
    private userProviderConfigRepository: Repository<UserProviderConfig>,
    private llmProvidersService: LLMProvidersService,
    private searchProvidersService: SearchProvidersService,
  ) {}

  async getUserProviders(userId: string) {
    const configs = await this.userProviderConfigRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // Get the provider details for each config
    const providerDetails = await Promise.all(
      configs.map(async (config) => {
        let provider: LLMProvider | SearchProvider;
        
        if (config.providerType === ProviderType.LLM) {
          provider = await this.llmProvidersService.findOne(config.providerId);
        } else {
          provider = await this.searchProvidersService.findOne(config.providerId);
        }

        return {
          id: config.id,
          providerType: config.providerType,
          providerId: config.providerId,
          providerName: config.providerName,
          providerDisplayName: provider?.name || 'Unknown Provider',
          isDefault: config.isDefault,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        };
      }),
    );

    return providerDetails;
  }

  async createProviderConfig(userId: string, dto: CreateProviderConfigDto) {
    // Verify the provider exists
    if (dto.providerType === ProviderType.LLM) {
      await this.llmProvidersService.findOne(dto.providerId);
    } else {
      await this.searchProvidersService.findOne(dto.providerId);
    }

    // If setting as default, unset other defaults of the same type
    if (dto.isDefault) {
      await this.unsetDefaultsForType(userId, dto.providerType);
    }

    // Create the user provider config
    const config = this.userProviderConfigRepository.create({
      userId,
      providerType: dto.providerType,
      providerId: dto.providerId,
      providerName: dto.providerName,
      encryptedApiKey: this.encryptApiKey(dto.apiKey), // In a real app, implement proper encryption
      config: dto.config,
      isDefault: dto.isDefault || false,
    });

    const savedConfig = await this.userProviderConfigRepository.save(config);

    // If this is the default, update the user record
    if (savedConfig.isDefault) {
      await this.updateUserDefaultProvider(userId, dto.providerType, savedConfig.id);
    }

    return savedConfig;
  }

  async updateProviderConfig(userId: string, configId: string, dto: UpdateProviderConfigDto) {
    const config = await this.userProviderConfigRepository.findOne({
      where: { id: configId, userId },
    });

    if (!config) {
      throw new NotFoundException(`Provider configuration not found`);
    }

    // Update fields if provided
    if (dto.providerName) {
      config.providerName = dto.providerName;
    }

    if (dto.apiKey) {
      config.encryptedApiKey = this.encryptApiKey(dto.apiKey);
    }

    if (dto.config !== undefined) {
      config.config = dto.config;
    }

    if (dto.isDefault !== undefined) {
      if (dto.isDefault) {
        // Unset other defaults of the same type
        await this.unsetDefaultsForType(userId, config.providerType);
        config.isDefault = true;
      } else {
        config.isDefault = false;
      }
    }

    const updatedConfig = await this.userProviderConfigRepository.save(config);

    // Update user defaults if needed
    if (updatedConfig.isDefault) {
      await this.updateUserDefaultProvider(userId, config.providerType, updatedConfig.id);
    } else if (!dto.isDefault && config.isDefault) {
      // If we're unsetting the default, clear it from the user record
      await this.clearUserDefaultProvider(userId, config.providerType);
    }

    return updatedConfig;
  }

  async deleteProviderConfig(userId: string, configId: string) {
    const config = await this.userProviderConfigRepository.findOne({
      where: { id: configId, userId },
    });

    if (!config) {
      throw new NotFoundException(`Provider configuration not found`);
    }

    // If this was the default, clear it from the user record
    if (config.isDefault) {
      await this.clearUserDefaultProvider(userId, config.providerType);
    }

    await this.userProviderConfigRepository.remove(config);
  }

  async getUserDefaultProviders(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'defaultLlmProviderId', 'defaultSearchProviderId'],
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return {
      defaultLlmProviderId: user.defaultLlmProviderId,
      defaultSearchProviderId: user.defaultSearchProviderId,
    };
  }

  async updateUserDefaultProviders(userId: string, dto: UpdateDefaultProvidersDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    // Validate and update default LLM provider if provided
    if (dto.defaultLlmProviderId) {
      const llmConfig = await this.userProviderConfigRepository.findOne({
        where: { id: dto.defaultLlmProviderId, userId, providerType: ProviderType.LLM },
      });

      if (!llmConfig) {
        throw new BadRequestException(`LLM provider configuration not found or does not belong to user`);
      }

      user.defaultLlmProviderId = dto.defaultLlmProviderId;
    }

    // Validate and update default Search provider if provided
    if (dto.defaultSearchProviderId) {
      const searchConfig = await this.userProviderConfigRepository.findOne({
        where: { id: dto.defaultSearchProviderId, userId, providerType: ProviderType.SEARCH },
      });

      if (!searchConfig) {
        throw new BadRequestException(`Search provider configuration not found or does not belong to user`);
      }

      user.defaultSearchProviderId = dto.defaultSearchProviderId;
    }

    return this.userRepository.save(user);
  }

  private async unsetDefaultsForType(userId: string, providerType: ProviderType) {
    await this.userProviderConfigRepository.update(
      { userId, providerType, isDefault: true },
      { isDefault: false },
    );
  }

  private async updateUserDefaultProvider(userId: string, providerType: ProviderType, configId: string) {
    if (providerType === ProviderType.LLM) {
      await this.userRepository.update({ id: userId }, { defaultLlmProviderId: configId });
    } else {
      await this.userRepository.update({ id: userId }, { defaultSearchProviderId: configId });
    }
  }

  private async clearUserDefaultProvider(userId: string, providerType: ProviderType) {
    if (providerType === ProviderType.LLM) {
      await this.userRepository.update({ id: userId }, { defaultLlmProviderId: null });
    } else {
      await this.userRepository.update({ id: userId }, { defaultSearchProviderId: null });
    }
  }

  private encryptApiKey(apiKey: string): string {
    // In a real application, implement proper encryption
    // For now, just return the API key as-is (not recommended for production)
    return apiKey;
  }

  private decryptApiKey(encryptedApiKey: string): string {
    // In a real application, implement proper decryption
    // For now, just return the encrypted key as-is (not recommended for production)
    return encryptedApiKey;
  }
}