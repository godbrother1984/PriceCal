// path: server/src/entities/employee.entity.ts
// version: 1.0 (Employee Entity - Synced from MongoDB)
// last-modified: 29 ตุลาคม 2568 23:40

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Employee Entity
 * - Read-only data synced from MongoDB
 * - No version control or status management (always display latest from MongoDB)
 */
@Entity('employees')
export class Employee {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  empId: string; // Employee ID from MongoDB (e.g., EMP001)

  @Column({ type: 'varchar', length: 255 })
  name: string; // First name

  @Column({ type: 'varchar', length: 255 })
  surname: string; // Last name

  @Column({ type: 'varchar', length: 50, nullable: true })
  sourceSystem?: string; // 'D365' | 'Manual' | 'Import'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastSyncedAt?: Date; // Last sync timestamp from MongoDB
}
