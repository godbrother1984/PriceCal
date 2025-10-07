// path: server/src/entities/exchange-rate.entity.ts
// version: 3.0 (Split to API data - for external exchange rate data only)
// last-modified: 1 ตุลาคม 2568 18:55

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ExternalDataEntity } from './base.entity';

/**
 * Exchange Rate from External API
 * ข้อมูลอัตราแลกเปลี่ยนที่ดึงจาก API ภายนอก เช่น ธนาคารแห่งประเทศไทย (อัพเดตทุกวัน)
 * ไม่ใช้สำหรับการคำนวณโดยตรง - ใช้เป็นข้อมูลอ้างอิงเท่านั้น
 */
@Entity('exchange_rates_api')
export class ExchangeRate extends ExternalDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'datetime' })
  rateDate: Date;

  // Note: externalId, lastSyncAt, source, dataSource, isActive,
  // createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}