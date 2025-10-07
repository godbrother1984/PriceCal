// path: server/src/entities/standard-price-history.entity.ts
// version: 1.0 (Standard Price History Entity)
// last-modified: 1 ตุลาคม 2568 13:40

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('standard_price_history')
export class StandardPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  standardPriceId: string; // Reference to original StandardPrice

  @Column({ nullable: true })
  version: number; // Version number

  @Column({ nullable: true })
  rawMaterialId: string;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  price: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  status: string; // DRAFT, PENDING_APPROVAL, APPROVED, ARCHIVED

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  @Column({ nullable: true })
  changedBy: string; // User ID who made this change

  @CreateDateColumn()
  changedAt: Date; // When this history record was created

  @Column({ type: 'text', nullable: true })
  changeReason: string; // Reason for this change

  @Column({ nullable: true })
  action: string; // 'CREATE', 'UPDATE', 'APPROVE', 'ARCHIVE'
}
