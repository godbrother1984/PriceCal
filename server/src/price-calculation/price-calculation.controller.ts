// path: server/src/price-calculation/price-calculation.controller.ts
// version: 2.0 (Add JWT Authentication Guard)
// last-modified: 14 ตุลาคม 2568 15:40

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
}
