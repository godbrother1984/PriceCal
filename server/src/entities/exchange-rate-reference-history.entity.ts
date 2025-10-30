// path: server/src/entities/exchange-rate-reference-history.entity.ts
// version: 1.0
// last-modified: 28 ตุลาคม 2568 23:40

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * ExchangeRateReferenceHistory Entity
 * เก็บประวัติอัตราแลกเปลี่ยนที่ดึงมาจาก BOT API
 * ใช้เพื่อแสดงกราฟเส้นและดูเทรนด์ของอัตราแลกเปลี่ยน (เก็บเป็น reference เท่านั้น)
 */
@Entity('exchange_rate_reference_history')
export class ExchangeRateReferenceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  currency: string; // USD, EUR, JPY, CNY, SGD, GBP, etc.

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  buyingRate: number; // อัตราซื้อ

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  sellingRate: number; // อัตราขาย

  @Column({ type: 'varchar', length: 50 })
  date: string; // วันที่ของอัตราแลกเปลี่ยน (จาก API)

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date; // วันเวลาที่ดึงข้อมูล
}
