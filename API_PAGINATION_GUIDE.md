# API Pagination & POST Body Configuration Guide

## 📌 Overview

ระบบรองรับ 2 คุณสมบัติหลัก:
1. **POST Request Body** - ส่ง request body ไปกับ API
2. **Pagination** - ดึงข้อมูลแบบแบ่งหน้าสำหรับ API ที่มีข้อมูลจำนวนมาก

---

## 1. 📤 POST Request Body Configuration

### Use Case
API บางตัวต้องการ POST request พร้อม body แทน GET request

### Configuration Fields

| Field | Description | Example |
|-------|-------------|---------|
| `httpMethod` | HTTP method | `POST` หรือ `GET` |
| `requestBody` | JSON string ของ body | `{"filter": {"status": "active"}}` |
| `dataPath` | JSON path ไปยังข้อมูล | `data.items` |

### ตัวอย่าง 1: Simple POST with Body

```json
{
  "apiType": "RAW_MATERIALS",
  "url": "https://api.example.com/materials",
  "httpMethod": "POST",
  "requestBody": "{\"filter\": {\"active\": true}, \"includeDeleted\": false}",
  "dataPath": "result.materials",
  "authType": "bearer",
  "authToken": "your-token-here"
}
```

**API Request ที่จะถูกส่ง:**
```http
POST https://api.example.com/materials
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "filter": {
    "active": true
  },
  "includeDeleted": false
}
```

### ตัวอย่าง 2: POST with Complex Body

```json
{
  "requestBody": "{\"query\": {\"match\": {\"type\": \"raw_material\"}}, \"sort\": [{\"createdAt\": \"desc\"}], \"size\": 100}"
}
```

---

## 2. 📊 Pagination Configuration

### Pagination Types รองรับ

1. **Offset-based** - ใช้ offset + limit
2. **Page-based** - ใช้ page number + page size
3. **Cursor-based** - ใช้ cursor/token สำหรับหน้าถัดไป

---

### 2.1 Offset-based Pagination

**Use Case:** API ที่ใช้ `offset` และ `limit`

**Configuration:**
```json
{
  "supportsPagination": true,
  "paginationType": "offset",
  "pageSize": 100,
  "offsetParam": "offset",
  "pageSizeParam": "limit",
  "dataPath": "data.items"
}
```

**API Requests:**
```
Page 1: GET /api/materials?offset=0&limit=100
Page 2: GET /api/materials?offset=100&limit=100
Page 3: GET /api/materials?offset=200&limit=100
...
```

---

### 2.2 Page-based Pagination

**Use Case:** API ที่ใช้ `page` และ `pageSize`

**Configuration:**
```json
{
  "supportsPagination": true,
  "paginationType": "page",
  "pageSize": 50,
  "pageNumberParam": "page",
  "pageSizeParam": "pageSize",
  "dataPath": "data"
}
```

**API Requests:**
```
Page 1: GET /api/materials?page=1&pageSize=50
Page 2: GET /api/materials?page=2&pageSize=50
Page 3: GET /api/materials?page=3&pageSize=50
...
```

---

### 2.3 Cursor-based Pagination

**Use Case:** API ที่ใช้ cursor/token (เช่น GraphQL, AWS APIs)

**Configuration:**
```json
{
  "supportsPagination": true,
  "paginationType": "cursor",
  "pageSize": 100,
  "cursorParam": "cursor",
  "pageSizeParam": "limit",
  "dataPath": "data.items",
  "nextCursorPath": "data.nextCursor"
}
```

**API Requests:**
```
Page 1: GET /api/materials?limit=100
Page 2: GET /api/materials?cursor=eyJpZCI6MTAwfQ&limit=100
Page 3: GET /api/materials?cursor=eyJpZCI6MjAwfQ&limit=100
...
```

---

## 3. 🔄 Pagination + POST Body

### Use Case
API ที่ต้องใช้ POST request **และ** มีข้อมูลจำนวนมากที่ต้อง paginate

### Configuration

```json
{
  "apiType": "FINISHED_GOODS",
  "url": "https://api.d365.com/query",
  "httpMethod": "POST",
  "requestBody": "{\"filters\": {\"type\": \"finished_goods\"}, \"fields\": [\"id\", \"name\", \"bom\"]}",
  "supportsPagination": true,
  "paginationType": "offset",
  "pageSize": 200,
  "offsetParam": "offset",
  "pageSizeParam": "limit",
  "dataPath": "result.products",
  "authType": "bearer",
  "authToken": "your-token"
}
```

### ระบบจะทำงานอย่างไร

**Page 1:**
```http
POST https://api.d365.com/query
{
  "filters": {"type": "finished_goods"},
  "fields": ["id", "name", "bom"],
  "offset": 0,
  "limit": 200
}
```

**Page 2:**
```http
POST https://api.d365.com/query
{
  "filters": {"type": "finished_goods"},
  "fields": ["id", "name", "bom"],
  "offset": 200,
  "limit": 200
}
```

---

## 4. 📍 Data Path (JSON Path)

### What is Data Path?

Data Path คือ "path" ที่บอกระบบว่าข้อมูลอยู่ตำแหน่งไหนใน API response

### ตัวอย่าง Response Structures

#### Example 1: Nested in `data.items`
```json
{
  "status": "success",
  "data": {
    "items": [
      {"id": "RM001", "name": "Steel"},
      {"id": "RM002", "name": "Aluminum"}
    ],
    "totalCount": 2
  }
}
```
**Data Path:** `data.items`

---

#### Example 2: Direct array response
```json
[
  {"id": "RM001", "name": "Steel"},
  {"id": "RM002", "name": "Aluminum"}
]
```
**Data Path:** *(leave empty or `null`)*

---

#### Example 3: D365 Format
```json
{
  "parmInventTableRMInfoList": [
    {"ItemId": "RM001", "Product name": "Steel"},
    {"ItemId": "RM002", "Product name": "Aluminum"}
  ]
}
```
**Data Path:** `parmInventTableRMInfoList`

---

#### Example 4: Deep nesting
```json
{
  "response": {
    "body": {
      "results": {
        "materials": [
          {"id": "RM001"}
        ]
      }
    }
  }
}
```
**Data Path:** `response.body.results.materials`

---

## 5. 🎯 Complete Configuration Examples

### Example 1: D365 Raw Materials (Simple GET)

```json
{
  "apiType": "RAW_MATERIALS",
  "name": "D365 Raw Materials API",
  "url": "https://d365.company.com/api/materials",
  "httpMethod": "GET",
  "authType": "bearer",
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "dataPath": "parmInventTableRMInfoList",
  "supportsPagination": false,
  "isActive": true
}
```

---

### Example 2: Large Dataset with Pagination

```json
{
  "apiType": "CUSTOMERS",
  "name": "Customer Master Data",
  "url": "https://erp.company.com/api/customers",
  "httpMethod": "GET",
  "authType": "api-key",
  "authToken": "ak_live_123456789",
  "supportsPagination": true,
  "paginationType": "offset",
  "pageSize": 500,
  "offsetParam": "skip",
  "pageSizeParam": "take",
  "dataPath": "data.customers",
  "maxRecords": 50000,
  "isActive": true
}
```

**Note:** `maxRecords: 50000` จะหยุดที่ 50,000 records แม้ว่า API จะมีข้อมูลมากกว่า

---

### Example 3: POST with Pagination

```json
{
  "apiType": "FINISHED_GOODS",
  "name": "Product Catalog Query",
  "url": "https://api.company.com/products/search",
  "httpMethod": "POST",
  "requestBody": "{\"category\": \"finished_goods\", \"includeInactive\": false}",
  "authType": "basic",
  "authUsername": "api_user",
  "authPassword": "secure_password",
  "supportsPagination": true,
  "paginationType": "page",
  "pageSize": 100,
  "pageNumberParam": "pageNum",
  "pageSizeParam": "perPage",
  "dataPath": "products",
  "totalCountPath": "pagination.total",
  "isActive": true
}
```

---

### Example 4: Cursor-based (AWS/GraphQL style)

```json
{
  "apiType": "EMPLOYEES",
  "name": "HR System Employees",
  "url": "https://hr-api.company.com/graphql",
  "httpMethod": "POST",
  "requestBody": "{\"query\": \"query { employees { id name email } }\"}",
  "authType": "bearer",
  "authToken": "token_here",
  "supportsPagination": true,
  "paginationType": "cursor",
  "pageSize": 50,
  "cursorParam": "after",
  "pageSizeParam": "first",
  "dataPath": "data.employees.nodes",
  "nextCursorPath": "data.employees.pageInfo.endCursor",
  "isActive": true
}
```

---

## 6. ⚠️ Important Notes

### Performance Considerations

1. **Page Size**:
   - ใหญ่เกินไป (>1000) อาจทำให้ timeout
   - เล็กเกินไป (<50) จะช้าเพราะต้อง request หลายรอบ
   - **แนะนำ: 100-500 records ต่อหน้า**

2. **Max Records**:
   - ใช้ `maxRecords` เพื่อจำกัดจำนวน records
   - ป้องกันการใช้ memory มากเกินไป
   - **แนะนำ: ไม่เกิน 100,000 records ต่อครั้ง**

3. **Safety Limit**:
   - ระบบมี safety limit ที่ 10,000 pages
   - ถ้า page size = 100, max = 1,000,000 records
   - ถ้าต้องการมากกว่านี้ให้เพิ่ม page size

### Error Handling

ระบบจะหยุดการ import ถ้า:
- API return error
- Invalid JSON response
- Data path ไม่ถูกต้อง
- Timeout (ตั้งค่าได้ที่ axios config)

### Testing Tips

1. **ทดสอบ API ก่อน**:
   ```bash
   curl -X POST https://api.example.com/materials \
     -H "Authorization: Bearer token" \
     -H "Content-Type: application/json" \
     -d '{"filter": {"active": true}}'
   ```

2. **ใช้ Postman/Insomnia** สร้าง request และ copy config

3. **เริ่มจาก Simple Config**:
   - เริ่มด้วย GET ไม่ต้อง pagination
   - ถ้าทำงาน เพิ่ม POST body
   - สุดท้ายค่อยเพิ่ม pagination

4. **ตั้ง maxRecords ต่ำๆ ขณะทดสอบ**:
   - ใช้ `maxRecords: 10` เพื่อทดสอบ
   - เมื่อแน่ใจแล้วค่อยเพิ่มเป็นจำนวนจริง

---

## 7. 🔧 UI Configuration

### ตั้งค่าผ่าน API Settings UI

1. ไปที่ **Master Data → 🔌 API Settings**
2. เลือก API Type (เช่น RAW_MATERIALS)
3. กรอกข้อมูล:
   - **Basic Settings**: URL, Auth Type, Token
   - **HTTP Method**: GET หรือ POST
   - **Request Body**: (ถ้าเป็น POST)
   - **Pagination**: เปิด/ปิด และตั้งค่าแบบที่ใช้
   - **Data Path**: ระบุตำแหน่งข้อมูลใน response

4. กด **Test Connection** เพื่อทดสอบ (optional)
5. กด **Save**

### ตั้งค่าผ่าน API (Advanced)

```bash
curl -X PUT http://localhost:3001/api/api-settings/RAW_MATERIALS \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/materials",
    "httpMethod": "POST",
    "requestBody": "{\"filter\": {\"active\": true}}",
    "supportsPagination": true,
    "paginationType": "offset",
    "pageSize": 100,
    "offsetParam": "offset",
    "pageSizeParam": "limit",
    "dataPath": "data.items",
    "authType": "bearer",
    "authToken": "your-token"
  }'
```

---

## 8. 📝 Changelog

### v2.0 - POST Body & Pagination Support
- เพิ่มรองรับ POST requests with body
- เพิ่มรองรับ 3 ประเภท pagination: offset, page, cursor
- เพิ่ม Data Path สำหรับ nested responses
- เพิ่ม maxRecords สำหรับจำกัดข้อมูล
- Safety limit: 10,000 pages

---

## Need Help?

1. ดู API documentation ของ vendor
2. ทดสอบด้วย Postman/curl ก่อน
3. เริ่มจาก simple config แล้วค่อยเพิ่ม features
4. ดู logs ใน backend console เพื่อ debug

Happy importing! 🚀
