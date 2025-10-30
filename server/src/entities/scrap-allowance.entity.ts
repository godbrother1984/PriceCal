// path: server/src/entities/scrap-allowance.entity.ts
// version: 1.0 (Initial Creation - Scrap Allowance Master Data)
// last-modified: 29 ตุลาคม 2568 00:05

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VersionedEntity } from './base.entity';

/**
 * Scrap Allowance Master Data (Global Default)
 *
 * ค่าเผื่อของเสีย (% ของน้ำหนัก Raw Material ที่ใช้)
 * Reference กับ Item Group Code จาก D365
 *
 * Version Control: Draft → Active → Archived (เหมือน Master Data อื่นๆ)
 *
 * Example:
 * - Item Group Code: "RM-METAL"
 * - Scrap Percentage: 0.05 (5%)
 * - Calculation: RM Weight × (1 + 0.05) = Adjusted Weight
 */
@Entity('scrap_allowances')
export class ScrapAllowance extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemGroupCode: string; // Reference to D365 Item Group Code

  @Column({ nullable: true })
  itemGroupName: string; // Display name (optional, for UI)

  @Column('decimal', { precision: 5, scale: 4 })
  scrapPercentage: number; // Scrap allowance as decimal (e.g., 0.05 = 5%)

  @Column({ nullable: true })
  description: string; // Optional description

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}
