// path: server/src/entities/fab-cost.entity.ts
// version: 2.4 (Change costPerHour to price)
// last-modified: 30 ตุลาคม 2568 10:58

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { VersionedEntity } from './base.entity';

@Entity('fab_costs')
export class FabCost extends VersionedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemGroupName: string; // Item Group Name (Aluminum, Copper, etc.)

  @Column()
  itemGroupCode: string; // Item Group Code (AL, CU, ST, etc.) to match with LME and Raw Materials

  @Column('decimal', { precision: 10, scale: 2 })
  price: number; // FAB Cost Price (not per hour)

  @Column()
  currency: string;

  @Column({ nullable: true })
  description: string;

  // Note: version, status, approvedBy, approvedAt, effectiveFrom, effectiveTo,
  // isActive, changeReason, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from VersionedEntity
}