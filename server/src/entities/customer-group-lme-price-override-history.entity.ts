// path: server/src/entities/customer-group-lme-price-override-history.entity.ts
// version: 2.0 (Standardize Field Names - createdBy/createdAt, Remove priceDate/source)
// last-modified: 29 ตุลาคม 2568 08:00

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer_group_lme_price_override_history')
export class CustomerGroupLMEPriceOverrideHistory {
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

  @Column('decimal', { precision: 10, scale: 4 })
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
