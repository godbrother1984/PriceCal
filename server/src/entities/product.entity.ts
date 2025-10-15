// path: server/src/entities/product.entity.ts
// version: 4.0 (Add Dummy Item Lifecycle Management)
// last-modified: 14 ตุลาคม 2568 19:30

import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ExternalDataEntity } from './base.entity';

@Entity('products')
export class Product extends ExternalDataEntity {
  @PrimaryColumn()
  id: string; // FG-001 หรือ FG-DUMMY-001

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ default: 'PRICECAL' })
  productSource: string; // 'D365' or 'PRICECAL' - บอกว่า Product นี้มาจากไหน

  @Column({ default: true })
  hasBOQ: boolean; // true = มี BOQ แล้ว, false = ยังไม่มี BOQ

  @Column({ default: false })
  isSyncedToD365: boolean; // true = sync กลับไป D365 แล้ว (สำหรับ Product ที่สร้างใน PriceCal)

  // ===== Dummy Item Lifecycle Fields =====
  @Column({ default: 'AVAILABLE' })
  itemStatus: string; // 'AVAILABLE' | 'IN_USE' | 'MAPPED' | 'REPLACED' | 'PRODUCTION'

  @Column({ default: false })
  isUsed: boolean; // true = ถูกใช้ใน Request แล้ว

  @Column({ nullable: true })
  linkedRequestId: string; // Request ID ที่ใช้ Dummy Item นี้

  @Column({ nullable: true })
  linkedDummyId: string; // สำหรับ Production Item ที่มาจาก Dummy

  @Column({ nullable: true })
  d365ItemId: string; // Item ID ใน D365 (เมื่อ Production สร้างแล้ว)

  @Column({ nullable: true })
  replacedByD365Id: string; // D365 Item ID ที่มาแทนที่ Dummy นี้

  @Column({ nullable: true })
  mappedDate: Date; // วันที่ Costing Team ทำ Manual Mapping

  @Column({ nullable: true })
  mappedBy: string; // User ID ของคนที่ทำ Mapping

  @Column({ nullable: true })
  customerPO: string; // Customer PO ที่เกี่ยวข้อง

  @Column({ default: false })
  awaitingD365Creation: boolean; // true = รอ Production สร้าง Item ใน D365

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
  //
  // source (from ExternalDataEntity) = 'D365' | 'MongoDB' | 'PRICECAL'
  // productSource = 'D365' | 'PRICECAL' - specific to product management
  // itemStatus = 'AVAILABLE' | 'IN_USE' | 'MAPPED' | 'REPLACED' | 'PRODUCTION' - Dummy Item lifecycle
}