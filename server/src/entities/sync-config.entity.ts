// path: server/src/entities/sync-config.entity.ts
// version: 1.0 (Sync Configuration with Toggle)
// last-modified: 9 ตุลาคม 2568 10:15

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type EntityType =
  | 'CUSTOMER'
  | 'PRODUCT'
  | 'RAW_MATERIAL'
  | 'BOM'
  | 'STANDARD_PRICE'
  | 'LME_PRICE'
  | 'EXCHANGE_RATE'
  | 'FAB_COST'
  | 'SELLING_FACTOR';

export type DataSource = 'MONGODB' | 'API' | 'MANUAL';

export type SyncFrequency = 'MANUAL' | 'DAILY' | 'HOURLY' | 'REAL_TIME';

@Entity('sync_config')
export class SyncConfig {
  @PrimaryColumn()
  entityType: EntityType;

  @Column({ default: true })
  isEnabled: boolean; // Toggle เปิด/ปิด sync

  @Column({ default: 'MONGODB' })
  dataSource: DataSource; // แหล่งข้อมูล

  @Column({ nullable: true })
  mongoCollection: string; // ชื่อ collection ใน MongoDB

  @Column({ nullable: true })
  apiEndpoint: string; // API endpoint (ถ้าใช้ API)

  @Column({ type: 'text', nullable: true })
  mongoQuery: string; // JSON string ของ query conditions

  @Column({ default: 'MANUAL' })
  syncFrequency: SyncFrequency; // ความถี่ในการ sync

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date; // ครั้งสุดท้ายที่ sync

  @Column({ nullable: true })
  lastSyncStatus: string; // success, failed, partial

  @Column({ type: 'text', nullable: true })
  lastSyncMessage: string; // ข้อความผลลัพธ์

  @Column({ type: 'int', default: 0 })
  lastSyncRecords: number; // จำนวน records ที่ sync

  @Column({ default: true })
  upsertEnabled: boolean; // เปิดใช้งาน upsert (insert/update)

  @Column({ default: false })
  deleteEnabled: boolean; // เปิดใช้งาน delete records ที่ไม่มีใน source

  @Column({ type: 'text', nullable: true })
  fieldMapping: string; // JSON string ของการ map fields

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
