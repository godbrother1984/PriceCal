// path: server/src/rule-engine/rule-engine.module.ts
// version: 1.0 (Rule Engine Module)
// last-modified: 22 ตุลาคม 2568 17:32

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleEngineService } from './rule-engine.service';
import { PricingRule } from '../entities/pricing-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PricingRule])],
  providers: [RuleEngineService],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
