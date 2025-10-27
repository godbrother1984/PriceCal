// path: server/src/price-calculation/price-calculation.service.ts
// version: 3.4 (Remove FAB Cost (Product) from calculation)
// last-modified: 27 ตุลาคม 2568 16:40

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CustomerMapping } from '../entities/customer-mapping.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { RawMaterialFabCost } from '../entities/raw-material-fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { PricingFormula } from '../entities/pricing-formula.entity';
import { PricingRule } from '../entities/pricing-rule.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { FormulaEngineService } from '../formula-engine/formula-engine.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { PricingContext, AppliedRule } from './pricing-context.interface';

export interface CalculationInput {
  productId: string;
  quantity: number;
  customerId?: string;
  customerGroupId?: string;
  currency?: string; // ✅ สกุลเงินที่ลูกค้าต้องการ (THB, USD, EUR, JPY, CNY, SGD)
  specialRequests?: any[];
}

export interface MaterialCostDetail {
  rawMaterialId: string;
  rawMaterialName: string;
  bomQuantity: number;
  bomUnit: string;
  unitPrice: number; // ✅ ราคาต่อหน่วยของ RM (THB/KG)
  costPerUnit: number; // ✅ ต้นทุน RM ต่อ 1 unit Product (THB/unit)
  totalCost: number; // ✅ ต้นทุน RM รวมทั้งหมด (THB)
  lmePrice?: number;
  rmFabCost?: number; // FAB Cost for Raw Material (used with LME)
  standardPrice?: number;
  priceSource: 'LME' | 'Standard' | 'None';
}

export interface CalculationResult {
  productId: string;
  productName: string;
  quantity: number;

  // Customer Group Info (for display)
  customerGroupId?: string;
  customerGroupName?: string;
  isUsingDefaultGroup?: boolean; // แสดงว่าใช้ Default Customer Group หรือไม่

  // Hybrid Formula System (NEW)
  appliedRules?: AppliedRule[]; // Rules ที่ถูก apply (audit trail)

  // Material Costs (✅ THB เป็นสกุลเงินหลัก)
  materialCosts: MaterialCostDetail[];
  totalMaterialCost: number; // ✅ ต้นทุนวัตถุดิบรวม (THB)

  // FAB Cost (Fabrication Cost) (✅ THB)
  fabCost: number; // ✅ ต้นทุน FAB รวม (THB)
  fabCostPerUnit: number; // ✅ ต้นทุน FAB ต่อหน่วย (THB)

  // Total Cost (✅ THB - Base Currency)
  totalCost: number; // ✅ ต้นทุนรวมทั้งหมด (THB)
  costPerUnit: number; // ✅ ต้นทุนต่อหน่วย (THB)

  // Selling Price (✅ THB - Base Currency)
  sellingFactor: number;
  sellingPrice: number; // ✅ ราคาขายใน THB (Base)
  sellingPricePerUnit: number; // ✅ ราคาขายต่อหน่วยใน THB (Base)

  // Exchange Rate & Multi-Currency Support
  requestedCurrency: string; // ✅ สกุลเงินที่ลูกค้าต้องการ
  exchangeRate: number; // ✅ อัตราแลกเปลี่ยน THB → Requested Currency
  sellingPriceInRequestedCurrency: number; // ✅ ราคาขายในสกุลเงินที่ต้องการ
  sellingPricePerUnitInRequestedCurrency: number; // ✅ ราคาขายต่อหน่วยในสกุลเงินที่ต้องการ

  // Legacy THB fields (for backward compatibility)
  sellingPriceThb: number; // ✅ เหมือนกับ sellingPrice (THB เป็น Base)
  sellingPriceThbPerUnit: number; // ✅ เหมือนกับ sellingPricePerUnit (THB เป็น Base)

  // Margin (✅ THB)
  marginPercentage: number;
  marginAmount: number; // ✅ กำไร (THB)

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

    @InjectRepository(CustomerMapping)
    private customerMappingRepository: Repository<CustomerMapping>,

    @InjectRepository(CustomerGroup)
    private customerGroupRepository: Repository<CustomerGroup>,

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

    @InjectRepository(RawMaterialFabCost)
    private rawMaterialFabCostRepository: Repository<RawMaterialFabCost>,

    @InjectRepository(SellingFactor)
    private sellingFactorRepository: Repository<SellingFactor>,

    @InjectRepository(ExchangeRateMasterData)
    private exchangeRateRepository: Repository<ExchangeRateMasterData>,

    @InjectRepository(PricingFormula)
    private pricingFormulaRepository: Repository<PricingFormula>,

    @InjectRepository(PricingRule)
    private pricingRuleRepository: Repository<PricingRule>,

    private activityLogService: ActivityLogService,
    private formulaEngineService: FormulaEngineService,
    private ruleEngineService: RuleEngineService,
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

    // 2. ดึง Customer Group ID จาก CustomerMapping (ถ้ามี customerId)
    let customerGroupId = input.customerGroupId;
    let customerGroupName: string | undefined;
    let isUsingDefaultGroup = false;

    if (input.customerId && !customerGroupId) {
      const mapping = await this.customerMappingRepository.findOne({
        where: {
          customerId: input.customerId,
          isActive: true,
        },
        relations: ['customerGroup'],
      });

      if (mapping && mapping.customerGroupId) {
        customerGroupId = mapping.customerGroupId;
        customerGroupName = mapping.customerGroup?.name;
        this.logger.log(`Using customerGroupId ${customerGroupId} (${customerGroupName}) from CustomerMapping for customer ${input.customerId}`);
      } else {
        this.logger.warn(`No CustomerMapping found for customer ${input.customerId} - querying default Customer Group`);

        // ✅ Query หา Default Customer Group
        const defaultGroup = await this.customerGroupRepository.findOne({
          where: { isDefault: true, isActive: true },
        });

        if (defaultGroup) {
          customerGroupId = defaultGroup.id;
          customerGroupName = defaultGroup.name;
          isUsingDefaultGroup = true;
          this.logger.log(`Using default Customer Group: ${customerGroupId} (${customerGroupName})`);
        } else {
          this.logger.error('No default Customer Group found in database!');
        }
      }
    } else if (!customerGroupId) {
      // ถ้าไม่มี customerId และไม่มี customerGroupId → ใช้ default
      const defaultGroup = await this.customerGroupRepository.findOne({
        where: { isDefault: true, isActive: true },
      });

      if (defaultGroup) {
        customerGroupId = defaultGroup.id;
        customerGroupName = defaultGroup.name;
        isUsingDefaultGroup = true;
        this.logger.log(`No customer specified - using default Customer Group: ${customerGroupId} (${customerGroupName})`);
      }
    }

    // 3. ดึง BOQ (Bill of Quantities) ของ Product
    const bomItems = await this.bomRepository.find({
      where: { productId: input.productId },
      relations: ['rawMaterial'],
    });

    if (!bomItems || bomItems.length === 0) {
      throw new NotFoundException(`No BOQ found for product ${input.productId}`);
    }

    // 4. คำนวณ Material Costs จาก BOQ (ใช้ customerGroupId ที่ได้)
    const materialCosts = await this.calculateMaterialCosts(bomItems, input.quantity, customerGroupId);
    const totalMaterialCost = materialCosts.reduce((sum, item) => sum + item.totalCost, 0);

    // 5. ❌ ไม่ใช้ FAB Cost (Product) ในการคำนวณ (ตามคำร้องขอ)
    // const fabCostPerUnit = await this.getFabCost(customerGroupId);
    // const fabCost = fabCostPerUnit * input.quantity;
    const fabCostPerUnit = 0; // ไม่ใช้
    const fabCost = 0; // ไม่ใช้

    // 6. คำนวณ Total Cost (ไม่รวม FAB Cost Product)
    const totalCost = totalMaterialCost; // ไม่รวม fabCost
    const costPerUnit = totalCost / input.quantity;

    // 7. ดึง Selling Factor - ใช้ customerGroupId จาก Customer
    const sellingFactor = await this.getSellingFactor(customerGroupId);
    const sellingPrice = totalCost * sellingFactor;
    const sellingPricePerUnit = sellingPrice / input.quantity;

    // 8. ดึง Exchange Rate และแปลงเป็น THB - ใช้ customerGroupId จาก Customer
    const exchangeRate = await this.getExchangeRate(customerGroupId);
    const sellingPriceThb = sellingPrice * exchangeRate;
    const sellingPriceThbPerUnit = sellingPriceThb / input.quantity;

    // 9. คำนวณ Margin
    const marginAmount = sellingPrice - totalCost;
    const marginPercentage = (marginAmount / totalCost) * 100;

    // 9.5 Multi-Currency Support (✅ แปลงจาก THB → สกุลที่ต้องการ)
    const requestedCurrency = input.currency || 'THB';
    let exchangeRateToRequestedCurrency = 1; // Default THB → THB
    let sellingPriceInRequestedCurrency = sellingPrice; // Default = THB
    let sellingPricePerUnitInRequestedCurrency = sellingPricePerUnit;

    if (requestedCurrency !== 'THB') {
      const rate = await this.getExchangeRateFromThbToCurrency(requestedCurrency, customerGroupId);
      exchangeRateToRequestedCurrency = rate;
      sellingPriceInRequestedCurrency = sellingPrice / rate; // ✅ THB ÷ Rate
      sellingPricePerUnitInRequestedCurrency = sellingPricePerUnit / rate;
    }

    // 10. เก็บ Master Data Versions - ใช้ customerGroupId จาก Customer
    const masterDataVersions = await this.getMasterDataVersions(customerGroupId);

    const result: CalculationResult = {
      productId: product.id,
      productName: product.name,
      quantity: input.quantity,

      // Customer Group Info
      customerGroupId,
      customerGroupName,
      isUsingDefaultGroup, // ✅ แสดงว่าใช้ Default Customer Group หรือไม่

      materialCosts,
      totalMaterialCost,

      fabCost,
      fabCostPerUnit,

      totalCost,
      costPerUnit,

      sellingFactor,
      sellingPrice,
      sellingPricePerUnit,

      // ✅ Multi-Currency Support
      requestedCurrency,
      exchangeRate: exchangeRateToRequestedCurrency,
      sellingPriceInRequestedCurrency,
      sellingPricePerUnitInRequestedCurrency,

      // Legacy THB fields
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
   * คำนวณราคาด้วย Hybrid Formula System (NEW - Optional)
   * ใช้ Base Formula + Custom Rules แทน hardcoded formulas
   *
   * @param input - ข้อมูล input สำหรับการคำนวณ
   * @returns CalculationResult พร้อม appliedRules audit trail
   */
  async calculatePriceWithHybridSystem(input: CalculationInput): Promise<CalculationResult> {
    this.logger.log(`🎯 Calculating price with Hybrid Formula System for product ${input.productId}, quantity ${input.quantity}`);

    // 1. ดึงข้อมูล Product
    const product = await this.productRepository.findOne({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }

    // 2. ดึง Customer Group ID
    let customerGroupId = input.customerGroupId;
    let customerGroupName: string | undefined;
    let isUsingDefaultGroup = false;

    if (input.customerId && !customerGroupId) {
      const mapping = await this.customerMappingRepository.findOne({
        where: { customerId: input.customerId, isActive: true },
        relations: ['customerGroup'],
      });

      if (mapping && mapping.customerGroupId) {
        customerGroupId = mapping.customerGroupId;
        customerGroupName = mapping.customerGroup?.name;
      } else {
        // Use default customer group
        const defaultGroup = await this.customerGroupRepository.findOne({
          where: { isDefault: true, isActive: true },
        });

        if (defaultGroup) {
          customerGroupId = defaultGroup.id;
          customerGroupName = defaultGroup.name;
          isUsingDefaultGroup = true;
        }
      }
    }

    // 3. ดึง BOQ
    const bomItems = await this.bomRepository.find({
      where: { productId: input.productId },
      relations: ['rawMaterial'],
    });

    if (!bomItems || bomItems.length === 0) {
      throw new NotFoundException(`No BOQ found for product ${input.productId}`);
    }

    // 4. เตรียม PricingContext สำหรับ Hybrid System
    const context: PricingContext = {
      productId: input.productId,
      productName: product.name,
      customerId: input.customerId,
      customerGroupId,
      customerGroupName,
      quantity: input.quantity,
      materials: await Promise.all(
        bomItems.map(async (item) => ({
          id: item.rawMaterial.id,
          name: item.rawMaterial.name,
          type: item.rawMaterial.itemGroupCode || 'UNKNOWN',
          hasLMEPrice: !!(await this.getLmePrice(item.rawMaterial.itemGroupCode, customerGroupId)),
          lmePrice: await this.getLmePrice(item.rawMaterial.itemGroupCode, customerGroupId),
          standardPrice: await this.getStandardPrice(item.rawMaterial.id),
          fabCost: await this.getRawMaterialFabCost(item.rawMaterial.id, customerGroupId),
          bomQuantity: item.quantity,
        }))
      ),
    };

    // 5. Load Base Formula
    const baseFormula = await this.pricingFormulaRepository.findOne({
      where: { isDefault: true, isActive: true },
    });

    if (!baseFormula) {
      this.logger.warn('No default base formula found - falling back to hardcoded calculation');
      return this.calculatePrice(input); // Fallback to original method
    }

    // 6. Find Matching Rules
    const matchedRules = await this.ruleEngineService.findMatchingRules(context);
    this.logger.log(`Found ${matchedRules.length} matching rules`);

    // 7. Merge Formulas (Base + Rules)
    const mergedFormulas = this.formulaEngineService.mergeFormulas(baseFormula, matchedRules);
    this.logger.log(`Applied ${mergedFormulas.appliedRules.length} rule modifications`);

    // 8. เตรียม Variables สำหรับการคำนวณ
    const materialCosts = await this.calculateMaterialCosts(bomItems, input.quantity, customerGroupId);
    const totalMaterialCost = materialCosts.reduce((sum, item) => sum + item.totalCost, 0);
    // ❌ ไม่ใช้ FAB Cost (Product) ในการคำนวณ
    // const fabCostPerUnit = await this.getFabCost(customerGroupId);
    // const fabCost = fabCostPerUnit * input.quantity;
    const fabCostPerUnit = 0; // ไม่ใช้
    const fabCost = 0; // ไม่ใช้
    const sellingFactor = await this.getSellingFactor(customerGroupId);
    const exchangeRate = await this.getExchangeRate(customerGroupId);

    let variables: Record<string, any> = {
      // Material Costs
      materialCost: totalMaterialCost,
      fabCost,
      fabCostPerUnit,

      // Pricing Factors
      sellingFactor,
      exchangeRate,

      // Quantity
      quantity: input.quantity,

      // Context
      customerGroupId,
      productId: input.productId,
    };

    // 9. Apply Variable Adjustments from Rules
    variables = this.formulaEngineService.applyVariableAdjustments(
      variables,
      mergedFormulas.variableAdjustments,
    );

    // 10. คำนวณด้วย Merged Formulas (✅ ทุกอย่างเป็น THB)
    const totalCost = this.formulaEngineService.evaluateFormula(
      mergedFormulas.totalCostFormula,
      variables,
    );
    const costPerUnit = totalCost / input.quantity;

    const sellingPrice = this.formulaEngineService.evaluateFormula(
      mergedFormulas.sellingPriceFormula,
      { ...variables, totalCost },
    );
    const sellingPricePerUnit = sellingPrice / input.quantity;

    // ✅ sellingPrice และ sellingPriceThb เป็นค่าเดียวกัน (THB เป็น Base Currency)
    const sellingPriceThb = sellingPrice;
    const sellingPriceThbPerUnit = sellingPricePerUnit;

    const marginAmount = sellingPrice - totalCost;
    const marginPercentage = (marginAmount / totalCost) * 100;

    // ✅ 10.5 แปลงราคาเป็นสกุลเงินที่ลูกค้าต้องการ (THB → Target Currency)
    const requestedCurrency = input.currency || 'THB'; // Default THB
    let exchangeRateToRequestedCurrency = 1; // Default THB → THB = 1
    let sellingPriceInRequestedCurrency = sellingPrice; // Default = THB
    let sellingPricePerUnitInRequestedCurrency = sellingPricePerUnit;

    if (requestedCurrency !== 'THB') {
      // ✅ ถ้าต้องการสกุลเงินอื่น ต้องแปลงจาก THB → Target Currency
      const rate = await this.getExchangeRateFromThbToCurrency(requestedCurrency, customerGroupId);
      exchangeRateToRequestedCurrency = rate;
      sellingPriceInRequestedCurrency = sellingPrice / rate; // ✅ THB ÷ Rate = Target Currency
      sellingPricePerUnitInRequestedCurrency = sellingPricePerUnit / rate;

      this.logger.log(
        `💱 Currency Conversion: THB ${sellingPrice.toFixed(2)} → ${requestedCurrency} ${sellingPriceInRequestedCurrency.toFixed(2)} (Rate: 1 ${requestedCurrency} = ${rate.toFixed(4)} THB)`,
      );
    }

    // 11. Build Result with Audit Trail
    const result: CalculationResult = {
      productId: product.id,
      productName: product.name,
      quantity: input.quantity,

      // Customer Group Info
      customerGroupId,
      customerGroupName,
      isUsingDefaultGroup,

      // ✅ Hybrid System Audit Trail
      appliedRules: mergedFormulas.appliedRules,

      // Material Costs
      materialCosts,
      totalMaterialCost,

      // FAB Cost
      fabCost,
      fabCostPerUnit,

      // Total Cost
      totalCost,
      costPerUnit,

      // Selling Price (USD - Base Currency)
      sellingFactor: variables.sellingFactor, // May be adjusted by rules
      sellingPrice, // ราคาขาย USD (Base)
      sellingPricePerUnit, // ราคาขายต่อหน่วย USD (Base)

      // ✅ Multi-Currency Support
      requestedCurrency,
      exchangeRate: exchangeRateToRequestedCurrency,
      sellingPriceInRequestedCurrency,
      sellingPricePerUnitInRequestedCurrency,

      // Legacy THB fields (for backward compatibility)
      sellingPriceThb,
      sellingPriceThbPerUnit,

      // Margin
      marginPercentage,
      marginAmount,

      // Master Data Versions
      masterDataVersions: await this.getMasterDataVersions(customerGroupId),

      calculatedAt: new Date(),
    };

    this.logger.log(
      `🎯 Hybrid calculation completed: Total Cost = ${totalCost.toFixed(2)} THB, ` +
      `Selling Price = ${sellingPrice.toFixed(2)} THB (${sellingPriceInRequestedCurrency.toFixed(2)} ${requestedCurrency}), ` +
      `Rules applied: ${mergedFormulas.appliedRules.length}`,
    );

    // บันทึก Activity Log
    try {
      await this.activityLogService.logPriceCalculation(
        input.productId,
        'system',
        'System (Hybrid)',
        product.id,
        product.name,
        input.quantity,
        result,
      );
    } catch (error) {
      this.logger.error(`Failed to log price calculation: ${error.message}`);
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

    this.logger.debug(`[calculateMaterialCosts] Processing ${bomItems.length} BOM items`);

    for (const bomItem of bomItems) {
      const rawMaterial = bomItem.rawMaterial;

      this.logger.debug(`[calculateMaterialCosts] RM: ${rawMaterial.id}, itemGroupCode: ${rawMaterial.itemGroupCode}`);

      // ดึงราคา LME Price (ใช้ itemGroupCode ในการ match)
      const lmePrice = await this.getLmePrice(rawMaterial.itemGroupCode, customerGroupId);
      this.logger.debug(`[calculateMaterialCosts]   LME Price: ${lmePrice}`);

      // ดึงราคา Standard Price
      const standardPrice = await this.getStandardPrice(rawMaterial.id);
      this.logger.debug(`[calculateMaterialCosts]   Standard Price: ${standardPrice}`);

      // ดึงราคา Raw Material FAB Cost (ใช้คู่กับ LME Price)
      const rmFabCost = await this.getRawMaterialFabCost(rawMaterial.id, customerGroupId);
      this.logger.debug(`[calculateMaterialCosts]   RM FAB Cost: ${rmFabCost}`);

      // ลำดับความสำคัญ: (LME Price + FAB Cost) > Standard Price
      let unitPrice = 0;
      let priceSource: 'LME' | 'Standard' | 'None' = 'None';

      if (lmePrice !== null) {
        // ✅ สูตร: Unit Price = LME Price + FAB Cost
        unitPrice = lmePrice + rmFabCost;
        priceSource = 'LME';
        this.logger.debug(`[calculateMaterialCosts]   Using LME: ${lmePrice} + ${rmFabCost} = ${unitPrice}`);
      } else if (standardPrice !== null) {
        // Standard Price รวม FAB Cost ไว้แล้ว
        unitPrice = standardPrice;
        priceSource = 'Standard';
        this.logger.debug(`[calculateMaterialCosts]   Using Standard: ${standardPrice}`);
      } else {
        this.logger.warn(`[calculateMaterialCosts]   ⚠️  No price found for ${rawMaterial.id}`);
      }

      // คำนวณต้นทุน RM
      // costPerUnit = ต้นทุน RM ต่อ 1 unit Product
      const costPerUnit = bomItem.quantity * unitPrice;

      // totalCost = ต้นทุน RM รวมทั้งหมด (สำหรับ quantity ที่สั่ง)
      const totalCost = costPerUnit * quantity;

      materialCosts.push({
        rawMaterialId: rawMaterial.id,
        rawMaterialName: rawMaterial.name,
        bomQuantity: bomItem.quantity,
        bomUnit: bomItem.unit,
        unitPrice, // ราคาต่อหน่วยของ RM (USD/KG)
        costPerUnit, // ต้นทุน RM ต่อ 1 unit Product
        totalCost, // ต้นทุน RM รวมทั้งหมด
        lmePrice: lmePrice !== null ? lmePrice : undefined,
        rmFabCost: rmFabCost > 0 ? rmFabCost : undefined,
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
    // ✅ Debug: ดูว่ามี Standard Price อะไรบ้างใน database
    const allPrices = await this.standardPriceRepository.find({
      where: { isActive: true, status: 'Active' },
      relations: ['rawMaterial'],
      take: 10,
    });
    this.logger.log(`[getStandardPrice] DEBUG: All active Standard Prices: ${JSON.stringify(allPrices.map(p => ({ rawMaterialId: p.rawMaterialId, name: p.rawMaterial?.name || 'N/A', price: p.price })))}`);

    const pricing = await this.standardPriceRepository.findOne({
      where: {
        rawMaterialId,
        isActive: true,
        status: 'Active', // ต้องเป็น Active (Approved)
      },
      order: { version: 'DESC' },
    });

    this.logger.log(`[getStandardPrice] RM: ${rawMaterialId}, Found: ${pricing ? 'YES' : 'NO'}, Price: ${pricing ? pricing.price : 'N/A'}, Status: ${pricing ? pricing.status : 'N/A'}, rawMaterialId: ${pricing ? pricing.rawMaterialId : 'N/A'}`);

    return pricing ? Number(pricing.price) : null;
  }

  /**
   * ดึง LME Price จาก LmeMasterData entity
   */
  private async getLmePrice(itemGroupCode: string | null | undefined, customerGroupId?: string): Promise<number | null> {
    // ถ้าไม่มี itemGroupCode หรือเป็น null = วัตถุดิบนี้ไม่มี LME Price
    if (!itemGroupCode) {
      return null;
    }

    // ถ้ามี customerGroupId ให้หาตาม customerGroupId ก่อน
    let pricing = null;

    if (customerGroupId) {
      pricing = await this.lmeMasterDataRepository.findOne({
        where: {
          itemGroupCode,
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
          itemGroupCode,
          customerGroupId: IsNull(), // ต้องเป็น null (base price)
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    return pricing ? Number(pricing.price) : null;
  }

  /**
   * ดึง Raw Material FAB Cost
   * ใช้คู่กับ LME Price เพื่อคำนวณมูลค่า RM จริง
   *
   * สูตร: Unit Price = LME Price + FAB Cost
   *
   * @param rawMaterialId - Raw Material ID
   * @param customerGroupId - Customer Group ID (optional)
   * @returns FAB Cost (default 0 ถ้าไม่มี)
   */
  private async getRawMaterialFabCost(
    rawMaterialId: string,
    customerGroupId?: string,
  ): Promise<number> {
    let fabCost = null;

    // 1. ถ้ามี customerGroupId ให้หาตาม customerGroupId ก่อน
    if (customerGroupId) {
      fabCost = await this.rawMaterialFabCostRepository.findOne({
        where: {
          rawMaterialId,
          customerGroupId,
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    // 2. ถ้าไม่เจอ ให้หาแบบทั่วไป (customerGroupId = null)
    if (!fabCost) {
      fabCost = await this.rawMaterialFabCostRepository.findOne({
        where: {
          rawMaterialId,
          customerGroupId: null, // General FAB Cost
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    // Default = 0 ถ้าไม่มีการตั้งค่า FAB Cost
    return fabCost ? Number(fabCost.fabCost) : 0;
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
   * ✅ ดึง Exchange Rate สำหรับแปลงจาก THB → Target Currency
   * ตัวอย่าง: 1 USD = 35 THB → rate = 35
   */
  private async getExchangeRateFromThbToCurrency(targetCurrency: string, customerGroupId?: string): Promise<number> {
    let pricing = null;

    // ✅ หา rate แบบ THB → Target Currency
    if (customerGroupId) {
      pricing = await this.exchangeRateRepository.findOne({
        where: {
          customerGroupId,
          sourceCurrencyCode: 'THB',
          destinationCurrencyCode: targetCurrency,
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    if (!pricing) {
      pricing = await this.exchangeRateRepository.findOne({
        where: {
          sourceCurrencyCode: 'THB',
          destinationCurrencyCode: targetCurrency,
          isActive: true,
          status: 'Active',
        },
        order: { version: 'DESC' },
      });
    }

    if (!pricing) {
      // ✅ ถ้าไม่พบ ให้ใช้ค่า default (1 สกุลเงิน = X บาท)
      const defaultRates: Record<string, number> = {
        USD: 35.0,   // 1 USD = 35 THB
        EUR: 38.0,   // 1 EUR = 38 THB
        JPY: 0.24,   // 1 JPY = 0.24 THB
        CNY: 4.85,   // 1 CNY = 4.85 THB
        SGD: 26.0,   // 1 SGD = 26 THB
      };

      const rate = defaultRates[targetCurrency] || 1.0;
      this.logger.warn(`Exchange rate for THB → ${targetCurrency} not found, using default rate: 1 ${targetCurrency} = ${rate} THB`);
      return rate;
    }

    return Number(pricing.rate);
  }

  /**
   * ✅ DEPRECATED: ใช้ getExchangeRateFromThbToCurrency แทน
   * @deprecated
   */
  private async getExchangeRateForCurrency(targetCurrency: string, customerGroupId?: string): Promise<number> {
    return this.getExchangeRateFromThbToCurrency(targetCurrency, customerGroupId);
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
