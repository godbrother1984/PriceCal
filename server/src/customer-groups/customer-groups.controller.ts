// path: server/src/customer-groups/customer-groups.controller.ts
// version: 1.0 (Initial Customer Group Controller)
// last-modified: 29 ตุลาคม 2568 17:30

import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { CustomerGroupsService, OverrideType } from './customer-groups.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customer-groups')
@UseGuards(JwtAuthGuard)
export class CustomerGroupsController {
  constructor(private readonly customerGroupsService: CustomerGroupsService) {}

  // ====================================
  // Customer Group CRUD
  // ====================================

  @Get()
  async findAll() {
    return this.customerGroupsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customerGroupsService.findOne(id);
  }

  @Post()
  async create(@Body() data: any, @Request() req) {
    data.createdBy = req.user?.username || 'admin';
    return this.customerGroupsService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Request() req) {
    data.updatedBy = req.user?.username || 'admin';
    return this.customerGroupsService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.customerGroupsService.delete(id);
  }

  // ====================================
  // Customer Mapping Management
  // ====================================

  @Get(':groupId/customers')
  async getCustomersByGroup(@Param('groupId') groupId: string) {
    return this.customerGroupsService.getCustomersByGroup(groupId);
  }

  @Post(':groupId/customers')
  async addCustomerToGroup(
    @Param('groupId') groupId: string,
    @Body('customerId') customerId: string,
    @Request() req
  ) {
    const createdBy = req.user?.username || 'admin';
    return this.customerGroupsService.addCustomerToGroup(groupId, customerId, createdBy);
  }

  @Delete(':groupId/customers/:customerId')
  async removeCustomerFromGroup(
    @Param('groupId') groupId: string,
    @Param('customerId') customerId: string
  ) {
    return this.customerGroupsService.removeCustomerFromGroup(groupId, customerId);
  }

  // ====================================
  // Override CRUD (Generic for all types)
  // ====================================

  @Get(':groupId/overrides/:type')
  async getOverrides(
    @Param('groupId') groupId: string,
    @Param('type') type: OverrideType
  ) {
    return this.customerGroupsService.getOverrides(groupId, type);
  }

  @Get(':groupId/overrides/:type/:overrideId')
  async getOverride(
    @Param('groupId') groupId: string,
    @Param('type') type: OverrideType,
    @Param('overrideId') overrideId: string
  ) {
    return this.customerGroupsService.getOverride(groupId, type, overrideId);
  }

  @Post(':groupId/overrides/:type')
  async createOverride(
    @Param('groupId') groupId: string,
    @Param('type') type: OverrideType,
    @Body() data: any,
    @Request() req
  ) {
    const createdBy = req.user?.username || 'admin';
    return this.customerGroupsService.createOverride(groupId, type, data, createdBy);
  }

  @Put(':groupId/overrides/:type/:overrideId')
  async updateOverride(
    @Param('groupId') groupId: string,
    @Param('type') type: OverrideType,
    @Param('overrideId') overrideId: string,
    @Body() data: any
  ) {
    return this.customerGroupsService.updateOverride(groupId, type, overrideId, data);
  }

  @Put(':groupId/overrides/:type/:overrideId/approve')
  async approveOverride(
    @Param('groupId') groupId: string,
    @Param('type') type: OverrideType,
    @Param('overrideId') overrideId: string,
    @Request() req
  ) {
    const approvedBy = req.user?.username || 'admin';
    return this.customerGroupsService.approveOverride(groupId, type, overrideId, approvedBy);
  }

  @Delete(':groupId/overrides/:type/:overrideId')
  async deleteOverride(
    @Param('groupId') groupId: string,
    @Param('type') type: OverrideType,
    @Param('overrideId') overrideId: string
  ) {
    return this.customerGroupsService.deleteOverride(groupId, type, overrideId);
  }
}
