// path: server/src/import/import.controller.ts
// version: 3.0 (Add JWT Authentication Guard)
// last-modified: 14 ตุลาคม 2568 15:40

import { Controller, Post, Get, Body, Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImportService } from './import.service';

@Controller('api/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  private readonly logger = new Logger(ImportController.name);

  constructor(private readonly importService: ImportService) {}

  /**
   * Manual import of all data (MongoDB Sync)
   * Redirects to /sync/all endpoint
   */
  @Post('all')
  async importAll() {
    this.logger.log('Manual import triggered for all data (redirect to sync/all)');
    return this.syncAllData();
  }

  /**
   * Manual import of raw materials only (DEPRECATED - use MongoDB import)
   * Now redirects to sync/raw-materials endpoint
   */
  @Post('raw-materials')
  async importRawMaterials() {
    this.logger.log('Manual import triggered for raw materials (deprecated, use MongoDB)');
    const result = await this.importService.importRawMaterials();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Manual import of finished goods and BOQ (DEPRECATED - use MongoDB import)
   * Now redirects to sync/products endpoint
   */
  @Post('finished-goods')
  async importFinishedGoods() {
    this.logger.log('Manual import triggered for finished goods (deprecated, use MongoDB)');
    return this.importProducts();
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
    const result = await this.importService.importAllData();

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

  // ==================== Entity Sync Endpoints (with Toggle) ====================

  /**
   * Import Customers from MongoDB
   */
  @Post('sync/customers')
  async importCustomers() {
    this.logger.log('Manual sync triggered for Customers');
    const result = await this.importService.importCustomers();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Import Products (Finished Goods) from MongoDB
   */
  @Post('sync/products')
  async importProducts() {
    this.logger.log('Manual sync triggered for Products');
    const result = await this.importService.importProducts();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Import Standard Prices from MongoDB
   */
  @Post('sync/standard-prices')
  async importStandardPrices() {
    this.logger.log('Manual sync triggered for Standard Prices');
    const result = await this.importService.importStandardPrices();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Import LME Prices from MongoDB
   */
  @Post('sync/lme-prices')
  async importLmePrices() {
    this.logger.log('Manual sync triggered for LME Prices');
    const result = await this.importService.importLmePrices();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Import Exchange Rates from MongoDB
   */
  @Post('sync/exchange-rates')
  async importExchangeRates() {
    this.logger.log('Manual sync triggered for Exchange Rates');
    const result = await this.importService.importExchangeRates();

    return {
      success: result.success,
      message: result.message,
      data: result.stats,
      errors: result.errors,
    };
  }

  /**
   * Sync All Data (Customers, Products, Master Data)
   */
  @Post('sync/all')
  async syncAllData() {
    this.logger.log('Manual sync triggered for All Data');
    const result = await this.importService.importAllData();

    if (result.success) {
      await this.importService.updateLastSyncTimestamp();
    }

    return result;
  }

  // ==================== Legacy Endpoints (Backward Compatibility) ====================

  /**
   * Import All Master Data from MongoDB (Legacy)
   */
  @Post('master-data/all')
  async importAllMasterData() {
    this.logger.log('Manual import triggered for All Master Data (Legacy)');
    const result = await this.importService.importAllMasterData();

    return result;
  }

  @Post('master-data/standard-prices')
  async importStandardPricesLegacy() {
    return this.importStandardPrices();
  }

  @Post('master-data/lme-prices')
  async importLmePricesLegacy() {
    return this.importLmePrices();
  }

  @Post('master-data/exchange-rates')
  async importExchangeRatesLegacy() {
    return this.importExchangeRates();
  }
}
