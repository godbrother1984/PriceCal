# PriceCal Project Documentation

**Project Name**: PriceCal - ระบบคำนวณราคาสำหรับองค์กร
**Version**: 7.7 (Phase 2: Customer Group Override System - Backend Complete)
**Last Updated**: 29 ตุลาคม 2568 17:40
**Documentation Path**: `C:\Project\PriceCal\PROJECT_DOCUMENTATION.md`

---

## 📋 สารบัญ

1. [ภาพรวมโครงการ](#ภาพรวมโครงการ)
2. [สถานะการพัฒนา](#สถานะการพัฒนา)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Database Schema](#database-schema)
5. [Entity Field Naming Standards](#entity-field-naming-standards)
6. [API Endpoints](#api-endpoints)
7. [Dummy Item & BOQ Lifecycle](#dummy-item--boq-lifecycle)
8. [Implementation Checklist](#implementation-checklist)
9. [ปัญหาที่พบและแนวทางแก้ไข](#ปัญหาที่พบและแนวทางแก้ไข)
10. [Development Workflow](#development-workflow)
11. [การติดตั้งและรันโปรเจค](#การติดตั้งและรันโปรเจค)

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

### 🔄 สถานะล่าสุด (v7.7 - Phase 2: Customer Group Override System - Backend Complete)

**ภาพรวมการเปลี่ยนแปลงล่าสุด:**
ระบบ Customer Group Override ที่ช่วยให้สามารถกำหนดราคาพิเศษสำหรับกลุ่มลูกค้าเฉพาะได้ (Backend สำเร็จ 100%)

**การเปลี่ยนแปลงหลัก (v7.7):**

1. **🏢 Customer Groups Module (Backend)**
   - ✅ **customer-groups.service.ts** v1.0
     - Generic service รองรับ 5 override types (fab-cost, selling-factor, lme-price, exchange-rate, standard-price)
     - Customer Group CRUD operations
     - Customer Mapping management (ลูกค้า → กลุ่ม)
     - Override CRUD with version control (Draft → Active → Archived)
     - Archive logic เมื่อ approve version ใหม่

   - ✅ **customer-groups.controller.ts** v1.0
     - RESTful APIs สำหรับ Customer Groups (5 endpoints)
     - Customer Mapping APIs (3 endpoints)
     - Generic Override APIs (6 endpoints × 5 types = 30 endpoints)
     - ป้องกันด้วย JwtAuthGuard

   - ✅ **customer-groups.module.ts** v1.0
     - TypeORM integration กับ Override entities ทั้ง 5 ตัว
     - Export CustomerGroupsService

2. **💰 Price Calculation Integration**
   - ✅ **price-calculation.service.ts** v3.5 → v4.0
     - แก้ไข `getStandardPrice()` - ตรวจสอบ Override ก่อน Master Data
     - แก้ไข `getLmePrice()` - ตรวจสอบ Override ก่อน Master Data
     - แก้ไข `getRawMaterialFabCost()` - ตรวจสอบ Override ก่อน Master Data
     - แก้ไข `getSellingFactor()` - ตรวจสอบ Override ก่อน Master Data
     - แก้ไข `getExchangeRateFromThbToCurrency()` - ตรวจสอบ Override ก่อน Master Data

   - ✅ **price-calculation.module.ts** v5.0 → v6.0
     - เพิ่ม Override entities ทั้ง 5 ตัวใน TypeORM imports

3. **🔄 Price Calculation Flow with Overrides**
   ```
   1. ตรวจสอบว่ามี customerGroupId หรือไม่
   2. ถ้ามี → ค้นหา Override (status=Active, isActive=true)
   3. ถ้าเจอ Override → ใช้ราคาจาก Override
   4. ถ้าไม่เจอ → ใช้ Master Data (Global Default)
   ```

4. **📋 API Endpoints เพิ่มเติม (30+ endpoints)**
   - Customer Group CRUD (5 endpoints)
   - Customer Mapping (3 endpoints)
   - Generic Override APIs (6 endpoints × 5 types)
   - Override Types: fab-cost, selling-factor, lme-price, exchange-rate, standard-price

5. **📊 Version Control for Overrides**
   - สร้าง Override → status = Draft
   - อนุมัติ → status = Active + Archive เก่าอัตโนมัติ
   - แก้ไขได้เฉพาะ Draft
   - ลบได้เฉพาะ Draft

**ประโยชน์:**
- ✅ รองรับราคาพิเศษสำหรับกลุ่มลูกค้าเฉพาะ
- ✅ ไม่กระทบ Master Data (Global Default)
- ✅ Version control ครบถ้วน
- ✅ Generic API design (DRY principle)

**Next Steps (Phase 2 Frontend):**
- ⏸️ Customer Groups Management UI
- ⏸️ Override Management Components (7 tabs)
- ⏸️ End-to-end testing

---

### 🔄 สถานะก่อนหน้า (v7.6 - Entity Field Naming Standardization)

**ภาพรวม:** Standardize field naming conventions across all entities และ history entities

---

### 🔄 สถานะก่อนหน้า (v7.5 - Standard Price Version Control Removed)

**ภาพรวมการเปลี่ยนแปลงล่าสุด:**
ลบ Version Control ออกจาก **Standard Price** เพราะเป็นข้อมูลที่ Sync จาก MongoDB (Read-Only)

**การเปลี่ยนแปลงหลัก (v7.5):**

1. **📊 Standard Price = Read-Only MongoDB Data**
   - ✅ เปลี่ยน StandardPrice จาก `VersionedEntity` → `ExternalDataEntity`
   - ✅ ลบ fields: status, version, approvedBy, effectiveFrom, effectiveTo, changeReason
   - ✅ เหลือเฉพาะ: sourceSystem, lastSyncedAt, isActive (จาก ExternalDataEntity)

2. **🗑️ ลบ Code ที่ไม่จำเป็น**
   - ✅ ลบ `standard-price-history.entity.ts` ทั้งไฟล์
   - ✅ ลบ methods (~400 lines): rollback, approve, update, delete, history methods
   - ✅ ลบ API endpoints (10 endpoints)
   - ✅ แก้ไข queries ใน dashboard.service.ts, seeder.service.ts, price-calculation.service.ts

3. **🎯 ความแตกต่าง: Read-Only vs Version-Controlled Master Data**

   **Read-Only (ExternalDataEntity)** - Sync from MongoDB:
   - Customer
   - Product
   - RawMaterial
   - **StandardPrice** ✨ เพิ่งย้ายมาจาก Version-Controlled

   **Version-Controlled (VersionedEntity)** - User-Created:
   - LME Master Data
   - Exchange Rate Master Data
   - FAB Cost
   - Selling Factor
   - Scrap Allowance

### 🔄 สถานะก่อนหน้า (v7.0 - Customer Group-Centric System)

**ภาพรวมการเปลี่ยนแปลงครั้งใหญ่:**
ปรับโครงสร้างระบบจาก **Master Data-Centric** → **Customer Group-Centric** พร้อม Complete Snapshot System

**การเปลี่ยนแปลงหลัก:**

1. **🎯 Customer Group Management (All-in-One)**
   - ✅ รวม Customer Group Mapping เข้ากับ Master Data Override
   - ✅ UI แบบ Sidebar + Tabs รองรับ 10+ Customer Groups
   - ✅ จัดการทุกอย่างในที่เดียว: Group Info, Customers, Overrides (LME, FAB, Factor, ExRate, StdPrice)

2. **📊 Master Data = Global Default (ไม่มี Customer Group)**
   - ✅ ลบ `customerGroupId` จาก Master Data Entities ทั้งหมด
   - ✅ Master Data เป็นค่า Default สำหรับทุก Customer ที่ไม่มี Override
   - ✅ ไม่มี "Default Customer Group" อีกต่อไป

3. **⚡ Master Data Override System (Version Control)**
   - ✅ สร้าง 5 Override Entities พร้อม Version Control เต็มรูปแบบ
   - ✅ Override History (5 tables) สำหรับ Document Control
   - ✅ Workflow: Draft → Approve → Active (เหมือน Master Data)
   - ✅ Activate Old Version ได้ (Restore from History)

4. **📸 Complete Snapshot System**
   - ✅ บันทึกทุกอย่างลง PriceCalculationLog (Customer, Product, BOM, Master Data, Overrides)
   - ✅ UI แบบ Progressive Disclosure (Compact → Expandable Modal)
   - ✅ Export: JSON, PDF, Copy to Clipboard

5. **🗄️ MongoDB Integration (No Mock Data)**
   - ✅ เพิ่ม Collections: customers, products, rawMaterials, fabPatterns, itemGroups, currencies
   - ✅ Sync Service ดึงข้อมูลจาก MongoDB
   - ✅ ลบ Mock/Hardcode data ทั้งหมด

6. **📝 Activity Log System (ครบถ้วน)**
   - ✅ Log ทุก events: Customer Group, Override, Master Data, Calculation
   - ✅ เก็บ Before/After (JSON Diff)
   - ✅ Metadata: customerGroupId, version, reason, IP, User Agent

**Database Schema Changes (v7.5 - Standard Price):**
```sql
-- v7.5: ลบ Version Control จาก Standard Price
ALTER TABLE standard_prices DROP COLUMN status;
ALTER TABLE standard_prices DROP COLUMN version;
ALTER TABLE standard_prices DROP COLUMN approvedBy;
ALTER TABLE standard_prices DROP COLUMN approvedAt;
ALTER TABLE standard_prices DROP COLUMN effectiveFrom;
ALTER TABLE standard_prices DROP COLUMN effectiveTo;
ALTER TABLE standard_prices DROP COLUMN changeReason;

-- v7.5: ลบ History Table
DROP TABLE standard_price_history;

-- v7.5: เพิ่ม External Data Fields (if not exist)
-- sourceSystem, lastSyncedAt, isActive (inherited from ExternalDataEntity)
```

**Database Schema Changes (v7.0 - Customer Group):**
```sql
-- ลบ customerGroupId จาก Master Data
ALTER TABLE standard_prices DROP COLUMN customerGroupId;
ALTER TABLE lme_master_data DROP COLUMN customerGroupId;
ALTER TABLE fab_costs DROP COLUMN customerGroupId;
ALTER TABLE selling_factors DROP COLUMN customerGroupId;
ALTER TABLE exchange_rate_master_data DROP COLUMN customerGroupId;

-- เพิ่ม Override Tables (5 types)
CREATE TABLE customer_group_standard_price_override (...);
CREATE TABLE customer_group_lme_price_override (...);
CREATE TABLE customer_group_fab_cost_override (...);
CREATE TABLE customer_group_selling_factor_override (...);
CREATE TABLE customer_group_exchange_rate_override (...);

-- เพิ่ม Override History Tables (5 types)
CREATE TABLE customer_group_standard_price_override_history (...);
-- ... (4 more)

-- ลบ action field จาก History Tables
ALTER TABLE fab_cost_history DROP COLUMN action;
ALTER TABLE selling_factor_history DROP COLUMN action;
ALTER TABLE lme_price_history DROP COLUMN action;
ALTER TABLE exchange_rate_history DROP COLUMN action;
```

**API Endpoints ใหม่:**
```
Customer Groups:
GET    /api/customer-groups
GET    /api/customer-groups/:id
POST   /api/customer-groups
PUT    /api/customer-groups/:id
DELETE /api/customer-groups/:id

Customer Mapping:
POST   /api/customer-groups/:groupId/customers
DELETE /api/customer-groups/:groupId/customers/:customerId

Master Data Overrides (5 types):
GET    /api/customer-groups/:groupId/overrides/:type
GET    /api/customer-groups/:groupId/overrides/:type/:id
POST   /api/customer-groups/:groupId/overrides/:type
PUT    /api/customer-groups/:groupId/overrides/:type/:id
DELETE /api/customer-groups/:groupId/overrides/:type/:id
PUT    /api/customer-groups/:groupId/overrides/:type/:id/approve
POST   /api/customer-groups/:groupId/overrides/:type/:id/activate-version

Override History:
GET    /api/customer-groups/:groupId/overrides/:type/:id/history
```

**UI Components ใหม่:**
- `CustomerGroupList` (Sidebar + Search + Status)
- `CustomerGroupTabs` (7 tabs: Info, LME, FAB, Factor, ExRate, StdPrice)
- `OverrideCard` (Current Active + Pending Approval)
- `VersionHistoryModal` (Document Control)
- `SnapshotViewer` (Progressive Disclosure)

**สิ่งที่ยังต้องทำ (v7.1):**
- Migration Script สำหรับ customerGroupId ที่มีอยู่แล้ว
- Unit Tests สำหรับ Override System
- Performance Testing (10+ Groups)

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

### 🚧 Development Roadmap (6 Phases to Version 7.0)

#### ✅ Phase 0: Dashboard & Task Center (เสร็จแล้ว)
- ✅ Dashboard Overview with Key Metrics
- ✅ Task Center for Pending Actions
- ✅ Customer Group Management UI (Sidebar + 7 Tabs)
- ✅ Activity Log System with Filters

#### 🎉 Phase 1: Document Control & Version Management (เสร็จสมบูรณ์ - 29 ตุลาคม 2568)
- ✅ Archive Logic เมื่อ approve version ใหม่
- ✅ Rollback/Restore Version API (4 methods - ไม่รวม Standard Price)
- ✅ Version Control สำหรับ Master Data ทั้ง 4 ประเภท:
  - ✅ LME Master Data (Version Control)
  - ✅ Exchange Rate Master Data (Version Control)
  - ✅ FAB Cost (Version Control)
  - ✅ Selling Factor (Version Control)
  - ❌ Standard Price (ลบ Version Control แล้ว - เป็น Read-Only MongoDB Data)
- ✅ **Version History UI Modal** (Timeline view + Rollback button)
- ✅ **History Button ใน Master Data Tables** (3 tables: LME, FAB, Selling Factor)
- ✅ **Toast Notification System** (แทน alert() dialogs)
- ✅ **API Testing** (Version History + Rollback workflow tested)
- ✅ **Approve/Delete/Rollback Validation UI** (แสดง error messages ที่ชัดเจน)
- ✅ **Standard Price Migration** (v7.5 - 29 ตุลาคม 2568)
  - ✅ เปลี่ยนจาก VersionedEntity → ExternalDataEntity
  - ✅ ลบ version control code ทั้งหมด (~400 lines)
  - ✅ แก้ไข queries ใน 3 services

**เป้าหมาย**: ให้ผู้ใช้สามารถดู version history และ restore version เก่ากลับมาใช้ได้สำหรับ User-Created Master Data ✅ **COMPLETE**

#### 📝 Phase 2: UI/UX Improvements & New Features (วางแผนไว้ - 2-3 สัปดาห์)
- ⏳ **Tab Reordering**: ย้าย LME Master Data ไว้ก่อน FAB Cost
- ⏳ **Scrap Allowance Master Data**: ค่าเผื่อของเสีย (% ของน้ำหนัก RM) ตาม Item Group Code
- ⏳ **Formula Constants/Variables**: ตัวแปรในสูตร (markup, overhead) พร้อม version control
- ⏳ **Free Text Raw Material**: เพิ่ม RM แบบ free text ใน Dummy BOQ (ชื่อ, ราคา, หน่วย)
- ⏳ **Customer Group Override System**: Override Master Data ต่อ Customer Group

**เป้าหมาย**: ปรับปรุง UX และเพิ่มฟีเจอร์ใหม่ตามความต้องการของผู้ใช้

#### 📝 Phase 3: Manual Mapping UI (วางแผนไว้ - 1-2 สัปดาห์)
- ✅ Database schema พร้อม
- ✅ Manual Mapping API พร้อม
- ⏳ Item Mapping Tab ใน Master Data
- ⏳ Pending Mappings Table + Form
- ⏳ Item Status Badges (ทุกหน้า: BOQViewer, CreateRequest, etc.)

**เป้าหมาย**: Costing Team สามารถ map Dummy Item → D365 Item ได้ง่าย

#### 📝 Phase 4: D365 Auto-Creation Prep (วางแผนไว้ - 2-3 สัปดาห์)
- ⏳ D365 API Service (Mock)
- ⏳ Ready for D365 Validation Endpoint
- ⏳ Retry Queue System Design
- ⏳ Auto-Creation Dashboard (Mock)
- ⏳ Error Handling & Categorization

**เป้าหมาย**: เตรียมโครงสร้างสำหรับการสร้าง Item อัตโนมัติใน D365

#### 📝 Phase 5: Employee Entity & Production (วางแผนไว้ - 2-3 สัปดาห์)
- ⏳ Employee Entity (sync from MongoDB)
- ⏳ Update Audit Trail ใช้ employeeId แทน username
- ⏳ Role-Based Access Control (RBAC)
- ⏳ PostgreSQL Support + Docker Setup
- ⏳ Production Deployment Preparation

**เป้าหมาย**: ระบบพร้อมสำหรับ Production environment

#### 📝 Phase 6: D365 Auto-Creation Production (วางแผนไว้ - 3-4 สัปดาห์)
- ⏳ เชื่อม D365 API จริง
- ⏳ Background Jobs (Retry Queue)
- ⏳ Monitoring Dashboard
- ⏳ Error Tracking & Alerting
- ⏳ Production Deployment

**เป้าหมาย**: ระบบสร้าง Item ใน D365 อัตโนมัติได้จริง

**รวมเวลาประมาณ**: 13-19 สัปดาห์ (3-5 เดือน)

#### Future Enhancements (หลัง Phase 6)
- ⏳ BOQ Comparison View (เปรียบเทียบ Dummy BOQ vs Production BOQ)
- ⏳ Warning Banners (แจ้งเตือนเมื่อใช้ Dummy Item)
- ⏳ Advanced Analytics (สถิติการใช้งาน, ราคาเฉลี่ย, Margin trends)
- ⏳ Mobile App Support

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

**Read-Only MongoDB Data (ExternalDataEntity):**
- **StandardPrice**: ราคามาตรฐานของวัตถุดิบ (Sync from MongoDB, ไม่มี version control)

**Version-Controlled User Data (VersionedEntity):**
- **LmeMasterData**: ราคา LME สำหรับโลหะ (Draft → Active → Archived)
- **ExchangeRateMasterData**: อัตราแลกเปลี่ยน (Draft → Active → Archived)
- **FabCost**: ต้นทุนการผลิต (Draft → Active → Archived)
- **SellingFactor**: ตัวคูณการขาย (Draft → Active → Archived)
- **ScrapAllowance**: ค่าเผื่อของเสีย (Draft → Active → Archived)

**System Data:**
- **SystemConfig**: การตั้งค่าระบบ

---

## Entity Field Naming Standards

### มาตรฐานการตั้งชื่อ Field ใน Entity (Updated: 29 ตุลาคม 2568 08:00)

เพื่อให้มีความสอดคล้องและง่ายต่อการบำรุงรักษา ระบบกำหนดมาตรฐานการตั้งชื่อ field ดังนี้:

### 1. Base Entity Classes

#### BaseEntity (ทุก Entity ควร extend)
```typescript
export abstract class BaseEntity {
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;          // วันที่สร้าง record

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;          // วันที่แก้ไข record ล่าสุด

  @Column({ nullable: true })
  createdBy: string;        // User ID ของผู้สร้าง

  @Column({ nullable: true })
  updatedBy: string;        // User ID ของผู้แก้ไขล่าสุด
}
```

#### VersionedEntity (สำหรับ Master Data ที่ต้องการ Version Control)
```typescript
export abstract class VersionedEntity extends BaseEntity {
  @Column({ default: 1 })
  version: number;          // Version number

  @Column({ default: 'Draft' })
  status: string;           // 'Draft', 'Pending_Approval', 'Approved', 'Archived'

  @Column({ nullable: true })
  approvedBy: string;       // User ID ของผู้อนุมัติ

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;         // วันที่อนุมัติ

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;      // วันที่เริ่มมีผล

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;        // วันที่สิ้นสุด

  @Column({ default: true })
  isActive: boolean;        // สถานะการใช้งาน

  @Column({ type: 'text', nullable: true })
  changeReason: string;     // เหตุผลการเปลี่ยนแปลง
}
```

#### ExternalDataEntity (สำหรับข้อมูลที่ Sync จาก External System)
```typescript
export abstract class ExternalDataEntity extends BaseEntity {
  @Column({ nullable: true })
  externalId: string;       // ID จากระบบภายนอก

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date;         // วันที่ Sync ล่าสุด

  @Column({ nullable: true })
  source: string;           // แหล่งที่มา (เช่น 'D365_API', 'LME_API', 'MONGODB')

  @Column({ nullable: true })
  dataSource: string;       // ประเภทแหล่งข้อมูล: 'REST_API' หรือ 'MONGODB'

  @Column({ default: true })
  isActive: boolean;        // สถานะการใช้งาน
}
```

### 2. History Entity Standards

History entities ใช้สำหรับเก็บประวัติการเปลี่ยนแปลงของ Master Data ที่มี Version Control

**โครงสร้างมาตรฐาน:**
```typescript
@Entity('table_name_history')
export class EntityNameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Reference to Main Entity
  @Column({ nullable: true })
  entityId: string;         // เช่น fabCostId, sellingFactorId, lmePriceId

  // Version Information
  @Column({ nullable: true })
  version: number;

  // ทุก field จาก Main Entity ที่ต้องการเก็บ history
  // ... (copy จาก main entity)

  // Approval Information (snapshot)
  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  // History Metadata (ใช้ createdBy/createdAt เหมือน BaseEntity)
  @Column({ nullable: true })
  createdBy: string;        // ⚠️ User ID ของผู้สร้าง history record นี้

  @CreateDateColumn()
  createdAt: Date;          // ⚠️ วันที่สร้าง history record นี้

  @Column({ type: 'text', nullable: true })
  changeReason: string;
}
```

**หลักการสำคัญ:**
1. ✅ **ใช้ `createdBy` และ `createdAt`** - ไม่ใช้ `changedBy` หรือ `changedAt`
2. ✅ **ห้ามมี fields ที่ไม่มีใน Main Entity** - เช่น `priceDate`, `source` (ยกเว้น metadata fields)
3. ✅ **ต้องมี `description` ถ้า Main Entity มี** - ให้เก็บ snapshot ครบถ้วน

### 3. ตัวอย่าง Entity ที่ใช้ Base Classes

**Read-Only Entities (ExternalDataEntity):**
- ✅ Customer - Sync จาก MongoDB
- ✅ Product - Sync จาก MongoDB
- ✅ RawMaterial - Sync จาก MongoDB
- ✅ StandardPrice - Sync จาก MongoDB (ไม่มี Version Control)

**Version-Controlled Entities (VersionedEntity):**
- ✅ FabCost - พร้อม History
- ✅ SellingFactor - พร้อม History
- ✅ LmeMasterData - พร้อม History
- ✅ ExchangeRateMasterData - พร้อม History
- ✅ ScrapAllowance - พร้อม History

### 4. การใช้งาน History Entities

**การสร้าง History Record:**
```typescript
// ✅ ถูกต้อง
private async createFabCostHistory(cost: FabCost, userId: string) {
  const history = this.fabCostHistoryRepository.create({
    fabCostId: cost.id,
    version: cost.version || 1,
    name: cost.name,
    costPerHour: cost.costPerHour,
    currency: cost.currency,
    description: cost.description,
    status: cost.status,
    approvedBy: cost.approvedBy,
    approvedAt: cost.approvedAt,
    effectiveFrom: cost.effectiveFrom,
    effectiveTo: cost.effectiveTo,
    createdBy: userId,        // ✅ ใช้ createdBy
    changeReason: cost.changeReason
  });
  await this.fabCostHistoryRepository.save(history);
}

// ❌ ผิด - ไม่ควรใช้
// changedBy: userId  // ❌ ไม่ใช้ชื่อนี้
// changedAt: new Date()  // ❌ ไม่ต้องกำหนด ให้ @CreateDateColumn จัดการ
```

### 5. Field Naming Conventions

**ชื่อ Field ที่ควรใช้:**
| Concept | Correct ✅ | Incorrect ❌ |
|---------|-----------|-------------|
| วันที่สร้าง | `createdAt` | `created`, `createDate` |
| วันที่แก้ไข | `updatedAt` | `updated`, `modifiedAt` |
| ผู้สร้าง | `createdBy` | `creator`, `changedBy` |
| ผู้แก้ไข | `updatedBy` | `modifier`, `changedBy` |
| วันที่อนุมัติ | `approvedAt` | `approvalDate`, `approveDate` |
| ผู้อนุมัติ | `approvedBy` | `approver`, `approvedUser` |
| วันที่มีผล | `effectiveFrom` | `effectiveDate`, `startDate` |
| วันที่สิ้นสุด | `effectiveTo` | `expiryDate`, `endDate` |
| สถานะใช้งาน | `isActive` | `active`, `status` |
| เหตุผล | `changeReason` | `reason`, `remark` |

### 6. Customer Group Override History Entities

Override History entities ต้องสอดคล้องกับ Main Override Entities:

**ต้องมี fields เหล่านี้:**
- `overrideId` - reference to main override record
- `customerGroupId` - Customer Group ที่เกี่ยวข้อง
- ทุก business fields จาก main entity
- `description` - ถ้า main entity มี (⚠️ สำคัญ)
- `version`, `status`, `approvedBy`, `approvedAt`
- `effectiveFrom`, `effectiveTo`
- `createdBy`, `createdAt` (ไม่ใช่ changedBy/changedAt)
- `changeReason`

**ห้าม fields เหล่านี้:**
- ❌ `priceDate` - ไม่มีใน main entity
- ❌ `source` - ไม่มีใน main entity (ยกเว้น external data entities)
- ❌ `changedBy` - ใช้ `createdBy` แทน
- ❌ `changedAt` - ใช้ `createdAt` แทน

### 7. Checklist สำหรับการสร้าง Entity ใหม่

**Main Entity:**
- [ ] Extend จาก Base Class ที่เหมาะสม (BaseEntity, VersionedEntity, ExternalDataEntity)
- [ ] มี Primary Key (`@PrimaryGeneratedColumn('uuid')` หรือ `@PrimaryColumn()`)
- [ ] ระบุ `@Entity('table_name')` ตรงกับชื่อตารางใน database
- [ ] Comment ระบุ version และวันที่แก้ไขล่าสุดที่ header

**History Entity (ถ้ามี):**
- [ ] ชื่อตาราง: `{main_table_name}_history`
- [ ] มี field `{entityName}Id` เป็น reference
- [ ] Copy ทุก business field จาก main entity
- [ ] มี `createdBy` และ `createdAt` (ไม่ใช่ changedBy/changedAt)
- [ ] ไม่มี field ที่ไม่มีใน main entity
- [ ] มี `description` ถ้า main entity มี

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

## Implementation Checklist (6 Phases to v7.0)

### ✅ Phase 0: Dashboard & Task Center (เสร็จแล้ว)
- ✅ **Dashboard Overview**
  - Key metrics cards (Requests, Pending Approvals, etc.)
  - Recent activity timeline
- ✅ **Task Center**
  - Pending tasks list with filters
  - Quick actions
- ✅ **Customer Group Management UI**
  - Sidebar navigation with Customer Groups
  - 7 Tabs: Overview, Customers, Standard Prices, LME Prices, FAB Costs, Selling Factors, Exchange Rates
- ✅ **Activity Log System**
  - Filter by entity type, date range, user
  - JSON diff viewer

### 🎉 Phase 1: Document Control & Version Management (เสร็จสมบูรณ์ - 28 ตุลาคม 2568)

**Backend (เสร็จแล้ว 100%):**
- ✅ **Archive Logic** (`server/src/data/data.service.ts` v3.11)
  - Auto-archive Active versions เมื่อ approve version ใหม่
- ✅ **Rollback/Restore API** (5 endpoints)
  - `POST /api/data/standard-prices/rollback/:id`
  - `POST /api/data/fab-costs/rollback/:id`
  - `POST /api/data/selling-factors/rollback/:id`
  - `POST /api/data/lme-master-data/rollback/:id`
  - `POST /api/data/exchange-rate-master-data/rollback/:id`
- ✅ **Version Control Validation**
  - BadRequestException สำหรับ invalid operations
  - Prevent approve Active records
  - Prevent delete Active/Archived records (only Draft can be deleted)
  - Only rollback from Archived versions

**Frontend (เสร็จแล้ว 100%):**
- ✅ **Version History UI Modal** (`client/src/components/VersionHistoryModal.tsx` v1.2)
  - Timeline view พร้อม version dots (Draft → Active → Archived)
  - แสดง metadata: version, status, approvedBy, effectiveDate, changeReason
  - Rollback button สำหรับ Archived versions พร้อม confirmation
  - Visual indicators: Status badges, colors, icons (lucide-react)
  - Thai Buddhist calendar date formatting
  - Error/Loading states
  - ✅ Toast notifications แทน alert() (success/error)
- ✅ **History Button Integration** (`client/src/pages/MasterData.tsx` v7.1)
  - เพิ่ม History button ใน 3 Master Data tables: FAB Cost, Standard Price, Selling Factor
  - เปิด VersionHistoryModal เมื่อคลิก
  - Refresh data หลัง rollback สำเร็จ
- ✅ **Centralized API Methods** (`client/src/services/api.ts` v4.0)
  - `getVersionHistory(dataType, recordId)` - ดึง version history
  - `approveVersion(dataType, recordId, username)` - Approve Draft → Active
  - `rollbackVersion(dataType, recordId, username)` - Rollback Archived → Draft ใหม่
  - `archiveVersion(dataType, recordId, username)` - Archive Active manually
  - JWT token injection อัตโนมัติผ่าน interceptor
  - Error response handling (axios)
- ✅ **Toast Notification System** (NEW - v7.2)
  - `client/src/components/Toast.tsx` (v1.0) - 4 toast types พร้อม auto-dismiss
  - `client/src/contexts/ToastContext.tsx` (v1.0) - Global toast state management
  - `client/src/index.css` (v1.2) - CSS animations (slide-in-right)
  - `client/src/App.tsx` (v3.1) - ToastProvider integration
  - Helper methods: `success()`, `error()`, `warning()`, `info()`
  - Fixed positioning (top-right, z-index 9999)
  - Toast queue management (multiple toasts can stack)
- ✅ **Dependencies**
  - ติดตั้ง `lucide-react` สำหรับ icons

**Testing (เสร็จแล้ว 100%):**
- ✅ **API Testing Scripts**
  - `test-version-history.js` - ทดสอบ Login, Selling Factors, Version History APIs
  - `test-rollback-archived.js` - ทดสอบ Rollback workflow แบบ end-to-end
- ✅ **Test Results**
  - Login API: ✅ JWT token generation ทำงานได้
  - Selling Factors API: ✅ ดึงข้อมูล version ต่างๆ ได้ครบถ้วน (4 records, 3 patterns)
  - Version History API: ✅ แสดง version history ได้ถูกต้อง
  - Rollback API: ✅ ทดสอบสำเร็จ
    - BEFORE: STD v4 (Active), v3 (Archived)
    - Rollback v3 → สร้าง v5 (Active) พร้อม factor = 2.5
    - AFTER: STD v5 (Active), v4 (Archived), v3 (Archived)
    - changeReason: "Rolled back from version 3"

**Files Created/Modified:**
- ✅ `client/src/components/VersionHistoryModal.tsx` (v1.2 - Toast integration)
- ✅ `client/src/components/Toast.tsx` (NEW - v1.0)
- ✅ `client/src/contexts/ToastContext.tsx` (NEW - v1.0)
- ✅ `client/src/pages/MasterData.tsx` (v7.1)
- ✅ `client/src/services/api.ts` (v4.0)
- ✅ `client/src/index.css` (v1.2 - Animations)
- ✅ `client/src/App.tsx` (v3.1 - ToastProvider)
- ✅ `server/src/data/data.service.ts` (v3.15 - Standard Price removed)
- ✅ `server/src/data/data.controller.ts` (Standard Price endpoints removed)
- ✅ `server/src/entities/standard-price.entity.ts` (v3.0 - ExternalDataEntity)
- ✅ `server/src/entities/standard-price-history.entity.ts` (DELETED)
- ✅ `server/src/app.module.ts` (StandardPriceHistory removed)
- ✅ `server/src/dashboard/dashboard.service.ts` (v2.1)
- ✅ `server/src/database/seeder.service.ts` (v1.4)
- ✅ `server/src/price-calculation/price-calculation.service.ts` (v3.5)
- ✅ `server/test-version-history.js` (NEW - Testing)
- ✅ `server/test-rollback-archived.js` (NEW - Testing)

**Status**: 🎉 **Phase 1 COMPLETE - พร้อมใช้งาน 100%** (Updated v7.5 - Standard Price migrated to Read-Only)

### 📝 Phase 2: UI/UX Improvements & New Features (วางแผนไว้ - 2-3 สัปดาห์)

#### 2.1 Master Data Tab Reordering
- ⏳ **Move LME Master Data tab before FAB Cost**
  - Location: `client/src/pages/MasterData.tsx` → Pricing Master tabs
  - New order: LME Master Data → FAB Cost → Selling Factors → Exchange Rates
  - Rationale: LME Price มาก่อน FAB Cost ในสูตรการคำนวณ

#### 2.2 Scrap Allowance Master Data (NEW)
- ⏳ **Database Entity** (`server/src/entities/scrap-allowance.entity.ts`)
  - Fields: `itemGroupCode` (reference), `scrapPercentage` (decimal)
  - Version Control: Draft → Active → Archived (เหมือน Master Data อื่นๆ)
  - Relations: Link to D365 Item Group Code
- ⏳ **Backend APIs** (`server/src/data/data.service.ts`)
  - CRUD endpoints: GET, POST, PUT, DELETE
  - Approve/Rollback workflow
  - Version History API
- ⏳ **Frontend UI** (`client/src/pages/MasterData.tsx`)
  - เพิ่ม tab "Scrap Allowance" ใน Pricing Master section
  - Form fields: Item Group Code (dropdown), Scrap % (number)
  - Version Control UI: Draft/Active/Archived status badges
  - History button + VersionHistoryModal integration
- ⏳ **Price Calculation Integration**
  - เพิ่มการคำนวณค่าเผื่อของเสีย: `RM Weight × (1 + Scrap %)`
  - Snapshot scrapAllowance ใน PriceCalculationLog

#### 2.3 Formula Constants/Variables (NEW)
- ⏳ **Database Entity** (`server/src/entities/formula-variable.entity.ts`)
  - Fields: `name`, `value` (number), `description`, `reason` (เหตุผล), `unit`
  - Version Control: Draft → Active → Archived
  - Use Case: เก็บค่าคงที่ที่ใช้ในสูตร (เช่น ค่า markup, overhead %)
- ⏳ **Backend APIs**
  - CRUD + Approve/Rollback
  - GET `/api/formula-variables/active` - ดึงตัวแปรที่ Active ทั้งหมด
- ⏳ **Frontend Management UI**
  - Location: Settings page หรือ Master Data → Formula Variables tab
  - Form: Name, Value, Unit, Description, Reason
  - Version Control UI
- ⏳ **Formula Engine Integration** (`server/src/formula-engine/`)
  - Parser รองรับตัวแปร: `$VARIABLE_NAME` ในสูตร
  - Inject ค่าตัวแปรจาก Database ก่อนคำนวณ
  - Example: `(LME + FAB) * $MARKUP_FACTOR * SellingFactor`
  - Snapshot variables ใน PriceCalculationLog

#### 2.4 Free Text Raw Material in Dummy BOQ (NEW)
- ⏳ **Database Schema Update** (`server/src/entities/bom-item.entity.ts`)
  - เพิ่ม fields: `isFreeText` (boolean), `freeTextRmName`, `freeTextUnit`, `freeTextPrice`
  - Make `rawMaterialId` nullable (optional when isFreeText = true)
- ⏳ **Backend API Update** (`server/src/bom/bom.service.ts`)
  - Support free text RM ใน POST/PUT `/api/bom`
  - Validation: ถ้า `isFreeText = true` ต้องมี freeTextRmName, freeTextUnit, freeTextPrice
- ⏳ **Frontend BOQ Editor UI** (`client/src/pages/CreateRequest.tsx`)
  - Toggle switch: "Use Free Text RM" (สำหรับ Dummy Items เท่านั้น)
  - เมื่อ Toggle ON: แสดง input fields แทน dropdown
    - RM Name (text input)
    - Quantity (number)
    - Unit (text input)
    - Price per Unit (number)
  - เมื่อ Toggle OFF: ใช้ dropdown เลือก RM จาก Database (ปกติ)
- ⏳ **Price Calculation Integration**
  - คำนวณราคา Free Text RM: `Quantity × Price`
  - Snapshot free text RM details ใน PriceCalculationLog

#### 2.5 Customer Group Override System (วางแผนไว้)
- ⏳ **Override Entities** (5 types + 5 history tables)
  - Create entities with Version Control
  - Relation to CustomerGroup
- ⏳ **Override APIs** (CRUD + Approve/Rollback)
  - Similar to Master Data APIs
  - Nested under Customer Group endpoints
- ⏳ **Override Management UI**
  - Tabs ใน Customer Group Sidebar
  - UI เหมือน Master Data แต่เฉพาะ Customer Group
- ⏳ **Price Calculation with Overrides**
  - Priority: Override → Global Default
  - Snapshot both in PriceCalculationLog

### 📝 Phase 3: Manual Mapping UI (วางแผนไว้)
- ✅ **Database schema พร้อม**
- ✅ **Manual Mapping API พร้อม**
- ⏳ **Item Mapping Tab**
  - Location: `client/src/pages/MasterData.tsx` → New Tab
  - Features:
    - Pending Mappings Table
    - Map Form (Input D365 Item ID)
    - Success/Error messages
- ⏳ **Item Status Badges**
  - Location: All pages with items (BOQViewer, CreateRequest)
  - Badges: AVAILABLE, IN_USE, MAPPED, REPLACED, PRODUCTION

### 📝 Phase 4: D365 Auto-Creation Prep (วางแผนไว้)
- ⏳ **D365 API Service (Mock)**
  - Interface design
  - Mock implementation
- ⏳ **Validation Endpoints**
  - Ready for D365 check
  - Prerequisites validation
- ⏳ **Retry Queue System**
  - Queue design
  - Error categorization
- ⏳ **Auto-Creation Dashboard (Mock)**
  - Status monitoring UI
  - Mock data

### 📝 Phase 5: Employee Entity & Production (วางแผนไว้)
- ⏳ **Employee Entity**
  - Sync from MongoDB
  - Update Audit Trail
- ⏳ **RBAC**
  - Role-based permissions
  - Access control
- ⏳ **PostgreSQL Support**
  - Migration scripts
  - Docker setup

### 📝 Phase 6: D365 Auto-Creation Production (วางแผนไว้)
- ⏳ **D365 API Integration (Real)**
  - Connect to real D365 API
  - Authentication
- ⏳ **Background Jobs**
  - Retry queue implementation
  - Job scheduling
- ⏳ **Monitoring & Alerting**
  - Error tracking
  - Dashboard
- ⏳ **Production Deployment**
  - CI/CD pipeline
  - Production testing

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

**Last Updated**: 29 ตุลาคม 2568
**Document Version**: 1.1
**Project Version**: 7.5
