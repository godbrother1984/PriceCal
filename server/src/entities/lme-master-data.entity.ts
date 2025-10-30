// path: server/src/entities/lme-master-data.entity.ts
// version: 2.0 (Global Default - Removed customerGroupId)
// last-modified: 29 ตุลาคม 2568 04:05

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VersionedEntity } from './base.entity';

/**
 * LME Price Master Data (Global Default)
 * ข้อมูลราคา LME ที่พนักงานกำหนดไว้สำหรับการคำนวณ
 * ไม่ได้เปลี่ยนแปลงทุกวัน - ใช้เป็นราคาคงที่ในการคำนวณ
 *
 * v2.0: เป็น Global Default (ไม่ผูกกับ Customer Group)
 * ใช้ CustomerGroupLMEPriceOverride สำหรับ Group-specific pricing
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
  description: string;

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}
