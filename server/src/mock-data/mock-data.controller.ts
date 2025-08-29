import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { MockDataService } from './mock-data.service';

@Controller('mock-data')
export class MockDataController {
  constructor(private readonly mockDataService: MockDataService) {}

  // --- Price Requests ---
  @Get('requests')
  getAllRequests() {
    return this.mockDataService.findAllRequests();
  }
  @Post('requests')
  addRequest(@Body() requestDto: any) {
    return this.mockDataService.addPriceRequest(requestDto);
  }

  // --- Master Data for Search ---
  @Get('customers')
  getAllCustomers() {
    return this.mockDataService.findAllCustomers();
  }
  @Get('products')
  getAllProducts() {
    return this.mockDataService.findAllProducts();
  }
  @Get('raw-materials')
  getAllRawMaterials() {
    return this.mockDataService.findAllRawMaterials();
  }

  // --- Customer Groups ---
  @Get('customer-groups')
  getAllCustomerGroups() {
    return this.mockDataService.findAllCustomerGroups();
  }
  @Post('customer-groups')
  addCustomerGroup(@Body() groupDto: any) {
    return this.mockDataService.addCustomerGroup(groupDto);
  }
  @Put('customer-groups/:id')
  updateCustomerGroup(@Param('id') id: string, @Body() groupDto: any) {
    return this.mockDataService.updateCustomerGroup(id, groupDto);
  }
  @Delete('customer-groups/:id')
  deleteCustomerGroup(@Param('id') id: string) {
    return this.mockDataService.deleteCustomerGroup(id);
  }

  // --- Customer Mappings ---
  @Get('customer-mappings')
  getAllCustomerMappings() {
    return this.mockDataService.findAllCustomerMappings();
  }
  @Post('customer-mappings')
  addCustomerMapping(@Body() mappingDto: any) {
    return this.mockDataService.addCustomerMapping(mappingDto);
  }
  @Put('customer-mappings/:id')
  updateCustomerMapping(@Param('id') id: string, @Body() mappingDto: any) {
    return this.mockDataService.updateCustomerMapping(id, mappingDto);
  }
  @Delete('customer-mappings/:id')
  deleteCustomerMapping(@Param('id') id: string) {
    return this.mockDataService.deleteCustomerMapping(id);
  }

  // --- Fab Costs ---
  @Get('fab-costs')
  getAllFabCosts() {
    return this.mockDataService.findAllFabCosts();
  }
  @Post('fab-costs')
  addFabCost(@Body() costDto: any) {
    return this.mockDataService.addFabCost(costDto);
  }
  @Put('fab-costs/:id')
  updateFabCost(@Param('id') id: string, @Body() costDto: any) {
    return this.mockDataService.updateFabCost(id, costDto);
  }
  @Delete('fab-costs/:id')
  deleteFabCost(@Param('id') id: string) {
    return this.mockDataService.deleteFabCost(id);
  }
  
  // --- Other Masters (GET only for now as per UI) ---
  @Get('standard-prices')
  getAllStandardPrices() {
    return this.mockDataService.findAllStandardPrices();
  }

  @Get('selling-factors')
  getAllSellingFactors() {
    return this.mockDataService.findAllSellingFactors();
  }

  @Get('lme-prices')
  getAllLmePrices() {
    return this.mockDataService.findAllLmePrices();
  }

  @Get('exchange-rates')
  getAllExchangeRates() {
    return this.mockDataService.findAllExchangeRates();
  }
}
