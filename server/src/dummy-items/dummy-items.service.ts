// path: server/src/dummy-items/dummy-items.service.ts
// version: 1.1 (Auto-generate Dummy Items Service - Disable Cron)
// last-modified: 14 ตุลาคม 2568 19:45

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class DummyItemsService implements OnModuleInit {
  private readonly logger = new Logger(DummyItemsService.name);
  private readonly BATCH_SIZE = 10; // สร้าง Dummy Items ทีละ 10 ตัว
  private readonly MIN_AVAILABLE = 20; // รักษา Dummy Items ที่พร้อมใช้งานไว้อย่างน้อย 20 ตัว

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Initializing Dummy Items Pool...');
    await this.ensureDummyItemsAvailable();
  }

  /**
   * Cron Job: ตรวจสอบและสร้าง Dummy Items ทุกๆ 5 นาที
   * Note: Disabled due to Node.js v18 crypto compatibility issue
   * Use manual trigger via POST /api/dummy-items/check-availability instead
   */
  // @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndGenerateDummyItems() {
    this.logger.log('🔍 Checking Dummy Items availability...');
    await this.ensureDummyItemsAvailable();
  }

  /**
   * ตรวจสอบและสร้าง Dummy Items ให้มีจำนวนเพียงพอ
   */
  async ensureDummyItemsAvailable(): Promise<void> {
    try {
      const availableCount = await this.getAvailableDummyItemsCount();
      this.logger.log(`📊 Available Dummy Items: ${availableCount}/${this.MIN_AVAILABLE}`);

      if (availableCount < this.MIN_AVAILABLE) {
        const needed = this.MIN_AVAILABLE - availableCount + this.BATCH_SIZE;
        this.logger.log(`🚀 Generating ${needed} new Dummy Items...`);
        await this.generateDummyItems(needed);
      } else {
        this.logger.log('✅ Dummy Items pool is healthy');
      }
    } catch (error) {
      this.logger.error('❌ Error ensuring Dummy Items availability', error);
    }
  }

  /**
   * นับจำนวน Dummy Items ที่พร้อมใช้งาน
   */
  async getAvailableDummyItemsCount(): Promise<number> {
    return await this.productRepository.count({
      where: {
        productSource: 'PRICECAL',
        itemStatus: 'AVAILABLE',
        id: Like('FG-DUMMY-%'),
      },
    });
  }

  /**
   * ดึงรายการ Dummy Items ที่พร้อมใช้งาน
   */
  async getAvailableDummyItems(limit: number = 50): Promise<Product[]> {
    return await this.productRepository.find({
      where: {
        productSource: 'PRICECAL',
        itemStatus: 'AVAILABLE',
        id: Like('FG-DUMMY-%'),
      },
      order: {
        createdAt: 'ASC', // เรียงตามเวลาสร้าง (เก่า → ใหม่)
      },
      take: limit,
    });
  }

  /**
   * สร้าง Dummy Items จำนวนที่ระบุ
   */
  async generateDummyItems(count: number): Promise<Product[]> {
    const createdItems: Product[] = [];

    for (let i = 0; i < count; i++) {
      const dummyId = await this.getNextDummyItemId();
      const dummyItem = this.productRepository.create({
        id: dummyId,
        name: `Dummy Item ${dummyId.replace('FG-DUMMY-', '')} (Placeholder)`,
        description: 'Auto-generated Dummy Item for pricing requests',
        category: 'DUMMY',
        unit: 'unit',
        productSource: 'PRICECAL',
        hasBOQ: false,
        isSyncedToD365: false,
        itemStatus: 'AVAILABLE',
        isUsed: false,
        awaitingD365Creation: false,
        source: 'PRICECAL',
        isActive: true,
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      });

      const saved = await this.productRepository.save(dummyItem);
      createdItems.push(saved);
    }

    this.logger.log(`✅ Created ${createdItems.length} Dummy Items`);
    return createdItems;
  }

  /**
   * หา running number ถัดไปสำหรับ Dummy Item
   */
  private async getNextDummyItemId(): Promise<string> {
    const latestDummy = await this.productRepository
      .createQueryBuilder('product')
      .where("product.id LIKE 'FG-DUMMY-%'")
      .orderBy("CAST(SUBSTR(product.id, 10) AS INTEGER)", 'DESC')
      .limit(1)
      .getOne();

    if (!latestDummy) {
      return 'FG-DUMMY-001';
    }

    const latestNumber = parseInt(latestDummy.id.replace('FG-DUMMY-', ''), 10);
    const nextNumber = latestNumber + 1;
    return `FG-DUMMY-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * ทำ Manual Mapping: Dummy Item → D365 Item
   */
  async mapDummyToD365(dto: {
    dummyItemId: string;
    d365ItemId: string;
    customerPO?: string;
    notes?: string;
    mappedBy: string;
  }): Promise<Product> {
    const dummyItem = await this.productRepository.findOne({
      where: { id: dto.dummyItemId },
    });

    if (!dummyItem) {
      throw new Error(`Dummy Item not found: ${dto.dummyItemId}`);
    }

    if (!dummyItem.id.startsWith('FG-DUMMY-')) {
      throw new Error(`Item ${dto.dummyItemId} is not a Dummy Item`);
    }

    // อัปเดต Dummy Item status
    dummyItem.itemStatus = 'MAPPED';
    dummyItem.d365ItemId = dto.d365ItemId;
    dummyItem.mappedDate = new Date();
    dummyItem.mappedBy = dto.mappedBy;
    dummyItem.customerPO = dto.customerPO;
    dummyItem.awaitingD365Creation = false;
    dummyItem.updatedBy = dto.mappedBy;

    const saved = await this.productRepository.save(dummyItem);

    this.logger.log(`✅ Mapped Dummy Item ${dto.dummyItemId} → D365 Item ${dto.d365ItemId}`);
    return saved;
  }

  /**
   * ดึงรายการ Dummy Items ที่รอ Mapping
   */
  async getPendingMappings(): Promise<Product[]> {
    return await this.productRepository.find({
      where: {
        productSource: 'PRICECAL',
        itemStatus: 'IN_USE',
        awaitingD365Creation: true,
        id: Like('FG-DUMMY-%'),
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }
}
