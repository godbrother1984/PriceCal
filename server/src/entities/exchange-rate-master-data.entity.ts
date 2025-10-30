// path: server/src/entities/exchange-rate-master-data.entity.ts
// version: 2.0 (Global Default - Removed customerGroupId)
// last-modified: 29 ตุลาคม 2568 04:05

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VersionedEntity } from './base.entity';

/**
 * Exchange Rate Master Data (Global Default)
 * ข้อมูลอัตราแลกเปลี่ยนที่พนักงานกำหนดไว้สำหรับการคำนวณ
 * ไม่ได้เปลี่ยนแปลงทุกวัน - ใช้เป็นอัตราคงที่ในการคำนวณ
 *
 * v2.0: เป็น Global Default (ไม่ผูกกับ Customer Group)
 * ใช้ CustomerGroupExchangeRateOverride สำหรับ Group-specific pricing
 */
@Entity('exchange_rate_master_data')
export class ExchangeRateMasterData extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceCurrencyCode: string;

  @Column()
  sourceCurrencyName: string;

  @Column()
  destinationCurrencyCode: string;

  @Column()
  destinationCurrencyName: string;

  @Column('decimal', { precision: 10, scale: 6 })
  rate: number;

  @Column({ nullable: true })
  description: string;

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}
