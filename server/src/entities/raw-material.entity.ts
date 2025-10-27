// path: server/src/entities/raw-material.entity.ts
// version: 2.1 (Add itemGroupCode for LME Price mapping)
// last-modified: 22 ตุลาคม 2568 19:00

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

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}