// path: server/src/entities/customer-group-lme-price-override.entity.ts
// version: 2.0 (Remove priceDate and source - Match Master Data Structure)
// last-modified: 29 ตุลาคม 2568 22:30

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customer_group_lme_price_override')
export class CustomerGroupLMEPriceOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  customerGroupId: string;

  @Column({ nullable: false })
  itemGroupCode: string;

  @Column({ nullable: false })
  itemGroupName: string;

  @Column('decimal', { precision: 10, scale: 4 })
  price: number;

  @Column()
  currency: string;

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
