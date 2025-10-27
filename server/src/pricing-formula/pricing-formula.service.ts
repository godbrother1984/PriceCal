// path: server/src/pricing-formula/pricing-formula.service.ts
// version: 1.0 (Service for Pricing Formula Management)
// last-modified: 22 ตุลาคม 2568 18:25

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingFormula } from '../entities/pricing-formula.entity';
import { FormulaEngineService } from '../formula-engine/formula-engine.service';

@Injectable()
export class PricingFormulaService {
  private readonly logger = new Logger(PricingFormulaService.name);

  constructor(
    @InjectRepository(PricingFormula)
    private pricingFormulaRepository: Repository<PricingFormula>,
    private formulaEngineService: FormulaEngineService,
  ) {}

  /**
   * ดึงรายการ Pricing Formulas ทั้งหมด
   */
  async findAll(filters: any = {}): Promise<PricingFormula[]> {
    const where: any = {};

    if (filters.customerGroupId !== undefined) {
      where.customerGroupId = filters.customerGroupId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.pricingFormulaRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * ดึง Default Base Formula
   */
  async findDefault(): Promise<PricingFormula | null> {
    return this.pricingFormulaRepository.findOne({
      where: { isDefault: true, isActive: true },
    });
  }

  /**
   * ดึง Pricing Formula ตาม ID
   */
  async findOne(id: string): Promise<PricingFormula> {
    const formula = await this.pricingFormulaRepository.findOne({
      where: { id },
    });

    if (!formula) {
      throw new NotFoundException(`Pricing formula ${id} not found`);
    }

    return formula;
  }

  /**
   * สร้าง Pricing Formula ใหม่
   */
  async create(createDto: Partial<PricingFormula>): Promise<PricingFormula> {
    // ถ้าเป็น default formula ให้ unset default อันอื่นก่อน
    if (createDto.isDefault) {
      await this.pricingFormulaRepository.update(
        { isDefault: true },
        { isDefault: false },
      );
    }

    const formula = this.pricingFormulaRepository.create({
      ...createDto,
      status: 'Active',
      version: 1,
      createdBy: 'system', // TODO: get from JWT
      updatedBy: 'system',
      approvedBy: 'system',
      approvedAt: new Date(),
      effectiveFrom: new Date(),
      isActive: true,
    });

    const saved = await this.pricingFormulaRepository.save(formula);
    this.logger.log(`Created pricing formula: ${saved.id} - ${saved.name}`);

    return saved;
  }

  /**
   * อัปเดต Pricing Formula
   */
  async update(
    id: string,
    updateDto: Partial<PricingFormula>,
  ): Promise<PricingFormula> {
    const formula = await this.findOne(id);

    // ถ้าเป็น default formula ให้ unset default อันอื่นก่อน
    if (updateDto.isDefault && !formula.isDefault) {
      await this.pricingFormulaRepository.update(
        { isDefault: true },
        { isDefault: false },
      );
    }

    // Update version
    const updated = {
      ...updateDto,
      version: formula.version + 1,
      updatedBy: 'system', // TODO: get from JWT
    };

    await this.pricingFormulaRepository.update(id, updated);

    this.logger.log(`Updated pricing formula: ${id} - v${updated.version}`);

    return this.findOne(id);
  }

  /**
   * ลบ Pricing Formula (soft delete)
   */
  async delete(id: string): Promise<void> {
    const formula = await this.findOne(id);

    // ห้ามลบ default formula
    if (formula.isDefault) {
      throw new Error('Cannot delete default formula');
    }

    await this.pricingFormulaRepository.update(id, { isActive: false });

    this.logger.log(`Deleted pricing formula: ${id}`);
  }

  /**
   * ทดสอบสูตร
   */
  async testFormula(
    formula: string,
    variables: Record<string, any>,
  ): Promise<{ valid: boolean; result?: number; error?: string }> {
    return this.formulaEngineService.testFormula(formula, variables);
  }
}
