// path: server/src/entities/customer.entity.ts
// version: 2.0 (Add Audit Trail with ExternalDataEntity)
// last-modified: 1 ตุลาคม 2568 13:20

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

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}