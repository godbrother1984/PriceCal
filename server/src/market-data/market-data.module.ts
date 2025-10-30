// path: server/src/market-data/market-data.module.ts
// version: 2.0
// last-modified: 28 ตุลาคม 2568 23:45

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { LMEPriceReferenceHistory } from '../entities/lme-price-reference-history.entity';
import { ExchangeRateReferenceHistory } from '../entities/exchange-rate-reference-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LMEPriceReferenceHistory,
      ExchangeRateReferenceHistory,
    ]),
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
