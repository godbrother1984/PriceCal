// path: server/src/entities/currency.entity.ts
// version: 2.0 (Add PrimaryColumn for ID)
// last-modified: 1 ตุลาคม 2568 16:50

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('currencies')
export class Currency extends BaseEntity {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ length: 10, unique: true })
  code: string; // THB, USD, EUR, etc.

  @Column({ length: 100 })
  name: string; // Thai Baht, US Dollar, Euro

  @Column({ length: 10 })
  symbol: string; // ฿, $, €

  @Column({ default: true })
  isActive: boolean;
}
