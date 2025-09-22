// path: server/src/entities/raw-material.entity.ts
// version: 1.0 (Initial Database Schema)
// last-modified: 22 กันยายน 2568 10:30

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('raw_materials')
export class RawMaterial {
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

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}