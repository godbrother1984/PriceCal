// path: server/src/entities/master-data-approval.entity.ts
// version: 1.0 (Master Data Approval Workflow Entity)
// last-modified: 1 ตุลาคม 2568 13:45

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MasterDataType = 'STANDARD_PRICE' | 'EXCHANGE_RATE' | 'LME_PRICE' | 'FAB_COST' | 'SELLING_FACTOR';

@Entity('master_data_approvals')
export class MasterDataApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: MasterDataType; // ประเภทของ Master Data

  @Column()
  entityId: string; // ID ของ Master Data record

  @Column()
  version: number; // Version ที่ขออนุมัติ

  @Column({ type: 'text' })
  changes: string; // JSON ของการเปลี่ยนแปลง (เปรียบเทียบกับ version ก่อนหน้า)

  @Column({ type: 'text', nullable: true })
  requestReason: string; // เหตุผลในการขอเปลี่ยนแปลง

  @Column()
  requestedBy: string; // User ID ของผู้ขออนุมัติ

  @CreateDateColumn()
  requestedAt: Date; // เวลาที่ขออนุมัติ

  @Column({ default: 'PENDING' })
  status: ApprovalStatus; // สถานะการอนุมัติ

  @Column({ nullable: true })
  reviewedBy: string; // User ID ของผู้พิจารณา

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date; // เวลาที่พิจารณา

  @Column({ type: 'text', nullable: true })
  reviewComments: string; // ความเห็นของผู้พิจารณา

  @UpdateDateColumn()
  updatedAt: Date;

  // Metadata เพิ่มเติม
  @Column({ type: 'text', nullable: true })
  beforeSnapshot: string; // JSON snapshot ของข้อมูลเดิม (ก่อนแก้ไข)

  @Column({ type: 'text', nullable: true })
  afterSnapshot: string; // JSON snapshot ของข้อมูลใหม่ (หลังแก้ไข)

  @Column({ default: false })
  isAutoApproved: boolean; // อนุมัติอัตโนมัติหรือไม่

  @Column({ nullable: true })
  priority: string; // LOW, MEDIUM, HIGH, URGENT
}
