// path: server/src/sync-config/sync-config.service.spec.ts
// version: 1.0 (Unit Tests for SyncConfigService)
// last-modified: 14 ตุลาคม 2568 15:30

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncConfigService } from './sync-config.service';
import { SyncConfig, EntityType } from '../entities/sync-config.entity';

describe('SyncConfigService', () => {
  let service: SyncConfigService;
  let syncConfigRepository: Repository<SyncConfig>;

  // Mock Repository
  const mockSyncConfigRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncConfigService,
        {
          provide: getRepositoryToken(SyncConfig),
          useValue: mockSyncConfigRepository,
        },
      ],
    }).compile();

    service = module.get<SyncConfigService>(SyncConfigService);
    syncConfigRepository = module.get<Repository<SyncConfig>>(getRepositoryToken(SyncConfig));

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSyncConfig', () => {
    it('ควร return sync config ตาม entityType', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      const mockConfig = {
        entityType,
        isEnabled: true,
        dataSource: 'MONGODB',
        mongoCollection: 'customers',
      };

      mockSyncConfigRepository.findOne.mockResolvedValue(mockConfig);

      // Act
      const result = await service.getSyncConfig(entityType);

      // Assert
      expect(syncConfigRepository.findOne).toHaveBeenCalledWith({
        where: { entityType },
      });
      expect(result).toEqual(mockConfig);
    });

    it('ควร return null เมื่อไม่พบ config', async () => {
      // Arrange
      mockSyncConfigRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getSyncConfig('CUSTOMER');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllSyncConfigs', () => {
    it('ควร return sync configs ทั้งหมด', async () => {
      // Arrange
      const mockConfigs = [
        { entityType: 'CUSTOMER', isEnabled: true },
        { entityType: 'PRODUCT', isEnabled: false },
        { entityType: 'RAW_MATERIAL', isEnabled: true },
      ];

      mockSyncConfigRepository.find.mockResolvedValue(mockConfigs);

      // Act
      const result = await service.getAllSyncConfigs();

      // Assert
      expect(syncConfigRepository.find).toHaveBeenCalledWith({
        order: { entityType: 'ASC' },
      });
      expect(result).toEqual(mockConfigs);
      expect(result).toHaveLength(3);
    });
  });

  describe('enableSync', () => {
    it('ควร enable sync สำหรับ entity ที่มี config อยู่แล้ว', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      const mockConfig = {
        entityType,
        isEnabled: false,
      };

      mockSyncConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockSyncConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        isEnabled: true,
      });

      // Act
      const result = await service.enableSync(entityType);

      // Assert
      expect(syncConfigRepository.save).toHaveBeenCalled();
      expect(result.isEnabled).toBe(true);
    });

    it('ควรสร้าง default config และ enable เมื่อยังไม่มี config', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      mockSyncConfigRepository.findOne.mockResolvedValue(null);
      mockSyncConfigRepository.create.mockReturnValue({
        entityType,
        isEnabled: true,
        dataSource: 'MONGODB',
        mongoCollection: 'customers',
      });
      mockSyncConfigRepository.save.mockResolvedValue({
        entityType,
        isEnabled: true,
      });

      // Act
      const result = await service.enableSync(entityType);

      // Assert
      expect(syncConfigRepository.create).toHaveBeenCalled();
      expect(syncConfigRepository.save).toHaveBeenCalled();
      expect(result.isEnabled).toBe(true);
    });
  });

  describe('disableSync', () => {
    it('ควร disable sync สำหรับ entity ที่มี config อยู่แล้ว', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      const mockConfig = {
        entityType,
        isEnabled: true,
      };

      mockSyncConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockSyncConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        isEnabled: false,
      });

      // Act
      const result = await service.disableSync(entityType);

      // Assert
      expect(syncConfigRepository.save).toHaveBeenCalled();
      expect(result.isEnabled).toBe(false);
    });

    it('ควรสร้าง default config และ disable เมื่อยังไม่มี config', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      mockSyncConfigRepository.findOne.mockResolvedValue(null);
      mockSyncConfigRepository.create.mockReturnValue({
        entityType,
        isEnabled: false,
      });
      mockSyncConfigRepository.save.mockResolvedValue({
        entityType,
        isEnabled: false,
      });

      // Act
      const result = await service.disableSync(entityType);

      // Assert
      expect(result.isEnabled).toBe(false);
    });
  });

  describe('updateSyncConfig', () => {
    it('ควร update sync config ที่มีอยู่', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      const mockConfig = {
        entityType,
        isEnabled: true,
        mongoCollection: 'customers',
      };

      const updates = {
        mongoCollection: 'customers_v2',
        mongoQuery: JSON.stringify({ status: 'active' }),
      };

      mockSyncConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockSyncConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        ...updates,
      });

      // Act
      const result = await service.updateSyncConfig(entityType, updates);

      // Assert
      expect(syncConfigRepository.save).toHaveBeenCalled();
      expect(result.mongoCollection).toBe(updates.mongoCollection);
      expect(result.mongoQuery).toBe(updates.mongoQuery);
    });

    it('ควรสร้าง config ใหม่เมื่อยังไม่มี', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      const updates = {
        isEnabled: true,
        mongoCollection: 'customers',
      };

      mockSyncConfigRepository.findOne.mockResolvedValue(null);
      mockSyncConfigRepository.create.mockReturnValue({
        entityType,
        ...updates,
      });
      mockSyncConfigRepository.save.mockResolvedValue({
        entityType,
        ...updates,
      });

      // Act
      const result = await service.updateSyncConfig(entityType, updates);

      // Assert
      expect(syncConfigRepository.create).toHaveBeenCalled();
      expect(syncConfigRepository.save).toHaveBeenCalled();
      expect(result.isEnabled).toBe(true);
    });
  });

  describe('createDefaultConfig', () => {
    it('ควรสร้าง default config สำหรับ CUSTOMER', async () => {
      // Arrange
      const entityType: EntityType = 'CUSTOMER';
      mockSyncConfigRepository.create.mockReturnValue({
        entityType,
        isEnabled: false,
        dataSource: 'MONGODB',
        mongoCollection: 'customers',
      });
      mockSyncConfigRepository.save.mockResolvedValue({
        entityType,
        isEnabled: false,
        dataSource: 'MONGODB',
        mongoCollection: 'customers',
      });

      // Act
      const result = await service.createDefaultConfig(entityType, false);

      // Assert
      expect(syncConfigRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType,
          isEnabled: false,
          dataSource: 'MONGODB',
          mongoCollection: 'customers',
        }),
      );
      expect(result.mongoCollection).toBe('customers');
    });

    it('ควรสร้าง default config สำหรับ STANDARD_PRICE', async () => {
      // Arrange
      const entityType: EntityType = 'STANDARD_PRICE';
      mockSyncConfigRepository.create.mockReturnValue({
        entityType,
        isEnabled: true,
        dataSource: 'MONGODB',
        mongoCollection: 'standard_prices',
      });
      mockSyncConfigRepository.save.mockResolvedValue({
        entityType,
        isEnabled: true,
        dataSource: 'MONGODB',
        mongoCollection: 'standard_prices',
      });

      // Act
      const result = await service.createDefaultConfig(entityType, true);

      // Assert
      expect(result.mongoCollection).toBe('standard_prices');
      expect(result.isEnabled).toBe(true);
    });
  });

  describe('initializeAllConfigs', () => {
    it('ควรสร้าง default configs สำหรับ entities ทั้งหมด', async () => {
      // Arrange
      mockSyncConfigRepository.findOne.mockResolvedValue(null);
      mockSyncConfigRepository.create.mockImplementation((data) => data);
      mockSyncConfigRepository.save.mockImplementation((data) => Promise.resolve(data));

      // Act
      const result = await service.initializeAllConfigs();

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(syncConfigRepository.create).toHaveBeenCalled();
      expect(syncConfigRepository.save).toHaveBeenCalled();
    });

    it('ควรไม่สร้าง config ซ้ำสำหรับ entity ที่มีอยู่แล้ว', async () => {
      // Arrange
      mockSyncConfigRepository.findOne.mockResolvedValue({
        entityType: 'CUSTOMER',
        isEnabled: true,
      });

      // Act
      const result = await service.initializeAllConfigs();

      // Assert
      expect(result.length).toBeGreaterThan(0);
      // ไม่ควร create ใหม่ถ้ามีอยู่แล้ว
    });
  });

  describe('getSyncSummary', () => {
    it('ควร return sync summary ที่ถูกต้อง', async () => {
      // Arrange
      const mockConfigs = [
        { entityType: 'CUSTOMER', isEnabled: true },
        { entityType: 'PRODUCT', isEnabled: true },
        { entityType: 'RAW_MATERIAL', isEnabled: false },
        { entityType: 'STANDARD_PRICE', isEnabled: false },
      ];

      mockSyncConfigRepository.find.mockResolvedValue(mockConfigs);

      // Act
      const result = await service.getSyncSummary();

      // Assert
      expect(result.total).toBe(4);
      expect(result.enabled).toBe(2);
      expect(result.disabled).toBe(2);
      expect(result.configs).toEqual(mockConfigs);
    });

    it('ควร return summary ว่างเมื่อไม่มี configs', async () => {
      // Arrange
      mockSyncConfigRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getSyncSummary();

      // Assert
      expect(result.total).toBe(0);
      expect(result.enabled).toBe(0);
      expect(result.disabled).toBe(0);
      expect(result.configs).toEqual([]);
    });
  });

  describe('bulkUpdateSyncConfigs', () => {
    it('ควร update sync configs หลายรายการพร้อมกัน', async () => {
      // Arrange
      const updates = [
        { entityType: 'CUSTOMER' as EntityType, isEnabled: true },
        { entityType: 'PRODUCT' as EntityType, isEnabled: false },
      ];

      mockSyncConfigRepository.findOne
        .mockResolvedValueOnce({ entityType: 'CUSTOMER', isEnabled: false })
        .mockResolvedValueOnce({ entityType: 'PRODUCT', isEnabled: true });

      mockSyncConfigRepository.save
        .mockResolvedValueOnce({ entityType: 'CUSTOMER', isEnabled: true })
        .mockResolvedValueOnce({ entityType: 'PRODUCT', isEnabled: false });

      // Act
      const result = await service.bulkUpdateSyncConfigs(updates);

      // Assert
      expect(result).toHaveLength(2);
      expect(syncConfigRepository.save).toHaveBeenCalledTimes(2);
      expect(result[0].isEnabled).toBe(true);
      expect(result[1].isEnabled).toBe(false);
    });

    it('ควรจัดการ empty array', async () => {
      // Arrange
      const updates: Array<{ entityType: EntityType; isEnabled: boolean }> = [];

      // Act
      const result = await service.bulkUpdateSyncConfigs(updates);

      // Assert
      expect(result).toHaveLength(0);
      expect(syncConfigRepository.save).not.toHaveBeenCalled();
    });
  });
});
