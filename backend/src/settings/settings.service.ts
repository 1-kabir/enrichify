import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProviderConfig } from '../entities/user-provider-config.entity';
import { LLMProvider } from '../entities/llm-provider.entity';
import { SearchProvider } from '../entities/search-provider.entity';

export interface CreateProviderConfigDto {
  systemLlmProviderId?: string;
  systemSearchProviderId?: string;
  providerName: string; // Custom name for user's provider config
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
  defaultLlmProviderConfigId?: string;
  defaultSearchProviderConfigId?: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProviderConfig)
    private userProviderConfigRepository: Repository<UserProviderConfig>,
    @InjectRepository(LLMProvider)
    private llmProviderRepository: Repository<LLMProvider>,
    @InjectRepository(SearchProvider)
    private searchProviderRepository: Repository<SearchProvider>,
  ) {}

  async getUserProviders(userId: string) {
    // Get user's custom provider configurations
    const userConfigs = await this.userProviderConfigRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // Get available system providers that are available to users
    const availableLlmProviders = await this.llmProviderRepository.find({
      where: { isAvailableToUsers: true },
    });
    const availableSearchProviders = await this.searchProviderRepository.find({
      where: { isAvailableToUsers: true },
    });

    // Combine system providers with user's custom configurations
    const result = {
      systemProviders: {
        llm: availableLlmProviders.map(provider => ({
          id: provider.id,
          name: provider.name,
          type: provider.type,
          hasAdminKey: !!provider.apiKey, // Indicates if admin has configured a key
          canUserProvideKey: provider.canUserProvideKey,
          isDefaultForUsers: provider.isDefaultForUsers,
        })),
        search: availableSearchProviders.map(provider => ({
          id: provider.id,
          name: provider.name,
          type: provider.type,
          hasAdminKey: !!provider.apiKey, // Indicates if admin has configured a key
          canUserProvideKey: provider.canUserProvideKey,
          isDefaultForUsers: provider.isDefaultForUsers,
        })),
      },
      userConfigs: userConfigs.map(config => ({
        id: config.id,
        providerName: config.providerName,
        systemLlmProviderId: config.systemLlmProviderId,
        systemSearchProviderId: config.systemSearchProviderId,
        hasUserKey: !!config.encryptedApiKey, // Indicates if user has provided a key
        isDefault: config.isDefault,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }))
    };

    return result;
  }

  async createProviderConfig(userId: string, dto: CreateProviderConfigDto) {
    // Validate that either systemLlmProviderId or systemSearchProviderId is provided
    if (!dto.systemLlmProviderId && !dto.systemSearchProviderId) {
      throw new BadRequestException('Either systemLlmProviderId or systemSearchProviderId must be provided');
    }

    if (dto.systemLlmProviderId && dto.systemSearchProviderId) {
      throw new BadRequestException('Only one of systemLlmProviderId or systemSearchProviderId can be provided');
    }

    // Validate the system provider exists and is available to users
    if (dto.systemLlmProviderId) {
      const llmProvider = await this.llmProviderRepository.findOne({
        where: { id: dto.systemLlmProviderId, isAvailableToUsers: true },
      });

      if (!llmProvider) {
        throw new BadRequestException('LLM provider not found or not available to users');
      }

      if (!llmProvider.canUserProvideKey) {
        throw new BadRequestException('Users are not allowed to provide keys for this provider');
      }
    } else if (dto.systemSearchProviderId) {
      const searchProvider = await this.searchProviderRepository.findOne({
        where: { id: dto.systemSearchProviderId, isAvailableToUsers: true },
      });

      if (!searchProvider) {
        throw new BadRequestException('Search provider not found or not available to users');
      }

      if (!searchProvider.canUserProvideKey) {
        throw new BadRequestException('Users are not allowed to provide keys for this provider');
      }
    }

    // If setting as default, unset other defaults of the same type
    if (dto.isDefault) {
      await this.unsetUserConfigDefaults(userId, dto.systemLlmProviderId ? 'llm' : 'search');
    }

    // Create the user provider config
    const config = this.userProviderConfigRepository.create({
      userId,
      systemLlmProviderId: dto.systemLlmProviderId,
      systemSearchProviderId: dto.systemSearchProviderId,
      providerName: dto.providerName,
      encryptedApiKey: this.encryptApiKey(dto.apiKey),
      config: dto.config,
      isDefault: dto.isDefault || false,
    });

    const savedConfig = await this.userProviderConfigRepository.save(config);

    // If this is the default, update the user record
    if (savedConfig.isDefault) {
      if (dto.systemLlmProviderId) {
        await this.userRepository.update(
          { id: userId }, 
          { defaultLlmProviderConfigId: savedConfig.id }
        );
      } else {
        await this.userRepository.update(
          { id: userId }, 
          { defaultSearchProviderConfigId: savedConfig.id }
        );
      }
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
        const providerType = config.systemLlmProviderId ? 'llm' : 'search';
        await this.unsetUserConfigDefaults(userId, providerType);
        config.isDefault = true;
      } else {
        config.isDefault = false;
      }
    }

    const updatedConfig = await this.userProviderConfigRepository.save(config);

    // Update user defaults if needed
    if (updatedConfig.isDefault) {
      if (config.systemLlmProviderId) {
        await this.userRepository.update(
          { id: userId }, 
          { defaultLlmProviderConfigId: updatedConfig.id }
        );
      } else {
        await this.userRepository.update(
          { id: userId }, 
          { defaultSearchProviderConfigId: updatedConfig.id }
        );
      }
    } else if (!dto.isDefault && config.isDefault) {
      // If we're unsetting the default, clear it from the user record
      if (config.systemLlmProviderId) {
        await this.userRepository.update(
          { id: userId }, 
          { defaultLlmProviderConfigId: null }
        );
      } else {
        await this.userRepository.update(
          { id: userId }, 
          { defaultSearchProviderConfigId: null }
        );
      }
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
      if (config.systemLlmProviderId) {
        await this.userRepository.update(
          { id: userId }, 
          { defaultLlmProviderConfigId: null }
        );
      } else {
        await this.userRepository.update(
          { id: userId }, 
          { defaultSearchProviderConfigId: null }
        );
      }
    }

    await this.userProviderConfigRepository.remove(config);
  }

  async getUserDefaultProviders(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id', 
        'defaultLlmProviderId', 
        'defaultSearchProviderId',
        'defaultLlmProviderConfigId',
        'defaultSearchProviderConfigId'
      ],
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return {
      defaultLlmProviderId: user.defaultLlmProviderId, // Points to system provider
      defaultSearchProviderId: user.defaultSearchProviderId, // Points to system provider
      defaultLlmProviderConfigId: user.defaultLlmProviderConfigId, // Points to user config
      defaultSearchProviderConfigId: user.defaultSearchProviderConfigId, // Points to user config
    };
  }

  async updateUserDefaultProviders(userId: string, dto: UpdateDefaultProvidersDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    // Handle default LLM provider config (user's custom key)
    if (dto.defaultLlmProviderConfigId) {
      const llmConfig = await this.userProviderConfigRepository.findOne({
        where: { id: dto.defaultLlmProviderConfigId, userId },
      });

      if (!llmConfig) {
        throw new BadRequestException(`LLM provider configuration not found or does not belong to user`);
      }

      user.defaultLlmProviderConfigId = dto.defaultLlmProviderConfigId;
    }

    // Handle default Search provider config (user's custom key)
    if (dto.defaultSearchProviderConfigId) {
      const searchConfig = await this.userProviderConfigRepository.findOne({
        where: { id: dto.defaultSearchProviderConfigId, userId },
      });

      if (!searchConfig) {
        throw new BadRequestException(`Search provider configuration not found or does not belong to user`);
      }

      user.defaultSearchProviderConfigId = dto.defaultSearchProviderConfigId;
    }

    return this.userRepository.save(user);
  }

  // Method to get system providers (for admin use)
  async getSystemProviders() {
    const llmProviders = await this.llmProviderRepository.find();
    const searchProviders = await this.searchProviderRepository.find();

    return {
      llm: llmProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        isActive: provider.isActive,
        isAvailableToUsers: provider.isAvailableToUsers,
        canUserProvideKey: provider.canUserProvideKey,
        isDefaultForUsers: provider.isDefaultForUsers,
        hasApiKey: !!provider.apiKey,
      })),
      search: searchProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        isActive: provider.isActive,
        isAvailableToUsers: provider.isAvailableToUsers,
        canUserProvideKey: provider.canUserProvideKey,
        isDefaultForUsers: provider.isDefaultForUsers,
        hasApiKey: !!provider.apiKey,
      })),
    };
  }

  // Method to update system provider settings (for admin use)
  async updateSystemProvider(providerType: 'llm' | 'search', providerId: string, settings: {
    isAvailableToUsers?: boolean;
    canUserProvideKey?: boolean;
    isDefaultForUsers?: boolean;
  }) {
    if (providerType === 'llm') {
      const provider = await this.llmProviderRepository.findOne({ where: { id: providerId } });
      if (!provider) {
        throw new NotFoundException(`LLM provider with ID ${providerId} not found`);
      }

      if (settings.isAvailableToUsers !== undefined) provider.isAvailableToUsers = settings.isAvailableToUsers;
      if (settings.canUserProvideKey !== undefined) provider.canUserProvideKey = settings.canUserProvideKey;
      if (settings.isDefaultForUsers !== undefined) provider.isDefaultForUsers = settings.isDefaultForUsers;

      return this.llmProviderRepository.save(provider);
    } else {
      const provider = await this.searchProviderRepository.findOne({ where: { id: providerId } });
      if (!provider) {
        throw new NotFoundException(`Search provider with ID ${providerId} not found`);
      }

      if (settings.isAvailableToUsers !== undefined) provider.isAvailableToUsers = settings.isAvailableToUsers;
      if (settings.canUserProvideKey !== undefined) provider.canUserProvideKey = settings.canUserProvideKey;
      if (settings.isDefaultForUsers !== undefined) provider.isDefaultForUsers = settings.isDefaultForUsers;

      return this.searchProviderRepository.save(provider);
    }
  }

  private async unsetUserConfigDefaults(userId: string, providerType: 'llm' | 'search') {
    if (providerType === 'llm') {
      await this.userProviderConfigRepository.update(
        { userId, systemLlmProviderId: Not(IsNull()) },
        { isDefault: false },
      );
    } else {
      await this.userProviderConfigRepository.update(
        { userId, systemSearchProviderId: Not(IsNull()) },
        { isDefault: false },
      );
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