# PriceCal Implementation Plan
# แผนการพัฒนาระบบ PriceCal - รวม v7.0 + Phase 1-5

**Created**: 29 ตุลาคม 2568
**Last Updated**: 31 ตุลาคม 2568
**Current Version**: v8.0
**Status**: Phase 0, 1, 2 COMPLETE ✅ | Phase 3-6 Planning

---

## 📊 ภาพรวมสถานะปัจจุบัน (v8.0)

### ✅ ระบบที่พร้อมใช้งานแล้ว:
- ✅ Backend: NestJS + TypeORM + SQLite
- ✅ Frontend: React + TypeScript + Tailwind CSS
- ✅ Authentication: JWT + bcrypt
- ✅ Master Data Management: CRUD operations + Version Control
- ✅ Price Calculation Engine: ทำงานได้ครบพร้อม Customer Group Override
- ✅ MongoDB Integration: Sync ข้อมูลจาก D365
- ✅ Dummy Item System: Auto-generate + Manual Mapping API
- ✅ Activity Logs: บันทึกการเปลี่ยนแปลง
- ✅ **Dashboard & Task Center**: Role-based dashboard + Quick approval
- ✅ **Master Data Version Control**: Archive Logic + Rollback + Version History UI
- ✅ **Customer Group Override System**: Backend APIs + Frontend UI (7 tabs) COMPLETE
- ✅ **Manual Mapping UI**: ItemMappingManager + Item Status Badges

### 🔄 ที่กำลังพัฒนา/วางแผน:
1. **D365 Auto-Creation**: Phase 4-6 (Mock API พร้อม, Real API integration ยังไม่เริ่ม)
2. **Employee Entity**: Phase 5 (ยังใช้ User entity สำหรับ audit trail)
3. **Production Deployment**: Phase 5 (PostgreSQL support, Docker, Migrations)

---

## 🎯 Phase 0: Dashboard & Task Center ✅ COMPLETE

**Timeline**: 1-2 สัปดาห์ (เสร็จแล้ว)
**Status**: ✅ **COMPLETE** (v7.x-v8.0)
**Priority**: HIGH
**Objective**: สร้างหน้า Dashboard และ Task Center เพื่อเพิ่มประสิทธิภาพการทำงานและ UX

### 0.1 ภาพรวมและเหตุผล

#### ทำไมต้องมี Dashboard + Task Center?

**ปัญหาปัจจุบัน:**
- หน้าแรกหลัง login = Price Request List (ไม่เหมาะสำหรับ Admin/Costing)
- ต้องเข้าหลายหน้าเพื่อดูงานที่รออนุมัติ
- ไม่เห็นภาพรวมประสิทธิภาพระบบ
- ไม่มี Personalized view ตาม Role

**ประโยชน์:**
- 🎯 **UX ดีขึ้น** - เห็นภาพรวมงานทันทีหลัง login
- ⚡ **ทำงานเร็วขึ้น** - One-click approval จาก Dashboard
- 📊 **Business Intelligence** - Track KPIs และประสิทธิภาพ
- 👥 **Role-based View** - แต่ละ Role เห็นงานที่เกี่ยวข้อง

### 0.2 Dashboard Design

#### Dashboard Layout (หน้าแรกหลัง Login)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 Dashboard - ภาพรวมระบบ                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 Statistics Cards (4-6 cards)                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │ 🔴 รออนุมัติ  │ │ 🟡 คำนวณ   │ │ 🟢 อนุมัติแล้ว│          │
│ │     5       │ │     3      │ │     12      │           │
│ │   รายการ    │ │   รายการ    │ │   รายการ     │          │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│ 📋 My Tasks - งานของฉัน (Top 5)                            │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ✅ Standard Price - RM-AL-01 (v2) รออนุมัติ           │   │
│ │    เปลี่ยนราคา 79,200 → 82,000 THB                   │   │
│ │    [Approve] [Reject] [View Details]                 │   │
│ └───────────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🟡 PR-2025-005 รอการคำนวณราคา                         │   │
│ │    [Calculate Price] [View BOQ]                      │   │
│ └───────────────────────────────────────────────────────┘   │
│ [ดูงานทั้งหมด →]                                            │
│                                                             │
│ 📈 Recent Activity (10 รายการล่าสุด)                       │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🟢 Admin approved PR-2025-003                         │   │
│ │    2 minutes ago                                      │   │
│ └───────────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🔵 Costing calculated price for PR-2025-004           │   │
│ │    15 minutes ago                                     │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ⚡ Quick Actions                                            │
│ [+ สร้าง Request] [📊 Master Data] [⚙️ Settings]          │
└─────────────────────────────────────────────────────────────┘
```

#### Statistics Cards (แสดงตาม Role)

**สำหรับ Admin:**
```typescript
{
  pendingApprovals: {
    count: 5,
    label: 'รอการอนุมัติ',
    icon: '🔴',
    breakdown: {
      masterData: 3,
      priceRequests: 2,
      overrides: 0
    }
  },
  calculatingRequests: {
    count: 3,
    label: 'กำลังคำนวณ',
    icon: '🟡'
  },
  approvedThisMonth: {
    count: 12,
    label: 'อนุมัติแล้ว (เดือนนี้)',
    icon: '🟢'
  },
  dummyItemsAvailable: {
    count: 18,
    label: 'Dummy Items พร้อมใช้',
    icon: '🎯'
  }
}
```

**สำหรับ Sales:**
```typescript
{
  myDraftRequests: {
    count: 1,
    label: 'Draft ของฉัน',
    icon: '📝'
  },
  myPendingRequests: {
    count: 3,
    label: 'รอผลการคำนวณ',
    icon: '⏳'
  },
  myApprovedRequests: {
    count: 5,
    label: 'อนุมัติแล้ว',
    icon: '✅'
  },
  myRejectedRequests: {
    count: 1,
    label: 'ถูกปฏิเสธ',
    icon: '❌'
  }
}
```

**สำหรับ Costing:**
```typescript
{
  pendingCalculations: {
    count: 3,
    label: 'รอการคำนวณ',
    icon: '🧮'
  },
  pendingMappings: {
    count: 2,
    label: 'รอ Mapping',
    icon: '🔗'
  },
  inProgressBOQs: {
    count: 4,
    label: 'BOQ กำลังทำ',
    icon: '📋'
  },
  completedThisWeek: {
    count: 8,
    label: 'เสร็จแล้ว (สัปดาห์นี้)',
    icon: '✅'
  }
}
```

### 0.3 Task Center Design

#### Task Center (หน้าแยกหรือ Widget ใน Dashboard)

**สำหรับ Admin:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Task Center - งานที่รอดำเนินการ                          │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [Master Data] [Price Requests] [Overrides] [All]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Master Data Pending Approval (3)                           │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📊 Standard Price - RM-AL-01                          │   │
│ │ Version: v2                                           │   │
│ │ Change: 79,200 → 82,000 THB                          │   │
│ │ Reason: ราคาตลาดเพิ่มขึ้น 3.5%                        │   │
│ │ Requested by: Costing Team (John)                    │   │
│ │ Date: 2025-10-29 14:30                               │   │
│ │                                                       │   │
│ │ [✅ Approve] [❌ Reject] [📜 View History]            │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📊 LME Price - Aluminum                               │   │
│ │ Version: v3                                           │   │
│ │ Change: 79,200 → 81,500 THB/kg                       │   │
│ │ [✅ Approve] [❌ Reject] [📜 View History]            │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Price Requests Pending Approval (2)                        │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄 PR-2025-001 - Product ABC                          │   │
│ │ Customer: CUST-001 (Toyota Thailand)                  │   │
│ │ Total Price: 125,000 THB                              │   │
│ │ Margin: 15.5%                                         │   │
│ │ Calculated by: Costing Team (Jane)                   │   │
│ │                                                       │   │
│ │ [✅ Approve] [❌ Reject] [👁️ View Details]            │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**สำหรับ Costing:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 My Tasks - งานของฉัน                                     │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [รอคำนวณ] [รอ Mapping] [BOQ ที่กำลังทำ] [All]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Pending Calculations (3)                                   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🟡 PR-2025-005 - New Product XYZ                      │   │
│ │ Customer: CUST-010 (Honda)                            │   │
│ │ Created: 2 hours ago by Sales (Mike)                 │   │
│ │ Priority: High                                        │   │
│ │                                                       │   │
│ │ [🧮 Calculate Price] [📋 View BOQ] [📝 Edit BOQ]      │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Dummy Items Pending Mapping (2)                            │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🔴 FG-DUMMY-012 - รอ Map to D365                      │   │
│ │ Used in: PR-2025-003                                  │   │
│ │ Customer PO: PO-2025-001 (Toyota)                     │   │
│ │ Approved: 3 days ago                                  │   │
│ │                                                       │   │
│ │ [🔗 Map to D365] [👁️ View Details]                    │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 0.4 Backend Implementation

#### A. Dashboard Module

**สิ่งที่ต้องทำ:**

```typescript
// server/src/dashboard/dashboard.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceRequest,
      StandardPrice,
      FabCost,
      SellingFactor,
      LmeMasterData,
      ExchangeRateMasterData,
      CustomerGroupStandardPriceOverride,
      CustomerGroupLmePriceOverride,
      CustomerGroupFabCostOverride,
      CustomerGroupSellingFactorOverride,
      CustomerGroupExchangeRateOverride,
      Product,
      ActivityLog,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
```

```typescript
// server/src/dashboard/dashboard.service.ts
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PriceRequest)
    private priceRequestRepo: Repository<PriceRequest>,
    @InjectRepository(StandardPrice)
    private standardPriceRepo: Repository<StandardPrice>,
    @InjectRepository(ActivityLog)
    private activityLogRepo: Repository<ActivityLog>,
    // ... other repositories
  ) {}

  // Get dashboard statistics (role-based)
  async getDashboardStats(userId: string, role: string) {
    if (role === 'Admin') {
      return this.getAdminStats();
    } else if (role === 'Sales') {
      return this.getSalesStats(userId);
    } else if (role === 'Costing') {
      return this.getCostingStats(userId);
    }

    return this.getDefaultStats();
  }

  private async getAdminStats() {
    const [
      pendingMasterData,
      pendingPriceRequests,
      pendingOverrides,
      calculatingRequests,
      approvedThisMonth,
      dummyItemsAvailable,
    ] = await Promise.all([
      this.countPendingMasterDataApprovals(),
      this.countPendingPriceRequestApprovals(),
      this.countPendingOverrideApprovals(),
      this.countCalculatingRequests(),
      this.countApprovedThisMonth(),
      this.countDummyItemsAvailable(),
    ]);

    return {
      pendingApprovals: {
        count: pendingMasterData + pendingPriceRequests + pendingOverrides,
        label: 'รอการอนุมัติ',
        icon: '🔴',
        breakdown: {
          masterData: pendingMasterData,
          priceRequests: pendingPriceRequests,
          overrides: pendingOverrides,
        },
      },
      calculatingRequests: {
        count: calculatingRequests,
        label: 'กำลังคำนวณ',
        icon: '🟡',
      },
      approvedThisMonth: {
        count: approvedThisMonth,
        label: 'อนุมัติแล้ว (เดือนนี้)',
        icon: '🟢',
      },
      dummyItemsAvailable: {
        count: dummyItemsAvailable,
        label: 'Dummy Items พร้อมใช้',
        icon: '🎯',
      },
    };
  }

  private async getSalesStats(userId: string) {
    // Count requests created by this user
    const [myDrafts, myPending, myApproved, myRejected] = await Promise.all([
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: 'Draft' },
      }),
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: In(['Calculating', 'Pending Approval']) },
      }),
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: 'Approved', createdAt: MoreThan(this.getStartOfMonth()) },
      }),
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: 'Rejected' },
      }),
    ]);

    return {
      myDraftRequests: {
        count: myDrafts,
        label: 'Draft ของฉัน',
        icon: '📝',
      },
      myPendingRequests: {
        count: myPending,
        label: 'รอผลการคำนวณ',
        icon: '⏳',
      },
      myApprovedRequests: {
        count: myApproved,
        label: 'อนุมัติแล้ว (เดือนนี้)',
        icon: '✅',
      },
      myRejectedRequests: {
        count: myRejected,
        label: 'ถูกปฏิเสธ',
        icon: '❌',
      },
    };
  }

  private async getCostingStats(userId: string) {
    // Stats for Costing team
    const [pendingCalc, pendingMapping, inProgressBOQs, completedThisWeek] = await Promise.all([
      this.priceRequestRepo.count({
        where: { status: In(['Pending', 'Calculating']), isActive: true },
      }),
      this.productRepo.count({
        where: { itemStatus: 'IN_USE', awaitingD365Creation: true },
      }),
      this.productRepo.count({
        where: { itemStatus: 'IN_USE' },
      }),
      this.priceRequestRepo.count({
        where: {
          status: 'Approved',
          updatedAt: MoreThan(this.getStartOfWeek())
        },
      }),
    ]);

    return {
      pendingCalculations: {
        count: pendingCalc,
        label: 'รอการคำนวณ',
        icon: '🧮',
      },
      pendingMappings: {
        count: pendingMapping,
        label: 'รอ Mapping',
        icon: '🔗',
      },
      inProgressBOQs: {
        count: inProgressBOQs,
        label: 'BOQ กำลังทำ',
        icon: '📋',
      },
      completedThisWeek: {
        count: completedThisWeek,
        label: 'เสร็จแล้ว (สัปดาห์นี้)',
        icon: '✅',
      },
    };
  }

  // Get my tasks (role-based)
  async getMyTasks(userId: string, role: string, limit: number = 5) {
    if (role === 'Admin') {
      return this.getAdminTasks(limit);
    } else if (role === 'Costing') {
      return this.getCostingTasks(limit);
    } else if (role === 'Sales') {
      return this.getSalesTasks(userId, limit);
    }

    return [];
  }

  private async getAdminTasks(limit: number) {
    // Get pending approvals for Master Data and Price Requests
    const [masterDataTasks, priceRequestTasks] = await Promise.all([
      this.getPendingMasterDataApprovals(limit),
      this.getPendingPriceRequestApprovals(limit),
    ]);

    return [
      ...masterDataTasks.map(task => ({
        ...task,
        type: 'master-data-approval',
      })),
      ...priceRequestTasks.map(task => ({
        ...task,
        type: 'price-request-approval',
      })),
    ].slice(0, limit);
  }

  private async getCostingTasks(limit: number) {
    // Get pending calculations and mappings
    const [calcTasks, mappingTasks] = await Promise.all([
      this.getPendingCalculations(limit),
      this.getPendingMappings(limit),
    ]);

    return [
      ...calcTasks.map(task => ({
        ...task,
        type: 'price-calculation',
      })),
      ...mappingTasks.map(task => ({
        ...task,
        type: 'dummy-mapping',
      })),
    ].slice(0, limit);
  }

  // Get recent activity (last N activities)
  async getRecentActivity(limit: number = 10) {
    return this.activityLogRepo.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  // Helper methods
  private async countPendingMasterDataApprovals(): Promise<number> {
    const [stdPrice, fabCost, factor, lme, exRate] = await Promise.all([
      this.standardPriceRepo.count({ where: { status: 'Draft', isActive: true } }),
      this.fabCostRepo.count({ where: { status: 'Draft', isActive: true } }),
      this.sellingFactorRepo.count({ where: { status: 'Draft', isActive: true } }),
      this.lmeRepo.count({ where: { status: 'Draft', isActive: true } }),
      this.exRateRepo.count({ where: { status: 'Draft', isActive: true } }),
    ]);

    return stdPrice + fabCost + factor + lme + exRate;
  }

  private async countPendingPriceRequestApprovals(): Promise<number> {
    return this.priceRequestRepo.count({
      where: { status: 'Pending Approval', isActive: true },
    });
  }

  private async countCalculatingRequests(): Promise<number> {
    return this.priceRequestRepo.count({
      where: { status: 'Calculating', isActive: true },
    });
  }

  private async countApprovedThisMonth(): Promise<number> {
    const startOfMonth = this.getStartOfMonth();
    return this.priceRequestRepo.count({
      where: {
        status: 'Approved',
        approvedAt: MoreThan(startOfMonth),
      },
    });
  }

  private async countDummyItemsAvailable(): Promise<number> {
    return this.productRepo.count({
      where: { itemStatus: 'AVAILABLE' },
    });
  }

  private getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(now.setDate(diff));
  }

  private async getPendingMasterDataApprovals(limit: number) {
    // Aggregate pending approvals from all Master Data types
    const [stdPrices, fabCosts, factors, lmes, exRates] = await Promise.all([
      this.standardPriceRepo.find({
        where: { status: 'Draft', isActive: true },
        relations: ['rawMaterial'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.fabCostRepo.find({
        where: { status: 'Draft', isActive: true },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.sellingFactorRepo.find({
        where: { status: 'Draft', isActive: true },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.lmeRepo.find({
        where: { status: 'Draft', isActive: true },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.exRateRepo.find({
        where: { status: 'Draft', isActive: true },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);

    return [
      ...stdPrices.map(item => ({
        id: item.id,
        entityType: 'standard-price',
        title: `Standard Price - ${item.rawMaterial?.name || item.rawMaterialId}`,
        version: item.version,
        changeReason: item.changeReason,
        createdAt: item.createdAt,
      })),
      ...fabCosts.map(item => ({
        id: item.id,
        entityType: 'fab-cost',
        title: `FAB Cost - ${item.name}`,
        version: item.version,
        changeReason: item.changeReason,
        createdAt: item.createdAt,
      })),
      ...factors.map(item => ({
        id: item.id,
        entityType: 'selling-factor',
        title: `Selling Factor - ${item.patternName}`,
        version: item.version,
        changeReason: item.changeReason,
        createdAt: item.createdAt,
      })),
      ...lmes.map(item => ({
        id: item.id,
        entityType: 'lme-price',
        title: `LME Price - ${item.itemGroupName}`,
        version: item.version,
        changeReason: item.changeReason,
        createdAt: item.createdAt,
      })),
      ...exRates.map(item => ({
        id: item.id,
        entityType: 'exchange-rate',
        title: `Exchange Rate - ${item.sourceCurrencyCode}/${item.destinationCurrencyCode}`,
        version: item.version,
        changeReason: item.changeReason,
        createdAt: item.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private async getPendingPriceRequestApprovals(limit: number) {
    return this.priceRequestRepo.find({
      where: { status: 'Pending Approval', isActive: true },
      relations: ['customer', 'product'],
      order: { updatedAt: 'DESC' },
      take: limit,
    }).then(requests => requests.map(req => ({
      id: req.id,
      requestNumber: req.requestNumber,
      customerName: req.customer?.name,
      productName: req.product?.name,
      totalPrice: req.totalPrice,
      updatedAt: req.updatedAt,
    })));
  }

  private async getPendingCalculations(limit: number) {
    return this.priceRequestRepo.find({
      where: { status: In(['Pending', 'Calculating']), isActive: true },
      relations: ['customer', 'product'],
      order: { createdAt: 'DESC' },
      take: limit,
    }).then(requests => requests.map(req => ({
      id: req.id,
      requestNumber: req.requestNumber,
      customerName: req.customer?.name,
      productName: req.product?.name,
      createdAt: req.createdAt,
    })));
  }

  private async getPendingMappings(limit: number) {
    return this.productRepo.find({
      where: {
        itemStatus: 'IN_USE',
        awaitingD365Creation: true
      },
      order: { mappedDate: 'DESC' },
      take: limit,
    }).then(items => items.map(item => ({
      id: item.id,
      dummyId: item.id,
      name: item.name,
      customerPO: item.customerPO,
      mappedDate: item.mappedDate,
    })));
  }
}
```

```typescript
// server/src/dashboard/dashboard.controller.ts
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Request() req) {
    const { userId, role } = req.user;
    return this.dashboardService.getDashboardStats(userId, role);
  }

  @Get('my-tasks')
  async getMyTasks(@Request() req, @Query('limit') limit?: string) {
    const { userId, role } = req.user;
    const taskLimit = limit ? parseInt(limit) : 5;
    return this.dashboardService.getMyTasks(userId, role, taskLimit);
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    const activityLimit = limit ? parseInt(limit) : 10;
    return this.dashboardService.getRecentActivity(activityLimit);
  }
}
```

**API Endpoints ใหม่:**
- `GET /api/dashboard/stats` - Dashboard statistics (role-based)
- `GET /api/dashboard/my-tasks?limit=5` - My tasks (role-based)
- `GET /api/dashboard/recent-activity?limit=10` - Recent activity log

**ไฟล์ใหม่:**
- `server/src/dashboard/dashboard.module.ts`
- `server/src/dashboard/dashboard.service.ts`
- `server/src/dashboard/dashboard.controller.ts`

**ไฟล์ที่ต้องแก้:**
- `server/src/app.module.ts` - import DashboardModule

#### B. Task Center APIs

**เพิ่ม Approval APIs:**

```typescript
// server/src/data/data.controller.ts - เพิ่ม bulk approval endpoints
@Post('master-data/approve-bulk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
async approveBulk(
  @Body() dto: { type: string; ids: string[] },
  @Request() req,
) {
  // Approve multiple items at once
  const results = [];
  for (const id of dto.ids) {
    try {
      let result;
      switch (dto.type) {
        case 'standard-price':
          result = await this.dataService.approveStandardPrice(id, req.user.username);
          break;
        case 'fab-cost':
          result = await this.dataService.approveFabCost(id, req.user.username);
          break;
        case 'selling-factor':
          result = await this.dataService.approveSellingFactor(id, req.user.username);
          break;
        // ... other types
      }
      results.push({ id, success: true, data: result });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  return { results };
}
```

**API Endpoints ใหม่:**
- `POST /api/data/master-data/approve-bulk` - Bulk approve Master Data
- `POST /api/data/price-requests/approve-bulk` - Bulk approve Price Requests

### 0.5 Frontend Implementation

#### A. Dashboard Page

**สิ่งที่ต้องทำ:**

```typescript
// client/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import TaskList from '../components/dashboard/TaskList';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';
import QuickActions from '../components/dashboard/QuickActions';

interface DashboardStats {
  [key: string]: {
    count: number;
    label: string;
    icon: string;
    breakdown?: any;
  };
}

interface Task {
  id: string;
  type: string;
  title: string;
  [key: string]: any;
}

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userName: string;
  timestamp: Date;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes, activitiesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/my-tasks?limit=5'),
        api.get('/dashboard/recent-activity?limit=10'),
      ]);

      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setActivities(activitiesRes.data);
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">ภาพรวมระบบและงานของคุณ</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, stat]) => (
          <StatCard key={key} {...stat} />
        ))}
      </div>

      {/* My Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            📋 My Tasks - งานของฉัน
          </h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm">
            ดูงานทั้งหมด →
          </button>
        </div>
        <TaskList tasks={tasks} onRefresh={loadDashboardData} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          📈 Recent Activity
        </h2>
        <RecentActivityFeed activities={activities} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default Dashboard;
```

```typescript
// client/src/components/dashboard/StatCard.tsx
import React from 'react';

interface StatCardProps {
  count: number;
  label: string;
  icon: string;
  breakdown?: {
    [key: string]: number;
  };
}

const StatCard: React.FC<StatCardProps> = ({ count, label, icon, breakdown }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-900">{count}</p>
          <p className="text-sm text-slate-600 mt-1">{label}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>

      {breakdown && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="space-y-1 text-xs text-slate-600">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
```

```typescript
// client/src/components/dashboard/TaskList.tsx
import React from 'react';
import api from '../../services/api';

interface Task {
  id: string;
  type: string;
  title: string;
  version?: number;
  changeReason?: string;
  entityType?: string;
  [key: string]: any;
}

interface TaskListProps {
  tasks: Task[];
  onRefresh: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onRefresh }) => {
  const handleApprove = async (task: Task) => {
    try {
      if (task.type === 'master-data-approval') {
        await api.put(`/data/${task.entityType}/${task.id}/approve`);
      } else if (task.type === 'price-request-approval') {
        await api.put(`/price-requests/${task.id}/approve`);
      }

      onRefresh();
    } catch (error) {
      console.error('[TaskList] Approve failed:', error);
      alert('Failed to approve');
    }
  };

  const handleReject = async (task: Task) => {
    const reason = prompt('เหตุผลในการปฏิเสธ:');
    if (!reason) return;

    try {
      if (task.type === 'master-data-approval') {
        await api.put(`/data/${task.entityType}/${task.id}/reject`, { reason });
      } else if (task.type === 'price-request-approval') {
        await api.put(`/price-requests/${task.id}/reject`, { reason });
      }

      onRefresh();
    } catch (error) {
      console.error('[TaskList] Reject failed:', error);
      alert('Failed to reject');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        ไม่มีงานที่ต้องทำในขณะนี้ 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{task.title}</h3>
              {task.version && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  v{task.version}
                </span>
              )}
              {task.changeReason && (
                <p className="text-sm text-slate-600 mt-2">{task.changeReason}</p>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleApprove(task)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleReject(task)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
```

```typescript
// client/src/components/dashboard/RecentActivityFeed.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userName: string;
  timestamp: Date;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '🆕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'APPROVE': return '✅';
      case 'REJECT': return '❌';
      case 'CALCULATE': return '🧮';
      default: return '📝';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'APPROVE': return 'text-green-600';
      case 'REJECT': return 'text-red-600';
      case 'DELETE': return 'text-red-600';
      case 'CALCULATE': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        ยังไม่มี activity
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <span className="text-2xl">{getActivityIcon(activity.action)}</span>
          <div className="flex-1">
            <p className={`text-sm font-medium ${getActivityColor(activity.action)}`}>
              {activity.userName} {activity.action.toLowerCase()} {activity.entityType}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), {
                addSuffix: true,
                locale: th,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityFeed;
```

```typescript
// client/src/components/dashboard/QuickActions.tsx
import React from 'react';

interface QuickActionsProps {
  onNavigate?: (page: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    { label: '+ สร้าง Request', page: 'create-request', icon: '📝', color: 'bg-blue-600' },
    { label: '📊 Master Data', page: 'master-data', icon: '📊', color: 'bg-purple-600' },
    { label: '📋 Price Requests', page: 'requests', icon: '📋', color: 'bg-green-600' },
    { label: '⚙️ Settings', page: 'settings', icon: '⚙️', color: 'bg-slate-600' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        ⚡ Quick Actions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.page}
            onClick={() => onNavigate?.(action.page)}
            className={`${action.color} text-white rounded-lg p-4 hover:opacity-90 transition-opacity`}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="text-sm font-medium">{action.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
```

**ไฟล์ใหม่:**
- `client/src/pages/Dashboard.tsx`
- `client/src/components/dashboard/StatCard.tsx`
- `client/src/components/dashboard/TaskList.tsx`
- `client/src/components/dashboard/RecentActivityFeed.tsx`
- `client/src/components/dashboard/QuickActions.tsx`

**ไฟล์ที่ต้องแก้:**
- `client/src/components/layout/MainLayout.tsx` - เปลี่ยน default page จาก `'requests'` เป็น `'dashboard'`
- `client/src/components/layout/MainLayout.tsx` - เพิ่ม case 'dashboard' ใน renderPage()

#### B. Task Center Page (Optional)

หากต้องการหน้า Task Center แยกจาก Dashboard:

```typescript
// client/src/pages/TaskCenter.tsx
// Similar structure to Dashboard but focus on Tasks only
// with tabs for different task types
```

### 0.6 Testing

**Test Cases:**
1. ✅ Dashboard แสดง statistics ถูกต้อง (ตาม role)
2. ✅ My Tasks แสดงงานที่รอดำเนินการถูกต้อง
3. ✅ Approve จาก Dashboard ทำงานได้
4. ✅ Reject จาก Dashboard ทำงานได้
5. ✅ Recent Activity แสดงถูกต้อง (real-time)
6. ✅ Quick Actions navigate ถูกต้อง
7. ✅ แต่ละ Role เห็น stats และ tasks ที่เหมาะสม

**Deliverables (ทำเสร็จแล้ว):**
- ✅ Dashboard Backend APIs ทำงาน 100% (dashboard.service.ts v2.6)
- ✅ Dashboard Frontend สมบูรณ์ (Dashboard.tsx, QuickApprovalTaskList.tsx)
- ✅ Role-based view ทำงานถูกต้อง (Admin, Sales, Costing)
- ✅ Task approval จาก Dashboard ได้
- ✅ UX ดีขึ้น - เห็นภาพรวมทันที
- ✅ Bug Fix: ScrapAllowance count mismatch แก้ไขแล้ว (v8.0)
- ✅ Navigation: Customer Groups และ Master Data ย้ายไปอยู่ใน Settings

---

## 🎯 Phase 1: Document Control & Version Management ✅ COMPLETE

**Timeline**: 2-3 สัปดาห์ (เสร็จแล้ว)
**Status**: ✅ **COMPLETE** (v7.x)
**Objective**: ทำให้ Master Data Version Control สมบูรณ์ พร้อม Rollback และ Archive

### 1.1 Master Data Version Control (Backend)

**สิ่งที่ต้องทำ:**

#### A. Archive Logic ✨
```typescript
// เมื่อ approve version ใหม่ → archive version เก่าอัตโนมัติ
async approveStandardPrice(id: string, username: string) {
  // 1. หา version เก่าที่เป็น Active (same rawMaterialId)
  const oldVersions = await this.standardPriceRepository.find({
    where: {
      rawMaterialId: newPrice.rawMaterialId,
      status: 'Active',
      id: Not(id)
    }
  });

  // 2. Archive version เก่า
  for (const old of oldVersions) {
    old.status = 'Archived';
    old.effectiveTo = new Date();
    old.isActive = false;
    await this.standardPriceRepository.save(old);
  }

  // 3. Approve version ใหม่
  newPrice.status = 'Active';
  newPrice.effectiveFrom = new Date();
  newPrice.approvedBy = userId;
  newPrice.approvedAt = new Date();
  await this.standardPriceRepository.save(newPrice);
}
```

**ไฟล์ที่ต้องแก้:**
- `server/src/data/data.service.ts`
  - `approveStandardPrice()` - line 827-874
  - `approveFabCost()` - line 885-932
  - `approveSellingFactor()` - line 943-990
  - เพิ่ม `approveLmeMasterData()` - ใหม่
  - เพิ่ม `approveExchangeRateMasterData()` - ใหม่

#### B. Rollback/Restore Version API ✨
```typescript
// Restore จาก history version → สร้าง version ใหม่
async restoreStandardPriceVersion(rawMaterialId: string, historyId: string, username: string) {
  // 1. ดึงข้อมูลจาก history
  const history = await this.standardPriceHistoryRepository.findOne({
    where: { id: historyId }
  });

  // 2. หา version ปัจจุบันที่สูงสุด
  const current = await this.standardPriceRepository.findOne({
    where: { rawMaterialId, status: 'Active' },
    order: { version: 'DESC' }
  });

  // 3. สร้าง version ใหม่ (v+1) จากข้อมูล history
  const newVersion = this.standardPriceRepository.create({
    rawMaterialId: history.rawMaterialId,
    price: history.price,
    currency: history.currency,
    version: (current?.version || 0) + 1,
    status: 'Draft', // ให้อนุมัติใหม่
    changeReason: `Restored from v${history.version}`,
    // ... copy fields จาก history
  });

  return await this.standardPriceRepository.save(newVersion);
}
```

**API Endpoints ใหม่:**
- `POST /api/data/standard-prices/restore/:historyId`
- `POST /api/data/fab-costs/restore/:historyId`
- `POST /api/data/selling-factors/restore/:historyId`
- `POST /api/data/lme-master-data/restore/:historyId`
- `POST /api/data/exchange-rate-master-data/restore/:historyId`

**ไฟล์ที่ต้องแก้:**
- `server/src/data/data.service.ts` (เพิ่ม 5 restore methods)
- `server/src/data/data.controller.ts` (เพิ่ม 5 endpoints)

### 1.2 Version History UI (Frontend)

**สิ่งที่ต้องทำ:**

#### A. Version History Modal Component
```typescript
// client/src/components/VersionHistoryModal.tsx
interface VersionHistoryModalProps {
  entityType: 'standard-price' | 'fab-cost' | 'selling-factor' | 'lme' | 'exchange-rate';
  entityId: string;
  onClose: () => void;
  onRestore: (historyId: string) => void;
}

// Features:
// - Timeline view แสดงทุก version
// - แสดง: version, status, date, user, changeReason
// - ปุ่ม "Restore to this version"
// - Diff view (Before/After) ถ้าเป็นไปได้
```

#### B. แก้ไข Master Data Tables
```typescript
// เพิ่มปุ่ม "History" ในทุก Master Data table
<button
  onClick={() => setShowHistory(item.id)}
  className="text-blue-600 hover:text-blue-800"
>
  📜 History
</button>
```

**ไฟล์ที่ต้องแก้:**
- `client/src/components/VersionHistoryModal.tsx` - ใหม่
- `client/src/pages/MasterData.tsx` - เพิ่มปุ่ม History ในทุกตาราง

### 1.3 Testing

**Test Cases:**
1. ✅ เมื่อ approve version ใหม่ → version เก่า status เปลี่ยนเป็น Archived
2. ✅ เมื่อ approve version ใหม่ → version เก่า effectiveTo = วันที่ approve
3. ✅ Restore version เก่า → สร้าง version ใหม่ (Draft) ที่ต้องอนุมัติใหม่
4. ✅ History Modal แสดงทุก version ถูกต้อง
5. ✅ Restore button ทำงานได้

**Deliverables (ทำเสร็จแล้ว):**
- ✅ Archive Logic ทำงาน 100% (approve → archive old version)
- ✅ Rollback API ทำงาน 100% (restore from archived)
- ✅ Version History UI สมบูรณ์ (VersionHistoryModal.tsx)
- ✅ Test ผ่านทุก use case
- ✅ Master Data ทั้งหมดมี Version Control: FAB Cost, Selling Factor, LME, Exchange Rate, Scrap Allowance

---

## 🎯 Phase 2: Customer Group Override System ✅ COMPLETE

**Timeline**: 3-4 สัปดาห์ (เสร็จแล้ว)
**Status**: ✅ **COMPLETE** (v7.7 Backend, v8.0 Frontend)
**Objective**: ใช้งาน Customer Group Overrides ได้เต็มรูปแบบ (v7.0 Design)

### 2.1 Customer Group API (Backend)

**Override Entities ที่มีแล้ว (5 types):**
- ✅ `CustomerGroupStandardPriceOverride` + History
- ✅ `CustomerGroupLmePriceOverride` + History
- ✅ `CustomerGroupFabCostOverride` + History
- ✅ `CustomerGroupSellingFactorOverride` + History
- ✅ `CustomerGroupExchangeRateOverride` + History

**สิ่งที่ต้องทำ:**

#### A. Customer Group Service & Controller
```typescript
// server/src/customer-groups/customer-groups.service.ts
@Injectable()
export class CustomerGroupsService {
  // Customer Group CRUD
  async findAll() { ... }
  async findOne(id: string) { ... }
  async create(dto: CreateCustomerGroupDto) { ... }
  async update(id: string, dto: UpdateCustomerGroupDto) { ... }
  async delete(id: string) { ... }

  // Override CRUD (5 types)
  async getOverrides(groupId: string, type: OverrideType) { ... }
  async createOverride(groupId: string, type: OverrideType, dto: any) { ... }
  async updateOverride(groupId: string, overrideId: string, dto: any) { ... }
  async approveOverride(groupId: string, overrideId: string, username: string) { ... }
  async deleteOverride(groupId: string, overrideId: string) { ... }

  // Version Control (Override)
  async getOverrideHistory(groupId: string, overrideId: string) { ... }
  async restoreOverrideVersion(groupId: string, historyId: string) { ... }
}
```

**API Endpoints ใหม่:**
```
Customer Groups:
GET    /api/customer-groups
GET    /api/customer-groups/:id
POST   /api/customer-groups
PUT    /api/customer-groups/:id
DELETE /api/customer-groups/:id

Overrides (Generic for 5 types):
GET    /api/customer-groups/:groupId/overrides/:type
POST   /api/customer-groups/:groupId/overrides/:type
PUT    /api/customer-groups/:groupId/overrides/:type/:id
PUT    /api/customer-groups/:groupId/overrides/:type/:id/approve
DELETE /api/customer-groups/:groupId/overrides/:type/:id

Override History:
GET    /api/customer-groups/:groupId/overrides/:type/:id/history
POST   /api/customer-groups/:groupId/overrides/:type/:id/restore/:historyId
```

**type values**: `standard-price`, `lme-price`, `fab-cost`, `selling-factor`, `exchange-rate`

**ไฟล์ใหม่:**
- `server/src/customer-groups/customer-groups.module.ts`
- `server/src/customer-groups/customer-groups.service.ts`
- `server/src/customer-groups/customer-groups.controller.ts`
- `server/src/customer-groups/dto/create-customer-group.dto.ts`
- `server/src/customer-groups/dto/update-customer-group.dto.ts`
- `server/src/customer-groups/dto/create-override.dto.ts`

#### B. Price Calculation Integration
```typescript
// แก้ไข PriceCalculationService ให้ใช้ Override data
// ลำดับการหาราคา:
// 1. หา customerGroupId จาก CustomerMapping
// 2. หา Override (ถ้ามี) → ใช้ราคา Override
// 3. ถ้าไม่มี Override → ใช้ Master Data (Global Default)
```

**ไฟล์ที่ต้องแก้:**
- `server/src/price-calculation/price-calculation.service.ts`
- `server/src/price-calculation/price-calculation.module.ts` (inject CustomerGroup repositories)

### 2.2 Customer Group UI (Frontend)

**สิ่งที่ต้องทำ:**

#### A. Customer Group Management Page
```typescript
// client/src/pages/CustomerGroups.tsx
// Layout: Sidebar (Group List) + Main (Group Details + Tabs)

// Sidebar:
// - รายการ Customer Groups (Searchable)
// - แสดง: name, code, customer count, status
// - ปุ่ม "+ New Group"

// Main Area:
// - Group Info (แก้ไขได้)
// - 7 Tabs:
//   1. Customers (รายการ customers ใน group นี้)
//   2. Standard Price Override
//   3. LME Price Override
//   4. FAB Cost Override
//   5. Selling Factor Override
//   6. Exchange Rate Override
//   7. Activity Log
```

#### B. Override Card Component
```typescript
// client/src/components/CustomerGroupOverrideCard.tsx
// แสดง:
// - Current Active Override (if any)
// - Pending Approval Override (if any)
// - ปุ่ม "Create Override" / "Edit" / "Approve" / "History"
// - Status badge: Draft, Active, Archived
```

#### C. Override History Modal
```typescript
// เหมือน Master Data Version History แต่สำหรับ Override
// Reuse VersionHistoryModal component ที่ทำใน Phase 1
```

**ไฟล์ใหม่:**
- `client/src/pages/CustomerGroups.tsx`
- `client/src/components/CustomerGroupSidebar.tsx`
- `client/src/components/CustomerGroupTabs.tsx`
- `client/src/components/CustomerGroupOverrideCard.tsx`

**ไฟล์ที่ต้องแก้:**
- `client/src/components/layout/MainLayout.tsx` - เพิ่ม navigation link
- `client/src/App.tsx` - เพิ่ม route

### 2.3 Testing

**Test Cases:**
1. ✅ สร้าง Customer Group ได้
2. ✅ สร้าง Override ได้ (5 types)
3. ✅ Approve Override → Archive version เก่า
4. ✅ Price Calculation ใช้ Override ถ้ามี, ไม่มีใช้ Master Data
5. ✅ Customer Mapping → Group → Override → ราคาถูกต้อง
6. ✅ Restore Override Version ทำงานได้
7. ✅ UI แสดงข้อมูลถูกต้อง ครบทั้ง 7 tabs

**Deliverables (ทำเสร็จแล้ว):**
- ✅ Customer Group APIs ครบทุก endpoints (customer-groups.service.ts v1.0)
- ✅ Override System ทำงาน 100% (รองรับ 5 types: Standard Price, LME, FAB Cost, Selling Factor, Exchange Rate)
- ✅ Price Calculation ใช้ Override ถูกต้อง (price-calculation.service.ts v4.0)
- ✅ UI สมบูรณ์ รองรับ 10+ Groups (CustomerGroups.tsx - อยู่ใน Settings)
- ✅ Version Control (Override) ทำงานเหมือน Master Data
- ✅ Customer Mapping management (assign customers to groups)

---

## 🎯 Phase 3: Manual Mapping UI & Item Status ✅ COMPLETE

**Timeline**: 1-2 สัปดาห์ (เสร็จแล้ว)
**Status**: ✅ **COMPLETE** (v6.0)
**Objective**: Costing Team ทำ Manual Mapping ผ่าน UI ได้

### 3.1 Manual Mapping UI (Frontend)

**สิ่งที่ต้องทำ:**

#### A. Item Mapping Tab (ใน Master Data)
```typescript
// client/src/pages/MasterData.tsx → Tab: "Item Mapping"

// แสดง 2 sections:
// 1. Pending Mappings (Dummy Items ที่รอ map)
// 2. Recent Mappings (History)

// Pending Mappings Table:
// Columns: Dummy ID, Name, Request ID, PO, Created Date, Actions
// Actions: "Map to D365" button

// Mapping Form Modal:
// - Input: D365 Item ID
// - Input: Customer PO (auto-filled)
// - Textarea: Notes
// - Button: Confirm Mapping
```

#### B. Item Status Badges
```typescript
// แสดง status ในทุกที่ที่เกี่ยวข้อง

// BOQViewer Component:
// แสดง badge ข้าง Product Name:
// - 🟢 AVAILABLE (Green) - ไม่ควรเกิดใน Production
// - 🟡 IN_USE (Yellow) - Dummy BOQ (แก้ไขได้)
// - 🔵 MAPPED (Blue) - รอ sync D365
// - ⚫ REPLACED (Gray) - ถูกแทนที่แล้ว
// - 🟣 PRODUCTION (Purple) - Production BOQ (Read-only)

// CreateRequest Page:
// แสดง status เมื่อเลือก Product
```

**ไฟล์ที่ต้องแก้:**
- `client/src/pages/MasterData.tsx` - เพิ่ม Tab "Item Mapping"
- `client/src/components/BOQViewer.tsx` - เพิ่ม Status Badge
- `client/src/pages/CreateRequest.tsx` - เพิ่ม Status Badge
- `client/src/components/ItemStatusBadge.tsx` - ใหม่

### 3.2 Testing

**Test Cases:**
1. ✅ Pending Mappings แสดงข้อมูลถูกต้อง
2. ✅ Mapping Form ทำงานได้
3. ✅ หลัง Map → Status เปลี่ยนเป็น MAPPED
4. ✅ BOQViewer แสดง badge ถูกต้อง
5. ✅ Activity Log บันทึก mapping event

**Deliverables (ทำเสร็จแล้ว):**
- ✅ Manual Mapping UI สมบูรณ์ (ItemMappingManager.tsx)
- ✅ Item Status Badges ทำงาน 100% (ItemStatusBadge.tsx - AVAILABLE, IN_USE, MAPPED, REPLACED, PRODUCTION)
- ✅ Test ผ่านทุก use case
- ✅ Dummy Item Lifecycle Management (Product.entity v4.0)
- ✅ Manual Mapping APIs (DummyItemsService, DummyItemsController)

---

## 🎯 Phase 4: D365 Auto-Creation Preparation ⏳ PLANNING

**Timeline**: 2-3 สัปดาห์
**Status**: ⏳ **PLANNING** (Mock API พร้อมบางส่วน)
**Objective**: เตรียมพร้อมสำหรับ Auto-Creation API (ยังไม่เชื่อม D365 จริง)

### 4.1 D365 API Interface Design

**สิ่งที่ต้องทำ:**

#### A. D365 API Service (Mock)
```typescript
// server/src/d365/d365-api.service.ts
@Injectable()
export class D365ApiService {
  // Mock implementation (ยังไม่เชื่อม D365 จริง)

  async createItem(itemData: CreateD365ItemDto): Promise<string> {
    // Mock: return D365 Item ID
    // จริงๆ: POST to D365 API
    return `D365-FG-${Date.now()}`;
  }

  async createBOM(bomData: CreateD365BomDto): Promise<string> {
    // Mock: return D365 BOM ID
    return `D365-BOM-${Date.now()}`;
  }

  async checkItemExists(itemId: string): Promise<boolean> {
    // Mock: return false
    return false;
  }

  async validateItemData(itemData: any): Promise<ValidationResult> {
    // Validate ก่อนส่งไป D365
    // Check: required fields, data types, business rules
    return { valid: true, errors: [] };
  }
}
```

**ไฟล์ใหม่:**
- `server/src/d365/d365.module.ts`
- `server/src/d365/d365-api.service.ts`
- `server/src/d365/dto/create-d365-item.dto.ts`
- `server/src/d365/dto/create-d365-bom.dto.ts`

#### B. Ready for D365 Validation
```typescript
// ตรวจสอบว่า Dummy Item พร้อมสร้างใน D365 หรือยัง
async checkReadyForD365(dummyItemId: string): Promise<ReadyCheckResult> {
  const item = await this.findOne(dummyItemId);
  const errors = [];

  // 1. Check BOQ exists and complete
  if (!item.bom || item.bom.items.length === 0) {
    errors.push('BOQ is empty');
  }

  // 2. Check Price approved
  const request = await this.priceRequestRepo.findOne({
    where: { assignedDummyId: dummyItemId }
  });
  if (!request || request.status !== 'Approved') {
    errors.push('Price not approved');
  }

  // 3. Check Customer PO exists
  if (!item.customerPO) {
    errors.push('Customer PO is required');
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings: []
  };
}
```

**API Endpoints ใหม่:**
- `GET /api/dummy-items/:id/ready-for-d365` - ตรวจสอบความพร้อม
- `POST /api/dummy-items/:id/push-to-d365` - ยิง API สร้างใน D365 (Mock)

**ไฟล์ที่ต้องแก้:**
- `server/src/dummy-items/dummy-items.service.ts`
- `server/src/dummy-items/dummy-items.controller.ts`

### 4.2 Retry Mechanism Design

**สิ่งที่ต้องทำ:**

#### A. Retry Queue System
```typescript
// server/src/d365/retry-queue.service.ts
@Injectable()
export class RetryQueueService {
  // Exponential backoff: 1min, 5min, 30min, 2hr, 12hr
  private readonly RETRY_DELAYS = [60, 300, 1800, 7200, 43200];

  async addToQueue(dummyItemId: string, operation: 'CREATE_ITEM' | 'CREATE_BOM') {
    // เพิ่ม item ลง retry queue
  }

  async processQueue() {
    // Background job ที่ retry failed items
  }

  async retryItem(queueItemId: string) {
    // Retry การสร้าง item
  }

  categorizeError(error: any): 'RETRYABLE' | 'NON_RETRYABLE' {
    // Categorize error เพื่อตัดสินใจว่าจะ retry หรือไม่
    // RETRYABLE: Network errors, Timeouts, 5xx errors
    // NON_RETRYABLE: 4xx errors, Validation errors
  }
}
```

**Entity ใหม่:**
```typescript
// server/src/entities/d365-retry-queue.entity.ts
@Entity('d365_retry_queue')
export class D365RetryQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dummyItemId: string;

  @Column()
  operation: string; // 'CREATE_ITEM' | 'CREATE_BOM'

  @Column()
  retryCount: number;

  @Column()
  maxRetries: number;

  @Column({ type: 'datetime', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column()
  status: string; // 'PENDING' | 'RETRYING' | 'FAILED' | 'SUCCESS'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**ไฟล์ใหม่:**
- `server/src/d365/retry-queue.service.ts`
- `server/src/entities/d365-retry-queue.entity.ts`

### 4.3 Auto-Creation UI (Preparation)

**สิ่งที่ต้องทำ:**

#### A. Auto-Creation Dashboard (Mock)
```typescript
// client/src/pages/D365AutoCreation.tsx
// แสดง:
// - รายการ items ที่รอสร้างใน D365
// - สถานะ: Ready, Pushing, Success, Failed
// - ปุ่ม "Push to D365" (Mock - ยังไม่ได้เชื่อมจริง)
// - ปุ่ม "Retry" สำหรับ failed items
// - History log
```

**ไฟล์ใหม่:**
- `client/src/pages/D365AutoCreation.tsx`

### 4.4 Testing

**Test Cases:**
1. ✅ Ready check validation ทำงานถูกต้อง
2. ✅ Mock API สร้าง D365 Item ID ได้
3. ✅ Retry queue เพิ่ม item ได้
4. ✅ Error categorization ถูกต้อง
5. ✅ UI แสดงสถานะถูกต้อง

**Deliverables:**
- ✅ D365 API Service (Mock) พร้อม
- ✅ Validation Logic สมบูรณ์
- ✅ Retry Mechanism พร้อมใช้งาน
- ✅ UI Dashboard พร้อม (Mock)

---

## 🎯 Phase 5: Employee Entity & Production Integration

**Timeline**: 2-3 สัปดาห์
**Objective**: แทนที่ User entity ด้วย Employee + เตรียม Production Deployment

### 5.1 Employee Entity

**สิ่งที่ต้องทำ:**

#### A. Employee Entity (from MongoDB)
```typescript
// server/src/entities/employee.entity.ts
@Entity('employees')
export class Employee extends ExternalDataEntity {
  @PrimaryColumn()
  id: string; // EMP-001

  @Column()
  code: string; // รหัสพนักงาน

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  department: string;

  @Column()
  position: string;

  @Column({ nullable: true })
  userId: string; // Link to User (for authentication)

  // Sync from MongoDB
  @Column({ nullable: true })
  sourceSystem: string; // 'D365'

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

**ไฟล์ใหม่:**
- `server/src/entities/employee.entity.ts`

#### B. Update Audit Trail Fields
```typescript
// แก้ไข entities ที่มี audit trail fields
// เปลี่ยนจาก: approvedBy: string (userId)
// เป็น: approvedBy: string (employeeId)

// Entities ที่ต้องแก้:
// - VersionedEntity base class
// - Master Data entities
// - Override entities
// - PriceRequest
// - ActivityLog
```

**ไฟล์ที่ต้องแก้:**
- `server/src/entities/base.entity.ts`
- ทุก entity ที่ extend VersionedEntity
- `server/src/entities/price-request.entity.ts`
- `server/src/entities/activity-log.entity.ts`

#### C. Employee Sync Service
```typescript
// server/src/import/sync-employees.service.ts
@Injectable()
export class SyncEmployeesService {
  async syncFromMongoDB() {
    // ดึงข้อมูล employees จาก MongoDB
    // บันทึกลง SQLite
  }
}
```

**ไฟล์ใหม่:**
- `server/src/import/sync-employees.service.ts`

**API Endpoints ใหม่:**
- `GET /api/employees` - รายการพนักงาน
- `POST /api/import/sync/employees` - Sync from MongoDB

**ไฟล์ที่ต้องแก้:**
- `server/src/import/import.controller.ts`
- `server/src/import/import.module.ts`

### 5.2 Role-Based Access Control

**สิ่งที่ต้องทำ:**

#### A. Employee Roles
```typescript
// server/src/auth/roles.decorator.ts
export enum UserRole {
  ADMIN = 'Admin',
  SALES = 'Sales',
  COSTING = 'Costing',
  VIEWER = 'Viewer'
}

// server/src/auth/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // ตรวจสอบ role จาก JWT token
    // เปรียบเทียบกับ roles ที่อนุญาต
  }
}
```

**Permission Matrix:**
```
Admin:
- ทุกอย่าง (CRUD all entities)

Sales:
- CREATE, READ Price Request
- READ Master Data (view only)
- READ Calculation Results

Costing:
- READ, UPDATE Price Request
- CRUD BOQ
- Calculate Price
- Manual Mapping
- READ Master Data

Viewer:
- READ only (ทุกอย่าง)
```

**ไฟล์ใหม่:**
- `server/src/auth/roles.decorator.ts`
- `server/src/auth/roles.guard.ts`

**ไฟล์ที่ต้องแก้:**
- ทุก controller - เพิ่ม `@Roles()` decorator

### 5.3 Production Deployment Preparation

**สิ่งที่ต้องทำ:**

#### A. PostgreSQL Support
```typescript
// แก้ไข TypeORM config รองรับ PostgreSQL
// server/src/app.module.ts
TypeOrmModule.forRoot({
  type: process.env.DATABASE_TYPE || 'sqlite',
  // SQLite config
  database: 'database.sqlite',
  // PostgreSQL config (production)
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // ...
})
```

**ไฟล์ที่ต้องแก้:**
- `server/src/app.module.ts`
- `server/.env.example` - เพิ่ม PostgreSQL config

#### B. Migration Scripts
```bash
# สร้าง migration scripts สำหรับ production
npm run migration:generate -- -n InitialSchema
npm run migration:generate -- -n AddEmployeeEntity
npm run migration:generate -- -n AddOverrideEntities
```

**ไฟล์ใหม่:**
- `server/src/migrations/*.ts` - migration files

#### C. Docker Support
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

**ไฟล์ใหม่:**
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

### 5.4 Testing

**Test Cases:**
1. ✅ Employee entity sync from MongoDB
2. ✅ Audit trail ใช้ employeeId แทน userId
3. ✅ Role-based access control ทำงานถูกต้อง
4. ✅ PostgreSQL migration สำเร็จ
5. ✅ Docker container รันได้

**Deliverables:**
- ✅ Employee Entity สมบูรณ์
- ✅ RBAC ทำงาน 100%
- ✅ PostgreSQL Support พร้อม
- ✅ Migration Scripts พร้อม
- ✅ Docker Ready

---

## 🚀 Phase 6: D365 Auto-Creation (Production)

**Timeline**: 3-4 สัปดาห์
**Objective**: เชื่อม D365 API จริง + Auto-Creation ทำงานได้

### 6.1 D365 API Integration (Real)

**สิ่งที่ต้องทำ:**

#### A. แทนที่ Mock ด้วย Real API
```typescript
// server/src/d365/d365-api.service.ts
// เปลี่ยนจาก Mock → เชื่อม D365 API จริง

async createItem(itemData: CreateD365ItemDto): Promise<string> {
  // POST to D365 OData API
  // Endpoint: /data/Products
  // Auth: OAuth 2.0 / API Key

  const response = await axios.post(
    `${this.d365BaseUrl}/data/Products`,
    itemData,
    { headers: this.getAuthHeaders() }
  );

  return response.data.ItemId;
}
```

**Configuration:**
```env
# .env
D365_BASE_URL=https://your-d365-instance.dynamics.com
D365_CLIENT_ID=xxx
D365_CLIENT_SECRET=xxx
D365_TENANT_ID=xxx
D365_AUTH_URL=https://login.microsoftonline.com
```

**ไฟล์ที่ต้องแก้:**
- `server/src/d365/d365-api.service.ts` - แทนที่ Mock
- `server/.env.example` - เพิ่ม D365 config

#### B. Error Handling (Production)
```typescript
// Handle D365-specific errors
// - Authentication errors
// - Validation errors
// - Duplicate item errors
// - Network timeouts
// - Rate limiting
```

### 6.2 Background Jobs

**สิ่งที่ต้องทำ:**

#### A. Scheduled Jobs
```typescript
// server/src/d365/d365-jobs.service.ts
@Injectable()
export class D365JobsService {
  @Cron('0 */5 * * * *') // Every 5 minutes
  async processRetryQueue() {
    // Process failed items
  }

  @Cron('0 0 * * * *') // Every hour
  async cleanupOldQueue() {
    // Clean up old completed items
  }
}
```

**ไฟล์ใหม่:**
- `server/src/d365/d365-jobs.service.ts`

### 6.3 Monitoring & Logging

**สิ่งที่ต้องทำ:**

#### A. Enhanced Logging
```typescript
// Log ทุก D365 API calls
// - Request/Response
// - Errors
// - Retry attempts
// - Success/Failure rates
```

#### B. Monitoring Dashboard (Frontend)
```typescript
// client/src/pages/D365Monitoring.tsx
// แสดง:
// - Success rate (%)
// - Failed items count
// - Retry queue size
// - Average processing time
// - Error breakdown
```

**ไฟล์ใหม่:**
- `client/src/pages/D365Monitoring.tsx`

### 6.4 Testing

**Test Cases:**
1. ✅ D365 Authentication ทำงาน
2. ✅ Create Item สำเร็จ → ได้ D365 Item ID
3. ✅ Create BOM สำเร็จ
4. ✅ Error handling ทำงานถูกต้อง
5. ✅ Retry mechanism ทำงาน
6. ✅ Monitoring dashboard แสดงข้อมูลถูกต้อง

**Deliverables:**
- ✅ D365 API Integration สมบูรณ์
- ✅ Auto-Creation ทำงาน 100%
- ✅ Error Handling Production-Ready
- ✅ Monitoring System พร้อม

---

## 📊 Summary Timeline (Updated v8.0)

| Phase | Duration | Status | Key Deliverables |
|-------|----------|--------|------------------|
| **Phase 0: Dashboard & Task Center** | 1-2 weeks | ✅ **COMPLETE** | Dashboard (Role-based), Task Center, Statistics Cards, My Tasks Widget, Recent Activity Feed, Quick Actions, One-click Approval, Bug Fixes |
| **Phase 1: Document Control** | 2-3 weeks | ✅ **COMPLETE** | Version Control สมบูรณ์, Archive Logic, Rollback Function, Version History UI, Master Data Version Control (5 types) |
| **Phase 2: Customer Group Override** | 3-4 weeks | ✅ **COMPLETE** | Override System APIs + UI (7 tabs), Price Calculation Integration, Override Version Control, Customer Mapping |
| **Phase 3: Manual Mapping UI** | 1-2 weeks | ✅ **COMPLETE** | Manual Mapping UI, Item Status Badges, Pending Mappings Table, Dummy Item Lifecycle |
| Phase 4: D365 Prep | 2-3 weeks | ⏳ PLANNING | Mock API, Validation, Retry Mechanism, Auto-Creation Dashboard (Mock) |
| Phase 5: Employee & Production | 2-3 weeks | ⏳ PLANNING | Employee Entity, RBAC, PostgreSQL, Docker, Migration Scripts |
| Phase 6: D365 Auto-Creation | 3-4 weeks | ⏳ PLANNING | Real D365 Integration, Auto-Creation, Monitoring, Background Jobs |

**Total Estimated Time**: 14-21 สัปดาห์ (3.5-5.5 เดือน)
**Completed**: 7-10 สัปดาห์ (Phase 0-3) ✅
**Remaining**: 7-11 สัปดาห์ (Phase 4-6) ⏳

---

## 🎯 Next Steps (After v8.0)

### ✅ Completed Phases (Phase 0-3):
- ✅ Phase 0: Dashboard & Task Center - COMPLETE
- ✅ Phase 1: Document Control & Version Management - COMPLETE
- ✅ Phase 2: Customer Group Override System - COMPLETE
- ✅ Phase 3: Manual Mapping UI & Item Status - COMPLETE

### 🔄 Current Status:
**System ทำงานได้เต็มรูปแบบสำหรับ:**
- Price Request creation + BOQ management
- Price Calculation with Customer Group specific pricing
- Master Data management with full version control
- Dashboard & Task Center for quick approval
- Manual Dummy Item mapping

### 🚀 Future Development (Phase 4-6):

**Phase 4: D365 Auto-Creation Preparation** (⏳ PLANNING)
- Design D365 API integration interface
- Create validation logic (Ready for D365 check)
- Implement retry mechanism
- Build Auto-Creation Dashboard (Mock)

**Phase 5: Employee Entity & Production** (⏳ PLANNING)
- Employee entity (sync from MongoDB)
- Role-based Access Control (RBAC)
- PostgreSQL support
- Docker containerization
- Migration scripts

**Phase 6: D365 Auto-Creation (Production)** (⏳ PLANNING)
- Real D365 API integration
- Auto-creation workflow
- Monitoring & logging
- Background jobs & retry mechanism

---

## 💡 Phase Priority & Recommendations (Updated)

### ✅ HIGH Priority - COMPLETED:
- ✅ **Phase 0**: Dashboard & Task Center - เพิ่ม UX อย่างมาก, ลดขั้นตอนการทำงาน
- ✅ **Phase 1**: Document Control - จำเป็นสำหรับ Master Data และ Override System
- ✅ **Phase 2**: Customer Group Override System - Core feature ของ v7.0
- ✅ **Phase 3**: Manual Mapping UI - ปิด gap ใน Dummy Item Lifecycle

### ⏳ MEDIUM Priority - FUTURE:
- 🚀 **Phase 4**: D365 Auto-Creation Prep - เตรียมความพร้อมสำหรับ automation
- 🏭 **Phase 5**: Production Deployment - เตรียมพร้อม production environment

### 📉 LOW Priority - OPTIONAL:
- 🔄 **Phase 6**: D365 Auto-Creation (Full) - Automation เต็มรูปแบบ (ยังทำ Manual ได้)

---

**หมายเหตุ:**
- แต่ละ Phase สามารถทำพร้อมกันได้บางส่วน (Parallel Development)
- ควร Deploy แต่ละ Phase เป็น Staging ก่อน Production
- ควรมี UAT (User Acceptance Testing) หลังแต่ละ Phase
