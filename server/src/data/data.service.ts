// path: server/src/data/data.service.ts
// version: 1.0 (Database Data Service - แทนที่ Mock Data Service)
// last-modified: 22 กันยายน 2568 11:05

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { PriceRequest } from '../entities/price-request.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { User } from '../entities/user.entity';
import { BOM } from '../entities/bom.entity';

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(RawMaterial)
    private rawMaterialRepository: Repository<RawMaterial>,
    @InjectRepository(PriceRequest)
    private priceRequestRepository: Repository<PriceRequest>,
    @InjectRepository(CustomerGroup)
    private customerGroupRepository: Repository<CustomerGroup>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BOM)
    private bomRepository: Repository<BOM>,
  ) {}

  // --- Price Requests ---
  async findAllRequests() {
    const requests = await this.priceRequestRepository.find({
      order: { createdAt: 'DESC' }
    });

    return requests.map(request => ({
      id: request.id,
      customerName: request.customerName,
      productName: request.productName,
      status: request.status,
      createdBy: request.createdBy,
      createdAt: request.createdAt.toISOString().split('T')[0],
      costingBy: request.costingBy,
    }));
  }

  async findOneRequest(id: string) {
    const request = await this.priceRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    return {
      ...request,
      formData: request.formData ? JSON.parse(request.formData) : null,
      boqItems: request.boqItems ? JSON.parse(request.boqItems) : [],
      calculationResult: request.calculationResult ? JSON.parse(request.calculationResult) : null,
    };
  }

  async addPriceRequest(requestDto: any) {
    const newId = `REQ-${String(Date.now()).slice(-5)}`;

    // Handle customer and product IDs for foreign key constraints
    let customerId = null;
    let productId = null;
    let createdBy = null;

    // For existing customers, only use ID if it exists in database
    if (requestDto.customerType === 'existing' && requestDto.formData?.customerId) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { id: requestDto.formData.customerId }
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    // For existing products, only use ID if it exists in database
    if (requestDto.productType === 'existing' && requestDto.formData?.productId) {
      const existingProduct = await this.productRepository.findOne({
        where: { id: requestDto.formData.productId }
      });
      if (existingProduct) {
        productId = existingProduct.id;
      }
    }

    // Get default admin user for createdBy
    const adminUser = await this.userRepository.findOne({ where: { username: 'admin' } });
    if (adminUser) {
      createdBy = adminUser.id;
    }

    const request = this.priceRequestRepository.create({
      id: newId,
      customerId: customerId,
      customerName: requestDto.formData?.customerName || requestDto.formData?.newCustomerName,
      productId: productId,
      productName: requestDto.formData?.productName || requestDto.formData?.newProductName,
      status: 'Pending',
      createdBy: createdBy,
      formData: JSON.stringify(requestDto.formData || {}),
      customerType: requestDto.customerType || '',
      productType: requestDto.productType || '',
      boqItems: JSON.stringify(requestDto.boqItems || []),
      calculationResult: requestDto.calculationResult ? JSON.stringify(requestDto.calculationResult) : null,
    });

    const savedRequest = await this.priceRequestRepository.save(request);
    return savedRequest;
  }

  async updatePriceRequest(id: string, requestDto: any) {
    const request = await this.priceRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    // Update fields
    request.customerName = requestDto.formData?.customerName || requestDto.formData?.newCustomerName || request.customerName;
    request.productName = requestDto.formData?.productName || requestDto.formData?.newProductName || request.productName;
    request.formData = JSON.stringify(requestDto.formData || {});
    request.customerType = requestDto.customerType || request.customerType;
    request.productType = requestDto.productType || request.productType;
    request.boqItems = JSON.stringify(requestDto.boqItems || []);

    if (requestDto.calculationResult) {
      request.calculationResult = JSON.stringify(requestDto.calculationResult);
    }

    const updatedRequest = await this.priceRequestRepository.save(request);
    console.log('Updated Request:', updatedRequest);
    return updatedRequest;
  }

  // --- Master Data ---
  async findAllCustomers() {
    return this.customerRepository.find({ where: { isActive: true } });
  }

  async findAllProducts() {
    return this.productRepository.find({ where: { isActive: true } });
  }

  async findAllRawMaterials() {
    return this.rawMaterialRepository.find({ where: { isActive: true } });
  }

  // --- Customer Groups ---
  async findAllCustomerGroups() {
    return this.customerGroupRepository.find({ where: { isActive: true } });
  }

  async addCustomerGroup(groupDto: any) {
    const newGroup = this.customerGroupRepository.create({
      id: `CG-${Date.now()}`,
      ...groupDto
    });
    return this.customerGroupRepository.save(newGroup);
  }

  async updateCustomerGroup(id: string, groupDto: any) {
    const group = await this.customerGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Customer group with ID ${id} not found`);
    }

    Object.assign(group, groupDto);
    return this.customerGroupRepository.save(group);
  }

  async deleteCustomerGroup(id: string) {
    const result = await this.customerGroupRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Customer group with ID ${id} not found`);
    }
    return { message: `Deleted group with ID ${id}` };
  }

  // --- BOM (Bill of Materials) ---
  async findBOMByProductId(productId: string) {
    return this.bomRepository.find({
      where: { productId, isActive: true },
      relations: ['rawMaterial'],
      order: { createdAt: 'ASC' }
    });
  }

  async addBOM(bomDto: any) {
    const newBOM = this.bomRepository.create({
      productId: bomDto.productId,
      rawMaterialId: bomDto.rawMaterialId,
      quantity: bomDto.quantity,
      notes: bomDto.notes || '',
      isActive: true
    });
    return this.bomRepository.save(newBOM);
  }

  async updateBOM(id: string, bomDto: any) {
    const bom = await this.bomRepository.findOne({ where: { id } });
    if (!bom) {
      throw new NotFoundException(`BOM with ID ${id} not found`);
    }

    Object.assign(bom, bomDto);
    return this.bomRepository.save(bom);
  }

  async deleteBOM(id: string) {
    const result = await this.bomRepository.update(id, { isActive: false });
    if (result.affected === 0) {
      throw new NotFoundException(`BOM with ID ${id} not found`);
    }
    return { message: `Deleted BOM with ID ${id}` };
  }

  // Note: Other methods (customer mappings, fab costs, etc.) should also be implemented
  // using database repositories instead of in-memory arrays

  // Placeholder methods for compatibility
  async findAllCustomerMappings() { return []; }
  async addCustomerMapping(mapping: any) { return mapping; }
  async updateCustomerMapping(id: string, mappingDto: any) { return mappingDto; }
  async deleteCustomerMapping(id: string) { return { message: `Deleted mapping with ID ${id}` }; }

  async findAllFabCosts() { return []; }
  async addFabCost(cost: any) { return cost; }
  async updateFabCost(id: string, costDto: any) { return costDto; }
  async deleteFabCost(id: string) { return { message: `Deleted fab cost with ID ${id}` }; }

  async findAllStandardPrices() { return []; }
  async findAllSellingFactors() { return [{ id: 'SF-001', pattern: 'Default', factor: 1.25 }]; }
  async findAllLmePrices() { return []; }
  async findAllExchangeRates() { return []; }
  async addExchangeRate(rate: any) { return rate; }
  async updateExchangeRate(id: string, rateDto: any) { return rateDto; }
  async deleteExchangeRate(id: string) { return { message: `Deleted exchange rate with ID ${id}` }; }
}