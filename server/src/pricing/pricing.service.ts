// path: server/src/pricing/pricing.service.ts
// version: 2.0 (Database-based Pricing Calculation)
// last-modified: 23 กันยายน 2568 13:20

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
    console.log('[Pricing Service] Calculating price with real data:', data);

    try {
      // คำนวณราคาฐานจาก BOQ Items และ Standard Prices จริง
      let basePrice = 0;
      let boqCalculations = [];

      if (data.boqItems && data.boqItems.length > 0 && data.standardPrices && data.standardPrices.length > 0) {
        // คำนวณราคาตาม BOQ Items จริง
        for (const boqItem of data.boqItems) {
          const standardPrice = data.standardPrices.find((sp: any) =>
            sp.rmId === boqItem.rmId || sp.rawMaterialId === boqItem.rmId
          );

          if (standardPrice) {
            const itemCost = boqItem.quantity * (standardPrice.price || 0);
            basePrice += itemCost;
            boqCalculations.push({
              rmName: boqItem.rmName,
              quantity: boqItem.quantity,
              unitPrice: standardPrice.price,
              totalCost: itemCost.toFixed(2)
            });
          } else {
            // ถ้าไม่พบราคามาตรฐาน ใช้ราคาเฉลี่ย 100 THB/unit
            const defaultPrice = 100;
            const itemCost = boqItem.quantity * defaultPrice;
            basePrice += itemCost;
            boqCalculations.push({
              rmName: boqItem.rmName,
              quantity: boqItem.quantity,
              unitPrice: defaultPrice,
              totalCost: itemCost.toFixed(2),
              note: 'Default price used (no standard price found)'
            });
          }
        }
      } else {
        // ถ้าไม่มี BOQ หรือ Standard Prices ใช้ราคาฐาน 800
        basePrice = 800;
      }

      // ปรับราคาตาม Customer Group จริง
      let customerMultiplier = 1.0;
      if (data.customerGroup) {
        if (data.customerGroup.type === 'Export') {
          customerMultiplier = 1.15; // +15% สำหรับ Export
        } else if (data.customerGroup.type === 'Domestic') {
          customerMultiplier = 1.0; // ราคาปกติสำหรับ Domestic
        }
      }
      basePrice *= customerMultiplier;

      // ใช้ Selling Factor จริงจากข้อมูล
      let sellingFactor = 1.25; // Default 25% markup
      if (data.sellingFactors && data.sellingFactors.length > 0) {
        // ใช้ selling factor แรกที่พบ
        const factor = data.sellingFactors[0];
        sellingFactor = factor.factor || factor.sellingFactor || 1.25;
      }

      // คำนวณราคาสุดท้าย
      const finalPrice = basePrice * sellingFactor;

      // หา Currency จาก Exchange Rates หรือใช้ THB เป็นค่าเริ่มต้น
      let currency = 'THB';
      if (data.exchangeRates && data.exchangeRates.length > 0) {
        currency = data.exchangeRates[0].sourceCurrencyCode ||
                  data.exchangeRates[0].destinationCurrencyCode || 'THB';
      }

      return {
        success: true,
        message: 'Price calculated successfully using real data.',
        calculation: {
          basePrice: basePrice.toFixed(2),
          sellingFactor: sellingFactor,
          finalPrice: finalPrice.toFixed(2),
          currency: currency,
          customerMultiplier: customerMultiplier,
          boqCalculations: boqCalculations
        },
        metadata: {
          standardPricesUsed: data.standardPrices?.length || 0,
          sellingFactorsUsed: data.sellingFactors?.length || 0,
          exchangeRatesUsed: data.exchangeRates?.length || 0,
          customerGroup: data.customerGroup?.name || 'None',
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