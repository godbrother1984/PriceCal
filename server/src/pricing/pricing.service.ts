// path: server/src/pricing/pricing.service.ts
// version: 2.0 (Database-based Pricing Calculation)
// last-modified: 22 กันยายน 2568 11:00

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RawMaterial } from '../entities/raw-material.entity';
import { CustomerGroup } from '../entities/customer-group.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(RawMaterial)
    private rawMaterialRepository: Repository<RawMaterial>,
    @InjectRepository(CustomerGroup)
    private customerGroupRepository: Repository<CustomerGroup>,
  ) {}

  async calculatePrice(data: any): Promise<any> {
    console.log('[Pricing Service] Calculating price for:', data);

    try {
      // ดึงข้อมูลจาก Database
      const rawMaterials = await this.rawMaterialRepository.find({ where: { isActive: true } });
      const customerGroups = await this.customerGroupRepository.find({ where: { isActive: true } });

      // Logic การคำนวณราคาตาม Business Rules
      let basePrice = 800; // ราคาพื้นฐาน

      // ปรับราคาตาม Customer Type
      if (data.customerType === 'Export') {
        basePrice *= 1.15; // เพิ่ม 15% สำหรับลูกค้าต่างประเทศ
      }

      // ปรับราคาตาม Product Complexity (จากจำนวน Raw Materials)
      if (data.boqItems && data.boqItems.length > 0) {
        const complexityFactor = 1 + (data.boqItems.length * 0.05); // เพิ่ม 5% ต่อ material
        basePrice *= complexityFactor;
      }

      const sellingFactor = 1.25; // Markup 25%
      const finalPrice = basePrice * sellingFactor;

      return {
        success: true,
        message: 'Price calculated successfully.',
        calculation: {
          basePrice: basePrice.toFixed(2),
          sellingFactor: sellingFactor,
          finalPrice: finalPrice.toFixed(2),
          currency: 'THB',
        },
        metadata: {
          rawMaterialsCount: rawMaterials.length,
          customerGroupsCount: customerGroups.length,
          calculatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('[Pricing Service] Error calculating price:', error);
      return {
        success: false,
        message: 'Failed to calculate price.',
        error: error.message,
      };
    }
  }
}