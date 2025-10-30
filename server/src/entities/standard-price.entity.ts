// path: server/src/entities/standard-price.entity.ts
// version: 3.0 (Change to ExternalDataEntity - Read-only from MongoDB)
// last-modified: 29 ตุลาคม 2568 02:30

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ExternalDataEntity } from './base.entity';
import { RawMaterial } from './raw-material.entity';

@Entity('standard_prices')
export class StandardPrice extends ExternalDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rawMaterialId: string;

  @Column('decimal', { precision: 10, scale: 4 })
  price: number;

  @Column()
  currency: string;

  @ManyToOne(() => RawMaterial)
  @JoinColumn({ name: 'rawMaterialId' })
  rawMaterial: RawMaterial;

  // Note: sourceSystem, lastSyncedAt, isActive
  // are inherited from ExternalDataEntity
  // ไม่มี version control (status, version, approvedBy) เพราะ sync จาก MongoDB
}