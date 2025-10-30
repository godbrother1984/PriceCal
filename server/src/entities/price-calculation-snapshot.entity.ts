// path: server/src/entities/price-calculation-snapshot.entity.ts
// version: 1.0 (Complete Snapshot for Price Calculation)
// last-modified: 29 ตุลาคม 2568 04:15

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Price Calculation Snapshot Entity
 *
 * บันทึกทุกอย่างที่ใช้ในการคำนวณราคา เป็น Complete Snapshot
 * รวมถึง: Customer, Product, BOM, Master Data, Overrides (พร้อม versions)
 *
 * ใช้สำหรับ:
 * - Audit Trail (ตรวจสอบย้อนหลังว่าใช้ค่าอะไรคำนวณ)
 * - Document Control (เห็นว่าใช้ version ไหน Active ตอนนั้น)
 * - Dispute Resolution (แก้ไขข้อโต้แย้งเรื่องราคา)
 */
@Entity('price_calculation_snapshots')
export class PriceCalculationSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Calculation Metadata
  @Column({ type: 'datetime' })
  calculatedAt: Date;

  @Column()
  calculatedBy: string; // User ID

  @Column({ nullable: true })
  requestId: string; // Reference to PriceRequest (optional)

  // Request Info (Snapshot)
  @Column({ type: 'json' })
  request: {
    customerId: string;
    productId: string;
    quantity: number;
    targetCurrency: string;
  };

  // Customer Info (Snapshot from MongoDB)
  @Column({ type: 'json' })
  customer: {
    id: string;
    code: string;
    name: string;
    address?: string;
    taxId?: string;
    customerGroupId?: string;
    customerGroupCode?: string;
    customerGroupName?: string;
  };

  // Product Info (Snapshot from MongoDB)
  @Column({ type: 'json' })
  product: {
    id: string;
    code: string;
    name: string;
    description?: string;
    unit: string;
    category?: string;
  };

  // BOM Snapshot (Complete)
  @Column({ type: 'json' })
  bom: {
    id: string;
    productId: string;
    version: number;
    items: Array<{
      rawMaterialId: string;
      rawMaterialCode: string;
      rawMaterialName: string;
      rawMaterialUnit: string;
      quantity: number;

      // Standard Price Used (Snapshot)
      standardPrice?: {
        id: string;
        version: number;
        price: number;
        currency: string;
        effectiveFrom: Date;
        isOverride: boolean;
        customerGroupId?: string;
        approvedBy: string;
        approvedAt: Date;
      };

      // LME Price Used (Snapshot)
      lmePrice?: {
        id: string;
        version: number;
        itemGroupCode: string;
        itemGroupName: string;
        price: number;
        currency: string;
        priceDate: Date;
        isOverride: boolean;
        customerGroupId?: string;
        approvedBy: string;
        approvedAt: Date;
      };

      // FAB Cost Used (Snapshot)
      fabCost?: {
        id: string;
        version: number;
        itemGroupCode: string;
        itemGroupName: string;
        price: number;
        currency: string;
        effectiveFrom: Date;
        isOverride: boolean;
        customerGroupId?: string;
        approvedBy: string;
        approvedAt: Date;
      };

      // Calculated RM Price
      calculatedPrice: number;
      calculatedCurrency: string;
      calculationMethod: string; // 'standard_price', 'lme_plus_fab', etc.
    }>;
  };

  // Exchange Rate Used (Snapshot)
  @Column({ type: 'json' })
  exchangeRate: {
    id: string;
    version: number;
    sourceCurrencyCode: string;
    sourceCurrencyName: string;
    destinationCurrencyCode: string;
    destinationCurrencyName: string;
    rate: number;
    effectiveFrom: Date;
    isOverride: boolean;
    customerGroupId?: string;
    approvedBy: string;
    approvedAt: Date;
  };

  // Selling Factor Used (Snapshot)
  @Column({ type: 'json' })
  sellingFactor: {
    id: string;
    version: number;
    patternCode: string;
    patternName: string;
    factor: number;
    effectiveFrom: Date;
    isOverride: boolean;
    customerGroupId?: string;
    approvedBy: string;
    approvedAt: Date;
  };

  // Calculation Results
  @Column({ type: 'json' })
  results: {
    totalMaterialCost: number;
    materialCostCurrency: string;

    totalMaterialCostInTargetCurrency: number;
    targetCurrency: string;

    sellingPrice: number;
    sellingPriceCurrency: string;

    profitMargin?: number;
    profitMarginPercent?: number;

    breakdown: {
      materialCosts: Array<{
        rawMaterialCode: string;
        rawMaterialName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        currency: string;
      }>;
    };
  };

  // Pricing Formula Used (Snapshot)
  @Column({ type: 'json', nullable: true })
  formula?: {
    id: string;
    name: string;
    expression: string;
    version: number;
  };

  // Notes/Metadata
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    calculationDuration?: number; // milliseconds
  };

  @CreateDateColumn()
  createdAt: Date;
}
