// path: server/src/entities/customer-group-standard-price-override-history.entity.ts
// version: 2.0 (Standardize Field Names - createdBy/createdAt)
// last-modified: 29 ตุลาคม 2568 08:00

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer_group_standard_price_override_history')
export class CustomerGroupStandardPriceOverrideHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  overrideId: string; // Reference to CustomerGroupStandardPriceOverride

  @Column()
  customerGroupId: string;

  @Column()
  rawMaterialId: string;

  @Column('decimal', { precision: 10, scale: 4 })
  price: number;

  @Column()
  currency: string;

  // Version Control Snapshot
  @Column()
  version: number;

  @Column()
  status: string;

  // Approval Snapshot
  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  // Effective Dates Snapshot
  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  // History Metadata
  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  changeReason: string;
}
