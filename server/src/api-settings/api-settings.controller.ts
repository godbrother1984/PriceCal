// path: server/src/api-settings/api-settings.controller.ts
// version: 2.0 (Add JWT Authentication Guard - DEPRECATED)
// last-modified: 14 ตุลาคม 2568 15:45
// NOTE: This controller is deprecated as API import is no longer used

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiSettingsService } from './api-settings.service';
import { ApiType } from '../entities/api-setting.entity';

@Controller('api/api-settings')
@UseGuards(JwtAuthGuard)
export class ApiSettingsController {
  constructor(private readonly apiSettingsService: ApiSettingsService) {}

  @Get()
  async findAll() {
    const settings = await this.apiSettingsService.findAll();
    return {
      success: true,
      data: settings,
    };
  }

  @Get(':apiType')
  async findOne(@Param('apiType') apiType: ApiType) {
    const setting = await this.apiSettingsService.findOne(apiType);
    return {
      success: true,
      data: setting,
    };
  }

  @Post()
  async create(@Body() createDto: any) {
    const setting = await this.apiSettingsService.create(createDto);
    return {
      success: true,
      message: 'API setting created successfully',
      data: setting,
    };
  }

  @Put(':apiType')
  async update(@Param('apiType') apiType: ApiType, @Body() updateDto: any) {
    const setting = await this.apiSettingsService.update(apiType, updateDto);
    return {
      success: true,
      message: 'API setting updated successfully',
      data: setting,
    };
  }

  @Delete(':apiType')
  async delete(@Param('apiType') apiType: ApiType) {
    const result = await this.apiSettingsService.delete(apiType);
    return result;
  }

  @Post(':apiType/test')
  async testConnection(@Param('apiType') apiType: ApiType) {
    const result = await this.apiSettingsService.testConnection(apiType);
    return result;
  }
}
