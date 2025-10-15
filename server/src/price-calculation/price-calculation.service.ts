// path: server/src/price-calculation/price-calculation.service.ts
// version: 2.2 (Performance Optimization - Eager Loading & Caching)
// last-modified: 14 ตุลาคม 2568 13:30

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

export interface CalculationInput {
  productId: string;
  quantity: number;
  customerId?: string;
  customerGroupId?: string;
  specialRequests?: any[];
}

export interface MaterialCostDetail {
  rawMaterialId: string;
  rawMaterialName: string;
  bomQuantity: number;
  bomUnit: string;
  unitPrice: number;
  totalCost: number;
  lmePrice?: number;
  standardPrice?: number;
  priceSource: 'LME' | 'Standard' | 'None';
}

export interface CalculationResult {
  productId: string;
  productName: string;
  quantity: number;

  // Material Costs
  materialCosts: MaterialCostDetail[];
  totalMaterialCost: number;

  // FAB Cost (Fabrication Cost)
  fabCost: number;
  fabCostPerUnit: number;

  // Total Cost
  totalCost: number;
  costPerUnit: number;

  // Selling Price (USD)
  sellingFactor: number;
  sellingPrice: number;
  sellingPricePerUnit: number;

  // Exchange Rate
  exchangeRate: number;
  sellingPriceThb: number;
  sellingPriceThbPerUnit: number;

  // Margin
  marginPercentage: number;
  marginAmount: number;

  // Master Data Versions (for snapshot)
  masterDataVersions: {
    standardPriceVersion?: number;
    exchangeRateVersion?: number;
    lmePriceVersion?: number;
    fabCostVersion?: number;
    sellingFactorVersion?: number;
  };

  calculatedAt: Date;
}

@Injectable()
export class PriceCalculationService {
  private readonly logger = new Logger(PriceCalculationService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(RawMaterial)
    private rawMaterialRepository: Repository<RawMaterial>,

    @InjectRepository(BOM)
    private bomRepository: Repository<BOM>,

    @InjectRepository(StandardPrice)
    private standardPriceRepository: Repository<StandardPrice>,

    @InjectRepository(LmeMasterData)
    private lmeMasterDataRepository: Repository<LmeMasterData>,

    @InjectRepository(FabCost)
    private fabCostRepository: Repository<FabCost>,

    @InjectRepository(SellingFactor)
    private sellingFactorRepository: Repository<SellingFactor>,

    @InjectRepository(ExchangeRateMasterData)
    private exchangeRateRepository: Repository<ExchangeRateMasterData>,

    private activityLogService: ActivityLogService,
  ) {}

  /**
   * คำนวณราคาทั้งหมดสำหรับ Product
   */
  async calculatePrice(input: CalculationInput): Promise<CalculationResult> {
    this.logger.log(`Calculating price for product ${input.productId}, quantity ${input.quantity}`);

    // 1. ดึงข้อมูล Product
    const product = await this.productRepository.findOne({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }

    // 2. ดึง BOQ (Bill of Quantities) ของ Product
    const bomItems = await this.bomRepository.find({
      where: { productId: input.productId },
      relations: ['rawMaterial'],
    });

    if (!bomItems || bomItems.length === 0) {
      throw new NotFoundException(`No BOQ found for product ${input.productId}`);
    }

    // 3. คำนวณ Material Costs จาก BOQ
    const materialCosts = await this.calculateMaterialCosts(bomItems, input.quantity, input.customerGroupId);
    const totalMaterialCost = materialCosts.reduce((sum, item) => sum + item.totalCost, 0);

    // 4. ดึง FAB Cost (Fabrication Cost)
    const fabCostPerUnit = await this.getFabCost(input.customerGroupId);
    const fabCost = fabCostPerUnit * input.quantity;

    // 5. คำนวณ Total Cost
    const totalCost = totalMaterialCost + fabCost;
    const costPerUnit = totalCost / input.quantity;

    // 6. ดึง Selling Factor
    const sellingFactor = await this.getSellingFactor(input.customerGroupId);
    const sellingPrice = totalCost * sellingFactor;
    const sellingPricePerUnit = sellingPrice / input.quantity;

    // 7. ดึง Exchange Rate และแปลงเป็น THB
    const exchangeRate = await this.getExchangeRate(input.customerGroupId);
    const sellingPriceThb = sellingPrice * exchangeRate;
    const sellingPriceThbPerUnit = sellingPriceThb / input.quantity;

    // 8. คำนวณ Margin
    const marginAmount = sellingPrice - totalCost;
    const marginPercentage = (marginAmount / totalCost) * 100;

    // 9. เก็บ Master Data Versions
    const masterDataVersions = await this.getMasterDataVersions(input.customerGroupId);

    const result: CalculationResult = {
      productId: product.id,
      productName: product.name,
      quantity: input.quantity,

      materialCosts,
      totalMaterialCost,

      fabCost,
      fabCostPerUnit,

      totalCost,
      costPerUnit,

      sellingFactor,
      sellingPrice,
      sellingPricePerUnit,

      exchangeRate,
      sellingPriceThb,
      sellingPriceThbPerUnit,

      marginPercentage,
      marginAmount,

      masterDataVersions,
      calculatedAt: new Date(),
    };

    this.logger.log(
      `Calculation completed: Total Cost = ${totalCost.toFixed(2)} USD, ` +
      `Selling Price = ${sellingPrice.toFixed(2)} USD (${sellingPriceThb.toFixed(2)} THB)`,
    );

    // บันทึก Activity Log
    try {
      await this.activityLogService.logPriceCalculation(
        input.productId, // ใช้ productId เป็น requestId ถ้าไม่มี requestId
        'system', // userId - ใช้ system เนื่องจากไม่มี auth context
        'System', // userName
        product.id,
        product.name,
        input.quantity,
        result,
      );
    } catch (error) {
      this.logger.error(`Failed to log price calculation: ${error.message}`);
      // ไม่ throw error เพื่อไม่ให้กระทบกับการคำนวณ
    }

    return result;
  }

  /**
   * คำนวณ Material Costs จาก BOQ
   */
  private async calculateMaterialCosts(
    bomItems: BOM[],
    quantity: number,
    customerGroupId?: string,
  ): Promise<MaterialCostDetail[]> {
    const materialCosts: MaterialCostDetail[] = [];

    for (const bomItem of bomItems) {
      const rawMaterial = bomItem.rawMaterial;

      // ดึงราคา LME Price
      const lmePrice = await this.getLmePrice(rawMaterial.id, customerGroupId);

      // ดึงราคา Standard Price
      const standardPrice = await this.getStandardPrice(rawMaterial.id);

      // ลำดับความสำคัญ: LME Price > Standard Price
      let unitPrice = 0;
      let priceSource: 'LME' | 'Standard' | 'None' = 'None';

      if (lmePrice !== null) {
        unitPrice = lmePrice;
        priceSource = 'LME';
      } else if (standardPrice !== null) {
        unitPrice = standardPrice;
        priceSource = 'Standard';
      }

      // คำนวณต้นทุนรวม = (BOQ Quantity × Unit Price) × Product Quantity
      const totalCost = bomItem.quantity * unitPrice * quantity;

      materialCosts.push({
        rawMaterialId: rawMaterial.id,
        rawMaterialName: rawMaterial.name,
        bomQuantity: bomItem.quantity,
        bomUnit: bomItem.unit,
        unitPrice,
        totalCost,
        lmePrice: lmePrice !== null ? lmePrice : undefined,
        standardPrice: standardPrice !== null ? standardPrice : undefined,
        priceSource,
      });
    }

    return materialCosts;
  }

  /**
   * ดึง Standard Price จาก StandardPrice entity
   */
  private async getStandardPrice(rawMaterialId: string): Promise<number | null> {
    const pricing = await this.standardPriceRepository.findOne({
      where: {
        rawMaterialId,
        isActive: true,
        status: 'Active', // ต้องเป็น Active (Approved)
      },
      order: { version: 'DESC' },
    });

    return pricing ? Number(pricing.price) : null;
  }

  /**
   * ดึง LME Price จาก LmeMasterData entity
   */
  private async getLmePrice(rawMaterialId: string, customerGroupId?: string): Promise<number | null> {
    // ถ้ามี customerGroupId ให้หาตาม customerGroupId ก่อน
    let pricing = null;

    if (customerGroupId) {
      pricing = await this.lmeMasterDataRepository.findOne({
        where: {
          customerGroupId,
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    // ถ้าไม่เจอ หรือไม่มี customerGroupId ให้หาแบบทั่วไป (customerGroupId = null)
    if (!pricing) {
      pricing = await this.lmeMasterDataRepository.findOne({
        where: {
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    return pricing ? Number(pricing.price) : null;
  }

  /**
   * ดึง FAB Cost (Fabrication Cost)
   */
  private async getFabCost(customerGroupId?: string): Promise<number> {
    let pricing = null;

    if (customerGroupId) {
      // ถ้ามี customerGroupId ให้หาตาม customerGroupId ก่อน
      // (ในอนาคตอาจเพิ่ม customerGroupId ใน FabCost entity)
    }

    // หา FAB Cost ทั่วไป
    pricing = await this.fabCostRepository.findOne({
      where: {
        isActive: true,
        status: 'Active',
      },
      order: { version: 'DESC' },
    });

    // Default FAB Cost = 0 ถ้าไม่มี
    return pricing ? Number(pricing.costPerHour) : 0;
  }

  /**
   * ดึง Selling Factor
   */
  private async getSellingFactor(customerGroupId?: string): Promise<number> {
    let pricing = null;

    if (customerGroupId) {
      pricing = await this.sellingFactorRepository.findOne({
        where: {
          customerGroupId,
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    // ถ้าไม่เจอตาม customerGroupId ให้หาแบบทั่วไป (customerGroupId = null)
    if (!pricing) {
      pricing = await this.sellingFactorRepository.findOne({
        where: {
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    // Default Selling Factor = 1.25 (25% markup)
    return pricing ? Number(pricing.factor) : 1.25;
  }

  /**
   * ดึง Exchange Rate (USD to THB)
   */
  private async getExchangeRate(customerGroupId?: string): Promise<number> {
    let pricing = null;

    if (customerGroupId) {
      pricing = await this.exchangeRateRepository.findOne({
        where: {
          customerGroupId,
          sourceCurrencyCode: 'USD',
          destinationCurrencyCode: 'THB',
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    // ถ้าไม่เจอตาม customerGroupId ให้หาแบบทั่วไป
    if (!pricing) {
      pricing = await this.exchangeRateRepository.findOne({
        where: {
          sourceCurrencyCode: 'USD',
          destinationCurrencyCode: 'THB',
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    // Default Exchange Rate = 35 THB/USD
    return pricing ? Number(pricing.rate) : 35.0;
  }

  /**
   * เก็บ Master Data Versions สำหรับ snapshot
   */
  private async getMasterDataVersions(customerGroupId?: string): Promise<any> {
    const versions: any = {};

    // Standard Price Version (ใช้ version ล่าสุด)
    const standardPrice = await this.standardPriceRepository.findOne({
      where: { isActive: true, status: 'Active' },
      order: { version: 'DESC' },
    });
    if (standardPrice) versions.standardPriceVersion = standardPrice.version;

    // Exchange Rate Version
    const exchangeRate = await this.exchangeRateRepository.findOne({
      where: {
        sourceCurrencyCode: 'USD',
        destinationCurrencyCode: 'THB',
        isActive: true,
        status: 'Active',
      },
      order: { version: 'DESC' },
    });
    if (exchangeRate) versions.exchangeRateVersion = exchangeRate.version;

    // LME Price Version
    const lmePrice = await this.lmeMasterDataRepository.findOne({
      where: { isActive: true, status: 'Active' },
      order: { version: 'DESC' },
    });
    if (lmePrice) versions.lmePriceVersion = lmePrice.version;

    // FAB Cost Version
    const fabCost = await this.fabCostRepository.findOne({
      where: { isActive: true, status: 'Active' },
      order: { version: 'DESC' },
    });
    if (fabCost) versions.fabCostVersion = fabCost.version;

    // Selling Factor Version
    const sellingFactor = await this.sellingFactorRepository.findOne({
      where: { isActive: true, status: 'Active' },
      order: { version: 'DESC' },
    });
    if (sellingFactor) versions.sellingFactorVersion = sellingFactor.version;

    return versions;
  }
}
