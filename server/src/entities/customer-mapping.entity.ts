// path: server/src/entities/customer-mapping.entity.ts
// version: 2.0 (Add PrimaryColumn for ID)
// last-modified: 1 ตุลาคม 2568 16:50

import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { CustomerGroup } from './customer-group.entity';

@Entity('customer_mappings')
export class CustomerMapping extends BaseEntity {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column()
  customerId: string;

  @Column()
  customerGroupId: string;

  @ManyToOne(() => Customer, { nullable: true, eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => CustomerGroup, { nullable: true, eager: true })
  @JoinColumn({ name: 'customerGroupId' })
  customerGroup: CustomerGroup;

  @Column({ default: true })
  isActive: boolean;
}
