// path: server/src/entities/selling-factor-history.entity.ts
// version: 1.0 (Selling Factor History Entity)
// last-modified: 1 ตุลาคม 2568 17:20

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('selling_factor_history')
export class SellingFactorHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sellingFactorId: string; // Reference to original SellingFactor

  @Column({ nullable: true })
  version: number; // Version number

  @Column({ nullable: true })
  patternName: string;

  @Column({ nullable: true })
  patternCode: string;

  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  factor: number;

  @Column({ nullable: true })
  description: string;

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
