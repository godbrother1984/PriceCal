// path: server/src/entities/exchange-rate-master-data.entity.ts
// version: 1.0 (Exchange Rate Master Data for Calculation)
// last-modified: 1 ตุลาคม 2568 18:55

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { VersionedEntity } from './base.entity';
import { CustomerGroup } from './customer-group.entity';

/**
 * Exchange Rate Master Data
 * ข้อมูลอัตราแลกเปลี่ยนที่พนักงานกำหนดไว้สำหรับการคำนวณ
 * ไม่ได้เปลี่ยนแปลงทุกวัน - ใช้เป็นอัตราคงที่ในการคำนวณ
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
  customerGroupId: string; // FK to customer_groups

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => CustomerGroup)
  @JoinColumn({ name: 'customerGroupId' })
  customerGroup: CustomerGroup;

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}
