// path: server/src/customer-groups/customer-groups.service.ts
// version: 1.0 (Initial Customer Group Service)
// last-modified: 29 ตุลาคม 2568 17:30

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CustomerGroup } from '../entities/customer-group.entity';
import { CustomerMapping } from '../entities/customer-mapping.entity';
import { CustomerGroupFABCostOverride } from '../entities/customer-group-fab-cost-override.entity';
import { CustomerGroupSellingFactorOverride } from '../entities/customer-group-selling-factor-override.entity';
import { CustomerGroupLMEPriceOverride } from '../entities/customer-group-lme-price-override.entity';
import { CustomerGroupExchangeRateOverride } from '../entities/customer-group-exchange-rate-override.entity';
import { CustomerGroupStandardPriceOverride } from '../entities/customer-group-standard-price-override.entity';

export type OverrideType = 'fab-cost' | 'selling-factor' | 'lme-price' | 'exchange-rate' | 'standard-price';

@Injectable()
export class CustomerGroupsService {
  constructor(
    @InjectRepository(CustomerGroup)
    private customerGroupRepo: Repository<CustomerGroup>,
    @InjectRepository(CustomerMapping)
    private customerMappingRepo: Repository<CustomerMapping>,
    @InjectRepository(CustomerGroupFABCostOverride)
    private fabCostOverrideRepo: Repository<CustomerGroupFABCostOverride>,
    @InjectRepository(CustomerGroupSellingFactorOverride)
    private sellingFactorOverrideRepo: Repository<CustomerGroupSellingFactorOverride>,
    @InjectRepository(CustomerGroupLMEPriceOverride)
    private lmePriceOverrideRepo: Repository<CustomerGroupLMEPriceOverride>,
    @InjectRepository(CustomerGroupExchangeRateOverride)
    private exchangeRateOverrideRepo: Repository<CustomerGroupExchangeRateOverride>,
    @InjectRepository(CustomerGroupStandardPriceOverride)
    private standardPriceOverrideRepo: Repository<CustomerGroupStandardPriceOverride>,
  ) {}

  // ====================================
  // Customer Group CRUD
  // ====================================

  async findAll(): Promise<CustomerGroup[]> {
    return this.customerGroupRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CustomerGroup> {
    const group = await this.customerGroupRepo.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Customer Group with ID ${id} not found`);
    }
    return group;
  }

  async create(data: Partial<CustomerGroup>): Promise<CustomerGroup> {
    // ตรวจสอบว่า ID ซ้ำหรือไม่
    if (data.id) {
      const existing = await this.customerGroupRepo.findOne({ where: { id: data.id } });
      if (existing) {
        throw new BadRequestException(`Customer Group ID ${data.id} already exists`);
      }
    }

    const group = this.customerGroupRepo.create(data);
    return this.customerGroupRepo.save(group);
  }

  async update(id: string, data: Partial<CustomerGroup>): Promise<CustomerGroup> {
    const group = await this.findOne(id);

    // ห้ามเปลี่ยน ID
    if (data.id && data.id !== id) {
      throw new BadRequestException('Cannot change Customer Group ID');
    }

    Object.assign(group, data);
    return this.customerGroupRepo.save(group);
  }

  async delete(id: string): Promise<{ message: string }> {
    const group = await this.findOne(id);

    // ตรวจสอบว่ามี customers อยู่ใน group นี้หรือไม่
    const mappingCount = await this.customerMappingRepo.count({
      where: { customerGroupId: id },
    });

    if (mappingCount > 0) {
      throw new BadRequestException(
        `Cannot delete Customer Group. It has ${mappingCount} customers assigned.`
      );
    }

    // ตรวจสอบว่ามี overrides หรือไม่
    const [fabCount, factorCount, lmeCount, exRateCount, stdPriceCount] = await Promise.all([
      this.fabCostOverrideRepo.count({ where: { customerGroupId: id } }),
      this.sellingFactorOverrideRepo.count({ where: { customerGroupId: id } }),
      this.lmePriceOverrideRepo.count({ where: { customerGroupId: id } }),
      this.exchangeRateOverrideRepo.count({ where: { customerGroupId: id } }),
      this.standardPriceOverrideRepo.count({ where: { customerGroupId: id } }),
    ]);

    const totalOverrides = fabCount + factorCount + lmeCount + exRateCount + stdPriceCount;

    if (totalOverrides > 0) {
      throw new BadRequestException(
        `Cannot delete Customer Group. It has ${totalOverrides} price overrides.`
      );
    }

    await this.customerGroupRepo.remove(group);
    return { message: `Customer Group ${id} deleted successfully` };
  }

  // ====================================
  // Customer Mapping Management
  // ====================================

  async getCustomersByGroup(groupId: string) {
    await this.findOne(groupId); // Validate group exists

    return this.customerMappingRepo.find({
      where: { customerGroupId: groupId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async addCustomerToGroup(groupId: string, customerId: string, createdBy: string = 'admin') {
    await this.findOne(groupId); // Validate group exists

    // ตรวจสอบว่า customer อยู่ใน group อื่นแล้วหรือไม่
    const existingMapping = await this.customerMappingRepo.findOne({
      where: { customerId },
    });

    if (existingMapping) {
      throw new BadRequestException(
        `Customer is already assigned to group ${existingMapping.customerGroupId}`
      );
    }

    const mapping = this.customerMappingRepo.create({
      customerGroupId: groupId,
      customerId,
      createdBy,
    });

    return this.customerMappingRepo.save(mapping);
  }

  async removeCustomerFromGroup(groupId: string, customerId: string) {
    const mapping = await this.customerMappingRepo.findOne({
      where: { customerGroupId: groupId, customerId },
    });

    if (!mapping) {
      throw new NotFoundException(
        `Customer ${customerId} is not in group ${groupId}`
      );
    }

    await this.customerMappingRepo.remove(mapping);
    return { message: `Customer ${customerId} removed from group ${groupId}` };
  }

  // ====================================
  // Override CRUD (Generic for all types)
  // ====================================

  async getOverrides(groupId: string, type: OverrideType) {
    await this.findOne(groupId); // Validate group exists

    const repo = this.getOverrideRepository(type);
    return repo.find({
      where: { customerGroupId: groupId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOverride(groupId: string, type: OverrideType, overrideId: string) {
    await this.findOne(groupId); // Validate group exists

    const repo = this.getOverrideRepository(type);
    const override = await repo.findOne({ where: { id: overrideId } });

    if (!override) {
      throw new NotFoundException(`${type} Override with ID ${overrideId} not found`);
    }

    if (override.customerGroupId !== groupId) {
      throw new BadRequestException(`Override does not belong to group ${groupId}`);
    }

    return override;
  }

  async createOverride(groupId: string, type: OverrideType, data: any, createdBy: string = 'admin') {
    await this.findOne(groupId); // Validate group exists

    const repo = this.getOverrideRepository(type);

    // Set initial version control fields
    const override = repo.create({
      ...data,
      customerGroupId: groupId,
      version: 1,
      status: 'Draft',
      isActive: false,
      createdBy,
    });

    return repo.save(override);
  }

  async updateOverride(groupId: string, type: OverrideType, overrideId: string, data: any) {
    const override = await this.getOverride(groupId, type, overrideId);

    // Only allow updates for Draft status
    if (override.status !== 'Draft') {
      throw new BadRequestException(`Can only update Draft overrides. Current status: ${override.status}`);
    }

    const repo = this.getOverrideRepository(type);
    Object.assign(override, data);
    return repo.save(override);
  }

  async approveOverride(groupId: string, type: OverrideType, overrideId: string, approvedBy: string = 'admin') {
    const override = await this.getOverride(groupId, type, overrideId);

    if (override.status !== 'Draft') {
      throw new BadRequestException(`Can only approve Draft overrides. Current status: ${override.status}`);
    }

    const repo = this.getOverrideRepository(type);

    try {
      // Archive old Active versions (same group + same item)
      const oldActiveVersions = await this.findActiveVersionsForArchive(type, groupId, override);

      for (const oldVersion of oldActiveVersions) {
        if (oldVersion.id !== overrideId) {
          await repo.update(oldVersion.id, {
            status: 'Archived',
            effectiveTo: new Date(),
            isActive: false,
          });
          console.log(`✅ Archived ${type} Override version ${oldVersion.version} (ID: ${oldVersion.id})`);
        }
      }

      // Approve new version
      await repo.update(overrideId, {
        status: 'Active',
        approvedBy,
        approvedAt: new Date(),
        effectiveFrom: new Date(),
        isActive: true,
      });

      console.log(`✅ Approved ${type} Override version (ID: ${overrideId})`);

      return this.getOverride(groupId, type, overrideId);
    } catch (error) {
      console.error(`❌ Failed to approve ${type} Override:`, error);
      throw error;
    }
  }

  async deleteOverride(groupId: string, type: OverrideType, overrideId: string) {
    const override = await this.getOverride(groupId, type, overrideId);

    // Only allow deletion of Draft
    if (override.status !== 'Draft') {
      throw new BadRequestException(`Can only delete Draft overrides. Current status: ${override.status}`);
    }

    const repo = this.getOverrideRepository(type);
    await repo.remove(override);

    return { message: `${type} Override deleted successfully` };
  }

  // ====================================
  // Helper Methods
  // ====================================

  private getOverrideRepository(type: OverrideType): Repository<any> {
    switch (type) {
      case 'fab-cost':
        return this.fabCostOverrideRepo;
      case 'selling-factor':
        return this.sellingFactorOverrideRepo;
      case 'lme-price':
        return this.lmePriceOverrideRepo;
      case 'exchange-rate':
        return this.exchangeRateOverrideRepo;
      case 'standard-price':
        return this.standardPriceOverrideRepo;
      default:
        throw new BadRequestException(`Unknown override type: ${type}`);
    }
  }

  private async findActiveVersionsForArchive(type: OverrideType, groupId: string, override: any) {
    const repo = this.getOverrideRepository(type);
    let where: any = { customerGroupId: groupId, status: 'Active' };

    // Find by the unique identifier for each type
    switch (type) {
      case 'fab-cost':
        where.itemGroupCode = override.itemGroupCode;
        break;
      case 'selling-factor':
        where.tubeSize = override.tubeSize;
        break;
      case 'lme-price':
        where.itemGroupCode = override.itemGroupCode;
        break;
      case 'exchange-rate':
        where.sourceCurrencyCode = override.sourceCurrencyCode;
        where.destinationCurrencyCode = override.destinationCurrencyCode;
        break;
      case 'standard-price':
        where.rawMaterialId = override.rawMaterialId;
        break;
    }

    return repo.find({ where });
  }
}
