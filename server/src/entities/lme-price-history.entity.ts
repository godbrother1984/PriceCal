// path: server/src/entities/lme-price-history.entity.ts
// version: 1.0 (LME Price History Entity)
// last-modified: 1 ตุลาคม 2568 13:40

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('lme_price_history')
export class LmePriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lmePriceId: string; // Reference to original LmePrice

  @Column()
  version: number;

  @Column()
  itemGroupName: string;

  @Column()
  itemGroupCode: string;

  @Column('decimal', { precision: 10, scale: 4 })
  price: number;

  @Column()
  currency: string;

  @Column()
  priceDate: Date;

  @Column({ nullable: true })
  source: string;

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
  changedBy: string;

  @CreateDateColumn()
  changedAt: Date;

  @Column({ type: 'text', nullable: true })
  changeReason: string;

  @Column()
  action: string;
}
