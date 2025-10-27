// path: server/src/formula-engine/formula-engine.service.ts
// version: 2.0 (Hybrid System - Formula Merging and Variable Adjustments)
// last-modified: 22 ตุลาคม 2568 17:35

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { evaluate, parse } from 'mathjs';
import { PricingFormula } from '../entities/pricing-formula.entity';
import { PricingRule } from '../entities/pricing-rule.entity';
import { MergedFormulas, AppliedRule } from '../price-calculation/pricing-context.interface';

/**
 * FormulaEngine Service
 *
 * Version 2.0 - Hybrid System:
 * - Merge base formulas กับ rule overrides
 * - Apply variable adjustments
 * - Evaluate formulas with variables
 */
@Injectable()
export class FormulaEngineService {
  private readonly logger = new Logger(FormulaEngineService.name);

  /**
   * Evaluate สูตรด้วย variables ที่กำหนด
   *
   * @param formula - สูตรที่ต้องการคำนวณ (เช่น "totalCost * sellingFactor")
   * @param variables - ตัวแปรที่ใช้ในสูตร (เช่น { totalCost: 100, sellingFactor: 1.25 })
   * @returns ผลลัพธ์จากการคำนวณ
   */
  evaluateFormula(formula: string, variables: Record<string, any>): number {
    try {
      this.logger.debug(`Evaluating formula: ${formula}`);
      this.logger.debug(`Variables: ${JSON.stringify(variables)}`);

      // Validate formula syntax
      this.validateFormula(formula);

      // Evaluate formula
      const result = evaluate(formula, variables);

      this.logger.debug(`Result: ${result}`);

      // Ensure result is a number
      if (typeof result !== 'number' || isNaN(result)) {
        throw new BadRequestException(`Formula evaluation did not return a valid number: ${result}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Formula evaluation error: ${error.message}`);
      this.logger.error(`Formula: ${formula}`);
      this.logger.error(`Variables: ${JSON.stringify(variables)}`);

      throw new BadRequestException(
        `Failed to evaluate formula "${formula}": ${error.message}`,
      );
    }
  }

  /**
   * Validate สูตร (ตรวจสอบ syntax และ security)
   */
  private validateFormula(formula: string): void {
    if (!formula || typeof formula !== 'string') {
      throw new BadRequestException('Formula must be a non-empty string');
    }

    // ตรวจสอบ syntax ด้วย mathjs parser
    try {
      parse(formula);
    } catch (error) {
      throw new BadRequestException(`Invalid formula syntax: ${error.message}`);
    }

    // Security: ห้ามใช้ functions ที่อันตราย
    const dangerousFunctions = [
      'eval',
      'import',
      'createUnit',
      'parse',
      'compile',
      'simplify',
      'derivative',
    ];

    for (const fn of dangerousFunctions) {
      if (formula.includes(fn)) {
        throw new BadRequestException(
          `Formula contains forbidden function: ${fn}`,
        );
      }
    }
  }

  /**
   * ทดสอบสูตรว่าใช้งานได้หรือไม่
   */
  testFormula(formula: string, sampleVariables: Record<string, any>): {
    valid: boolean;
    result?: number;
    error?: string;
  } {
    try {
      const result = this.evaluateFormula(formula, sampleVariables);
      return { valid: true, result };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * รายการ functions ที่รองรับ
   */
  getSupportedFunctions(): string[] {
    return [
      // Arithmetic
      'abs', 'add', 'subtract', 'multiply', 'divide', 'mod', 'pow', 'sqrt',
      // Rounding
      'ceil', 'floor', 'round', 'fix',
      // Comparison
      'min', 'max',
      // Trigonometry (ถ้าจำเป็น)
      'sin', 'cos', 'tan',
      // Constants
      'pi', 'e',
    ];
  }

  /**
   * ตัวอย่างสูตรที่ใช้ได้
   */
  getFormulaExamples(): Record<string, string> {
    return {
      totalCost: 'materialCost + fabCost',
      totalCostWithOverhead: 'materialCost + fabCost + overhead',
      sellingPrice: 'totalCost * sellingFactor',
      sellingPriceWithTax: 'totalCost * sellingFactor * (1 + taxRate)',
      sellingPriceThb: 'sellingPrice * exchangeRate',
      marginAmount: 'sellingPrice - totalCost',
      marginPercentage: '(sellingPrice - totalCost) / totalCost * 100',
      roundedPrice: 'round(sellingPrice, 2)',
      minPrice: 'max(totalCost * 1.1, minSellingPrice)',
    };
  }

  /**
   * Merge base formulas กับ rule overrides (Hybrid System)
   *
   * @param baseFormula - Base formula (default)
   * @param matchedRules - Rules ที่ match กับ conditions (เรียงตาม priority แล้ว)
   * @returns Merged formulas พร้อม audit trail
   */
  mergeFormulas(
    baseFormula: PricingFormula,
    matchedRules: PricingRule[],
  ): MergedFormulas {
    this.logger.log(`Merging base formula with ${matchedRules.length} rules`);

    // เริ่มจาก base formula
    const merged: MergedFormulas = {
      materialCostFormula: baseFormula.materialCostFormula,
      totalCostFormula: baseFormula.totalCostFormula,
      sellingPriceFormula: baseFormula.sellingPriceFormula,
      marginFormula: baseFormula.marginFormula,
      exchangeRateFormula: baseFormula.exchangeRateFormula || undefined,
      appliedRules: [],
      variableAdjustments: {},
    };

    // Apply rules ตาม priority (rules ที่มี priority น้อยกว่าจะถูก apply ก่อน)
    for (const rule of matchedRules) {
      this.logger.log(`Applying rule: ${rule.name} (Priority ${rule.priority})`);

      // Override formulas
      if (rule.overrideFormulas) {
        if (rule.overrideFormulas.materialCostFormula) {
          merged.materialCostFormula = rule.overrideFormulas.materialCostFormula;
          merged.appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority,
            type: 'override',
            field: 'materialCostFormula',
          });
          this.logger.log(`  ✓ Override materialCostFormula: ${rule.overrideFormulas.materialCostFormula}`);
        }

        if (rule.overrideFormulas.totalCostFormula) {
          merged.totalCostFormula = rule.overrideFormulas.totalCostFormula;
          merged.appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority,
            type: 'override',
            field: 'totalCostFormula',
          });
          this.logger.log(`  ✓ Override totalCostFormula: ${rule.overrideFormulas.totalCostFormula}`);
        }

        if (rule.overrideFormulas.sellingPriceFormula) {
          merged.sellingPriceFormula = rule.overrideFormulas.sellingPriceFormula;
          merged.appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority,
            type: 'override',
            field: 'sellingPriceFormula',
          });
          this.logger.log(`  ✓ Override sellingPriceFormula: ${rule.overrideFormulas.sellingPriceFormula}`);
        }

        if (rule.overrideFormulas.marginFormula) {
          merged.marginFormula = rule.overrideFormulas.marginFormula;
          merged.appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority,
            type: 'override',
            field: 'marginFormula',
          });
          this.logger.log(`  ✓ Override marginFormula: ${rule.overrideFormulas.marginFormula}`);
        }

        if (rule.overrideFormulas.exchangeRateFormula) {
          merged.exchangeRateFormula = rule.overrideFormulas.exchangeRateFormula;
          merged.appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            priority: rule.priority,
            type: 'override',
            field: 'exchangeRateFormula',
          });
          this.logger.log(`  ✓ Override exchangeRateFormula: ${rule.overrideFormulas.exchangeRateFormula}`);
        }
      }

      // Apply variable adjustments
      if (rule.variableAdjustments) {
        merged.variableAdjustments = {
          ...merged.variableAdjustments,
          ...rule.variableAdjustments,
        };
        merged.appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          type: 'adjustment',
          adjustments: rule.variableAdjustments,
        });
        this.logger.log(`  ✓ Variable adjustments: ${JSON.stringify(rule.variableAdjustments)}`);
      }

      // Apply actions (สำหรับอนาคต)
      if (rule.actions) {
        merged.appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          type: 'action',
          actions: rule.actions,
        });
        this.logger.log(`  ✓ Actions: ${JSON.stringify(rule.actions)}`);
      }
    }

    this.logger.log(`Formula merging complete. Applied ${merged.appliedRules.length} rule changes`);
    return merged;
  }

  /**
   * Apply variable adjustments to variables
   *
   * @param variables - Original variables
   * @param adjustments - Variable adjustments from rules
   * @returns Adjusted variables
   */
  applyVariableAdjustments(
    variables: Record<string, any>,
    adjustments: Record<string, any>,
  ): Record<string, any> {
    const adjusted = { ...variables };

    for (const [key, value] of Object.entries(adjustments)) {
      if (typeof value === 'number') {
        // Direct override
        this.logger.debug(`Variable adjustment: ${key} = ${value} (override)`);
        adjusted[key] = value;
      } else if (typeof value === 'string') {
        // Evaluate as formula (ใช้ current variables)
        try {
          const result = this.evaluateFormula(value, variables);
          this.logger.debug(`Variable adjustment: ${key} = ${value} = ${result} (formula)`);
          adjusted[key] = result;
        } catch (error) {
          this.logger.error(`Failed to evaluate variable adjustment for ${key}: ${value}`, error);
          // Keep original value
        }
      }
    }

    return adjusted;
  }
}
