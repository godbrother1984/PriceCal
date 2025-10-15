// path: server/src/mongodb/mongodb.module.ts
// version: 3.0 (Add Master Data Schemas)
// last-modified: 7 ตุลาคม 2568 17:55

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongodbService } from './mongodb.service';
import { MasterDataMongoService } from './master-data-mongo.service';
import { SystemConfig } from '../entities/system-config.entity';
import { ConfigModule } from '@nestjs/config';
import {
  StandardPrice,
  StandardPriceSchema,
  LmeMasterData,
  LmeMasterDataSchema,
  FabCost,
  FabCostSchema,
  SellingFactor,
  SellingFactorSchema,
  ExchangeRateMasterData,
  ExchangeRateMasterDataSchema,
} from './schemas/master-data.schema';

// Check if MongoDB should be enabled
const ENABLE_MONGODB = process.env.ENABLE_MONGODB === 'true';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SystemConfig]),
    // Only import MongooseModule if explicitly enabled via environment variable
    ...(ENABLE_MONGODB ? [
      MongooseModule.forRootAsync({
        imports: [TypeOrmModule.forFeature([SystemConfig])],
        inject: [],
        useFactory: async () => {
          // Build MongoDB URI with authentication support
          const host = process.env.MONGODB_HOST || 'localhost';
          const port = process.env.MONGODB_PORT || '27017';
          const database = process.env.MONGODB_DATABASE || 'pricecal';
          const username = process.env.MONGODB_USERNAME || '';
          const password = process.env.MONGODB_PASSWORD || '';

          let uri: string;
          if (username && password) {
            // With authentication
            uri = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=admin`;
          } else {
            // Without authentication
            uri = `mongodb://${host}:${port}/${database}`;
          }

          // Allow override with full URI from env
          if (process.env.MONGODB_URI) {
            uri = process.env.MONGODB_URI;
          }

          console.log(`🔌 Connecting to MongoDB: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

          return {
            uri,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 5000,
            connectionFactory: (connection) => {
              connection.on('connected', () => {
                console.log('✅ MongoDB connected successfully');
              });
              connection.on('error', (error) => {
                console.warn('⚠️ MongoDB connection error:', error.message);
              });
              connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
              });
              return connection;
            },
          };
        },
      }),
      MongooseModule.forFeature([
        { name: StandardPrice.name, schema: StandardPriceSchema },
        { name: LmeMasterData.name, schema: LmeMasterDataSchema },
        { name: FabCost.name, schema: FabCostSchema },
        { name: SellingFactor.name, schema: SellingFactorSchema },
        { name: ExchangeRateMasterData.name, schema: ExchangeRateMasterDataSchema },
      ]),
    ] : []),
  ],
  providers: ENABLE_MONGODB ? [MongodbService, MasterDataMongoService] : [],
  exports: ENABLE_MONGODB ? [MongodbService, MasterDataMongoService] : [],
})
export class MongodbModule {}
