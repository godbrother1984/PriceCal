// path: server/src/entities/price-request.entity.ts
// version: 2.0 (Add Audit Trail + Calculation Snapshot)
// last-modified: 1 ตุลาคม 2568 13:35

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

export type RequestStatus = 'Draft' | 'Pending' | 'Calculating' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Revision Required';

@Entity('price_requests')
export class PriceRequest {
  @PrimaryColumn()
  id: string; // REQ-00125

  @Column({ nullable: true })
  customerId: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  productId: string;

  @Column()
  productName: string;

  @Column({ type: 'varchar', default: 'Draft' })
  status: RequestStatus;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  costingBy: string;

  @Column({ type: 'text', nullable: true })
  formData: string; // JSON string

  @Column({ nullable: true })
  customerType: string;

  @Column({ nullable: true })
  productType: string;

  @Column({ type: 'text', nullable: true })
  boqItems: string; // JSON string

  @Column({ type: 'text', nullable: true })
  calculationResult: string; // JSON string

  @Column({ type: 'text', nullable: true })
  specialRequests: string; // JSON string

  @Column({ type: 'text', nullable: true })
  revisionReason: string; // เหตุผลการขอแก้ไข

  // Audit Trail
  @Column({ nullable: true })
  updatedBy: string; // User ID ของผู้แก้ไขล่าสุด

  @Column({ nullable: true })
  approvedBy: string; // User ID ของผู้อนุมัติ

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date; // เวลาที่อนุมัติ

  // Calculation Snapshot - เก็บ version และค่าที่ใช้คำนวณ
  @Column({ type: 'datetime', nullable: true })
  calculatedAt: Date; // เวลาที่คำนวณ

  @Column({ type: 'simple-json', nullable: true })
  masterDataVersions: {
    standardPriceVersion?: number;
    exchangeRateVersion?: number;
    lmePriceVersion?: number;
    fabCostVersion?: number;
    sellingFactorVersion?: number;
  };

  @Column({ type: 'text', nullable: true })
  calculationSnapshot: string; // JSON เก็บค่าทั้งหมดที่ใช้คำนวณ (สำหรับ reproduce)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations (optional for now)
  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}