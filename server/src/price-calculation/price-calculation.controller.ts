// path: server/src/price-calculation/price-calculation.controller.ts
// version: 3.0 (Add Hybrid Formula System Endpoint)
// last-modified: 22 ตุลาคม 2568 18:10

import { Controller, Post, Body, Logger, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PriceCalculationService, CalculationInput } from './price-calculation.service';

@Controller('api/price-calculation')
@UseGuards(JwtAuthGuard)
export class PriceCalculationController {
  private readonly logger = new Logger(PriceCalculationController.name);

  constructor(private readonly priceCalculationService: PriceCalculationService) {}

  /**
   * POST /api/price-calculation/calculate
   * คำนวณราคาจาก Product ID และ Quantity
   */
  @Post('calculate')
  async calculatePrice(@Body() input: CalculationInput) {
    try {
      this.logger.log(`Received price calculation request for product ${input.productId}`);

      const result = await this.priceCalculationService.calculatePrice(input);

      return {
        success: true,
        message: 'Price calculated successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Price calculation failed: ${error.message}`, error.stack);

      if (error.status === 404) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to calculate price',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/price-calculation/calculate-hybrid
   * คำนวณราคาด้วย Hybrid Formula System (Base Formula + Custom Rules)
   *
   * ✨ NEW: ใช้ระบบสูตรที่ปรับแต่งได้ แทนที่จะ hardcode
   */
  @Post('calculate-hybrid')
  async calculatePriceWithHybridSystem(@Body() input: CalculationInput) {
    try {
      this.logger.log(`🎯 Received Hybrid price calculation request for product ${input.productId}`);

      const result = await this.priceCalculationService.calculatePriceWithHybridSystem(input);

      return {
        success: true,
        message: 'Price calculated successfully with Hybrid Formula System',
        data: result,
        appliedRulesCount: result.appliedRules?.length || 0,
      };
    } catch (error) {
      this.logger.error(`Hybrid price calculation failed: ${error.message}`, error.stack);

      if (error.status === 404) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to calculate price with Hybrid System',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
