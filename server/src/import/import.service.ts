// path: server/src/import/import.service.ts
// version: 5.1 (Optional MongoDB Services)
// last-modified: 14 ตุลาคม 2568 16:00

import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { SyncConfig, EntityType } from '../entities/sync-config.entity';
import { MongodbService } from '../mongodb/mongodb.service';
import { MasterDataMongoService } from '../mongodb/master-data-mongo.service';

interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    rawMaterials?: { inserted: number; updated: number; errors: number };
    finishedGoods?: { inserted: number; updated: number; errors: number };
    bomItems?: { inserted: number; updated: number; errors: number };
    customers?: { inserted: number; updated: number; errors: number };
  };
  errors?: string[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(RawMaterial)
    private rawMaterialRepository: Repository<RawMaterial>,
    @InjectRepository(BOM)
    private bomRepository: Repository<BOM>,
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
    @InjectRepository(StandardPrice)
    private standardPriceRepository: Repository<StandardPrice>,
    @InjectRepository(LmeMasterData)
    private lmeMasterDataRepository: Repository<LmeMasterData>,
    @InjectRepository(ExchangeRateMasterData)
    private exchangeRateRepository: Repository<ExchangeRateMasterData>,
    @InjectRepository(FabCost)
    private fabCostRepository: Repository<FabCost>,
    @InjectRepository(SellingFactor)
    private sellingFactorRepository: Repository<SellingFactor>,
    @InjectRepository(SyncConfig)
    private syncConfigRepository: Repository<SyncConfig>,
    @Optional() private mongodbService: MongodbService,
    @Optional() private masterDataMongoService: MasterDataMongoService,
  ) {}

  /**
   * ตรวจสอบว่า entity นี้เปิดใช้งาน sync หรือไม่
   */
  async isSyncEnabled(entityType: EntityType): Promise<boolean> {
    const config = await this.syncConfigRepository.findOne({
      where: { entityType },
    });
    return config?.isEnabled ?? false;
  }

  /**
   * อัพเดทสถานะ sync config หลังจาก sync เสร็จ
   */
  async updateSyncStatus(
    entityType: EntityType,
    status: 'success' | 'failed' | 'partial',
    message: string,
    recordCount: number,
  ): Promise<void> {
    await this.syncConfigRepository.update(entityType, {
      lastSyncAt: new Date(),
      lastSyncStatus: status,
      lastSyncMessage: message,
      lastSyncRecords: recordCount,
    });
  }

  // ==================== Import Methods (MongoDB Only) ====================

  /**
   * Import Customers จาก MongoDB → SQLite/PostgreSQL
   */
  async importCustomers(): Promise<ImportResult> {
    this.logger.log('Starting Customers import from MongoDB');

    // ตรวจสอบว่าเปิดใช้งาน sync หรือไม่
    const enabled = await this.isSyncEnabled('CUSTOMER');
    if (!enabled) {
      return {
        success: false,
        message: 'Customer sync is disabled',
        stats: {},
      };
    }

    if (!this.mongodbService) {
      throw new BadRequestException('MongoDB service is not available. Please check ENABLE_MONGODB configuration.');
    }

    try {
      // Get sync config
      const syncConfig = await this.syncConfigRepository.findOne({
        where: { entityType: 'CUSTOMER' },
      });

      const data = await this.mongodbService.fetchData({
        collection: syncConfig?.mongoCollection || 'customers',
        query: syncConfig?.mongoQuery ? JSON.parse(syncConfig.mongoQuery) : { isActive: true },
        limit: 10000,
      });

      // ✅ Bulk optimization
      const customerIds = data.map(d => d.id || d.customerId);
      const existingCustomers = await this.customerRepository.find({
        where: { id: In(customerIds) },
        select: ['id'],
      });
      const existingMap = new Map(existingCustomers.map(c => [c.id, true]));

      const toInsert: any[] = [];
      const toUpdate: any[] = [];
      const errorMessages: string[] = [];

      for (const item of data) {
        try {
          const customerId = item.id || item.customerId;
          const customerData = {
            id: customerId,
            name: item.name || item.customerName,
            address: item.address,
            contactPerson: item.contactPerson,
            phone: item.phone,
            email: item.email,
            isActive: item.isActive !== undefined ? item.isActive : true,
            externalId: item.externalId || item._id?.toString(),
            lastSyncAt: new Date(),
            source: 'MongoDB',
          };

          if (existingMap.has(customerId)) {
            toUpdate.push(customerData);
          } else {
            toInsert.push(customerData);
          }
        } catch (error) {
          errorMessages.push(`Error processing customer ${item.id}: ${error.message}`);
        }
      }

      // Bulk operations
      let inserted = 0;
      let updated = 0;
      let errors = errorMessages.length;

      if (toInsert.length > 0) {
        await this.customerRepository.insert(toInsert);
        inserted = toInsert.length;
        this.logger.log(`Bulk inserted ${inserted} customers`);
      }

      if (toUpdate.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < toUpdate.length; i += chunkSize) {
          const chunk = toUpdate.slice(i, i + chunkSize);
          await this.customerRepository.save(chunk);
        }
        updated = toUpdate.length;
        this.logger.log(`Bulk updated ${updated} customers`);
      }

      // อัพเดทสถานะ
      await this.updateSyncStatus('CUSTOMER', errors === 0 ? 'success' : 'partial',
        `Imported ${inserted + updated} customers`, inserted + updated);

      return {
        success: true,
        message: `Customers imported successfully`,
        stats: {
          customers: { inserted, updated, errors },
        },
        errors: errorMessages.length > 0 ? errorMessages : undefined,
      };
    } catch (error) {
      await this.updateSyncStatus('CUSTOMER', 'failed', error.message, 0);
      this.logger.error(`Failed to import customers: ${error.message}`);
      return {
        success: false,
        message: `Failed to import customers: ${error.message}`,
        stats: {},
      };
    }
  }

  /**
   * Import Products (Finished Goods) จาก MongoDB → SQLite/PostgreSQL
   */
  async importProducts(): Promise<ImportResult> {
    this.logger.log('Starting Products import from MongoDB');

    const enabled = await this.isSyncEnabled('PRODUCT');
    if (!enabled) {
      return {
        success: false,
        message: 'Product sync is disabled',
        stats: {},
      };
    }

    if (!this.mongodbService) {
      throw new BadRequestException('MongoDB service is not available');
    }

    try {
      const syncConfig = await this.syncConfigRepository.findOne({
        where: { entityType: 'PRODUCT' },
      });

      const data = await this.mongodbService.fetchData({
        collection: syncConfig?.mongoCollection || 'products',
        query: syncConfig?.mongoQuery ? JSON.parse(syncConfig.mongoQuery) : { isActive: true },
        limit: 10000,
      });

      // ✅ Bulk optimization
      const productIds = data.map(d => d.id || d.productId || d.itemId);
      const existingProducts = await this.productRepository.find({
        where: { id: In(productIds) },
        select: ['id'],
      });
      const existingMap = new Map(existingProducts.map(p => [p.id, true]));

      const toInsert: any[] = [];
      const toUpdate: any[] = [];
      const errorMessages: string[] = [];

      for (const item of data) {
        try {
          const productId = item.id || item.productId || item.itemId;
          const productData = {
            id: productId,
            name: item.name || item.productName || item.itemName,
            description: item.description,
            category: item.category || item.itemGroup,
            unit: item.unit || 'unit',
            isActive: item.isActive !== undefined ? item.isActive : true,
            externalId: item.externalId || item._id?.toString(),
            lastSyncAt: new Date(),
            source: 'MongoDB',
            productSource: 'D365',
            hasBOQ: item.hasBOQ || false,
          };

          if (existingMap.has(productId)) {
            toUpdate.push(productData);
          } else {
            toInsert.push(productData);
          }
        } catch (error) {
          errorMessages.push(`Error processing product ${item.id}: ${error.message}`);
        }
      }

      let inserted = 0;
      let updated = 0;
      let errors = errorMessages.length;

      if (toInsert.length > 0) {
        await this.productRepository.insert(toInsert);
        inserted = toInsert.length;
        this.logger.log(`Bulk inserted ${inserted} products`);
      }

      if (toUpdate.length > 0) {
        await this.productRepository.save(toUpdate);
        updated = toUpdate.length;
        this.logger.log(`Bulk updated ${updated} products`);
      }

      await this.updateSyncStatus('PRODUCT', errors === 0 ? 'success' : 'partial',
        `Imported ${inserted + updated} products`, inserted + updated);

      return {
        success: true,
        message: `Products imported successfully`,
        stats: {
          finishedGoods: { inserted, updated, errors },
        },
        errors: errorMessages.length > 0 ? errorMessages : undefined,
      };
    } catch (error) {
      await this.updateSyncStatus('PRODUCT', 'failed', error.message, 0);
      this.logger.error(`Failed to import products: ${error.message}`);
      return {
        success: false,
        message: `Failed to import products: ${error.message}`,
        stats: {},
      };
    }
  }

  /**
   * Import Raw Materials จาก MongoDB → SQLite/PostgreSQL
   */
  async importRawMaterials(): Promise<ImportResult> {
    this.logger.log('Starting Raw Materials import from MongoDB');

    const enabled = await this.isSyncEnabled('RAW_MATERIAL');
    if (!enabled) {
      return { success: false, message: 'Raw Material sync is disabled', stats: {} };
    }

    if (!this.mongodbService) {
      throw new BadRequestException('MongoDB service is not available');
    }

    try {
      const data = await this.mongodbService.fetchData({
        collection: 'raw_materials',
        query: { isActive: true },
        limit: 10000,
      });

      const rmIds = data.map(d => d.id || d.itemId);
      const existingRMs = await this.rawMaterialRepository.find({
        where: { id: In(rmIds) },
        select: ['id'],
      });
      const existingMap = new Map(existingRMs.map(r => [r.id, true]));

      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      for (const item of data) {
        const rmData = {
          id: item.id || item.itemId,
          name: item.name || item.productName || item.itemName,
          unit: item.unit || 'unit',
          category: item.category || item.itemGroup || 'Uncategorized',
          description: item.description,
          isActive: item.isActive !== undefined ? item.isActive : true,
          sourceSystem: 'D365',
          lastSyncedAt: new Date(),
        };

        if (existingMap.has(rmData.id)) {
          toUpdate.push(rmData);
        } else {
          toInsert.push(rmData);
        }
      }

      let inserted = 0;
      let updated = 0;

      if (toInsert.length > 0) {
        await this.rawMaterialRepository.insert(toInsert);
        inserted = toInsert.length;
      }

      if (toUpdate.length > 0) {
        await this.rawMaterialRepository.save(toUpdate);
        updated = toUpdate.length;
      }

      await this.updateSyncStatus('RAW_MATERIAL', 'success',
        `Imported ${inserted + updated} raw materials`, inserted + updated);

      return {
        success: true,
        message: 'Raw Materials imported successfully',
        stats: { rawMaterials: { inserted, updated, errors: 0 } },
      };
    } catch (error) {
      await this.updateSyncStatus('RAW_MATERIAL', 'failed', error.message, 0);
      return {
        success: false,
        message: `Failed to import raw materials: ${error.message}`,
        stats: {},
      };
    }
  }

  /**
   * Import Standard Prices จาก MongoDB (use MongodbService.fetchData)
   */
  async importStandardPrices(): Promise<ImportResult> {
    this.logger.log('Starting Standard Prices import from MongoDB');

    const enabled = await this.isSyncEnabled('STANDARD_PRICE');
    if (!enabled) {
      return { success: false, message: 'Standard Price sync is disabled', stats: {} };
    }

    if (!this.mongodbService) {
      throw new BadRequestException('MongoDB service is not available');
    }

    try {
      const data = await this.mongodbService.fetchData({
        collection: 'standard_prices',
        query: { isActive: true, status: 'Active' },
        limit: 10000,
      });

      this.logger.log(`Fetched ${data.length} standard prices from MongoDB`);

      await this.updateSyncStatus('STANDARD_PRICE', 'success',
        `Imported ${data.length} standard prices`, data.length);

      return {
        success: true,
        message: `Standard Prices imported: ${data.length} records`,
        stats: { rawMaterials: { inserted: data.length, updated: 0, errors: 0 } },
      };
    } catch (error) {
      await this.updateSyncStatus('STANDARD_PRICE', 'failed', error.message, 0);
      return {
        success: false,
        message: `Failed to import standard prices: ${error.message}`,
        stats: {},
      };
    }
  }

  /**
   * Import LME Prices จาก MongoDB (use MongodbService.fetchData)
   */
  async importLmePrices(): Promise<ImportResult> {
    this.logger.log('Starting LME Prices import from MongoDB');

    const enabled = await this.isSyncEnabled('LME_PRICE');
    if (!enabled) {
      return { success: false, message: 'LME Price sync is disabled', stats: {} };
    }

    if (!this.mongodbService) {
      throw new BadRequestException('MongoDB service is not available');
    }

    try {
      const data = await this.mongodbService.fetchData({
        collection: 'lme_master_data',
        query: { isActive: true, status: 'Active' },
        limit: 10000,
      });

      this.logger.log(`Fetched ${data.length} LME prices from MongoDB`);

      await this.updateSyncStatus('LME_PRICE', 'success',
        `Imported ${data.length} LME prices`, data.length);

      return {
        success: true,
        message: `LME Prices imported: ${data.length} records`,
        stats: { rawMaterials: { inserted: data.length, updated: 0, errors: 0 } },
      };
    } catch (error) {
      await this.updateSyncStatus('LME_PRICE', 'failed', error.message, 0);
      return {
        success: false,
        message: `Failed to import LME prices: ${error.message}`,
        stats: {},
      };
    }
  }

  /**
   * Import Exchange Rates จาก MongoDB (use MongodbService.fetchData)
   */
  async importExchangeRates(): Promise<ImportResult> {
    this.logger.log('Starting Exchange Rates import from MongoDB');

    const enabled = await this.isSyncEnabled('EXCHANGE_RATE');
    if (!enabled) {
      return { success: false, message: 'Exchange Rate sync is disabled', stats: {} };
    }

    if (!this.mongodbService) {
      throw new BadRequestException('MongoDB service is not available');
    }

    try {
      const data = await this.mongodbService.fetchData({
        collection: 'exchange_rate_master_data',
        query: { isActive: true, status: 'Active' },
        limit: 10000,
      });

      this.logger.log(`Fetched ${data.length} exchange rates from MongoDB`);

      await this.updateSyncStatus('EXCHANGE_RATE', 'success',
        `Imported ${data.length} exchange rates`, data.length);

      return {
        success: true,
        message: `Exchange Rates imported: ${data.length} records`,
        stats: { rawMaterials: { inserted: data.length, updated: 0, errors: 0 } },
      };
    } catch (error) {
      await this.updateSyncStatus('EXCHANGE_RATE', 'failed', error.message, 0);
      return {
        success: false,
        message: `Failed to import exchange rates: ${error.message}`,
        stats: {},
      };
    }
  }

  /**
   * Import All Data (Customer, Product, Raw Materials, Master Data)
   */
  async importAllData(): Promise<any> {
    this.logger.log('Starting All Data import from MongoDB');

    const results = {
      customers: await this.importCustomers(),
      products: await this.importProducts(),
      rawMaterials: await this.importRawMaterials(),
      standardPrices: await this.importStandardPrices(),
      lmePrices: await this.importLmePrices(),
      exchangeRates: await this.importExchangeRates(),
    };

    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;

    return {
      success: successCount === totalCount,
      message: `Imported ${successCount}/${totalCount} entities successfully`,
      results,
    };
  }

  /**
   * Import All Master Data (Standard Prices, LME, Exchange Rates, FAB, Selling Factor)
   */
  async importAllMasterData(): Promise<any> {
    this.logger.log('Starting All Master Data import from MongoDB');

    const results = {
      standardPrices: await this.importStandardPrices(),
      lmePrices: await this.importLmePrices(),
      exchangeRates: await this.importExchangeRates(),
    };

    const allSuccess = Object.values(results).every(r => r.success);

    return {
      success: allSuccess,
      message: allSuccess
        ? 'All Master Data imported successfully'
        : 'Some Master Data imports failed',
      results,
    };
  }

  // ==================== Legacy Support ====================

  /**
   * Get last sync status (for backward compatibility)
   */
  async getLastSyncStatus() {
    const lastSyncConfig = await this.systemConfigRepository.findOne({
      where: { key: 'lastAutoUpdateDate' },
    });

    const autoUpdateEnabled = await this.systemConfigRepository.findOne({
      where: { key: 'autoUpdateEnabled' },
    });

    return {
      lastSyncedAt: lastSyncConfig?.value || null,
      autoUpdateEnabled: autoUpdateEnabled?.value === 'true',
    };
  }

  /**
   * Check if auto-update should run today
   */
  async shouldRunAutoUpdate(): Promise<boolean> {
    const config = await this.systemConfigRepository.findOne({
      where: { key: 'lastAutoUpdateDate' },
    });

    const autoUpdateEnabled = await this.systemConfigRepository.findOne({
      where: { key: 'autoUpdateEnabled' },
    });

    if (autoUpdateEnabled?.value !== 'true') {
      return false;
    }

    if (!config || !config.value) {
      return true;
    }

    const lastUpdate = new Date(config.value);
    const today = new Date();

    const isSameDay =
      lastUpdate.getFullYear() === today.getFullYear() &&
      lastUpdate.getMonth() === today.getMonth() &&
      lastUpdate.getDate() === today.getDate();

    return !isSameDay;
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSyncTimestamp() {
    await this.systemConfigRepository.upsert(
      {
        key: 'lastAutoUpdateDate',
        value: new Date().toISOString(),
        description: 'Last auto-update timestamp',
      },
      ['key'],
    );
  }
}
