// path: server/src/entities/pricing-formula.entity.ts
// version: 2.0 (Hybrid System - Base Formula)
// last-modified: 22 ตุลาคม 2568 17:20

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VersionedEntity } from './base.entity';

/**
 * PricingFormula Entity (Base Formula)
 *
 * Hybrid System:
 * - PricingFormula = Base Formula (ใช้เป็นพื้นฐานสำหรับทุก calculation)
 * - PricingRule = Custom Rules (override base formula ตาม conditions)
 *
 * Base Formula จะถูกใช้เป็นค่า default และสามารถถูก override ด้วย PricingRule
 *
 * ตัวอย่างสูตร:
 * - materialCostFormula: "sum(bomQuantity * unitPrice)"
 * - totalCostFormula: "materialCost + fabCost"
 * - sellingPriceFormula: "totalCost * sellingFactor"
 * - marginFormula: "(sellingPrice - totalCost) / totalCost * 100"
 */
@Entity('pricing_formulas')
export class PricingFormula extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ชื่อ Base Formula (เช่น "Standard Pricing Formula")
   */
  @Column()
  name: string;

  /**
   * คำอธิบาย Base Formula
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * สูตรคำนวณ Material Cost (Base)
   * Variables: bomQuantity, unitPrice, lmePrice, fabCost, standardPrice
   * Default: "sum(bomQuantity * unitPrice)"
   *
   * Note: สูตรนี้จะถูก override ด้วย PricingRule ถ้า rule conditions match
   */
  @Column({ type: 'text' })
  materialCostFormula: string;

  /**
   * สูตรคำนวณ Total Cost (Base)
   * Variables: materialCost, fabCost
   * Default: "materialCost + fabCost"
   */
  @Column({ type: 'text' })
  totalCostFormula: string;

  /**
   * สูตรคำนวณ Selling Price USD (Base)
   * Variables: totalCost, sellingFactor
   * Default: "totalCost * sellingFactor"
   */
  @Column({ type: 'text' })
  sellingPriceFormula: string;

  /**
   * สูตรคำนวณ Margin % (Base)
   * Variables: sellingPrice, totalCost
   * Default: "(sellingPrice - totalCost) / totalCost * 100"
   */
  @Column({ type: 'text' })
  marginFormula: string;

  /**
   * สูตรคำนวณ Exchange Rate (Optional)
   * Variables: sellingPrice, exchangeRate
   * Default: "sellingPrice * exchangeRate"
   */
  @Column({ type: 'text', nullable: true })
  exchangeRateFormula: string | null;

  /**
   * ตัวแปรเพิ่มเติมที่ใช้ในสูตร (JSON)
   * เช่น { "taxRate": 0.07, "overhead": 100 }
   */
  @Column({ type: 'json', nullable: true })
  customVariables: Record<string, number> | null;

  /**
   * Base Formula ที่ใช้เป็น default
   * ควรมีแค่ 1 formula ที่ isDefault = true
   */
  @Column({ default: false })
  isDefault: boolean;

  /**
   * Customer Group ID (Optional)
   * ถ้า null = ใช้กับทุก Customer Group
   * ถ้าระบุ = ใช้เฉพาะ Customer Group นี้
   */
  @Column({ nullable: true })
  customerGroupId: string | null;

  // Inherited from VersionedEntity:
  // - version: number
  // - status: 'Draft' | 'Active'
  // - approvedBy: string
  // - approvedAt: Date
  // - effectiveFrom: Date
  // - effectiveTo: Date
  // - isActive: boolean
  // - changeReason: string
  // - createdAt: Date
  // - updatedAt: Date
  // - createdBy: string
  // - updatedBy: string
}
