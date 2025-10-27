// path: server/src/price-calculation/pricing-context.interface.ts
// version: 1.0 (Hybrid System - Context and Result Interfaces)
// last-modified: 22 ตุลาคม 2568 17:25

/**
 * PricingContext Interface
 *
 * Context ที่ใช้สำหรับ rule matching และ formula evaluation
 * ประกอบด้วยข้อมูลทั้งหมดที่ต้องใช้ในการคำนวณราคา
 */
export interface PricingContext {
  // Product Info
  productId: string;
  productName?: string;

  // Customer Info
  customerId?: string;
  customerGroupId?: string;
  customerGroupName?: string;

  // Quantity
  quantity: number;

  // Materials Info
  materials: {
    id: string;
    name: string;
    type: string; // "COPPER", "ALUMINUM", "STEEL", etc.
    hasLMEPrice: boolean;
    lmePrice?: number;
    standardPrice?: number;
    fabCost?: number;
    bomQuantity: number;
  }[];

  // Additional Context (สามารถเพิ่มได้ตามต้องการ)
  [key: string]: any;
}

/**
 * MergedFormulas Interface
 *
 * ผลลัพธ์จากการ merge base formula กับ rules
 */
export interface MergedFormulas {
  // Final Formulas (หลังจาก merge แล้ว)
  materialCostFormula: string;
  totalCostFormula: string;
  sellingPriceFormula: string;
  marginFormula: string;
  exchangeRateFormula?: string;

  // Rules ที่ถูก apply
  appliedRules: AppliedRule[];

  // Variable Adjustments
  variableAdjustments: Record<string, any>;
}

/**
 * AppliedRule Interface
 *
 * บันทึกว่า rule ไหนถูก apply ไปบ้าง (สำหรับ audit trail)
 */
export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  priority: number;
  type: 'override' | 'adjustment' | 'action';
  field?: string; // Field ที่ถูก override (เช่น "materialCostFormula")
  adjustments?: Record<string, any>; // Variable adjustments
  actions?: Record<string, any>; // Actions ที่ถูกทำ
}
