// path: server/src/entities/selling-factor.entity.ts
// version: 4.0 (Change to tubeSize - Remove pattern fields)
// last-modified: 29 ตุลาคม 2568 23:00

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VersionedEntity } from './base.entity';

/**
 * Selling Factor Master Data (Global Default)
 *
 * v4.0: ใช้ tubeSize แทน patternName/patternCode
 * tubeSize จะดึงมาจาก Product (FG) ที่ sync จาก MongoDB
 * ใช้ CustomerGroupSellingFactorOverride สำหรับ Group-specific pricing
 */
@Entity('selling_factors')
export class SellingFactor extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tubeSize: string; // Tube Size from Product (FG)

  @Column('decimal', { precision: 5, scale: 4 })
  factor: number;

  @Column({ nullable: true })
  description: string;

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}