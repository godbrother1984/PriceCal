# PriceCal Project Documentation

**Project Name**: PriceCal - ระบบคำนวณราคาสำหรับองค์กร
**Version**: 5.8
**Last Updated**: 15 ตุลาคม 2568
**Documentation Path**: `C:\Project\PriceCal\PROJECT_DOCUMENTATION.md`

---

## 📋 สารบัญ

1. [ภาพรวมโครงการ](#ภาพรวมโครงการ)
2. [สถานะการพัฒนา](#สถานะการพัฒนา)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Dummy Item & BOQ Lifecycle](#dummy-item--boq-lifecycle)
7. [Implementation Checklist](#implementation-checklist)
8. [ปัญหาที่พบและแนวทางแก้ไข](#ปัญหาที่พบและแนวทางแก้ไข)
9. [Development Workflow](#development-workflow)
10. [การติดตั้งและรันโปรเจค](#การติดตั้งและรันโปรเจค)

---

## ภาพรวมโครงการ

### วัตถุประสงค์
PriceCal เป็นระบบคำนวณราคาสำหรับองค์กร ที่ช่วยให้ Sales และ Costing Team สามารถ:
- สร้างคำขอราคา (Price Request) สำหรับสินค้าใหม่และสินค้าที่มีอยู่แล้ว
- คำนวณราคาจาก BOQ (Bill of Quantities) อัตโนมัติ
- จัดการ Master Data (ลูกค้า, สินค้า, วัตถุดิบ, ราคามาตรฐาน)
- Sync ข้อมูลจาก D365 ผ่าน MongoDB
- จัดการ Dummy Items สำหรับสินค้าใหม่ที่ยังไม่ได้สร้างใน D365

### Core Features (ปัจจุบัน)
- ✅ **Authentication**: JWT + bcrypt (ไม่มี hardcode)
- ✅ **Price Request Management**: สร้าง/แก้ไข/อนุมัติคำขอราคา
- ✅ **BOQ Management**: สร้าง/แก้ไข/Copy BOQ (Hybrid: D365 + PriceCal)
- ✅ **Price Calculation Engine**: คำนวณราคาจาก BOQ, LME Price, Standard Price, FAB Cost, Selling Factor
- ✅ **Master Data Management**: จัดการข้อมูลหลักทั้งหมด (7 grouped tabs)
- ✅ **MongoDB Integration**: Sync ข้อมูลจาก D365 → MongoDB → PriceCal
- ✅ **Dummy Item Lifecycle**: Auto-generate Dummy Items + Manual Mapping
- ✅ **Activity Logs**: ติดตามการเปลี่ยนแปลงข้อมูล
- ✅ **User Profile & Settings**: จัดการข้อมูลส่วนตัวและตั้งค่าระบบ

### User Roles
1. **Sales**: สร้างคำขอราคา, ดูสถานะคำขอ
2. **Costing Team**: คำนวณราคา, จัดการ BOQ, Manual Mapping Dummy Items
3. **Admin**: จัดการ Master Data, ตั้งค่าระบบ, ดู Activity Logs

---

## สถานะการพัฒนา

### ✅ ทำเสร็จแล้ว (v5.0 - v5.8)

#### v5.8 - Dummy Item & BOQ Lifecycle Management (ล่าสุด)
- ✅ **Database Schema**: เพิ่ม 15 fields ใน Product entity, 7 fields ใน BOM entity
- ✅ **Dummy Items Module**: DummyItemsService, Controller, Module
- ✅ **Auto-Generate System**: Background job สร้าง Dummy Items (FG-DUMMY-001, 002, 003...)
- ✅ **Manual Mapping API**: POST /api/dummy-items/map-to-d365
- ✅ **5 REST Endpoints**: available, generate, map-to-d365, pending-mappings, check-availability
- ✅ **Lifecycle Tracking**: itemStatus, bomStatus fields
- ✅ **Future-Ready Fields**: isPushedToD365, d365CreationMethod, autoCreationFailed (เตรียมไว้สำหรับ Phase 2)

#### v5.7 - BOQ Management System
- ✅ BOQViewer Component (Read-only view)
- ✅ BOQEditor Component (Create/Edit BOQ)
- ✅ Copy BOQ Feature (from D365 or other Dummy)
- ✅ Hybrid BOQ Support (D365 Read-only + PriceCal Editable)

#### v5.6 - Master Data Tabs Redesign
- ✅ จัดระเบียบ tabs จาก 11 tabs → 7 grouped tabs
- ✅ Tab structure: MongoDB Sync, BOQ Management, Customers, Pricing Master, Market Data, System Config, Activity Logs

#### v5.5 - Frontend JWT Authentication
- ✅ Centralized API Client (axios interceptor)
- ✅ Auto JWT token injection ทุก request
- ✅ 401 Unauthorized handling

#### v5.4 - MongoDB Primary + Security
- ✅ MongoDB เป็น Primary Data Source (ไม่ใช่ API)
- ✅ JWT Secret Validation (ไม่อนุญาต hardcode)
- ✅ JwtAuthGuard ป้องกันทุก endpoints (9 controllers)

#### v5.3 - Universal Sync with Toggle Control
- ✅ SyncConfig Entity (toggle เปิด/ปิด sync แต่ละ entity)
- ✅ Sync Customers, Products, Master Data จาก MongoDB
- ✅ Sync Status Tracking

#### v5.1 - Price Calculation Engine
- ✅ Calculate price จาก BOQ
- ✅ Multi-source pricing (LME, Standard Price)
- ✅ FAB Cost + Selling Factor
- ✅ Multi-currency (USD, THB)
- ✅ Margin calculation
- ✅ Master Data Versioning (Snapshot)

#### v5.0 - UI Restructure
- ✅ Settings Page (API Settings, System Config, Import Config)
- ✅ User Profile Page
- ✅ Navigation restructure (MAIN, SYSTEM, USER sections)

### 🚧 กำลังพัฒนา (Phase 1 - In Progress)

**Dummy Item & BOQ Lifecycle - Phase 1: Manual Mapping**
- ✅ Database schema พร้อม
- ✅ Manual Mapping API พร้อม
- ⏳ **Manual Mapping UI** (หน้าจอสำหรับ Costing Team ทำ mapping)
- ⏳ **Item Status Badges** (แสดง status ใน BOQViewer และ CreateRequest)

### 📝 วางแผนไว้ (Phase 2-3 - Planned)

#### Phase 2: Prepare for Auto-Creation
- ✅ Add future fields to entities (เสร็จแล้ว)
- ⏳ Design D365 API integration interface
- ⏳ Create "Ready for D365" validation endpoint
- ⏳ Create retry mechanism design
- ⏳ Design Auto-Creation workflow

#### Phase 3: Auto-Creation (อนาคต)
- ⏳ D365 API client service
- ⏳ Push Item to D365 API
- ⏳ Push BOQ to D365 API
- ⏳ Error handling & retry logic
- ⏳ Auto-creation UI (Dashboard แสดงสถานะการสร้างอัตโนมัติ)

#### Future Enhancements
- ⏳ BOQ Comparison View (เปรียบเทียบ Dummy BOQ vs Production BOQ)
- ⏳ Warning Banners (แจ้งเตือนเมื่อใช้ Dummy Item)
- ⏳ Retry Mechanism (Retry สำหรับ failed auto-creation)
- ⏳ Advanced Analytics (สถิติการใช้งาน, ราคาเฉลี่ย, Margin trends)

---

## Architecture & Tech Stack

### Tech Stack

**Backend (NestJS)**
- **Framework**: NestJS 10.x
- **Database (Dev)**: SQLite 3.x + TypeORM 0.3.x
- **Database (Prod)**: PostgreSQL + TypeORM
- **Authentication**: JWT + bcrypt
- **Data Source**: MongoDB (Primary) + D365 (via MongoDB sync)
- **Port**: 3001

**Frontend (React)**
- **Framework**: React 18.x + Vite 5.x
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 3.x
- **HTTP Client**: Axios (centralized instance)
- **Port**: 5173

**MongoDB**
- **Purpose**: Primary data source สำหรับ D365 data
- **Collections**: customers, products, raw_materials, bom, standard_prices, lme_master_data, exchange_rate_master_data, fab_costs, selling_factors
- **Connection**: MongodbModule + MasterDataMongoService

### Architecture Pattern

```
D365 (ERP System)
    ↓ (Auto Sync)
MongoDB (Primary Data Source)
    ↓ (Manual/Auto Sync via API)
PriceCal SQLite/PostgreSQL (Local DB)
    ↓
Frontend (React UI)
```

### Project Structure

```
PriceCal/
├─ server/                    # Backend (NestJS)
│  ├─ src/
│  │  ├─ entities/           # TypeORM Entities (14 entities)
│  │  ├─ auth/               # JWT Authentication
│  │  ├─ data/               # Master Data CRUD
│  │  ├─ import/             # MongoDB Sync Service
│  │  ├─ mongodb/            # MongoDB Integration
│  │  ├─ pricing/            # Price Calculation Engine
│  │  ├─ bom/                # BOQ Management
│  │  ├─ dummy-items/        # Dummy Item Lifecycle (NEW v5.8)
│  │  ├─ sync-config/        # Sync Toggle Control
│  │  ├─ price-calculation/  # Price Calculation Service
│  │  ├─ activity-log/       # Activity Logging
│  │  ├─ master-data/        # Master Data Controller
│  │  └─ main.ts             # Entry point (port 3001)
│  ├─ database.sqlite        # SQLite Database
│  └─ package.json
│
├─ client/                   # Frontend (React)
│  ├─ src/
│  │  ├─ pages/             # Page Components (9 pages)
│  │  │  ├─ Login.tsx
│  │  │  ├─ SetupWizard.tsx
│  │  │  ├─ PriceRequestList.tsx
│  │  │  ├─ CreateRequest.tsx
│  │  │  ├─ PricingView.tsx
│  │  │  ├─ MasterData.tsx
│  │  │  ├─ Settings.tsx
│  │  │  └─ UserProfile.tsx
│  │  ├─ components/        # Reusable Components
│  │  │  ├─ layout/         # MainLayout, Sidebar
│  │  │  ├─ BOQViewer.tsx
│  │  │  ├─ BOQEditor.tsx
│  │  │  ├─ PriceCalculator.tsx
│  │  │  ├─ ImportManager.tsx
│  │  │  ├─ MasterDataViewer.tsx
│  │  │  └─ ActivityLogs.tsx
│  │  ├─ services/
│  │  │  ├─ api.ts          # Centralized Axios Instance
│  │  │  └─ eventBus.ts     # Event Bus
│  │  └─ main.tsx           # Entry point
│  └─ package.json
│
├─ CHANGELOG.md             # Complete changelog (v3.8 - v5.8)
├─ PROJECT_DOCUMENTATION.md # เอกสารฉบับนี้
├─ CLAUDE.md               # Claude Code instructions
└─ README.md
```

---

## Database Schema

### Core Entities (14 Entities)

#### 1. User Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; // bcrypt hashed

  @Column()
  email: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ default: 'user' })
  role: string; // 'admin', 'sales', 'costing'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 2. Product Entity (v4.0 - เพิ่ม Dummy Item Lifecycle)
```typescript
@Entity('products')
export class Product extends ExternalDataEntity {
  @PrimaryColumn()
  id: string; // FG-DUMMY-001, D365-FG-5001

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: 'PRICECAL' })
  productSource: string; // 'PRICECAL' | 'D365'

  // ===== Dummy Item Lifecycle Fields (v4.0) =====
  @Column({ default: 'AVAILABLE' })
  itemStatus: string;
  // 'AVAILABLE' = Dummy Item ยังว่าง
  // 'IN_USE' = Dummy กำลังใช้ใน Request
  // 'MAPPED' = Dummy ถูก Map กับ D365 แล้ว
  // 'REPLACED' = Dummy ถูก replace ด้วย Production Item
  // 'PRODUCTION' = Production Item จาก D365

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  linkedRequestId: string; // Request ที่ใช้ Dummy นี้

  @Column({ nullable: true })
  linkedDummyId: string; // For Production: Link to Dummy

  @Column({ nullable: true })
  d365ItemId: string; // For Dummy: Link to D365 Item

  @Column({ nullable: true })
  replacedByD365Id: string; // D365 Item ที่มาแทนที่

  @Column({ nullable: true })
  mappedDate: Date;

  @Column({ nullable: true })
  mappedBy: string;

  @Column({ nullable: true })
  customerPO: string;

  @Column({ default: false })
  awaitingD365Creation: boolean;

  // ===== Future-Ready Fields (Phase 2) =====
  @Column({ default: false })
  isPushedToD365: boolean; // ถูกยิง API ไปสร้างใน D365 แล้ว

  @Column({ nullable: true })
  d365CreationDate: Date;

  @Column({ nullable: true })
  d365CreationMethod: string; // 'MANUAL' | 'AUTO_API' | 'PRODUCTION_TEAM'

  @Column({ default: false })
  autoCreationFailed: boolean;

  @Column({ nullable: true })
  autoCreationError: string;

  // ===== External Data Fields =====
  @Column({ nullable: true })
  sourceSystem: string; // 'D365' | 'Manual'

  @Column({ nullable: true })
  lastSyncedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 3. BOM Entity (v4.0 - เพิ่ม BOQ Lifecycle)
```typescript
@Entity('bom')
export class BOM extends ExternalDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  rawMaterialId: string;

  @Column('decimal', { precision: 10, scale: 4 })
  quantity: number;

  @Column({ default: 'unit' })
  unit: string; // kg, m, mm, pcs, sheet, g, etc.

  @Column({ nullable: true })
  notes: string;

  @Column({ default: 'PRICECAL' })
  bomSource: string; // 'PRICECAL' | 'D365'

  @Column({ default: true })
  isEditable: boolean;

  // ===== BOQ Lifecycle Fields (v4.0) =====
  @Column({ default: 'DRAFT' })
  bomStatus: string;
  // 'DRAFT' = Dummy BOQ (แก้ไขได้)
  // 'PRODUCTION' = Production BOQ จาก D365 (Read-only)
  // 'ARCHIVED' = Dummy BOQ ที่ถูก replace (History)

  @Column({ nullable: true })
  copiedFrom: string; // Copy จาก Item ID ไหน

  @Column({ nullable: true })
  linkedDummyBomId: string; // For Production: Link to Dummy BOQ

  @Column({ nullable: true })
  linkedD365BomId: string; // For Dummy: Link to Production BOQ

  @Column({ nullable: true })
  archivedDate: Date;

  // ===== Future-Ready Fields (Phase 2) =====
  @Column({ default: false })
  isPushedToD365: boolean;

  @Column({ nullable: true })
  d365BomCreationDate: Date;

  @Column({ nullable: true })
  sourceSystem: string;

  @Column({ nullable: true })
  lastSyncedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 4. PriceRequest Entity
```typescript
@Entity('price_requests')
export class PriceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  customerId: string; // Nullable (FK constraint issue)

  @Column({ nullable: true })
  productId: string; // Nullable

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  productSpec: string;

  @Column({ default: 'new' })
  productType: string; // 'new' | 'existing'

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ default: 'Pending' })
  status: string; // 'Pending' | 'Calculated' | 'Approved' | 'Rejected'

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  calculatedPrice: number;

  @Column({ nullable: true })
  priceBasedOn: string; // 'DUMMY_BOQ' | 'PRODUCTION_BOQ'

  @Column({ nullable: true })
  assignedDummyId: string; // Dummy Item ที่ใช้

  @Column({ nullable: true })
  customerPO: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  createdBy: string; // Nullable

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 5. Customer Entity
```typescript
@Entity('customers')
export class Customer extends ExternalDataEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  customerGroupId: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  sourceSystem: string;

  @Column({ nullable: true })
  lastSyncedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 6. RawMaterial Entity
```typescript
@Entity('raw_materials')
export class RawMaterial extends ExternalDataEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  sourceSystem: string;

  @Column({ nullable: true })
  lastSyncedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 7. CustomerGroup Entity
```typescript
@Entity('customer_groups')
export class CustomerGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### 8. SyncConfig Entity
```typescript
@Entity('sync_configs')
export class SyncConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  entityType: string; // 'CUSTOMER', 'PRODUCT', 'RAW_MATERIAL', etc.

  @Column({ default: false })
  isEnabled: boolean; // Toggle เปิด/ปิด sync

  @Column({ default: 'MONGODB' })
  dataSource: string; // 'MONGODB' | 'API' | 'MANUAL'

  @Column({ nullable: true })
  mongoCollection: string;

  @Column({ nullable: true })
  mongoQuery: string;

  @Column({ default: 'MANUAL' })
  syncFrequency: string; // 'MANUAL' | 'DAILY' | 'HOURLY' | 'REAL_TIME'

  @Column({ nullable: true })
  lastSyncAt: Date;

  @Column({ nullable: true })
  lastSyncStatus: string; // 'success' | 'failed' | 'partial'

  @Column({ default: 0 })
  lastSyncRecords: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 9. ActivityLog Entity
```typescript
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'

  @Column()
  entityType: string; // 'PRICE_REQUEST', 'PRODUCT', 'CUSTOMER', etc.

  @Column({ nullable: true })
  entityId: string;

  @Column('text', { nullable: true })
  changes: string; // JSON string

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### 10-14. Master Data Entities
- **StandardPrice**: ราคามาตรฐานของวัตถุดิบ
- **LmeMasterData**: ราคา LME สำหรับโลหะ
- **ExchangeRateMasterData**: อัตราแลกเปลี่ยน
- **FabCost**: ต้นทุนการผลิต
- **SellingFactor**: ตัวคูณการขาย
- **SystemConfig**: การตั้งค่าระบบ

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (public endpoint)
- `POST /api/auth/register` - Register (admin only)

### Dummy Items Management (NEW v5.8)
- `GET /api/dummy-items/available` - ดึงรายการ Dummy Items ที่พร้อมใช้งาน
- `POST /api/dummy-items/generate` - สร้าง Dummy Items ใหม่ (Manual trigger)
- `POST /api/dummy-items/map-to-d365` - Manual Mapping: Dummy → D365
- `GET /api/dummy-items/pending-mappings` - ดึงรายการที่รอ Mapping
- `POST /api/dummy-items/check-availability` - ตรวจสอบและสร้าง Dummy Items (Manual Cron Trigger)

### Data Management
- `GET /api/data/products` - ดึงรายการ Products
- `GET /api/data/raw-materials` - ดึงรายการ Raw Materials
- `GET /api/data/customers` - ดึงรายการ Customers
- `GET /api/data/requests` - ดึงรายการ Price Requests
- `POST /api/data/requests` - สร้าง Price Request
- `PUT /api/data/requests/:id` - อัปเดต Price Request
- `PATCH /api/data/requests/:id/assign-dummy` - Assign Dummy Item to Request

### BOQ Management
- `GET /api/bom/product/:productId` - ดึง BOQ ของ Product
- `POST /api/bom` - สร้าง BOQ Item ใหม่
- `PUT /api/bom/:id` - อัปเดต BOQ Item
- `DELETE /api/bom/:id` - ลบ BOQ Item
- `POST /api/bom/copy` - Copy BOQ จาก Product อื่น
- `POST /api/bom/copy-from-d365` - Copy BOQ จาก D365 Master (Planned)

### Price Calculation
- `POST /api/price-calculation/calculate` - คำนวณราคา
  - Input: `{ productId, quantity, customerGroupId? }`
  - Output: `{ materialCosts, totalCost, sellingPrice, margin, masterDataVersions }`

### MongoDB Sync
- `POST /api/import/sync/customers` - Sync Customers
- `POST /api/import/sync/products` - Sync Products (Finished Goods)
- `POST /api/import/sync/standard-prices` - Sync Standard Prices
- `POST /api/import/sync/lme-prices` - Sync LME Prices
- `POST /api/import/sync/exchange-rates` - Sync Exchange Rates
- `POST /api/import/sync/all` - Sync ทุก entity พร้อมกัน

### Sync Configuration
- `GET /api/sync-config` - ดึงการตั้งค่าทั้งหมด
- `GET /api/sync-config/:entityType` - ดึงการตั้งค่าของ entity
- `GET /api/sync-config/summary/all` - สรุปสถานะ sync
- `POST /api/sync-config/:entityType/enable` - เปิด sync
- `POST /api/sync-config/:entityType/disable` - ปิด sync
- `PUT /api/sync-config/:entityType` - อัปเดทการตั้งค่า
- `POST /api/sync-config/initialize` - สร้างการตั้งค่าเริ่มต้น

### Activity Logs
- `GET /api/activity-logs` - ดึง Activity Logs (with pagination)

---

## Dummy Item & BOQ Lifecycle

### ภาพรวม Lifecycle (9 Phases)

```
Phase 1: Auto-Generate Dummy Items (System)
├─ Background job สร้าง FG-DUMMY-001, 002, 003...
├─ itemStatus: 'AVAILABLE'
└─ MIN_AVAILABLE: 20 items, BATCH_SIZE: 10

Phase 2: Sales สร้าง Request
├─ Sales สร้าง Price Request สำหรับสินค้าใหม่
└─ assignedDummyId: null (ยังไม่ assign)

Phase 3: Costing Team สร้าง BOQ
├─ Costing เลือก Dummy Item ที่ว่าง
├─ Assign Dummy to Request
├─ สร้าง BOQ โดย:
│  ├─ Copy จาก D365 BOQ Master (Option A)
│  ├─ Copy จาก Dummy BOQ อื่น (Option B)
│  └─ สร้างใหม่ทั้งหมด (Option C)
└─ itemStatus: 'AVAILABLE' → 'IN_USE'

Phase 4: Costing คำนวณราคา
├─ Calculate price จาก Dummy BOQ
├─ priceBasedOn: 'DUMMY_BOQ'
└─ แสดง Warning: "ราคาคำนวณจาก Dummy BOQ (อาจเปลี่ยนแปลง)"

Phase 5: เสนอราคา → ลูกค้าเปิด PO
├─ Sales เสนอราคา → Approve
├─ customerPO: 'PO-2025-001'
└─ awaitingD365Creation: true

Phase 6: Production สร้าง Item จริงบน D365
├─ (Manual Process นอกระบบ)
├─ Production สร้าง Item ใน D365
└─ ได้ D365 Item ID: 'D365-FG-5001'

Phase 7: Costing Team Manual Mapping ⭐ (Phase 1 - ปัจจุบัน)
├─ POST /api/dummy-items/map-to-d365
├─ Body: { dummyItemId, d365ItemId, customerPO, notes }
├─ itemStatus: 'IN_USE' → 'MAPPED'
├─ d365ItemId: 'D365-FG-5001'
└─ mappedDate, mappedBy

Phase 8: Sync D365 Item + BOQ กลับมา
├─ POST /api/import/sync/production-items (ดึงจาก MongoDB)
├─ สร้าง Production Item (D365-FG-5001)
├─ สร้าง Production BOQ (bomStatus: 'PRODUCTION')
├─ Update Dummy: itemStatus → 'REPLACED'
└─ Archive Dummy BOQ: bomStatus → 'ARCHIVED'

Phase 9: ใช้ Production Item ต่อไป
├─ ครั้งต่อไปใช้ D365-FG-5001
├─ Load Production BOQ (แม่นยำ)
└─ ไม่มี Warning
```

### Dummy Item States

```typescript
itemStatus: string
  - 'AVAILABLE'   = Dummy Item ยังว่าง (พร้อมใช้งาน)
  - 'IN_USE'      = Dummy กำลังใช้ใน Request
  - 'MAPPED'      = Dummy ถูก Map กับ D365 แล้ว
  - 'REPLACED'    = Dummy ถูก replace ด้วย Production Item
  - 'PRODUCTION'  = Production Item จาก D365
```

### BOQ States

```typescript
bomStatus: string
  - 'DRAFT'       = Dummy BOQ (แก้ไขได้)
  - 'PRODUCTION'  = Production BOQ จาก D365 (Read-only)
  - 'ARCHIVED'    = Dummy BOQ ที่ถูก replace (History)
```

### Auto-Generation Configuration

```typescript
// DummyItemsService Configuration
MIN_AVAILABLE = 20  // จำนวน Dummy Items ขั้นต่ำ
BATCH_SIZE = 10     // จำนวนที่สร้างในแต่ละครั้ง

// Background Job (Manual Trigger - Node.js v18 compatible)
POST /api/dummy-items/check-availability
```

### Workflow Example

```bash
# 1. Generate Dummy Items (Manual trigger)
POST /api/dummy-items/generate
Body: { count: 10 }

# 2. Get available Dummy Items
GET /api/dummy-items/available

# 3. Costing Team ใช้ FG-DUMMY-001 ใน Request
# ... (Sales สร้าง Request, Costing คำนวณราคา)

# 4. Production สร้าง Item ใน D365 (D365-FG-5001)
# 5. D365 → MongoDB sync (auto)
# 6. MongoDB → PriceCal sync
POST /api/import/sync/products

# 7. Costing Team ทำ Manual Mapping
POST /api/dummy-items/map-to-d365
Body: {
  dummyItemId: 'FG-DUMMY-001',
  d365ItemId: 'D365-FG-5001',
  customerPO: 'PO-2025-001',
  notes: 'Production created based on PO-2025-001'
}

# 8. Check pending mappings
GET /api/dummy-items/pending-mappings
```

---

## Implementation Checklist

### ✅ Phase 1: Manual Mapping (ปัจจุบัน)
- ✅ **Database schema พร้อม** (Product + BOM entities v4.0)
  - `server/src/entities/product.entity.ts` v4.0 (+15 fields)
  - `server/src/entities/bom.entity.ts` v4.0 (+7 fields)
- ✅ **Manual Mapping API** (POST /api/dummy-items/map-to-d365)
  - `server/src/dummy-items/dummy-items.service.ts` v1.1
  - `server/src/dummy-items/dummy-items.controller.ts` v1.0
  - `server/src/dummy-items/dummy-items.module.ts` v1.1
- ⏳ **Manual Mapping UI** (หน้าจอสำหรับ Costing Team)
  - Location: `client/src/pages/MasterData.tsx` → Tab: "Item Mapping"
  - Features:
    - แสดงรายการ Pending Mappings (GET /api/dummy-items/pending-mappings)
    - Form: Input D365 Item ID + Map button
    - แสดง Dummy Item details (name, PO, Request ID)
    - Success/Error messages
- ⏳ **Item Status Badges** (แสดง status ใน UI)
  - Location: `client/src/components/BOQViewer.tsx`, `client/src/pages/CreateRequest.tsx`
  - Badges:
    - 🟢 AVAILABLE (Green)
    - 🟡 IN_USE (Yellow)
    - 🔵 MAPPED (Blue)
    - ⚫ REPLACED (Gray)
    - 🟣 PRODUCTION (Purple)

### 📝 Phase 2: Prepare for Auto-Creation
- ✅ **Add future fields to entities** (เสร็จแล้ว)
  - isPushedToD365, d365CreationDate, d365CreationMethod
  - autoCreationFailed, autoCreationError
- ⏳ **Design D365 API integration interface**
  - Create D365ApiService interface
  - Define API endpoints: /create-item, /create-bom
  - Design authentication method (API Key, OAuth, etc.)
- ⏳ **Create "Ready for D365" validation endpoint**
  - GET /api/dummy-items/:id/ready-for-d365
  - Validate: BOQ complete, Price approved, PO exists
- ⏳ **Create retry mechanism design**
  - Design retry strategy (exponential backoff)
  - Error categorization (retryable vs non-retryable)
  - Retry queue management

### 🚀 Phase 3: Auto-Creation (อนาคต)
- ⏳ **D365 API client service**
  - Location: `server/src/d365/d365-api.service.ts`
  - Methods: createItem(), createBOM(), checkItemExists()
- ⏳ **Push Item to D365 API**
  - POST /api/dummy-items/:id/push-to-d365
  - Update itemStatus, isPushedToD365, d365CreationDate
- ⏳ **Push BOQ to D365 API**
  - POST /api/bom/:productId/push-to-d365
  - Update bomStatus, isPushedToD365, d365BomCreationDate
- ⏳ **Error handling & retry logic**
  - Implement retry mechanism
  - Log errors to ActivityLog
  - Update autoCreationFailed, autoCreationError
- ⏳ **Auto-creation UI**
  - Dashboard: แสดงสถานะการสร้างอัตโนมัติ
  - Retry button สำหรับ failed items
  - History log

---

## ปัญหาที่พบและแนวทางแก้ไข

### ✅ ปัญหาที่แก้ไขแล้ว

#### 1. Node.js v18 Crypto Compatibility Issue (v5.8)
**ปัญหา**:
```
ReferenceError: crypto is not defined
    at SchedulerOrchestrator.addCron (scheduler.orchestrator.js:90:38)
```

**สาเหตุ**: @nestjs/schedule package ใช้ `crypto.randomUUID()` โดยไม่ import crypto module (incompatible กับ Node.js v18)

**แนวทางแก้ไข**:
1. ❌ Comment Cron decorator → FAILED (ScheduleModule ยัง scan methods)
2. ❌ Remove Cron import → FAILED (ScheduleModule active)
3. ✅ **Remove ScheduleModule.forRoot()** → SUCCESS

**Solution**:
```typescript
// server/src/dummy-items/dummy-items.module.ts v1.1
@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    // ScheduleModule.forRoot(), // REMOVED - use manual trigger instead
  ],
  controllers: [DummyItemsController],
  providers: [DummyItemsService],
  exports: [DummyItemsService],
})
export class DummyItemsModule {}
```

**Alternative**: ใช้ manual trigger endpoints แทน Cron Job
```bash
POST /api/dummy-items/check-availability
```

---

#### 2. Foreign Key Constraint Issue (v3.10)
**ปัญหา**: "Failed to create the price request" error

**สาเหตุ**: Foreign Key constraints บน PriceRequest entity (customerId, productId, createdBy) บังคับให้มีค่า แต่ initial data ยังไม่มี

**แนวทางแก้ไข**: เปลี่ยน Foreign Key columns เป็น nullable
```typescript
// server/src/entities/price-request.entity.ts
@Column({ nullable: true })
customerId: string;

@Column({ nullable: true })
productId: string;

@Column({ nullable: true })
createdBy: string;
```

---

#### 3. JWT Response Format Mismatch (v5.5)
**ปัญหา**: Frontend ไม่รับ JWT token ("No token received from server")

**สาเหตุ**: Backend return `{ token, user }` แต่ Frontend expect `{ access_token, user }`

**แนวทางแก้ไข**: แก้ไข AuthService response format
```typescript
// server/src/auth/auth.service.ts v2.1
async login(username: string, password: string) {
  // ...
  return {
    access_token: this.jwtService.sign(payload), // เปลี่ยนจาก 'token'
    user: { id: user.id, username: user.username }
  };
}
```

---

#### 4. MongoDB Connection Blocking Application Startup (v5.3.1)
**ปัญหา**: Application ไม่ start ถ้า MongoDB ไม่พร้อม

**สาเหตุ**: MongodbModule ใช้ blocking connection โดย default

**แนวทางแก้ไข**: เพิ่ม non-blocking configuration
```typescript
// server/src/mongodb/mongodb.module.ts v3.1
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: process.env.MONGODB_URI,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    retryWrites: false,
    retryReads: false,
    autoCreate: false,
    autoIndex: false,
  }),
})
```

---

#### 5. Dependency Injection Error: StandardPriceRepository (v5.3.1)
**ปัญหา**: `StandardPriceRepository not found`

**สาเหตุ**: PriceCalculationModule ขาด entity registrations

**แนวทางแก้ไข**: เพิ่ม entities ใน TypeOrmModule.forFeature()
```typescript
// server/src/price-calculation/price-calculation.module.ts v4.0
@Module({
  imports: [
    TypeOrmModule.forFeature([
      StandardPrice,     // เพิ่ม
      LmeMasterData,     // เพิ่ม
      FabCost,           // เพิ่ม
      SellingFactor,     // เพิ่ม
      ExchangeRateMasterData, // เพิ่ม
    ]),
  ],
  // ...
})
```

---

### ⏳ ปัญหาที่รอแก้ไข / Known Issues

#### 1. Cron Job Disabled (Workaround Active)
**สถานะ**: Workaround ใช้งานได้ (Manual trigger)

**แนวทางแก้ไขถาวร**:
- Option A: รอ @nestjs/schedule อัปเดตสำหรับ Node.js v18
- Option B: สร้าง Custom Scheduler Service โดยใช้ node-cron โดยตรง
- Option C: Upgrade Node.js เป็น v20+ (ตรวจสอบ compatibility ก่อน)

**Workaround ปัจจุบัน**: ใช้ manual trigger ผ่าน API
```bash
POST /api/dummy-items/check-availability
```

---

#### 2. Sync Production Items from D365 (Planned)
**สถานะ**: ยังไม่ได้ทำ (รออัพเดต Import API)

**แนวทางแก้ไข**:
- ใช้ MongoDB เป็น data source (D365 → MongoDB → PriceCal)
- สร้าง endpoint: `POST /api/import/sync/production-items`
- Filter เฉพาะ Production Items ที่มี linkedDummyId

---

#### 3. Manual Mapping UI (In Progress)
**สถานะ**: Backend API พร้อมแล้ว, รอสร้าง Frontend UI

**แนวทางแก้ไข**: สร้าง UI component ใน Master Data → Tab: "Item Mapping"

---

## Development Workflow

### การเพิ่ม Feature ใหม่

1. **Design Phase**
   - อ่าน CLAUDE.md และ PROJECT_DOCUMENTATION.md
   - ออกแบบ Database Schema (ถ้าต้องเพิ่ม fields)
   - ออกแบบ API endpoints
   - ออกแบบ UI/UX mockups

2. **Backend Development**
   - สร้าง/แก้ไข Entity (TypeORM)
   - สร้าง Service (Business Logic)
   - สร้าง Controller (REST API)
   - สร้าง Module (NestJS Module)
   - เพิ่ม Module ใน AppModule
   - Test API ด้วย curl/Postman

3. **Frontend Development**
   - สร้าง/แก้ไข Component
   - เพิ่ม API calls (ใช้ centralized `api` instance)
   - เพิ่ม Pages/Routes (ถ้าจำเป็น)
   - Test ใน browser

4. **Documentation**
   - อัพเดท CHANGELOG.md (เพิ่ม version entry)
   - อัพเดท PROJECT_DOCUMENTATION.md (section ที่เกี่ยวข้อง)
   - อัพเดท CLAUDE.md (ถ้ามีการเปลี่ยนแปลง architecture)

5. **Git Commit**
   - Stage changes: `git add .`
   - Commit: `git commit -m "feat: <description>"`
   - เพิ่ม Co-Authored-By: Claude

### Code Style Guidelines

**File Header**:
```typescript
// path: server/src/dummy-items/dummy-items.service.ts
// version: 1.1
// last-modified: 15 ตุลาคม 2568 10:30
```

**Backend (NestJS)**:
- ใช้ NestJS decorators (`@Controller`, `@Injectable`, `@Get`, `@Post`)
- Return format: `{ success: boolean, message: string, data?: any }`
- Log การทำงานด้วย `console.log` สำหรับ debugging
- Error handling: try-catch + return error response

**Frontend (React)**:
- ใช้ TypeScript strict mode
- State types ระบุชัดเจน
- ใช้ Tailwind CSS classes สำหรับ styling
- ใช้ centralized `api` instance (ไม่ใช้ fetch() หรือ local axios)

**ห้าม**:
- ❌ Mock data / Hardcode data
- ❌ Bypass authentication
- ❌ ใช้ absolute URLs ใน API calls (ใช้ relative paths)
- ❌ แก้ไข function ที่ไม่เกี่ยวข้อง
- ❌ ปรับปรุง UX/UI โดยไม่จำเป็น

---

## การติดตั้งและรันโปรเจค

### Requirements
- Node.js v18.17.1 หรือสูงกว่า
- npm 9.x หรือสูงกว่า
- MongoDB (ถ้าต้องการ sync จาก D365)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd PriceCal

# 2. Install dependencies (Backend)
cd server
npm install
cd ..

# 3. Install dependencies (Frontend)
cd client
npm install
cd ..
```

### Environment Configuration

**Backend (.env)**:
```env
# Database
DATABASE_TYPE=sqlite
DATABASE_PATH=database.sqlite

# JWT
JWT_SECRET=change-this-to-a-secure-random-string-in-production

# MongoDB (Optional)
ENABLE_MONGODB=true
MONGODB_URI=mongodb://localhost:27017/d365_data

# Server
PORT=3001
```

**Frontend**:
- ไม่ต้องตั้งค่า .env (ใช้ Vite default port 5173)

### Running the Project

**Backend**:
```bash
cd server
npm run start:dev    # Development mode (watch)
npm run build        # Build for production
npm run start        # Production mode
```

**Frontend**:
```bash
cd client
npm run dev          # Development mode
npm run build        # Build for production
npm run preview      # Preview production build
```

### First Time Setup

1. เข้า: `http://localhost:5173`
2. Setup Wizard จะแสดงขึ้นมา (ครั้งแรก)
3. กรอกข้อมูลเริ่มต้น (ชื่อบริษัท, admin user)
4. ระบบจะ seed ข้อมูลเริ่มต้น (Customers, Products, Raw Materials)
5. Login ด้วย admin account

### Default Login (After Seeding)
- Username: `admin`
- Password: `admin123` (แนะนำให้เปลี่ยนหลัง login)

### Database Seeding

ระบบจะ seed ข้อมูลอัตโนมัติเมื่อ backend start ครั้งแรก:
- 1 Admin User
- 5 Customers
- 10 Raw Materials
- 5 Finished Goods (Products)
- 3 Customer Groups
- Standard Prices, LME Prices, Exchange Rates, FAB Costs, Selling Factors

### MongoDB Setup (Optional)

ถ้าต้องการ sync ข้อมูลจาก D365 ผ่าน MongoDB:

1. ติดตั้ง MongoDB locally หรือใช้ MongoDB Atlas
2. ตั้งค่า MONGODB_URI ใน .env
3. Import ข้อมูลจาก D365 เข้า MongoDB (external process)
4. ใช้ UI: Master Data → MongoDB Sync → Import Data

### Testing

```bash
# Backend (ยังไม่มี tests)
cd server
npm run test

# Frontend (ยังไม่มี tests)
cd client
npm run test
```

### Troubleshooting

**Backend ไม่ start**:
- ตรวจสอบ port 3001 ว่าว่างหรือไม่
- ตรวจสอบ JWT_SECRET ใน .env
- ตรวจสอบ database.sqlite permissions

**Frontend ไม่เชื่อมต่อ Backend**:
- ตรวจสอบ Backend รันที่ port 3001
- ตรวจสอบ CORS settings ใน Backend
- ตรวจสอบ JWT token ใน localStorage

**401 Unauthorized Error**:
- ลบ token ใน localStorage: `localStorage.removeItem('token')`
- Login ใหม่
- ตรวจสอบ JWT_SECRET ใน Backend

**MongoDB Connection Error**:
- ตรวจสอบ MONGODB_URI
- MongoDB service รันอยู่หรือไม่
- ถ้าไม่ต้องการใช้: ตั้ง `ENABLE_MONGODB=false`

---

## ภาคผนวก

### Version History Summary

| Version | Date | Major Features |
|---------|------|----------------|
| v5.8 | 2025-10-14 | Dummy Item & BOQ Lifecycle Management |
| v5.7 | 2025-10-14 | BOQ Management System (Viewer + Editor) |
| v5.6 | 2025-10-14 | Master Data Tabs Redesign (11 → 7 tabs) |
| v5.5 | 2025-10-14 | Frontend JWT Authentication Integration |
| v5.4 | 2025-10-14 | MongoDB Primary + Security Enhancement |
| v5.3 | 2025-10-09 | Universal Sync with Toggle Control |
| v5.1 | 2025-10-07 | Price Calculation Engine |
| v5.0 | 2025-10-01 | UI Restructure & User Profile |
| v4.1 | 2025-10-01 | Master Data Viewer |
| v4.0 | 2025-10-01 | API-Based Master Data Import System |
| v3.10 | 2025-09-22 | Fixed Foreign Key constraints + Database migration |

### Useful Commands

```bash
# Git
git status
git log --oneline -10
git diff

# TypeScript Check
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit

# Linting
cd server && npm run lint
cd client && npm run lint

# Format
cd server && npm run format

# Database
# Backup SQLite
cp server/database.sqlite server/database.sqlite.backup

# Reset SQLite (CAUTION: ลบข้อมูลทั้งหมด)
rm server/database.sqlite
# จากนั้นรัน backend ใหม่ (จะ seed ข้อมูลใหม่)

# Check running processes
netstat -ano | findstr :3001  # Backend port
netstat -ano | findstr :5173  # Frontend port
```

### Key Files Reference

**Documentation**:
- `PROJECT_DOCUMENTATION.md` - เอกสารฉบับนี้
- `CHANGELOG.md` - ประวัติการเปลี่ยนแปลงทั้งหมด
- `CLAUDE.md` - Claude Code instructions
- `README.md` - Quick start guide

**Backend Core**:
- `server/src/main.ts` - Entry point
- `server/src/app.module.ts` - Main module
- `server/src/entities/` - Database entities
- `server/database.sqlite` - SQLite database

**Frontend Core**:
- `client/src/main.tsx` - Entry point
- `client/src/App.tsx` - Root component
- `client/src/services/api.ts` - Centralized API client
- `client/src/pages/` - Page components
- `client/src/components/` - Reusable components

---

**End of Documentation**

**Last Updated**: 15 ตุลาคม 2568
**Document Version**: 1.0
**Project Version**: 5.8
