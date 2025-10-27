// path: server/src/entities/raw-material-fab-cost.entity.ts
// version: 1.0 (Initial Creation - FAB Cost for Raw Materials)
// last-modified: 21 ตุลาคม 2568 14:30

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { VersionedEntity } from './base.entity';
import { RawMaterial } from './raw-material.entity';
import { CustomerGroup } from './customer-group.entity';

/**
 * RawMaterialFabCost Entity
 *
 * เก็บค่า Fabrication Cost ของ Raw Material แต่ละตัว
 * ใช้คู่กับ LME Price เพื่อคำนวณมูลค่า RM จริง
 *
 * สูตร: Unit Price = LME Price + FAB Cost
 *
 * ตัวอย่าง:
 * - Copper LME Price = 8.50 USD/KG
 * - Copper FAB Cost = 1.20 USD/KG (ค่าขึ้นรูปเป็นแผ่น)
 * - Unit Price = 8.50 + 1.20 = 9.70 USD/KG
 */
@Entity('raw_material_fab_costs')
export class RawMaterialFabCost extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Raw Material ที่เกี่ยวข้อง (เช่น Copper, Aluminum)
   */
  @Column()
  rawMaterialId: string;

  @ManyToOne(() => RawMaterial)
  @JoinColumn({ name: 'rawMaterialId' })
  rawMaterial: RawMaterial;

  /**
   * FAB Cost per unit (USD)
   * ค่าขึ้นรูป/ปรับแต่งวัตถุดิบ
   */
  @Column('decimal', { precision: 10, scale: 4 })
  fabCost: number;

  /**
   * หน่วย (ต้องตรงกับหน่วยของ LME Price)
   * เช่น USD/KG, USD/TON, USD/LB
   */
  @Column()
  unit: string;

  /**
   * Customer Group (Optional)
   * ถ้า null = ใช้ได้กับทุก Customer Group
   */
  @Column({ nullable: true })
  customerGroupId: string;

  @ManyToOne(() => CustomerGroup, { nullable: true })
  @JoinColumn({ name: 'customerGroupId' })
  customerGroup: CustomerGroup;

  /**
   * คำอธิบายเพิ่มเติม
   * เช่น "ค่าขึ้นรูปเป็นแผ่น", "ค่าตัด/เจาะ"
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  // Inherited from VersionedEntity:
  // - version: number
  // - status: 'Draft' | 'Active'
  // - approvedBy: string
  // - approvedAt: Date
  // - effectiveFrom: Date
  // - effectiveTo: Date
  // - isActive: boolean
  // - changeReason: string
  // - createdAt: Date
  // - updatedAt: Date
  // - createdBy: string
  // - updatedBy: string
}
