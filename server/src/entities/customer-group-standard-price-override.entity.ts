// path: server/src/entities/customer-group-standard-price-override.entity.ts
// version: 1.0 (Customer Group Standard Price Override Entity)
// last-modified: 29 ตุลาคม 2568 03:30

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customer_group_standard_price_override')
export class CustomerGroupStandardPriceOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  customerGroupId: string; // Reference to CustomerGroup

  @Column({ nullable: false })
  rawMaterialId: string; // Reference to RawMaterial

  @Column('decimal', { precision: 10, scale: 4 })
  price: number;

  @Column()
  currency: string; // Reference to Currency code

  // Version Control Fields
  @Column({ default: 1 })
  version: number;

  @Column({ default: 'Draft' })
  status: string; // Draft, Active, Superseded

  // Approval Fields
  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  // Effective Dates
  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  // Change Tracking
  @Column({ type: 'text', nullable: true })
  changeReason: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
