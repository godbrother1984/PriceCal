// path: server/src/data/data.controller.ts
// version: 2.2 (Add Employee API Endpoint)
// last-modified: 30 ตุลาคม 2568 00:42

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataService } from './data.service';

@Controller('api/data')
@UseGuards(JwtAuthGuard)
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
    console.log(`[DataController] PUT /api/data/requests/${id}`);
    console.log('[DataController] Request body:', JSON.stringify(requestDto, null, 2));
    return this.dataService.updatePriceRequest(id, requestDto);
  }

  // --- Master Data ---
  @Get('customers')
  findAllCustomers() {
    return this.dataService.findAllCustomers();
  }

  @Get('employees')
  findAllEmployees() {
    return this.dataService.findAllEmployees();
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
  @Get('customer-groups/default')
  getDefaultCustomerGroup() {
    return this.dataService.getDefaultCustomerGroup();
  }

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

  // --- BOM (Bill of Materials) ---
  @Get('bom/product/:productId')
  findBOMByProductId(@Param('productId') productId: string) {
    return this.dataService.findBOMByProductId(productId);
  }

  @Post('bom')
  addBOM(@Body() bomDto: any) {
    return this.dataService.addBOM(bomDto);
  }

  @Put('bom/:id')
  updateBOM(@Param('id') id: string, @Body() bomDto: any) {
    return this.dataService.updateBOM(id, bomDto);
  }

  @Delete('bom/:id')
  deleteBOM(@Param('id') id: string) {
    return this.dataService.deleteBOM(id);
  }

  // --- Customer Mappings ---
  @Get('customer-mappings')
  findAllCustomerMappings() {
    return this.dataService.findAllCustomerMappings();
  }

  @Post('customer-mappings')
  addCustomerMapping(@Body() mappingDto: any) {
    return this.dataService.addCustomerMapping(mappingDto);
  }

  @Put('customer-mappings/:id')
  updateCustomerMapping(@Param('id') id: string, @Body() mappingDto: any) {
    return this.dataService.updateCustomerMapping(id, mappingDto);
  }

  @Delete('customer-mappings/:id')
  deleteCustomerMapping(@Param('id') id: string) {
    return this.dataService.deleteCustomerMapping(id);
  }

  // --- Fab Costs ---
  @Get('fab-costs')
  findAllFabCosts() {
    return this.dataService.findAllFabCosts();
  }

  // Get FabCost version history
  @Get('fab-costs/history/:id')
  getFabCostHistory(@Param('id') id: string) {
    return this.dataService.getFabCostHistory(id);
  }

  @Post('fab-costs')
  addFabCost(@Body() fabCostDto: any) {
    return this.dataService.addFabCost(fabCostDto);
  }

  // Approve Fab Cost
  @Put('fab-costs/:id/approve')
  approveFabCost(@Param('id') id: string) {
    return this.dataService.approveFabCost(id);
  }

  // Rollback Fab Cost to Archived Version
  @Put('fab-costs/:id/rollback')
  rollbackFabCost(@Param('id') id: string) {
    return this.dataService.rollbackFabCost(id);
  }

  @Put('fab-costs/:id')
  updateFabCost(@Param('id') id: string, @Body() fabCostDto: any) {
    return this.dataService.updateFabCost(id, fabCostDto);
  }

  @Delete('fab-costs/:id')
  deleteFabCost(@Param('id') id: string) {
    return this.dataService.deleteFabCost(id);
  }

  // --- Standard Prices (Read-only from MongoDB) ---
  @Get('standard-prices')
  async findAllStandardPrices() {
    return this.dataService.findAllStandardPrices();
  }

  // --- Selling Factors ---
  @Get('selling-factors')
  findAllSellingFactors() {
    return this.dataService.findAllSellingFactors();
  }

  // Get SellingFactor version history
  @Get('selling-factors/history/:id')
  getSellingFactorHistory(@Param('id') id: string) {
    return this.dataService.getSellingFactorHistory(id);
  }

  @Post('selling-factors')
  addSellingFactor(@Body() factorDto: any) {
    return this.dataService.addSellingFactor(factorDto);
  }

  // Approve Selling Factor
  @Put('selling-factors/:id/approve')
  approveSellingFactor(@Param('id') id: string) {
    return this.dataService.approveSellingFactor(id);
  }

  // Rollback Selling Factor to Archived Version
  @Put('selling-factors/:id/rollback')
  rollbackSellingFactor(@Param('id') id: string) {
    return this.dataService.rollbackSellingFactor(id);
  }

  @Put('selling-factors/:id')
  updateSellingFactor(@Param('id') id: string, @Body() factorDto: any) {
    return this.dataService.updateSellingFactor(id, factorDto);
  }

  @Delete('selling-factors/:id')
  deleteSellingFactor(@Param('id') id: string) {
    return this.dataService.deleteSellingFactor(id);
  }

  // --- LME Prices ---
  @Get('lme-prices')
  findAllLmePrices() {
    return this.dataService.findAllLmePrices();
  }

  @Post('lme-prices')
  addLmePrice(@Body() lmePriceDto: any) {
    return this.dataService.addLmePrice(lmePriceDto);
  }

  @Put('lme-prices/:id')
  updateLmePrice(@Param('id') id: string, @Body() lmePriceDto: any) {
    return this.dataService.updateLmePrice(id, lmePriceDto);
  }

  @Delete('lme-prices/:id')
  deleteLmePrice(@Param('id') id: string) {
    return this.dataService.deleteLmePrice(id);
  }

  // --- Exchange Rates ---
  @Get('exchange-rates')
  findAllExchangeRates() {
    return this.dataService.findAllExchangeRates();
  }

  @Post('exchange-rates')
  addExchangeRate(@Body() rateDto: any) {
    return this.dataService.addExchangeRate(rateDto);
  }

  @Put('exchange-rates/:id')
  updateExchangeRate(@Param('id') id: string, @Body() rateDto: any) {
    return this.dataService.updateExchangeRate(id, rateDto);
  }

  @Delete('exchange-rates/:id')
  deleteExchangeRate(@Param('id') id: string) {
    return this.dataService.deleteExchangeRate(id);
  }

  // --- LME Master Data (for calculation) ---
  // Get LME Master Data version history (MUST be before :id route)
  @Get('lme-master-data/history/:id')
  getLmeMasterDataHistory(@Param('id') id: string) {
    return this.dataService.getLmeMasterDataHistory(id);
  }

  @Get('lme-master-data')
  findAllLmeMasterData() {
    return this.dataService.findAllLmeMasterData();
  }

  @Post('lme-master-data')
  addLmeMasterData(@Body() lmeDto: any) {
    return this.dataService.addLmeMasterData(lmeDto);
  }

  // Approve LME Master Data
  @Put('lme-master-data/:id/approve')
  approveLmeMasterData(@Param('id') id: string) {
    return this.dataService.approveLmeMasterData(id);
  }

  // Rollback LME Master Data to Archived Version
  @Put('lme-master-data/:id/rollback')
  rollbackLmeMasterData(@Param('id') id: string) {
    return this.dataService.rollbackLmeMasterData(id);
  }

  @Put('lme-master-data/:id')
  updateLmeMasterData(@Param('id') id: string, @Body() lmeDto: any) {
    return this.dataService.updateLmeMasterData(id, lmeDto);
  }

  @Delete('lme-master-data/:id')
  deleteLmeMasterData(@Param('id') id: string) {
    return this.dataService.deleteLmeMasterData(id);
  }

  // --- Exchange Rate Master Data (for calculation) ---
  // Get Exchange Rate Master Data version history (MUST be before :id route)
  @Get('exchange-rate-master-data/history/:id')
  getExchangeRateMasterDataHistory(@Param('id') id: string) {
    return this.dataService.getExchangeRateMasterDataHistory(id);
  }

  @Get('exchange-rate-master-data')
  findAllExchangeRateMasterData() {
    return this.dataService.findAllExchangeRateMasterData();
  }

  @Post('exchange-rate-master-data')
  addExchangeRateMasterData(@Body() rateDto: any) {
    return this.dataService.addExchangeRateMasterData(rateDto);
  }

  // Approve Exchange Rate Master Data
  @Put('exchange-rate-master-data/:id/approve')
  approveExchangeRateMasterData(@Param('id') id: string) {
    return this.dataService.approveExchangeRateMasterData(id);
  }

  // Rollback Exchange Rate Master Data to Archived Version
  @Put('exchange-rate-master-data/:id/rollback')
  rollbackExchangeRateMasterData(@Param('id') id: string) {
    return this.dataService.rollbackExchangeRateMasterData(id);
  }

  @Put('exchange-rate-master-data/:id')
  updateExchangeRateMasterData(@Param('id') id: string, @Body() rateDto: any) {
    return this.dataService.updateExchangeRateMasterData(id, rateDto);
  }

  @Delete('exchange-rate-master-data/:id')
  deleteExchangeRateMasterData(@Param('id') id: string) {
    return this.dataService.deleteExchangeRateMasterData(id);
  }

  // --- Currencies ---
  @Get('currencies')
  findAllCurrencies() {
    return this.dataService.findAllCurrencies();
  }

  @Post('currencies')
  addCurrency(@Body() currencyDto: any) {
    return this.dataService.addCurrency(currencyDto);
  }

  @Put('currencies/:id')
  updateCurrency(@Param('id') id: string, @Body() currencyDto: any) {
    return this.dataService.updateCurrency(id, currencyDto);
  }

  @Delete('currencies/:id')
  deleteCurrency(@Param('id') id: string) {
    return this.dataService.deleteCurrency(id);
  }

  @Get('d365-raw-materials')
  findAllD365RawMaterials() {
    return this.dataService.findAllRawMaterials();
  }

  @Get('d365-fab-patterns')
  findAllD365FabPatterns() {
    return [
      { id: 'FAB-001', name: 'Standard Fabrication', code: 'STD' },
      { id: 'FAB-002', name: 'Complex Fabrication', code: 'CPX' },
      { id: 'FAB-003', name: 'Simple Fabrication', code: 'SMP' }
    ];
  }

  @Get('d365-item-groups')
  async findAllD365ItemGroups() {
    return this.dataService.findAllItemGroups();
  }

  // --- System Configuration ---
  @Get('system-config')
  findAllSystemConfigs() {
    return this.dataService.findAllSystemConfigs();
  }

  @Get('system-config/:key')
  findOneSystemConfig(@Param('key') key: string) {
    return this.dataService.findOneSystemConfig(key);
  }

  @Put('system-config/:key')
  updateSystemConfig(@Param('key') key: string, @Body() configDto: any) {
    return this.dataService.updateSystemConfig(key, configDto);
  }
}