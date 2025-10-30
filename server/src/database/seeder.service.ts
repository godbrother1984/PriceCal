// path: server/src/database/seeder.service.ts
// version: 1.7 (Add ScrapAllowance seeding)
// last-modified: 30 ตุลาคม 2568 11:15

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Employee } from '../entities/employee.entity';
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
import { PricingFormula } from '../entities/pricing-formula.entity';
import { PricingRule } from '../entities/pricing-rule.entity';
import { Currency } from '../entities/currency.entity';
import { ScrapAllowance } from '../entities/scrap-allowance.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
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
    @InjectRepository(PricingFormula)
    private pricingFormulaRepository: Repository<PricingFormula>,
    @InjectRepository(PricingRule)
    private pricingRuleRepository: Repository<PricingRule>,
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    @InjectRepository(ScrapAllowance)
    private scrapAllowanceRepository: Repository<ScrapAllowance>,
  ) {}

  async seed() {
    console.log('🌱 Starting database seeding...');

    // สร้าง Admin User เริ่มต้น
    await this.seedUsers();

    // สร้าง Currencies (ต้องมาก่อน Master Data)
    await this.seedCurrencies();

    // สร้างข้อมูลหลัก
    await this.seedMasterData();

    // สร้าง BOM data
    await this.seedBOMData();

    // สร้างข้อมูลราคาและการคำนวณ
    await this.seedPricingData();

    // สร้าง Base Formula และ Custom Rules (Hybrid System)
    await this.seedHybridFormulaSystem();

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

  private async seedCurrencies() {
    // ✅ สกุลเงินที่รองรับในระบบ
    const currencies = [
      { id: 'CUR-THB', code: 'THB', name: 'Thai Baht', symbol: '฿', isActive: true },
      { id: 'CUR-USD', code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
      { id: 'CUR-EUR', code: 'EUR', name: 'Euro', symbol: '€', isActive: true },
      { id: 'CUR-JPY', code: 'JPY', name: 'Japanese Yen', symbol: '¥', isActive: true },
      { id: 'CUR-CNY', code: 'CNY', name: 'Chinese Yuan', symbol: '¥', isActive: true },
      { id: 'CUR-SGD', code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', isActive: true },
    ];

    for (const currency of currencies) {
      const exists = await this.currencyRepository.findOne({ where: { code: currency.code } });
      if (!exists) {
        await this.currencyRepository.save(currency);
        console.log(`💱 Created currency: ${currency.code} (${currency.name})`);
      }
    }

    console.log('💱 Currencies seeded successfully');
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

    // Products with tubeSize
    const products = [
      {
        id: 'FG-001',
        name: 'TS-PART-001',
        category: 'Heat Exchanger',
        tubeSize: '1/2 inch',
        unit: 'piece',
        description: 'Heat exchanger tube assembly for automotive cooling system'
      },
      {
        id: 'FG-002',
        name: 'HN-PART-245',
        category: 'Condenser',
        tubeSize: '3/4 inch',
        unit: 'piece',
        description: 'AC condenser unit with copper tubes'
      },
      {
        id: 'FG-003',
        name: 'TY-PART-889',
        category: 'Radiator',
        tubeSize: '1 inch',
        unit: 'piece',
        description: 'Engine cooling radiator assembly'
      },
    ];

    for (const product of products) {
      const exists = await this.productRepository.findOne({ where: { id: product.id } });
      if (!exists) {
        await this.productRepository.save(product);
      }
    }

    // Raw Materials with category and itemGroup
    const rawMaterials = [
      {
        id: 'RM-AL-01',
        name: 'Aluminum Sheet 1.2mm',
        category: 'Metal Sheet',
        unit: 'kg',
        itemGroupCode: 'AL',
        itemGroup: 'Aluminum',
        description: 'High-grade aluminum sheet for heat exchanger manufacturing'
      },
      {
        id: 'RM-CU-02',
        name: 'Copper Wire 0.5mm',
        category: 'Metal Wire',
        unit: 'm',
        itemGroupCode: 'CU',
        itemGroup: 'Copper',
        description: 'Pure copper wire for electrical connections'
      },
      {
        id: 'RM-ST-03',
        name: 'Steel Coil 2.0mm',
        category: 'Metal Coil',
        unit: 'kg',
        itemGroupCode: 'ST',
        itemGroup: 'Steel',
        description: 'Cold-rolled steel coil for structural components'
      },
      {
        id: 'RM-PC-04',
        name: 'Polycarbonate Pellet',
        category: 'Plastic',
        unit: 'kg',
        itemGroupCode: 'PC',
        itemGroup: 'Plastic',
        description: 'Industrial-grade polycarbonate pellets for molding'
      },
    ];

    for (const material of rawMaterials) {
      const exists = await this.rawMaterialRepository.findOne({ where: { id: material.id } });
      if (!exists) {
        await this.rawMaterialRepository.save(material);
      }
    }

    // Employees
    const employees = [
      { empId: 'EMP001', name: 'สมชาย', surname: 'ใจดี' },
      { empId: 'EMP002', name: 'สมหญิง', surname: 'รักสงบ' },
      { empId: 'EMP003', name: 'วิชัย', surname: 'มั่นคง' },
      { empId: 'EMP004', name: 'อรุณี', surname: 'สว่างไสว' },
      { empId: 'EMP005', name: 'ประเสริฐ', surname: 'ศรีสุข' },
    ];

    for (const employee of employees) {
      const exists = await this.employeeRepository.findOne({ where: { empId: employee.empId } });
      if (!exists) {
        await this.employeeRepository.save(employee);
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
    // Fab Costs (matched with Item Group Codes like LME)
    const fabCosts = [
      {
        itemGroupName: 'Aluminum',
        itemGroupCode: 'AL',
        price: 150.00,
        currency: 'THB',
        description: 'Fabrication cost for Aluminum materials'
      },
      {
        itemGroupName: 'Copper',
        itemGroupCode: 'CU',
        price: 200.00,
        currency: 'THB',
        description: 'Fabrication cost for Copper materials'
      },
      {
        itemGroupName: 'Steel',
        itemGroupCode: 'ST',
        price: 180.00,
        currency: 'THB',
        description: 'Fabrication cost for Steel materials'
      },
      {
        itemGroupName: 'Plastic',
        itemGroupCode: 'PC',
        price: 120.00,
        currency: 'THB',
        description: 'Fabrication cost for Plastic materials'
      }
    ];

    for (const fabCost of fabCosts) {
      const exists = await this.fabCostRepository.findOne({
        where: { itemGroupCode: fabCost.itemGroupCode }
      });
      if (!exists) {
        await this.fabCostRepository.save(fabCost);
      }
    }

    // Standard Prices
    // ✅ StandardPrice extends ExternalDataEntity (sync จาก MongoDB)
    // Fields: id, rawMaterialId, price, currency, externalId, lastSyncAt, source, dataSource, isActive, createdAt, updatedAt, createdBy, updatedBy
    const standardPrices = [
      {
        rawMaterialId: 'RM-AL-01',
        price: 45.50,
        currency: 'THB',
        source: 'MONGODB',
        dataSource: 'MONGODB',
        isActive: true
      },
      {
        rawMaterialId: 'RM-CU-02',
        price: 125.00,
        currency: 'THB',
        source: 'MONGODB',
        dataSource: 'MONGODB',
        isActive: true
      },
      {
        rawMaterialId: 'RM-ST-03',
        price: 35.75,
        currency: 'THB',
        source: 'MONGODB',
        dataSource: 'MONGODB',
        isActive: true
      },
      {
        rawMaterialId: 'RM-PC-04',
        price: 68.25,
        currency: 'THB',
        source: 'MONGODB',
        dataSource: 'MONGODB',
        isActive: true
      }
    ];

    for (const standardPrice of standardPrices) {
      const exists = await this.standardPriceRepository.findOne({
        where: {
          rawMaterialId: standardPrice.rawMaterialId
        }
      });
      if (!exists) {
        await this.standardPriceRepository.save(standardPrice);
      }
    }

    // Selling Factors
    const sellingFactors = [
      {
        tubeSize: '1/2 inch',
        factor: 1.25,
        description: 'Standard selling factor for 1/2 inch tube'
      },
      {
        tubeSize: '3/4 inch',
        factor: 1.35,
        description: 'Selling factor for 3/4 inch tube'
      },
      {
        tubeSize: '1 inch',
        factor: 1.50,
        description: 'Premium selling factor for 1 inch tube'
      }
    ];

    for (const factor of sellingFactors) {
      const exists = await this.sellingFactorRepository.findOne({
        where: { tubeSize: factor.tubeSize }
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
    // ✅ LME Price ต้องเป็นหน่วย THB (ตามความต้องการของผู้ใช้)
    const lmeMasterData = [
      {
        itemGroupName: 'Aluminum',
        itemGroupCode: 'AL',
        price: 79200.00, // ✅ THB (2200 USD * 36 THB/USD)
        currency: 'THB',
        customerGroupId: null,
        description: 'LME price for aluminum calculation (THB)',
        status: 'Active', // ✅ Changed to Active
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      {
        itemGroupName: 'Copper',
        itemGroupCode: 'CU',
        price: 324000.00, // ✅ THB (9000 USD * 36 THB/USD)
        currency: 'THB',
        customerGroupId: null,
        description: 'LME price for copper calculation (THB)',
        status: 'Active', // ✅ Changed to Active
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
    // ✅ เพิ่ม THB → สกุลเงินอื่นๆ (Required สำหรับการคำนวณราคา)
    const exchangeRateMasterData = [
      // เดิม: สกุลเงินอื่น → THB
      {
        sourceCurrencyCode: 'USD',
        sourceCurrencyName: 'US Dollar',
        destinationCurrencyCode: 'THB',
        destinationCurrencyName: 'Thai Baht',
        rate: 36.00,
        customerGroupId: null,
        description: 'USD to THB rate for calculation',
        status: 'Active',
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
        status: 'Active',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      // ✅ ใหม่: THB → สกุลเงินอื่นๆ (Required for price calculation)
      {
        sourceCurrencyCode: 'THB',
        sourceCurrencyName: 'Thai Baht',
        destinationCurrencyCode: 'USD',
        destinationCurrencyName: 'US Dollar',
        rate: 0.0278, // 1 / 36.00
        customerGroupId: null,
        description: 'THB to USD rate for calculation',
        status: 'Active',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      {
        sourceCurrencyCode: 'THB',
        sourceCurrencyName: 'Thai Baht',
        destinationCurrencyCode: 'EUR',
        destinationCurrencyName: 'Euro',
        rate: 0.0250, // 1 / 40.00
        customerGroupId: null,
        description: 'THB to EUR rate for calculation',
        status: 'Active',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      {
        sourceCurrencyCode: 'THB',
        sourceCurrencyName: 'Thai Baht',
        destinationCurrencyCode: 'JPY',
        destinationCurrencyName: 'Japanese Yen',
        rate: 4.20, // 1 THB = ~4.20 JPY
        customerGroupId: null,
        description: 'THB to JPY rate for calculation',
        status: 'Active',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      {
        sourceCurrencyCode: 'THB',
        sourceCurrencyName: 'Thai Baht',
        destinationCurrencyCode: 'CNY',
        destinationCurrencyName: 'Chinese Yuan',
        rate: 0.20, // 1 THB = ~0.20 CNY
        customerGroupId: null,
        description: 'THB to CNY rate for calculation',
        status: 'Active',
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
        version: 1
      },
      {
        sourceCurrencyCode: 'THB',
        sourceCurrencyName: 'Thai Baht',
        destinationCurrencyCode: 'SGD',
        destinationCurrencyName: 'Singapore Dollar',
        rate: 0.0375, // 1 THB = ~0.0375 SGD
        customerGroupId: null,
        description: 'THB to SGD rate for calculation',
        status: 'Active',
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

    // Scrap Allowance
    const scrapAllowances = [
      {
        itemGroupName: 'Aluminum',
        itemGroupCode: 'AL',
        scrapPercentage: 0.05, // 5%
        description: 'Scrap allowance for Aluminum materials',
        status: 'Draft',
        version: 1,
        isActive: false
      },
      {
        itemGroupName: 'Copper',
        itemGroupCode: 'CU',
        scrapPercentage: 0.03, // 3%
        description: 'Scrap allowance for Copper materials',
        status: 'Draft',
        version: 1,
        isActive: false
      },
      {
        itemGroupName: 'Steel',
        itemGroupCode: 'ST',
        scrapPercentage: 0.04, // 4%
        description: 'Scrap allowance for Steel materials',
        status: 'Draft',
        version: 1,
        isActive: false
      },
      {
        itemGroupName: 'Plastic',
        itemGroupCode: 'PC',
        scrapPercentage: 0.08, // 8%
        description: 'Scrap allowance for Plastic materials',
        status: 'Draft',
        version: 1,
        isActive: false
      }
    ];

    for (const scrap of scrapAllowances) {
      const exists = await this.scrapAllowanceRepository.findOne({
        where: {
          itemGroupCode: scrap.itemGroupCode,
          status: scrap.status
        }
      });
      if (!exists) {
        await this.scrapAllowanceRepository.save(scrap);
      }
    }

    console.log('💰 Pricing data seeded successfully');
  }

  /**
   * Seed Hybrid Formula System
   * - Base Formula (default pricing formula)
   * - Custom Rules (VIP, Volume Discount, etc.)
   */
  private async seedHybridFormulaSystem() {
    // ✅ 1. Seed Base Formula
    const baseFormulaExists = await this.pricingFormulaRepository.findOne({
      where: { isDefault: true },
    });

    if (!baseFormulaExists) {
      const baseFormula = this.pricingFormulaRepository.create({
        name: 'Standard Pricing Formula',
        description: 'สูตรคำนวณราคามาตรฐาน (Default Base Formula)',
        materialCostFormula: 'sum(bomQuantity * unitPrice)',
        totalCostFormula: 'materialCost + fabCost',
        sellingPriceFormula: 'totalCost * sellingFactor',
        marginFormula: '(sellingPrice - totalCost) / totalCost * 100',
        exchangeRateFormula: 'sellingPrice * exchangeRate',
        customVariables: null,
        isDefault: true,
        customerGroupId: null, // ใช้กับทุก customer group
        status: 'Active',
        version: 1,
        createdBy: 'system',
        updatedBy: 'system',
        approvedBy: 'system',
        approvedAt: new Date(),
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
        isActive: true,
      });

      await this.pricingFormulaRepository.save(baseFormula);
      console.log('📐 Created default base formula');
    }

    // ✅ 2. Seed Custom Rules (Examples)

    // Rule 1: VIP Customer with LME Materials
    const rule1Exists = await this.pricingRuleRepository.findOne({
      where: { name: 'VIP Customer - LME Materials' },
    });

    if (!rule1Exists) {
      const rule1 = this.pricingRuleRepository.create({
        name: 'VIP Customer - LME Materials',
        description: 'ลูกค้า VIP ที่สั่งวัสดุที่มี LME Price - ใช้ LME + FAB และ margin 15%',
        priority: 1, // Highest priority
        conditions: {
          customerGroupId: 'CG-003', // VIP group
          hasLMEPrice: true,
        },
        overrideFormulas: {
          materialCostFormula: 'sum((lmePrice + fabCost) * bomQuantity)',
        },
        variableAdjustments: {
          sellingFactor: 1.15, // VIP margin 15%
        },
        actions: null,
        customerGroupId: 'CG-003',
        isGlobal: false,
        isActive: true,
        status: 'Active',
        version: 1,
        createdBy: 'system',
        updatedBy: 'system',
        approvedBy: 'system',
        approvedAt: new Date(),
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
      });

      await this.pricingRuleRepository.save(rule1);
      console.log('📋 Created rule: VIP Customer - LME Materials');
    }

    // Rule 2: Volume Discount (>= 1000 units)
    const rule2Exists = await this.pricingRuleRepository.findOne({
      where: { name: 'Volume Discount - 1000+ units' },
    });

    if (!rule2Exists) {
      const rule2 = this.pricingRuleRepository.create({
        name: 'Volume Discount - 1000+ units',
        description: 'ส่วนลด 3% สำหรับการสั่งซื้อตั้งแต่ 1000 units ขึ้นไป',
        priority: 2,
        conditions: {
          quantityMin: 1000,
        },
        overrideFormulas: null,
        variableAdjustments: null,
        actions: {
          applyDiscount: {
            formula: 'sellingPrice * 0.97', // 3% discount
            applyTo: 'sellingPrice',
          },
        },
        customerGroupId: null, // ใช้กับทุก customer group
        isGlobal: true,
        isActive: true,
        status: 'Active',
        version: 1,
        createdBy: 'system',
        updatedBy: 'system',
        approvedBy: 'system',
        approvedAt: new Date(),
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
      });

      await this.pricingRuleRepository.save(rule2);
      console.log('📋 Created rule: Volume Discount - 1000+ units');
    }

    // Rule 3: Premium Customer - Copper Materials
    const rule3Exists = await this.pricingRuleRepository.findOne({
      where: { name: 'Premium Customer - Copper' },
    });

    if (!rule3Exists) {
      const rule3 = this.pricingRuleRepository.create({
        name: 'Premium Customer - Copper',
        description: 'ลูกค้า Premium ที่สั่งผลิตภัณฑ์ทองแดง - margin 18%',
        priority: 3,
        conditions: {
          customerGroupId: 'CG-002', // Premium group
          rawMaterialType: 'COPPER',
        },
        overrideFormulas: null,
        variableAdjustments: {
          sellingFactor: 1.18, // Premium margin 18%
        },
        actions: null,
        customerGroupId: 'CG-002',
        isGlobal: false,
        isActive: true,
        status: 'Active',
        version: 1,
        createdBy: 'system',
        updatedBy: 'system',
        approvedBy: 'system',
        approvedAt: new Date(),
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
      });

      await this.pricingRuleRepository.save(rule3);
      console.log('📋 Created rule: Premium Customer - Copper');
    }

    // Rule 4: Standard Customer (Default - applies to CG-001)
    const rule4Exists = await this.pricingRuleRepository.findOne({
      where: { name: 'Standard Customer - Base Pricing' },
    });

    if (!rule4Exists) {
      const rule4 = this.pricingRuleRepository.create({
        name: 'Standard Customer - Base Pricing',
        description: 'ลูกค้ามาตรฐาน - ใช้ base formula ไม่มี adjustment',
        priority: 10, // Low priority (fallback)
        conditions: {
          customerGroupId: 'CG-001', // Standard group
        },
        overrideFormulas: null, // ใช้ base formula
        variableAdjustments: {
          sellingFactor: 1.25, // Standard margin 25%
        },
        actions: null,
        customerGroupId: 'CG-001',
        isGlobal: false,
        isActive: true,
        status: 'Active',
        version: 1,
        createdBy: 'system',
        updatedBy: 'system',
        approvedBy: 'system',
        approvedAt: new Date(),
        effectiveFrom: new Date('2024-01-01'),
        effectiveTo: null,
      });

      await this.pricingRuleRepository.save(rule4);
      console.log('📋 Created rule: Standard Customer - Base Pricing');
    }

    console.log('🎯 Hybrid Formula System seeded successfully');
  }
}
