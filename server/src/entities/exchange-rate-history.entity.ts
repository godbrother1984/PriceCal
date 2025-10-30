// path: server/src/entities/exchange-rate-history.entity.ts
// version: 3.0 (Standardize Field Names - createdBy/createdAt, Remove source)
// last-modified: 29 ตุลาคม 2568 08:00

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('exchange_rate_history')
export class ExchangeRateHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  exchangeRateId: string; // Reference to original ExchangeRateMasterData

  @Column({ nullable: true })
  version: number;

  @Column({ nullable: true })
  sourceCurrencyCode: string;

  @Column({ nullable: true })
  sourceCurrencyName: string;

  @Column({ nullable: true })
  destinationCurrencyCode: string;

  @Column({ nullable: true })
  destinationCurrencyName: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  rate: number;

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
  changeReason: string;
}
