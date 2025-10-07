// path: server/src/mongodb/mongodb.service.ts
// version: 1.0 (MongoDB Service for Data Import)
// last-modified: 1 ตุลาคม 2568 15:00

import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface MongoImportOptions {
  database?: string;
  collection: string;
  query?: any;
  limit?: number;
  skip?: number;
}

@Injectable()
export class MongodbService {
  private readonly logger = new Logger(MongodbService.name);

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * ดึงข้อมูลจาก MongoDB collection
   */
  async fetchData(options: MongoImportOptions): Promise<any[]> {
    try {
      const { collection, query = {}, limit = 1000, skip = 0 } = options;

      this.logger.log(`Fetching data from MongoDB collection: ${collection}`);

      // ใช้ native MongoDB driver จาก mongoose connection
      const db = this.connection.db;
      const coll = db.collection(collection);

      // Query data
      const data = await coll
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      this.logger.log(`Fetched ${data.length} records from ${collection}`);

      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch data from MongoDB: ${error.message}`);
      throw error;
    }
  }

  /**
   * นับจำนวน documents ใน collection
   */
  async countDocuments(collection: string, query: any = {}): Promise<number> {
    try {
      const db = this.connection.db;
      const coll = db.collection(collection);
      return await coll.countDocuments(query);
    } catch (error) {
      this.logger.error(`Failed to count documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * ทดสอบ connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const adminDb = this.connection.db.admin();
      await adminDb.ping();
      return true;
    } catch (error) {
      this.logger.error(`MongoDB connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * ดึงรายชื่อ collections ทั้งหมด
   */
  async listCollections(): Promise<string[]> {
    try {
      const collections = await this.connection.db.listCollections().toArray();
      return collections.map((c) => c.name);
    } catch (error) {
      this.logger.error(`Failed to list collections: ${error.message}`);
      throw error;
    }
  }

  /**
   * ดึง schema/sample ของ collection
   */
  async getSampleDocument(collection: string): Promise<any> {
    try {
      const db = this.connection.db;
      const coll = db.collection(collection);
      return await coll.findOne({});
    } catch (error) {
      this.logger.error(`Failed to get sample document: ${error.message}`);
      throw error;
    }
  }
}
