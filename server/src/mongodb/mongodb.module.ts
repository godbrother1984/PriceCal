// path: server/src/mongodb/mongodb.module.ts
// version: 2.0 (Add Authentication Support)
// last-modified: 1 ตุลาคม 2568 15:30

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongodbService } from './mongodb.service';
import { SystemConfig } from '../entities/system-config.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SystemConfig]),
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
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully');
            });
            connection.on('error', (error) => {
              console.error('❌ MongoDB connection error:', error);
            });
            connection.on('disconnected', () => {
              console.log('⚠️ MongoDB disconnected');
            });
            return connection;
          },
        };
      },
    }),
  ],
  providers: [MongodbService],
  exports: [MongodbService],
})
export class MongodbModule {}
