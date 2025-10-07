// path: server/src/entities/api-setting.entity.ts
// version: 3.0 (Add MongoDB Support)
// last-modified: 1 ตุลาคม 2568 15:15

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ApiType = 'RAW_MATERIALS' | 'FINISHED_GOODS' | 'EMPLOYEES' | 'CUSTOMERS';

@Entity('api_settings')
export class ApiSetting {
  @PrimaryColumn()
  apiType: ApiType; // Primary key: RAW_MATERIALS, FINISHED_GOODS, etc.

  @Column()
  name: string; // ชื่อแสดง เช่น "Raw Materials API"

  @Column({ type: 'text' })
  url: string; // URL ของ API endpoint

  @Column({ type: 'text', nullable: true })
  description: string; // คำอธิบาย

  @Column({ type: 'text', nullable: true })
  authType: string; // 'none', 'bearer', 'basic', 'api-key'

  @Column({ type: 'text', nullable: true })
  authToken: string; // Bearer token หรือ API key

  @Column({ type: 'text', nullable: true })
  authUsername: string; // สำหรับ Basic Auth

  @Column({ type: 'text', nullable: true })
  authPassword: string; // สำหรับ Basic Auth (ควร encrypt)

  @Column({ type: 'simple-json', nullable: true })
  headers: Record<string, string>; // Custom headers

  @Column({ type: 'simple-json', nullable: true })
  queryParams: Record<string, string>; // Query parameters

  @Column({ type: 'text', nullable: true })
  httpMethod: string; // 'GET' (default) หรือ 'POST'

  @Column({ type: 'text', nullable: true })
  requestBody: string; // JSON string ของ request body สำหรับ POST

  // Pagination settings
  @Column({ default: false })
  supportsPagination: boolean; // API รองรับ pagination หรือไม่

  @Column({ type: 'text', nullable: true })
  paginationType: string; // 'offset', 'page', 'cursor', 'none'

  @Column({ type: 'int', nullable: true, default: 100 })
  pageSize: number; // จำนวน records ต่อหน้า

  @Column({ type: 'text', nullable: true })
  pageSizeParam: string; // ชื่อ parameter สำหรับ page size เช่น 'limit', 'pageSize'

  @Column({ type: 'text', nullable: true })
  pageNumberParam: string; // สำหรับ page-based: 'page', 'pageNumber'

  @Column({ type: 'text', nullable: true })
  offsetParam: string; // สำหรับ offset-based: 'offset', 'skip'

  @Column({ type: 'text', nullable: true })
  cursorParam: string; // สำหรับ cursor-based: 'cursor', 'nextToken'

  @Column({ type: 'text', nullable: true })
  totalCountPath: string; // JSON path สำหรับหา total count เช่น 'data.totalCount'

  @Column({ type: 'text', nullable: true })
  dataPath: string; // JSON path สำหรับหาข้อมูล เช่น 'data.items', 'parmInventTableRMInfoList'

  @Column({ type: 'text', nullable: true })
  nextCursorPath: string; // JSON path สำหรับหา next cursor

  @Column({ type: 'int', nullable: true })
  maxRecords: number; // จำกัดจำนวน records สูงสุดที่ import (null = ไม่จำกัด)

  // MongoDB settings
  @Column({ type: 'text', nullable: true, default: 'REST_API' })
  dataSource: string; // 'REST_API' หรือ 'MONGODB'

  @Column({ type: 'text', nullable: true })
  mongoCollection: string; // ชื่อ MongoDB collection

  @Column({ type: 'text', nullable: true })
  mongoQuery: string; // MongoDB query เป็น JSON string เช่น '{"status": "active"}'

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastSyncedAt: Date; // เวลาที่ sync ล่าสุด

  @Column({ type: 'text', nullable: true })
  lastSyncStatus: string; // 'success', 'failed', 'partial'

  @Column({ type: 'text', nullable: true })
  lastSyncMessage: string; // ข้อความ status ล่าสุด

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
