// path: server/src/entities/raw-material.entity.ts
// version: 2.2 (Add itemGroup field for display and matching)
// last-modified: 30 ตุลาคม 2568 00:15

import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ExternalDataEntity } from './base.entity';

@Entity('raw_materials')
export class RawMaterial extends ExternalDataEntity {
  @PrimaryColumn()
  id: string; // RM-AL-01

  @Column()
  name: string;

  @Column()
  unit: string; // kg, m, piece

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  itemGroupCode: string; // AL, CU, ST, etc. - for LME Price matching

  @Column({ nullable: true })
  itemGroup: string; // Item Group name for display and matching

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}