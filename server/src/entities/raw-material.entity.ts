// path: server/src/entities/raw-material.entity.ts
// version: 2.0 (Add Audit Trail with ExternalDataEntity)
// last-modified: 1 ตุลาคม 2568 13:20

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

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}