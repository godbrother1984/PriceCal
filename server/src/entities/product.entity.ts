// path: server/src/entities/product.entity.ts
// version: 2.0 (Add Audit Trail with ExternalDataEntity)
// last-modified: 1 ตุลาคม 2568 13:20

import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ExternalDataEntity } from './base.entity';

@Entity('products')
export class Product extends ExternalDataEntity {
  @PrimaryColumn()
  id: string; // FG-001

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  unit: string;

  // Note: isActive, externalId, lastSyncAt, source, createdAt, updatedAt, createdBy, updatedBy
  // are inherited from ExternalDataEntity
}