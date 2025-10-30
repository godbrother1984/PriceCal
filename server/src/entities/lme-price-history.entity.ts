// path: server/src/entities/lme-price-history.entity.ts
// version: 3.0 (Standardize Field Names - createdBy/createdAt, Remove priceDate/source)
// last-modified: 29 ตุลาคม 2568 08:00

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('lme_price_history')
export class LmePriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  lmePriceId: string; // Reference to original LmeMasterData

  @Column({ nullable: true })
  version: number;

  @Column({ nullable: true })
  itemGroupName: string;

  @Column({ nullable: true })
  itemGroupCode: string;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  price: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  @Column({ nullable: true })
  createdBy: string; // User ID who created this history record

  @CreateDateColumn()
  createdAt: Date; // When this history record was created

  @Column({ type: 'text', nullable: true })
  changeReason: string;
}
