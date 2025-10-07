// path: server/src/entities/activity-log.entity.ts
// version: 1.0 (Activity Log Entity)
// last-modified: 29 กันยายน 2568 16:45

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { PriceRequest } from './price-request.entity';

export type ActivityType =
  | 'REQUEST_CREATED'
  | 'STATUS_CHANGED'
  | 'CALCULATION_COMPLETED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'BOQ_UPDATED'
  | 'SPECIAL_REQUEST_ADDED'
  | 'SPECIAL_REQUEST_UPDATED'
  | 'SPECIAL_REQUEST_REMOVED';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requestId: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  userName: string; // เก็บชื่อผู้ใช้ไว้เผื่อ user ถูกลบ

  @Column({ type: 'varchar' })
  activityType: ActivityType;

  @Column()
  description: string; // คำอธิบายกิจกรรม เช่น "เปลี่ยนสถานะจาก Draft เป็น Pending"

  @Column({ type: 'text', nullable: true })
  oldValue: string; // ค่าเก่า (JSON string)

  @Column({ type: 'text', nullable: true })
  newValue: string; // ค่าใหม่ (JSON string)

  @Column({ type: 'text', nullable: true })
  notes: string; // หมายเหตุเพิ่มเติม เช่น เหตุผลการขอแก้ไข

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => PriceRequest)
  @JoinColumn({ name: 'requestId' })
  priceRequest: PriceRequest;
}