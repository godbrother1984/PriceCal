// path: server/src/dummy-items/dummy-items.controller.ts
// version: 1.0 (Dummy Items API Controller)
// last-modified: 14 ตุลาคม 2568 19:42

import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DummyItemsService } from './dummy-items.service';

@Controller('api/dummy-items')
@UseGuards(JwtAuthGuard)
export class DummyItemsController {
  constructor(private readonly dummyItemsService: DummyItemsService) {}

  /**
   * GET /api/dummy-items/available
   * ดึงรายการ Dummy Items ที่พร้อมใช้งาน
   */
  @Get('available')
  async getAvailableDummyItems() {
    try {
      const items = await this.dummyItemsService.getAvailableDummyItems(50);
      const count = await this.dummyItemsService.getAvailableDummyItemsCount();

      return {
        success: true,
        message: 'Available Dummy Items retrieved successfully',
        data: {
          items,
          totalAvailable: count,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * POST /api/dummy-items/generate
   * สร้าง Dummy Items ใหม่ (Manual trigger)
   */
  @Post('generate')
  async generateDummyItems(@Body() body: { count: number }) {
    try {
      const count = body.count || 10;
      const items = await this.dummyItemsService.generateDummyItems(count);

      return {
        success: true,
        message: `Generated ${items.length} Dummy Items`,
        data: items,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * POST /api/dummy-items/map-to-d365
   * Manual Mapping: Dummy Item → D365 Item
   */
  @Post('map-to-d365')
  async mapDummyToD365(@Body() body: any, @Request() req) {
    try {
      const username = req.user?.username || 'Unknown';
      const mappedItem = await this.dummyItemsService.mapDummyToD365({
        dummyItemId: body.dummyItemId,
        d365ItemId: body.d365ItemId,
        customerPO: body.customerPO,
        notes: body.notes,
        mappedBy: username,
      });

      return {
        success: true,
        message: 'Dummy Item mapped to D365 successfully',
        data: mappedItem,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * GET /api/dummy-items/pending-mappings
   * ดึงรายการ Dummy Items ที่รอ Mapping
   */
  @Get('pending-mappings')
  async getPendingMappings() {
    try {
      const items = await this.dummyItemsService.getPendingMappings();

      return {
        success: true,
        message: 'Pending mappings retrieved successfully',
        data: items,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  /**
   * POST /api/dummy-items/check-availability
   * ตรวจสอบและสร้าง Dummy Items (Manual trigger for Cron Job)
   */
  @Post('check-availability')
  async checkAvailability() {
    try {
      await this.dummyItemsService.ensureDummyItemsAvailable();

      return {
        success: true,
        message: 'Dummy Items availability checked and updated',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}
