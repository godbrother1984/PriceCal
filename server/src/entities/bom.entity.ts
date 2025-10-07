// path: server/src/entities/bom.entity.ts
// version: 2.0 (Add Audit Trail with ExternalDataEntity)
// last-modified: 1 ตุลาคม 2568 13:20

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ExternalDataEntity } from './base.entity';
import { Product } from './product.entity';
import { RawMaterial } from './raw-material.entity';

@Entity('bom')
export class BOM extends ExternalDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  rawMaterialId: string;

  @Column('decimal', { precision: 10, scale: 4 })
  quantity: number;

  @Column({ default: 'unit' })
  unit: string; // unit, kg, m, mm, pcs, sheet, g, etc.

  @Column({ nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => RawMaterial)
  @JoinColumn({ name: 'rawMaterialId' })
  rawMaterial: RawMaterial;

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}