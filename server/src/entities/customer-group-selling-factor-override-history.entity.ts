// path: server/src/entities/customer-group-selling-factor-override-history.entity.ts
// version: 3.0 (Change to tubeSize)
// last-modified: 29 ตุลาคม 2568 23:50

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer_group_selling_factor_override_history')
export class CustomerGroupSellingFactorOverrideHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  overrideId: string;

  @Column()
  customerGroupId: string;

  @Column()
  tubeSize: string; // Tube Size from Product (FG)

  @Column('decimal', { precision: 5, scale: 4 })
  factor: number;

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
