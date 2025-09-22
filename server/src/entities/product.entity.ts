// path: server/src/entities/product.entity.ts
// version: 1.0 (Initial Database Schema)
// last-modified: 22 กันยายน 2568 10:30

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
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

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}