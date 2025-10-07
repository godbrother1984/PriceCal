// path: server/src/import/import.service.ts
// version: 2.1 (Temporarily disable MongoDB)
// last-modified: 1 ตุลาคม 2568 15:25

import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { ApiSetting } from '../entities/api-setting.entity';
import axios from 'axios';
// import { MongodbService } from '../mongodb/mongodb.service'; // Temporarily disabled

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

interface RawMaterialDTO {
  ItemId: string;
  'Product name': string;
  'Search name': string;
  'Item Group': string;
  CurrencyCode: string;
  'CIG Standard Price': number;
  'Last Price': number;
  'Inventory Average': number;
  DataArea: string;
  ModifiedDateTime: string;
}

interface BOMItemDTO {
  ItemId: string;
  Qty: number;
  Unit: string;
}

interface FinishedGoodDTO {
  'ItemId FG': string;
  'ItemId RM': BOMItemDTO[];
  'Product name': string;
  'Search name': string;
  'Item Group': string;
  DataArea: string;
  ModifiedDate: string;
  CIGSQInch: number;
  Model: string;
  Part: string;
}

interface EmployeeDTO {
  EmployeeId: string;
  Name: string;
  Email: string;
  Department: string;
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
    @InjectRepository(ApiSetting)
    private apiSettingRepository: Repository<ApiSetting>,
    // @Optional() private mongodbService: MongodbService, // Temporarily disabled
  ) {}

  /**
   * Get nested value from object using JSON path (e.g., 'data.items')
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Fetch data based on data source type (REST API or MongoDB)
   */
  private async fetchData(apiSetting: ApiSetting): Promise<any[]> {
    // Check if MongoDB source
    if (apiSetting.dataSource === 'MONGODB') {
      return await this.fetchFromMongoDB(apiSetting);
    }

    // Default to REST API
    return await this.fetchFromApi(apiSetting);
  }

  /**
   * Fetch data from MongoDB
   */
  private async fetchFromMongoDB(apiSetting: ApiSetting): Promise<any[]> {
    this.logger.log(`Fetching from MongoDB collection: ${apiSetting.mongoCollection}`);

    // Temporarily disabled - MongoDB not available
    throw new Error('MongoDB support is temporarily disabled. Please use API source instead.');

    // try {
    //   const query = apiSetting.mongoQuery ? JSON.parse(apiSetting.mongoQuery) : {};
    //   const limit = apiSetting.maxRecords || 10000;

    //   const data = await this.mongodbService.fetchData({
    //     collection: apiSetting.mongoCollection,
    //     query,
    //     limit,
    //   });

    //   this.logger.log(`Fetched ${data.length} records from MongoDB`);
    //   return data;
    // } catch (error) {
    //   this.logger.error(`Failed to fetch from MongoDB: ${error.message}`);
    //   throw error;
    // }
  }

  /**
   * Fetch data from external API with authentication and pagination support
   */
  private async fetchFromApi(apiSetting: ApiSetting): Promise<any[]> {
    const method = apiSetting.httpMethod?.toUpperCase() || 'GET';

    this.logger.log(`Fetching from API: ${apiSetting.url} (${method})`);

    // If pagination not supported, fetch once
    if (!apiSetting.supportsPagination) {
      const config: any = {
        url: apiSetting.url,
        method: method,
        headers: apiSetting.headers || {},
        params: apiSetting.queryParams || {},
      };

      // Add request body for POST
      if (method === 'POST' && apiSetting.requestBody) {
        try {
          config.data = JSON.parse(apiSetting.requestBody);
        } catch (e) {
          this.logger.error('Invalid request body JSON:', e);
          throw new Error('Invalid request body format');
        }
      }

      // Add authentication
      this.addAuthentication(config, apiSetting);

      const response = await axios(config);
      const data = this.getNestedValue(response.data, apiSetting.dataPath);
      return Array.isArray(data) ? data : [data];
    }

    // Handle pagination
    return await this.fetchPaginatedData(apiSetting);
  }

  /**
   * Add authentication to axios config
   */
  private addAuthentication(config: any, apiSetting: ApiSetting) {
    if (apiSetting.authType === 'bearer' && apiSetting.authToken) {
      config.headers['Authorization'] = `Bearer ${apiSetting.authToken}`;
    } else if (apiSetting.authType === 'api-key' && apiSetting.authToken) {
      config.headers['X-API-Key'] = apiSetting.authToken;
    } else if (apiSetting.authType === 'basic' && apiSetting.authUsername && apiSetting.authPassword) {
      config.auth = {
        username: apiSetting.authUsername,
        password: apiSetting.authPassword,
      };
    }
  }

  /**
   * Fetch paginated data from API
   */
  private async fetchPaginatedData(apiSetting: ApiSetting): Promise<any[]> {
    const allData: any[] = [];
    const method = apiSetting.httpMethod?.toUpperCase() || 'GET';
    const paginationType = apiSetting.paginationType || 'offset';
    const pageSize = apiSetting.pageSize || 100;
    const maxRecords = apiSetting.maxRecords || null;

    let currentPage = 1;
    let currentOffset = 0;
    let cursor: string | null = null;
    let hasMore = true;

    this.logger.log(`Starting paginated fetch (${paginationType}) - Page size: ${pageSize}`);

    while (hasMore) {
      const config: any = {
        url: apiSetting.url,
        method: method,
        headers: apiSetting.headers || {},
        params: { ...(apiSetting.queryParams || {}) },
      };

      // Add pagination parameters
      if (paginationType === 'page') {
        config.params[apiSetting.pageNumberParam || 'page'] = currentPage;
        config.params[apiSetting.pageSizeParam || 'pageSize'] = pageSize;
      } else if (paginationType === 'offset') {
        config.params[apiSetting.offsetParam || 'offset'] = currentOffset;
        config.params[apiSetting.pageSizeParam || 'limit'] = pageSize;
      } else if (paginationType === 'cursor' && cursor) {
        config.params[apiSetting.cursorParam || 'cursor'] = cursor;
        config.params[apiSetting.pageSizeParam || 'limit'] = pageSize;
      }

      // Add request body for POST
      if (method === 'POST' && apiSetting.requestBody) {
        try {
          const bodyTemplate = JSON.parse(apiSetting.requestBody);

          // Merge pagination into body if needed
          if (paginationType === 'page') {
            bodyTemplate[apiSetting.pageNumberParam || 'page'] = currentPage;
            bodyTemplate[apiSetting.pageSizeParam || 'pageSize'] = pageSize;
          } else if (paginationType === 'offset') {
            bodyTemplate[apiSetting.offsetParam || 'offset'] = currentOffset;
            bodyTemplate[apiSetting.pageSizeParam || 'limit'] = pageSize;
          }

          config.data = bodyTemplate;
        } catch (e) {
          this.logger.error('Invalid request body JSON:', e);
          throw new Error('Invalid request body format');
        }
      }

      // Add authentication
      this.addAuthentication(config, apiSetting);

      try {
        const response = await axios(config);
        const pageData = this.getNestedValue(response.data, apiSetting.dataPath);
        const items = Array.isArray(pageData) ? pageData : [];

        this.logger.log(`Fetched page ${currentPage} - ${items.length} items`);

        allData.push(...items);

        // Check if we should continue
        if (items.length === 0) {
          hasMore = false;
        } else if (items.length < pageSize) {
          hasMore = false; // Last page
        } else if (maxRecords && allData.length >= maxRecords) {
          this.logger.log(`Reached max records limit: ${maxRecords}`);
          hasMore = false;
        } else if (paginationType === 'cursor') {
          const nextCursor = this.getNestedValue(response.data, apiSetting.nextCursorPath);
          if (!nextCursor) {
            hasMore = false;
          } else {
            cursor = nextCursor;
          }
        }

        // Increment for next iteration
        currentPage++;
        currentOffset += pageSize;

        // Safety check: prevent infinite loops
        if (currentPage > 10000) {
          this.logger.warn('Reached safety limit of 10,000 pages');
          hasMore = false;
        }

      } catch (error) {
        this.logger.error(`Error fetching page ${currentPage}:`, error.message);
        throw error;
      }
    }

    this.logger.log(`Total records fetched: ${allData.length}`);

    // Trim to maxRecords if specified
    if (maxRecords && allData.length > maxRecords) {
      return allData.slice(0, maxRecords);
    }

    return allData;
  }

  /**
   * Import Raw Materials from External API
   */
  async importRawMaterials(): Promise<ImportResult> {
    this.logger.log('Starting Raw Materials import from API');

    try {
      // Get API settings
      const apiSetting = await this.apiSettingRepository.findOne({
        where: { apiType: 'RAW_MATERIALS', isActive: true },
      });

      if (!apiSetting) {
        return {
          success: false,
          message: 'Raw Materials API not configured',
          stats: {},
          errors: ['API settings not found. Please configure API in Master Data > API Settings'],
        };
      }

      // Fetch data from API or MongoDB (already handles pagination)
      const rawMaterials: RawMaterialDTO[] = await this.fetchData(apiSetting);

      if (!Array.isArray(rawMaterials) || rawMaterials.length === 0) {
        return {
          success: false,
          message: 'No data returned from API',
          stats: {},
          errors: ['API returned empty or invalid data'],
        };
      }

      this.logger.log(`Processing ${rawMaterials.length} raw materials...`);

      let inserted = 0;
      let updated = 0;
      let errors = 0;
      const errorMessages: string[] = [];

      for (const rm of rawMaterials) {
        try {
          const existingRM = await this.rawMaterialRepository.findOne({
            where: { id: rm.ItemId },
          });

          const rawMaterialData = {
            id: rm.ItemId,
            name: rm['Product name'] || rm['Search name'] || rm.ItemId,
            unit: 'unit',
            category: rm['Item Group'] || 'Uncategorized',
            description: `${rm['Search name'] || ''} | Standard Price: ${rm['CIG Standard Price']} ${rm.CurrencyCode}`,
            isActive: true,
            sourceSystem: 'D365',
            lastSyncedAt: new Date(),
          };

          if (existingRM) {
            await this.rawMaterialRepository.update(rm.ItemId, rawMaterialData);
            updated++;
          } else {
            await this.rawMaterialRepository.save(rawMaterialData);
            inserted++;
          }
        } catch (error) {
          errors++;
          errorMessages.push(`Error processing RM ${rm.ItemId}: ${error.message}`);
          this.logger.error(`Error processing RM ${rm.ItemId}:`, error);
        }
      }

      // Update API setting status
      await this.apiSettingRepository.update(apiSetting.apiType, {
        lastSyncedAt: new Date(),
        lastSyncStatus: errors === 0 ? 'success' : 'partial',
        lastSyncMessage: `Imported ${inserted + updated} items (${inserted} new, ${updated} updated, ${errors} errors)`,
      });

      this.logger.log(`Import completed: ${inserted} inserted, ${updated} updated, ${errors} errors`);

      return {
        success: errors === 0 || (inserted + updated) > 0,
        message: `Imported ${inserted + updated} raw materials (${inserted} new, ${updated} updated)`,
        stats: {
          rawMaterials: { inserted, updated, errors },
        },
        errors: errorMessages.length > 0 ? errorMessages : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to import raw materials:', error);

      // Update API setting status
      try {
        await this.apiSettingRepository.update('RAW_MATERIALS', {
          lastSyncedAt: new Date(),
          lastSyncStatus: 'failed',
          lastSyncMessage: error.message,
        });
      } catch (updateError) {
        this.logger.error('Failed to update API setting status:', updateError);
      }

      return {
        success: false,
        message: `Failed to import raw materials: ${error.message}`,
        stats: {},
        errors: [error.message],
      };
    }
  }

  /**
   * Import Finished Goods and BOQ from External API
   */
  async importFinishedGoods(): Promise<ImportResult> {
    this.logger.log('Starting Finished Goods import from API');

    try {
      // Get API settings
      const apiSetting = await this.apiSettingRepository.findOne({
        where: { apiType: 'FINISHED_GOODS', isActive: true },
      });

      if (!apiSetting) {
        return {
          success: false,
          message: 'Finished Goods API not configured',
          stats: {},
          errors: ['API settings not found. Please configure API in Master Data > API Settings'],
        };
      }

      // Fetch data from API or MongoDB
      const data: any = await this.fetchData(apiSetting);
      const finishedGoods: FinishedGoodDTO[] = Array.isArray(data) ? data : (data.InventTableFGInfoList || []);

      if (!Array.isArray(finishedGoods) || finishedGoods.length === 0) {
        return {
          success: false,
          message: 'No data returned from API',
          stats: {},
          errors: ['API returned empty or invalid data'],
        };
      }

      let fgInserted = 0;
      let fgUpdated = 0;
      let fgErrors = 0;
      let bomInserted = 0;
      let bomErrors = 0;
      const errorMessages: string[] = [];

      for (const fg of finishedGoods) {
        try {
          // 1. Import Finished Good as Product
          const existingProduct = await this.productRepository.findOne({
            where: { id: fg['ItemId FG'] },
          });

          const productData = {
            id: fg['ItemId FG'],
            name: fg['Product name'] || fg['Search name'] || fg['ItemId FG'],
            description: `Model: ${fg.Model || 'N/A'} | Part: ${fg.Part || 'N/A'} | SQInch: ${fg.CIGSQInch || 0}`,
            category: fg['Item Group'] || 'Uncategorized',
            unit: 'unit',
            isActive: true,
            sourceSystem: 'D365',
            lastSyncedAt: new Date(),
          };

          if (existingProduct) {
            await this.productRepository.update(fg['ItemId FG'], productData);
            fgUpdated++;
          } else {
            await this.productRepository.save(productData);
            fgInserted++;
          }

          // 2. Import BOQ items
          if (fg['ItemId RM'] && Array.isArray(fg['ItemId RM'])) {
            // Delete existing BOQ items for this product
            await this.bomRepository.delete({ productId: fg['ItemId FG'] });

            for (const bomItem of fg['ItemId RM']) {
              try {
                const bomData = {
                  productId: fg['ItemId FG'],
                  rawMaterialId: bomItem.ItemId,
                  quantity: bomItem.Qty || 0,
                  unit: bomItem.Unit || 'unit',
                  notes: `Imported from D365 on ${new Date().toISOString()}`,
                  isActive: true,
                };

                await this.bomRepository.save(bomData);
                bomInserted++;
              } catch (bomError) {
                bomErrors++;
                errorMessages.push(`Error processing BOM for ${fg['ItemId FG']} - ${bomItem.ItemId}: ${bomError.message}`);
              }
            }
          }
        } catch (error) {
          fgErrors++;
          errorMessages.push(`Error processing FG ${fg['ItemId FG']}: ${error.message}`);
          this.logger.error(`Error processing FG ${fg['ItemId FG']}:`, error);
        }
      }

      // Update API setting status
      await this.apiSettingRepository.update(apiSetting.apiType, {
        lastSyncedAt: new Date(),
        lastSyncStatus: fgErrors === 0 && bomErrors === 0 ? 'success' : 'partial',
        lastSyncMessage: `Imported ${fgInserted + fgUpdated} products and ${bomInserted} BOQ items`,
      });

      this.logger.log(
        `Import completed: FG: ${fgInserted} inserted, ${fgUpdated} updated, ${fgErrors} errors | BOM: ${bomInserted} inserted`,
      );

      return {
        success: (fgInserted + fgUpdated) > 0,
        message: `Imported ${fgInserted + fgUpdated} finished goods and ${bomInserted} BOQ items`,
        stats: {
          finishedGoods: { inserted: fgInserted, updated: fgUpdated, errors: fgErrors },
          bomItems: { inserted: bomInserted, updated: 0, errors: bomErrors },
        },
        errors: errorMessages.length > 0 ? errorMessages : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to import finished goods:', error);

      // Update API setting status
      try {
        await this.apiSettingRepository.update('FINISHED_GOODS', {
          lastSyncedAt: new Date(),
          lastSyncStatus: 'failed',
          lastSyncMessage: error.message,
        });
      } catch (updateError) {
        this.logger.error('Failed to update API setting status:', updateError);
      }

      return {
        success: false,
        message: `Failed to import finished goods: ${error.message}`,
        stats: {},
        errors: [error.message],
      };
    }
  }

  /**
   * Import all data (Raw Materials + Finished Goods)
   */
  async importAll(): Promise<ImportResult> {
    this.logger.log('Starting full import from APIs...');

    const rmResult = await this.importRawMaterials();
    const fgResult = await this.importFinishedGoods();

    const allErrors = [
      ...(rmResult.errors || []),
      ...(fgResult.errors || []),
    ];

    return {
      success: rmResult.success && fgResult.success,
      message: `Full import completed. RM: ${rmResult.message}, FG: ${fgResult.message}`,
      stats: {
        rawMaterials: rmResult.stats.rawMaterials,
        finishedGoods: fgResult.stats.finishedGoods,
        bomItems: fgResult.stats.bomItems,
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  }

  /**
   * Get last sync status
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
      this.logger.log('Auto-update is disabled');
      return false;
    }

    if (!config || !config.value) {
      this.logger.log('No previous auto-update found, should run');
      return true;
    }

    const lastUpdate = new Date(config.value);
    const today = new Date();

    const isSameDay =
      lastUpdate.getFullYear() === today.getFullYear() &&
      lastUpdate.getMonth() === today.getMonth() &&
      lastUpdate.getDate() === today.getDate();

    if (isSameDay) {
      this.logger.log('Auto-update already ran today');
      return false;
    }

    this.logger.log('Auto-update should run (different day)');
    return true;
  }
}
