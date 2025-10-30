// path: server/src/entities/customer-group-selling-factor-override.entity.ts
// version: 2.0 (Change to tubeSize - Remove pattern fields)
// last-modified: 29 ตุลาคม 2568 23:00

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Customer Group Selling Factor Override
 * v2.0: ใช้ tubeSize แทน patternName/patternCode
 * tubeSize ดึงมาจาก Product (FG) ที่ sync จาก MongoDB
 */
@Entity('customer_group_selling_factor_override')
export class CustomerGroupSellingFactorOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  customerGroupId: string;

  @Column({ nullable: false })
  tubeSize: string; // Tube Size from Product (FG)

  @Column('decimal', { precision: 5, scale: 4 })
  factor: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Version Control Fields
  @Column({ default: 1 })
  version: number;

  @Column({ default: 'Draft' })
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  @Column({ type: 'text', nullable: true })
  changeReason: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
