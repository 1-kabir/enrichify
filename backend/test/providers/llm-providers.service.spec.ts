import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMProvidersService } from '../../src/providers/llm/llm-providers.service';
import { LLMProvider, LLMProviderType } from '../../src/entities/llm-provider.entity';
import { RateLimitService } from '../../src/rate-limit/rate-limit.service';

describe('LLMProvidersService', () => {
  let service: LLMProvidersService;
  let repository: Repository<LLMProvider>;
  let rateLimitService: RateLimitService;

  const mockProvider: LLMProvider = {
    id: '123',
    name: 'Test Provider',
    type: LLMProviderType.OPENAI,
    endpoint: null,
    apiKey: 'test-key',
    isActive: true,
    config: {},
    rateLimit: 60,
    dailyLimit: 1000,
    usages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LLMProvidersService,
        {
          provide: getRepositoryToken(LLMProvider),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: RateLimitService,
          useValue: {
            checkRateLimit: jest.fn(),
            trackUsage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LLMProvidersService>(LLMProvidersService);
    repository = module.get<Repository<LLMProvider>>(getRepositoryToken(LLMProvider));
    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a provider', async () => {
      const dto = {
        name: 'Test Provider',
        type: LLMProviderType.OPENAI,
        apiKey: 'test-key',
        isActive: true,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockProvider);
      jest.spyOn(repository, 'save').mockResolvedValue(mockProvider);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProvider);
    });
  });

  describe('findAll', () => {
    it('should return all providers', async () => {
      const providers = [mockProvider];
      jest.spyOn(repository, 'find').mockResolvedValue(providers);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(providers);
    });
  });

  describe('findActive', () => {
    it('should return only active providers', async () => {
      const providers = [mockProvider];
      jest.spyOn(repository, 'find').mockResolvedValue(providers);

      const result = await service.findActive();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(providers);
    });
  });

  describe('findOne', () => {
    it('should return a provider by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProvider);

      const result = await service.findOne('123');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
      expect(result).toEqual(mockProvider);
    });

    it('should throw error if provider not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow('Provider not found');
    });
  });

  describe('update', () => {
    it('should update a provider', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedProvider = { ...mockProvider, name: 'Updated Name' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProvider);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedProvider);

      const result = await service.update('123', updateDto);

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should remove a provider', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProvider);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockProvider);

      await service.remove('123');

      expect(repository.remove).toHaveBeenCalledWith(mockProvider);
    });
  });
});
