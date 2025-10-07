// path: server/src/entities/fab-cost.entity.ts
// version: 2.0 (Add Versioning with VersionedEntity)
// last-modified: 1 ตุลาคม 2568 13:25

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VersionedEntity } from './base.entity';

@Entity('fab_costs')
export class FabCost extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  costPerHour: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  description: string;

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}