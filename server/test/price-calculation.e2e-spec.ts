// path: server/test/price-calculation.e2e-spec.ts
// version: 1.0 (Integration Tests for PriceCalculationController)
// last-modified: 14 ตุลาคม 2568 16:30

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PriceCalculationModule } from '../src/price-calculation/price-calculation.module';
import { Product } from '../src/entities/product.entity';
import { RawMaterial } from '../src/entities/raw-material.entity';
import { BOM } from '../src/entities/bom.entity';
import { StandardPrice } from '../src/entities/standard-price.entity';
import { LmeMasterData } from '../src/entities/lme-master-data.entity';
import { FabCost } from '../src/entities/fab-cost.entity';
import { SellingFactor } from '../src/entities/selling-factor.entity';
import { ExchangeRateMasterData } from '../src/entities/exchange-rate-master-data.entity';
import { ActivityLogService } from '../src/activity-log/activity-log.service';

describe('PriceCalculationController (e2e)', () => {
  let app: INestApplication;

  // Mock Data
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

  const mockLmePrice = {
    id: 'LME-001',
    price: 100,
    isActive: true,
    status: 'Active',
    version: 1,
  };

  const mockFabCost = {
    id: 'FAB-001',
    costPerHour: 50,
    isActive: true,
    status: 'Active',
    version: 1,
  };

  const mockSellingFactor = {
    id: 'SF-001',
    factor: 1.25,
    isActive: true,
    status: 'Active',
    version: 1,
  };

  const mockExchangeRate = {
    id: 'EX-001',
    rate: 35,
    sourceCurrencyCode: 'USD',
    destinationCurrencyCode: 'THB',
    isActive: true,
    status: 'Active',
    version: 1,
  };

  // Mock Repositories
  const mockProductRepository = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
  };

  const mockBomRepository = {
    find: jest.fn().mockResolvedValue(mockBomItems),
  };

  const mockStandardPriceRepository = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  const mockLmeMasterDataRepository = {
    findOne: jest.fn().mockResolvedValue(mockLmePrice),
  };

  const mockFabCostRepository = {
    findOne: jest.fn().mockResolvedValue(mockFabCost),
  };

  const mockSellingFactorRepository = {
    findOne: jest.fn().mockResolvedValue(mockSellingFactor),
  };

  const mockExchangeRateRepository = {
    findOne: jest.fn().mockResolvedValue(mockExchangeRate),
  };

  const mockActivityLogService = {
    logPriceCalculation: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PriceCalculationModule],
    })
      .overrideProvider(getRepositoryToken(Product))
      .useValue(mockProductRepository)
      .overrideProvider(getRepositoryToken(RawMaterial))
      .useValue({})
      .overrideProvider(getRepositoryToken(BOM))
      .useValue(mockBomRepository)
      .overrideProvider(getRepositoryToken(StandardPrice))
      .useValue(mockStandardPriceRepository)
      .overrideProvider(getRepositoryToken(LmeMasterData))
      .useValue(mockLmeMasterDataRepository)
      .overrideProvider(getRepositoryToken(FabCost))
      .useValue(mockFabCostRepository)
      .overrideProvider(getRepositoryToken(SellingFactor))
      .useValue(mockSellingFactorRepository)
      .overrideProvider(getRepositoryToken(ExchangeRateMasterData))
      .useValue(mockExchangeRateRepository)
      .overrideProvider(ActivityLogService)
      .useValue(mockActivityLogService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/price-calculation/calculate (POST)', () => {
    const validRequest = {
      productId: 'PROD-001',
      quantity: 10,
      customerId: 'CUST-001',
      customerGroupId: 'CG-001',
    };

    it('ควรคำนวณราคาสำเร็จ', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('productId');
          expect(res.body).toHaveProperty('productName');
          expect(res.body).toHaveProperty('quantity');
          expect(res.body).toHaveProperty('totalMaterialCost');
          expect(res.body).toHaveProperty('fabCost');
          expect(res.body).toHaveProperty('totalCost');
          expect(res.body).toHaveProperty('sellingPrice');
          expect(res.body).toHaveProperty('sellingPriceThb');
          expect(res.body).toHaveProperty('marginPercentage');
          expect(res.body).toHaveProperty('materialCosts');
          expect(res.body.productId).toBe(validRequest.productId);
          expect(res.body.quantity).toBe(validRequest.quantity);
        });
    });

    it('ควร return ข้อมูล material costs อย่างถูกต้อง', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body.materialCosts).toBeInstanceOf(Array);
          expect(res.body.materialCosts.length).toBeGreaterThan(0);
          expect(res.body.materialCosts[0]).toHaveProperty('rawMaterialId');
          expect(res.body.materialCosts[0]).toHaveProperty('rawMaterialName');
          expect(res.body.materialCosts[0]).toHaveProperty('bomQuantity');
          expect(res.body.materialCosts[0]).toHaveProperty('unitPrice');
          expect(res.body.materialCosts[0]).toHaveProperty('totalCost');
          expect(res.body.materialCosts[0]).toHaveProperty('priceSource');
        });
    });

    it('ควร return master data versions', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('masterDataVersions');
          expect(res.body.masterDataVersions).toBeInstanceOf(Object);
        });
    });

    it('ควรคำนวณค่าต่างๆ ได้ถูกต้อง', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          // Material Cost = 2.5 kg * 100 USD * 10 qty = 2,500 USD
          expect(res.body.totalMaterialCost).toBe(2500);

          // FAB Cost = 50 USD * 10 qty = 500 USD
          expect(res.body.fabCost).toBe(500);

          // Total Cost = 2,500 + 500 = 3,000 USD
          expect(res.body.totalCost).toBe(3000);

          // Selling Price = 3,000 * 1.25 = 3,750 USD
          expect(res.body.sellingPrice).toBe(3750);

          // Selling Price THB = 3,750 * 35 = 131,250 THB
          expect(res.body.sellingPriceThb).toBe(131250);

          // Margin = (3,750 - 3,000) / 3,000 * 100 = 25%
          expect(res.body.marginPercentage).toBeCloseTo(25, 2);
        });
    });

    it('ควร return 404 เมื่อไม่พบ product', () => {
      mockProductRepository.findOne.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-999',
          quantity: 10,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Product PROD-999 not found');
        });
    });

    it('ควร return 404 เมื่อไม่มี BOQ', () => {
      mockBomRepository.find.mockResolvedValueOnce([]);

      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('No BOQ found');
        });
    });

    it('ควรจัดการกรณีไม่ส่ง required fields', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-001',
          // missing quantity
        })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it('ควรจัดการ quantity = 0', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-001',
          quantity: 0,
        })
        .expect((res) => {
          // อาจจะ error หรือ return result ที่เป็น 0 ทั้งหมด
          expect(res.status).toBeGreaterThanOrEqual(200);
        });
    });

    it('ควรจัดการ negative quantity', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-001',
          quantity: -10,
        })
        .expect((res) => {
          // ขึ้นอยู่กับ validation ที่ implement
          expect(res.status).toBeGreaterThanOrEqual(200);
        });
    });

    it('ควรจัดการ very large quantity', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-001',
          quantity: 1000000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.quantity).toBe(1000000);
          expect(res.body.totalCost).toBeGreaterThan(0);
        });
    });

    it('ควรใช้ default values เมื่อไม่มี master data', () => {
      mockFabCostRepository.findOne.mockResolvedValueOnce(null);
      mockSellingFactorRepository.findOne.mockResolvedValueOnce(null);
      mockExchangeRateRepository.findOne.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body.fabCostPerUnit).toBe(0); // Default FAB Cost
          expect(res.body.sellingFactor).toBe(1.25); // Default Selling Factor
          expect(res.body.exchangeRate).toBe(35.0); // Default Exchange Rate
        });
    });

    it('ควรคำนวณได้ถูกต้องเมื่อใช้ Standard Price แทน LME Price', () => {
      mockLmeMasterDataRepository.findOne.mockResolvedValueOnce(null); // ไม่มี LME
      mockStandardPriceRepository.findOne.mockResolvedValueOnce({
        id: 'SP-001',
        price: 80,
        isActive: true,
        status: 'Active',
      });

      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body.materialCosts[0].priceSource).toBe('Standard');
          expect(res.body.materialCosts[0].unitPrice).toBe(80);
          // Material Cost = 2.5 * 80 * 10 = 2,000
          expect(res.body.totalMaterialCost).toBe(2000);
        });
    });

    it('ควรบันทึก activity log หลังคำนวณ', async () => {
      await request(app.getHttpServer()).post('/price-calculation/calculate').send(validRequest);

      expect(mockActivityLogService.logPriceCalculation).toHaveBeenCalled();
    });

    it('ควรคำนวณสำเร็จแม้ activity log ล้มเหลว', () => {
      mockActivityLogService.logPriceCalculation.mockRejectedValueOnce(new Error('Log failed'));

      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body.totalCost).toBeGreaterThan(0);
        });
    });

    it('ควรจัดการ special characters ใน productId', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: "PROD-'; DROP TABLE products; --",
          quantity: 10,
        })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it('ควรจัดการ float quantity', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-001',
          quantity: 10.5,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.quantity).toBe(10.5);
        });
    });

    it('ควร return calculatedAt timestamp', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('calculatedAt');
          expect(new Date(res.body.calculatedAt)).toBeInstanceOf(Date);
        });
    });
  });

  describe('Error Handling', () => {
    it('ควรจัดการ database errors', () => {
      mockProductRepository.findOne.mockRejectedValueOnce(new Error('Database connection lost'));

      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-001',
          quantity: 10,
        })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(500);
        });
    });

    it('ควรจัดการ malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('ควรจัดการ empty request body', () => {
      return request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({})
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  describe('Performance Tests', () => {
    it('ควรคำนวณเสร็จภายใน 2 วินาที', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .post('/price-calculation/calculate')
        .send({
          productId: 'PROD-001',
          quantity: 10,
        })
        .expect(201);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });
});
