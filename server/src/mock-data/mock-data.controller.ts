import { Controller, Get, Post, Body } from '@nestjs/common';
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

  // --- Master Data for Management Pages ---
  @Get('customer-groups')
  getAllCustomerGroups() {
    return this.mockDataService.findAllCustomerGroups();
  }
  @Get('customer-mappings')
  getAllCustomerMappings() {
    return this.mockDataService.findAllCustomerMappings();
  }
  @Get('fab-costs')
  getAllFabCosts() {
    return this.mockDataService.findAllFabCosts();
  }
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
