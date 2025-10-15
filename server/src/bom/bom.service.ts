// path: server/src/bom/bom.service.ts
// version: 1.0 (Hybrid BOQ Management with D365/PriceCal Source)
// last-modified: 9 ตุลาคม 2568 15:30

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BOM } from '../entities/bom.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';

@Injectable()
export class BomService {
  private readonly logger = new Logger(BomService.name);

  constructor(
    @InjectRepository(BOM)
    private bomRepository: Repository<BOM>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(RawMaterial)
    private rawMaterialRepository: Repository<RawMaterial>,
  ) {}

  /**
   * Get all BOQ items for a product
   */
  async getBOMItems(productId: string): Promise<BOM[]> {
    return await this.bomRepository.find({
      where: { productId, isActive: true },
      relations: ['rawMaterial'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get single BOQ item by ID
   */
  async getBOMItem(id: string): Promise<BOM> {
    const bomItem = await this.bomRepository.findOne({
      where: { id },
      relations: ['rawMaterial', 'product'],
    });

    if (!bomItem) {
      throw new NotFoundException(`BOQ item with ID ${id} not found`);
    }

    return bomItem;
  }

  /**
   * Create BOQ item (only for PRICECAL products or new items)
   */
  async createBOMItem(data: {
    productId: string;
    rawMaterialId: string;
    quantity: number;
    unit: string;
    notes?: string;
    createdBy?: string;
  }): Promise<BOM> {
    // Verify product exists
    const product = await this.productRepository.findOne({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    // Verify raw material exists
    const rawMaterial = await this.rawMaterialRepository.findOne({
      where: { id: data.rawMaterialId },
    });

    if (!rawMaterial) {
      throw new NotFoundException(`Raw Material with ID ${data.rawMaterialId} not found`);
    }

    // Check if BOQ item already exists
    const existing = await this.bomRepository.findOne({
      where: {
        productId: data.productId,
        rawMaterialId: data.rawMaterialId,
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `BOQ item already exists for Product ${data.productId} and Raw Material ${data.rawMaterialId}`,
      );
    }

    // Create new BOQ item
    const bomItem = this.bomRepository.create({
      productId: data.productId,
      rawMaterialId: data.rawMaterialId,
      quantity: data.quantity,
      unit: data.unit,
      notes: data.notes,
      bomSource: 'PRICECAL',  // ✅ สร้างใน PriceCal
      isEditable: true,       // ✅ แก้ไขได้
      isSyncedToD365: false,
      isActive: true,
      source: 'PRICECAL',
      createdBy: data.createdBy,
    });

    const saved = await this.bomRepository.save(bomItem);

    // Update product hasBOQ flag
    await this.productRepository.update(data.productId, { hasBOQ: true });

    this.logger.log(`Created BOQ item: Product ${data.productId} - RM ${data.rawMaterialId}`);

    return saved;
  }

  /**
   * Update BOQ item (only if isEditable = true)
   */
  async updateBOMItem(
    id: string,
    data: {
      quantity?: number;
      unit?: string;
      notes?: string;
      updatedBy?: string;
    },
  ): Promise<BOM> {
    const bomItem = await this.getBOMItem(id);

    // ✅ Check if editable
    if (!bomItem.isEditable) {
      throw new BadRequestException(
        `BOQ item from ${bomItem.bomSource} cannot be edited. Please edit at source system.`,
      );
    }

    // Update fields
    if (data.quantity !== undefined) bomItem.quantity = data.quantity;
    if (data.unit) bomItem.unit = data.unit;
    if (data.notes !== undefined) bomItem.notes = data.notes;
    if (data.updatedBy) bomItem.updatedBy = data.updatedBy;

    const updated = await this.bomRepository.save(bomItem);

    this.logger.log(`Updated BOQ item: ${id}`);

    return updated;
  }

  /**
   * Delete BOQ item (only if isEditable = true)
   */
  async deleteBOMItem(id: string): Promise<void> {
    const bomItem = await this.getBOMItem(id);

    // ✅ Check if editable
    if (!bomItem.isEditable) {
      throw new BadRequestException(
        `BOQ item from ${bomItem.bomSource} cannot be deleted. Please delete at source system.`,
      );
    }

    // Soft delete
    await this.bomRepository.update(id, { isActive: false });

    // Check if product still has BOQ
    const remainingBOQ = await this.bomRepository.count({
      where: { productId: bomItem.productId, isActive: true },
    });

    if (remainingBOQ === 0) {
      await this.productRepository.update(bomItem.productId, { hasBOQ: false });
    }

    this.logger.log(`Deleted BOQ item: ${id}`);
  }

  /**
   * Copy BOQ from one product to another
   */
  async copyBOM(sourceProductId: string, targetProductId: string, createdBy?: string): Promise<BOM[]> {
    // Verify source product
    const sourceProduct = await this.productRepository.findOne({
      where: { id: sourceProductId },
    });

    if (!sourceProduct) {
      throw new NotFoundException(`Source product with ID ${sourceProductId} not found`);
    }

    // Verify target product
    const targetProduct = await this.productRepository.findOne({
      where: { id: targetProductId },
    });

    if (!targetProduct) {
      throw new NotFoundException(`Target product with ID ${targetProductId} not found`);
    }

    // Get source BOQ
    const sourceBOQ = await this.getBOMItems(sourceProductId);

    if (sourceBOQ.length === 0) {
      throw new BadRequestException(`Source product ${sourceProductId} has no BOQ items`);
    }

    // Check if target already has BOQ
    const existingBOQ = await this.bomRepository.count({
      where: { productId: targetProductId, isActive: true },
    });

    if (existingBOQ > 0) {
      throw new BadRequestException(
        `Target product ${targetProductId} already has BOQ items. Please delete them first.`,
      );
    }

    // Copy BOQ items
    const copiedItems: BOM[] = [];

    for (const item of sourceBOQ) {
      const newItem = this.bomRepository.create({
        productId: targetProductId,
        rawMaterialId: item.rawMaterialId,
        quantity: item.quantity,
        unit: item.unit,
        notes: `Copied from ${sourceProductId}: ${item.notes || ''}`,
        bomSource: 'PRICECAL',  // ✅ เป็นของใหม่ แก้ไขได้
        isEditable: true,
        isSyncedToD365: false,
        isActive: true,
        source: 'PRICECAL',
        createdBy: createdBy,
      });

      const saved = await this.bomRepository.save(newItem);
      copiedItems.push(saved);
    }

    // Update target product
    await this.productRepository.update(targetProductId, { hasBOQ: true });

    this.logger.log(`Copied ${copiedItems.length} BOQ items from ${sourceProductId} to ${targetProductId}`);

    return copiedItems;
  }

  /**
   * Get BOQ summary for product
   */
  async getBOMSummary(productId: string): Promise<{
    totalItems: number;
    editableItems: number;
    readonlyItems: number;
    sources: { source: string; count: number }[];
  }> {
    const items = await this.getBOMItems(productId);

    const summary = {
      totalItems: items.length,
      editableItems: items.filter((i) => i.isEditable).length,
      readonlyItems: items.filter((i) => !i.isEditable).length,
      sources: [] as { source: string; count: number }[],
    };

    // Group by source
    const sourceMap = new Map<string, number>();
    items.forEach((item) => {
      const count = sourceMap.get(item.bomSource) || 0;
      sourceMap.set(item.bomSource, count + 1);
    });

    sourceMap.forEach((count, source) => {
      summary.sources.push({ source, count });
    });

    return summary;
  }

  /**
   * Check if product BOQ is editable
   */
  async isBOMEditable(productId: string): Promise<boolean> {
    const items = await this.getBOMItems(productId);
    return items.every((item) => item.isEditable);
  }
}
