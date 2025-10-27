// path: server/src/pricing-formula/pricing-formula.module.ts
// version: 1.0 (Module for Pricing Formula Management)
// last-modified: 22 ตุลาคม 2568 18:27

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingFormulaController } from './pricing-formula.controller';
import { PricingFormulaService } from './pricing-formula.service';
import { PricingFormula } from '../entities/pricing-formula.entity';
import { FormulaEngineModule } from '../formula-engine/formula-engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PricingFormula]),
    FormulaEngineModule, // For formula testing
  ],
  controllers: [PricingFormulaController],
  providers: [PricingFormulaService],
  exports: [PricingFormulaService],
})
export class PricingFormulaModule {}
