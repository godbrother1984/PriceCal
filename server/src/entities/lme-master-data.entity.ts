// path: server/src/entities/lme-master-data.entity.ts
// version: 1.0 (LME Price Master Data for Calculation)
// last-modified: 1 ตุลาคม 2568 18:55

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { VersionedEntity } from './base.entity';
import { CustomerGroup } from './customer-group.entity';

/**
 * LME Price Master Data
 * ข้อมูลราคา LME ที่พนักงานกำหนดไว้สำหรับการคำนวณ
 * ไม่ได้เปลี่ยนแปลงทุกวัน - ใช้เป็นราคาคงที่ในการคำนวณ
 */
@Entity('lme_master_data')
export class LmeMasterData extends VersionedEntity {
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
