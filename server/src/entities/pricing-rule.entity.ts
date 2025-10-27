// path: server/src/entities/pricing-rule.entity.ts
// version: 1.0 (Hybrid System - Custom Rules)
// last-modified: 22 ตุลาคม 2568 17:15

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { VersionedEntity } from './base.entity';

/**
 * Conditions Interface
 * กำหนดเงื่อนไขที่ต้องตรงเพื่อให้ rule ถูกใช้
 */
export interface RuleConditions {
  customerGroupId?: string | string[]; // "CG-VIP" or ["CG-VIP", "CG-PREMIUM"]
  rawMaterialType?: string | string[]; // "COPPER" or ["COPPER", "ALUMINUM"]
  hasLMEPrice?: boolean; // ต้องมี LME Price หรือไม่
  quantityMin?: number; // Minimum quantity (>= n)
  quantityMax?: number; // Maximum quantity (< n)
  productId?: string | string[]; // Specific product(s)
  customCondition?: string; // Custom expression: "quantity >= 1000 && customerGroupId == 'VIP'"
}

/**
 * Override Formulas Interface
 * สูตรที่จะ override base formula
 */
export interface OverrideFormulas {
  materialCostFormula?: string; // Override material cost calculation
  totalCostFormula?: string; // Override total cost calculation
  sellingPriceFormula?: string; // Override selling price calculation
  marginFormula?: string; // Override margin calculation
  exchangeRateFormula?: string; // Override exchange rate calculation
}

/**
 * Variable Adjustments Interface
 * ปรับค่าตัวแปรก่อนใช้ในสูตร
 */
export interface VariableAdjustments {
  sellingFactor?: number | string; // Override or adjust selling factor
  fabCost?: number | string; // Override or adjust fab cost
  exchangeRate?: number | string; // Override or adjust exchange rate
  discount?: number; // Apply discount percentage (0.05 = 5%)
  [key: string]: number | string | undefined; // Allow custom variables
}

/**
 * Actions Interface
 * การกระทำที่จะทำเมื่อ rule match
 */
export interface RuleActions {
  applyDiscount?: {
    formula: string; // "totalCost * 0.05"
    applyTo: 'sellingPrice' | 'totalCost'; // ใช้กับอะไร
  };
  adjustMargin?: {
    formula: string; // "margin + 2"
  };
  setMinimumPrice?: {
    value: number; // Minimum selling price
  };
  [key: string]: any; // Allow custom actions
}

@Entity('pricing_rules')
export class PricingRule extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // "VIP Customer - Copper with LME"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  priority: number; // 1 = highest priority, ยิ่งน้อยยิ่งก่อน

  /**
   * Conditions - เงื่อนไขที่ต้องตรงทุกข้อจึงจะใช้ rule นี้
   * ใช้ JSON format สำหรับความยืดหยุ่น
   */
  @Column({ type: 'json' })
  conditions: RuleConditions;

  /**
   * Override Formulas - สูตรที่จะแทนที่ base formula
   * ถ้าไม่ระบุ จะใช้ base formula
   */
  @Column({ type: 'json', nullable: true })
  overrideFormulas: OverrideFormulas | null;

  /**
   * Variable Adjustments - ปรับค่าตัวแปรก่อนใช้ในสูตร
   * ใช้สำหรับ override หรือ adjust ค่าต่างๆ
   */
  @Column({ type: 'json', nullable: true })
  variableAdjustments: VariableAdjustments | null;

  /**
   * Actions - การกระทำพิเศษที่จะทำเมื่อ rule match
   * เช่น apply discount, adjust margin, etc.
   */
  @Column({ type: 'json', nullable: true })
  actions: RuleActions | null;

  /**
   * Customer Group ID - ถ้าระบุจะใช้เฉพาะ customer group นี้
   * ถ้าไม่ระบุ (null) จะใช้กับทุก customer group
   */
  @Column({ nullable: true })
  customerGroupId: string | null;

  @Column({ default: true })
  isActive: boolean;

  /**
   * Global Rule - ใช้กับทุก customer group
   * ถ้า true จะไม่สนใจ customerGroupId
   */
  @Column({ default: false })
  isGlobal: boolean;

  // NOTE: version, createdAt, updatedAt, createdBy, updatedBy, approvedBy, approvedAt
  // are inherited from VersionedEntity
}
