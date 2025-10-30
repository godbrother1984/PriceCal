// path: server/src/market-data/market-data.service.ts
// version: 2.0
// last-modified: 28 ตุลาคม 2568 23:45

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import axios from 'axios';
import { LMEPriceReferenceHistory } from '../entities/lme-price-reference-history.entity';
import { ExchangeRateReferenceHistory } from '../entities/exchange-rate-reference-history.entity';

@Injectable()
export class MarketDataService {
  constructor(
    @InjectRepository(LMEPriceReferenceHistory)
    private readonly lmeHistoryRepository: Repository<LMEPriceReferenceHistory>,
    @InjectRepository(ExchangeRateReferenceHistory)
    private readonly exchangeRateHistoryRepository: Repository<ExchangeRateReferenceHistory>,
  ) {}

  /**
   * Fetch LME prices from external API
   * Note: This is a placeholder implementation
   * In production, replace with actual LME API or web scraping
   */
  async fetchLMEPrices() {
    try {
      // TODO: Replace with actual LME API endpoint
      // For now, return mock data structure
      // Real implementation would use:
      // - LME API (if available)
      // - Web scraping from LME website
      // - Third-party financial data provider (e.g., Bloomberg, Reuters)

      console.log('📊 Fetching LME prices (mock data)...');

      // Mock data structure - replace with actual API call
      const mockData = [
        {
          metal: 'Copper',
          price: 8450.50,
          unit: 'USD/tonne',
          change: 1.2,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          metal: 'Aluminium',
          price: 2320.75,
          unit: 'USD/tonne',
          change: -0.5,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          metal: 'Zinc',
          price: 2650.00,
          unit: 'USD/tonne',
          change: 0.8,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          metal: 'Nickel',
          price: 18500.00,
          unit: 'USD/tonne',
          change: 2.1,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          metal: 'Lead',
          price: 2100.00,
          unit: 'USD/tonne',
          change: -1.3,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          metal: 'Tin',
          price: 26800.00,
          unit: 'USD/tonne',
          change: 0.9,
          date: new Date().toLocaleDateString('th-TH'),
        },
      ];

      // บันทึกข้อมูลลงฐานข้อมูล
      await this.saveLMEPriceHistory(mockData);

      return mockData;

      // Example of real implementation (commented out):
      /*
      const response = await axios.get('https://api.lme.com/prices', {
        headers: {
          'Authorization': `Bearer ${process.env.LME_API_KEY}`,
        },
      });
      return response.data.map(item => ({
        metal: item.name,
        price: item.price,
        unit: item.unit,
        change: item.percentChange,
        date: item.date,
      }));
      */
    } catch (error) {
      console.error('❌ Error fetching LME prices:', error.message);
      throw new Error('Failed to fetch LME prices');
    }
  }

  /**
   * Fetch exchange rates from Bank of Thailand (BOT) API
   * BOT provides official exchange rates via their API
   */
  async fetchBOTExchangeRates() {
    try {
      // Bank of Thailand Exchange Rate API
      // Reference: https://www.bot.or.th/english/statistics/financialmarkets/exchangerate/_layouts/application/exchangerate/exchangerate.aspx

      console.log('💱 Fetching BOT exchange rates...');

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      // BOT API endpoint
      const url = `https://apigw1.bot.or.th/bot/public/Stat-ExchangeRate/v2/DAILY_AVG_EXG_RATE/?start_period=${dateStr}&end_period=${dateStr}`;

      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.data && response.data.result && response.data.result.data) {
          const rates = response.data.result.data.data_detail;

          // Filter สกุลเงินที่เราสนใจ
          const currencies = ['USD', 'EUR', 'JPY', 'CNY', 'SGD', 'GBP', 'AUD', 'CHF'];

          return rates
            .filter((rate: any) => currencies.includes(rate.currency_id))
            .map((rate: any) => ({
              currency: rate.currency_name_eng || rate.currency_id,
              buyingRate: parseFloat(rate.buying_sight || rate.buying_transfer || '0'),
              sellingRate: parseFloat(rate.selling || '0'),
              date: rate.period || dateStr,
            }));
        }
      } catch (apiError) {
        console.warn('⚠️  BOT API not available, using mock data:', apiError.message);
      }

      // Fallback to mock data if API fails
      console.log('📊 Using mock exchange rate data...');
      const mockData = [
        {
          currency: 'USD (US Dollar)',
          buyingRate: 35.20,
          sellingRate: 35.50,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          currency: 'EUR (Euro)',
          buyingRate: 38.50,
          sellingRate: 38.90,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          currency: 'JPY (Japanese Yen)',
          buyingRate: 0.23,
          sellingRate: 0.24,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          currency: 'CNY (Chinese Yuan)',
          buyingRate: 4.85,
          sellingRate: 4.95,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          currency: 'SGD (Singapore Dollar)',
          buyingRate: 26.10,
          sellingRate: 26.40,
          date: new Date().toLocaleDateString('th-TH'),
        },
        {
          currency: 'GBP (British Pound)',
          buyingRate: 44.50,
          sellingRate: 45.00,
          date: new Date().toLocaleDateString('th-TH'),
        },
      ];

      // บันทึกข้อมูลลงฐานข้อมูล
      await this.saveExchangeRateHistory(mockData);

      return mockData;
    } catch (error) {
      console.error('❌ Error fetching BOT exchange rates:', error.message);
      throw new Error('Failed to fetch exchange rates from BOT');
    }
  }

  /**
   * บันทึกประวัติราคา LME ลงฐานข้อมูล
   */
  private async saveLMEPriceHistory(data: any[]) {
    try {
      const historyRecords = data.map(item => {
        const record = new LMEPriceReferenceHistory();
        record.metal = item.metal;
        record.price = item.price;
        record.unit = item.unit;
        record.change = item.change;
        record.date = item.date;
        return record;
      });

      await this.lmeHistoryRepository.save(historyRecords);
      console.log(`✅ บันทึกประวัติ LME ${historyRecords.length} รายการสำเร็จ`);
    } catch (error) {
      console.error('❌ Error saving LME history:', error.message);
    }
  }

  /**
   * บันทึกประวัติอัตราแลกเปลี่ยนลงฐานข้อมูล
   */
  private async saveExchangeRateHistory(data: any[]) {
    try {
      const historyRecords = data.map(item => {
        const record = new ExchangeRateReferenceHistory();
        record.currency = item.currency;
        record.buyingRate = item.buyingRate;
        record.sellingRate = item.sellingRate;
        record.date = item.date;
        return record;
      });

      await this.exchangeRateHistoryRepository.save(historyRecords);
      console.log(`✅ บันทึกประวัติอัตราแลกเปลี่ยน ${historyRecords.length} รายการสำเร็จ`);
    } catch (error) {
      console.error('❌ Error saving exchange rate history:', error.message);
    }
  }

  /**
   * ดึงประวัติราคา LME ตามช่วงเวลา
   */
  async getLMEPriceHistory(metal?: string, startDate?: Date, endDate?: Date) {
    try {
      const queryBuilder = this.lmeHistoryRepository
        .createQueryBuilder('history')
        .orderBy('history.fetchedAt', 'DESC');

      if (metal) {
        queryBuilder.andWhere('history.metal = :metal', { metal });
      }

      if (startDate && endDate) {
        queryBuilder.andWhere('history.fetchedAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      const records = await queryBuilder.getMany();
      return records;
    } catch (error) {
      console.error('❌ Error fetching LME history:', error.message);
      throw new Error('Failed to fetch LME price history');
    }
  }

  /**
   * ดึงประวัติอัตราแลกเปลี่ยนตามช่วงเวลา
   */
  async getExchangeRateHistory(currency?: string, startDate?: Date, endDate?: Date) {
    try {
      const queryBuilder = this.exchangeRateHistoryRepository
        .createQueryBuilder('history')
        .orderBy('history.fetchedAt', 'DESC');

      if (currency) {
        queryBuilder.andWhere('history.currency = :currency', { currency });
      }

      if (startDate && endDate) {
        queryBuilder.andWhere('history.fetchedAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      const records = await queryBuilder.getMany();
      return records;
    } catch (error) {
      console.error('❌ Error fetching exchange rate history:', error.message);
      throw new Error('Failed to fetch exchange rate history');
    }
  }
}
