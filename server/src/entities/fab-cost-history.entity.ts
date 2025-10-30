// path: server/src/entities/fab-cost-history.entity.ts
// version: 4.3 (Change costPerHour to price)
// last-modified: 30 ตุลาคม 2568 10:59

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
  itemGroupName: string; // Item Group Name (Aluminum, Copper, etc.)

  @Column({ nullable: true })
  itemGroupCode: string; // Item Group Code (AL, CU, ST, etc.) to match with LME and Raw Materials

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number; // FAB Cost Price (not per hour)

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
  createdBy: string; // User ID who created this history record

  @CreateDateColumn()
  createdAt: Date; // When this history record was created

  @Column({ type: 'text', nullable: true })
  changeReason: string; // Reason for this change
}
