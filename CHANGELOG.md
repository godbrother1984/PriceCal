# Changelog

All notable changes to the PriceCal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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