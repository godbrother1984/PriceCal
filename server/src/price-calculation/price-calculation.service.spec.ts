// path: server/src/price-calculation/price-calculation.service.spec.ts
// version: 1.0 (Unit Tests for PriceCalculationService)
// last-modified: 14 ตุลาคม 2568 14:00

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PriceCalculationService, CalculationInput } from './price-calculation.service';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

describe('PriceCalculationService', () => {
  let service: PriceCalculationService;
  let productRepository: Repository<Product>;
  let bomRepository: Repository<BOM>;
  let standardPriceRepository: Repository<StandardPrice>;
  let lmeMasterDataRepository: Repository<LmeMasterData>;
  let fabCostRepository: Repository<FabCost>;
  let sellingFactorRepository: Repository<SellingFactor>;
  let exchangeRateRepository: Repository<ExchangeRateMasterData>;
  let activityLogService: ActivityLogService;

  // Mock Repositories
  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockBomRepository = {
    find: jest.fn(),
  };

  const mockStandardPriceRepository = {
    findOne: jest.fn(),
  };

  const mockLmeMasterDataRepository = {
    findOne: jest.fn(),
  };

  const mockFabCostRepository = {
    findOne: jest.fn(),
  };

  const mockSellingFactorRepository = {
    findOne: jest.fn(),
  };

  const mockExchangeRateRepository = {
    findOne: jest.fn(),
  };

  const mockActivityLogService = {
    logPriceCalculation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceCalculationService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(RawMaterial),
          useValue: {},
        },
        {
          provide: getRepositoryToken(BOM),
          useValue: mockBomRepository,
        },
        {
          provide: getRepositoryToken(StandardPrice),
          useValue: mockStandardPriceRepository,
        },
        {
          provide: getRepositoryToken(LmeMasterData),
          useValue: mockLmeMasterDataRepository,
        },
        {
          provide: getRepositoryToken(FabCost),
          useValue: mockFabCostRepository,
        },
        {
          provide: getRepositoryToken(SellingFactor),
          useValue: mockSellingFactorRepository,
        },
        {
          provide: getRepositoryToken(ExchangeRateMasterData),
          useValue: mockExchangeRateRepository,
        },
        {
          provide: ActivityLogService,
          useValue: mockActivityLogService,
        },
      ],
    }).compile();

    service = module.get<PriceCalculationService>(PriceCalculationService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    bomRepository = module.get<Repository<BOM>>(getRepositoryToken(BOM));
    standardPriceRepository = module.get<Repository<StandardPrice>>(getRepositoryToken(StandardPrice));
    lmeMasterDataRepository = module.get<Repository<LmeMasterData>>(getRepositoryToken(LmeMasterData));
    fabCostRepository = module.get<Repository<FabCost>>(getRepositoryToken(FabCost));
    sellingFactorRepository = module.get<Repository<SellingFactor>>(getRepositoryToken(SellingFactor));
    exchangeRateRepository = module.get<Repository<ExchangeRateMasterData>>(
      getRepositoryToken(ExchangeRateMasterData),
    );
    activityLogService = module.get<ActivityLogService>(ActivityLogService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePrice', () => {
    const mockProduct = {
      id: 'PROD-001',
      name: 'Test Product',
      category: 'Test Category',
      isActive: true,
    };

    const mockRawMaterial = {
      id: 'RM-001',
      name: 'Steel Sheet',
      unit: 'kg',
      category: 'Metal',
    };

    const mockBomItems = [
      {
        id: 'BOM-001',
        productId: 'PROD-001',
        rawMaterialId: 'RM-001',
        quantity: 2.5,
        unit: 'kg',
        rawMaterial: mockRawMaterial,
      },
    ];

    const calculationInput: CalculationInput = {
      productId: 'PROD-001',
      quantity: 10,
      customerId: 'CUST-001',
      customerGroupId: 'CG-001',
    };

    it('ควรคำนวณราคาสำเร็จด้วย LME Price', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue({
        id: 'LME-001',
        price: 100,
        isActive: true,
        status: 'Active',
      });
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue({
        id: 'FAB-001',
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue({
        id: 'SF-001',
        factor: 1.25,
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue({
        id: 'EX-001',
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: calculationInput.productId },
      });
      expect(bomRepository.find).toHaveBeenCalledWith({
        where: { productId: calculationInput.productId },
        relations: ['rawMaterial'],
      });

      // คำนวณค่าที่คาดหวัง
      const expectedMaterialCost = 2.5 * 100 * 10; // 2,500
      const expectedFabCost = 50 * 10; // 500
      const expectedTotalCost = expectedMaterialCost + expectedFabCost; // 3,000
      const expectedSellingPrice = expectedTotalCost * 1.25; // 3,750
      const expectedSellingPriceThb = expectedSellingPrice * 35; // 131,250

      expect(result.productId).toBe(mockProduct.id);
      expect(result.productName).toBe(mockProduct.name);
      expect(result.quantity).toBe(calculationInput.quantity);
      expect(result.totalMaterialCost).toBe(expectedMaterialCost);
      expect(result.fabCost).toBe(expectedFabCost);
      expect(result.totalCost).toBe(expectedTotalCost);
      expect(result.sellingPrice).toBe(expectedSellingPrice);
      expect(result.sellingPriceThb).toBe(expectedSellingPriceThb);
      expect(result.materialCosts[0].priceSource).toBe('LME');
      expect(activityLogService.logPriceCalculation).toHaveBeenCalled();
    });

    it('ควรคำนวณราคาสำเร็จด้วย Standard Price เมื่อไม่มี LME Price', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue(null); // ไม่มี LME
      mockStandardPriceRepository.findOne.mockResolvedValue({
        id: 'SP-001',
        price: 80,
        isActive: true,
        status: 'Active',
      });
      mockFabCostRepository.findOne.mockResolvedValue({
        id: 'FAB-001',
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue({
        id: 'SF-001',
        factor: 1.25,
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue({
        id: 'EX-001',
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      const expectedMaterialCost = 2.5 * 80 * 10; // 2,000
      expect(result.totalMaterialCost).toBe(expectedMaterialCost);
      expect(result.materialCosts[0].priceSource).toBe('Standard');
      expect(result.materialCosts[0].unitPrice).toBe(80);
    });

    it('ควร throw NotFoundException เมื่อไม่พบ Product', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.calculatePrice(calculationInput)).rejects.toThrow(NotFoundException);
      await expect(service.calculatePrice(calculationInput)).rejects.toThrow(
        `Product ${calculationInput.productId} not found`,
      );
    });

    it('ควร throw NotFoundException เมื่อไม่มี BOQ', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue([]); // ไม่มี BOM

      // Act & Assert
      await expect(service.calculatePrice(calculationInput)).rejects.toThrow(NotFoundException);
      await expect(service.calculatePrice(calculationInput)).rejects.toThrow(
        `No BOQ found for product ${calculationInput.productId}`,
      );
    });

    it('ควรใช้ค่า default เมื่อไม่มี FAB Cost', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue({
        price: 100,
        isActive: true,
        status: 'Active',
      });
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue(null); // ไม่มี FAB Cost
      mockSellingFactorRepository.findOne.mockResolvedValue({
        factor: 1.25,
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue({
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      expect(result.fabCost).toBe(0); // Default = 0
      expect(result.fabCostPerUnit).toBe(0);
    });

    it('ควรใช้ค่า default เมื่อไม่มี Selling Factor (1.25)', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue({
        price: 100,
        isActive: true,
        status: 'Active',
      });
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue({
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue(null); // ไม่มี Selling Factor
      mockExchangeRateRepository.findOne.mockResolvedValue({
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      expect(result.sellingFactor).toBe(1.25); // Default = 1.25
    });

    it('ควรใช้ค่า default เมื่อไม่มี Exchange Rate (35)', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue({
        price: 100,
        isActive: true,
        status: 'Active',
      });
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue({
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue({
        factor: 1.25,
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue(null); // ไม่มี Exchange Rate
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      expect(result.exchangeRate).toBe(35.0); // Default = 35
    });

    it('ควรคำนวณ margin ได้ถูกต้อง', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue({
        price: 100,
        isActive: true,
        status: 'Active',
      });
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue({
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue({
        factor: 1.5, // 50% markup
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue({
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      const totalCost = result.totalCost;
      const sellingPrice = result.sellingPrice;
      const expectedMargin = sellingPrice - totalCost;
      const expectedMarginPercentage = (expectedMargin / totalCost) * 100;

      expect(result.marginAmount).toBe(expectedMargin);
      expect(result.marginPercentage).toBeCloseTo(expectedMarginPercentage, 2);
    });

    it('ควรคำนวณได้ถูกต้องกับ multiple BOM items', async () => {
      // Arrange
      const multipleBomItems = [
        {
          id: 'BOM-001',
          productId: 'PROD-001',
          rawMaterialId: 'RM-001',
          quantity: 2.5,
          unit: 'kg',
          rawMaterial: { id: 'RM-001', name: 'Steel Sheet' },
        },
        {
          id: 'BOM-002',
          productId: 'PROD-001',
          rawMaterialId: 'RM-002',
          quantity: 1.0,
          unit: 'kg',
          rawMaterial: { id: 'RM-002', name: 'Aluminum' },
        },
      ];

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(multipleBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue({
        price: 100,
        isActive: true,
        status: 'Active',
      });
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue({
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue({
        factor: 1.25,
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue({
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      expect(result.materialCosts).toHaveLength(2);
      // (2.5 * 100 * 10) + (1.0 * 100 * 10) = 3,500
      expect(result.totalMaterialCost).toBe(3500);
    });

    it('ควรจัดการกรณีที่ Activity Log ล้มเหลวโดยไม่กระทบการคำนวณ', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue({
        price: 100,
        isActive: true,
        status: 'Active',
      });
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue({
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue({
        factor: 1.25,
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue({
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockRejectedValue(new Error('Log failed'));

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert - ควรคำนวณสำเร็จแม้ log จะล้มเหลว
      expect(result).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
    });

    it('ควรเก็บ Master Data Versions อย่างถูกต้อง', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne
        .mockResolvedValueOnce({ price: 100, isActive: true, status: 'Active' }) // สำหรับ getLmePrice
        .mockResolvedValueOnce({ version: 5, isActive: true, status: 'Active' }); // สำหรับ getMasterDataVersions
      mockStandardPriceRepository.findOne
        .mockResolvedValueOnce(null) // สำหรับ getStandardPrice
        .mockResolvedValueOnce({ version: 3, isActive: true, status: 'Active' }); // สำหรับ getMasterDataVersions
      mockFabCostRepository.findOne
        .mockResolvedValueOnce({ costPerHour: 50, isActive: true, status: 'Active' }) // สำหรับ getFabCost
        .mockResolvedValueOnce({ version: 2, isActive: true, status: 'Active' }); // สำหรับ getMasterDataVersions
      mockSellingFactorRepository.findOne
        .mockResolvedValueOnce({ factor: 1.25, isActive: true, status: 'Active' }) // สำหรับ getSellingFactor
        .mockResolvedValueOnce({ version: 4, isActive: true, status: 'Active' }); // สำหรับ getMasterDataVersions
      mockExchangeRateRepository.findOne
        .mockResolvedValueOnce({ rate: 35, isActive: true, status: 'Active' }) // สำหรับ getExchangeRate
        .mockResolvedValueOnce({ version: 1, isActive: true, status: 'Active' }); // สำหรับ getMasterDataVersions
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      expect(result.masterDataVersions).toBeDefined();
      expect(result.masterDataVersions.standardPriceVersion).toBe(3);
      expect(result.masterDataVersions.lmePriceVersion).toBe(5);
      expect(result.masterDataVersions.fabCostVersion).toBe(2);
      expect(result.masterDataVersions.sellingFactorVersion).toBe(4);
      expect(result.masterDataVersions.exchangeRateVersion).toBe(1);
    });

    it('ควรคำนวณ priceSource เป็น None เมื่อไม่มีทั้ง LME และ Standard Price', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockBomRepository.find.mockResolvedValue(mockBomItems);
      mockLmeMasterDataRepository.findOne.mockResolvedValue(null);
      mockStandardPriceRepository.findOne.mockResolvedValue(null);
      mockFabCostRepository.findOne.mockResolvedValue({
        costPerHour: 50,
        isActive: true,
        status: 'Active',
      });
      mockSellingFactorRepository.findOne.mockResolvedValue({
        factor: 1.25,
        isActive: true,
        status: 'Active',
      });
      mockExchangeRateRepository.findOne.mockResolvedValue({
        rate: 35,
        isActive: true,
        status: 'Active',
      });
      mockActivityLogService.logPriceCalculation.mockResolvedValue(undefined);

      // Act
      const result = await service.calculatePrice(calculationInput);

      // Assert
      expect(result.materialCosts[0].priceSource).toBe('None');
      expect(result.materialCosts[0].unitPrice).toBe(0);
      expect(result.totalMaterialCost).toBe(0);
    });
  });
});
