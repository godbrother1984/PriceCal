# เอกสารโครงการ PriceCal (FG Pricing System)

**Path:** C:\Project\PriceCal\เอกสารโครงการ-PriceCal.md  
**Version:** 1.0  
**Date:** 10 กันยายน 2568  
**Time:** 21:00 น.

---

## 🎯 ภาพรวมโครงการ

**PriceCal** เป็นระบบคำนวณราคาสำหรับอุตสาหกรรมการผลิต (FG Pricing System) ที่พัฒนาขึ้นเพื่อช่วยในการจัดการและคำนวณต้นทุนและราคาขายของผลิตภัณฑ์อย่างมีประสิทธิภาพ

### 🏢 ข้อมูลโครงการ
- **ชื่อโครงการ:** FG Pricing System (PriceCal)
- **ประเภท:** Web Application (Full-Stack)
- **ผู้พัฒนา:** Costing Team
- **เวอร์ชันปัจจุบัน:** Client v2.1.0, Server v1.0.0
- **สถานะ:** กำลังพัฒนา (Active Development)

---

## 🛠️ สถาปัตยกรรมระบบ

### Frontend (Client)
- **Framework:** React 18.2.0 + TypeScript
- **Build Tool:** Vite 5.0.8
- **UI Framework:** Tailwind CSS 3.3.6
- **State Management:** React Hooks (useState, useEffect)
- **HTTP Client:** Axios 1.6.0

### Backend (Server)
- **Framework:** NestJS 10.4.20
- **Runtime:** Node.js + TypeScript
- **Architecture:** RESTful API
- **Validation:** class-validator + class-transformer
- **Testing:** Jest

### Database
- **สถานะปัจจุบัน:** Mock Data Service (JSON)
- **แผนอนาคต:** PostgreSQL หรือ MySQL

---

## 🏗️ โครงสร้างโครงการ

```
PriceCal/
├── client/                    # Frontend Application
│   ├── src/
│   │   ├── components/        # React Components
│   │   │   └── layout/        # Layout Components
│   │   ├── pages/            # Page Components
│   │   └── services/         # API Services
│   ├── package.json
│   └── vite.config.ts
│
├── server/                   # Backend Application
│   ├── src/
│   │   ├── auth/            # Authentication Module
│   │   ├── pricing/         # Pricing Logic Module
│   │   ├── master-data/     # Master Data Management
│   │   ├── setup/           # System Setup Module
│   │   ├── common/          # Shared Components
│   │   └── mock-data/       # Mock Data Service
│   └── package.json
│
├── UI_DESIGN_STANDARDS.md   # Design System Documentation
└── README.md               # Project Documentation
```

---

## 🚀 ฟีเจอร์หลัก

### 1. ระบบตั้งค่าเริ่มต้น (Setup Wizard)
- **หน้าที่:** ติดตั้งระบบในครั้งแรก
- **ไฟล์:** `client/src/pages/SetupWizard.tsx`
- **คุณสมบัติ:**
  - 3-Step Wizard Interface
  - ตั้งค่าข้อมูลบริษัท
  - สร้าง Admin Account
  - Progress Tracking

### 2. ระบบยืนยันตัวตน (Authentication)
- **หน้าที่:** ล็อกอิน/ออกจากระบบ
- **ไฟล์:** `client/src/pages/Login.tsx`, `server/src/auth/`
- **คุณสมบัติ:**
  - Username/Password Authentication
  - Session Management
  - Error Handling

### 3. ระบบคำนวณราคา (Pricing Engine)
- **หน้าที่:** คำนวณต้นทุนและราคาขาย
- **ไฟล์:** `server/src/pricing/pricing.service.ts`
- **คุณสมบัติ:**
  - Base Price Calculation
  - Selling Factor Application
  - Multiple Currency Support

### 4. การจัดการข้อมูลหลัก (Master Data)
- **หน้าที่:** จัดการข้อมูลพื้นฐาน
- **ไฟล์:** `server/src/master-data/`
- **ประเภทข้อมูล:**
  - Customer Groups
  - Exchange Rates
  - FAB Costs
  - Customer Mappings

### 5. หน้าจอหลัก (Main Interface)
- **Pricing View:** แสดงผลการคำนวณ
- **Create Request:** สร้างคำขอราคา
- **Price Request List:** รายการคำขอราคา
- **Master Data:** จัดการข้อมูลหลัก

---

## 🔧 การติดตั้งและใช้งาน

### ข้อกำหนดระบบ
- Node.js >= 16.0.0
- npm หรือ yarn
- Modern Web Browser

### การติดตั้ง

#### 1. Clone Repository
```bash
git clone <repository-url>
cd PriceCal
```

#### 2. ติดตั้ง Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### การรันระบบ

#### 1. เริ่มต้น Backend Server
```bash
cd server
npm run start:dev
# Server จะรันที่ http://localhost:3000
```

#### 2. เริ่มต้น Frontend
```bash
cd client
npm run dev
# Client จะรันที่ http://localhost:5173
```

### การใช้งานครั้งแรก
1. เปิด Browser ไปที่ `http://localhost:5173`
2. ระบบจะแสดง Setup Wizard สำหรับการตั้งค่าเริ่มต้น
3. กรอกข้อมูลบริษัทและตั้งค่า Admin Account
4. เมื่อตั้งค่าเสร็จสิ้น ระบบจะพาไปหน้า Login
5. ใช้ Username: `admin`, Password: `admin` ในการเข้าสู่ระบบ

---

## 🎨 มาตรฐานการออกแบบ

### Color Palette
- **Primary Blue:** `#1493c7` (สีหลักระบบ)
- **Secondary Light Blue:** `#cce4f0` (สีรอง)
- **Background:** `#ffffff` (พื้นหลัง)
- **Accent Red:** `#e53e3e` (สีเตือน/ข้อผิดพลาด)

### Typography
- **Font:** System fonts (system-ui, Segoe UI, Roboto)
- **Headings:** text-2xl font-semibold
- **Body:** text-sm
- **Numbers:** text-2xl font-bold

### UI Components
- **ปุ่มหลัก:** bg-blue-600 hover:bg-blue-700
- **Cards:** rounded-lg shadow-md
- **Forms:** border rounded focus:ring-2 focus:ring-blue-500

รายละเอียดเพิ่มเติม: `UI_DESIGN_STANDARDS.md`

---

## 📊 สถานะการพัฒนา

### ✅ เสร็จสมบูรณ์
- [x] โครงสร้างพื้นฐาน Frontend/Backend
- [x] ระบบ Setup Wizard
- [x] ระบบ Authentication
- [x] Pricing Calculation Engine (Basic)
- [x] Mock Data Service
- [x] UI Design System

### 🔄 กำลังพัฒนา
- [ ] Database Integration
- [ ] Advanced Pricing Logic
- [ ] User Management
- [ ] Reporting Features
- [ ] Data Import/Export

### 📋 แผนพัฒนาต่อ
- [ ] Multi-language Support (Thai/English)
- [ ] Dashboard Analytics
- [ ] API Documentation
- [ ] Unit Testing
- [ ] Deployment Automation

---

## 🔍 รายละเอียดเทคนิค

### API Endpoints
```
POST   /auth/login              # ล็อกอิน
GET    /setup/status            # ตรวจสอบสถานะการติดตั้ง
POST   /setup/initialize        # ติดตั้งระบบ
POST   /pricing/calculate       # คำนวณราคา
GET    /master-data/*           # ดึงข้อมูลหลัก
```

### Frontend Routes
```
/                               # Auto-redirect ตามสถานะ
/login                          # หน้าล็อกอิน
/setup                          # Setup Wizard
/main                           # หน้าหลัก (MainLayout)
```

### State Management
- **Authentication:** sessionStorage
- **Setup Status:** localStorage
- **Component State:** React useState/useEffect

---

## 🧪 การทำ Testing

### Backend Testing
```bash
cd server
npm run test          # Unit Tests
npm run test:cov      # Coverage Report
npm run test:e2e      # End-to-End Tests
```

### Frontend Testing
```bash
cd client
npm run lint          # ESLint Check
npm run type-check    # TypeScript Check
```

---

## 🌐 การ Deploy

### Development Environment
- **Frontend:** Vite Dev Server (Port 5173)
- **Backend:** NestJS Dev Server (Port 3000)
- **CORS:** Enabled for localhost

### Production Considerations
- [ ] Environment Variables Configuration
- [ ] Database Connection
- [ ] SSL Certificate
- [ ] Performance Optimization
- [ ] Security Hardening

---

## 👥 ทีมพัฒนา

- **Backend Developer:** Costing Team
- **Frontend Developer:** Costing Team
- **UI/UX Designer:** Based on UI_DESIGN_STANDARDS.md
- **Project Manager:** TBD

---

## 📞 การติดต่อและสนับสนุน

สำหรับคำถามหรือปัญหาในการใช้งาน:
1. ตรวจสอบเอกสารนี้เสียก่อน
2. ดู Console Logs สำหรับข้อผิดพลาด
3. ติดต่อทีม Costing Team

---

## 📝 หมายเหตุสำหรับนักพัฒนา

### การเพิ่มฟีเจอร์ใหม่
1. ติดตาม Design System ใน `UI_DESIGN_STANDARDS.md`
2. ใส่ File Headers ทุกไฟล์ที่แก้ไข
3. ใช้ TypeScript อย่างเคร่งครัด
4. ทดสอบในทั้ง Development และ Production Build

### การแก้ไขปัญหา
1. ตรวจสอบ Network Tab ใน Browser DevTools
2. ดู Backend Logs ใน Terminal
3. ตรวจสอบ CORS Configuration
4. ยืนยันว่า Backend และ Frontend รันพร้อมกัน

---

*เอกสารนี้จะได้รับการปรับปรุงตามการพัฒนาโครงการ*
*สร้างโดย Claude Code วันที่ 10 กันยายน 2568*