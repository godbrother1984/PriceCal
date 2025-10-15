// path: server/src/mongodb/master-data-mongo.service.ts
// version: 1.0 (MongoDB Master Data Service)
// last-modified: 7 ตุลาคม 2568 17:50

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StandardPrice,
  StandardPriceDocument,
  LmeMasterData,
  LmeMasterDataDocument,
  FabCost,
  FabCostDocument,
  SellingFactor,
  SellingFactorDocument,
  ExchangeRateMasterData,
  ExchangeRateMasterDataDocument,
} from './schemas/master-data.schema';

@Injectable()
export class MasterDataMongoService {
  private readonly logger = new Logger(MasterDataMongoService.name);

  constructor(
    @InjectModel(StandardPrice.name)
    private standardPriceModel: Model<StandardPriceDocument>,

    @InjectModel(LmeMasterData.name)
    private lmeMasterDataModel: Model<LmeMasterDataDocument>,

    @InjectModel(FabCost.name)
    private fabCostModel: Model<FabCostDocument>,

    @InjectModel(SellingFactor.name)
    private sellingFactorModel: Model<SellingFactorDocument>,

    @InjectModel(ExchangeRateMasterData.name)
    private exchangeRateModel: Model<ExchangeRateMasterDataDocument>,
  ) {}

  /**
   * ดึง Standard Price จาก MongoDB
   */
  async getStandardPrice(rawMaterialId: string): Promise<number | null> {
    try {
      const pricing = await this.standardPriceModel
        .findOne({
          rawMaterialId,
          isActive: true,
          status: 'Active',
        })
        .sort({ version: -1 })
        .exec();

      return pricing ? pricing.price : null;
    } catch (error) {
      this.logger.error(`Failed to get standard price: ${error.message}`);
      return null;
    }
  }

  /**
   * ดึง LME Price จาก MongoDB
   */
  async getLmePrice(
    itemGroupCode?: string,
    customerGroupId?: string,
  ): Promise<number | null> {
    try {
      const query: any = {
        isActive: true,
        status: 'Active',
      };

      if (itemGroupCode) {
        query.itemGroupCode = itemGroupCode;
      }

      if (customerGroupId) {
        query.customerGroupId = customerGroupId;
      }

      const pricing = await this.lmeMasterDataModel
        .findOne(query)
        .sort({ version: -1 })
        .exec();

      return pricing ? pricing.price : null;
    } catch (error) {
      this.logger.error(`Failed to get LME price: ${error.message}`);
      return null;
    }
  }

  /**
   * ดึง FAB Cost จาก MongoDB
   */
  async getFabCost(customerGroupId?: string): Promise<number> {
    try {
      const query: any = {
        isActive: true,
        status: 'Active',
      };

      if (customerGroupId) {
        query.customerGroupId = customerGroupId;
      }

      const pricing = await this.fabCostModel
        .findOne(query)
        .sort({ version: -1 })
        .exec();

      return pricing ? pricing.costPerHour : 0;
    } catch (error) {
      this.logger.error(`Failed to get FAB cost: ${error.message}`);
      return 0;
    }
  }

  /**
   * ดึง Selling Factor จาก MongoDB
   */
  async getSellingFactor(customerGroupId?: string): Promise<number> {
    try {
      const query: any = {
        isActive: true,
        status: 'Active',
      };

      if (customerGroupId) {
        query.customerGroupId = customerGroupId;
      }

      const pricing = await this.sellingFactorModel
        .findOne(query)
        .sort({ version: -1 })
        .exec();

      // Default = 1.25 (25% markup)
      return pricing ? pricing.factor : 1.25;
    } catch (error) {
      this.logger.error(`Failed to get selling factor: ${error.message}`);
      return 1.25;
    }
  }

  /**
   * ดึง Exchange Rate จาก MongoDB
   */
  async getExchangeRate(
    sourceCurrency: string = 'USD',
    destinationCurrency: string = 'THB',
    customerGroupId?: string,
  ): Promise<number> {
    try {
      const query: any = {
        sourceCurrencyCode: sourceCurrency,
        destinationCurrencyCode: destinationCurrency,
        isActive: true,
        status: 'Active',
      };

      if (customerGroupId) {
        query.customerGroupId = customerGroupId;
      }

      const pricing = await this.exchangeRateModel
        .findOne(query)
        .sort({ version: -1 })
        .exec();

      // Default = 35 THB/USD
      return pricing ? pricing.rate : 35.0;
    } catch (error) {
      this.logger.error(`Failed to get exchange rate: ${error.message}`);
      return 35.0;
    }
  }

  /**
   * ดึง Master Data Versions สำหรับ snapshot
   */
  async getMasterDataVersions(customerGroupId?: string): Promise<any> {
    const versions: any = {};

    try {
      // Standard Price Version
      const standardPrice = await this.standardPriceModel
        .findOne({ isActive: true, status: 'Active' })
        .sort({ version: -1 })
        .exec();
      if (standardPrice) versions.standardPriceVersion = standardPrice.version;

      // Exchange Rate Version
      const exchangeRate = await this.exchangeRateModel
        .findOne({
          sourceCurrencyCode: 'USD',
          destinationCurrencyCode: 'THB',
          isActive: true,
          status: 'Active',
        })
        .sort({ version: -1 })
        .exec();
      if (exchangeRate) versions.exchangeRateVersion = exchangeRate.version;

      // LME Price Version
      const lmePrice = await this.lmeMasterDataModel
        .findOne({ isActive: true, status: 'Active' })
        .sort({ version: -1 })
        .exec();
      if (lmePrice) versions.lmePriceVersion = lmePrice.version;

      // FAB Cost Version
      const fabCost = await this.fabCostModel
        .findOne({ isActive: true, status: 'Active' })
        .sort({ version: -1 })
        .exec();
      if (fabCost) versions.fabCostVersion = fabCost.version;

      // Selling Factor Version
      const sellingFactor = await this.sellingFactorModel
        .findOne({ isActive: true, status: 'Active' })
        .sort({ version: -1 })
        .exec();
      if (sellingFactor) versions.sellingFactorVersion = sellingFactor.version;

      return versions;
    } catch (error) {
      this.logger.error(`Failed to get master data versions: ${error.message}`);
      return versions;
    }
  }

  /**
   * สร้าง Standard Price ใหม่
   */
  async createStandardPrice(data: Partial<StandardPrice>): Promise<StandardPriceDocument> {
    const standardPrice = new this.standardPriceModel({
      ...data,
      version: 1,
      status: 'Draft',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return standardPrice.save();
  }

  /**
   * อนุมัติ Master Data
   */
  async approveMasterData(
    model: Model<any>,
    id: string,
    approvedBy: string,
  ): Promise<any> {
    return model.findByIdAndUpdate(
      id,
      {
        status: 'Active',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    ).exec();
  }
}
