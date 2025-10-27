// path: server/src/rule-engine/rule-engine.service.ts
// version: 1.0 (Rule Matching and Evaluation)
// last-modified: 22 ตุลาคม 2568 17:30

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingRule } from '../entities/pricing-rule.entity';
import { PricingContext } from '../price-calculation/pricing-context.interface';
import { evaluate } from 'mathjs';

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(
    @InjectRepository(PricingRule)
    private pricingRuleRepository: Repository<PricingRule>,
  ) {}

  /**
   * หา Rules ที่ match กับ context
   * @param context - Pricing context ที่มีข้อมูลทั้งหมด
   * @returns Matched rules เรียงตาม priority (น้อยไปมาก)
   */
  async findMatchingRules(context: PricingContext): Promise<PricingRule[]> {
    this.logger.log(`Finding matching rules for product ${context.productId}, customer group ${context.customerGroupId}`);

    // 1. ดึง active rules ทั้งหมด
    const allRules = await this.pricingRuleRepository.find({
      where: { isActive: true },
      order: { priority: 'ASC' }, // เรียงตาม priority (1, 2, 3, ...)
    });

    this.logger.log(`Found ${allRules.length} active rules`);

    // 2. Filter rules ที่ match conditions
    const matchedRules: PricingRule[] = [];

    for (const rule of allRules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        matchedRules.push(rule);
        this.logger.log(`✓ Rule "${rule.name}" (Priority ${rule.priority}) matched`);
      } else {
        this.logger.debug(`✗ Rule "${rule.name}" (Priority ${rule.priority}) did not match`);
      }
    }

    this.logger.log(`${matchedRules.length} rules matched`);
    return matchedRules;
  }

  /**
   * ตรวจสอบว่า conditions ทั้งหมดใน rule match กับ context หรือไม่
   * @param conditions - Rule conditions
   * @param context - Pricing context
   * @returns true ถ้า match ทุกข้อ, false ถ้าไม่ match
   */
  private evaluateConditions(
    conditions: any,
    context: PricingContext,
  ): boolean {
    // Check customerGroupId
    if (conditions.customerGroupId !== undefined) {
      if (!this.checkArrayOrValue(conditions.customerGroupId, context.customerGroupId)) {
        this.logger.debug(`Condition failed: customerGroupId (expected: ${conditions.customerGroupId}, actual: ${context.customerGroupId})`);
        return false;
      }
    }

    // Check rawMaterialType
    if (conditions.rawMaterialType !== undefined) {
      const hasMatchingMaterial = context.materials.some((m) => {
        return this.checkArrayOrValue(conditions.rawMaterialType, m.type);
      });

      if (!hasMatchingMaterial) {
        this.logger.debug(`Condition failed: rawMaterialType (expected: ${conditions.rawMaterialType})`);
        return false;
      }
    }

    // Check hasLMEPrice
    if (conditions.hasLMEPrice !== undefined) {
      const hasLME = context.materials.some((m) => m.hasLMEPrice);
      if (hasLME !== conditions.hasLMEPrice) {
        this.logger.debug(`Condition failed: hasLMEPrice (expected: ${conditions.hasLMEPrice}, actual: ${hasLME})`);
        return false;
      }
    }

    // Check quantity range
    if (conditions.quantityMin !== undefined) {
      if (context.quantity < conditions.quantityMin) {
        this.logger.debug(`Condition failed: quantityMin (expected: >= ${conditions.quantityMin}, actual: ${context.quantity})`);
        return false;
      }
    }

    if (conditions.quantityMax !== undefined) {
      if (context.quantity > conditions.quantityMax) {
        this.logger.debug(`Condition failed: quantityMax (expected: <= ${conditions.quantityMax}, actual: ${context.quantity})`);
        return false;
      }
    }

    // Check productId
    if (conditions.productId !== undefined) {
      if (!this.checkArrayOrValue(conditions.productId, context.productId)) {
        this.logger.debug(`Condition failed: productId (expected: ${conditions.productId}, actual: ${context.productId})`);
        return false;
      }
    }

    // Check custom condition (using mathjs)
    if (conditions.customCondition) {
      try {
        const result = evaluate(conditions.customCondition, context);
        if (!result) {
          this.logger.debug(`Condition failed: customCondition (${conditions.customCondition} = ${result})`);
          return false;
        }
      } catch (error) {
        this.logger.error(`Error evaluating custom condition: ${conditions.customCondition}`, error);
        return false;
      }
    }

    // All conditions passed
    return true;
  }

  /**
   * Helper: ตรวจสอบว่า value match กับ expected (รองรับ array และ single value)
   */
  private checkArrayOrValue(expected: string | string[], actual: string | undefined): boolean {
    if (!actual) return false;

    if (Array.isArray(expected)) {
      return expected.includes(actual);
    } else {
      return expected === actual;
    }
  }
}
