// path: server/src/entities/customer.entity.ts
// version: 2.0 (Reverted - use CustomerMapping for Customer Group)
// last-modified: 21 ตุลาคม 2568 15:30

import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ExternalDataEntity } from './base.entity';

@Entity('customers')
export class Customer extends ExternalDataEntity {
  @PrimaryColumn()
  id: string; // CUST-001

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  // NOTE: ไม่มี customerGroupId ที่นี่!
  // Customer Group Mapping อยู่ใน CustomerMapping entity
  // เพราะ Customer sync มาจาก MongoDB (D365) ไม่ควรแก้ไข schema

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}