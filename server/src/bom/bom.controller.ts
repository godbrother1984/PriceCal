// path: server/src/bom/bom.controller.ts
// version: 2.0 (Add JWT Authentication Guard)
// last-modified: 14 ตุลาคม 2568 15:40

import { Controller, Get, Post, Put, Delete, Param, Body, Logger, BadRequestException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BomService } from './bom.service';

@Controller('api/bom')
@UseGuards(JwtAuthGuard)
export class BomController {
  private readonly logger = new Logger(BomController.name);

  constructor(private readonly bomService: BomService) {}

  /**
   * Get all BOQ items for a product
   */
  @Get('product/:productId')
  async getBOMItems(@Param('productId') productId: string) {
    this.logger.log(`Getting BOQ items for product: ${productId}`);
    const items = await this.bomService.getBOMItems(productId);

    return {
      success: true,
      data: items,
    };
  }

  /**
   * Get BOQ summary for product
   */
  @Get('product/:productId/summary')
  async getBOMSummary(@Param('productId') productId: string) {
    this.logger.log(`Getting BOQ summary for product: ${productId}`);
    const summary = await this.bomService.getBOMSummary(productId);

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Check if product BOQ is editable
   */
  @Get('product/:productId/editable')
  async isBOMEditable(@Param('productId') productId: string) {
    const isEditable = await this.bomService.isBOMEditable(productId);

    return {
      success: true,
      data: { isEditable },
    };
  }

  /**
   * Get single BOQ item
   */
  @Get(':id')
  async getBOMItem(@Param('id') id: string) {
    this.logger.log(`Getting BOQ item: ${id}`);
    const item = await this.bomService.getBOMItem(id);

    return {
      success: true,
      data: item,
    };
  }

  /**
   * Create BOQ item
   */
  @Post()
  async createBOMItem(
    @Body()
    body: {
      productId: string;
      rawMaterialId: string;
      quantity: number;
      unit: string;
      notes?: string;
      createdBy?: string;
    },
  ) {
    this.logger.log(`Creating BOQ item for product: ${body.productId}`);

    if (!body.productId || !body.rawMaterialId || !body.quantity || !body.unit) {
      throw new BadRequestException('productId, rawMaterialId, quantity, and unit are required');
    }

    const item = await this.bomService.createBOMItem(body);

    return {
      success: true,
      message: 'BOQ item created successfully',
      data: item,
    };
  }

  /**
   * Update BOQ item (only if isEditable = true)
   */
  @Put(':id')
  async updateBOMItem(
    @Param('id') id: string,
    @Body()
    body: {
      quantity?: number;
      unit?: string;
      notes?: string;
      updatedBy?: string;
    },
  ) {
    this.logger.log(`Updating BOQ item: ${id}`);

    const item = await this.bomService.updateBOMItem(id, body);

    return {
      success: true,
      message: 'BOQ item updated successfully',
      data: item,
    };
  }

  /**
   * Delete BOQ item (only if isEditable = true)
   */
  @Delete(':id')
  async deleteBOMItem(@Param('id') id: string) {
    this.logger.log(`Deleting BOQ item: ${id}`);

    await this.bomService.deleteBOMItem(id);

    return {
      success: true,
      message: 'BOQ item deleted successfully',
    };
  }

  /**
   * Copy BOQ from one product to another
   */
  @Post('copy')
  async copyBOM(
    @Body()
    body: {
      sourceProductId: string;
      targetProductId: string;
      createdBy?: string;
    },
  ) {
    this.logger.log(`Copying BOQ from ${body.sourceProductId} to ${body.targetProductId}`);

    if (!body.sourceProductId || !body.targetProductId) {
      throw new BadRequestException('sourceProductId and targetProductId are required');
    }

    const items = await this.bomService.copyBOM(
      body.sourceProductId,
      body.targetProductId,
      body.createdBy,
    );

    return {
      success: true,
      message: `Copied ${items.length} BOQ items successfully`,
      data: items,
    };
  }
}
