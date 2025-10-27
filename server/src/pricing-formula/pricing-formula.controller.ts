// path: server/src/pricing-formula/pricing-formula.controller.ts
// version: 1.0 (CRUD for Pricing Formulas)
// last-modified: 22 ตุลาคม 2568 18:20

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PricingFormulaService } from './pricing-formula.service';
import { PricingFormula } from '../entities/pricing-formula.entity';

@Controller('api/pricing-formulas')
@UseGuards(JwtAuthGuard)
export class PricingFormulaController {
  private readonly logger = new Logger(PricingFormulaController.name);

  constructor(private readonly pricingFormulaService: PricingFormulaService) {}

  /**
   * GET /api/pricing-formulas
   * ดึงรายการ Pricing Formulas ทั้งหมด
   */
  @Get()
  async findAll(
    @Query('customerGroupId') customerGroupId?: string,
    @Query('isActive') isActive?: string,
  ) {
    try {
      const filters: any = {};

      if (customerGroupId) {
        filters.customerGroupId = customerGroupId;
      }

      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }

      const formulas = await this.pricingFormulaService.findAll(filters);

      return {
        success: true,
        message: 'Pricing formulas retrieved successfully',
        data: formulas,
        count: formulas.length,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve pricing formulas: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve pricing formulas',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/pricing-formulas/default
   * ดึง Default Base Formula
   */
  @Get('default')
  async findDefault() {
    try {
      const formula = await this.pricingFormulaService.findDefault();

      if (!formula) {
        throw new HttpException(
          {
            success: false,
            message: 'No default formula found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Default formula retrieved successfully',
        data: formula,
      };
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }

      this.logger.error(`Failed to retrieve default formula: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve default formula',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/pricing-formulas/:id
   * ดึง Pricing Formula ตาม ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const formula = await this.pricingFormulaService.findOne(id);

      if (!formula) {
        throw new HttpException(
          {
            success: false,
            message: `Pricing formula ${id} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Pricing formula retrieved successfully',
        data: formula,
      };
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }

      this.logger.error(`Failed to retrieve pricing formula ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve pricing formula',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/pricing-formulas
   * สร้าง Pricing Formula ใหม่
   */
  @Post()
  async create(@Body() createDto: Partial<PricingFormula>) {
    try {
      const formula = await this.pricingFormulaService.create(createDto);

      return {
        success: true,
        message: 'Pricing formula created successfully',
        data: formula,
      };
    } catch (error) {
      this.logger.error(`Failed to create pricing formula: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create pricing formula',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PUT /api/pricing-formulas/:id
   * อัปเดต Pricing Formula
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<PricingFormula>) {
    try {
      const formula = await this.pricingFormulaService.update(id, updateDto);

      return {
        success: true,
        message: 'Pricing formula updated successfully',
        data: formula,
      };
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }

      this.logger.error(`Failed to update pricing formula ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update pricing formula',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * DELETE /api/pricing-formulas/:id
   * ลบ Pricing Formula (soft delete - set isActive = false)
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      await this.pricingFormulaService.delete(id);

      return {
        success: true,
        message: 'Pricing formula deleted successfully',
      };
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }

      this.logger.error(`Failed to delete pricing formula ${id}: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete pricing formula',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/pricing-formulas/test
   * ทดสอบสูตรด้วย sample variables
   */
  @Post('test')
  async testFormula(
    @Body() testDto: { formula: string; variables: Record<string, any> },
  ) {
    try {
      const result = await this.pricingFormulaService.testFormula(
        testDto.formula,
        testDto.variables,
      );

      return {
        success: true,
        message: 'Formula tested successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Formula test failed: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: 'Formula test failed',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
