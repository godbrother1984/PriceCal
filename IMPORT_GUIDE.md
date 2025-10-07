# คู่มือการใช้งาน Master Data Import System

## 📋 สารบัญ
1. [ภาพรวม](#ภาพรวม)
2. [การใช้งานผ่าน UI](#การใช้งานผ่าน-ui)
3. [API Endpoints](#api-endpoints)
4. [Auto-Update System](#auto-update-system)
5. [โครงสร้างข้อมูล](#โครงสร้างข้อมูล)
6. [Troubleshooting](#troubleshooting)

---

## ภาพรวม

ระบบ Master Data Import ช่วยให้สามารถนำเข้าข้อมูลหลักจาก D365 (Dynamics 365) เข้าสู่ระบบ PriceCal ได้อัตโนมัติ โดยรองรับ:

- ✅ **Raw Materials** (วัตถุดิบ)
- ✅ **Finished Goods** (สินค้าสำเร็จรูป)
- ✅ **BOQ (Bill of Quantities)** (รายการวัสดุในสินค้าแต่ละชนิด)
- ✅ **Manual Import** (นำเข้าด้วยตนเอง)
- ✅ **Auto-Update** (อัปเดตอัตโนมัติวันละครั้ง)

### ข้อมูลที่ Import
- **Raw Materials**: จาก `API/response_GetInventTableRM.json`
- **Finished Goods + BOQ**: จาก `API/response_GetInventTableFG.json`

---

## การใช้งานผ่าน UI

### 1. เข้าสู่หน้า Master Data Management

1. Login เข้าสู่ระบบ
2. ไปที่เมนู **Master Data**
3. คลิกที่แท็บ **📥 Import Data**

### 2. ตรวจสอบสถานะ Import

ในหน้า Import Data จะแสดง:

- **Last Sync**: เวลาที่ import ข้อมูลล่าสุด
- **Auto-Update**: สถานะการ auto-update (Enabled/Disabled)

### 3. Import ข้อมูลด้วยตนเอง (Manual Import)

มี 3 ตัวเลือก:

#### 📦 Import All Data
- Import ทั้ง Raw Materials และ Finished Goods พร้อมกัน
- แนะนำสำหรับการ import ครั้งแรกหรือต้องการ refresh ข้อมูลทั้งหมด

#### 🔧 Import Raw Materials
- Import เฉพาะวัตถุดิบ
- ใช้เมื่อต้องการอัปเดตข้อมูล Raw Materials เท่านั้น

#### 📋 Import Finished Goods
- Import สินค้าสำเร็จรูปพร้อม BOQ
- ใช้เมื่อต้องการอัปเดตข้อมูลสินค้าและ BOQ เท่านั้น

### 4. ดูผลลัพธ์การ Import

หลังจาก Import เสร็จสิ้น ระบบจะแสดง:

✅ **สถานะสำเร็จ**:
- จำนวน records ที่ insert ใหม่
- จำนวน records ที่ update
- จำนวน errors (ถ้ามี)

❌ **สถานะล้มเหลว**:
- แสดงข้อความ error
- แสดงรายละเอียด errors (คลิก "Show Errors")

---

## API Endpoints

### GET `/api/import/status`
ดูสถานะการ import ล่าสุด

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSyncedAt": "2025-10-01T10:30:00.000Z",
    "autoUpdateEnabled": true
  }
}
```

### POST `/api/import/all`
Import ข้อมูลทั้งหมด (Raw Materials + Finished Goods)

**Response:**
```json
{
  "success": true,
  "message": "Full import completed...",
  "data": {
    "rawMaterials": {
      "inserted": 15,
      "updated": 3,
      "errors": 0
    },
    "finishedGoods": {
      "inserted": 50,
      "updated": 10,
      "errors": 0
    },
    "bomItems": {
      "inserted": 500,
      "updated": 0,
      "errors": 0
    }
  }
}
```

### POST `/api/import/raw-materials`
Import เฉพาะ Raw Materials

**Request Body (Optional):**
```json
{
  "filePath": "/path/to/custom/file.json"
}
```

### POST `/api/import/finished-goods`
Import เฉพาะ Finished Goods + BOQ

### GET `/api/import/should-auto-update`
ตรวจสอบว่าควร auto-update หรือไม่

**Response:**
```json
{
  "success": true,
  "data": {
    "shouldRun": true
  }
}
```

### POST `/api/import/auto-update`
Trigger auto-update (ถ้ายังไม่ได้ run ในวันนั้น)

---

## Auto-Update System

### การทำงาน

1. **ตรวจสอบทุกครั้งที่ user เข้าระบบ**
   - ระบบจะเช็คว่าวันนี้ update แล้วหรือยัง
   - ถ้ายัง: จะ trigger auto-update
   - ถ้าแล้ว: จะข้ามไป

2. **Update วันละครั้ง**
   - User คนแรกที่เข้าระบบในแต่ละวันจะ trigger update
   - Update ทำงานเบื้องหลัง (background)
   - ไม่กระทบการใช้งาน frontend

3. **การตั้งค่า Auto-Update**

   ใช้ SystemConfig ในฐานข้อมูล:

   ```sql
   -- เปิด/ปิด auto-update
   INSERT INTO system_config (key, value, description)
   VALUES ('autoUpdateEnabled', 'true', 'Enable auto-update daily')
   ON CONFLICT(key) DO UPDATE SET value = 'true';

   -- ดูเวลา update ล่าสุด
   SELECT * FROM system_config WHERE key = 'lastAutoUpdateDate';
   ```

### เปิด/ปิด Auto-Update

**เปิด:**
```sql
UPDATE system_config SET value = 'true' WHERE key = 'autoUpdateEnabled';
```

**ปิด:**
```sql
UPDATE system_config SET value = 'false' WHERE key = 'autoUpdateEnabled';
```

---

## โครงสร้างข้อมูล

### Raw Material JSON Format
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

### Finished Good + BOQ JSON Format
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

### Database Schema Changes

ระบบได้เพิ่มฟิลด์ใหม่ใน Entities:

**Customer, Product, RawMaterial:**
- `sourceSystem` (nullable): 'D365' หรือ 'Manual'
- `lastSyncedAt` (nullable): timestamp ของการ sync ล่าสุด

**BOM:**
- `unit` (default: 'unit'): หน่วยของวัสดุ (kg, m, mm, pcs, sheet, g, etc.)

---

## Troubleshooting

### ❌ Import ล้มเหลว: "File not found"

**สาเหตุ:** ไม่พบไฟล์ JSON ที่ path ที่กำหนด

**แก้ไข:**
1. ตรวจสอบว่ามีโฟลเดอร์ `API/` ใน root ของโปรเจค
2. ตรวจสอบว่ามีไฟล์:
   - `API/response_GetInventTableRM.json`
   - `API/response_GetInventTableFG.json`
3. ตรวจสอบ permission ของไฟล์

### ❌ Import ล้มเหลว: "Foreign Key constraint failed"

**สาเหตุ:** BOQ อ้างอิง Raw Material ที่ไม่มีในระบบ

**แก้ไข:**
1. Import Raw Materials ก่อน
2. จากนั้นค่อย Import Finished Goods

**แนะนำ:** ใช้ "Import All Data" เพื่อ import ทุกอย่างพร้อมกัน

### ⚠️ Auto-Update ไม่ทำงาน

**ตรวจสอบ:**
1. เช็คว่า autoUpdateEnabled = 'true'
   ```sql
   SELECT * FROM system_config WHERE key = 'autoUpdateEnabled';
   ```

2. เช็ค server logs สำหรับ errors

3. ทดสอบ manual import ก่อน เพื่อดูว่ามี error หรือไม่

### 📊 ข้อมูลไม่ถูกต้องหลัง Import

**ตรวจสอบ:**
1. ดูรายละเอียด errors ใน Import result
2. ตรวจสอบรูปแบบข้อมูลใน JSON files
3. เช็ค server logs: `server/logs/` (ถ้ามี)

### 🔄 Re-import ข้อมูล

ถ้าต้องการ import ใหม่:
1. Import จะ **upsert** ข้อมูล (update ถ้ามี, insert ถ้าไม่มี)
2. **BOQ จะถูกลบและสร้างใหม่** เพื่อป้องกัน duplicates
3. ข้อมูลเดิมที่ไม่ได้อยู่ใน JSON จะยังคงอยู่

---

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ CHANGELOG.md
2. ดู server logs
3. ติดต่อทีมพัฒนา

---

**Version:** 4.0
**Last Updated:** 1 ตุลาคม 2568
**Author:** PriceCal Development Team
