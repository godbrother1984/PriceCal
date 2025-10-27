// path: server/src/formula-engine/formula-engine.module.ts
// version: 1.0 (Initial Creation)
// last-modified: 21 ตุลาคม 2568 16:12

import { Module } from '@nestjs/common';
import { FormulaEngineService } from './formula-engine.service';

@Module({
  providers: [FormulaEngineService],
  exports: [FormulaEngineService], // Export เพื่อใช้ใน modules อื่น
})
export class FormulaEngineModule {}
