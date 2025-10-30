// path: server/src/mongodb/schemas/master-data.schema.ts
// version: 2.0 (Change Selling Factor to tubeSize)
// last-modified: 29 ตุลาคม 2568 23:40

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Base class สำหรับ Master Data
export class MasterDataBase {
  @Prop({ required: true })
  version: number;

  @Prop({ required: true, default: 'Draft' })
  status: string; // Draft, Active, Superseded

  @Prop()
  approvedBy?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  effectiveFrom?: Date;

  @Prop()
  effectiveTo?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  changeReason?: string;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

// Standard Price
@Schema({ collection: 'standard_prices' })
export class StandardPrice extends MasterDataBase {
  @Prop({ required: true })
  rawMaterialId: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  rawMaterialName?: string; // Denormalized for query performance
}

export type StandardPriceDocument = StandardPrice & Document;
export const StandardPriceSchema = SchemaFactory.createForClass(StandardPrice);

// LME Master Data
@Schema({ collection: 'lme_master_data' })
export class LmeMasterData extends MasterDataBase {
  @Prop({ required: true })
  itemGroupName: string;

  @Prop({ required: true })
  itemGroupCode: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  customerGroupId?: string;

  @Prop()
  description?: string;
}

export type LmeMasterDataDocument = LmeMasterData & Document;
export const LmeMasterDataSchema = SchemaFactory.createForClass(LmeMasterData);

// FAB Cost
@Schema({ collection: 'fab_costs' })
export class FabCost extends MasterDataBase {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  costPerHour: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  description?: string;

  @Prop()
  customerGroupId?: string;
}

export type FabCostDocument = FabCost & Document;
export const FabCostSchema = SchemaFactory.createForClass(FabCost);

// Selling Factor
// v2.0: ใช้ tubeSize แทน patternName/patternCode
@Schema({ collection: 'selling_factors' })
export class SellingFactor extends MasterDataBase {
  @Prop({ required: true })
  tubeSize: string; // Tube Size from Product (FG)

  @Prop({ required: true, type: Number })
  factor: number;

  @Prop()
  customerGroupId?: string;

  @Prop()
  description?: string;
}

export type SellingFactorDocument = SellingFactor & Document;
export const SellingFactorSchema = SchemaFactory.createForClass(SellingFactor);

// Exchange Rate Master Data
@Schema({ collection: 'exchange_rate_master_data' })
export class ExchangeRateMasterData extends MasterDataBase {
  @Prop({ required: true })
  sourceCurrencyCode: string;

  @Prop({ required: true })
  sourceCurrencyName: string;

  @Prop({ required: true })
  destinationCurrencyCode: string;

  @Prop({ required: true })
  destinationCurrencyName: string;

  @Prop({ required: true, type: Number })
  rate: number;

  @Prop()
  customerGroupId?: string;

  @Prop()
  description?: string;
}

export type ExchangeRateMasterDataDocument = ExchangeRateMasterData & Document;
export const ExchangeRateMasterDataSchema = SchemaFactory.createForClass(ExchangeRateMasterData);

// Create indexes for better query performance
StandardPriceSchema.index({ rawMaterialId: 1, isActive: 1, status: 1 });
StandardPriceSchema.index({ version: -1 });

LmeMasterDataSchema.index({ itemGroupCode: 1, isActive: 1, status: 1 });
LmeMasterDataSchema.index({ customerGroupId: 1, isActive: 1 });
LmeMasterDataSchema.index({ version: -1 });

FabCostSchema.index({ isActive: 1, status: 1 });
FabCostSchema.index({ customerGroupId: 1, isActive: 1 });
FabCostSchema.index({ version: -1 });

SellingFactorSchema.index({ customerGroupId: 1, isActive: 1, status: 1 });
SellingFactorSchema.index({ version: -1 });

ExchangeRateMasterDataSchema.index({ sourceCurrencyCode: 1, destinationCurrencyCode: 1, isActive: 1, status: 1 });
ExchangeRateMasterDataSchema.index({ customerGroupId: 1, isActive: 1 });
ExchangeRateMasterDataSchema.index({ version: -1 });
