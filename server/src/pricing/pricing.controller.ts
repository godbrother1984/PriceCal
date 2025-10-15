// path: server/src/pricing/pricing.controller.ts
// version: 2.0 (Add JWT Authentication Guard)
// last-modified: 14 ตุลาคม 2568 15:45

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  calculatePrice(@Body() data: any) {
    return this.pricingService.calculatePrice(data);
  }
}