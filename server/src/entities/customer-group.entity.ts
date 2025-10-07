// path: server/src/entities/customer-group.entity.ts
// version: 2.1 (Remove type, Add isDefault flag)
// last-modified: 1 ตุลาคม 2568 18:30

import { Entity, PrimaryColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('customer_groups')
export class CustomerGroup extends BaseEntity {
  @PrimaryColumn()
  id: string; // CG-001, CG-002, etc.

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isDefault: boolean; // กลุ่ม default สำหรับลูกค้าที่ไม่ได้อยู่กลุ่มใดๆ

  @Column({ default: true })
  isActive: boolean;

  // Note: createdAt, updatedAt, createdBy, updatedBy are inherited from BaseEntity
}