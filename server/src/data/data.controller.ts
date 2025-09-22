// path: server/src/data/data.controller.ts
// version: 1.0 (Database Data Controller - แทนที่ Mock Data Controller)
// last-modified: 22 กันยายน 2568 11:10

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('api/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  // --- Price Requests ---
  @Get('requests')
  findAllRequests() {
    return this.dataService.findAllRequests();
  }

  @Get('requests/:id')
  findOneRequest(@Param('id') id: string) {
    return this.dataService.findOneRequest(id);
  }

  @Post('requests')
  addPriceRequest(@Body() requestDto: any) {
    return this.dataService.addPriceRequest(requestDto);
  }

  @Put('requests/:id')
  updatePriceRequest(@Param('id') id: string, @Body() requestDto: any) {
    return this.dataService.updatePriceRequest(id, requestDto);
  }

  // --- Master Data ---
  @Get('customers')
  findAllCustomers() {
    return this.dataService.findAllCustomers();
  }

  @Get('products')
  findAllProducts() {
    return this.dataService.findAllProducts();
  }

  @Get('raw-materials')
  findAllRawMaterials() {
    return this.dataService.findAllRawMaterials();
  }

  // --- Customer Groups ---
  @Get('customer-groups')
  findAllCustomerGroups() {
    return this.dataService.findAllCustomerGroups();
  }

  @Post('customer-groups')
  addCustomerGroup(@Body() groupDto: any) {
    return this.dataService.addCustomerGroup(groupDto);
  }

  @Put('customer-groups/:id')
  updateCustomerGroup(@Param('id') id: string, @Body() groupDto: any) {
    return this.dataService.updateCustomerGroup(id, groupDto);
  }

  @Delete('customer-groups/:id')
  deleteCustomerGroup(@Param('id') id: string) {
    return this.dataService.deleteCustomerGroup(id);
  }

  // --- Other endpoints for compatibility ---
  @Get('customer-mappings')
  findAllCustomerMappings() {
    return this.dataService.findAllCustomerMappings();
  }

  @Get('fab-costs')
  findAllFabCosts() {
    return this.dataService.findAllFabCosts();
  }

  @Get('standard-prices')
  findAllStandardPrices() {
    return this.dataService.findAllStandardPrices();
  }

  @Get('selling-factors')
  findAllSellingFactors() {
    return this.dataService.findAllSellingFactors();
  }

  @Get('lme-prices')
  findAllLmePrices() {
    return this.dataService.findAllLmePrices();
  }

  @Get('exchange-rates')
  findAllExchangeRates() {
    return this.dataService.findAllExchangeRates();
  }
}