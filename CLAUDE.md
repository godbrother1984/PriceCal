# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PriceCal คือระบบคำนวณราคาสำหรับองค์กร ประกอบด้วย:
- **Backend**: NestJS API Server (พอร์ต 3000) + SQLite Database + TypeORM
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT + bcrypt (ไม่ใช่ hardcode)

## Development Commands

### Backend (NestJS Server)
```bash
cd server
npm run start:dev          # รัน development server พร้อม watch mode
npm run start             # รัน production mode
npm run build             # build โปรเจค
npm run lint              # ตรวจสอบและแก้ไข linting issues
npm run format            # format โค้ดด้วย prettier
```

### Frontend (React Client)
```bash
cd client
npm run dev               # รัน development server
npm run build             # build สำหรับ production
npm run lint              # ตรวจสอบ ESLint
npm run preview           # preview production build
```

## Architecture Overview

### Backend Structure (NestJS)
- **Main App**: `src/main.ts` - เริ่มต้นแอปที่พอร์ต 3000 พร้อม CORS
- **App Module**: `src/app.module.ts` - กำหนด controllers และ services ทั้งหมด

**Core Modules**:
- `auth/` - ระบบ authentication แบบ temporary (admin/admin)
- `setup/` - Setup Wizard สำหรับการติดตั้งครั้งแรก
- `pricing/` - Logic การคำนวณราคา (ยังเป็น mock data)
- `mock-data/` - จัดการข้อมูลจำลอง

### Frontend Structure (React)
- **App.tsx** - State management หลักสำหรับ authentication และ routing
- **MainLayout.tsx** - Layout หลักพร้อม sidebar navigation
- **Pages**: 
  - `SetupWizard.tsx` - หน้าติดตั้งระบบครั้งแรก
  - `Login.tsx` - หน้า login
  - `PriceRequestList.tsx` - รายการคำขอราคา
  - `CreateRequest.tsx` - สร้าง/แก้ไขคำขอราคา
  - `MasterData.tsx` - จัดการข้อมูลหลัก

### Application Flow
1. **First Run**: SetupWizard → บันทึก `setupComplete` ใน localStorage
2. **Authentication**: Login page (admin/admin) → MainLayout
3. **Navigation**: Sidebar navigation ระหว่าง Price Requests และ Master Data

## Key Technical Details

### State Management
- **App-level**: Authentication state และ setup status
- **MainLayout**: Page navigation และ request editing state
- **Component-level**: Form states และ local UI states

### API Communication
- Base URL: `http://localhost:3000`
- ใช้ fetch API สำหรับการเรียก backend
- CORS enabled ที่ backend

### Styling
- **Framework**: Tailwind CSS
- **Layout**: Responsive design (mobile-first)
- **Components**: Utility-first approach

## Development Guidelines

### File Naming Convention
ทุกไฟล์ที่แก้ไขต้องมี path version และวันที่เวลาไว้ด้วย เช่น:
```typescript
// path: client/src/components/layout/MainLayout.tsx
// version: 2.6 (Final Component Key Fix)
// last-modified: 29 สิงหาคม 2568 15:05
```

### Backend Development
- ใช้ NestJS decorators (`@Controller`, `@Injectable`, `@Get`, `@Post`)
- Return objects แบบ `{ success: boolean, message: string, data?: any }`
- Log การทำงานด้วย `console.log` สำหรับ debugging

### Frontend Development
- ใช้ TypeScript แบบ strict
- State types ให้ระบุชัดเจน (เช่น `Page` type)
- ใช้ Tailwind CSS classes สำหรับ styling
- Component keys สำหรับ force re-render เมื่อจำเป็น

### Database Schema (TypeORM Entities)
- **User**: Authentication และ user management (UUID primary key)
- **Customer**: ข้อมูลลูกค้า
- **Product**: ข้อมูลสินค้า
- **RawMaterial**: ข้อมูลวัตถุดิบ
- **PriceRequest**: คำขอราคา (nullable foreign keys)
- **CustomerGroup**: กลุ่มลูกค้า
- **SystemConfig**: การตั้งค่าระบบ

### Current Status (Updated 22 กันยายน 2568)
- ✅ Database: SQLite พร้อม TypeORM entities
- ✅ Authentication: JWT + bcrypt (แทนที่ hardcode)
- ✅ API Endpoints: ทำงานได้ครบทุก endpoints
- ✅ Data Seeding: ข้อมูลหลักถูกสร้างอัตโนมัติ
- ✅ Foreign Key Management: จัดการได้อย่างถูกต้อง
- ❌ ไม่มี mock data หรือ hardcode ใดๆ แล้ว

## Testing
ยังไม่มี test framework ติดตั้ง - ควรเพิ่มในอนาคต

## Important Notes
- ระบบยังอยู่ใน Phase 1 (MVP)
- Backend รันที่พอร์ต 3000, Frontend รันที่พอร์ต Vite default
- การพัฒนาต้องยึดเอกสารการพัฒนาเป็นหลัก
- ใช้เครื่องมือและ framework ที่ทันสมัย