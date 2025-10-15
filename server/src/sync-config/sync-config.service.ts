// path: server/src/sync-config/sync-config.service.ts
// version: 1.0 (Sync Config Management Service)
// last-modified: 9 ตุลาคม 2568 11:00

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncConfig, EntityType } from '../entities/sync-config.entity';

@Injectable()
export class SyncConfigService {
  private readonly logger = new Logger(SyncConfigService.name);

  constructor(
    @InjectRepository(SyncConfig)
    private syncConfigRepository: Repository<SyncConfig>,
  ) {}

  /**
   * Get sync config for specific entity
   */
  async getSyncConfig(entityType: EntityType): Promise<SyncConfig | null> {
    return await this.syncConfigRepository.findOne({
      where: { entityType },
    });
  }

  /**
   * Get all sync configs
   */
  async getAllSyncConfigs(): Promise<SyncConfig[]> {
    return await this.syncConfigRepository.find({
      order: { entityType: 'ASC' },
    });
  }

  /**
   * Enable sync for entity
   */
  async enableSync(entityType: EntityType): Promise<SyncConfig> {
    const config = await this.syncConfigRepository.findOne({
      where: { entityType },
    });

    if (config) {
      config.isEnabled = true;
      return await this.syncConfigRepository.save(config);
    }

    // Create default config if not exists
    return await this.createDefaultConfig(entityType, true);
  }

  /**
   * Disable sync for entity
   */
  async disableSync(entityType: EntityType): Promise<SyncConfig> {
    const config = await this.syncConfigRepository.findOne({
      where: { entityType },
    });

    if (config) {
      config.isEnabled = false;
      return await this.syncConfigRepository.save(config);
    }

    // Create default config if not exists (disabled)
    return await this.createDefaultConfig(entityType, false);
  }

  /**
   * Update sync config
   */
  async updateSyncConfig(
    entityType: EntityType,
    updates: Partial<SyncConfig>,
  ): Promise<SyncConfig> {
    let config = await this.syncConfigRepository.findOne({
      where: { entityType },
    });

    if (!config) {
      config = await this.createDefaultConfig(entityType, updates.isEnabled ?? true);
    }

    Object.assign(config, updates);
    return await this.syncConfigRepository.save(config);
  }

  /**
   * Create default config for entity
   */
  async createDefaultConfig(
    entityType: EntityType,
    isEnabled: boolean = false,
  ): Promise<SyncConfig> {
    const collectionMap: Record<EntityType, string> = {
      CUSTOMER: 'customers',
      PRODUCT: 'products',
      RAW_MATERIAL: 'raw_materials',
      BOM: 'bom',
      STANDARD_PRICE: 'standard_prices',
      LME_PRICE: 'lme_master_data',
      EXCHANGE_RATE: 'exchange_rate_master_data',
      FAB_COST: 'fab_costs',
      SELLING_FACTOR: 'selling_factors',
    };

    const config = this.syncConfigRepository.create({
      entityType,
      isEnabled,
      dataSource: 'MONGODB',
      mongoCollection: collectionMap[entityType],
      mongoQuery: JSON.stringify({ isActive: true }),
      syncFrequency: 'MANUAL',
      upsertEnabled: true,
      deleteEnabled: false,
      notes: `Default configuration for ${entityType}`,
    });

    return await this.syncConfigRepository.save(config);
  }

  /**
   * Initialize all sync configs with default values
   */
  async initializeAllConfigs(): Promise<SyncConfig[]> {
    const entityTypes: EntityType[] = [
      'CUSTOMER',
      'PRODUCT',
      'RAW_MATERIAL',
      'BOM',
      'STANDARD_PRICE',
      'LME_PRICE',
      'EXCHANGE_RATE',
      'FAB_COST',
      'SELLING_FACTOR',
    ];

    const configs: SyncConfig[] = [];

    for (const entityType of entityTypes) {
      const existing = await this.syncConfigRepository.findOne({
        where: { entityType },
      });

      if (!existing) {
        this.logger.log(`Creating default config for ${entityType}`);
        const config = await this.createDefaultConfig(entityType, false);
        configs.push(config);
      } else {
        configs.push(existing);
      }
    }

    return configs;
  }

  /**
   * Get sync summary (how many enabled/disabled)
   */
  async getSyncSummary(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    configs: SyncConfig[];
  }> {
    const configs = await this.getAllSyncConfigs();
    const enabled = configs.filter((c) => c.isEnabled).length;
    const disabled = configs.filter((c) => !c.isEnabled).length;

    return {
      total: configs.length,
      enabled,
      disabled,
      configs,
    };
  }

  /**
   * Bulk update sync configs
   */
  async bulkUpdateSyncConfigs(
    updates: Array<{ entityType: EntityType; isEnabled: boolean }>,
  ): Promise<SyncConfig[]> {
    const results: SyncConfig[] = [];

    for (const update of updates) {
      const config = await this.updateSyncConfig(update.entityType, {
        isEnabled: update.isEnabled,
      });
      results.push(config);
    }

    return results;
  }
}
