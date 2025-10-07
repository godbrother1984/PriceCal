// path: server/src/import/import.controller.ts
// version: 1.0 (Master Data Import Controller)
// last-modified: 1 ตุลาคม 2568 10:10

import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { ImportService } from './import.service';

@Controller('api/import')
export class ImportController {
  private readonly logger = new Logger(ImportController.name);

  constructor(private readonly importService: ImportService) {}

  /**
   * Manual import of all master data
   */
  @Post('all')
  async importAll() {
    this.logger.log('Manual import triggered for all data');
    const result = await this.importService.importAll();

    if (result.success) {
      await this.importService.updateLastSyncTimestamp();
    }

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Manual import of raw materials only
   */
  @Post('raw-materials')
  async importRawMaterials() {
    this.logger.log('Manual import triggered for raw materials');
    const result = await this.importService.importRawMaterials();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Manual import of finished goods and BOQ
   */
  @Post('finished-goods')
  async importFinishedGoods() {
    this.logger.log('Manual import triggered for finished goods');
    const result = await this.importService.importFinishedGoods();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Get import/sync status
   */
  @Get('status')
  async getImportStatus() {
    const status = await this.importService.getLastSyncStatus();

    return {
      success: true,
      data: status,
    };
  }

  /**
   * Check if auto-update should run
   */
  @Get('should-auto-update')
  async shouldAutoUpdate() {
    const shouldRun = await this.importService.shouldRunAutoUpdate();

    return {
      success: true,
      data: {
        shouldRun,
      },
    };
  }

  /**
   * Trigger auto-update if needed (called on login/first access)
   */
  @Post('auto-update')
  async triggerAutoUpdate() {
    const shouldRun = await this.importService.shouldRunAutoUpdate();

    if (!shouldRun) {
      return {
        success: true,
        message: 'Auto-update not needed (already ran today or disabled)',
        data: { imported: false },
      };
    }

    this.logger.log('Auto-update triggered');
    const result = await this.importService.importAll();

    if (result.success) {
      await this.importService.updateLastSyncTimestamp();
    }

    return {
      success: result.success,
      message: `Auto-update completed: ${result.message}`,
      data: {
        imported: true,
        stats: result.stats,
      },
      errors: result.errors,
    };
  }
}
