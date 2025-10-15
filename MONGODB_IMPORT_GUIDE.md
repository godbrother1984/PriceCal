# MongoDB Master Data Import Guide

**เวอร์ชัน**: v5.3 (Universal Sync with Toggle Control)
**วันที่**: 9 ตุลาคม 2568
**สถานะ**: ✅ พร้อมใช้งาน

---

## 📋 ภาพรวม

ระบบ PriceCal ใช้ **Hybrid Architecture + Universal Sync Toggle** สำหรับ Master Data:

```
┌──────────────┐
│   MongoDB    │ (External - ERP/D365)
│  Master Data │
└──────┬───────┘
       │
       │ ① Import/Sync (MongoDB → SQLite/PostgreSQL)
       │    - ตรวจสอบ SyncConfig.isEnabled
       │    - ถ้าเปิด → ดึงข้อมูล
       ↓
┌──────────────────────────────┐
│  Import Service              │
│  - importCustomers    (NEW)  │
│  - importProducts     (NEW)  │
│  - importStandardPrices      │
│  - importLmePrices           │
│  - importExchangeRates       │
│  - importAllData      (NEW)  │
└──────┬───────────────────────┘
       │
       │ ② Upsert to Local DB (INSERT or UPDATE)
       │    - อัพเดท SyncConfig (lastSyncAt, status)
       ↓
┌───────────────────────────┐
│  SQLite (Dev)             │
│  PostgreSQL (Prod)        │
│  ├─ customers             │ ← from MongoDB (toggleable)
│  ├─ products              │ ← from MongoDB (toggleable)
│  ├─ standard_prices       │ ← from MongoDB (toggleable)
│  ├─ lme_master_data       │ ← from MongoDB (toggleable)
│  ├─ exchange_rate_master  │ ← from MongoDB (toggleable)
│  ├─ fab_costs             │ ← from MongoDB (toggleable)
│  └─ selling_factors       │ ← from MongoDB (toggleable)
└──────┬────────────────────┘
       │
       │ ③ Query from Local DB
       ↓
┌────────────────────────────┐
│  PriceCalculationService   │
│  (ใช้ TypeORM + SQLite/PG) │
└────────────────────────────┘
```

---

## 🎯 Entities ที่รองรับ Universal Sync (v5.3)

| Entity | MongoDB Collection | Local Table | Toggle | Status |
|--------|-------------------|-------------|--------|--------|
| **Customers** | `customers` | `customers` | ✅ Yes | 🆕 NEW |
| **Products (FG)** | `products` | `products` | ✅ Yes | 🆕 NEW |
| Raw Materials | `raw_materials` | `raw_materials` | ✅ Yes | ⏸️ Optional |
| BOM | `bom` | `bom` | ✅ Yes | ⏸️ Optional |
| **Standard Prices** | `standard_prices` | `standard_prices` | ✅ Yes | ✅ Enabled |
| **LME Prices** | `lme_master_data` | `lme_master_data` | ✅ Yes | ✅ Enabled |
| **Exchange Rates** | `exchange_rate_master_data` | `exchange_rate_master_data` | ✅ Yes | ✅ Enabled |
| FAB Costs | `fab_costs` | `fab_costs` | ✅ Yes | ⏸️ Optional |
| Selling Factors | `selling_factors` | `selling_factors` | ✅ Yes | ⏸️ Optional |

---

## 🔧 การตั้งค่า MongoDB Connection

### Environment Variables

```bash
# MongoDB Connection (required)
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=pricecal
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password

# Or use URI directly
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
```

### ตรวจสอบ Connection

```bash
# ใน MongoDB shell
use pricecal
db.getCollectionNames()
```

---

## 🚀 การใช้งาน (v5.3 - Universal Sync with Toggle)

### 1. Initialize Sync Configs (ครั้งแรก)

สร้างการตั้งค่าเริ่มต้นสำหรับทุก entity:

```bash
POST http://localhost:3001/api/sync-config/initialize
```

**Response:**
```json
{
  "success": true,
  "message": "Initialized 9 sync configs",
  "data": [
    { "entityType": "CUSTOMER", "isEnabled": false, "mongoCollection": "customers", ... },
    { "entityType": "PRODUCT", "isEnabled": false, "mongoCollection": "products", ... },
    ...
  ]
}
```

### 2. เปิดใช้งาน Sync สำหรับ Entities ที่ต้องการ

**เปิด Sync สำหรับ Customer:**
```bash
POST http://localhost:3001/api/sync-config/CUSTOMER/enable
```

**เปิด Sync สำหรับ Product:**
```bash
POST http://localhost:3001/api/sync-config/PRODUCT/enable
```

**เปิด Sync สำหรับ Standard Prices:**
```bash
POST http://localhost:3001/api/sync-config/STANDARD_PRICE/enable
```

**เปิดหลาย entities พร้อมกัน (Bulk Update):**
```bash
POST http://localhost:3001/api/sync-config/bulk-update
Content-Type: application/json

{
  "updates": [
    { "entityType": "CUSTOMER", "isEnabled": true },
    { "entityType": "PRODUCT", "isEnabled": true },
    { "entityType": "STANDARD_PRICE", "isEnabled": true },
    { "entityType": "LME_PRICE", "isEnabled": true },
    { "entityType": "EXCHANGE_RATE", "isEnabled": true }
  ]
}
```

### 3. Sync Data (เฉพาะที่เปิดใช้งาน)

**Sync แต่ละ entity แยกกัน:**

```bash
# Sync Customers
POST http://localhost:3001/api/import/sync/customers

# Sync Products
POST http://localhost:3001/api/import/sync/products

# Sync Standard Prices
POST http://localhost:3001/api/import/sync/standard-prices

# Sync LME Prices
POST http://localhost:3001/api/import/sync/lme-prices

# Sync Exchange Rates
POST http://localhost:3001/api/import/sync/exchange-rates
```

**Sync ทุกอย่างพร้อมกัน:**

```bash
POST http://localhost:3001/api/import/sync/all
```

**Response:**
```json
{
  "success": true,
  "message": "Imported 5/5 entities successfully",
  "results": {
    "customers": {
      "success": true,
      "message": "Customers imported successfully",
      "stats": { "customers": { "inserted": 50, "updated": 10, "errors": 0 } }
    },
    "products": {
      "success": true,
      "message": "Products imported successfully",
      "stats": { "finishedGoods": { "inserted": 100, "updated": 20, "errors": 0 } }
    },
    "standardPrices": { ... },
    "lmePrices": { ... },
    "exchangeRates": { ... }
  }
}
```

### 4. ตรวจสอบสถานะ Sync

**ดู Sync Summary:**
```bash
GET http://localhost:3001/api/sync-config/summary/all
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 9,
    "enabled": 5,
    "disabled": 4,
    "configs": [
      {
        "entityType": "CUSTOMER",
        "isEnabled": true,
        "lastSyncAt": "2025-10-09T10:30:00Z",
        "lastSyncStatus": "success",
        "lastSyncRecords": 50
      },
      ...
    ]
  }
}
```

**ดูการตั้งค่าของ entity เฉพาะ:**
```bash
GET http://localhost:3001/api/sync-config/CUSTOMER
```

### 5. ปิดใช้งาน Sync

```bash
POST http://localhost:3001/api/sync-config/CUSTOMER/disable
```

---

## 📚 Legacy Endpoints (Backward Compatibility)

### Import Master Data ทั้งหมดผ่าน API (Old Method)

```bash
POST http://localhost:3001/api/import/master-data/all
```

**Response:**
```json
{
  "success": true,
  "message": "All Master Data imported successfully",
  "results": {
    "standardPrices": {
      "success": true,
      "message": "Standard Prices imported successfully",
      "stats": {
        "rawMaterials": { "inserted": 150, "updated": 30, "errors": 0 }
      }
    },
    "lmePrices": {
      "success": true,
      "message": "LME Prices imported successfully",
      "stats": {
        "rawMaterials": { "inserted": 20, "updated": 5, "errors": 0 }
      }
    },
    "exchangeRates": {
      "success": true,
      "message": "Exchange Rates imported successfully",
      "stats": {
        "rawMaterials": { "inserted": 5, "updated": 2, "errors": 0 }
      }
    }
  }
}
```

### 2. Import แยกตาม Master Data

#### Standard Prices
```bash
POST http://localhost:3001/api/import/master-data/standard-prices
```

#### LME Prices
```bash
POST http://localhost:3001/api/import/master-data/lme-prices
```

#### Exchange Rates
```bash
POST http://localhost:3001/api/import/master-data/exchange-rates
```

---

## 📊 โครงสร้างข้อมูลใน MongoDB

### Standard Prices Collection

```json
{
  "_id": "mongo-object-id",
  "rawMaterialId": "RM-AL-01",
  "price": 125.50,
  "currency": "USD",
  "version": 1,
  "status": "Active",
  "approvedBy": "admin",
  "approvedAt": "2025-10-07T10:00:00Z",
  "effectiveFrom": "2025-10-01",
  "effectiveTo": null,
  "isActive": true,
  "createdAt": "2025-10-01T08:00:00Z",
  "updatedAt": "2025-10-01T08:00:00Z"
}
```

### LME Master Data Collection

```json
{
  "_id": "mongo-object-id",
  "itemGroupName": "Aluminum",
  "itemGroupCode": "AL",
  "price": 2500.00,
  "currency": "USD",
  "customerGroupId": null,
  "version": 1,
  "status": "Active",
  "isActive": true,
  "description": "London Metal Exchange Aluminum Price",
  "createdAt": "2025-10-01T08:00:00Z",
  "updatedAt": "2025-10-07T10:00:00Z"
}
```

### Exchange Rate Master Data Collection

```json
{
  "_id": "mongo-object-id",
  "sourceCurrencyCode": "USD",
  "sourceCurrencyName": "US Dollar",
  "destinationCurrencyCode": "THB",
  "destinationCurrencyName": "Thai Baht",
  "rate": 35.50,
  "customerGroupId": null,
  "version": 1,
  "status": "Active",
  "isActive": true,
  "createdAt": "2025-10-01T08:00:00Z",
  "updatedAt": "2025-10-07T10:00:00Z"
}
```

---

## 🔄 Import Logic

### Upsert Strategy (Insert หรือ Update)

```typescript
// Check if exists
const existing = await repository.findOne({
  where: { rawMaterialId: item.rawMaterialId, version: item.version }
});

if (existing) {
  // UPDATE existing record
  await repository.update(existing.id, { ...updates });
} else {
  // INSERT new record
  const newRecord = repository.create({ ...data });
  await repository.save(newRecord);
}
```

### Version Control

- ทุก Master Data มี `version` field
- การ import จะเช็ค `(rawMaterialId, version)` เพื่อหา record ที่ตรงกัน
- ถ้ามี version ใหม่จาก MongoDB → INSERT เป็น record ใหม่
- ถ้า version เดิม → UPDATE ข้อมูล

---

## ⚙️ การทำงานอัตโนมัติ (Auto-Sync)

### Option 1: Manual Import (ปัจจุบัน)
- เรียก API เมื่อต้องการ sync
- ใช้สำหรับ development

### Option 2: Scheduled Import (อนาคต)
```typescript
// ใช้ @nestjs/schedule
@Cron('0 0 * * *') // ทุกวันเที่ยงคืน
async scheduledImport() {
  await this.importService.importAllMasterData();
}
```

### Option 3: On-Demand Import
- Import เมื่อ user login ครั้งแรกในวัน
- เรียก `POST /api/import/auto-update`

---

## 🔍 ตรวจสอบสถานะ

### Check Last Sync Status

```bash
GET http://localhost:3001/api/import/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSyncTimestamp": "2025-10-07T10:30:00Z",
    "daysSinceLastSync": 0
  }
}
```

---

## 🐛 Troubleshooting

### 1. MongoDB Connection Failed

**Error:** `MongoDB connection error: connect ECONNREFUSED`

**Solution:**
```bash
# ตรวจสอบว่า MongoDB รันอยู่
mongosh mongodb://localhost:27017

# ตรวจสอบ environment variables
echo $MONGODB_HOST
echo $MONGODB_URI
```

### 2. Collection Not Found

**Error:** `Collection 'standard_prices' not found`

**Solution:**
```javascript
// สร้าง collection ใน MongoDB
use pricecal
db.createCollection('standard_prices')
db.createCollection('lme_master_data')
db.createCollection('exchange_rate_master_data')
```

### 3. Import Errors

**Error:** `Error importing standard price: Duplicate entry`

**Solution:**
- ตรวจสอบ unique constraints ใน SQLite/PostgreSQL
- ตรวจสอบ version field ใน MongoDB data
- ดู error messages ใน response.errors array

---

## 📝 Best Practices

### 1. Import Frequency
- **Development**: Manual import เมื่อต้องการ
- **Production**: Auto-sync ทุกวันตอนเที่ยงคืน

### 2. Error Handling
- ระบบจะ log errors แต่ไม่ stop import
- ตรวจสอบ `errors` array ใน response
- Review logs: `[ImportService] Error importing...`

### 3. Data Validation
- MongoDB data ต้องมี required fields:
  - `rawMaterialId` (Standard Price)
  - `itemGroupCode` (LME)
  - `sourceCurrencyCode`, `destinationCurrencyCode` (Exchange Rate)
- `status` ต้องเป็น `'Active'` เพื่อให้ import
- `isActive` ต้องเป็น `true`

### 4. Performance
- Default limit: 10,000 records per import
- ใช้ indexes ใน MongoDB สำหรับ query performance:
  ```javascript
  db.standard_prices.createIndex({ rawMaterialId: 1, version: -1 })
  db.lme_master_data.createIndex({ itemGroupCode: 1, isActive: 1 })
  ```

---

## 🔐 Security

### MongoDB Authentication
```bash
# With username/password
MONGODB_URI=mongodb://user:pass@host:27017/pricecal?authSource=admin

# With SSL
MONGODB_URI=mongodb://user:pass@host:27017/pricecal?ssl=true&authSource=admin
```

### API Security
- ใช้ JWT authentication (อนาคต)
- Restrict import endpoints to admin users only
- Rate limiting สำหรับ import API

---

## 📈 Monitoring

### Import Statistics

```typescript
// Response จาก import API
{
  "stats": {
    "rawMaterials": {
      "inserted": 150,  // records ใหม่
      "updated": 30,    // records ที่อัปเดต
      "errors": 2       // จำนวน errors
    }
  },
  "errors": [
    "Error processing RM-AL-01: Duplicate entry",
    "Error processing RM-CU-05: Invalid currency"
  ]
}
```

### Logs

```bash
# ดู logs
[ImportService] Starting Standard Prices import from MongoDB
[ImportService] Standard Prices import completed: 150 inserted, 30 updated, 2 errors
[ImportService] Failed to import standard prices: Connection timeout
```

---

## 🚀 Future Enhancements

1. **Scheduled Sync** - Auto-import ทุกวัน
2. **Incremental Sync** - Import เฉพาะข้อมูลที่เปลี่ยนแปลง
3. **Conflict Resolution** - จัดการ conflicts เมื่อ local data แก้ไข
4. **Import History** - เก็บประวัติการ import
5. **Rollback** - Rollback import เมื่อ error
6. **Dashboard** - UI สำหรับดู import status และ statistics

---

## 📞 Support

ถ้ามีปัญหาเกี่ยวกับ MongoDB Import:
1. ตรวจสอบ logs: `[ImportService]`
2. ตรวจสอบ MongoDB connection
3. ตรวจสอบ data structure ใน MongoDB
4. ดู CHANGELOG.md สำหรับ updates ล่าสุด

---

**สรุป**: ระบบ MongoDB Import พร้อมใช้งาน! 🎉
Master Data จาก MongoDB จะถูก sync มายัง SQLite/PostgreSQL และ PriceCalculationService จะ query จาก Local Database ตามปกติ
