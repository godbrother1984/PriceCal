// path: server/src/entities/lme-price.entity.ts
// version: 3.0 (Split to API data - for external LME data only)
// last-modified: 1 ตุลาคม 2568 18:55

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ExternalDataEntity } from './base.entity';

/**
 * LME Price from External API
 * ข้อมูลราคา LME ที่ดึงจาก API ภายนอก (อัพเดตทุกวัน)
 * ไม่ใช้สำหรับการคำนวณโดยตรง - ใช้เป็นข้อมูลอ้างอิงเท่านั้น
 */
@Entity('lme_prices_api')
export class LmePrice extends ExternalDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemGroupName: string;

  @Column()
  itemGroupCode: string;

  @Column('decimal', { precision: 10, scale: 4 })
  price: number;

  @Column()
  currency: string;

  @Column({ type: 'datetime' })
  priceDate: Date;

  // Note: externalId, lastSyncAt, source, dataSource, isActive,
  // createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}