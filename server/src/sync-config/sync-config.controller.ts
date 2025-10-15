// path: server/src/sync-config/sync-config.controller.ts
// version: 2.0 (Add JWT Authentication Guard)
// last-modified: 14 ตุลาคม 2568 15:40

import { Controller, Get, Post, Put, Param, Body, Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncConfigService } from './sync-config.service';
import { EntityType } from '../entities/sync-config.entity';

@Controller('api/sync-config')
@UseGuards(JwtAuthGuard)
export class SyncConfigController {
  private readonly logger = new Logger(SyncConfigController.name);

  constructor(private readonly syncConfigService: SyncConfigService) {}

  /**
   * Get all sync configs
   */
  @Get()
  async getAllConfigs() {
    const configs = await this.syncConfigService.getAllSyncConfigs();

    return {
      success: true,
      data: configs,
    };
  }

  /**
   * Get sync config for specific entity
   */
  @Get(':entityType')
  async getConfig(@Param('entityType') entityType: EntityType) {
    const config = await this.syncConfigService.getSyncConfig(entityType);

    return {
      success: true,
      data: config,
    };
  }

  /**
   * Get sync summary
   */
  @Get('summary/all')
  async getSyncSummary() {
    const summary = await this.syncConfigService.getSyncSummary();

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Enable sync for entity
   */
  @Post(':entityType/enable')
  async enableSync(@Param('entityType') entityType: EntityType) {
    this.logger.log(`Enabling sync for ${entityType}`);
    const config = await this.syncConfigService.enableSync(entityType);

    return {
      success: true,
      message: `Sync enabled for ${entityType}`,
      data: config,
    };
  }

  /**
   * Disable sync for entity
   */
  @Post(':entityType/disable')
  async disableSync(@Param('entityType') entityType: EntityType) {
    this.logger.log(`Disabling sync for ${entityType}`);
    const config = await this.syncConfigService.disableSync(entityType);

    return {
      success: true,
      message: `Sync disabled for ${entityType}`,
      data: config,
    };
  }

  /**
   * Update sync config
   */
  @Put(':entityType')
  async updateConfig(
    @Param('entityType') entityType: EntityType,
    @Body() updates: any,
  ) {
    this.logger.log(`Updating sync config for ${entityType}`);
    const config = await this.syncConfigService.updateSyncConfig(
      entityType,
      updates,
    );

    return {
      success: true,
      message: `Sync config updated for ${entityType}`,
      data: config,
    };
  }

  /**
   * Initialize all configs with defaults
   */
  @Post('initialize')
  async initializeConfigs() {
    this.logger.log('Initializing all sync configs');
    const configs = await this.syncConfigService.initializeAllConfigs();

    return {
      success: true,
      message: `Initialized ${configs.length} sync configs`,
      data: configs,
    };
  }

  /**
   * Bulk update sync configs
   */
  @Post('bulk-update')
  async bulkUpdate(
    @Body()
    body: {
      updates: Array<{ entityType: EntityType; isEnabled: boolean }>;
    },
  ) {
    this.logger.log(`Bulk updating ${body.updates.length} sync configs`);
    const configs = await this.syncConfigService.bulkUpdateSyncConfigs(
      body.updates,
    );

    return {
      success: true,
      message: `Updated ${configs.length} sync configs`,
      data: configs,
    };
  }
}
