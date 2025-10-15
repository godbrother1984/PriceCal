// path: server/src/master-data/master-data.controller.ts
// version: 3.0 (Add JWT Authentication Guard)
// last-modified: 14 ตุลาคม 2568 15:45

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MockDataService } from '../mock-data/mock-data.service';

@Controller('mock-data')
@UseGuards(JwtAuthGuard)
export class MasterDataController {
  constructor(private readonly mockDataService: MockDataService) {}

  // --- NEW: D365 Mock Data Endpoints ---
  @Get('d365-raw-materials')
  getD365RawMaterials() {
    return this.mockDataService.findAllD365RawMaterials();
  }

  @Get('d365-fab-patterns')
  getD365FabPatterns() {
    return this.mockDataService.findAllD365FabPatterns();
  }

  @Get('d365-item-groups')
  getD365ItemGroups() {
    return this.mockDataService.findAllD365ItemGroups();
  }

  // --- Currencies ---
  @Get('currencies')
  getAllCurrencies() {
    return this.mockDataService.findAllCurrencies();
  }

  @Post('currencies')
  @HttpCode(HttpStatus.CREATED)
  addCurrency(@Body() currencyDto: any) {
    try {
      // Check for duplicate currency codes
      const existingCurrencies = this.mockDataService.findAllCurrencies();
      const duplicate = existingCurrencies.find(currency => 
        currency.code.toLowerCase() === currencyDto.code.toLowerCase()
      );
      
      if (duplicate) {
        throw new ConflictException(`Currency with code "${currencyDto.code}" already exists`);
      }

      return this.mockDataService.addCurrency(currencyDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create currency');
    }
  }

  @Put('currencies/:id')
  updateCurrency(@Param('id') id: string, @Body() currencyDto: any) {
    try {
      return this.mockDataService.updateCurrency(id, currencyDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update currency');
    }
  }

  @Delete('currencies/:id')
  deleteCurrency(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteCurrency(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete currency');
    }
  }

  // --- Price Requests ---
  @Get('requests')
  getAllRequests() {
    try {
      return this.mockDataService.findAllRequests();
    } catch (error) {
      throw new BadRequestException('Failed to fetch requests');
    }
  }

  @Get('requests/:id')
  findOneRequest(@Param('id') id: string) {
    try {
      return this.mockDataService.findOneRequest(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch request');
    }
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  addRequest(@Body() requestDto: any) {
    try {
      return this.mockDataService.addPriceRequest(requestDto);
    } catch (error) {
      throw new BadRequestException('Failed to create request');
    }
  }

  @Put('requests/:id')
  updateRequest(@Param('id') id: string, @Body() requestDto: any) {
    try {
      return this.mockDataService.updatePriceRequest(id, requestDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update request');
    }
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
  @HttpCode(HttpStatus.CREATED)
  addCustomerGroup(@Body() groupDto: any) {
    try {
      // Check for duplicate names
      const existingGroups = this.mockDataService.findAllCustomerGroups();
      const duplicate = existingGroups.find(group => 
        group.name.toLowerCase() === groupDto.name.toLowerCase()
      );
      
      if (duplicate) {
        throw new ConflictException(`Customer group with name "${groupDto.name}" already exists`);
      }

      return this.mockDataService.addCustomerGroup(groupDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create customer group');
    }
  }

  @Put('customer-groups/:id')
  updateCustomerGroup(@Param('id') id: string, @Body() groupDto: any) {
    try {
      return this.mockDataService.updateCustomerGroup(id, groupDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update customer group');
    }
  }

  @Delete('customer-groups/:id')
  deleteCustomerGroup(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteCustomerGroup(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete customer group');
    }
  }

  // --- Customer Mappings ---
  @Get('customer-mappings')
  getAllCustomerMappings() {
    return this.mockDataService.findAllCustomerMappings();
  }

  @Post('customer-mappings')
  @HttpCode(HttpStatus.CREATED)
  addCustomerMapping(@Body() mappingDto: any) {
    try {
      // Validate customer exists
      const customers = this.mockDataService.findAllCustomers();
      const customerExists = customers.find(c => c.id === mappingDto.customerId);
      if (!customerExists) {
        throw new BadRequestException(`Customer with ID "${mappingDto.customerId}" does not exist`);
      }

      // Validate customer group exists
      const groups = this.mockDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === mappingDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${mappingDto.customerGroupId}" does not exist`);
      }

      // Check for duplicate mapping
      const existingMappings = this.mockDataService.findAllCustomerMappings();
      const duplicate = existingMappings.find(mapping => 
        mapping.customerId === mappingDto.customerId
      );
      
      if (duplicate) {
        throw new ConflictException(`Customer mapping for "${mappingDto.customerId}" already exists`);
      }

      return this.mockDataService.addCustomerMapping(mappingDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create customer mapping');
    }
  }

  @Put('customer-mappings/:id')
  updateCustomerMapping(@Param('id') id: string, @Body() mappingDto: any) {
    try {
      return this.mockDataService.updateCustomerMapping(id, mappingDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update customer mapping');
    }
  }

  @Delete('customer-mappings/:id')
  deleteCustomerMapping(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteCustomerMapping(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete customer mapping');
    }
  }

  // --- Fab Costs ---
  @Get('fab-costs')
  getAllFabCosts() {
    return this.mockDataService.findAllFabCosts();
  }

  @Post('fab-costs')
  @HttpCode(HttpStatus.CREATED)
  addFabCost(@Body() costDto: any) {
    try {
      // Validate customer group exists
      const groups = this.mockDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === costDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${costDto.customerGroupId}" does not exist`);
      }

      // Check for duplicate fab costs for same group
      const existingCosts = this.mockDataService.findAllFabCosts();
      const duplicate = existingCosts.find(cost => 
        cost.customerGroupId === costDto.customerGroupId && 
        cost.currency === costDto.currency
      );
      
      if (duplicate) {
        throw new ConflictException(`Fab cost already exists for group "${costDto.customerGroupId}" in currency "${costDto.currency}"`);
      }

      return this.mockDataService.addFabCost(costDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create fab cost');
    }
  }

  @Put('fab-costs/:id')
  updateFabCost(@Param('id') id: string, @Body() costDto: any) {
    try {
      return this.mockDataService.updateFabCost(id, costDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update fab cost');
    }
  }

  @Delete('fab-costs/:id')
  deleteFabCost(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteFabCost(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete fab cost');
    }
  }

  // --- Standard Prices ---
  @Get('standard-prices')
  getAllStandardPrices() {
    return this.mockDataService.findAllStandardPrices();
  }

  @Post('standard-prices')
  @HttpCode(HttpStatus.CREATED)
  addStandardPrice(@Body() priceDto: any) {
    try {
      // Validate raw material exists
      const rawMaterials = this.mockDataService.findAllD365RawMaterials();
      const rmExists = rawMaterials.find(rm => rm.id === priceDto.rmId);
      if (!rmExists) {
        throw new BadRequestException(`Raw material with ID "${priceDto.rmId}" does not exist`);
      }

      // Check for duplicate standard prices for same RM
      const existingPrices = this.mockDataService.findAllStandardPrices();
      const duplicate = existingPrices.find(price => 
        price.rmId === priceDto.rmId && 
        price.currency === priceDto.currency
      );
      
      if (duplicate) {
        throw new ConflictException(`Standard price already exists for raw material "${priceDto.rmId}" in currency "${priceDto.currency}"`);
      }

      return this.mockDataService.addStandardPrice(priceDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create standard price');
    }
  }

  @Put('standard-prices/:id')
  updateStandardPrice(@Param('id') id: string, @Body() priceDto: any) {
    try {
      return this.mockDataService.updateStandardPrice(id, priceDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update standard price');
    }
  }

  @Delete('standard-prices/:id')
  deleteStandardPrice(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteStandardPrice(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete standard price');
    }
  }

  // --- Selling Factors ---
  @Get('selling-factors')
  getAllSellingFactors() {
    return this.mockDataService.findAllSellingFactors();
  }

  @Post('selling-factors')
  @HttpCode(HttpStatus.CREATED)
  addSellingFactor(@Body() factorDto: any) {
    try {
      // Validate fab pattern exists
      const fabPatterns = this.mockDataService.findAllD365FabPatterns();
      const patternExists = fabPatterns.find(fp => fp.id === factorDto.pattern);
      if (!patternExists) {
        throw new BadRequestException(`Fab pattern with ID "${factorDto.pattern}" does not exist`);
      }

      // Check for duplicate selling factors for same pattern
      const existingFactors = this.mockDataService.findAllSellingFactors();
      const duplicate = existingFactors.find(factor => 
        factor.pattern === factorDto.pattern
      );
      
      if (duplicate) {
        throw new ConflictException(`Selling factor already exists for pattern "${factorDto.pattern}"`);
      }

      return this.mockDataService.addSellingFactor(factorDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create selling factor');
    }
  }

  @Put('selling-factors/:id')
  updateSellingFactor(@Param('id') id: string, @Body() factorDto: any) {
    try {
      return this.mockDataService.updateSellingFactor(id, factorDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update selling factor');
    }
  }

  @Delete('selling-factors/:id')
  deleteSellingFactor(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteSellingFactor(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete selling factor');
    }
  }

  // --- LME Prices ---
  @Get('lme-prices')
  getAllLmePrices() {
    return this.mockDataService.findAllLmePrices();
  }

  @Post('lme-prices')
  @HttpCode(HttpStatus.CREATED)
  addLmePrice(@Body() priceDto: any) {
    try {
      // Validate customer group exists
      const groups = this.mockDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === priceDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${priceDto.customerGroupId}" does not exist`);
      }

      // Validate item group exists
      const itemGroups = this.mockDataService.findAllD365ItemGroups();
      const itemGroupExists = itemGroups.find(ig => ig.id === priceDto.itemGroupCode);
      if (!itemGroupExists) {
        throw new BadRequestException(`Item group with ID "${priceDto.itemGroupCode}" does not exist`);
      }

      // Check for duplicate LME prices
      const existingPrices = this.mockDataService.findAllLmePrices();
      const duplicate = existingPrices.find(price => 
        price.customerGroupId === priceDto.customerGroupId && 
        price.itemGroupCode === priceDto.itemGroupCode &&
        price.currency === priceDto.currency
      );
      
      if (duplicate) {
        throw new ConflictException(`LME price already exists for this combination`);
      }

      return this.mockDataService.addLmePrice(priceDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create LME price');
    }
  }

  @Put('lme-prices/:id')
  updateLmePrice(@Param('id') id: string, @Body() priceDto: any) {
    try {
      return this.mockDataService.updateLmePrice(id, priceDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update LME price');
    }
  }

  @Delete('lme-prices/:id')
  deleteLmePrice(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteLmePrice(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete LME price');
    }
  }

  // --- Exchange Rates ---
  @Get('exchange-rates')
  getAllExchangeRates() {
    return this.mockDataService.findAllExchangeRates();
  }

  @Post('exchange-rates')
  @HttpCode(HttpStatus.CREATED)
  addExchangeRate(@Body() rateDto: any) {
    try {
      // Validate customer group exists
      const groups = this.mockDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === rateDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${rateDto.customerGroupId}" does not exist`);
      }

      return this.mockDataService.addExchangeRate(rateDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create exchange rate');
    }
  }

  @Put('exchange-rates/:id')
  updateExchangeRate(@Param('id') id: string, @Body() rateDto: any) {
    try {
      return this.mockDataService.updateExchangeRate(id, rateDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update exchange rate');
    }
  }

  @Delete('exchange-rates/:id')
  deleteExchangeRate(@Param('id') id: string) {
    try {
      return this.mockDataService.deleteExchangeRate(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete exchange rate');
    }
  }
}