// path: server/src/market-data/market-data.controller.ts
// version: 2.0
// last-modified: 28 ตุลาคม 2568 23:45

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/market-data')
@UseGuards(JwtAuthGuard)
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('lme-reference')
  async getLMEReference() {
    try {
      const data = await this.marketDataService.fetchLMEPrices();
      return {
        success: true,
        message: 'ดึงข้อมูล LME reference สำเร็จ',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล LME: ' + error.message,
        data: [],
      };
    }
  }

  @Get('exchange-rate-reference')
  async getExchangeRateReference() {
    try {
      const data = await this.marketDataService.fetchBOTExchangeRates();
      return {
        success: true,
        message: 'ดึงข้อมูลอัตราแลกเปลี่ยนจาก BOT สำเร็จ',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอัตราแลกเปลี่ยน: ' + error.message,
        data: [],
      };
    }
  }

  @Get('lme-reference/history')
  async getLMEHistory(
    @Query('metal') metal?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const data = await this.marketDataService.getLMEPriceHistory(metal, start, end);
      return {
        success: true,
        message: 'ดึงประวัติราคา LME สำเร็จ',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงประวัติราคา LME: ' + error.message,
        data: [],
      };
    }
  }

  @Get('exchange-rate-reference/history')
  async getExchangeRateHistory(
    @Query('currency') currency?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const data = await this.marketDataService.getExchangeRateHistory(currency, start, end);
      return {
        success: true,
        message: 'ดึงประวัติอัตราแลกเปลี่ยนสำเร็จ',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงประวัติอัตราแลกเปลี่ยน: ' + error.message,
        data: [],
      };
    }
  }
}
