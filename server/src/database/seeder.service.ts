// path: server/src/database/seeder.service.ts
// version: 1.2 (Add LME and Exchange Rate Master Data Seeding)
// last-modified: 1 ตุลาคม 2568 18:45

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { BOM } from '../entities/bom.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { LmePrice } from '../entities/lme-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(RawMaterial)
    private rawMaterialRepository: Repository<RawMaterial>,
    @InjectRepository(CustomerGroup)
    private customerGroupRepository: Repository<CustomerGroup>,
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
    @InjectRepository(BOM)
    private bomRepository: Repository<BOM>,
    @InjectRepository(FabCost)
    private fabCostRepository: Repository<FabCost>,
    @InjectRepository(StandardPrice)
    private standardPriceRepository: Repository<StandardPrice>,
    @InjectRepository(SellingFactor)
    private sellingFactorRepository: Repository<SellingFactor>,
    @InjectRepository(LmePrice)
    private lmePriceRepository: Repository<LmePrice>,
    @InjectRepository(LmeMasterData)
    private lmeMasterDataRepository: Repository<LmeMasterData>,
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
    @InjectRepository(ExchangeRateMasterData)
    private exchangeRateMasterDataRepository: Repository<ExchangeRateMasterData>,
  ) {}

  async seed() {
    console.log('🌱 Starting database seeding...');

    // สร้าง Admin User เริ่มต้น
    await this.seedUsers();

    // สร้างข้อมูลหลัก
    await this.seedMasterData();

    // สร้าง BOM data
    await this.seedBOMData();

    // สร้างข้อมูลราคาและการคำนวณ
    await this.seedPricingData();

    console.log('✅ Database seeding completed!');
  }

  private async seedUsers() {
    const adminExists = await this.userRepository.findOne({ where: { username: 'admin' } });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin', 10);

      const admin = this.userRepository.create({
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'Administrator',
      });

      await this.userRepository.save(admin);
      console.log('👤 Created admin user (admin/admin)');
    }
  }

  private async seedMasterData() {
    // Customer Groups
    const groups = [
      { id: 'CG-001', name: 'Standard', description: 'กลุ่มมาตรฐาน', isDefault: true },
      { id: 'CG-002', name: 'Premium', description: 'กลุ่มพรีเมียม', isDefault: false },
      { id: 'CG-003', name: 'VIP', description: 'กลุ่ม VIP', isDefault: false },
    ];

    for (const group of groups) {
      const exists = await this.customerGroupRepository.findOne({ where: { id: group.id } });
      if (!exists) {
        await this.customerGroupRepository.save(group);
      }
    }

    // Customers
    const customers = [
      { id: 'CUST-001', name: 'Thai Summit Group' },
      { id: 'CUST-002', name: 'Honda Automobile' },
      { id: 'CUST-003', name: 'Toyota Motor' },
    ];

    for (const customer of customers) {
      const exists = await this.customerRepository.findOne({ where: { id: customer.id } });
      if (!exists) {
        await this.customerRepository.save(customer);
      }
    }

    // Products
    const products = [
      { id: 'FG-001', name: 'TS-PART-001' },
      { id: 'FG-002', name: 'HN-PART-245' },
      { id: 'FG-003', name: 'TY-PART-889' },
    ];

    for (const product of products) {
      const exists = await this.productRepository.findOne({ where: { id: product.id } });
      if (!exists) {
        await this.productRepository.save(product);
      }
    }

    // Raw Materials
    const rawMaterials = [
      { id: 'RM-AL-01', name: 'Aluminum Sheet 1.2mm', unit: 'kg' },
      { id: 'RM-CU-02', name: 'Copper Wire 0.5mm', unit: 'm' },
      { id: 'RM-ST-03', name: 'Steel Coil 2.0mm', unit: 'kg' },
      { id: 'RM-PC-04', name: 'Polycarbonate Pellet', unit: 'kg' },
    ];

    for (const material of rawMaterials) {
      const exists = await this.rawMaterialRepository.findOne({ where: { id: material.id } });
      if (!exists) {
        await this.rawMaterialRepository.save(material);
      }
    }

    console.log('📊 Master data seeded successfully');
  }

  private async seedBOMData() {
    // BOM สำหรับ Products แต่ละตัว
    const bomData = [
      // BOM สำหรับ TS-PART-001 (FG-001)
      { productId: 'FG-001', rawMaterialId: 'RM-AL-01', quantity: 2.5, notes: 'Main body material' },
      { productId: 'FG-001', rawMaterialId: 'RM-CU-02', quantity: 0.8, notes: 'Wiring' },
      { productId: 'FG-001', rawMaterialId: 'RM-ST-03', quantity: 1.2, notes: 'Reinforcement' },

      // BOM สำหรับ HN-PART-245 (FG-002)
      { productId: 'FG-002', rawMaterialId: 'RM-AL-01', quantity: 1.8, notes: 'Housing' },
      { productId: 'FG-002', rawMaterialId: 'RM-PC-04', quantity: 0.5, notes: 'Insulation' },

      // BOM สำหรับ TY-PART-889 (FG-003)
      { productId: 'FG-003', rawMaterialId: 'RM-ST-03', quantity: 3.2, notes: 'Frame structure' },
      { productId: 'FG-003', rawMaterialId: 'RM-CU-02', quantity: 1.5, notes: 'Electrical components' },
      { productId: 'FG-003', rawMaterialId: 'RM-PC-04', quantity: 0.3, notes: 'Cover material' },
    ];

    for (const bom of bomData) {
      const exists = await this.bomRepository.findOne({
        where: {
          productId: bom.productId,
          rawMaterialId: bom.rawMaterialId
        }
      });

      if (!exists) {
        await this.bomRepository.save({
          ...bom,
          isActive: true
        });
      }
    }

    console.log('🔧 BOM data seeded successfully');
  }

  private async seedPricingData() {
    // Fab Costs
    const fabCosts = [
      {
        name: 'Standard Fabrication',
        costPerHour: 150.00,
        currency: 'THB',
        description: 'Standard manufacturing cost per hour'
      },
      {
        name: 'Complex Fabrication',
        costPerHour: 250.00,
        currency: 'THB',
        description: 'Complex manufacturing cost per hour'
      }
    ];

    for (const fabCost of fabCosts) {
      const exists = await this.fabCostRepository.findOne({
        where: { name: fabCost.name }
      });
      if (!exists) {
        await this.fabCostRepository.save(fabCost);
      }
    }

    // Standard Prices
    const standardPrices = [
      {
        rawMaterialId: 'RM-AL-01',
        price: 45.50,
        currency: 'THB',
        effectiveFrom: new Date('2024-01-01')
      },
      {
        rawMaterialId: 'RM-CU-02',
        price: 125.00,
        currency: 'THB',
        effectiveFrom: new Date('2024-01-01')
      },
      {
        rawMaterialId: 'RM-ST-03',
        price: 35.75,
        currency: 'THB',
        effectiveFrom: new Date('2024-01-01')
      },
      {
        rawMaterialId: 'RM-PC-04',
        price: 68.25,
        currency: 'THB',
        effectiveFrom: new Date('2024-01-01')
      }
    ];

    for (const standardPrice of standardPrices) {
      const exists = await this.standardPriceRepository.findOne({
        where: {
          rawMaterialId: standardPrice.rawMaterialId,
          effectiveFrom: standardPrice.effectiveFrom
        }
      });
      if (!exists) {
        await this.standardPriceRepository.save(standardPrice);
      }
    }

    // Selling Factors
    const sellingFactors = [
      {
        patternName: 'Standard Pattern',
        patternCode: 'STD',
        factor: 1.25,
        description: 'Standard selling factor 25%'
      },
      {
        patternName: 'Export Pattern',
        patternCode: 'EXP',
        factor: 1.35,
        description: 'Export selling factor 35%'
      },
      {
        patternName: 'Premium Pattern',
        patternCode: 'PRM',
        factor: 1.50,
        description: 'Premium selling factor 50%'
      }
    ];

    for (const factor of sellingFactors) {
      const exists = await this.sellingFactorRepository.findOne({
        where: { patternCode: factor.patternCode }
      });
      if (!exists) {
        await this.sellingFactorRepository.save(factor);
      }
    }

    // LME Prices
    const lmePrices = [
      {
        itemGroupName: 'Aluminum',
        itemGroupCode: 'AL',
        price: 2150.50,
        currency: 'USD',
        priceDate: new Date(),
        source: 'LME Official'
      },
      {
        itemGroupName: 'Copper',
        itemGroupCode: 'CU',
        price: 8750.25,
        currency: 'USD',
        priceDate: new Date(),
        source: 'LME Official'
      }
    ];

    for (const lmePrice of lmePrices) {
      const exists = await this.lmePriceRepository.findOne({
        where: {
          itemGroupCode: lmePrice.itemGroupCode,
          priceDate: lmePrice.priceDate
        }
      });
      if (!exists) {
        await this.lmePriceRepository.save(lmePrice);
      }
    }

    // Exchange Rates
    const exchangeRates = [
      {
        sourceCurrencyCode: 'USD',
        sourceCurrencyName: 'US Dollar',
        destinationCurrencyCode: 'THB',
        destinationCurrencyName: 'Thai Baht',
        rate: 36.50,
        rateDate: new Date(),
        source: 'BOT',
        dataSource: 'REST_API'
      },
      {
        sourceCurrencyCode: 'EUR',
        sourceCurrencyName: 'Euro',
        destinationCurrencyCode: 'THB',
        destinationCurrencyName: 'Thai Baht',
        rate: 39.80,
        rateDate: new Date(),
        source: 'BOT',
        dataSource: 'REST_API'
      }
    ];

    for (const exchangeRate of exchangeRates) {
      const exists = await this.exchangeRateRepository.findOne({
        where: {
          sourceCurrencyCode: exchangeRate.sourceCurrencyCode,
          destinationCurrencyCode: exchangeRate.destinationCurrencyCode
        }
      });
      if (!exists) {
        await this.exchangeRateRepository.save(exchangeRate);
      }
    }

    // LME Master Data (for calculation - employee defined)
    const lmeMasterData = [
      {
        itemGroupName: 'Aluminum',
        itemGroupCode: 'AL',
        price: 2200.00,
        currency: 'USD',
        customerGroupId: null,
        description: 'LME price for aluminum calculation',
        status: 'Approved',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      {
        itemGroupName: 'Copper',
        itemGroupCode: 'CU',
        price: 9000.00,
        currency: 'USD',
        customerGroupId: null,
        description: 'LME price for copper calculation',
        status: 'Approved',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      }
    ];

    for (const lmeMaster of lmeMasterData) {
      const exists = await this.lmeMasterDataRepository.findOne({
        where: {
          itemGroupCode: lmeMaster.itemGroupCode
        }
      });
      if (!exists) {
        await this.lmeMasterDataRepository.save(lmeMaster);
      }
    }

    // Exchange Rate Master Data (for calculation - employee defined)
    const exchangeRateMasterData = [
      {
        sourceCurrencyCode: 'USD',
        sourceCurrencyName: 'US Dollar',
        destinationCurrencyCode: 'THB',
        destinationCurrencyName: 'Thai Baht',
        rate: 36.00,
        customerGroupId: null,
        description: 'USD to THB rate for calculation',
        status: 'Approved',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      {
        sourceCurrencyCode: 'EUR',
        sourceCurrencyName: 'Euro',
        destinationCurrencyCode: 'THB',
        destinationCurrencyName: 'Thai Baht',
        rate: 40.00,
        customerGroupId: null,
        description: 'EUR to THB rate for calculation',
        status: 'Approved',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      }
    ];

    for (const rateMaster of exchangeRateMasterData) {
      const exists = await this.exchangeRateMasterDataRepository.findOne({
        where: {
          sourceCurrencyCode: rateMaster.sourceCurrencyCode,
          destinationCurrencyCode: rateMaster.destinationCurrencyCode
        }
      });
      if (!exists) {
        await this.exchangeRateMasterDataRepository.save(rateMaster);
      }
    }

    console.log('💰 Pricing data seeded successfully');
  }
}