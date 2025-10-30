// path: server/src/entities/customer-group-fab-cost-override-history.entity.ts
// version: 3.0 (Match FAB Cost Structure - itemGroupCode, itemGroupName)
// last-modified: 30 ตุลาคม 2568 11:30

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer_group_fab_cost_override_history')
export class CustomerGroupFABCostOverrideHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  overrideId: string;

  @Column()
  customerGroupId: string;

  @Column()
  itemGroupCode: string;

  @Column()
  itemGroupName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  version: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  changeReason: string;
}
