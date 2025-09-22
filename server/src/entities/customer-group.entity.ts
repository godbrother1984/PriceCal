// path: server/src/entities/customer-group.entity.ts
// version: 1.0 (Initial Database Schema)
// last-modified: 22 กันยายน 2568 10:30

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customer_groups')
export class CustomerGroup {
  @PrimaryColumn()
  id: string; // CG-DOM

  @Column()
  name: string;

  @Column()
  type: string; // Domestic, Export

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}