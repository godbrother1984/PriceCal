// path: server/src/data/data.service.ts
// version: 3.15 (Remove Standard Price version control - Read-only from MongoDB)
// last-modified: 29 ตุลาคม 2568 02:45

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Employee } from '../entities/employee.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { PriceRequest } from '../entities/price-request.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { User } from '../entities/user.entity';
import { BOM } from '../entities/bom.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { FabCostHistory } from '../entities/fab-cost-history.entity';
import { StandardPrice } from '../entities/standard-price.entity';
// REMOVED: StandardPriceHistory - Standard Price is read-only from MongoDB (no version control)
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
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
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
    // REMOVED: standardPriceHistoryRepository - no version control for Standard Price
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

  private normalizeCurrencyCode(code?: string | null): string {
    return (code || '').trim().toUpperCase();
  }

  private async ensureCurrencyCodeExists(
    code: string | undefined,
    context: string,
  ): Promise<string> {
    const normalized = this.normalizeCurrencyCode(code);

    if (!normalized) {
      throw new NotFoundException(
        `Currency code is required for ${context}`,
      );
    }

    let currency = await this.currencyRepository.findOne({
      where: { code: normalized, isActive: true },
    });

    if (!currency && normalized.startsWith('CUR-') && normalized.length > 4) {
      const fallbackCode = normalized.substring(4);
      currency = await this.currencyRepository.findOne({
        where: { code: fallbackCode, isActive: true },
      });
      if (currency) {
        return fallbackCode;
      }
    }

    if (!currency) {
      throw new NotFoundException(
        `Currency '${normalized}' not found in master data`,
      );
    }

    return normalized;
  }

  private async ensureCurrencyCodesExist(
    codes: Array<{ code: string | undefined; context: string }>,
  ): Promise<string[]> {
    return Promise.all(
      codes.map((item) =>
        this.ensureCurrencyCodeExists(item.code, item.context),
      ),
    );
  }

  private async buildCurrencyMap(): Promise<Map<string, Currency>> {
    const currencies = await this.currencyRepository.find({
      where: { isActive: true },
    });
    return new Map(
      currencies.map((currency) => [
        this.normalizeCurrencyCode(currency.code),
        currency,
      ]),
    );
  }

  private async findCurrencyEntity(code: string): Promise<Currency | null> {
    const normalized = this.normalizeCurrencyCode(code);
    if (!normalized) {
      return null;
    }

    return this.currencyRepository.findOne({
      where: { code: normalized, isActive: true },
    });
  }

  private async attachCurrencyMetadata<T extends { currency?: string }>(
    records: T[],
  ): Promise<
    Array<
      T & {
        currencyCode: string | null;
        currencyName: string | null;
        currencySymbol: string | null;
      }
    >
  > {
    if (records.length === 0) {
      return [];
    }

    const currencyMap = await this.buildCurrencyMap();

    return records.map((record) => {
      const code = this.normalizeCurrencyCode(record.currency ?? null);
      const currency = code ? currencyMap.get(code) : undefined;

      return {
        ...record,
        currency: code || null,
        currencyCode: code || null,
        currencyName: currency?.name ?? null,
        currencySymbol: currency?.symbol ?? null,
      };
    });
  }

  private async attachExchangeRateCurrencyMetadata<
    T extends {
      sourceCurrencyCode: string;
      destinationCurrencyCode: string;
      sourceCurrencyName?: string | null;
      destinationCurrencyName?: string | null;
    },
  >(records: T[]) {
    if (records.length === 0) {
      return [];
    }

    const currencyMap = await this.buildCurrencyMap();

    return records.map((record) => {
      const sourceCode = this.normalizeCurrencyCode(
        record.sourceCurrencyCode,
      );
      const destinationCode = this.normalizeCurrencyCode(
        record.destinationCurrencyCode,
      );

      const sourceCurrency = currencyMap.get(sourceCode);
      const destinationCurrency = currencyMap.get(destinationCode);

      return {
        ...record,
        sourceCurrencyCode: sourceCode,
        destinationCurrencyCode: destinationCode,
        sourceCurrencyName: sourceCurrency?.name ?? record.sourceCurrencyName ?? null,
        destinationCurrencyName:
          destinationCurrency?.name ?? record.destinationCurrencyName ?? null,
        sourceCurrencySymbol: sourceCurrency?.symbol ?? null,
        destinationCurrencySymbol: destinationCurrency?.symbol ?? null,
      };
    });
  }

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

  async findAllEmployees() {
    return this.employeeRepository.find({ order: { empId: 'ASC' } });
  }

  async findAllProducts() {
    return this.productRepository.find({ where: { isActive: true } });
  }

  async findAllRawMaterials() {
    return this.rawMaterialRepository.find({ where: { isActive: true } });
  }

  // --- Item Groups (derived from Raw Materials) ---
  async findAllItemGroups() {
    // ดึง Item Groups ที่ unique จาก Raw Materials
    const rawMaterials = await this.rawMaterialRepository.find({
      where: { isActive: true },
      select: ['itemGroupCode', 'category'],
    });

    // Extract unique item group codes และกรองที่เป็น null/undefined
    const uniqueGroups = new Map<string, { code: string; name: string }>();

    rawMaterials.forEach(rm => {
      if (rm.itemGroupCode && !uniqueGroups.has(rm.itemGroupCode)) {
        uniqueGroups.set(rm.itemGroupCode, {
          code: rm.itemGroupCode,
          name: rm.category || `${rm.itemGroupCode} Group`, // ใช้ category เป็น name, ถ้าไม่มีก็ใช้ code + "Group"
        });
      }
    });

    // Convert Map to array และเรียงตาม code
    const itemGroups = Array.from(uniqueGroups.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((group, index) => ({
        id: `IG-${group.code}`, // Generate ID format: IG-AL, IG-CU, etc.
        code: group.code,
        name: group.name,
      }));

    return itemGroups;
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
    // CustomerMapping ยังมี customerGroup relation (ไม่เปลี่ยน)
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
    // Return all records (including Draft) so user can see pending changes
    const items = await this.fabCostRepository.find({
      order: { itemGroupCode: 'ASC', version: 'DESC', createdAt: 'DESC' }
    });
    return this.attachCurrencyMetadata(items);
  }

  async addFabCost(costDto: any) {
    const currencyCode = await this.ensureCurrencyCodeExists(
      costDto.currencyCode ?? costDto.currency,
      'Fab Cost',
    );

    const newCost = this.fabCostRepository.create({
      itemGroupCode: costDto.itemGroupCode,
      price: costDto.price,
      currency: currencyCode,
      description: costDto.description || null,
      status: costDto.status || 'Draft',
      isActive: true,
      version: 1
    });
    const savedCost = await this.fabCostRepository.save(newCost);

    // บันทึก history
    await this.createFabCostHistory(savedCost, 'admin');

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

    // Ensure currency code
    let currencyCode = cost.currency;
    if (costDto.currency !== undefined || costDto.currencyCode !== undefined) {
      currencyCode = await this.ensureCurrencyCodeExists(
        costDto.currencyCode ?? costDto.currency,
        'Fab Cost',
      );
    }

    // 🔥 ถ้าเป็น Draft อยู่แล้ว → Update record เดิม
    if (cost.status === 'Draft') {
      Object.assign(cost, {
        itemGroupCode: costDto.itemGroupCode !== undefined ? costDto.itemGroupCode : cost.itemGroupCode,
        price: costDto.price !== undefined ? costDto.price : cost.price,
        currency: currencyCode,
        description: costDto.description !== undefined ? costDto.description : cost.description,
        updatedBy: 'admin',
      });

      const savedCost = await this.fabCostRepository.save(cost);

      // บันทึก history
      await this.createFabCostHistory(savedCost, 'admin');

      // บันทึก activity log
      await this.activityLogService.logMasterDataChanged(
        'fab_costs',
        savedCost.id,
        'admin',
        'Admin',
        'UPDATE',
        oldData,
        savedCost,
        costDto.changeReason ?? 'Updated draft version'
      );

      return savedCost;
    }

    // 🔥 ถ้าเป็น Active/Archived → ตรวจสอบว่ามี Draft อยู่แล้วหรือไม่
    const existingDraft = await this.fabCostRepository.findOne({
      where: {
        itemGroupCode: cost.itemGroupCode,
        status: 'Draft',
      },
    });

    if (existingDraft) {
      // Update existing Draft
      Object.assign(existingDraft, {
        itemGroupCode: costDto.itemGroupCode !== undefined ? costDto.itemGroupCode : existingDraft.itemGroupCode,
        price: costDto.price !== undefined ? costDto.price : existingDraft.price,
        currency: currencyCode,
        description: costDto.description !== undefined ? costDto.description : existingDraft.description,
        updatedBy: 'admin',
      });

      const savedCost = await this.fabCostRepository.save(existingDraft);
      await this.createFabCostHistory(savedCost, 'admin');
      await this.activityLogService.logMasterDataChanged(
        'fab_costs',
        savedCost.id,
        'admin',
        'Admin',
        'UPDATE',
        oldData,
        savedCost,
        costDto.changeReason ?? 'Updated existing draft version'
      );
      return savedCost;
    }

    // 🔥 ไม่มี Draft อยู่ → สร้าง Draft version ใหม่
    const newVersion = (cost.version || 1) + 1;

    const newCost = this.fabCostRepository.create({
      itemGroupCode: costDto.itemGroupCode !== undefined ? costDto.itemGroupCode : cost.itemGroupCode,
      price: costDto.price !== undefined ? costDto.price : cost.price,
      currency: currencyCode,
      description: costDto.description !== undefined ? costDto.description : cost.description,
      status: 'Draft',
      version: newVersion,
      isActive: false,
      createdBy: 'admin',
      updatedBy: 'admin',
    });

    const savedCost = await this.fabCostRepository.save(newCost);

    // บันทึก history
    await this.createFabCostHistory(savedCost, 'admin');

    // บันทึก activity log
    await this.activityLogService.logMasterDataChanged(
      'fab_costs',
      savedCost.id,
      'admin',
      'Admin',
      'CREATE',
      null,
      savedCost,
      costDto.changeReason ?? `Created new draft v${newVersion} based on v${cost.version}`
    );

    return savedCost;
  }

  // Helper method สำหรับสร้าง FabCost history record
  private async createFabCostHistory(cost: FabCost, userId: string) {
    const history = this.fabCostHistoryRepository.create({
      fabCostId: cost.id,
      version: cost.version || 1,
      itemGroupName: cost.itemGroupName,
      itemGroupCode: cost.itemGroupCode,
      price: cost.price,
      currency: cost.currency,
      description: cost.description,
      status: cost.status,
      approvedBy: cost.approvedBy,
      approvedAt: cost.approvedAt,
      effectiveFrom: cost.effectiveFrom,
      effectiveTo: cost.effectiveTo,
      createdBy: userId,
      changeReason: cost.changeReason
    });
    await this.fabCostHistoryRepository.save(history);
  }

  async deleteFabCost(id: string) {
    const cost = await this.fabCostRepository.findOne({ where: { id } });
    if (!cost) {
      throw new NotFoundException(`Fab cost with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Draft → ลบได้จริงๆ
    if (cost.status === 'Draft') {
      await this.fabCostRepository.remove(cost);
      return { message: `Permanently deleted Draft FAB Cost with ID ${id}` };
    }

    // 🔥 ถ้าเป็น Active หรือ Archived → ห้ามลบ
    throw new BadRequestException(`Cannot delete ${cost.status} record. Only Draft versions can be deleted.`);
  }

  // --- Standard Prices ---
  async findAllStandardPrices() {
    // Return all records (including Draft) so user can see pending changes
    const prices = await this.standardPriceRepository.find({
      relations: ['rawMaterial'],
      order: { createdAt: 'DESC' }  // เรียงตามวันที่สร้าง (ไม่มี version แล้ว)
    });
    return this.attachCurrencyMetadata(prices);
  }

  // 🗑️ REMOVED: addStandardPrice - Standard Price is read-only from MongoDB (synced data only)

  // 🗑️ REMOVED: updateStandardPrice - Standard Price is read-only from MongoDB (no version control)

  // 🗑️ REMOVED: createStandardPriceHistory - Standard Price is read-only from MongoDB (no history)

  // 🗑️ REMOVED: deleteStandardPrice - Standard Price is read-only from MongoDB (synced data only)

  // ดึง version history ของ Standard Price ตาม rawMaterialId
  // 🗑️ REMOVED: getStandardPriceHistory - Standard Price is read-only from MongoDB (no version control)
  // 🗑️ REMOVED: getStandardPriceHistoryById - Standard Price is read-only from MongoDB (no version control)
  // 🗑️ REMOVED: approveStandardPrice - Standard Price is read-only from MongoDB (no version control)

  // ดึง version history ของ FabCost
  async getFabCostHistory(fabCostId: string) {
    // 1. หา record จาก ID
    const record = await this.fabCostRepository.findOne({ where: { id: fabCostId } });
    if (!record) {
      throw new NotFoundException(`Fab cost with ID ${fabCostId} not found`);
    }

    // 2. ดึงทุก versions ที่มี itemGroup เดียวกัน (Active, Draft, Archived)
    const allVersions = await this.fabCostRepository.find({
      where: { itemGroupCode: record.itemGroupCode },
      order: { version: 'DESC' }
    });

    return allVersions;
  }

  // Approve Fab Cost
  async approveFabCost(id: string, username: string = 'admin') {
    const cost = await this.fabCostRepository.findOne({ where: { id } });
    if (!cost) {
      throw new NotFoundException(`Fab cost with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Active อยู่แล้ว → ไม่ต้องทำอะไร
    if (cost.status === 'Active') {
      throw new BadRequestException('Cannot approve: This version is already Active');
    }

    // 🔥 ถ้าไม่ใช่ Draft → ไม่สามารถ approve ได้
    if (cost.status !== 'Draft') {
      throw new BadRequestException('Can only approve Draft versions');
    }

    // ดึง user ID จาก username
    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    const oldData = { ...cost };

    try {
      // ปิด FK check ชั่วคราว
      await this.fabCostRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 STEP 1: Archive versions เก่าที่เป็น Active (same itemGroup)
      const oldActiveVersions = await this.fabCostRepository.find({
        where: {
          itemGroupCode: cost.itemGroupCode,
          status: 'Active',
        }
      });

      for (const oldVersion of oldActiveVersions) {
        if (oldVersion.id !== id) {
          await this.fabCostRepository.update(oldVersion.id, {
            status: 'Archived',
            effectiveTo: new Date(),
            isActive: false,
          });
          console.log(`✅ Archived FAB Cost version ${oldVersion.version} (ID: ${oldVersion.id})`);
        }
      }

      // 🔥 STEP 2: Approve version ใหม่
      await this.fabCostRepository.update(id, {
        status: 'Active',
        approvedBy: userId,
        approvedAt: new Date(),
        effectiveFrom: new Date(),
        isActive: true,
      });

      // ดึงข้อมูลใหม่หลัง update
      const savedCost = await this.fabCostRepository.findOne({ where: { id } });

      // บันทึก history
      await this.createFabCostHistory(savedCost, userId || username);

      // บันทึก activity log พร้อมระบุจำนวน archived versions
      await this.activityLogService.logMasterDataChanged(
        'fab_costs',
        savedCost.id,
        userId || username,
        userName,
        'UPDATE',
        oldData,
        savedCost,
        `Approved v${savedCost.version} by ${userName} (archived ${oldActiveVersions.length} old versions)`
      );

      return savedCost;
    } finally {
      // เปิด FK check กลับ
      await this.fabCostRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // ดึง version history ของ SellingFactor
  async getSellingFactorHistory(sellingFactorId: string) {
    // 1. หา record จาก ID
    const record = await this.sellingFactorRepository.findOne({ where: { id: sellingFactorId } });
    if (!record) {
      throw new NotFoundException(`Selling factor with ID ${sellingFactorId} not found`);
    }

    // 2. ดึงทุก versions ที่มี tubeSize เดียวกัน (Active, Draft, Archived)
    const allVersions = await this.sellingFactorRepository.find({
      where: { tubeSize: record.tubeSize },
      order: { version: 'DESC' }
    });

    return allVersions;
  }

  // Approve Selling Factor
  async approveSellingFactor(id: string, username: string = 'admin') {
    const factor = await this.sellingFactorRepository.findOne({ where: { id } });
    if (!factor) {
      throw new NotFoundException(`Selling factor with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Active อยู่แล้ว → ไม่ต้องทำอะไร
    if (factor.status === 'Active') {
      throw new BadRequestException('Cannot approve: This version is already Active');
    }

    // 🔥 ถ้าไม่ใช่ Draft → ไม่สามารถ approve ได้
    if (factor.status !== 'Draft') {
      throw new BadRequestException('Can only approve Draft versions');
    }

    // ดึง user ID จาก username
    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    const oldData = { ...factor };

    try {
      // ปิด FK check ชั่วคราว
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 STEP 1: Archive versions เก่าที่เป็น Active (same tubeSize)
      const oldActiveVersions = await this.sellingFactorRepository.find({
        where: {
          tubeSize: factor.tubeSize,
          status: 'Active',
        }
      });

      for (const oldVersion of oldActiveVersions) {
        if (oldVersion.id !== id) {
          await this.sellingFactorRepository.update(oldVersion.id, {
            status: 'Archived',
            effectiveTo: new Date(),
            isActive: false,
          });
          console.log(`✅ Archived Selling Factor version ${oldVersion.version} (ID: ${oldVersion.id})`);
        }
      }

      // 🔥 STEP 2: Approve version ใหม่
      await this.sellingFactorRepository.update(id, {
        status: 'Active',
        approvedBy: userId,
        approvedAt: new Date(),
        effectiveFrom: new Date(),
        isActive: true,
      });

      // ดึงข้อมูลใหม่หลัง update
      const savedFactor = await this.sellingFactorRepository.findOne({ where: { id } });

      // บันทึก history
      await this.createSellingFactorHistory(savedFactor, userId || username);

      // บันทึก activity log พร้อมระบุจำนวน archived versions
      await this.activityLogService.logMasterDataChanged(
        'selling_factors',
        savedFactor.id,
        userId || username,
        userName,
        'UPDATE',
        oldData,
        savedFactor,
        `Approved v${savedFactor.version} by ${userName} (archived ${oldActiveVersions.length} old versions)`
      );

      return savedFactor;
    } finally {
      // เปิด FK check กลับ
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // ดึง version history ของ LME Master Data
  async getLmeMasterDataHistory(lmeId: string) {
    // 1. หา record จาก ID
    const record = await this.lmeMasterDataRepository.findOne({ where: { id: lmeId } });
    if (!record) {
      throw new NotFoundException(`LME Master Data with ID ${lmeId} not found`);
    }

    // 2. ดึงทุก versions ที่มี itemGroupCode เดียวกัน (Active, Draft, Archived)
    const allVersions = await this.lmeMasterDataRepository.find({
      where: { itemGroupCode: record.itemGroupCode },
      order: { version: 'DESC' }
    });

    return allVersions;
  }

  // Approve LME Master Data
  async approveLmeMasterData(id: string, username: string = 'admin') {
    const lme = await this.lmeMasterDataRepository.findOne({ where: { id } });
    if (!lme) {
      throw new NotFoundException(`LME Master Data with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Active อยู่แล้ว → ไม่ต้องทำอะไร
    if (lme.status === 'Active') {
      throw new BadRequestException('Cannot approve: This version is already Active');
    }

    // 🔥 ถ้าไม่ใช่ Draft → ไม่สามารถ approve ได้
    if (lme.status !== 'Draft') {
      throw new BadRequestException('Can only approve Draft versions');
    }

    // ดึง user ID จาก username
    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    const oldData = { ...lme };

    try {
      // ปิด FK check ชั่วคราว
      await this.lmeMasterDataRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 STEP 1: Archive versions เก่าที่เป็น Active (same itemGroupCode)
      const oldActiveVersions = await this.lmeMasterDataRepository.find({
        where: {
          itemGroupCode: lme.itemGroupCode,
          status: 'Active',
        }
      });

      for (const oldVersion of oldActiveVersions) {
        if (oldVersion.id !== id) {
          await this.lmeMasterDataRepository.update(oldVersion.id, {
            status: 'Archived',
            effectiveTo: new Date(),
            isActive: false,
          });
          console.log(`✅ Archived LME Master Data version ${oldVersion.version} (ID: ${oldVersion.id})`);
        }
      }

      // 🔥 STEP 2: Approve version ใหม่
      await this.lmeMasterDataRepository.update(id, {
        status: 'Active',
        approvedBy: userId,
        approvedAt: new Date(),
        effectiveFrom: new Date(),
        isActive: true,
      });

      // ดึงข้อมูลใหม่หลัง update
      const savedLme = await this.lmeMasterDataRepository.findOne({ where: { id } });

      // บันทึก activity log พร้อมระบุจำนวน archived versions
      await this.activityLogService.logMasterDataChanged(
        'lme_master_data',
        savedLme.id,
        userId || username,
        userName,
        'UPDATE',
        oldData,
        savedLme,
        `Approved v${savedLme.version} by ${userName} (archived ${oldActiveVersions.length} old versions)`
      );

      return savedLme;
    } finally {
      // เปิด FK check กลับ
      await this.lmeMasterDataRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // ดึง version history ของ Exchange Rate Master Data
  async getExchangeRateMasterDataHistory(exRateId: string) {
    // 1. หา record จาก ID
    const record = await this.exchangeRateMasterDataRepository.findOne({ where: { id: exRateId } });
    if (!record) {
      throw new NotFoundException(`Exchange Rate Master Data with ID ${exRateId} not found`);
    }

    // 2. ดึงทุก versions ที่มี sourceCurrencyCode และ destinationCurrencyCode เดียวกัน (Active, Draft, Archived)
    const allVersions = await this.exchangeRateMasterDataRepository.find({
      where: {
        sourceCurrencyCode: record.sourceCurrencyCode,
        destinationCurrencyCode: record.destinationCurrencyCode
      },
      order: { version: 'DESC' }
    });

    return allVersions;
  }

  // Approve Exchange Rate Master Data
  async approveExchangeRateMasterData(id: string, username: string = 'admin') {
    const exRate = await this.exchangeRateMasterDataRepository.findOne({ where: { id } });
    if (!exRate) {
      throw new NotFoundException(`Exchange Rate Master Data with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Active อยู่แล้ว → ไม่ต้องทำอะไร
    if (exRate.status === 'Active') {
      throw new BadRequestException('Cannot approve: This version is already Active');
    }

    // 🔥 ถ้าไม่ใช่ Draft → ไม่สามารถ approve ได้
    if (exRate.status !== 'Draft') {
      throw new BadRequestException('Can only approve Draft versions');
    }

    // ดึง user ID จาก username
    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    const oldData = { ...exRate };

    try {
      // ปิด FK check ชั่วคราว
      await this.exchangeRateMasterDataRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 STEP 1: Archive versions เก่าที่เป็น Active (same currency pair)
      const oldActiveVersions = await this.exchangeRateMasterDataRepository.find({
        where: {
          sourceCurrencyCode: exRate.sourceCurrencyCode,
          destinationCurrencyCode: exRate.destinationCurrencyCode,
          status: 'Active',
        }
      });

      for (const oldVersion of oldActiveVersions) {
        if (oldVersion.id !== id) {
          await this.exchangeRateMasterDataRepository.update(oldVersion.id, {
            status: 'Archived',
            effectiveTo: new Date(),
            isActive: false,
          });
          console.log(`✅ Archived Exchange Rate version ${oldVersion.version} (ID: ${oldVersion.id})`);
        }
      }

      // 🔥 STEP 2: Approve version ใหม่
      await this.exchangeRateMasterDataRepository.update(id, {
        status: 'Active',
        approvedBy: userId,
        approvedAt: new Date(),
        effectiveFrom: new Date(),
        isActive: true,
      });

      // ดึงข้อมูลใหม่หลัง update
      const savedExRate = await this.exchangeRateMasterDataRepository.findOne({ where: { id } });

      // บันทึก activity log พร้อมระบุจำนวน archived versions
      await this.activityLogService.logMasterDataChanged(
        'exchange_rate_master_data',
        savedExRate.id,
        userId || username,
        userName,
        'UPDATE',
        oldData,
        savedExRate,
        `Approved v${savedExRate.version} by ${userName} (archived ${oldActiveVersions.length} old versions)`
      );

      return savedExRate;
    } finally {
      // เปิด FK check กลับ
      await this.exchangeRateMasterDataRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // 🔄 Rollback/Restore Version Methods

  // 🗑️ REMOVED: rollbackStandardPrice - Standard Price is read-only from MongoDB (no version control)

  // Rollback FAB Cost to a specific archived version
  async rollbackFabCost(archivedVersionId: string, username: string = 'admin') {
    const archivedVersion = await this.fabCostRepository.findOne({
      where: { id: archivedVersionId }
    });

    if (!archivedVersion) {
      throw new NotFoundException(`Archived FAB Cost version with ID ${archivedVersionId} not found`);
    }

    if (archivedVersion.status !== 'Archived') {
      throw new BadRequestException('Can only rollback from Archived versions');
    }

    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    try {
      await this.fabCostRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 ไม่ Archive Active version เพราะ Rollback สร้าง Draft (ยังไม่มีผลกับ Active)
      // เมื่อ Approve Draft ที่สร้างจาก Rollback แล้ว Active ถึงจะถูก Archive

      // Create new Draft version from archived data
      const maxVersion = await this.fabCostRepository
        .createQueryBuilder('fc')
        .where('fc.itemGroup = :itemGroup', { itemGroupCode: archivedVersion.itemGroupCode })
        .select('MAX(fc.version)', 'maxVersion')
        .getRawOne();

      const newVersion = (maxVersion?.maxVersion || 0) + 1;

      const restoredCost = this.fabCostRepository.create({
        itemGroupCode: archivedVersion.itemGroupCode,
        price: archivedVersion.price,
        currency: archivedVersion.currency,
        description: archivedVersion.description,
        status: 'Draft',  // 🔥 Rollback สร้าง Draft เพื่อให้ผ่านการอนุมัติก่อน
        approvedBy: null,  // ยังไม่ได้อนุมัติ
        approvedAt: null,  // ยังไม่ได้อนุมัติ
        effectiveFrom: null,  // จะตั้งเมื่ออนุมัติ
        effectiveTo: null,
        isActive: false,  // ยังไม่ Active
        version: newVersion,
        changeReason: `Rolled back from version ${archivedVersion.version}`,
        createdBy: username,
        updatedBy: username,
      });

      const savedCost = await this.fabCostRepository.save(restoredCost);

      await this.createFabCostHistory(savedCost, userId || username);

      await this.activityLogService.logMasterDataChanged(
        'fab_costs',
        savedCost.id,
        userId || username,
        userName,
        'UPDATE',
        archivedVersion,
        savedCost,
        `Rolled back to version ${archivedVersion.version} (created new version ${newVersion}) by ${userName}`
      );

      return savedCost;
    } finally {
      await this.fabCostRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // Rollback Selling Factor to a specific archived version
  async rollbackSellingFactor(archivedVersionId: string, username: string = 'admin') {
    const archivedVersion = await this.sellingFactorRepository.findOne({
      where: { id: archivedVersionId }
    });

    if (!archivedVersion) {
      throw new NotFoundException(`Archived Selling Factor version with ID ${archivedVersionId} not found`);
    }

    if (archivedVersion.status !== 'Archived') {
      throw new BadRequestException('Can only rollback from Archived versions');
    }

    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    try {
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 ไม่ Archive Active version เพราะ Rollback สร้าง Draft (ยังไม่มีผลกับ Active)
      // เมื่อ Approve Draft ที่สร้างจาก Rollback แล้ว Active ถึงจะถูก Archive

      // Create new Draft version from archived data
      const maxVersion = await this.sellingFactorRepository
        .createQueryBuilder('sf')
        .where('sf.tubeSize = :tubeSize', { tubeSize: archivedVersion.tubeSize })
        .select('MAX(sf.version)', 'maxVersion')
        .getRawOne();

      const newVersion = (maxVersion?.maxVersion || 0) + 1;

      const restoredFactor = this.sellingFactorRepository.create({
        tubeSize: archivedVersion.tubeSize,
        factor: archivedVersion.factor,
        description: archivedVersion.description,
        status: 'Draft',  // 🔥 Rollback สร้าง Draft เพื่อให้ผ่านการอนุมัติก่อน
        approvedBy: null,  // ยังไม่ได้อนุมัติ
        approvedAt: null,  // ยังไม่ได้อนุมัติ
        effectiveFrom: null,  // จะตั้งเมื่ออนุมัติ
        effectiveTo: null,
        isActive: false,  // ยังไม่ Active
        version: newVersion,
        changeReason: `Rolled back from version ${archivedVersion.version}`,
        createdBy: username,
        updatedBy: username,
      });

      const savedFactor = await this.sellingFactorRepository.save(restoredFactor);

      await this.createSellingFactorHistory(savedFactor, userId || username);

      await this.activityLogService.logMasterDataChanged(
        'selling_factors',
        savedFactor.id,
        userId || username,
        userName,
        'UPDATE',
        archivedVersion,
        savedFactor,
        `Rolled back to version ${archivedVersion.version} (created new version ${newVersion}) by ${userName}`
      );

      return savedFactor;
    } finally {
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // Rollback LME Master Data to a specific archived version
  async rollbackLmeMasterData(archivedVersionId: string, username: string = 'admin') {
    const archivedVersion = await this.lmeMasterDataRepository.findOne({
      where: { id: archivedVersionId }
    });

    if (!archivedVersion) {
      throw new NotFoundException(`Archived LME Master Data version with ID ${archivedVersionId} not found`);
    }

    if (archivedVersion.status !== 'Archived') {
      throw new BadRequestException('Can only rollback from Archived versions');
    }

    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    try {
      await this.lmeMasterDataRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 ไม่ Archive Active version เพราะ Rollback สร้าง Draft (ยังไม่มีผลกับ Active)
      // เมื่อ Approve Draft ที่สร้างจาก Rollback แล้ว Active ถึงจะถูก Archive

      // Create new Draft version from archived data
      const maxVersion = await this.lmeMasterDataRepository
        .createQueryBuilder('lme')
        .where('lme.itemGroupCode = :itemGroupCode', { itemGroupCode: archivedVersion.itemGroupCode })
        .select('MAX(lme.version)', 'maxVersion')
        .getRawOne();

      const newVersion = (maxVersion?.maxVersion || 0) + 1;

      const restoredLme = this.lmeMasterDataRepository.create({
        itemGroupName: archivedVersion.itemGroupName,
        itemGroupCode: archivedVersion.itemGroupCode,
        price: archivedVersion.price,
        currency: archivedVersion.currency,
        description: archivedVersion.description,
        status: 'Draft',  // 🔥 Rollback สร้าง Draft เพื่อให้ผ่านการอนุมัติก่อน
        approvedBy: null,  // ยังไม่ได้อนุมัติ
        approvedAt: null,  // ยังไม่ได้อนุมัติ
        effectiveFrom: null,  // จะตั้งเมื่ออนุมัติ
        effectiveTo: null,
        isActive: false,  // ยังไม่ Active
        version: newVersion,
        changeReason: `Rolled back from version ${archivedVersion.version}`,
        createdBy: username,
        updatedBy: username,
      });

      const savedLme = await this.lmeMasterDataRepository.save(restoredLme);

      await this.activityLogService.logMasterDataChanged(
        'lme_master_data',
        savedLme.id,
        userId || username,
        userName,
        'UPDATE',
        archivedVersion,
        savedLme,
        `Rolled back to version ${archivedVersion.version} (created new version ${newVersion}) by ${userName}`
      );

      return savedLme;
    } finally {
      await this.lmeMasterDataRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // Rollback Exchange Rate Master Data to a specific archived version
  async rollbackExchangeRateMasterData(archivedVersionId: string, username: string = 'admin') {
    const archivedVersion = await this.exchangeRateMasterDataRepository.findOne({
      where: { id: archivedVersionId }
    });

    if (!archivedVersion) {
      throw new NotFoundException(`Archived Exchange Rate version with ID ${archivedVersionId} not found`);
    }

    if (archivedVersion.status !== 'Archived') {
      throw new BadRequestException('Can only rollback from Archived versions');
    }

    const user = await this.userRepository.findOne({ where: { username } });
    const userId = user?.id || null;
    const userName = user?.name || username;

    try {
      await this.exchangeRateMasterDataRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 ไม่ Archive Active version เพราะ Rollback สร้าง Draft (ยังไม่มีผลกับ Active)
      // เมื่อ Approve Draft ที่สร้างจาก Rollback แล้ว Active ถึงจะถูก Archive

      // Create new Draft version from archived data
      const maxVersion = await this.exchangeRateMasterDataRepository
        .createQueryBuilder('er')
        .where('er.sourceCurrencyCode = :source AND er.destinationCurrencyCode = :dest', {
          source: archivedVersion.sourceCurrencyCode,
          dest: archivedVersion.destinationCurrencyCode
        })
        .select('MAX(er.version)', 'maxVersion')
        .getRawOne();

      const newVersion = (maxVersion?.maxVersion || 0) + 1;

      const restoredExRate = this.exchangeRateMasterDataRepository.create({
        sourceCurrencyCode: archivedVersion.sourceCurrencyCode,
        sourceCurrencyName: archivedVersion.sourceCurrencyName,
        destinationCurrencyCode: archivedVersion.destinationCurrencyCode,
        destinationCurrencyName: archivedVersion.destinationCurrencyName,
        rate: archivedVersion.rate,
        status: 'Draft',  // 🔥 Rollback สร้าง Draft เพื่อให้ผ่านการอนุมัติก่อน
        approvedBy: null,  // ยังไม่ได้อนุมัติ
        approvedAt: null,  // ยังไม่ได้อนุมัติ
        effectiveFrom: null,  // จะตั้งเมื่ออนุมัติ
        effectiveTo: null,
        isActive: false,  // ยังไม่ Active
        version: newVersion,
        changeReason: `Rolled back from version ${archivedVersion.version}`,
        createdBy: username,
        updatedBy: username,
      });

      const savedExRate = await this.exchangeRateMasterDataRepository.save(restoredExRate);

      await this.activityLogService.logMasterDataChanged(
        'exchange_rate_master_data',
        savedExRate.id,
        userId || username,
        userName,
        'UPDATE',
        archivedVersion,
        savedExRate,
        `Rolled back to version ${archivedVersion.version} (created new version ${newVersion}) by ${userName}`
      );

      return savedExRate;
    } finally {
      await this.exchangeRateMasterDataRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // --- Selling Factors ---
  async findAllSellingFactors() {
    // v8.0: Selling Factor ใช้ tubeSize แทน patternCode/patternName
    // Note: Return all records (including Draft) so user can see pending changes
    return this.sellingFactorRepository.find({
      order: { tubeSize: 'ASC', version: 'DESC', createdAt: 'DESC' }
    });
  }

  async addSellingFactor(factorDto: any) {
    const newFactor = this.sellingFactorRepository.create({
      tubeSize: factorDto.tubeSize,
      factor: factorDto.factor,
      description: factorDto.description || null,
      status: factorDto.status || 'Draft',
      effectiveFrom: factorDto.effectiveFrom,
      effectiveTo: factorDto.effectiveTo || null,
      changeReason: factorDto.changeReason || null,
      isActive: true,
      version: 1,
      createdBy: 'admin',
      updatedBy: 'admin'
    });
    const savedFactor = await this.sellingFactorRepository.save(newFactor);

    // บันทึก history
    await this.createSellingFactorHistory(savedFactor, 'admin');

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

    try {
      // ปิด FK check ชั่วคราว
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 ถ้าเป็น Draft อยู่แล้ว → Update record เดิม
      if (factor.status === 'Draft') {
        Object.assign(factor, {
          tubeSize: factorDto.tubeSize !== undefined ? factorDto.tubeSize : factor.tubeSize,
          factor: factorDto.factor !== undefined ? factorDto.factor : factor.factor,
          description: factorDto.description !== undefined ? factorDto.description : factor.description,
          effectiveFrom: factorDto.effectiveFrom !== undefined ? factorDto.effectiveFrom : factor.effectiveFrom,
          effectiveTo: factorDto.effectiveTo !== undefined ? factorDto.effectiveTo : factor.effectiveTo,
          changeReason: factorDto.changeReason !== undefined ? factorDto.changeReason : factor.changeReason,
          updatedBy: 'admin',
        });

        const savedFactor = await this.sellingFactorRepository.save(factor);

        // บันทึก history
        await this.createSellingFactorHistory(savedFactor, 'admin');

        // บันทึก activity log
        await this.activityLogService.logMasterDataChanged(
          'selling_factors',
          savedFactor.id,
          'admin',
          'Admin',
          'UPDATE',
          oldData,
          savedFactor,
          factorDto.changeReason ?? 'Updated draft version'
        );

        return savedFactor;
      }

      // 🔥 ถ้าเป็น Active/Archived → ตรวจสอบว่ามี Draft อยู่แล้วหรือไม่
      // ถ้ามี Draft อยู่แล้ว → Update Draft เดิม
      // ถ้ายังไม่มี → สร้าง Draft ใหม่
      const existingDraft = await this.sellingFactorRepository.findOne({
        where: {
          tubeSize: factor.tubeSize,
          status: 'Draft',
        },
      });

      if (existingDraft) {
        // Update Draft ที่มีอยู่แล้ว
        Object.assign(existingDraft, {
          tubeSize: factorDto.tubeSize !== undefined ? factorDto.tubeSize : existingDraft.tubeSize,
          factor: factorDto.factor !== undefined ? factorDto.factor : existingDraft.factor,
          description: factorDto.description !== undefined ? factorDto.description : existingDraft.description,
          effectiveFrom: factorDto.effectiveFrom !== undefined ? factorDto.effectiveFrom : existingDraft.effectiveFrom,
          effectiveTo: factorDto.effectiveTo !== undefined ? factorDto.effectiveTo : existingDraft.effectiveTo,
          changeReason: factorDto.changeReason !== undefined ? factorDto.changeReason : existingDraft.changeReason,
          updatedBy: 'admin',
        });

        const savedFactor = await this.sellingFactorRepository.save(existingDraft);

        // บันทึก history
        await this.createSellingFactorHistory(savedFactor, 'admin');

        // บันทึก activity log
        await this.activityLogService.logMasterDataChanged(
          'selling_factors',
          savedFactor.id,
          'admin',
          'Admin',
          'UPDATE',
          oldData,
          savedFactor,
          factorDto.changeReason ?? 'Updated existing draft version'
        );

        return savedFactor;
      }

      // สร้าง Draft version ใหม่
      const newVersion = (factor.version || 1) + 1;

      const newFactor = this.sellingFactorRepository.create({
        tubeSize: factorDto.tubeSize !== undefined ? factorDto.tubeSize : factor.tubeSize,
        factor: factorDto.factor !== undefined ? factorDto.factor : factor.factor,
        description: factorDto.description !== undefined ? factorDto.description : factor.description,
        status: 'Draft',
        effectiveFrom: factorDto.effectiveFrom !== undefined ? factorDto.effectiveFrom : factor.effectiveFrom,
        effectiveTo: factorDto.effectiveTo !== undefined ? factorDto.effectiveTo : null,
        changeReason: factorDto.changeReason !== undefined ? factorDto.changeReason : `Updated from v${factor.version}`,
        version: newVersion,
        isActive: false,
        createdBy: 'admin',
        updatedBy: 'admin',
      });

      const savedFactor = await this.sellingFactorRepository.save(newFactor);

      // บันทึก history
      await this.createSellingFactorHistory(savedFactor, 'admin');

      // บันทึก activity log
      await this.activityLogService.logMasterDataChanged(
        'selling_factors',
        savedFactor.id,
        'admin',
        'Admin',
        'CREATE',
        null,
        savedFactor,
        factorDto.changeReason ?? `Created new draft v${newVersion} based on v${factor.version}`
      );

      return savedFactor;
    } finally {
      // เปิด FK check กลับ
      await this.sellingFactorRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  // Helper method สำหรับสร้าง SellingFactor history record
  private async createSellingFactorHistory(factor: SellingFactor, userId: string) {
    const history = this.sellingFactorHistoryRepository.create({
      sellingFactorId: factor.id,
      version: factor.version || 1,
      tubeSize: factor.tubeSize,
      factor: factor.factor,
      description: factor.description,
      status: factor.status,
      approvedBy: factor.approvedBy,
      approvedAt: factor.approvedAt,
      effectiveFrom: factor.effectiveFrom,
      effectiveTo: factor.effectiveTo,
      createdBy: userId,
      changeReason: factor.changeReason
    });
    await this.sellingFactorHistoryRepository.save(history);
  }

  async deleteSellingFactor(id: string) {
    const factor = await this.sellingFactorRepository.findOne({ where: { id } });
    if (!factor) {
      throw new NotFoundException(`Selling factor with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Draft → ลบได้จริงๆ
    if (factor.status === 'Draft') {
      await this.sellingFactorRepository.remove(factor);
      return { message: `Permanently deleted Draft Selling Factor with ID ${id}` };
    }

    // 🔥 ถ้าเป็น Active หรือ Archived → ห้ามลบ
    throw new BadRequestException(`Cannot delete ${factor.status} record. Only Draft versions can be deleted.`);
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
    const rates = await this.exchangeRateRepository.find({
      where: { isActive: true },
      order: { rateDate: 'DESC' }
    });
    return this.attachExchangeRateCurrencyMetadata(rates);
  }

  async addExchangeRate(rateDto: any) {
    const [sourceCode, destinationCode] = await this.ensureCurrencyCodesExist([
      { code: rateDto.sourceCurrencyCode, context: 'Exchange Rate (source)' },
      {
        code: rateDto.destinationCurrencyCode,
        context: 'Exchange Rate (destination)',
      },
    ]);

    const [sourceCurrency, destinationCurrency] = await Promise.all([
      this.findCurrencyEntity(sourceCode),
      this.findCurrencyEntity(destinationCode),
    ]);

    const newRate = this.exchangeRateRepository.create({
      sourceCurrencyCode: sourceCode,
      sourceCurrencyName:
        sourceCurrency?.name ?? rateDto.sourceCurrencyName ?? sourceCode,
      destinationCurrencyCode: destinationCode,
      destinationCurrencyName:
        destinationCurrency?.name ??
        rateDto.destinationCurrencyName ??
        destinationCode,
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

    const updated: any = { ...rateDto };

    if (rateDto.sourceCurrencyCode !== undefined) {
      updated.sourceCurrencyCode = await this.ensureCurrencyCodeExists(
        rateDto.sourceCurrencyCode,
        'Exchange Rate (source)',
      );
    }

    if (rateDto.destinationCurrencyCode !== undefined) {
      updated.destinationCurrencyCode = await this.ensureCurrencyCodeExists(
        rateDto.destinationCurrencyCode,
        'Exchange Rate (destination)',
      );
    }

    if (updated.sourceCurrencyCode) {
      const sourceCurrency = await this.findCurrencyEntity(
        updated.sourceCurrencyCode,
      );
      if (sourceCurrency) {
        updated.sourceCurrencyName = sourceCurrency.name;
      } else if (!updated.sourceCurrencyName) {
        updated.sourceCurrencyName = updated.sourceCurrencyCode;
      }
    }

    if (updated.destinationCurrencyCode) {
      const destinationCurrency = await this.findCurrencyEntity(
        updated.destinationCurrencyCode,
      );
      if (destinationCurrency) {
        updated.destinationCurrencyName = destinationCurrency.name;
      } else if (!updated.destinationCurrencyName) {
        updated.destinationCurrencyName = updated.destinationCurrencyCode;
      }
    }

    Object.assign(rate, updated);
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
    // v7.0: LME Master Data ไม่มี customerGroup relation แล้ว (Global Default)
    // Return all records (including Draft) so user can see pending changes
    const records = await this.lmeMasterDataRepository.find({
      order: { itemGroupCode: 'ASC', version: 'DESC', createdAt: 'DESC' }
    });
    return this.attachCurrencyMetadata(records);
  }

  async addLmeMasterData(lmeDto: any) {
    const currencyCode = await this.ensureCurrencyCodeExists(
      lmeDto.currencyCode ?? lmeDto.currency,
      'LME Master Data',
    );

    const newLme = this.lmeMasterDataRepository.create({
      itemGroupName: lmeDto.itemGroupName,
      itemGroupCode: lmeDto.itemGroupCode,
      price: lmeDto.price,
      currency: currencyCode,
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

    // Ensure currency code
    let currencyCode = lme.currency;
    if (lmeDto.currency !== undefined || lmeDto.currencyCode !== undefined) {
      currencyCode = await this.ensureCurrencyCodeExists(
        lmeDto.currencyCode ?? lmeDto.currency,
        'LME Master Data',
      );
    }

    const oldData = { ...lme };

    try {
      await this.lmeMasterDataRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 ถ้าเป็น Draft อยู่แล้ว → Update record เดิม
      if (lme.status === 'Draft') {
        Object.assign(lme, {
          itemGroupName: lmeDto.itemGroupName !== undefined ? lmeDto.itemGroupName : lme.itemGroupName,
          itemGroupCode: lmeDto.itemGroupCode !== undefined ? lmeDto.itemGroupCode : lme.itemGroupCode,
          price: lmeDto.price !== undefined ? lmeDto.price : lme.price,
          currency: currencyCode,
          description: lmeDto.description !== undefined ? lmeDto.description : lme.description,
          effectiveFrom: lmeDto.effectiveFrom !== undefined ? lmeDto.effectiveFrom : lme.effectiveFrom,
          effectiveTo: lmeDto.effectiveTo !== undefined ? lmeDto.effectiveTo : lme.effectiveTo,
          changeReason: lmeDto.changeReason !== undefined ? lmeDto.changeReason : lme.changeReason,
          updatedBy: 'admin',
        });

        const savedLme = await this.lmeMasterDataRepository.save(lme);
        await this.activityLogService.logMasterDataChanged(
          'lme_master_data',
          savedLme.id,
          'admin',
          'Admin',
          'UPDATE',
          oldData,
          savedLme,
          lmeDto.changeReason ?? 'Updated draft version'
        );
        return savedLme;
      }

      // 🔥 ถ้าเป็น Active/Archived → ตรวจสอบว่ามี Draft อยู่แล้วหรือไม่
      const existingDraft = await this.lmeMasterDataRepository.findOne({
        where: {
          itemGroupCode: lme.itemGroupCode,
          status: 'Draft',
        },
      });

      if (existingDraft) {
        // Update existing Draft
        Object.assign(existingDraft, {
          itemGroupName: lmeDto.itemGroupName !== undefined ? lmeDto.itemGroupName : existingDraft.itemGroupName,
          itemGroupCode: lmeDto.itemGroupCode !== undefined ? lmeDto.itemGroupCode : existingDraft.itemGroupCode,
          price: lmeDto.price !== undefined ? lmeDto.price : existingDraft.price,
          currency: currencyCode,
          description: lmeDto.description !== undefined ? lmeDto.description : existingDraft.description,
          effectiveFrom: lmeDto.effectiveFrom !== undefined ? lmeDto.effectiveFrom : existingDraft.effectiveFrom,
          effectiveTo: lmeDto.effectiveTo !== undefined ? lmeDto.effectiveTo : existingDraft.effectiveTo,
          changeReason: lmeDto.changeReason !== undefined ? lmeDto.changeReason : existingDraft.changeReason,
          updatedBy: 'admin',
        });

        const savedLme = await this.lmeMasterDataRepository.save(existingDraft);
        await this.activityLogService.logMasterDataChanged(
          'lme_master_data',
          savedLme.id,
          'admin',
          'Admin',
          'UPDATE',
          oldData,
          savedLme,
          lmeDto.changeReason ?? 'Updated existing draft version'
        );
        return savedLme;
      }

      // 🔥 ไม่มี Draft อยู่ → สร้าง Draft version ใหม่
      const newVersion = (lme.version || 1) + 1;

      const newLme = this.lmeMasterDataRepository.create({
        itemGroupName: lmeDto.itemGroupName !== undefined ? lmeDto.itemGroupName : lme.itemGroupName,
        itemGroupCode: lmeDto.itemGroupCode !== undefined ? lmeDto.itemGroupCode : lme.itemGroupCode,
        price: lmeDto.price !== undefined ? lmeDto.price : lme.price,
        currency: currencyCode,
        description: lmeDto.description !== undefined ? lmeDto.description : lme.description,
        status: 'Draft',
        effectiveFrom: lmeDto.effectiveFrom !== undefined ? lmeDto.effectiveFrom : lme.effectiveFrom,
        effectiveTo: lmeDto.effectiveTo !== undefined ? lmeDto.effectiveTo : null,
        changeReason: lmeDto.changeReason !== undefined ? lmeDto.changeReason : `Updated from v${lme.version}`,
        version: newVersion,
        isActive: false,
        createdBy: 'admin',
        updatedBy: 'admin',
      });

      const savedLme = await this.lmeMasterDataRepository.save(newLme);
      await this.activityLogService.logMasterDataChanged(
        'lme_master_data',
        savedLme.id,
        'admin',
        'Admin',
        'CREATE',
        null,
        savedLme,
        lmeDto.changeReason ?? `Created new draft v${newVersion} based on v${lme.version}`
      );
      return savedLme;
    } finally {
      await this.lmeMasterDataRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  async deleteLmeMasterData(id: string) {
    const lme = await this.lmeMasterDataRepository.findOne({ where: { id } });
    if (!lme) {
      throw new NotFoundException(`LME master data with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Draft → ลบได้จริงๆ
    if (lme.status === 'Draft') {
      await this.lmeMasterDataRepository.remove(lme);
      return { message: `Permanently deleted Draft LME Master Data with ID ${id}` };
    }

    // 🔥 ถ้าเป็น Active หรือ Archived → ห้ามลบ
    throw new BadRequestException(`Cannot delete ${lme.status} record. Only Draft versions can be deleted.`);
  }

  // --- Exchange Rate Master Data (for calculation) ---
  async findAllExchangeRateMasterData() {
    // v7.0: Exchange Rate Master Data ไม่มี customerGroup relation แล้ว (Global Default)
    // Return all records (including Draft) so user can see pending changes
    const records = await this.exchangeRateMasterDataRepository.find({
      order: { sourceCurrencyCode: 'ASC', destinationCurrencyCode: 'ASC', version: 'DESC', createdAt: 'DESC' }
    });
    return this.attachExchangeRateCurrencyMetadata(records);
  }

  async addExchangeRateMasterData(rateDto: any) {
    const [sourceCode, destinationCode] = await this.ensureCurrencyCodesExist([
      { code: rateDto.sourceCurrencyCode, context: 'Exchange Rate (source)' },
      {
        code: rateDto.destinationCurrencyCode,
        context: 'Exchange Rate (destination)',
      },
    ]);

    const [sourceCurrency, destinationCurrency] = await Promise.all([
      this.findCurrencyEntity(sourceCode),
      this.findCurrencyEntity(destinationCode),
    ]);

    const newRate = this.exchangeRateMasterDataRepository.create({
      sourceCurrencyCode: sourceCode,
      sourceCurrencyName:
        sourceCurrency?.name ?? rateDto.sourceCurrencyName ?? sourceCode,
      destinationCurrencyCode: destinationCode,
      destinationCurrencyName:
        destinationCurrency?.name ??
        rateDto.destinationCurrencyName ??
        destinationCode,
      rate: rateDto.rate,
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

    // Ensure currency codes
    let sourceCurrencyCode = rate.sourceCurrencyCode;
    let destinationCurrencyCode = rate.destinationCurrencyCode;

    if (rateDto.sourceCurrencyCode !== undefined) {
      sourceCurrencyCode = await this.ensureCurrencyCodeExists(
        rateDto.sourceCurrencyCode,
        'Exchange Rate (source)',
      );
    }

    if (rateDto.destinationCurrencyCode !== undefined) {
      destinationCurrencyCode = await this.ensureCurrencyCodeExists(
        rateDto.destinationCurrencyCode,
        'Exchange Rate (destination)',
      );
    }

    // Get currency names
    let sourceCurrencyName = rate.sourceCurrencyName;
    let destinationCurrencyName = rate.destinationCurrencyName;

    if (rateDto.sourceCurrencyCode !== undefined) {
      const sourceCurrency = await this.findCurrencyEntity(sourceCurrencyCode);
      sourceCurrencyName = sourceCurrency?.name ?? rateDto.sourceCurrencyName ?? sourceCurrencyCode;
    }

    if (rateDto.destinationCurrencyCode !== undefined) {
      const destinationCurrency = await this.findCurrencyEntity(destinationCurrencyCode);
      destinationCurrencyName = destinationCurrency?.name ?? rateDto.destinationCurrencyName ?? destinationCurrencyCode;
    }

    const oldData = { ...rate };

    try {
      await this.exchangeRateMasterDataRepository.query('PRAGMA foreign_keys = OFF');

      // 🔥 ถ้าเป็น Draft อยู่แล้ว → Update record เดิม
      if (rate.status === 'Draft') {
        Object.assign(rate, {
          sourceCurrencyCode,
          sourceCurrencyName: rateDto.sourceCurrencyName !== undefined ? rateDto.sourceCurrencyName : sourceCurrencyName,
          destinationCurrencyCode,
          destinationCurrencyName: rateDto.destinationCurrencyName !== undefined ? rateDto.destinationCurrencyName : destinationCurrencyName,
          rate: rateDto.rate !== undefined ? rateDto.rate : rate.rate,
          description: rateDto.description !== undefined ? rateDto.description : rate.description,
          effectiveFrom: rateDto.effectiveFrom !== undefined ? rateDto.effectiveFrom : rate.effectiveFrom,
          effectiveTo: rateDto.effectiveTo !== undefined ? rateDto.effectiveTo : rate.effectiveTo,
          changeReason: rateDto.changeReason !== undefined ? rateDto.changeReason : rate.changeReason,
          updatedBy: 'admin',
        });

        const savedRate = await this.exchangeRateMasterDataRepository.save(rate);
        await this.activityLogService.logMasterDataChanged(
          'exchange_rate_master_data',
          savedRate.id,
          'admin',
          'Admin',
          'UPDATE',
          oldData,
          savedRate,
          rateDto.changeReason ?? 'Updated draft version'
        );
        return savedRate;
      }

      // 🔥 ถ้าเป็น Active/Archived → ตรวจสอบว่ามี Draft อยู่แล้วหรือไม่
      const existingDraft = await this.exchangeRateMasterDataRepository.findOne({
        where: {
          sourceCurrencyCode: rate.sourceCurrencyCode,
          destinationCurrencyCode: rate.destinationCurrencyCode,
          status: 'Draft',
        },
      });

      if (existingDraft) {
        // Update existing Draft
        Object.assign(existingDraft, {
          sourceCurrencyCode,
          sourceCurrencyName: rateDto.sourceCurrencyName !== undefined ? rateDto.sourceCurrencyName : sourceCurrencyName,
          destinationCurrencyCode,
          destinationCurrencyName: rateDto.destinationCurrencyName !== undefined ? rateDto.destinationCurrencyName : destinationCurrencyName,
          rate: rateDto.rate !== undefined ? rateDto.rate : existingDraft.rate,
          description: rateDto.description !== undefined ? rateDto.description : existingDraft.description,
          effectiveFrom: rateDto.effectiveFrom !== undefined ? rateDto.effectiveFrom : existingDraft.effectiveFrom,
          effectiveTo: rateDto.effectiveTo !== undefined ? rateDto.effectiveTo : existingDraft.effectiveTo,
          changeReason: rateDto.changeReason !== undefined ? rateDto.changeReason : existingDraft.changeReason,
          updatedBy: 'admin',
        });

        const savedRate = await this.exchangeRateMasterDataRepository.save(existingDraft);
        await this.activityLogService.logMasterDataChanged(
          'exchange_rate_master_data',
          savedRate.id,
          'admin',
          'Admin',
          'UPDATE',
          oldData,
          savedRate,
          rateDto.changeReason ?? 'Updated existing draft version'
        );
        return savedRate;
      }

      // 🔥 ไม่มี Draft อยู่ → สร้าง Draft version ใหม่
      const newVersion = (rate.version || 1) + 1;

      const newRate = this.exchangeRateMasterDataRepository.create({
        sourceCurrencyCode,
        sourceCurrencyName: rateDto.sourceCurrencyName !== undefined ? rateDto.sourceCurrencyName : sourceCurrencyName,
        destinationCurrencyCode,
        destinationCurrencyName: rateDto.destinationCurrencyName !== undefined ? rateDto.destinationCurrencyName : destinationCurrencyName,
        rate: rateDto.rate !== undefined ? rateDto.rate : rate.rate,
        description: rateDto.description !== undefined ? rateDto.description : rate.description,
        status: 'Draft',
        effectiveFrom: rateDto.effectiveFrom !== undefined ? rateDto.effectiveFrom : rate.effectiveFrom,
        effectiveTo: rateDto.effectiveTo !== undefined ? rateDto.effectiveTo : null,
        changeReason: rateDto.changeReason !== undefined ? rateDto.changeReason : `Updated from v${rate.version}`,
        version: newVersion,
        isActive: false,
        createdBy: 'admin',
        updatedBy: 'admin',
      });

      const savedRate = await this.exchangeRateMasterDataRepository.save(newRate);
      await this.activityLogService.logMasterDataChanged(
        'exchange_rate_master_data',
        savedRate.id,
        'admin',
        'Admin',
        'CREATE',
        null,
        savedRate,
        rateDto.changeReason ?? `Created new draft v${newVersion} based on v${rate.version}`
      );
      return savedRate;
    } finally {
      await this.exchangeRateMasterDataRepository.query('PRAGMA foreign_keys = ON');
    }
  }

  async deleteExchangeRateMasterData(id: string) {
    const rate = await this.exchangeRateMasterDataRepository.findOne({ where: { id } });
    if (!rate) {
      throw new NotFoundException(`Exchange rate master data with ID ${id} not found`);
    }

    // 🔥 ถ้าเป็น Draft → ลบได้จริงๆ
    if (rate.status === 'Draft') {
      await this.exchangeRateMasterDataRepository.remove(rate);
      return { message: `Permanently deleted Draft Exchange Rate Master Data with ID ${id}` };
    }

    // 🔥 ถ้าเป็น Active หรือ Archived → ห้ามลบ
    throw new BadRequestException(`Cannot delete ${rate.status} record. Only Draft versions can be deleted.`);
  }

  // 🗑️ REMOVED: fixStandardPricesStatus - Standard Price is read-only from MongoDB (no status field)
}
 
