// path: server/src/entities/base.entity.ts
// version: 1.1 (Remove Foreign Key Constraint for approvedBy)
// last-modified: 1 ตุลาคม 2568 17:45

import { CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';

/**
 * Base entity class with audit trail fields
 * All entities should extend this class to inherit timestamp and user tracking
 */
export abstract class BaseEntity {
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string; // User ID who created this record

  @Column({ nullable: true })
  updatedBy: string; // User ID who last updated this record
}

/**
 * Base entity for Master Data that requires versioning and approval
 * Extends BaseEntity with version control and approval workflow fields
 */
export abstract class VersionedEntity extends BaseEntity {
  @Column({ default: 1 })
  version: number; // Version number for this record

  @Column({ default: 'Draft' }) // Draft, Pending_Approval, Approved, Archived
  status: string; // Status of this version

  @Column({ nullable: true })
  approvedBy: string; // User ID who approved this version

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date; // When this version was approved

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date; // When this version becomes effective

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date; // When this version expires

  @Column({ default: true })
  isActive: boolean; // Is this version currently active

  @Column({ type: 'text', nullable: true })
  changeReason: string; // Reason for this change/version
}

/**
 * Base entity for data synced from external APIs or MongoDB
 * These don't need versioning, just sync tracking
 */
export abstract class ExternalDataEntity extends BaseEntity {
  @Column({ nullable: true })
  externalId: string; // ID from external system

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date; // Last time data was synced

  @Column({ nullable: true })
  source: string; // Source system (e.g., 'D365_API', 'LME_API', 'MONGODB')

  @Column({ nullable: true })
  dataSource: string; // Type of data source: 'REST_API' or 'MONGODB'

  @Column({ default: true })
  isActive: boolean; // Is this record active
}
