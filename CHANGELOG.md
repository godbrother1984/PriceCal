# Changelog

All notable changes to the PriceCal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [5.8] - 2025-10-14

### Added - Dummy Item & BOQ Lifecycle Management 🏷️

#### Backend: Database Schema & API
- **Product Entity** (`server/src/entities/product.entity.ts` v3.0 → v4.0)
  - เพิ่ม Dummy Item Lifecycle Fields (10 fields):
    - `itemStatus`: 'AVAILABLE' | 'IN_USE' | 'MAPPED' | 'REPLACED' | 'PRODUCTION'
    - `isUsed`: true = ถูกใช้ใน Request แล้ว
    - `linkedRequestId`: Request ID ที่ใช้ Dummy Item นี้
    - `linkedDummyId`: สำหรับ Production Item ที่มาจาก Dummy
    - `d365ItemId`: Item ID ใน D365 (เมื่อ Production สร้างแล้ว)
    - `replacedByD365Id`: D365 Item ID ที่มาแทนที่ Dummy นี้
    - `mappedDate`: วันที่ Costing Team ทำ Manual Mapping
    - `mappedBy`: User ID ของคนที่ทำ Mapping
    - `customerPO`: Customer PO ที่เกี่ยวข้อง
    - `awaitingD365Creation`: true = รอ Production สร้าง Item ใน D365
  - เพิ่ม Future-Ready Fields (เผื่อการพัฒนา Auto-Creation):
    - `isPushedToD365`: true = ถูกยิง API ไปสร้างใน D365 แล้ว
    - `d365CreationDate`: วันที่สร้างใน D365
    - `d365CreationMethod`: 'MANUAL' | 'AUTO_API' | 'PRODUCTION_TEAM'
    - `autoCreationFailed`: true = API ยิงไปแล้วล้มเหลว
    - `autoCreationError`: error message จาก D365 API

- **BOM Entity** (`server/src/entities/bom.entity.ts` v3.0 → v4.0)
  - เพิ่ม BOQ Lifecycle Fields (5 fields):
    - `bomStatus`: 'DRAFT' | 'PRODUCTION' | 'ARCHIVED'
    - `copiedFrom`: BOQ ID ที่ Copy มา (D365 Master หรือ Dummy อื่น)
    - `linkedDummyBomId`: สำหรับ Production BOQ ที่มาจาก Dummy BOQ
    - `linkedD365BomId`: สำหรับ Dummy BOQ ที่ Copy จาก D365 Master
    - `archivedDate`: วันที่ BOQ ถูก Archive
  - เพิ่ม Future-Ready Fields:
    - `isPushedToD365`: BOQ ถูกยิงไป D365 แล้ว
    - `d365BomCreationDate`: วันที่สร้าง BOQ ใน D365

- **Dummy Items Module** (`server/src/dummy-items/`)
  - **DummyItemsService** (`dummy-items.service.ts` v1.1):
    - `ensureDummyItemsAvailable()`: สร้าง Dummy Items ให้มีจำนวนเพียงพอ (MIN: 20 items)
    - `getAvailableDummyItems()`: ดึงรายการ Dummy Items ที่พร้อมใช้งาน
    - `generateDummyItems(count)`: สร้าง Dummy Items ใหม่ (FG-DUMMY-001, 002, 003...)
    - `getNextDummyItemId()`: หา running number ถัดไป
    - `mapDummyToD365()`: Manual Mapping Dummy Item → D365 Item
    - `getPendingMappings()`: ดึงรายการ Dummy Items ที่รอ Mapping
    - Background Job: เรียก `ensureDummyItemsAvailable()` ตอน `onModuleInit`
    - Note: Cron Job ถูก disable เนื่องจาก Node.js v18 crypto compatibility issue

  - **DummyItemsController** (`dummy-items.controller.ts` v1.0):
    - `GET /api/dummy-items/available` - ดึงรายการ Dummy Items พร้อมใช้งาน
    - `POST /api/dummy-items/generate` - สร้าง Dummy Items ใหม่ (Manual trigger)
    - `POST /api/dummy-items/map-to-d365` - Manual Mapping: Dummy → D365
    - `GET /api/dummy-items/pending-mappings` - รายการรอ Mapping
    - `POST /api/dummy-items/check-availability` - ตรวจสอบและสร้าง Dummy Items

  - **DummyItemsModule** (`dummy-items.module.ts` v1.1):
    - TypeORM integration กับ Product entity
    - Export DummyItemsService สำหรับใช้งานใน modules อื่น
    - Note: ScheduleModule disabled (ใช้ manual trigger แทน Cron)

#### Features 🎯
- ✅ **Auto-Generate Dummy Items**: ระบบสร้าง Dummy Items อัตโนมัติ (FG-DUMMY-001, 002, 003...)
- ✅ **Manual Mapping**: Costing Team map Dummy Item → D365 Item ได้
- ✅ **Lifecycle Tracking**: ติดตามสถานะ Dummy Item ตลอด lifecycle
- ✅ **BOQ Copy**: Copy BOQ จาก D365 Master หรือ Dummy อื่นได้
- ✅ **Future-Ready**: เตรียมพร้อมสำหรับ Auto-Creation API (Phase 2)
- ✅ **History Tracking**: เก็บ history และ mapping information
- ✅ **Manual Trigger**: ใช้ API trigger แทน Cron Job (Node v18 compatible)

#### Dummy Item Lifecycle Flow 🔄
```
AVAILABLE (พร้อมใช้งาน)
    ↓
IN_USE (ถูกใช้ใน Request)
    ↓
    ├─→ [Manual Mapping] MAPPED (Costing map กับ D365 Item)
    │                      ↓
    │                   REPLACED (ไม่ใช้แล้ว)
    │
    └─→ [Future: Auto API] AWAITING_D365_CREATION (รอยิง API)
                             ↓
                          MAPPED (สร้างสำเร็จ)
                             ↓
                          REPLACED (ไม่ใช้แล้ว)
```

#### Technical Details
- **Backend Files Created** (3 files):
  - `server/src/dummy-items/dummy-items.service.ts` (v1.1, 193 lines)
  - `server/src/dummy-items/dummy-items.controller.ts` (v1.0, 130 lines)
  - `server/src/dummy-items/dummy-items.module.ts` (v1.1, 21 lines)

- **Backend Files Modified** (3 files):
  - `server/src/entities/product.entity.ts` (v3.0 → v4.0, +15 fields)
  - `server/src/entities/bom.entity.ts` (v3.0 → v4.0, +7 fields)
  - `server/src/app.module.ts` - เพิ่ม DummyItemsModule

- **Database Migration**:
  - TypeORM auto-sync สำเร็จ (SQLite development mode)
  - ไม่มี TypeScript compilation errors
  - Backend server รันปกติที่ http://localhost:3000

- **Dependencies Added**:
  - `@nestjs/schedule` (v4.x) - สำหรับ Cron Jobs (ถูก disable ใช้งาน)

#### Documentation 📚
- **DUMMY_ITEM_BOQ_LIFECYCLE_V2.md** - เอกสารออกแบบ lifecycle ฉบับสมบูรณ์
  - 9-phase complete lifecycle
  - Database schema design
  - API endpoints specification
  - UI/UX mockups
  - Implementation checklist

#### Important Notes ⚠️
- **MongoDB as Data Source**: ข้อมูล Finished Goods ใหม่จาก D365 จะดึงผ่าน MongoDB → PriceCal (ไม่ต้องสร้าง "Sync Production Items API" แยก)
- **Manual Mapping (Phase 1)**: ปัจจุบันใช้ Manual Mapping เท่านั้น
- **Auto-Creation (Phase 2)**: เตรียม fields และ infrastructure ไว้แล้วสำหรับอนาคต
- **Cron Job Disabled**: ใช้ manual trigger ผ่าน `POST /api/dummy-items/check-availability` แทน
- **Node.js v18 Compatible**: แก้ไข crypto issue โดย disable ScheduleModule

#### Workflow Example
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
POST /api/import/finished-goods

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

#### Benefits
- 🎯 **Automated Dummy Item Management**: ไม่ต้องสร้าง Dummy Items ด้วยมือ
- 🎯 **Flexible Lifecycle**: รองรับทั้ง Manual และ Auto-creation (อนาคต)
- 🎯 **History Tracking**: เก็บประวัติการ mapping และ lifecycle
- 🎯 **Scalable Design**: พร้อมขยายเป็น Auto-creation API
- 🎯 **Clean Separation**: แยก Dummy Items และ Production Items ชัดเจน
- 🎯 **MongoDB Integration**: ใช้ MongoDB เป็น primary data source

#### Implementation Checklist (3 Phases) 📋
**Phase 1: Manual Mapping (ตอนนี้)**
- ✅ Database schema พร้อม (Product + BOM entities v4.0)
- ✅ Manual Mapping API (POST /api/dummy-items/map-to-d365)
- [ ] Manual Mapping UI (หน้าจอสำหรับ Costing Team)
- [ ] Item status badges (แสดง status ใน BOQViewer)

**Phase 2: Prepare for Auto-Creation**
- ✅ Add future fields to entities (isPushedToD365, d365CreationMethod, etc.)
- [ ] Design D365 API integration interface
- [ ] Create "Ready for D365" validation
- [ ] Create retry mechanism design

**Phase 3: Auto-Creation (อนาคต)**
- [ ] D365 API client service
- [ ] Push Item to D365 API
- [ ] Push BOQ to D365 API
- [ ] Error handling & retry logic
- [ ] Auto-creation UI

#### Future Enhancements (Phase 2-3)
- [ ] Auto-Creation API: ยิง API ไปสร้าง Item + BOQ ใน D365 อัตโนมัติ
- [ ] Item Mapping UI: หน้าจอสำหรับ Costing Team ทำ manual mapping
- [ ] BOQ Comparison View: เปรียบเทียบ Dummy BOQ vs Production BOQ
- [ ] Warning Banners: แสดง warning ใน Create Request เมื่อใช้ Dummy Item
- [ ] Item Status Badges: แสดง status badges ใน BOQViewer
- [ ] Retry Mechanism: Retry สำหรับ failed auto-creation

## [5.7] - 2025-10-14

### Added - BOQ Management System 📋
- **BOQViewer Component** (`client/src/components/BOQViewer.tsx` v1.0)
  - หน้าดู BOQ (Bill of Quantities) แบบ Read-only
  - แสดง BOQ จากทั้ง D365 และ PriceCal
  - Product List พร้อมระบบค้นหา
  - แสดงรายการ Raw Materials พร้อม Quantity และ Unit
  - แสดง Source Badge (D365 Read-only / PriceCal Editable)
  - แสดง Total Items และ Total Quantity
  - Table view แบบละเอียดพร้อม notes

- **BOQEditor Component** (`client/src/components/BOQEditor.tsx` v1.0)
  - หน้าสร้าง/แก้ไข BOQ สำหรับ PriceCal Products
  - ❌ ไม่สามารถแก้ไข BOQ จาก D365 (Read-only)
  - ✅ สร้าง BOQ ใหม่สำหรับ Product ใหม่
  - ✅ แก้ไข BOQ ที่สร้างใน PriceCal
  - ✅ Copy BOQ จาก Product อื่น (Create Variation)
  - Modal Add/Edit BOQ Item พร้อม Raw Material selector
  - Quantity, Unit, Notes fields
  - Save BOQ พร้อม validation

- **BOQ Management Tab in Master Data** (`client/src/pages/MasterData.tsx` v5.0 → v5.1)
  - เพิ่ม "📋 BOQ Management" tab ใน Master Data tabs
  - Sub-tabs:
    1. **View BOQ** - ดู BOQ ทั้งหมด (D365 + PriceCal)
    2. **Create/Edit BOQ** - สร้าง/แก้ไข BOQ (PriceCal only)
  - Master Data tabs เพิ่มจาก 6 → 7 grouped tabs

### Changed - ImportManager Descriptions
- **ImportManager Component** (`client/src/components/ImportManager.tsx` v2.0 → v2.1)
  - แก้ไขคำอธิบายจาก "External API" → "MongoDB Sync"
  - เปลี่ยนจาก "API Settings" → "MongoDB Sync" descriptions
  - อัปเดตข้อความให้สะท้อนการใช้ MongoDB เป็นแหล่งข้อมูล
  - แสดงข้อมูล MongoDB connection และ sync features

### Features 🎯
- ✅ **View BOQ (Read-only)**: ดู BOQ จาก D365 (ไม่สามารถแก้ไขได้)
- ✅ **Create BOQ**: สร้าง BOQ สำหรับ Finished Goods ใหม่
- ✅ **Edit BOQ**: แก้ไข BOQ ที่สร้างใน PriceCal
- ✅ **Copy BOQ**: Copy BOQ จาก Product อื่นเพื่อสร้าง Variation
- ✅ **Hybrid BOQ Management**: รองรับ D365 + PriceCal BOQ ในระบบเดียว
- ✅ **Product Filtering**: Filter เฉพาะ PriceCal Products ใน Editor
- ✅ **Raw Material Search**: ค้นหา Raw Material ได้ในตอนเพิ่ม BOQ Item
- ✅ **Validation**: ตรวจสอบข้อมูลก่อน Save BOQ
- ✅ **MongoDB Sync Info**: คำอธิบายชัดเจนเกี่ยวกับ MongoDB import

### Technical Details
- **Frontend Files Created** (2 files):
  - `client/src/components/BOQViewer.tsx` (v1.0, 330 lines)
  - `client/src/components/BOQEditor.tsx` (v1.0, 620 lines)
- **Frontend Files Modified** (2 files):
  - `client/src/pages/MasterData.tsx` (v5.0 → v5.1)
  - `client/src/components/ImportManager.tsx` (v2.0 → v2.1)

- **Backend APIs Used**:
  - `GET /api/data/products` - ดึงรายการ Products
  - `GET /api/data/raw-materials` - ดึงรายการ Raw Materials
  - `GET /api/bom/product/:productId` - ดึง BOQ ของ Product
  - `POST /api/bom` - สร้าง BOQ Item ใหม่
  - `PUT /api/bom/:id` - อัปเดต BOQ Item
  - `POST /api/bom/copy` - Copy BOQ จาก Product อื่น

- **BOQ Item Interface**:
  ```typescript
  interface BOQItem {
    id?: string;
    productId: string;
    rawMaterialId: string;
    quantity: number;
    unit: string;
    notes?: string;
    bomSource: string; // 'D365' | 'PRICECAL'
    isEditable: boolean;
  }
  ```

### BOQ Workflow 🔄
1. **View BOQ**: ดู BOQ ทั้งหมด (D365 = Read-only, PriceCal = Editable)
2. **Create BOQ**: สร้าง BOQ สำหรับ Product ใหม่
   - เลือก Product (PriceCal only)
   - เพิ่ม BOQ Items (Raw Material + Quantity + Unit)
   - Save BOQ
3. **Edit BOQ**: แก้ไข BOQ ที่สร้างใน PriceCal
   - Load BOQ จาก Product
   - Edit/Delete Items
   - Save changes
4. **Copy BOQ**: Copy BOQ เพื่อสร้าง Variation
   - เลือก Source Product
   - Copy ไปยัง Target Product
   - Edit ตามต้องการ

### Benefits
- 🎯 **Complete BOQ Management**: จัดการ BOQ ได้ครบวงจร
- 🎯 **Hybrid Support**: รองรับ D365 + PriceCal BOQ
- 🎯 **Easy Variation**: สร้าง Product Variation ได้ง่ายด้วย Copy BOQ
- 🎯 **Better UX**: UI ใช้งานง่าย แยก View/Edit ชัดเจน
- 🎯 **Data Integrity**: ป้องกันการแก้ไข D365 BOQ โดยไม่ตั้งใจ
- 🎯 **MongoDB Clarity**: คำอธิบาย MongoDB Sync ชัดเจนขึ้น

### Master Data Tabs Structure (7 tabs)
1. 🔄 **MongoDB Sync** (Import Data + View MongoDB Data)
2. 📋 **BOQ Management** ✨ *NEW* (View BOQ + Create/Edit BOQ)
3. 👥 **Customers** (Customer Groups + Customer Mappings)
4. 💰 **Pricing Master** (Standard Prices + Fab Costs + Selling Factors)
5. 💱 **Market Data** (LME Master Data + Exchange Rates)
6. ⚙️ **System Config** (Currencies)
7. 📊 **Activity Logs** (Activity Logs)

### TypeScript Status
- ✅ **Clean Build**: No TypeScript errors (tsc --noEmit ✅)
- ✅ **Type Safety**: All interfaces properly typed
- ✅ **Import Resolution**: All imports resolved correctly

### Documentation
- 📚 **HYBRID_BOQ_DESIGN.md** - เอกสารออกแบบ BOQ Hybrid System (อ้างอิงจาก v5.3)

## [5.6.1] - 2025-10-14

### Fixed - MasterDataViewer Authentication Issue 🔒
- **MasterDataViewer Component** (`client/src/components/MasterDataViewer.tsx` v1.1 → v1.2)
  - แก้ไข 401 Unauthorized error โดยเปลี่ยนจาก `fetch()` เป็น centralized `api` instance
  - เปลี่ยน absolute URLs (`http://localhost:3000/api/...`) เป็น relative paths (`/api/...`)
  - เปลี่ยนจาก `fetch(endpoint)` เป็น `api.get(endpoint)`
  - เปลี่ยนจาก `response.json()` เป็น `response.data` (axios format)
  - JWT token ถูกแนบอัตโนมัติในทุก request ผ่าน axios interceptor

### Impact
- ✅ **Fixed**: Master Data → View MongoDB Data ไม่เกิด 401 error อีกต่อไป
- ✅ **Security**: JWT token ถูกส่งอัตโนมัติในทุก API calls
- ✅ **Consistency**: ทุก components ใช้ centralized API client เหมือนกัน
- ✅ **Complete API Migration**: Frontend 100% ใช้ centralized `api` instance (13/13 files)

### Technical Details
- **Files Modified** (1 file):
  - `client/src/components/MasterDataViewer.tsx` (v1.1 → v1.2)
  - เพิ่ม `import api from '../services/api'`
  - เปลี่ยน 4 endpoints ทั้งหมดจาก absolute เป็น relative URLs
  - ใช้ `api.get()` แทน `fetch()`

### All Frontend Files Using Centralized API (13 files)
1. `client/src/services/api.ts` (v2.0) - Centralized axios instance
2. `client/src/pages/Login.tsx` (v2.0) - Token storage
3. `client/src/pages/CreateRequest.tsx` (v4.0)
4. `client/src/pages/PriceRequestList.tsx` (v3.0)
5. `client/src/pages/PricingView.tsx` (v2.0)
6. `client/src/pages/MasterData.tsx` (v4.0)
7. `client/src/pages/UserProfile.tsx` (v2.1)
8. `client/src/pages/Settings.tsx` (v2.0)
9. `client/src/components/ActivityLogs.tsx` (v2.0)
10. `client/src/components/PriceCalculator.tsx` (v2.0)
11. `client/src/components/ImportManager.tsx` (v2.0)
12. `client/src/components/ApiSettings.tsx` (v2.0)
13. `client/src/components/MasterDataViewer.tsx` (v1.2) ✅ **NOW FIXED**

## [5.6] - 2025-10-14

### Added - Master Data Tabs Redesign (Complete)
- **Master Data Page Restructure** (`client/src/pages/MasterData.tsx` v4.0 → v5.0)
  - จัดระเบียบ tabs ใหม่จาก 11 tabs เป็น 6 grouped tabs พร้อม sub-tabs
  - ลดความซับซ้อนและเพิ่มความชัดเจนในการใช้งาน
  - **New Tab Structure**:
    1. **🔄 MongoDB Sync** (Import Data + View MongoDB Data)
    2. **👥 Customers** (Customer Groups + Customer Mappings)
    3. **💰 Pricing Master** (Standard Prices + Fab Costs + Selling Factors)
    4. **💱 Market Data** (LME Master Data + Exchange Rates)
    5. **⚙️ System Config** (Currencies)
    6. **📊 Activity Logs** (Activity Logs)

- **Tab Group Architecture**
  - สร้าง `TabGroup` interface พร้อม `subTabs` support
  - Navigation แบบ 2 ระดับ: Primary tabs + Secondary sub-tabs
  - UI ปรับปรุง: Primary tabs แสดง icon และชื่อกลุ่ม, Sub-tabs แสดงเป็น rounded pills
  - Component-based architecture: แต่ละ tab render component ที่เหมาะสม

### Changed - Code Quality Improvements
- **TypeScript Warnings Fixed**
  - `MasterDataViewer.tsx` (v1.0 → v1.1):
    - ลบ unused interfaces (RawMaterial, Product, Customer)
    - แก้ไข unused variable 'd' ใน filter functions
    - ปรับปรุงการนับจำนวนข้อมูลใน data type selector
  - `UserProfile.tsx` (v2.0 → v2.1):
    - ลบ unused `loading` state variable
    - ปรับปรุง `loadProfile()` function

### Features
- ✅ **Cleaner Navigation**: จัดกลุ่ม tabs ตามหมวดหมู่ชัดเจนขึ้น
- ✅ **Better UX**: ลดความซับซ้อน ง่ายต่อการหาข้อมูล
- ✅ **Scalable Design**: สามารถเพิ่ม sub-tabs ใหม่ได้ง่าย
- ✅ **Visual Hierarchy**: แยกระดับ Primary และ Secondary tabs ชัดเจน
- ✅ **TypeScript Clean**: ไม่มี TypeScript warnings/errors (tsc --noEmit ผ่าน)

### Technical Details
- **Frontend Files Modified** (3 files):
  - `client/src/pages/MasterData.tsx` (v4.0 → v5.0)
  - `client/src/components/MasterDataViewer.tsx` (v1.0 → v1.1)
  - `client/src/pages/UserProfile.tsx` (v2.0 → v2.1)

- **New Interfaces**:
  ```typescript
  interface TabGroup {
    id: string;
    label: string;
    icon: string;
    subTabs?: SubTab[];
    component?: React.FC;
  }

  interface SubTab {
    id: string;
    label: string;
    component: React.FC;
  }
  ```

### Documentation
- 📚 **MASTER_DATA_REDESIGN.md** - เอกสารออกแบบ tab structure ใหม่

### Benefits
- 🎯 **Reduced Complexity**: จาก 11 tabs → 6 grouped tabs
- 🎯 **Organized by Category**: จัดกลุ่มตามประเภทข้อมูล
- 🎯 **Easier Navigation**: ผู้ใช้หาข้อมูลได้เร็วขึ้น
- 🎯 **Maintainable**: เพิ่ม features ใหม่ได้ง่าย

## [5.5] - 2025-10-14

### Added - Frontend JWT Authentication Integration
- **Centralized API Client** (`client/src/services/api.ts` v2.0)
  - เปิดใช้งาน JWT Authentication Interceptor
  - แนบ JWT token อัตโนมัติในทุก request (`Authorization: Bearer <token>`)
  - จัดการ 401 Unauthorized response (ลบ token และ reload หน้า login)
  - รองรับ error handling ที่ดีกว่าด้วย axios interceptors

- **Login Token Management** (`client/src/pages/Login.tsx` v2.0)
  - บันทึก JWT token ที่ได้จาก `/auth/login` ไว้ใน localStorage
  - ส่งข้อมูล: `{ username, password }` → รับ: `{ access_token, user }`
  - แสดง error message เมื่อ login ไม่สำเร็จ

### Fixed - Backend JWT Response Format
- **Auth Service** (`server/src/auth/auth.service.ts` v2.0 → v2.1)
  - แก้ไข response format จาก `{ token, user }` เป็น `{ access_token, user }`
  - ใช้ `access_token` ตาม JWT standard naming convention
  - ทำให้ Frontend รับ token ได้ถูกต้องและไม่เกิด error "No token received from server"

### Changed - Frontend API Migration
- **All Frontend Components** ใช้ centralized `api` instance แทน local axios/fetch
  - `CreateRequest.tsx` (v3.6 → v4.0) - แทนที่ fetch() 5 จุดด้วย api.get/post/put
  - `PriceRequestList.tsx` (v2.6 → v3.0) - ลบ local axios instance, ใช้ centralized api
  - `PricingView.tsx` (v1.6 → v2.0) - ลบ local axios instance, ใช้ centralized api
  - `MasterData.tsx` (v3.8 → v4.0) - ลบ local axios instance, ใช้ centralized api

### Security 🔒
- ✅ **Automatic Token Injection**: JWT token แนบในทุก request อัตโนมัติ
- ✅ **Centralized Error Handling**: จัดการ 401 Unauthorized แบบรวมศูนย์
- ✅ **Session Management**: ลบ token และ force logout เมื่อ token หมดอายุ
- ✅ **No More Hardcoded URLs**: ใช้ relative paths ผ่าน api instance เท่านั้น

### Technical Details
- **Backend Files Modified** (1 file):
  - `server/src/auth/auth.service.ts` (v2.0 → v2.1, JWT response format)

- **Frontend Files Modified** (12 files):
  - `client/src/services/api.ts` (v1.0 → v2.0, เปิดใช้งาน interceptors)
  - `client/src/pages/Login.tsx` (v1.0 → v2.0, บันทึก token)
  - `client/src/pages/CreateRequest.tsx` (v3.6 → v4.0, แทนที่ fetch ด้วย api)
  - `client/src/pages/PriceRequestList.tsx` (v2.6 → v3.0, ใช้ centralized api)
  - `client/src/pages/PricingView.tsx` (v1.6 → v2.0, ใช้ centralized api)
  - `client/src/pages/MasterData.tsx` (v3.8 → v4.0, ใช้ centralized api)
  - `client/src/pages/UserProfile.tsx` (v1.0 → v2.0, ใช้ centralized api)
  - `client/src/pages/Settings.tsx` (v1.0 → v2.0, ใช้ centralized api)
  - `client/src/components/ActivityLogs.tsx` (v1.0 → v2.0, ใช้ centralized api)
  - `client/src/components/PriceCalculator.tsx` (v1.0 → v2.0, ใช้ centralized api)
  - `client/src/components/ImportManager.tsx` (v1.0 → v2.0, ใช้ centralized api)
  - `client/src/components/ApiSettings.tsx` (v1.0 → v2.0, ใช้ centralized api)

### Benefits
- 🎯 **Consistency**: ทุก component ใช้ api instance เดียวกัน
- 🎯 **Maintainability**: แก้ไข authentication logic ที่เดียว มีผลทั้งระบบ
- 🎯 **Better DX**: ไม่ต้อง manually แนบ token ในแต่ละ request
- 🎯 **Error Handling**: จัดการ expired token แบบรวมศูนย์
- 🎯 **Clean Code**: ลบ duplicated axios instances (4 ไฟล์)

## [5.4] - 2025-10-14

### Added - MongoDB Primary + Security Enhancement
- **MongoDB as Primary Data Source**
  - MongoDB เป็นแหล่งข้อมูลหลักสำหรับระบบ (ไม่ใช่ API อีกต่อไป)
  - เปิดใช้งาน MongoDB ผ่าน environment variable: `ENABLE_MONGODB=true`
  - ลบ API-based import code ทั้งหมด (axios, ApiSetting entity)
  - ImportService ใช้เฉพาะ MongoDB ผ่าน MongodbService และ MasterDataMongoService
  - ลดขนาดไฟล์ ImportService จาก 1,308 บรรทัด → 606 บรรทัด (53% reduction)

- **JWT Security Enhancement** 🔒
  - **JWT Secret Validation**: บังคับให้มี JWT_SECRET ใน environment variable (ไม่อนุญาต hardcode)
  - เพิ่มการตรวจสอบ JWT_SECRET ใน AuthModule และ JwtStrategy
  - Throw error ทันทีถ้าไม่มี JWT_SECRET (ป้องกัน production security risk)
  - เพิ่ม JWT_SECRET ใน `.env` file

- **JWT Authentication Guards** 🔒
  - สร้าง JwtAuthGuard (`server/src/auth/jwt-auth.guard.ts`)
  - ป้องกันทุก API endpoints ด้วย JWT authentication
  - เพิ่ม `@UseGuards(JwtAuthGuard)` ใน Controllers ทั้งหมด (9 controllers):
    - DataController - ข้อมูลหลักทั้งหมด (Price Requests, Master Data)
    - ImportController - Import/Sync operations
    - PriceCalculationController - Price calculation
    - SyncConfigController - Sync configuration
    - BomController - BOQ management
    - ActivityLogController - Activity logs
    - ApiSettingsController - API settings (deprecated)
    - MasterDataController - Mock data (deprecated)
    - PricingController - Pricing service

### Changed - Code Cleanup
- **ImportService** (`server/src/import/import.service.ts` v4.0 → v5.0)
  - ลบ methods: `fetchFromApi()`, `fetchPaginatedData()`, `addAuthentication()`
  - ลบ DTOs: RawMaterialDTO, BOMItemDTO, FinishedGoodDTO, EmployeeDTO
  - ลบ dependencies: axios
  - MongodbService และ MasterDataMongoService เป็น required (ไม่ใช่ @Optional อีกต่อไป)
  - เหลือเฉพาะ MongoDB-based import methods พร้อม bulk optimization

- **ImportModule** (`server/src/import/import.module.ts` v4.0 → v5.0)
  - ลบ ApiSetting entity จาก TypeOrmModule.forFeature
  - MongodbModule ถูก import เสมอ (ไม่มี conditional check)

- **Environment Configuration** (`.env`)
  - เพิ่ม `ENABLE_MONGODB=true` (enable MongoDB by default)
  - เพิ่ม `JWT_SECRET=change-this-to-a-secure-random-string-in-production`

### Security 🔒
- ✅ **JWT Secret Required**: ป้องกัน hardcode secret ใน production
- ✅ **Authentication on All Endpoints**: ทุก API endpoint ต้อง login ก่อนใช้งาน
- ✅ **No Unauthenticated Access**: ป้องกัน unauthorized access ทั้งหมด
- ⚠️ **Exception**: `/api/auth/login` และ `/api/setup/*` ไม่ต้องใช้ Guard (public endpoints)

### Technical Details
- **Files Modified**:
  - `server/src/import/import.service.ts` (v4.0 → v5.0, -702 lines)
  - `server/src/import/import.module.ts` (v4.0 → v5.0)
  - `server/src/auth/auth.module.ts` (v1.0 → v2.0)
  - `server/src/auth/jwt.strategy.ts` (v1.0 → v2.0)
  - `server/.env` - เพิ่ม JWT_SECRET และ ENABLE_MONGODB=true
- **Files Created**:
  - `server/src/auth/jwt-auth.guard.ts` (v1.0)
- **Files Updated with Guards** (9 controllers):
  - `server/src/data/data.controller.ts` (v1.4 → v2.0)
  - `server/src/import/import.controller.ts` (v2.0 → v3.0)
  - `server/src/price-calculation/price-calculation.controller.ts` (v1.0 → v2.0)
  - `server/src/sync-config/sync-config.controller.ts` (v1.0 → v2.0)
  - `server/src/bom/bom.controller.ts` (v1.0 → v2.0)
  - `server/src/activity-log/activity-log.controller.ts` (v1.0 → v2.0)
  - `server/src/api-settings/api-settings.controller.ts` (v1.0 → v2.0 DEPRECATED)
  - `server/src/master-data/master-data.controller.ts` (v2.1 → v3.0)
  - `server/src/pricing/pricing.controller.ts` (v1.0 → v2.0)

### Breaking Changes
- ⚠️ **API Import Removed**: ไม่สามารถ import จาก External API ได้อีกต่อไป (ใช้ MongoDB เท่านั้น)
- ⚠️ **JWT_SECRET Required**: ต้องตั้งค่า JWT_SECRET ใน .env ก่อนรัน server
- ⚠️ **Authentication Required**: ทุก API endpoint (ยกเว้น /auth/login) ต้อง authenticate
- ⚠️ **MongoDB Required**: ต้องมี MongoDB connection (ENABLE_MONGODB=true)

### Deprecated
- 🗑️ **ApiSettingsController**: API import ไม่ใช้แล้ว (ใช้ MongoDB)
- 🗑️ **ApiSetting Entity**: ไม่จำเป็นต้องใช้

### Documentation
- 📚 Updated CLAUDE.md - สะท้อนการเปลี่ยนแปลงเป็น MongoDB primary
- 📚 Updated CHANGELOG.md - บันทึกการเปลี่ยนแปลง v5.4

## [5.3.1] - 2025-10-10

### Fixed - Dependency Injection & MongoDB Configuration
- **PriceCalculationModule** (`server/src/price-calculation/price-calculation.module.ts` v4.0)
  - แก้ไข Dependency Injection Error: StandardPriceRepository not found
  - เพิ่ม missing entities ใน TypeOrmModule.forFeature():
    - `StandardPrice` - สำหรับราคามาตรฐาน
    - `LmeMasterData` - สำหรับราคา LME
    - `FabCost` - สำหรับต้นทุนการผลิต
    - `SellingFactor` - สำหรับ factor การขาย
    - `ExchangeRateMasterData` - สำหรับอัตราแลกเปลี่ยน
  - ทำให้ PriceCalculationService inject repositories ได้ครบถ้วน

- **MongodbModule** (`server/src/mongodb/mongodb.module.ts` v3.1)
  - เพิ่ม **Non-blocking MongoDB Connection**
  - ตั้งค่า connection timeouts:
    - `serverSelectionTimeoutMS: 5000` - Timeout หลัง 5 วินาที
    - `connectTimeoutMS: 5000` - Connection timeout 5 วินาที
    - `socketTimeoutMS: 5000` - Socket timeout 5 วินาที
  - ปิด retry mechanisms: `retryWrites: false`, `retryReads: false`
  - ตั้งค่า `autoCreate: false`, `autoIndex: false`
  - แก้ไข error handler ให้แสดง warning แทน throw error
  - **ผลลัพธ์**: Application สามารถ start ได้แม้ MongoDB ไม่พร้อมใช้งาน

### Technical Details
- **Issue**: NestJS ไม่สามารถ resolve StandardPriceRepository dependency ใน PriceCalculationService
- **Root Cause**: PriceCalculationModule ขาด entity registrations ใน TypeOrmModule.forFeature()
- **Solution**: เพิ่ม entities ทั้ง 5 ตัวที่ PriceCalculationService ต้องการ
- **Build Status**: ✅ Compilation successful (0 errors)
- **Server Status**: ✅ Running on http://localhost:3001

### Files Changed
- `server/src/price-calculation/price-calculation.module.ts` (v3.0 → v4.0)
- `server/src/mongodb/mongodb.module.ts` (v3.0 → v3.1)

## [5.3] - 2025-10-09

### Added - Universal Sync with Toggle Control
- **SyncConfig Entity** (`server/src/entities/sync-config.entity.ts`)
  - Entity สำหรับจัดการการตั้งค่า Sync แต่ละ table
  - Fields: `entityType`, `isEnabled`, `dataSource`, `mongoCollection`, `syncFrequency`, `lastSyncAt`, `lastSyncStatus`
  - รองรับ 9 Entity Types: CUSTOMER, PRODUCT, RAW_MATERIAL, BOM, STANDARD_PRICE, LME_PRICE, EXCHANGE_RATE, FAB_COST, SELLING_FACTOR
  - Toggle เปิด/ปิด sync แต่ละ entity ได้
  - รองรับ Data Source: MONGODB, API, MANUAL
  - รองรับ Sync Frequency: MANUAL, DAILY, HOURLY, REAL_TIME
  - เก็บสถานะ sync ครั้งล่าสุด (success, failed, partial)

- **SyncConfig Module** (`server/src/sync-config/`)
  - **SyncConfigService** - จัดการ CRUD และ Toggle control
    - `getSyncConfig(entityType)` - ดึงการตั้งค่าสำหรับ entity
    - `enableSync(entityType)` / `disableSync(entityType)` - เปิด/ปิด sync
    - `updateSyncConfig()` - อัพเดทการตั้งค่า
    - `initializeAllConfigs()` - สร้างการตั้งค่าเริ่มต้นสำหรับทุก entity
    - `getSyncSummary()` - สรุปสถานะการ sync ทั้งหมด
    - `bulkUpdateSyncConfigs()` - อัพเดทหลาย entity พร้อมกัน
  - **SyncConfigController** - API endpoints สำหรับจัดการ sync config
    - `GET /api/sync-config` - ดึงการตั้งค่าทั้งหมด
    - `GET /api/sync-config/:entityType` - ดึงการตั้งค่าของ entity
    - `GET /api/sync-config/summary/all` - สรุปสถานะ sync
    - `POST /api/sync-config/:entityType/enable` - เปิด sync
    - `POST /api/sync-config/:entityType/disable` - ปิด sync
    - `PUT /api/sync-config/:entityType` - อัพเดทการตั้งค่า
    - `POST /api/sync-config/initialize` - สร้างการตั้งค่าเริ่มต้น
    - `POST /api/sync-config/bulk-update` - อัพเดทหลาย entity

- **Enhanced ImportService** (`server/src/import/import.service.ts` v4.0)
  - เพิ่ม `isSyncEnabled(entityType)` - ตรวจสอบว่าเปิดใช้งาน sync หรือไม่
  - เพิ่ม `updateSyncStatus()` - อัพเดทสถานะ sync หลังจากเสร็จสิ้น
  - เพิ่ม `importCustomers()` - Sync Customers จาก MongoDB → Local DB
  - เพิ่ม `importProducts()` - Sync Products (FG) จาก MongoDB → Local DB
  - ปรับปรุง `importStandardPrices()`, `importLmePrices()`, `importExchangeRates()` ให้รองรับ toggle
  - เพิ่ม `importAllData()` - Sync ทุก entity (Customer, Product, Master Data) พร้อมกัน
  - ทุก import method ตรวจสอบ `isEnabled` ก่อนทำงาน
  - อัพเดทสถานะ sync (success/failed/partial) อัตโนมัติ

- **Enhanced ImportController** (`server/src/import/import.controller.ts` v2.0)
  - **New Sync Endpoints** (แนะนำใช้):
    - `POST /api/import/sync/customers` - Sync Customers
    - `POST /api/import/sync/products` - Sync Products
    - `POST /api/import/sync/standard-prices` - Sync Standard Prices
    - `POST /api/import/sync/lme-prices` - Sync LME Prices
    - `POST /api/import/sync/exchange-rates` - Sync Exchange Rates
    - `POST /api/import/sync/all` - Sync ทุก entity พร้อมกัน
  - **Legacy Endpoints** (Backward Compatibility):
    - `POST /api/import/master-data/all` - เรียกใช้ `importAllMasterData()`
    - `POST /api/import/master-data/standard-prices` - Redirect to sync endpoint
    - `POST /api/import/master-data/lme-prices` - Redirect to sync endpoint
    - `POST /api/import/master-data/exchange-rates` - Redirect to sync endpoint

### Features
- ✅ **Universal Toggle Control**: เปิด/ปิด sync ได้ทุก entity แยกกัน
- ✅ **Customer Sync**: ดึง Customers จาก MongoDB มาเก็บใน Local DB
- ✅ **Product Sync**: ดึง Products (Finished Goods) จาก MongoDB มาเก็บใน Local DB
- ✅ **Sync Status Tracking**: ติดตามสถานะ sync ครั้งล่าสุดของแต่ละ entity
- ✅ **Flexible Configuration**: ตั้งค่า collection name, query, frequency แยกแต่ละ entity
- ✅ **Bulk Operations**: อัพเดทการตั้งค่าหลาย entity พร้อมกัน
- ✅ **Default Initialization**: สร้างการตั้งค่าเริ่มต้นอัตโนมัติสำหรับทุก entity

### Technical Details
- **Architecture**: Data Synchronization Pattern (MongoDB → Import/Sync → Local DB → Use)
- **Sync Flow**:
  ```
  1. ตรวจสอบ SyncConfig.isEnabled
  2. ถ้าเปิด → ดึงข้อมูลจาก MongoDB
  3. Upsert ข้อมูลเข้า Local DB (INSERT or UPDATE)
  4. อัพเดท SyncConfig (lastSyncAt, lastSyncStatus, lastSyncRecords)
  5. Return ผลลัพธ์ (inserted, updated, errors)
  ```
- **Entity Types**: CUSTOMER, PRODUCT, RAW_MATERIAL, BOM, STANDARD_PRICE, LME_PRICE, EXCHANGE_RATE, FAB_COST, SELLING_FACTOR
- **Default Collections**: `customers`, `products`, `raw_materials`, `bom`, `standard_prices`, `lme_master_data`, `exchange_rate_master_data`, `fab_costs`, `selling_factors`
- **Build Status**: ✅ Successful compilation (no errors)

### Files Changed
- **New Files**:
  - `server/src/entities/sync-config.entity.ts` (70 บรรทัด)
  - `server/src/sync-config/sync-config.service.ts` (190 บรรทัด)
  - `server/src/sync-config/sync-config.controller.ts` (130 บรรทัด)
  - `server/src/sync-config/sync-config.module.ts` (15 บรรทัด)
- **Modified Files**:
  - `server/src/import/import.service.ts` (v3.0 → v4.0, +250 บรรทัด)
  - `server/src/import/import.controller.ts` (v1.0 → v2.0, +50 บรรทัด)
  - `server/src/import/import.module.ts` (v3.0 → v4.0, +1 entity)
  - `server/src/app.module.ts` (+2 imports, +1 module)

### Usage Example
```bash
# 1. Initialize sync configs
POST /api/sync-config/initialize

# 2. Enable sync for specific entities
POST /api/sync-config/CUSTOMER/enable
POST /api/sync-config/PRODUCT/enable
POST /api/sync-config/STANDARD_PRICE/enable

# 3. Sync data (เฉพาะที่เปิดใช้งานเท่านั้น)
POST /api/import/sync/customers
POST /api/import/sync/products
POST /api/import/sync/all  # Sync ทุกอย่างพร้อมกัน

# 4. Check sync status
GET /api/sync-config/summary/all
```

### Breaking Changes
- ไม่มี breaking changes
- Legacy endpoints ยังใช้งานได้ตามปกติ
- Sync endpoints ใหม่เป็น opt-in (ต้องเปิดใช้งานผ่าน SyncConfig)

## [5.1] - 2025-10-07

### Added - Price Calculation Engine
- **Price Calculation Service** (`server/src/price-calculation/price-calculation.service.ts`)
  - `calculatePrice()`: คำนวณราคาจาก Product ID, Quantity, และ Customer Group
  - คำนวณ Material Costs จาก BOQ (Bill of Quantities)
  - ดึงราคาวัตถุดิบจาก LME Price Master Data และ Standard Price (ลำดับความสำคัญ: LME > Standard)
  - ดึง FAB Cost (Fabrication Cost) จาก Master Data
  - คำนวณ Selling Price โดยใช้ Selling Factor
  - แปลงราคาเป็น THB โดยใช้ Exchange Rate Master Data
  - คำนวณ Margin (Percentage และ Amount)
  - เก็บ Master Data Versions สำหรับ Snapshot (traceability)
  - รองรับ Customer Group สำหรับราคาเฉพาะกลุ่มลูกค้า
- **Price Calculation Controller** (`server/src/price-calculation/price-calculation.controller.ts`)
  - `POST /api/price-calculation/calculate`: API endpoint สำหรับคำนวณราคา
  - Error handling และ response formatting
- **Price Calculation Module** (`server/src/price-calculation/price-calculation.module.ts`)
  - NestJS module definition
  - TypeORM integration กับ entities ที่มีอยู่:
    - StandardPrice: ราคามาตรฐานของวัตถุดิบ
    - LmeMasterData: ราคา LME สำหรับการคำนวณ
    - FabCost: ต้นทุนการผลิต
    - SellingFactor: ตัวคูณการขาย
    - ExchangeRateMasterData: อัตราแลกเปลี่ยน
- **Price Calculator Component** (`client/src/components/PriceCalculator.tsx`)
  - UI component สำหรับแสดงผลการคำนวณราคา
  - แสดง Price Calculation Summary (Total Cost, Selling Price, Margin)
  - แสดง Material Costs Breakdown (รายวัตถุดิบ พร้อม Unit Price และ Total Cost)
  - แสดง Cost Breakdown (Material + FAB Cost → Selling Price USD → Selling Price THB)
  - แสดง Price Source (LME, Standard, None) สำหรับแต่ละวัตถุดิบ
  - แสดง Master Data Versions (Snapshot) สำหรับ audit trail
  - รองรับ Currency Formatting (USD, THB)
- **Integration with CreateRequest Page** (`client/src/pages/CreateRequest.tsx`)
  - เพิ่ม PriceCalculator component ในหน้าสร้าง/แก้ไขคำขอราคา
  - แสดง Price Calculator เมื่อ Product มี BOQ แล้ว
  - Auto-trigger calculation พร้อมแสดงผลทันที

### Features
- ✅ BOQ-Based Calculation: คำนวณราคาจาก Bill of Quantities (BOQ) อัตโนมัติ
- ✅ Multi-Source Pricing: รองรับราคาจากหลายแหล่ง (LME Price, Standard Price)
- ✅ Customer Group Pricing: รองรับราคาเฉพาะกลุ่มลูกค้า
- ✅ FAB Cost Integration: รวมต้นทุนการผลิต (Fabrication Cost)
- ✅ Selling Factor: คำนวณราคาขายโดยใช้ Selling Factor
- ✅ Multi-Currency: รองรับการคำนวณในหลายสกุลเงิน (USD, THB)
- ✅ Margin Calculation: คำนวณ Margin (Percentage และ Amount)
- ✅ Master Data Versioning: เก็บ version ของ Master Data สำหรับ Snapshot
- ✅ Real-Time Calculation: คำนวณราคาแบบ Real-Time ผ่าน UI
- ✅ Detailed Breakdown: แสดงรายละเอียดการคำนวณทุกขั้นตอน

### Technical Details
- **Backend Files**:
  - `server/src/price-calculation/price-calculation.service.ts` (440 บรรทัด)
  - `server/src/price-calculation/price-calculation.controller.ts` (50 บรรทัด)
  - `server/src/price-calculation/price-calculation.module.ts` (35 บรรทัด)
  - `server/src/app.module.ts` - เพิ่ม PriceCalculationModule
- **Frontend Files**:
  - `client/src/components/PriceCalculator.tsx` (320 บรรทัด)
  - `client/src/pages/CreateRequest.tsx` - เพิ่ม PriceCalculator integration
- **API Endpoints**:
  - `POST /api/price-calculation/calculate` - คำนวณราคา
    - Input: `{ productId, quantity, customerGroupId? }`
    - Output: `{ materialCosts, totalCost, sellingPrice, margin, masterDataVersions, ... }`
- **Calculation Logic**:
  ```
  Material Cost = Σ (BOQ Quantity × Unit Price × Product Quantity)
  Total Cost = Material Cost + FAB Cost
  Selling Price (USD) = Total Cost × Selling Factor
  Selling Price (THB) = Selling Price (USD) × Exchange Rate
  Margin = Selling Price - Total Cost
  Margin % = (Margin / Total Cost) × 100
  ```

### Dependencies
- ใช้ entities ที่มีอยู่แล้วในระบบ (StandardPrice, LmeMasterData, FabCost, SellingFactor, ExchangeRateMasterData)
- ใช้ VersionedEntity base class สำหรับ Master Data versioning
- ไม่มี breaking changes กับ entities เดิม

## [5.0] - 2025-10-01

### Added - UI Restructure & User Profile
- **Settings Page** (`client/src/pages/Settings.tsx`)
  - หน้าตั้งค่าระบบรวมศูนย์ใหม่
  - Tab "🔌 API Settings": ตั้งค่า External API endpoints
  - Tab "⚙️ System Config": ตั้งค่าทั่วไป (ชื่อบริษัท, สกุลเงิน, อัตราภาษี, timezone)
  - Tab "📥 Import Config": ตั้งค่าการ Import (เวลา auto-update, max records)
- **User Profile Page** (`client/src/pages/UserProfile.tsx`)
  - หน้าจัดการข้อมูลส่วนตัว
  - แก้ไขข้อมูล Profile (ชื่อ, อีเมล, เบอร์โทร, แผนก)
  - เปลี่ยนรหัสผ่าน (พร้อมการตรวจสอบความถูกต้อง)
  - ตั้งค่าความชอบส่วนบุคคล (ภาษา, รูปแบบวันที่, การแจ้งเตือน)
  - Dashboard สรุปกิจกรรม (Price Requests created, Approved, Last Login)
- **Navigation Restructure** (`client/src/components/layout/MainLayout.tsx`)
  - แบ่ง Sidebar Navigation เป็น 3 ส่วน:
    - **MAIN**: Price Requests, Master Data
    - **SYSTEM**: Settings (เมนูใหม่)
    - **USER**: Profile (เมนูใหม่ - ชิดด้านล่าง)

### Changed - Master Data Cleanup
- **Master Data Page** (`client/src/pages/MasterData.tsx` v3.3)
  - ลบ tabs ที่ซ้ำซ้อน: API Settings, System Settings, Sync Data
  - ย้าย API Settings → Settings page (API Settings tab)
  - ย้าย System Settings → Settings page (System Config tab)
  - ย้าย Sync Data → Settings page (Import Config tab)
  - เหลือเฉพาะ tabs ที่เกี่ยวข้องกับข้อมูลหลักโดยตรง

### Features
- ✅ Centralized Settings: รวมการตั้งค่าระบบทั้งหมดไว้ที่เดียว
- ✅ User Profile Management: จัดการข้อมูลส่วนตัวและความชอบ
- ✅ Cleaner Navigation: แยกประเภทเมนูให้ชัดเจน ใช้งานง่ายขึ้น
- ✅ Reduced Clutter: Master Data ไม่แน่นเกินไป มีเฉพาะข้อมูลหลัก
- ✅ Better UX: เมนู Settings และ Profile แยกออกจาก Master Data

### Technical Details
- **Frontend Files**:
  - `client/src/pages/Settings.tsx` - Settings page (NEW)
  - `client/src/pages/UserProfile.tsx` - User profile page (NEW)
  - `client/src/components/layout/MainLayout.tsx` v3.0 - Updated navigation
  - `client/src/pages/MasterData.tsx` v3.3 - Removed redundant tabs

## [4.1] - 2025-10-01

### Added - Master Data Viewer
- **Master Data Viewer Component** (`client/src/components/MasterDataViewer.tsx`)
  - หน้าดูข้อมูล Master Data ที่นำเข้าจาก API
  - แสดงข้อมูล Raw Materials, Finished Goods, Customers, Employees
  - ระบบกรองและค้นหาข้อมูล (search by ID/name, filter by source)
  - แสดงสถิติข้อมูล: Total, Active, From API, Manual
  - แสดงข้อมูล: sourceSystem (D365/Manual), lastSyncedAt, isActive
  - Tab "📊 View Data" ใน Master Data Management

### Features
- ✅ Multi-type Data Viewer: ดูข้อมูลทุกประเภทในหน้าเดียว
- ✅ Source Tracking: แสดงว่าข้อมูลมาจาก API หรือป้อนเอง
- ✅ Search & Filter: ค้นหาและกรองข้อมูลได้
- ✅ Sync Status: แสดงเวลา sync ล่าสุดของแต่ละ record
- ✅ Statistics Dashboard: สถิติภาพรวมของข้อมูล

## [4.0] - 2025-10-01

### Added - API-Based Master Data Import System
- **API Settings Entity** (`server/src/entities/api-setting.entity.ts`)
  - เก็บการตั้งค่า External API สำหรับแต่ละประเภทข้อมูล
  - รองรับ authentication: Bearer Token, API Key, Basic Auth
  - ติดตาม sync status และ timestamp
- **API Settings Module** (`server/src/api-settings/`)
  - ApiSettingsService: CRUD operations สำหรับ API configurations
  - ApiSettingsController: REST API endpoints สำหรับจัดการ API settings
  - Password masking: ซ่อนข้อมูล sensitive (tokens, passwords)
- **Import Module** (`server/src/import/`)
  - ImportService v2.0: ดึงข้อมูลจาก External APIs (ไม่ใช่ local files)
  - ImportController: REST API endpoints สำหรับ manual import และ auto-update
  - ImportModule: NestJS module รองรับ dependency injection
- **API Settings UI** (`client/src/components/ApiSettings.tsx`)
  - หน้าตั้งค่า API endpoints สำหรับ Raw Materials, Finished Goods, Employees, Customers
  - รองรับ authentication types: None, Bearer, API Key, Basic Auth
  - แสดงสถานะ sync ล่าสุด (success/partial/failed)
  - Test connection feature
- **Import Functions**
  - `importRawMaterials()`: ดึงข้อมูล Raw Materials จาก External API
  - `importFinishedGoods()`: ดึงข้อมูล Finished Goods + BOQ จาก External API
  - `importAll()`: Import ทั้งหมดพร้อมกัน
  - Upsert logic: อัปเดตถ้ามีอยู่แล้ว, insert ถ้าไม่มี
  - Error handling: ตรวจสอบ API settings ก่อน import
- **Auto-Update System**
  - ตรวจสอบและ update อัตโนมัติวันละครั้ง
  - ทำงานเบื้องหลังเมื่อ user คนแรกเข้าระบบ
  - ใช้ SystemConfig เก็บ `lastAutoUpdateDate` และ `autoUpdateEnabled`
- **Import UI** (`client/src/components/ImportManager.tsx`)
  - Tab "📥 Import Data" ใหม่ใน Master Data Management
  - คำแนะนำให้ตั้งค่า API Settings ก่อนทำ Import
  - แสดงสถานะ last sync และ auto-update status
  - ปุ่ม manual import: Import All, Import RM, Import FG
  - แสดง statistics: inserted/updated/errors
  - แสดงรายการ errors แบบ collapsible

### Changed - Entity Schema Updates
- **Customer, Product, RawMaterial Entities**
  - เพิ่มฟิลด์ `sourceSystem` (nullable): ระบุแหล่งที่มา ('D365', 'Manual')
  - เพิ่มฟิลด์ `lastSyncedAt` (nullable): timestamp ของการ sync ล่าสุด
- **BOM Entity**
  - เพิ่มฟิลด์ `unit`: รองรับหน่วยที่หลากหลาย (kg, m, mm, pcs, sheet, g, etc.)

### Technical Details
- **Backend Files**:
  - `server/src/entities/api-setting.entity.ts` - API Settings entity
  - `server/src/api-settings/` - API Settings module (service, controller)
  - `server/src/import/import.service.ts` - Import logic v2.0 (API-based)
  - `server/src/import/import.controller.ts` - API endpoints
  - `server/src/import/import.module.ts` - Module definition
  - `server/src/app.module.ts` - เพิ่ม ImportModule และ ApiSettingsModule
- **Frontend Files**:
  - `client/src/components/ApiSettings.tsx` - API Settings UI
  - `client/src/components/ImportManager.tsx` - Import UI component
  - `client/src/pages/MasterData.tsx` - เพิ่ม Import และ API Settings tabs
- **API Endpoints (Import)**:
  - `POST /api/import/all` - Import ทั้งหมด
  - `POST /api/import/raw-materials` - Import เฉพาะ RM
  - `POST /api/import/finished-goods` - Import เฉพาะ FG
  - `GET /api/import/status` - ดูสถานะ import
  - `GET /api/import/should-auto-update` - ตรวจสอบว่าควร auto-update หรือไม่
  - `POST /api/import/auto-update` - Trigger auto-update
- **API Endpoints (API Settings)**:
  - `GET /api/api-settings` - ดู API settings ทั้งหมด
  - `GET /api/api-settings/:apiType` - ดู API setting ตามประเภท
  - `POST /api/api-settings` - สร้าง API setting ใหม่
  - `PUT /api/api-settings/:apiType` - อัปเดต API setting
  - `DELETE /api/api-settings/:apiType` - ลบ API setting
  - `POST /api/api-settings/:apiType/test` - ทดสอบการเชื่อมต่อ API

### Features
- ✅ API Configuration: ตั้งค่า External API endpoints พร้อม authentication
- ✅ Multiple Auth Types: รองรับ Bearer Token, API Key, Basic Auth
- ✅ API-Based Import: ดึงข้อมูลจาก External APIs แทน local files
- ✅ Manual Import: Import ข้อมูลได้ทันทีผ่าน UI
- ✅ Auto-Update: ระบบ update ข้อมูลอัตโนมัติวันละครั้ง
- ✅ Background Processing: ไม่กระทบการทำงานของ frontend
- ✅ Error Handling: แสดง errors และสถิติการ import
- ✅ Data Tracking: ติดตามแหล่งที่มาและเวลา sync
- ✅ Security: Password/token masking ใน API responses

### Breaking Changes
- ⚠️ ImportService ไม่รองรับ file-based import อีกต่อไป ต้องตั้งค่า API Settings ก่อน
- ⚠️ ต้องสร้าง ApiSetting records ในฐานข้อมูลก่อนจะ import ได้

### Documentation
- 📚 API_SETUP_GUIDE.md - คู่มือการตั้งค่า External APIs
- 📚 IMPORT_GUIDE.md - คู่มือการใช้งานระบบ Import (updated)

## [3.10] - 2025-09-22

### Fixed
- **Critical**: Fixed "Failed to create the price request" error caused by Foreign Key constraints
- **Database**: Made `customerId`, `productId`, and `createdBy` columns nullable in PriceRequest entity
- **Service**: Enhanced DataService to properly handle null foreign keys
- **Package**: Resolved Git merge conflicts in server/package.json

### Changed
- **Architecture**: Completely eliminated all mock data and hardcoded values
- **Database**: Full migration to SQLite database with TypeORM entities
- **Authentication**: Replaced hardcoded admin/admin with JWT + bcrypt authentication
- **API**: Updated all endpoints from `/mock-data` to `/api/data`
- **Frontend**: Updated all API calls to use new database-backed endpoints

### Added
- **Database Entities**:
  - User (UUID primary key, bcrypt passwords)
  - Customer, Product, RawMaterial
  - PriceRequest (with nullable foreign keys)
  - CustomerGroup, SystemConfig
- **Authentication**: Real JWT token generation and verification
- **Data Seeding**: Automatic database seeding with master data
- **User Repository**: Added User repository injection to DataService

### Technical Details
- **Files Modified**:
  - `src/entities/price-request.entity.ts` (lines 17, 24, 32)
  - `src/data/data.service.ts` (lines 60-114)
  - `server/package.json` (dependencies consolidation)
- **Database**: SQLite for development, PostgreSQL for production
- **ORM**: TypeORM with proper entity relationships
- **Security**: bcrypt password hashing, JWT tokens

## [3.9] - Previous Release
- Initial project setup
- Basic frontend and backend structure

## [3.8] - Previous Release
- Setup wizard implementation
- Basic mock data system

---

**Legend:**
- 🔧 **Fixed**: Bug fixes
- 🔄 **Changed**: Changes in existing functionality
- ✨ **Added**: New features
- 🗑️ **Removed**: Removed features
- ⚠️ **Deprecated**: Soon-to-be removed features
- 🔒 **Security**: Security-related changes