// path: server/src/api-settings/api-settings.service.ts
// version: 1.0 (API Settings Service)
// last-modified: 1 ตุลาคม 2568 11:45

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiSetting, ApiType } from '../entities/api-setting.entity';

@Injectable()
export class ApiSettingsService {
  constructor(
    @InjectRepository(ApiSetting)
    private apiSettingRepository: Repository<ApiSetting>,
  ) {}

  async findAll() {
    const settings = await this.apiSettingRepository.find({
      order: { apiType: 'ASC' },
    });

    // Don't expose sensitive data
    return settings.map(setting => ({
      ...setting,
      authPassword: setting.authPassword ? '****' : null,
      authToken: setting.authToken ? '****' : null,
    }));
  }

  async findOne(apiType: ApiType) {
    const setting = await this.apiSettingRepository.findOne({
      where: { apiType },
    });

    if (!setting) {
      throw new NotFoundException(`API setting for ${apiType} not found`);
    }

    // Don't expose sensitive data
    return {
      ...setting,
      authPassword: setting.authPassword ? '****' : null,
      authToken: setting.authToken ? '****' : null,
    };
  }

  async create(createDto: Partial<ApiSetting>) {
    const setting = this.apiSettingRepository.create(createDto);
    return await this.apiSettingRepository.save(setting);
  }

  async update(apiType: ApiType, updateDto: Partial<ApiSetting>) {
    const setting = await this.apiSettingRepository.findOne({
      where: { apiType },
    });

    if (!setting) {
      throw new NotFoundException(`API setting for ${apiType} not found`);
    }

    // Only update fields that are provided
    Object.keys(updateDto).forEach(key => {
      if (updateDto[key] !== undefined && updateDto[key] !== '****') {
        setting[key] = updateDto[key];
      }
    });

    return await this.apiSettingRepository.save(setting);
  }

  async delete(apiType: ApiType) {
    const result = await this.apiSettingRepository.delete({ apiType });

    if (result.affected === 0) {
      throw new NotFoundException(`API setting for ${apiType} not found`);
    }

    return { success: true, message: `API setting for ${apiType} deleted` };
  }

  async testConnection(apiType: ApiType) {
    const setting = await this.apiSettingRepository.findOne({
      where: { apiType, isActive: true },
    });

    if (!setting) {
      return {
        success: false,
        message: 'API setting not found or inactive',
      };
    }

    // Test connection logic would go here
    // For now, just return a placeholder
    return {
      success: true,
      message: 'Connection test not implemented yet',
      url: setting.url,
    };
  }
}
