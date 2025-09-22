// path: server/src/entities/user.entity.ts
// version: 1.0 (Initial Database Schema)
// last-modified: 22 กันยายน 2568 10:30

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; // hashed password

  @Column()
  name: string;

  @Column({ default: 'User' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}