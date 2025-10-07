# 🔌 คู่มือการตั้งค่า API สำหรับ Master Data Import

**Version:** 4.1
**Last Updated:** 1 ตุลาคม 2568

---

## 📋 สารบัญ
1. [ภาพรวม](#ภาพรวม)
2. [ขั้นตอนการตั้งค่า](#ขั้นตอนการตั้งค่า)
3. [รายละเอียด API แต่ละประเภท](#รายละเอียด-api-แต่ละประเภท)
4. [Authentication Types](#authentication-types)
5. [ตัวอย่างการตั้งค่า](#ตัวอย่างการตั้งค่า)
6. [การทดสอบ API](#การทดสอบ-api)
7. [Troubleshooting](#troubleshooting)

---

## ภาพรวม

ระบบ PriceCal ดึงข้อมูล master data จาก **External API** (เช่น D365) โดยต้องตั้งค่า API endpoints สำหรับแต่ละประเภทข้อมูล:

| ประเภท | API Type | ข้อมูลที่ดึง |
|--------|----------|--------------|
| 🔧 Raw Materials | `RAW_MATERIALS` | วัตถุดิบทั้งหมด |
| 📦 Finished Goods | `FINISHED_GOODS` | สินค้าสำเร็จรูป + BOQ |
| 👥 Employees | `EMPLOYEES` | ข้อมูลพนักงาน (Optional) |
| 🏢 Customers | `CUSTOMERS` | ข้อมูลลูกค้า (Optional) |

---

## ขั้นตอนการตั้งค่า

### 1. เข้าสู่หน้า API Settings

1. Login เข้าระบบ PriceCal
2. ไปที่ **Master Data** menu
3. คลิกแท็บ **🔌 API Settings**

### 2. ตั้งค่า API แต่ละประเภท

สำหรับแต่ละการ์ด (Raw Materials, Finished Goods, ฯลฯ):

#### ขั้นตอน:

1. **คลิก "ตั้งค่า API"** (สำหรับ API ใหม่)
   หรือ **"แก้ไข"** (สำหรับ API ที่มีอยู่แล้ว)

2. **กรอกข้อมูลพื้นฐาน:**
   ```
   API URL: https://your-api.com/endpoint
   คำอธิบาย: (optional) ระบุรายละเอียดเพิ่มเติม
   ```

3. **เลือก Authentication Type:**
   - No Authentication
   - Bearer Token
   - API Key
   - Basic Auth (Username/Password)

4. **กรอกข้อมูล Authentication** (ขึ้นอยู่กับประเภท)

5. **เปิดใช้งาน:**
   - ✅ Enable this API

6. **คลิก "บันทึก"**

### 3. ตรวจสอบการตั้งค่า

หลังบันทึก จะแสดง:
- ✅ **URL** ที่ตั้งค่าไว้
- ✅ **Auth Type**
- ✅ **Last Sync** (เวลา sync ล่าสุด)
- ✅ **Status** (success/partial/failed)

---

## รายละเอียด API แต่ละประเภท

### 1. Raw Materials API (`RAW_MATERIALS`)

**วัตถุประสงค์:** ดึงข้อมูลวัตถุดิบทั้งหมด

**Response Format ที่ต้องการ:**
```json
{
  "parmInventTableRMInfoList": [
    {
      "ItemId": "BRA0000524000000",
      "Product name": "ลวดเชื่อม 5% (2.4x500mm.)",
      "Search name": "02-BR00-050000",
      "Item Group": "RM02-ACC",
      "CurrencyCode": "THB",
      "CIG Standard Price": 2450.0,
      "Last Price": 2450.0,
      "Inventory Average": 0.46,
      "DataArea": "bss",
      "ModifiedDateTime": "2025-01-15T12:00:00"
    }
  ]
}
```

**ฟิลด์ที่จำเป็น:**
- `ItemId` (required): รหัสวัตถุดิบ
- `Product name` หรือ `Search name` (required): ชื่อวัตถุดิบ
- `Item Group`: หมวดหมู่

---

### 2. Finished Goods API (`FINISHED_GOODS`)

**วัตถุประสงค์:** ดึงข้อมูลสินค้าสำเร็จรูปพร้อม BOQ (Bill of Quantities)

**Response Format ที่ต้องการ:**
```json
{
  "InventTableFGInfoList": [
    {
      "ItemId FG": "ACAHU23014200",
      "Product name": "AIR HANDLING UNIT...",
      "Search name": "AC230142-00-00",
      "Item Group": "FG-AC",
      "DataArea": "bss",
      "ModifiedDate": "2025-01-24T12:00:00",
      "CIGSQInch": 617000.0,
      "Model": "39FD680RDZ710-LH",
      "Part": "B2-2",
      "ItemId RM": [
        {
          "ItemId": "PLA0061448000001",
          "Qty": 2.602,
          "Unit": "sheet"
        },
        {
          "ItemId": "BRA0010016000000",
          "Qty": 1879.8,
          "Unit": "g"
        }
      ]
    }
  ]
}
```

**ฟิลด์ที่จำเป็น:**
- `ItemId FG` (required): รหัสสินค้าสำเร็จรูป
- `Product name`: ชื่อสินค้า
- `ItemId RM` (array): รายการวัตถุดิบใน BOQ
  - `ItemId`: รหัสวัตถุดิบ
  - `Qty`: ปริมาณ
  - `Unit`: หน่วย (kg, g, m, mm, pcs, sheet, ฯลฯ)

---

### 3. Employees API (`EMPLOYEES`) - Optional

**วัตถุประสงค์:** ดึงข้อมูลพนักงาน

**Response Format:**
```json
{
  "EmployeeList": [
    {
      "EmployeeId": "EMP001",
      "Name": "สมชาย ใจดี",
      "Email": "somchai@company.com",
      "Department": "Sales"
    }
  ]
}
```

---

### 4. Customers API (`CUSTOMERS`) - Optional

**วัตถุประสงค์:** ดึงข้อมูลลูกค้า

**Response Format:**
```json
{
  "CustomerList": [
    {
      "CustomerId": "CUST001",
      "Name": "บริษัท ABC จำกัด",
      "ContactPerson": "นายพงศ์พัฒน์",
      "Phone": "02-123-4567",
      "Email": "contact@abc.com"
    }
  ]
}
```

---

## Authentication Types

### 1. No Authentication
ไม่ต้องการ authentication

**การตั้งค่า:**
- Authentication Type: `No Authentication`

**ตัวอย่าง API Call:**
```http
GET https://api.example.com/inventory/raw-materials
```

---

### 2. Bearer Token
ใช้ Bearer token ใน Authorization header

**การตั้งค่า:**
- Authentication Type: `Bearer Token`
- Bearer Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**ตัวอย่าง API Call:**
```http
GET https://api.example.com/inventory/raw-materials
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. API Key
ใช้ API key ใน X-API-Key header

**การตั้งค่า:**
- Authentication Type: `API Key`
- API Key: `sk_live_abc123xyz789`

**ตัวอย่าง API Call:**
```http
GET https://api.example.com/inventory/raw-materials
X-API-Key: sk_live_abc123xyz789
```

---

### 4. Basic Auth
ใช้ Username และ Password

**การตั้งค่า:**
- Authentication Type: `Basic Auth`
- Username: `api_user`
- Password: `api_password`

**ตัวอย่าง API Call:**
```http
GET https://api.example.com/inventory/raw-materials
Authorization: Basic YXBpX3VzZXI6YXBpX3Bhc3N3b3Jk
```

---

## ตัวอย่างการตั้งค่า

### ตัวอย่าง 1: D365 with Bearer Token

**Raw Materials API:**
```
API URL: https://d365.company.com/api/GetInventTableRM
Authentication Type: Bearer Token
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...
Enable: ✅
```

**Finished Goods API:**
```
API URL: https://d365.company.com/api/GetInventTableFG
Authentication Type: Bearer Token
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...
Enable: ✅
```

---

### ตัวอย่าง 2: Custom API with API Key

**Raw Materials API:**
```
API URL: https://api.yourcompany.com/v1/raw-materials
Authentication Type: API Key
API Key: sk_live_abc123xyz789def456
Enable: ✅
```

---

### ตัวอย่าง 3: Internal API with Basic Auth

**Raw Materials API:**
```
API URL: http://internal-api.local/inventory/raw-materials
Authentication Type: Basic Auth
Username: inventory_reader
Password: SecureP@ssw0rd
Enable: ✅
```

---

## การทดสอบ API

### ทดสอบด้วย cURL

#### 1. Bearer Token
```bash
curl -X GET "https://api.example.com/GetInventTableRM" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2. API Key
```bash
curl -X GET "https://api.example.com/raw-materials" \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

#### 3. Basic Auth
```bash
curl -X GET "https://api.example.com/raw-materials" \
  -u "username:password"
```

### ทดสอบด้วย Postman

1. เปิด Postman
2. สร้าง Request ใหม่
3. ตั้งค่า:
   - Method: `GET`
   - URL: `https://your-api.com/endpoint`
   - Headers/Authorization: ตามประเภทที่ใช้
4. คลิก **Send**
5. ตรวจสอบ Response ว่าตรงกับ format ที่ระบุหรือไม่

---

## Troubleshooting

### ❌ "API not configured"
**สาเหตุ:** ยังไม่ได้ตั้งค่า API
**แก้ไข:** ไปที่ API Settings และตั้งค่า API

### ❌ "Fetch failed" / "Network error"
**สาเหตุ:** ไม่สามารถเชื่อมต่อกับ API
**แก้ไข:**
- ตรวจสอบ URL ว่าถูกต้อง
- ตรวจสอบ network/firewall
- ทดสอบด้วย cURL หรือ Postman

### ❌ "401 Unauthorized"
**สาเหตุ:** Authentication ไม่ถูกต้อง
**แก้ไข:**
- ตรวจสอบ token/key/password
- ตรวจสอบว่า token หมดอายุหรือไม่
- ตรวจสอบ permission ของ API user

### ❌ "No data returned from API"
**สาเหตุ:** API response ไม่ตรงกับ format
**แก้ไข:**
- ตรวจสอบ response format
- ตรวจสอบ field names (`parmInventTableRMInfoList`, `InventTableFGInfoList`)
- ดู server logs สำหรับ error details

### ⚠️ "Partial success" status
**สาเหตุ:** บางรายการ import ไม่สำเร็จ
**แก้ไข:**
- ดูรายละเอียด errors ในหน้า Import
- ตรวจสอบข้อมูลใน API response
- แก้ไขข้อมูลที่ผิดพลาดและ import ใหม่

---

## 📞 Support

หากพบปัญหาการตั้งค่า API:
1. ตรวจสอบ server logs: `server/logs/`
2. ทดสอบ API ด้วย Postman/cURL
3. ติดต่อทีมพัฒนา

---

**เอกสารที่เกี่ยวข้อง:**
- [IMPORT_GUIDE.md](./IMPORT_GUIDE.md) - คู่มือการ import
- [CHANGELOG.md](./CHANGELOG.md) - ประวัติการพัฒนา
- [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md) - สรุปการพัฒนา
