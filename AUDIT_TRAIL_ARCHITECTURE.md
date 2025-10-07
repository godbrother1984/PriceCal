# Audit Trail & Master Data Versioning Architecture

**Version**: 6.0
**Last Updated**: 1 ตุลาคม 2568
**Status**: Phase 1-5 Completed, Phase 6-10 Pending

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Entity Inheritance Hierarchy](#entity-inheritance-hierarchy)
4. [Implementation Status](#implementation-status)
5. [User Tracking Implementation](#user-tracking-implementation)
6. [Approval Workflow](#approval-workflow)
7. [History Tracking](#history-tracking)
8. [API Guidelines](#api-guidelines)
9. [UI Components](#ui-components)
10. [Migration Guide](#migration-guide)

---

## Overview

ระบบ Audit Trail และ Versioning ถูกออกแบบเพื่อ:
- ✅ **Complete Audit Trail** - รู้ว่าใครทำอะไรเมื่อไหร่
- ✅ **Version Control** - ย้อนกลับดูค่าเก่าได้ทุกเวลา
- ✅ **Reproducible Calculations** - คำนวณราคาซ้ำได้เหมือนเดิม
- ✅ **Approval Workflow** - ควบคุมการเปลี่ยนแปลงข้อมูลสำคัญ
- ✅ **Compliance** - ตรวจสอบย้อนหลังได้ตาม regulations

---

## Database Schema

### Base Entity Classes

```typescript
// server/src/entities/base.entity.ts

// 1. BaseEntity - Audit trail พื้นฐาน
export abstract class BaseEntity {
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string; // User ID

  @Column({ nullable: true })
  updatedBy: string; // User ID
}

// 2. VersionedEntity - Master Data พร้อม version control
export abstract class VersionedEntity extends BaseEntity {
  @Column({ default: 1 })
  version: number;

  @Column({ default: 'DRAFT' }) // DRAFT, PENDING_APPROVAL, APPROVED, ARCHIVED
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'datetime', nullable: true })
  effectiveTo: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  changeReason: string;
}

// 3. ExternalDataEntity - ข้อมูลจาก External API
export abstract class ExternalDataEntity extends BaseEntity {
  @Column({ nullable: true })
  externalId: string;

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt: Date;

  @Column({ nullable: true })
  source: string; // 'D365_API', 'LME_API', etc.

  @Column({ default: true })
  isActive: boolean;
}
```

---

## Entity Inheritance Hierarchy

### 📦 External Data Entities (ไม่ต้อง Version)

ข้อมูลจาก D365 หรือ External System - Single Source of Truth อยู่ที่ระบบภายนอก

| Entity | Extends | Purpose |
|--------|---------|---------|
| `Customer` | `ExternalDataEntity` | ข้อมูลลูกค้าจาก D365 |
| `Product` | `ExternalDataEntity` | สินค้าสำเร็จรูปจาก D365 |
| `RawMaterial` | `ExternalDataEntity` | วัตถุดิบจาก D365 |
| `BOM` | `ExternalDataEntity` | Bill of Materials จาก D365 |

**Audit Fields:**
- `createdAt`, `updatedAt` - เวลาที่ sync/update
- `createdBy`, `updatedBy` - User ที่ trigger import
- `lastSyncAt` - Sync timestamp
- `source` - Source system name
- `externalId` - ID จากระบบภายนอก

---

### 💰 Pricing Master Data (ต้อง Version + Approval)

ข้อมูลที่ใช้คำนวณราคา - ต้องมี version control และ approval workflow

| Entity | Extends | Purpose | Version Required |
|--------|---------|---------|------------------|
| `StandardPrice` | `VersionedEntity` | ราคามาตรฐานวัตถุดิบ | ✅ Yes |
| `ExchangeRate` | `VersionedEntity` | อัตราแลกเปลี่ยน | ✅ Yes |
| `LmePrice` | `VersionedEntity` | ราคาโลหะ LME | ✅ Yes |
| `FabCost` | `VersionedEntity` | ค่า Fabrication | ✅ Yes |
| `SellingFactor` | `VersionedEntity` | ตัวคูณการขาย | ✅ Yes |

**Audit + Version Fields:**
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy` (จาก BaseEntity)
- `version` - Version number
- `status` - DRAFT, PENDING_APPROVAL, APPROVED, ARCHIVED
- `approvedBy`, `approvedAt` - Approval info
- `effectiveFrom`, `effectiveTo` - Effective date range
- `changeReason` - เหตุผลการเปลี่ยนแปลง

---

### ⚙️ Configuration Entities (Audit Only)

| Entity | Extends | Purpose |
|--------|---------|---------|
| `CustomerGroup` | `BaseEntity` | กลุ่มลูกค้า |
| `SystemConfig` | N/A | การตั้งค่าระบบ |
| `User` | N/A | ผู้ใช้งาน |

---

### 📊 PriceRequest - Enhanced with Snapshot

```typescript
@Entity('price_requests')
export class PriceRequest {
  // ... existing fields ...

  // Audit Trail
  @Column({ nullable: true })
  createdBy: string; // ✅ มีอยู่แล้ว

  @Column({ nullable: true })
  updatedBy: string; // ✅ เพิ่มใหม่

  @Column({ nullable: true })
  approvedBy: string; // ✅ เพิ่มใหม่

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date; // ✅ เพิ่มใหม่

  // Calculation Snapshot
  @Column({ type: 'datetime', nullable: true })
  calculatedAt: Date; // ✅ เพิ่มใหม่ - เวลาที่คำนวณ

  @Column({ type: 'simple-json', nullable: true })
  masterDataVersions: { // ✅ เพิ่มใหม่ - เก็บ version ที่ใช้
    standardPriceVersion?: number;
    exchangeRateVersion?: number;
    lmePriceVersion?: number;
    fabCostVersion?: number;
    sellingFactorVersion?: number;
  };

  @Column({ type: 'text', nullable: true })
  calculationSnapshot: string; // ✅ เพิ่มใหม่ - JSON snapshot ค่าที่ใช้คำนวณ
}
```

---

## History Tracking

### History Entities

เก็บประวัติทุกครั้งที่มีการเปลี่ยนแปลง Master Data:

```typescript
// StandardPriceHistory
@Entity('standard_price_history')
export class StandardPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  standardPriceId: string; // Reference to original

  @Column()
  version: number;

  // Business data snapshot
  @Column()
  rawMaterialId: string;

  @Column('decimal', { precision: 10, scale: 4 })
  price: number;

  @Column()
  currency: string;

  // Audit data
  @Column()
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column()
  changedBy: string; // User who made this change

  @CreateDateColumn()
  changedAt: Date; // When history was created

  @Column({ type: 'text', nullable: true })
  changeReason: string;

  @Column()
  action: string; // CREATE, UPDATE, APPROVE, ARCHIVE
}
```

**มี History entities สำหรับ:**
- ✅ `StandardPriceHistory`
- ✅ `ExchangeRateHistory`
- ✅ `LmePriceHistory`

**TODO:** ต้องสร้างเพิ่มสำหรับ FabCost และ SellingFactor

---

## Approval Workflow

### MasterDataApproval Entity

```typescript
@Entity('master_data_approvals')
export class MasterDataApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: MasterDataType; // STANDARD_PRICE, EXCHANGE_RATE, etc.

  @Column()
  entityId: string; // ID ของ Master Data

  @Column()
  version: number; // Version ที่ขออนุมัติ

  @Column({ type: 'text' })
  changes: string; // JSON ของการเปลี่ยนแปลง

  @Column({ type: 'text', nullable: true })
  requestReason: string;

  @Column()
  requestedBy: string;

  @CreateDateColumn()
  requestedAt: Date;

  @Column({ default: 'PENDING' })
  status: ApprovalStatus; // PENDING, APPROVED, REJECTED

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewComments: string;

  @Column({ type: 'text', nullable: true })
  beforeSnapshot: string; // JSON

  @Column({ type: 'text', nullable: true })
  afterSnapshot: string; // JSON

  @Column({ default: false })
  isAutoApproved: boolean;

  @Column({ nullable: true })
  priority: string; // LOW, MEDIUM, HIGH, URGENT
}
```

### Approval Workflow Process

```
1. User แก้ไข Master Data → Status = DRAFT, version++
2. User ส่งขออนุมัติ → สร้าง MasterDataApproval record
3. Approver review → APPROVED / REJECTED
4. ถ้า APPROVED:
   - อัปเดต Master Data: status = APPROVED, approvedBy, approvedAt
   - บันทึก History record
   - ถ้ามี effectiveFrom/To ให้เช็คและ activate ตาม schedule
```

---

## User Tracking Implementation

### 1. CurrentUser Decorator

```typescript
// server/src/common/decorators/current-user.decorator.ts

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    // From JWT token
    if (request.user && request.user.sub) {
      return request.user.sub;
    }

    // Fallback: custom header (development)
    if (request.headers['x-user-id']) {
      return request.headers['x-user-id'];
    }

    // Default
    return 'system';
  },
);
```

### 2. Controller Pattern

```typescript
@Controller('api/data')
export class DataController {
  @Post('customer-groups')
  addCustomerGroup(
    @CurrentUser() userId: string,
    @Body() groupDto: any
  ) {
    return this.dataService.addCustomerGroup(groupDto, userId);
  }

  @Put('customer-groups/:id')
  updateCustomerGroup(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() groupDto: any
  ) {
    return this.dataService.updateCustomerGroup(id, groupDto, userId);
  }
}
```

### 3. Service Pattern

```typescript
@Injectable()
export class DataService {
  async addCustomerGroup(groupDto: any, userId?: string) {
    const group = this.customerGroupRepository.create({
      ...groupDto,
      createdBy: userId || 'system',
      updatedBy: userId || 'system',
    });

    return this.customerGroupRepository.save(group);
  }

  async updateCustomerGroup(id: string, groupDto: any, userId?: string) {
    const group = await this.customerGroupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Customer group ${id} not found`);
    }

    Object.assign(group, groupDto);
    group.updatedBy = userId || 'system';

    return this.customerGroupRepository.save(group);
  }
}
```

---

## API Guidelines

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-User-ID: <user_id>  // Optional fallback for development
```

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "...",
    "version": 2,
    "status": "APPROVED",
    "createdBy": "user-123",
    "createdAt": "2025-10-01T10:00:00Z",
    "updatedBy": "user-456",
    "updatedAt": "2025-10-01T14:00:00Z",
    "approvedBy": "user-789",
    "approvedAt": "2025-10-01T15:00:00Z"
  },
  "message": "Success"
}
```

---

## UI Components

### Master Data Viewer Enhancement

```tsx
// Display audit info
<div className="audit-info">
  <div>Version: {data.version}</div>
  <div>Status: <StatusBadge status={data.status} /></div>
  <div>Created by: {data.createdBy} at {formatDate(data.createdAt)}</div>
  <div>Updated by: {data.updatedBy} at {formatDate(data.updatedAt)}</div>
  {data.approvedBy && (
    <div>Approved by: {data.approvedBy} at {formatDate(data.approvedAt)}</div>
  )}
</div>
```

### Status Badge Component

```tsx
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
};
```

### History Viewer Component

```tsx
const HistoryViewer: React.FC<{ entityType: string; entityId: string }> = ({ entityType, entityId }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory(entityType, entityId);
  }, [entityType, entityId]);

  return (
    <div className="history-viewer">
      <h3>Change History</h3>
      <Timeline>
        {history.map(record => (
          <TimelineItem key={record.id}>
            <div>Version {record.version}</div>
            <div>{record.action} by {record.changedBy}</div>
            <div>{formatDate(record.changedAt)}</div>
            <div>{record.changeReason}</div>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  );
};
```

---

## Implementation Status

### ✅ Phase 1-5: Completed

- [x] Base Entity classes created
- [x] 10+ entities updated with inheritance
- [x] History entities created (3)
- [x] MasterDataApproval entity created
- [x] PriceRequest enhanced with snapshot
- [x] CurrentUser decorator created
- [x] Server running without errors

### 🚧 Phase 6-10: Pending

#### Phase 6: Services (User Tracking)
- [ ] Update DataController - add `@CurrentUser()` to all POST/PUT endpoints
- [ ] Update DataService - add `userId` parameter to all add/update methods
- [ ] Update ImportService - track user who triggered import
- [ ] Update PricingService - save `calculatedAt` and `masterDataVersions`

#### Phase 7: Approval Workflow
- [ ] Create ApprovalService
  - [ ] `requestApproval(entityType, entityId, userId, reason)`
  - [ ] `approve(approvalId, reviewerId, comments)`
  - [ ] `reject(approvalId, reviewerId, comments)`
  - [ ] `getPendingApprovals()`
- [ ] Create ApprovalController
- [ ] Create Approval UI components
  - [ ] Pending Approvals list
  - [ ] Approval detail modal
  - [ ] Approve/Reject buttons

#### Phase 8-9: UI Enhancement
- [ ] Update Master Data Viewer
  - [ ] Show version column
  - [ ] Show status badge
  - [ ] Show audit info (created/updated by, dates)
  - [ ] Add version filter
  - [ ] Add status filter
- [ ] Create History Viewer
  - [ ] Timeline view
  - [ ] Show all changes
  - [ ] Compare versions (diff view)

#### Phase 10: Documentation
- [ ] Update API documentation
- [ ] Create migration guide
- [ ] Update CHANGELOG

---

## Migration Guide

### Database Migration

TypeORM จะ sync schema อัตโนมัติ (synchronize: true ใน development)

สำหรับ production ควรใช้ migration:

```bash
npm run typeorm migration:generate -- -n AddAuditTrailFields
npm run typeorm migration:run
```

### Existing Data Migration

```sql
-- Set default values for new audit fields
UPDATE customers SET createdBy = 'system', updatedBy = 'system' WHERE createdBy IS NULL;
UPDATE products SET createdBy = 'system', updatedBy = 'system' WHERE createdBy IS NULL;

-- Set default version for pricing master data
UPDATE standard_prices SET version = 1, status = 'APPROVED' WHERE version IS NULL;
UPDATE exchange_rates SET version = 1, status = 'APPROVED' WHERE version IS NULL;
UPDATE lme_prices SET version = 1, status = 'APPROVED' WHERE version IS NULL;
```

---

## Best Practices

### 1. Always Track User

```typescript
// ❌ Bad
await dataService.updateCustomerGroup(id, dto);

// ✅ Good
await dataService.updateCustomerGroup(id, dto, userId);
```

### 2. Version Bump Strategy

```typescript
// เมื่อแก้ไข Master Data:
if (isSignificantChange(oldData, newData)) {
  data.version++;
  data.status = 'DRAFT';
  data.changeReason = reason;
}
```

### 3. History Recording

```typescript
// บันทึก history ทุกครั้งที่ approve
async approveStandardPrice(id: string, approverId: string) {
  const price = await this.standardPriceRepository.findOne({ where: { id } });

  // Create history record
  await this.standardPriceHistoryRepository.save({
    standardPriceId: id,
    version: price.version,
    ...price,
    changedBy: approverId,
    action: 'APPROVE',
  });

  // Update original
  price.status = 'APPROVED';
  price.approvedBy = approverId;
  price.approvedAt = new Date();
  await this.standardPriceRepository.save(price);
}
```

### 4. Snapshot for Calculation

```typescript
async calculatePrice(requestId: string) {
  const standardPrices = await this.getActiveStandardPrices();
  const exchangeRates = await this.getActiveExchangeRates();

  // Calculate...
  const result = performCalculation(data, standardPrices, exchangeRates);

  // Save snapshot
  await this.priceRequestRepository.update(requestId, {
    calculatedAt: new Date(),
    masterDataVersions: {
      standardPriceVersion: standardPrices[0].version,
      exchangeRateVersion: exchangeRates[0].version,
    },
    calculationSnapshot: JSON.stringify({
      standardPrices,
      exchangeRates,
      // ... other data used
    }),
  });
}
```

---

## Support

สำหรับคำถามหรือปัญหา:
1. ดูเอกสารนี้ก่อน
2. ตรวจสอบ CHANGELOG.md
3. ดู implementation ใน base.entity.ts

---

**End of Document**
