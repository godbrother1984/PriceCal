// path: server/src/entities/bom.entity.ts
// version: 4.0 (Add BOQ Lifecycle Management)
// last-modified: 14 ตุลาคม 2568 19:32

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

  @Column({ default: 'PRICECAL' })
  bomSource: string; // 'D365' or 'PRICECAL' - บอกว่า BOQ นี้มาจากไหน

  @Column({ default: true })
  isEditable: boolean; // true = แก้ไขได้ (PriceCal), false = แก้ไม่ได้ (D365)

  @Column({ default: false })
  isSyncedToD365: boolean; // true = sync กลับไป D365 แล้ว

  // ===== BOQ Lifecycle Fields =====
  @Column({ default: 'DRAFT' })
  bomStatus: string; // 'DRAFT' | 'PRODUCTION' | 'ARCHIVED'

  @Column({ nullable: true })
  copiedFrom: string; // BOQ ID ที่ Copy มา (D365 Master หรือ Dummy อื่น)

  @Column({ nullable: true })
  linkedDummyBomId: string; // สำหรับ Production BOQ ที่มาจาก Dummy BOQ

  @Column({ nullable: true })
  linkedD365BomId: string; // สำหรับ Dummy BOQ ที่ Copy จาก D365 Master

  @Column({ nullable: true })
  archivedDate: Date; // วันที่ BOQ ถูก Archive (เมื่อ Replace ด้วย Production BOQ)

  // Relations
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => RawMaterial)
  @JoinColumn({ name: 'rawMaterialId' })
  rawMaterial: RawMaterial;

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
  //
  // source (from ExternalDataEntity) = 'D365' | 'MongoDB' | 'PRICECAL'
  // bomSource = 'D365' | 'PRICECAL' - specific to BOQ management
  // bomStatus = 'DRAFT' | 'PRODUCTION' | 'ARCHIVED' - BOQ lifecycle status
}