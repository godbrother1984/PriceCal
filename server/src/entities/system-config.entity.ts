// path: server/src/entities/system-config.entity.ts
// version: 1.0 (Initial Database Schema)
// last-modified: 22 กันยายน 2568 10:30

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryColumn()
  key: string; // setupComplete, companyName, etc.

  @Column({ type: 'text' })
  value: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}