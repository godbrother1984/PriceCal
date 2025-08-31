// path: server/src/master-data/master-data.controller.ts
// version: 2.0 (MockDataService Integration)
// last-modified: 31 สิงหาคม 2568

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
  ConflictException
} from '@nestjs/common';
import { MockDataService } from '../mock-data/mock-data.service';

@Controller('mock-data')
export class MasterDataController {
  constructor(private readonly mockDataService: MockDataService) {}

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

      // Check for duplicate mappings
      const existingMappings = this.mockDataService.findAllCustomerMappings();
      const duplicate = existingMappings.find(mapping => 
        mapping.customerId === mappingDto.customerId
      );
      
      if (duplicate) {
        throw new ConflictException(`Customer "${mappingDto.customerId}" is already mapped to a group`);
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

  // --- Other Masters (GET only for now) ---
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