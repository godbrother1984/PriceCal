// path: server/src/data/scrap-allowance.service.ts
// version: 1.2 (Fix Rollback - Create Draft instead of Active)
// last-modified: 29 ตุลาคม 2568 02:15

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapAllowance } from '../entities/scrap-allowance.entity';

@Injectable()
export class ScrapAllowanceService {
  constructor(
    @InjectRepository(ScrapAllowance)
    private scrapAllowanceRepository: Repository<ScrapAllowance>,
  ) {}

  // ===== GET ALL =====
  async getScrapAllowances() {
    const data = await this.scrapAllowanceRepository.find({
      order: { itemGroupCode: 'ASC', version: 'DESC' },
    });
    return data;
  }

  // ===== GET BY ID =====
  async getScrapAllowanceById(id: string) {
    const record = await this.scrapAllowanceRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Scrap allowance with ID ${id} not found`);
    }
    return record;
  }

  // ===== CREATE (Draft) =====
  async createScrapAllowance(data: {
    itemGroupCode: string;
    itemGroupName?: string;
    scrapPercentage: number;
    description?: string;
    changeReason?: string;
    createdBy?: string;
  }) {
    // ตรวจสอบว่ามี Active version สำหรับ itemGroupCode นี้อยู่แล้วหรือไม่
    const existing = await this.scrapAllowanceRepository.findOne({
      where: {
        itemGroupCode: data.itemGroupCode,
        status: 'Active',
      },
    });

    const version = existing ? existing.version + 1 : 1;

    const newRecord = this.scrapAllowanceRepository.create({
      ...data,
      version,
      status: 'Draft',
      isActive: false,
      createdBy: data.createdBy || 'admin',
    });

    return await this.scrapAllowanceRepository.save(newRecord);
  }

  // ===== UPDATE (Creates new Draft if editing Active/Archived) =====
  async updateScrapAllowance(
    id: string,
    data: {
      scrapPercentage?: number;
      description?: string;
      itemGroupName?: string;
      changeReason?: string;
      updatedBy?: string;
    },
  ) {
    const record = await this.scrapAllowanceRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Scrap allowance with ID ${id} not found`);
    }

    const oldData = { ...record };

    // 🔥 ถ้าเป็น Draft อยู่แล้ว → Update record เดิม
    if (record.status === 'Draft') {
      Object.assign(record, {
        scrapPercentage: data.scrapPercentage !== undefined ? data.scrapPercentage : record.scrapPercentage,
        description: data.description !== undefined ? data.description : record.description,
        itemGroupName: data.itemGroupName !== undefined ? data.itemGroupName : record.itemGroupName,
        changeReason: data.changeReason !== undefined ? data.changeReason : record.changeReason,
        updatedBy: data.updatedBy || 'admin',
        updatedAt: new Date(),
      });

      return await this.scrapAllowanceRepository.save(record);
    }

    // 🔥 ถ้าเป็น Active/Archived → ตรวจสอบว่ามี Draft อยู่แล้วหรือไม่
    const existingDraft = await this.scrapAllowanceRepository.findOne({
      where: {
        itemGroupCode: record.itemGroupCode,
        status: 'Draft',
      },
    });

    if (existingDraft) {
      // Update existing Draft
      Object.assign(existingDraft, {
        scrapPercentage: data.scrapPercentage !== undefined ? data.scrapPercentage : existingDraft.scrapPercentage,
        description: data.description !== undefined ? data.description : existingDraft.description,
        itemGroupName: data.itemGroupName !== undefined ? data.itemGroupName : existingDraft.itemGroupName,
        changeReason: data.changeReason !== undefined ? data.changeReason : existingDraft.changeReason,
        updatedBy: data.updatedBy || 'admin',
        updatedAt: new Date(),
      });

      return await this.scrapAllowanceRepository.save(existingDraft);
    }

    // 🔥 ไม่มี Draft อยู่ → สร้าง Draft version ใหม่
    const newVersion = (record.version || 1) + 1;

    const newRecord = this.scrapAllowanceRepository.create({
      itemGroupCode: record.itemGroupCode,
      itemGroupName: data.itemGroupName !== undefined ? data.itemGroupName : record.itemGroupName,
      scrapPercentage: data.scrapPercentage !== undefined ? data.scrapPercentage : record.scrapPercentage,
      description: data.description !== undefined ? data.description : record.description,
      status: 'Draft',
      version: newVersion,
      isActive: false,
      changeReason: data.changeReason || `Updated from v${record.version}`,
      createdBy: data.updatedBy || 'admin',
      updatedBy: data.updatedBy || 'admin',
    });

    return await this.scrapAllowanceRepository.save(newRecord);
  }

  // ===== DELETE (Draft only) =====
  async deleteScrapAllowance(id: string) {
    const record = await this.scrapAllowanceRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Scrap allowance with ID ${id} not found`);
    }

    if (record.status !== 'Draft') {
      throw new BadRequestException('Can only delete Draft versions');
    }

    await this.scrapAllowanceRepository.delete(id);
    return { success: true, message: 'Scrap allowance deleted successfully' };
  }

  // ===== APPROVE (Draft → Active) =====
  async approveScrapAllowance(id: string, username: string = 'admin') {
    const record = await this.scrapAllowanceRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Scrap allowance with ID ${id} not found`);
    }

    if (record.status === 'Active') {
      throw new BadRequestException('Cannot approve: This version is already Active');
    }

    if (record.status !== 'Draft') {
      throw new BadRequestException('Can only approve Draft versions');
    }

    // 1. Archive old Active version
    const oldActive = await this.scrapAllowanceRepository.findOne({
      where: {
        itemGroupCode: record.itemGroupCode,
        status: 'Active',
      },
    });

    if (oldActive) {
      oldActive.status = 'Archived';
      oldActive.isActive = false;
      oldActive.effectiveTo = new Date();
      await this.scrapAllowanceRepository.save(oldActive);
    }

    // 2. Activate new version
    record.status = 'Active';
    record.isActive = true;
    record.approvedBy = username;
    record.approvedAt = new Date();
    record.effectiveFrom = new Date();

    return await this.scrapAllowanceRepository.save(record);
  }

  // ===== ROLLBACK (Archived → Draft ใหม่) =====
  async rollbackScrapAllowance(id: string, username: string = 'admin') {
    const archivedRecord = await this.scrapAllowanceRepository.findOne({ where: { id } });
    if (!archivedRecord) {
      throw new NotFoundException(`Scrap allowance with ID ${id} not found`);
    }

    if (archivedRecord.status !== 'Archived') {
      throw new BadRequestException('Can only rollback Archived versions');
    }

    // 🔥 ไม่ Archive Active version เพราะ Rollback จะสร้าง Draft (ยังไม่มีผลกับ Active)

    // สร้าง Draft version ใหม่จาก Archived record
    const maxVersion = await this.scrapAllowanceRepository
      .createQueryBuilder('scrap')
      .where('scrap.itemGroupCode = :code', { code: archivedRecord.itemGroupCode })
      .orderBy('scrap.version', 'DESC')
      .getOne();

    const newVersion = (maxVersion?.version || 0) + 1;

    const newRecord = this.scrapAllowanceRepository.create({
      itemGroupCode: archivedRecord.itemGroupCode,
      itemGroupName: archivedRecord.itemGroupName,
      scrapPercentage: archivedRecord.scrapPercentage,
      description: archivedRecord.description,
      version: newVersion,
      status: 'Draft',  // 🔥 Rollback สร้าง Draft เพื่อให้ผ่านการอนุมัติก่อน
      isActive: false,  // ยังไม่ Active
      approvedBy: null,  // ยังไม่ได้อนุมัติ
      approvedAt: null,  // ยังไม่ได้อนุมัติ
      effectiveFrom: null,  // จะตั้งเมื่ออนุมัติ
      changeReason: `Rolled back from version ${archivedRecord.version}`,
      createdBy: username,
    });

    return await this.scrapAllowanceRepository.save(newRecord);
  }

  // ===== GET VERSION HISTORY =====
  async getScrapAllowanceHistory(scrapAllowanceId: string) {
    const record = await this.scrapAllowanceRepository.findOne({
      where: { id: scrapAllowanceId },
    });
    if (!record) {
      throw new NotFoundException(`Scrap allowance with ID ${scrapAllowanceId} not found`);
    }

    const allVersions = await this.scrapAllowanceRepository.find({
      where: { itemGroupCode: record.itemGroupCode },
      order: { version: 'DESC' },
    });

    return allVersions;
  }

  // ===== GET BY ITEM GROUP CODE (สำหรับ Price Calculation) =====
  async getActiveScrapAllowanceByItemGroup(itemGroupCode: string) {
    const record = await this.scrapAllowanceRepository.findOne({
      where: {
        itemGroupCode,
        status: 'Active',
        isActive: true,
      },
    });

    if (!record) {
      return null; // ไม่มีก็ return null (ไม่ throw error)
    }

    return record;
  }
}
