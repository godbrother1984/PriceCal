// path: server/src/entities/lme-price-reference-history.entity.ts
// version: 1.0
// last-modified: 28 ตุลาคม 2568 23:40

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * LMEPriceReferenceHistory Entity
 * เก็บประวัติราคา LME ที่ดึงมาจาก external API
 * ใช้เพื่อแสดงกราฟเส้นและดูเทรนด์ของราคา (เก็บเป็น reference เท่านั้น)
 */
@Entity('lme_price_reference_history')
export class LMEPriceReferenceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  metal: string; // Copper, Aluminium, Zinc, Nickel, Lead, Tin

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // ราคา (USD/tonne)

  @Column({ type: 'varchar', length: 20 })
  unit: string; // USD/tonne

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  change: number; // % การเปลี่ยนแปลง

  @Column({ type: 'varchar', length: 50 })
  date: string; // วันที่ของราคา (จาก API)

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date; // วันเวลาที่ดึงข้อมูล
}
