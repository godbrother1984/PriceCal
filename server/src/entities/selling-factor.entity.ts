// path: server/src/entities/selling-factor.entity.ts
// version: 2.1 (Add Customer Group Relationship)
// last-modified: 1 ตุลาคม 2568 18:45

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { VersionedEntity } from './base.entity';
import { CustomerGroup } from './customer-group.entity';

@Entity('selling_factors')
export class SellingFactor extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patternName: string;

  @Column()
  patternCode: string;

  @Column('decimal', { precision: 5, scale: 4 })
  factor: number;

  @Column({ nullable: true })
  customerGroupId: string; // FK to customer_groups

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => CustomerGroup)
  @JoinColumn({ name: 'customerGroupId' })
  customerGroup: CustomerGroup;

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}