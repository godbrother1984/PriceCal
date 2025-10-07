// path: server/src/entities/fab-cost-history.entity.ts
// version: 1.0 (Fab Cost History Entity)
// last-modified: 1 ตุลาคม 2568 17:20

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fab_cost_history')
export class FabCostHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  fabCostId: string; // Reference to original FabCost

  @Column({ nullable: true })
  version: number; // Version number

  @Column({ nullable: true })
  name: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  costPerHour: number;

  @Column({ nullable: true })
  currency: string;

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
