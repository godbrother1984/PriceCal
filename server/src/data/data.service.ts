// path: server/src/data/data.service.ts
// version: 2.6 (Add Default Customer Group Logic)
// last-modified: 1 ตุลาคม 2568 18:35

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
import { FabCost } from '../entities/fab-cost.entity';
import { FabCostHistory } from '../entities/fab-cost-history.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { StandardPriceHistory } from '../entities/standard-price-history.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { SellingFactorHistory } from '../entities/selling-factor-history.entity';
import { LmePrice } from '../entities/lme-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { Currency } from '../entities/currency.entity';
import { CustomerMapping } from '../entities/customer-mapping.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

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
    @InjectRepository(FabCost)
    private fabCostRepository: Repository<FabCost>,
    @InjectRepository(FabCostHistory)
    private fabCostHistoryRepository: Repository<FabCostHistory>,
    @InjectRepository(StandardPrice)
    private standardPriceRepository: Repository<StandardPrice>,
    @InjectRepository(StandardPriceHistory)
    private standardPriceHistoryRepository: Repository<StandardPriceHistory>,
    @InjectRepository(SellingFactor)
    private sellingFactorRepository: Repository<SellingFactor>,
    @InjectRepository(SellingFactorHistory)
    private sellingFactorHistoryRepository: Repository<SellingFactorHistory>,
    @InjectRepository(LmePrice)
    private lmePriceRepository: Repository<LmePrice>,
    @InjectRepository(LmeMasterData)
    private lmeMasterDataRepository: Repository<LmeMasterData>,
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
    @InjectRepository(ExchangeRateMasterData)
    private exchangeRateMasterDataRepository: Repository<ExchangeRateMasterData>,
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    @InjectRepository(CustomerMapping)
    private customerMappingRepository: Repository<CustomerMapping>,
    private activityLogService: ActivityLogService,
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
      specialRequests: request.specialRequests ? JSON.parse(request.specialRequests) : [],
      revisionReason: request.revisionReason,
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
      status: requestDto.status || 'Pending',
      createdBy: createdBy,
      formData: JSON.stringify(requestDto.formData || {}),
      customerType: requestDto.customerType || '',
      productType: requestDto.productType || '',
      boqItems: JSON.stringify(requestDto.boqItems || []),
      calculationResult: requestDto.calculationResult ? JSON.stringify(requestDto.calculationResult) : null,
      specialRequests: JSON.stringify(requestDto.specialRequests || []),
      revisionReason: requestDto.revisionReason || null,
    });

    const savedRequest = await this.priceRequestRepository.save(request);

    // บันทึก Activity Log
    await this.activityLogService.logRequestCreated(
      savedRequest.id,
      createdBy || 'system',
      'admin',
      {
        customerName: savedRequest.customerName,
        productName: savedRequest.productName,
        customerType: savedRequest.customerType,
        productType: savedRequest.productType,
        status: savedRequest.status
      }
    );

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

    if (requestDto.specialRequests) {
      request.specialRequests = JSON.stringify(requestDto.specialRequests);
    }

    // Update revision reason if provided
    if (requestDto.revisionReason !== undefined) {
      request.revisionReason = requestDto.revisionReason;
    }

    // Track status change for activity log
    const oldStatus = request.status;
    const newStatus = requestDto.status;

    // Update status if provided
    if (requestDto.status) {
      request.status = requestDto.status;
    }

    if (requestDto.calculationResult) {
      request.calculationResult = JSON.stringify(requestDto.calculationResult);
    }

    const updatedRequest = await this.priceRequestRepository.save(request);
    console.log('Updated Request:', updatedRequest);

    // บันทึก Activity Log สำหรับการเปลี่ยนสถานะ
    if (newStatus && oldStatus !== newStatus) {
      const adminUser = await this.userRepository.findOne({ where: { username: 'admin' } });
      const userId = adminUser?.id || 'system';
      const userName = adminUser?.name || 'admin';

      if (newStatus === 'Revision Required' && requestDto.revisionReason) {
        await this.activityLogService.logRevisionRequested(
          request.id,
          userId,
          userName,
          requestDto.revisionReason
        );
      } else {
        await this.activityLogService.logStatusChanged(
          request.id,
          userId,
          userName,
          oldStatus,
          newStatus,
          requestDto.revisionReason
        );
      }
    }

    // บันทึก Activity Log สำหรับการคำนวณราคา
    if (requestDto.calculationResult) {
      const adminUser = await this.userRepository.findOne({ where: { username: 'admin' } });
      const userId = adminUser?.id || 'system';
      const userName = adminUser?.name || 'admin';

      // ตรวจสอบว่า calculationResult เป็น string หรือ object แล้ว
      const calculationData = typeof requestDto.calculationResult === 'string'
        ? JSON.parse(requestDto.calculationResult)
        : requestDto.calculationResult;

      await this.activityLogService.logCalculationCompleted(
        request.id,
        userId,
        userName,
        calculationData
      );
    }

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

  async getDefaultCustomerGroup() {
    return this.customerGroupRepository.findOne({
      where: { isDefault: true, isActive: true }
    });
  }

  async addCustomerGroup(groupDto: any) {
    // ถ้าตั้งเป็น default group ต้อง unset default ของกลุ่มอื่นก่อน
    if (groupDto.isDefault === true || groupDto.isDefault === 'true') {
      await this.customerGroupRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }

    const newGroup = this.customerGroupRepository.create({
      id: `CG-${Date.now()}`,
      ...groupDto,
      isDefault: groupDto.isDefault === true || groupDto.isDefault === 'true'
    });
    return this.customerGroupRepository.save(newGroup);
  }

  async updateCustomerGroup(id: string, groupDto: any) {
    const group = await this.customerGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Customer group with ID ${id} not found`);
    }

    // ถ้าตั้งเป็น default group ต้อง unset default ของกลุ่มอื่นก่อน
    if (groupDto.isDefault === true || groupDto.isDefault === 'true') {
      await this.customerGroupRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(group, {
      ...groupDto,
      isDefault: groupDto.isDefault === true || groupDto.isDefault === 'true'
    });
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

  // --- Customer Mappings ---
  async findAllCustomerMappings() {
    return this.customerMappingRepository.find({
      where: { isActive: true },
      relations: ['customer', 'customerGroup'],
      order: { createdAt: 'DESC' }
    });
  }

  async addCustomerMapping(mappingDto: any) {
    const newMapping = this.customerMappingRepository.create({
      id: `CM-${Date.now()}`,
      customerId: mappingDto.customerId,
      customerGroupId: mappingDto.customerGroupId,
      isActive: true
    });
    return this.customerMappingRepository.save(newMapping);
  }

  async updateCustomerMapping(id: string, mappingDto: any) {
    const mapping = await this.customerMappingRepository.findOne({ where: { id } });
    if (!mapping) {
      throw new NotFoundException(`Customer mapping with ID ${id} not found`);
    }

    Object.assign(mapping, mappingDto);
    return this.customerMappingRepository.save(mapping);
  }

  async deleteCustomerMapping(id: string) {
    const mapping = await this.customerMappingRepository.findOne({ where: { id } });
    if (!mapping) {
      throw new NotFoundException(`Customer mapping with ID ${id} not found`);
    }

    mapping.isActive = false;
    await this.customerMappingRepository.save(mapping);
    return { message: `Deleted mapping with ID ${id}` };
  }

  // --- Fab Costs ---
  async findAllFabCosts() {
    return this.fabCostRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
  }

  async addFabCost(costDto: any) {
    const newCost = this.fabCostRepository.create({
      id: `FC-${Date.now()}`,
      name: costDto.name,
      costPerHour: costDto.costPerHour,
      currency: costDto.currency,
      description: costDto.description || null,
      status: costDto.status || 'Draft',
      isActive: true,
      version: 1
    });
    const savedCost = await this.fabCostRepository.save(newCost);

    // บันทึก history
    await this.createFabCostHistory(savedCost, 'CREATE', 'admin');

    // บันทึก activity log
    await this.activityLogService.logMasterDataChanged(
      'fab_costs',
      savedCost.id,
      'admin',
      'Admin',
      'CREATE',
      null,
      savedCost,
      costDto.changeReason
    );

    return savedCost;
  }

  async updateFabCost(id: string, costDto: any) {
    const cost = await this.fabCostRepository.findOne({ where: { id } });
    if (!cost) {
      throw new NotFoundException(`Fab cost with ID ${id} not found`);
    }

    const oldData = { ...cost };

    // อัพเดท version ถ้ามีการเปลี่ยนแปลงราคา
    if (cost.costPerHour !== costDto.costPerHour) {
      cost.version = (cost.version || 1) + 1;
    }

    Object.assign(cost, costDto);
    const savedCost = await this.fabCostRepository.save(cost);

    // บันทึก history
    await this.createFabCostHistory(savedCost, 'UPDATE', 'admin');

    // บันทึก activity log
    await this.activityLogService.logMasterDataChanged(
      'fab_costs',
      savedCost.id,
      'admin',
      'Admin',
      'UPDATE',
      oldData,
      savedCost,
      costDto.changeReason
    );

    return savedCost;
  }

  // Helper method สำหรับสร้าง FabCost history record
  private async createFabCostHistory(cost: FabCost, action: string, userId: string) {
    const history = this.fabCostHistoryRepository.create({
      fabCostId: cost.id,
      version: cost.version || 1,
      name: cost.name,
      costPerHour: cost.costPerHour,
      currency: cost.currency,
      description: cost.description,
      status: cost.status,
      approvedBy: cost.approvedBy,
      approvedAt: cost.approvedAt,
      effectiveFrom: cost.effectiveFrom,
      effectiveTo: cost.effectiveTo,
      changedBy: userId,
      changeReason: cost.changeReason,
      action: action
    });
    await this.fabCostHistoryRepository.save(history);
  }

  async deleteFabCost(id: string) {
    const cost = await this.fabCostRepository.findOne({ where: { id } });
    if (!cost) {
      throw new NotFoundException(`Fab cost with ID ${id} not found`);
    }

    cost.isActive = false;
    await this.fabCostRepository.save(cost);
    return { message: `Deleted fab cost with ID ${id}` };
  }

  // --- Standard Prices ---
  async findAllStandardPrices() {
    return this.standardPriceRepository.find({
      where: { isActive: true },
      relations: ['rawMaterial'],
      order: { effectiveFrom: 'DESC' }
    });
  }

  async addStandardPrice(priceDto: any) {
    const newPrice = this.standardPriceRepository.create({
      rawMaterialId: priceDto.rawMaterialId,
      price: priceDto.price,
      currency: priceDto.currency,
      status: priceDto.status || 'Draft',
      effectiveFrom: priceDto.effectiveFrom,
      effectiveTo: priceDto.effectiveTo || null,
      changeReason: priceDto.changeReason || null,
      isActive: true,
      version: 1
    });
    const savedPrice = await this.standardPriceRepository.save(newPrice);

    // บันทึก history
    await this.createStandardPriceHistory(savedPrice, 'CREATE', 'admin');

    // บันทึก activity log
    await this.activityLogService.logMasterDataChanged(
      'standard_prices',
      savedPrice.id,
      'admin',
      'Admin',
      'CREATE',
      null,
      savedPrice,
      priceDto.changeReason
    );

    return savedPrice;
  }

  async updateStandardPrice(id: string, priceDto: any) {
    const price = await this.standardPriceRepository.findOne({ where: { id } });
    if (!price) {
      throw new NotFoundException(`Standard price with ID ${id} not found`);
    }

    const oldData = { ...price };

    try {
      // ปิด FK check ชั่วคราว
      await this.standardPriceRepository.query('PRAGMA foreign_keys = OFF');

      // อัพเดท version ถ้ามีการเปลี่ยนแปลงราคา
      if (price.price !== priceDto.price) {
        price.version = (price.version || 1) + 1;
      }

      Object.assign(price, priceDto);
      const savedPrice = await this.standardPriceRepository.save(price);

      // บันทึก history
      await this.createStandardPriceHistory(savedPrice, 'UPDATE', 'admin');

      // บันทึก activity log
      await this.activityLogService.logMasterDataChanged(
        'standard_prices',
        savedPrice.id,
        'admin',
        'Admin',
        'UPDATE',
        oldData,
        savedPrice,
        priceDto.changeReason
      );

      return savedPrice;
    } finally {
      // เปิด FK check กลับ
      await this.standardPriceRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // Helper method สำหรับสร้าง history record
  private async createStandardPriceHistory(price: StandardPrice, action: string, userId: string) {
    const history = this.standardPriceHistoryRepository.create({
      standardPriceId: price.id,
      version: price.version || 1,
      rawMaterialId: price.rawMaterialId,
      price: price.price,
      currency: price.currency,
      status: price.status,
      approvedBy: price.approvedBy,
      approvedAt: price.approvedAt,
      effectiveFrom: price.effectiveFrom,
      effectiveTo: price.effectiveTo,
      changedBy: userId,
      changeReason: price.changeReason,
      action: action
    });
    await this.standardPriceHistoryRepository.save(history);
  }

  async deleteStandardPrice(id: string) {
    const price = await this.standardPriceRepository.findOne({ where: { id } });
    if (!price) {
      throw new NotFoundException(`Standard price with ID ${id} not found`);
    }

    price.isActive = false;
    await this.standardPriceRepository.save(price);
    return { message: `Deleted standard price with ID ${id}` };
  }

  // ดึง version history ของ Standard Price ตาม rawMaterialId
  async getStandardPriceHistory(rawMaterialId: string) {
    return this.standardPriceHistoryRepository.find({
      where: { rawMaterialId },
      order: { version: 'DESC', changedAt: 'DESC' }
    });
  }

  // ดึง version history ของ Standard Price ตาม standardPriceId
  async getStandardPriceHistoryById(standardPriceId: string) {
    return this.standardPriceHistoryRepository.find({
      where: { standardPriceId },
      order: { version: 'DESC', changedAt: 'DESC' }
    });
  }

  // Approve Standard Price
  async approveStandardPrice(id: string, username: string = 'admin') {
    const price = await this.standardPriceRepository.findOne({ where: { id } });
    if (!price) {
      throw new NotFoundException(`Standard price with ID ${id} not found`);
    }

    // ดึง user ID จาก username
    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    const oldData = { ...price };

    try {
      // ปิด FK check ชั่วคราว
      await this.standardPriceRepository.query('PRAGMA foreign_keys = OFF');

      // ใช้ update แทน save เพื่อหลีกเลี่ยง FK constraint error
      await this.standardPriceRepository.update(id, {
        status: 'Active', // ✅ เปลี่ยนจาก 'Approved' เป็น 'Active' เพื่อให้ query เจอ
        approvedBy: userId,
        approvedAt: new Date()
      });

      // ดึงข้อมูลใหม่หลัง update
      const savedPrice = await this.standardPriceRepository.findOne({ where: { id } });

      // บันทึก history
      await this.createStandardPriceHistory(savedPrice, 'APPROVE', userId || username);

      // บันทึก activity log
      await this.activityLogService.logMasterDataChanged(
        'standard_prices',
        savedPrice.id,
        userId || username,
        userName,
        'UPDATE',
        oldData,
        savedPrice,
        'Approved by ' + userName
      );

      return savedPrice;
    } finally {
      // เปิด FK check กลับ
      await this.standardPriceRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // ดึง version history ของ FabCost
  async getFabCostHistory(fabCostId: string) {
    return this.fabCostHistoryRepository.find({
      where: { fabCostId },
      order: { version: 'DESC', changedAt: 'DESC' }
    });
  }

  // Approve Fab Cost
  async approveFabCost(id: string, username: string = 'admin') {
    const cost = await this.fabCostRepository.findOne({ where: { id } });
    if (!cost) {
      throw new NotFoundException(`Fab cost with ID ${id} not found`);
    }

    // ดึง user ID จาก username
    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    const oldData = { ...cost };

    try {
      // ปิด FK check ชั่วคราว
      await this.fabCostRepository.query('PRAGMA foreign_keys = OFF');

      // ใช้ update แทน save เพื่อหลีกเลี่ยง FK constraint error
      await this.fabCostRepository.update(id, {
        status: 'Approved',
        approvedBy: userId,
        approvedAt: new Date()
      });

      // ดึงข้อมูลใหม่หลัง update
      const savedCost = await this.fabCostRepository.findOne({ where: { id } });

      // บันทึก history
      await this.createFabCostHistory(savedCost, 'APPROVE', userId || username);

      // บันทึก activity log
      await this.activityLogService.logMasterDataChanged(
        'fab_costs',
        savedCost.id,
        userId || username,
        userName,
        'UPDATE',
        oldData,
        savedCost,
        'Approved by ' + userName
      );

      return savedCost;
    } finally {
      // เปิด FK check กลับ
      await this.fabCostRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // ดึง version history ของ SellingFactor
  async getSellingFactorHistory(sellingFactorId: string) {
    return this.sellingFactorHistoryRepository.find({
      where: { sellingFactorId },
      order: { version: 'DESC', changedAt: 'DESC' }
    });
  }

  // Approve Selling Factor
  async approveSellingFactor(id: string, username: string = 'admin') {
    const factor = await this.sellingFactorRepository.findOne({ where: { id } });
    if (!factor) {
      throw new NotFoundException(`Selling factor with ID ${id} not found`);
    }

    // ดึง user ID จาก username
    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    const oldData = { ...factor };

    try {
      // ปิด FK check ชั่วคราว
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = OFF');

      // ใช้ update แทน save เพื่อหลีกเลี่ยง FK constraint error
      await this.sellingFactorRepository.update(id, {
        status: 'Approved',
        approvedBy: userId,
        approvedAt: new Date()
      });

      // ดึงข้อมูลใหม่หลัง update
      const savedFactor = await this.sellingFactorRepository.findOne({ where: { id } });

      // บันทึก history
      await this.createSellingFactorHistory(savedFactor, 'APPROVE', userId || username);

      // บันทึก activity log
      await this.activityLogService.logMasterDataChanged(
        'selling_factors',
        savedFactor.id,
        userId || username,
        userName,
        'UPDATE',
        oldData,
        savedFactor,
        'Approved by ' + userName
      );

      return savedFactor;
    } finally {
      // เปิด FK check กลับ
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // --- Selling Factors ---
  async findAllSellingFactors() {
    return this.sellingFactorRepository.find({
      where: { isActive: true },
      relations: ['customerGroup'],
      order: { createdAt: 'DESC' }
    });
  }

  async addSellingFactor(factorDto: any) {
    const newFactor = this.sellingFactorRepository.create({
      patternName: factorDto.patternName,
      patternCode: factorDto.patternCode,
      factor: factorDto.factor,
      description: factorDto.description || null,
      status: factorDto.status || 'Draft',
      effectiveFrom: factorDto.effectiveFrom,
      effectiveTo: factorDto.effectiveTo || null,
      changeReason: factorDto.changeReason || null,
      isActive: true,
      version: 1
    });
    const savedFactor = await this.sellingFactorRepository.save(newFactor);

    // บันทึก history
    await this.createSellingFactorHistory(savedFactor, 'CREATE', 'admin');

    // บันทึก activity log
    await this.activityLogService.logMasterDataChanged(
      'selling_factors',
      savedFactor.id,
      'admin',
      'Admin',
      'CREATE',
      null,
      savedFactor,
      factorDto.changeReason
    );

    return savedFactor;
  }

  async updateSellingFactor(id: string, factorDto: any) {
    const factor = await this.sellingFactorRepository.findOne({ where: { id } });
    if (!factor) {
      throw new NotFoundException(`Selling factor with ID ${id} not found`);
    }

    const oldData = { ...factor };

    // อัพเดท version ถ้ามีการเปลี่ยนแปลง factor
    if (factor.factor !== factorDto.factor) {
      factor.version = (factor.version || 1) + 1;
    }

    Object.assign(factor, factorDto);
    const savedFactor = await this.sellingFactorRepository.save(factor);

    // บันทึก history
    await this.createSellingFactorHistory(savedFactor, 'UPDATE', 'admin');

    // บันทึก activity log
    await this.activityLogService.logMasterDataChanged(
      'selling_factors',
      savedFactor.id,
      'admin',
      'Admin',
      'UPDATE',
      oldData,
      savedFactor,
      factorDto.changeReason
    );

    return savedFactor;
  }

  // Helper method สำหรับสร้าง SellingFactor history record
  private async createSellingFactorHistory(factor: SellingFactor, action: string, userId: string) {
    const history = this.sellingFactorHistoryRepository.create({
      sellingFactorId: factor.id,
      version: factor.version || 1,
      patternName: factor.patternName,
      patternCode: factor.patternCode,
      factor: factor.factor,
      description: factor.description,
      status: factor.status,
      approvedBy: factor.approvedBy,
      approvedAt: factor.approvedAt,
      effectiveFrom: factor.effectiveFrom,
      effectiveTo: factor.effectiveTo,
      changedBy: userId,
      changeReason: factor.changeReason,
      action: action
    });
    await this.sellingFactorHistoryRepository.save(history);
  }

  async deleteSellingFactor(id: string) {
    const factor = await this.sellingFactorRepository.findOne({ where: { id } });
    if (!factor) {
      throw new NotFoundException(`Selling factor with ID ${id} not found`);
    }

    factor.isActive = false;
    await this.sellingFactorRepository.save(factor);
    return { message: `Deleted selling factor with ID ${id}` };
  }

  // --- LME Prices ---
  async findAllLmePrices() {
    return this.lmePriceRepository.find({
      where: { isActive: true },
      order: { priceDate: 'DESC' }
    });
  }

  async addLmePrice(priceDto: any) {
    const newPrice = this.lmePriceRepository.create({
      itemGroupName: priceDto.itemGroupName,
      itemGroupCode: priceDto.itemGroupCode,
      price: priceDto.price,
      currency: priceDto.currency,
      priceDate: priceDto.priceDate,
      source: priceDto.source || 'LME_API',
      dataSource: 'REST_API',
      isActive: true
    });
    return this.lmePriceRepository.save(newPrice);
  }

  async updateLmePrice(id: string, priceDto: any) {
    const price = await this.lmePriceRepository.findOne({ where: { id } });
    if (!price) {
      throw new NotFoundException(`LME price with ID ${id} not found`);
    }

    Object.assign(price, priceDto);
    return this.lmePriceRepository.save(price);
  }

  async deleteLmePrice(id: string) {
    const price = await this.lmePriceRepository.findOne({ where: { id } });
    if (!price) {
      throw new NotFoundException(`LME price with ID ${id} not found`);
    }

    price.isActive = false;
    await this.lmePriceRepository.save(price);
    return { message: `Deleted LME price with ID ${id}` };
  }

  // --- Exchange Rates ---
  async findAllExchangeRates() {
    return this.exchangeRateRepository.find({
      where: { isActive: true },
      order: { rateDate: 'DESC' }
    });
  }

  async addExchangeRate(rateDto: any) {
    const newRate = this.exchangeRateRepository.create({
      sourceCurrencyCode: rateDto.sourceCurrencyCode,
      sourceCurrencyName: rateDto.sourceCurrencyName,
      destinationCurrencyCode: rateDto.destinationCurrencyCode,
      destinationCurrencyName: rateDto.destinationCurrencyName,
      rate: rateDto.rate,
      rateDate: rateDto.rateDate || new Date(),
      source: rateDto.source || 'BOT',
      dataSource: 'REST_API',
      isActive: true
    });
    return this.exchangeRateRepository.save(newRate);
  }

  async updateExchangeRate(id: string, rateDto: any) {
    const rate = await this.exchangeRateRepository.findOne({ where: { id } });
    if (!rate) {
      throw new NotFoundException(`Exchange rate with ID ${id} not found`);
    }

    Object.assign(rate, rateDto);
    return this.exchangeRateRepository.save(rate);
  }

  async deleteExchangeRate(id: string) {
    const rate = await this.exchangeRateRepository.findOne({ where: { id } });
    if (!rate) {
      throw new NotFoundException(`Exchange rate with ID ${id} not found`);
    }

    rate.isActive = false;
    await this.exchangeRateRepository.save(rate);
    return { message: `Deleted exchange rate with ID ${id}` };
  }

  // --- Currencies ---
  async findAllCurrencies() {
    return this.currencyRepository.find({
      where: { isActive: true },
      order: { code: 'ASC' }
    });
  }

  async addCurrency(currencyDto: any) {
    const newCurrency = this.currencyRepository.create({
      id: `CUR-${Date.now()}`,
      code: currencyDto.code,
      name: currencyDto.name,
      symbol: currencyDto.symbol,
      isActive: true
    });
    return this.currencyRepository.save(newCurrency);
  }

  async updateCurrency(id: string, currencyDto: any) {
    const currency = await this.currencyRepository.findOne({ where: { id } });
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    Object.assign(currency, currencyDto);
    return this.currencyRepository.save(currency);
  }

  async deleteCurrency(id: string) {
    const currency = await this.currencyRepository.findOne({ where: { id } });
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    currency.isActive = false;
    await this.currencyRepository.save(currency);
    return { message: `Deleted currency with ID ${id}` };
  }

  // --- System Configuration ---
  async findAllSystemConfigs() {
    return this.systemConfigRepository.find({
      order: { key: 'ASC' }
    });
  }

  async findOneSystemConfig(key: string) {
    const config = await this.systemConfigRepository.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`System config with key '${key}' not found`);
    }
    return config;
  }

  async updateSystemConfig(key: string, configDto: any) {
    console.log(`[DataService] Updating system config ${key} with:`, configDto);

    // ตรวจสอบว่า config นี้มีอยู่แล้วหรือไม่
    let config = await this.systemConfigRepository.findOne({ where: { key } });

    if (config) {
      // อัปเดต
      config.value = configDto.value;
      config.description = configDto.description || config.description;
    } else {
      // สร้างใหม่
      config = this.systemConfigRepository.create({
        key,
        value: configDto.value,
        description: configDto.description
      });
    }

    const savedConfig = await this.systemConfigRepository.save(config);
    console.log(`[DataService] System config updated:`, savedConfig);

    return { success: true, message: 'System configuration updated successfully', data: savedConfig };
  }

  // --- LME Master Data (for calculation) ---
  async findAllLmeMasterData() {
    return this.lmeMasterDataRepository.find({
      where: { isActive: true },
      relations: ['customerGroup'],
      order: { createdAt: 'DESC' }
    });
  }

  async addLmeMasterData(lmeDto: any) {
    const newLme = this.lmeMasterDataRepository.create({
      itemGroupName: lmeDto.itemGroupName,
      itemGroupCode: lmeDto.itemGroupCode,
      price: lmeDto.price,
      currency: lmeDto.currency,
      customerGroupId: lmeDto.customerGroupId || null,
      description: lmeDto.description,
      status: lmeDto.status || 'Draft',
      effectiveFrom: lmeDto.effectiveFrom,
      effectiveTo: lmeDto.effectiveTo || null,
      changeReason: lmeDto.changeReason || null,
      isActive: true,
      version: 1
    });
    return this.lmeMasterDataRepository.save(newLme);
  }

  async updateLmeMasterData(id: string, lmeDto: any) {
    const lme = await this.lmeMasterDataRepository.findOne({ where: { id } });
    if (!lme) {
      throw new NotFoundException(`LME master data with ID ${id} not found`);
    }

    // อัพเดท version ถ้ามีการเปลี่ยนแปลงราคา
    if (lme.price !== lmeDto.price) {
      lme.version = (lme.version || 1) + 1;
    }

    Object.assign(lme, lmeDto);
    return this.lmeMasterDataRepository.save(lme);
  }

  async deleteLmeMasterData(id: string) {
    const lme = await this.lmeMasterDataRepository.findOne({ where: { id } });
    if (!lme) {
      throw new NotFoundException(`LME master data with ID ${id} not found`);
    }

    lme.isActive = false;
    await this.lmeMasterDataRepository.save(lme);
    return { message: `Deleted LME master data with ID ${id}` };
  }

  // --- Exchange Rate Master Data (for calculation) ---
  async findAllExchangeRateMasterData() {
    return this.exchangeRateMasterDataRepository.find({
      where: { isActive: true },
      relations: ['customerGroup'],
      order: { createdAt: 'DESC' }
    });
  }

  async addExchangeRateMasterData(rateDto: any) {
    const newRate = this.exchangeRateMasterDataRepository.create({
      sourceCurrencyCode: rateDto.sourceCurrencyCode,
      sourceCurrencyName: rateDto.sourceCurrencyName,
      destinationCurrencyCode: rateDto.destinationCurrencyCode,
      destinationCurrencyName: rateDto.destinationCurrencyName,
      rate: rateDto.rate,
      customerGroupId: rateDto.customerGroupId || null,
      description: rateDto.description,
      status: rateDto.status || 'Draft',
      effectiveFrom: rateDto.effectiveFrom,
      effectiveTo: rateDto.effectiveTo || null,
      changeReason: rateDto.changeReason || null,
      isActive: true,
      version: 1
    });
    return this.exchangeRateMasterDataRepository.save(newRate);
  }

  async updateExchangeRateMasterData(id: string, rateDto: any) {
    const rate = await this.exchangeRateMasterDataRepository.findOne({ where: { id } });
    if (!rate) {
      throw new NotFoundException(`Exchange rate master data with ID ${id} not found`);
    }

    // อัพเดท version ถ้ามีการเปลี่ยนแปลงอัตรา
    if (rate.rate !== rateDto.rate) {
      rate.version = (rate.version || 1) + 1;
    }

    Object.assign(rate, rateDto);
    return this.exchangeRateMasterDataRepository.save(rate);
  }

  async deleteExchangeRateMasterData(id: string) {
    const rate = await this.exchangeRateMasterDataRepository.findOne({ where: { id } });
    if (!rate) {
      throw new NotFoundException(`Exchange rate master data with ID ${id} not found`);
    }

    rate.isActive = false;
    await this.exchangeRateMasterDataRepository.save(rate);
    return { message: `Deleted exchange rate master data with ID ${id}` };
  }

  // ✅ ONE-TIME FIX: แก้ไข status ของ Standard Prices ที่มีอยู่จาก 'Approved' → 'Active'
  async fixStandardPricesStatus() {
    try {
      console.log('[fixStandardPricesStatus] Starting to fix Standard Prices status...');

      // ปิด FK check ชั่วคราว
      await this.standardPriceRepository.query('PRAGMA foreign_keys = OFF');

      // ค้นหาทั้งหมดที่มี status = 'Approved'
      const approvedPrices = await this.standardPriceRepository.find({
        where: { status: 'Approved' as any }
      });

      console.log(`[fixStandardPricesStatus] Found ${approvedPrices.length} Standard Prices with status='Approved'`);

      // อัปเดตทีละตัว
      for (const price of approvedPrices) {
        await this.standardPriceRepository.update(price.id, {
          status: 'Active'
        });
        console.log(`[fixStandardPricesStatus] Updated ${price.id} to status='Active'`);
      }

      // เปิด FK check กลับ
      await this.standardPriceRepository.query('PRAGMA foreign_keys = ON');

      console.log('[fixStandardPricesStatus] Successfully fixed all Standard Prices status');

      return {
        success: true,
        message: `Fixed ${approvedPrices.length} Standard Prices from 'Approved' to 'Active'`,
        count: approvedPrices.length
      };
    } catch (error) {
      console.error('[fixStandardPricesStatus] Error:', error);
      throw error;
    }
  }
}
