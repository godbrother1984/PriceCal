import { Controller, Post, Body } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  calculatePrice(@Body() data: any) {
    return this.pricingService.calculatePrice(data);
  }
}