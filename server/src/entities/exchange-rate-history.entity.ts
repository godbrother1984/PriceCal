// path: server/src/entities/exchange-rate-history.entity.ts
// version: 1.0 (Exchange Rate History Entity)
// last-modified: 1 ตุลาคม 2568 13:40

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('exchange_rate_history')
export class ExchangeRateHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exchangeRateId: string; // Reference to original ExchangeRate

  @Column()
  version: number;

  @Column()
  sourceCurrencyCode: string;

  @Column()
  sourceCurrencyName: string;

  @Column()
  destinationCurrencyCode: string;

  @Column()
  destinationCurrencyName: string;

  @Column('decimal', { precision: 10, scale: 6 })
  rate: number;

  @Column({ nullable: true })
  source: string;

  @Column()
  status: string; // DRAFT, PENDING_APPROVAL, APPROVED, ARCHIVED

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
  action: string; // 'CREATE', 'UPDATE', 'APPROVE', 'ARCHIVE'
}
