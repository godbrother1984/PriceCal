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
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { 
  CreateCustomerGroupDto, 
  UpdateCustomerGroupDto,
  CreateCustomerMappingDto,
  UpdateCustomerMappingDto,
  CreateFabCostDto,
  UpdateFabCostDto,
  CreateExchangeRateDto,
  UpdateExchangeRateDto
} from './dto';

@Controller('mock-data')
@UsePipes(new ValidationPipe({ 
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true 
}))
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // --- Price Requests ---
  @Get('requests')
  getAllRequests() {
    try {
      return this.masterDataService.findAllRequests();
    } catch (error) {
      throw new BadRequestException('Failed to fetch requests');
    }
  }

  @Get('requests/:id')
  findOneRequest(@Param('id') id: string) {
    const request = this.masterDataService.findOneRequest(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }
    return request;
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  addRequest(@Body() requestDto: any) {
    try {
      return this.masterDataService.addPriceRequest(requestDto);
    } catch (error) {
      throw new BadRequestException('Failed to create request');
    }
  }

  @Put('requests/:id')
  updateRequest(@Param('id') id: string, @Body() requestDto: any) {
    try {
      return this.masterDataService.updatePriceRequest(id, requestDto);
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
    return this.masterDataService.findAllCustomers();
  }

  @Get('products')
  getAllProducts() {
    return this.masterDataService.findAllProducts();
  }

  @Get('raw-materials')
  getAllRawMaterials() {
    return this.masterDataService.findAllRawMaterials();
  }

  // --- Customer Groups ---
  @Get('customer-groups')
  getAllCustomerGroups() {
    return this.masterDataService.findAllCustomerGroups();
  }

  @Post('customer-groups')
  @HttpCode(HttpStatus.CREATED)
  async addCustomerGroup(@Body() groupDto: CreateCustomerGroupDto) {
    try {
      // Check for duplicate names
      const existingGroups = this.masterDataService.findAllCustomerGroups();
      const duplicate = existingGroups.find(group => 
        group.name.toLowerCase() === groupDto.name.toLowerCase()
      );
      
      if (duplicate) {
        throw new ConflictException(`Customer group with name "${groupDto.name}" already exists`);
      }

      return this.masterDataService.addCustomerGroup(groupDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create customer group');
    }
  }

  @Put('customer-groups/:id')
  updateCustomerGroup(@Param('id') id: string, @Body() groupDto: UpdateCustomerGroupDto) {
    try {
      return this.masterDataService.updateCustomerGroup(id, groupDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update customer group');
    }
  }

  @Delete('customer-groups/:id')
  @HttpCode(HttpStatus.OK)
  deleteCustomerGroup(@Param('id') id: string) {
    try {
      // Check if group is being used in mappings
      const mappings = this.masterDataService.findAllCustomerMappings();
      const usedInMapping = mappings.find(mapping => mapping.customerGroupId === id);
      
      if (usedInMapping) {
        throw new ConflictException('Cannot delete customer group that is being used in customer mappings');
      }

      return this.masterDataService.deleteCustomerGroup(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete customer group');
    }
  }
  
  // --- Customer Mappings ---
  @Get('customer-mappings')
  getAllCustomerMappings() {
    return this.masterDataService.findAllCustomerMappings();
  }

  @Post('customer-mappings')
  @HttpCode(HttpStatus.CREATED)
  addCustomerMapping(@Body() mappingDto: CreateCustomerMappingDto) {
    try {
      // Check for duplicate customer - each customer can only be mapped to ONE group
      const existingMappings = this.masterDataService.findAllCustomerMappings();
      const duplicate = existingMappings.find(mapping => 
        mapping.customerId === mappingDto.customerId
      );
      
      if (duplicate) {
        throw new ConflictException(`Customer "${mappingDto.customerId}" is already mapped to group "${duplicate.customerGroupId}". Please remove the existing mapping first or update it instead.`);
      }

      // Validate customer exists
      const customers = this.masterDataService.findAllCustomers();
      const customerExists = customers.find(c => c.id === mappingDto.customerId);
      if (!customerExists) {
        throw new BadRequestException(`Customer with ID "${mappingDto.customerId}" does not exist`);
      }

      // Validate customer group exists
      const groups = this.masterDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === mappingDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${mappingDto.customerGroupId}" does not exist`);
      }

      return this.masterDataService.addCustomerMapping(mappingDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create customer mapping');
    }
  }

  @Put('customer-mappings/:id')
  updateCustomerMapping(@Param('id') id: string, @Body() mappingDto: UpdateCustomerMappingDto) {
    try {
      // Check for duplicate customer (excluding the current mapping being updated)
      const existingMappings = this.masterDataService.findAllCustomerMappings();
      const duplicate = existingMappings.find(mapping => 
        mapping.customerId === mappingDto.customerId && 
        mapping.id !== id // Exclude current mapping
      );
      
      if (duplicate) {
        throw new ConflictException(`Customer "${mappingDto.customerId}" is already mapped to group "${duplicate.customerGroupId}". Each customer can only be mapped to one group.`);
      }

      // Validate customer exists
      const customers = this.masterDataService.findAllCustomers();
      const customerExists = customers.find(c => c.id === mappingDto.customerId);
      if (!customerExists) {
        throw new BadRequestException(`Customer with ID "${mappingDto.customerId}" does not exist`);
      }

      // Validate customer group exists
      const groups = this.masterDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === mappingDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${mappingDto.customerGroupId}" does not exist`);
      }

      return this.masterDataService.updateCustomerMapping(id, mappingDto);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update customer mapping');
    }
  }

  @Delete('customer-mappings/:id')
  @HttpCode(HttpStatus.OK)
  deleteCustomerMapping(@Param('id') id: string) {
    try {
      return this.masterDataService.deleteCustomerMapping(id);
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
    return this.masterDataService.findAllFabCosts();
  }

  @Post('fab-costs')
  @HttpCode(HttpStatus.CREATED)
  addFabCost(@Body() costDto: CreateFabCostDto) {
    try {
      // Validate customer group exists
      const groups = this.masterDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === costDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${costDto.customerGroupId}" does not exist`);
      }

      // Check for duplicate fab costs for same group
      const existingCosts = this.masterDataService.findAllFabCosts();
      const duplicate = existingCosts.find(cost => 
        cost.customerGroupId === costDto.customerGroupId && 
        cost.currency === costDto.currency
      );
      
      if (duplicate) {
        throw new ConflictException(`Fab cost already exists for group "${costDto.customerGroupId}" in currency "${costDto.currency}"`);
      }

      return this.masterDataService.addFabCost(costDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create fab cost');
    }
  }

  @Put('fab-costs/:id')
  updateFabCost(@Param('id') id: string, @Body() costDto: UpdateFabCostDto) {
    try {
      return this.masterDataService.updateFabCost(id, costDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update fab cost');
    }
  }

  @Delete('fab-costs/:id')
  @HttpCode(HttpStatus.OK)
  deleteFabCost(@Param('id') id: string) {
    try {
      return this.masterDataService.deleteFabCost(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete fab cost');
    }
  }
  
  // --- Other Masters (GET only for now as per UI) ---
  @Get('standard-prices')
  getAllStandardPrices() {
    return this.masterDataService.findAllStandardPrices();
  }

  @Get('selling-factors')
  getAllSellingFactors() {
    return this.masterDataService.findAllSellingFactors();
  }

  @Get('lme-prices')
  getAllLmePrices() {
    return this.masterDataService.findAllLmePrices();
  }

  // --- Exchange Rates ---
  @Get('exchange-rates')
  getAllExchangeRates() {
    return this.masterDataService.findAllExchangeRates();
  }

  @Post('exchange-rates')
  @HttpCode(HttpStatus.CREATED)
  addExchangeRate(@Body() rateDto: CreateExchangeRateDto) {
    try {
      // Validate customer group exists
      const groups = this.masterDataService.findAllCustomerGroups();
      const groupExists = groups.find(g => g.id === rateDto.customerGroupId);
      if (!groupExists) {
        throw new BadRequestException(`Customer group with ID "${rateDto.customerGroupId}" does not exist`);
      }

      // Validate different currencies
      if (rateDto.sourceCurrency === rateDto.destinationCurrency) {
        throw new BadRequestException('Source and destination currencies must be different');
      }

      // Check for duplicate exchange rates
      const existingRates = this.masterDataService.findAllExchangeRates();
      const duplicate = existingRates.find(rate => 
        rate.customerGroupId === rateDto.customerGroupId &&
        rate.sourceCurrency === rateDto.sourceCurrency &&
        rate.destinationCurrency === rateDto.destinationCurrency
      );
      
      if (duplicate) {
        throw new ConflictException(`Exchange rate already exists for ${rateDto.sourceCurrency} to ${rateDto.destinationCurrency} in group "${rateDto.customerGroupId}"`);
      }

      return this.masterDataService.addExchangeRate(rateDto);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create exchange rate');
    }
  }

  @Put('exchange-rates/:id')
  updateExchangeRate(@Param('id') id: string, @Body() rateDto: UpdateExchangeRateDto) {
    try {
      return this.masterDataService.updateExchangeRate(id, rateDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update exchange rate');
    }
  }

  @Delete('exchange-rates/:id')
  @HttpCode(HttpStatus.OK)
  deleteExchangeRate(@Param('id') id: string) {
    try {
      return this.masterDataService.deleteExchangeRate(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete exchange rate');
    }
  }
}