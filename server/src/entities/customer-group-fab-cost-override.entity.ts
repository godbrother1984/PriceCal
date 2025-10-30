// path: server/src/entities/customer-group-fab-cost-override.entity.ts
// version: 5.0 (Match FAB Cost Structure - itemGroupCode, itemGroupName, price)
// last-modified: 30 ตุลาคม 2568 11:30

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Customer Group FAB Cost Override
 * Matches FAB Cost structure (FabCost entity)
 * Fields: itemGroupCode, itemGroupName, price, currency, description
 */
@Entity('customer_group_fab_cost_override')
export class CustomerGroupFABCostOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  customerGroupId: string;

  @Column({ nullable: false })
  itemGroupCode: string;

  @Column({ nullable: false })
  itemGroupName: string;

  @Column('decimal', { precision: 10, scale: 2 })
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
