// path: server/src/database/seeder.service.ts
// version: 1.0 (Database Seeder)
// last-modified: 22 กันยายน 2568 10:45

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { SystemConfig } from '../entities/system-config.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(RawMaterial)
    private rawMaterialRepository: Repository<RawMaterial>,
    @InjectRepository(CustomerGroup)
    private customerGroupRepository: Repository<CustomerGroup>,
    @InjectRepository(SystemConfig)
    private systemConfigRepository: Repository<SystemConfig>,
  ) {}

  async seed() {
    console.log('🌱 Starting database seeding...');

    // สร้าง Admin User เริ่มต้น
    await this.seedUsers();

    // สร้างข้อมูลหลัก
    await this.seedMasterData();

    console.log('✅ Database seeding completed!');
  }

  private async seedUsers() {
    const adminExists = await this.userRepository.findOne({ where: { username: 'admin' } });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin', 10);

      const admin = this.userRepository.create({
        username: 'admin',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'Administrator',
      });

      await this.userRepository.save(admin);
      console.log('👤 Created admin user (admin/admin)');
    }
  }

  private async seedMasterData() {
    // Customer Groups
    const groups = [
      { id: 'CG-DOM', name: 'Domestic', type: 'Domestic', description: 'ลูกค้าในประเทศ' },
      { id: 'CG-EXP', name: 'Export', type: 'Export', description: 'ลูกค้าต่างประเทศ' },
    ];

    for (const group of groups) {
      const exists = await this.customerGroupRepository.findOne({ where: { id: group.id } });
      if (!exists) {
        await this.customerGroupRepository.save(group);
      }
    }

    // Customers
    const customers = [
      { id: 'CUST-001', name: 'Thai Summit Group' },
      { id: 'CUST-002', name: 'Honda Automobile' },
      { id: 'CUST-003', name: 'Toyota Motor' },
    ];

    for (const customer of customers) {
      const exists = await this.customerRepository.findOne({ where: { id: customer.id } });
      if (!exists) {
        await this.customerRepository.save(customer);
      }
    }

    // Products
    const products = [
      { id: 'FG-001', name: 'TS-PART-001' },
      { id: 'FG-002', name: 'HN-PART-245' },
      { id: 'FG-003', name: 'TY-PART-889' },
    ];

    for (const product of products) {
      const exists = await this.productRepository.findOne({ where: { id: product.id } });
      if (!exists) {
        await this.productRepository.save(product);
      }
    }

    // Raw Materials
    const rawMaterials = [
      { id: 'RM-AL-01', name: 'Aluminum Sheet 1.2mm', unit: 'kg' },
      { id: 'RM-CU-02', name: 'Copper Wire 0.5mm', unit: 'm' },
      { id: 'RM-ST-03', name: 'Steel Coil 2.0mm', unit: 'kg' },
      { id: 'RM-PC-04', name: 'Polycarbonate Pellet', unit: 'kg' },
    ];

    for (const material of rawMaterials) {
      const exists = await this.rawMaterialRepository.findOne({ where: { id: material.id } });
      if (!exists) {
        await this.rawMaterialRepository.save(material);
      }
    }

    console.log('📊 Master data seeded successfully');
  }
}