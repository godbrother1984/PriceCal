// path: server/src/entities/price-request.entity.ts
// version: 1.0 (Initial Database Schema)
// last-modified: 22 กันยายน 2568 10:30

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

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

  @Column({ type: 'varchar', default: 'Pending' })
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