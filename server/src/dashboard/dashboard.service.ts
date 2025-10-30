// path: server/src/dashboard/dashboard.service.ts
// version: 2.6 (Fix Master Data count - Add ScrapAllowance)
// last-modified: 30 ตุลาคม 2568 20:00

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';

// Import entities
import { PriceRequest } from '../entities/price-request.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { ScrapAllowance } from '../entities/scrap-allowance.entity';
import { Product } from '../entities/product.entity';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PriceRequest)
    private priceRequestRepo: Repository<PriceRequest>,
    @InjectRepository(StandardPrice)
    private standardPriceRepo: Repository<StandardPrice>,
    @InjectRepository(FabCost)
    private fabCostRepo: Repository<FabCost>,
    @InjectRepository(SellingFactor)
    private sellingFactorRepo: Repository<SellingFactor>,
    @InjectRepository(LmeMasterData)
    private lmeRepo: Repository<LmeMasterData>,
    @InjectRepository(ExchangeRateMasterData)
    private exRateRepo: Repository<ExchangeRateMasterData>,
    @InjectRepository(ScrapAllowance)
    private scrapAllowanceRepo: Repository<ScrapAllowance>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ActivityLog)
    private activityLogRepo: Repository<ActivityLog>,
  ) {}

  // ====================================
  // Main Methods
  // ====================================

  async getDashboardStats(userId: string, role: string) {
    console.log(`[DashboardService] Getting stats for userId: ${userId}, role: ${role}`);

    // รองรับทั้ง 'Admin' และ 'Administrator'
    if (role === 'Admin' || role === 'Administrator') {
      return this.getAdminStats();
    } else if (role === 'Sales') {
      return this.getSalesStats(userId);
    } else if (role === 'Costing') {
      return this.getCostingStats(userId);
    }

    // Default stats for unknown roles
    console.log(`[DashboardService] ⚠️ Unknown role: ${role}, returning default stats`);
    return this.getDefaultStats();
  }

  async getMyTasks(userId: string, role: string, limit: number = 5) {
    console.log(`[DashboardService] Getting tasks for userId: ${userId}, role: ${role}, limit: ${limit}`);

    // รองรับทั้ง 'Admin' และ 'Administrator'
    if (role === 'Admin' || role === 'Administrator') {
      return this.getAdminTasks(limit);
    } else if (role === 'Costing') {
      return this.getCostingTasks(limit);
    } else if (role === 'Sales') {
      return this.getSalesTasks(userId, limit);
    }

    console.log(`[DashboardService] ⚠️ Unknown role: ${role}, returning empty tasks`);
    return [];
  }

  async getRecentActivity(limit: number = 10) {
    console.log(`[DashboardService] Getting recent activity, limit: ${limit}`);

    const activities = await this.activityLogRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'priceRequest'],
    });

    return activities.map((activity) => ({
      id: activity.id,
      action: activity.activityType,
      entityType: 'price-request',
      entityId: activity.requestId,
      description: activity.description,
      username: activity.user?.username || activity.userName || 'System',
      createdAt: activity.createdAt,
    }));
  }

  // ====================================
  // Admin Stats
  // ====================================

  private async getAdminStats() {
    // นับ Price Requests แยกตาม Workflow
    const [
      draftCount,
      pendingCount,
      calculatingCount,
      pendingApprovalCount,
      approvedThisMonth,
      rejectedCount,
      masterDataPending,
      totalCreatedThisMonth,
    ] = await Promise.all([
      this.priceRequestRepo.count({ where: { status: 'Draft' } }),
      this.priceRequestRepo.count({ where: { status: 'Pending' } }),
      this.priceRequestRepo.count({ where: { status: 'Calculating' } }),
      this.priceRequestRepo.count({ where: { status: 'Pending Approval' } }),
      this.priceRequestRepo.count({
        where: {
          status: 'Approved',
          approvedAt: MoreThan(this.getStartOfMonth()),
        },
      }),
      this.priceRequestRepo.count({ where: { status: 'Rejected' } }),
      this.countPendingMasterData(),
      this.priceRequestRepo.count({
        where: {
          createdAt: MoreThan(this.getStartOfMonth()),
        },
      }),
    ]);

    // คำนวณ approval rate
    const approvalRate = totalCreatedThisMonth > 0
      ? Math.round((approvedThisMonth / totalCreatedThisMonth) * 100)
      : 0;

    return {
      draftRequests: {
        count: draftCount,
        label: 'Draft - รอส่ง',
        icon: '📝',
      },
      pendingRequests: {
        count: pendingCount,
        label: 'Pending - รอคำนวณ',
        icon: '📤',
      },
      calculatingRequests: {
        count: calculatingCount,
        label: 'Calculating - กำลังคำนวณ',
        icon: '🧮',
      },
      pendingApprovalRequests: {
        count: pendingApprovalCount,
        label: 'Pending Approval - รออนุมัติ',
        icon: '⏳',
      },
      approvedThisMonth: {
        count: approvedThisMonth,
        label: 'Approved - อนุมัติแล้ว (เดือนนี้)',
        icon: '✅',
      },
      rejectedRequests: {
        count: rejectedCount,
        label: 'Rejected - ถูกปฏิเสธ',
        icon: '❌',
      },
      masterDataPending: {
        count: masterDataPending,
        label: 'Master Data - รออนุมัติ',
        icon: '📊',
      },
      thisMonthStats: {
        count: approvalRate,
        label: `สถิติเดือนนี้ - ${approvedThisMonth}/${totalCreatedThisMonth} (${approvalRate}%)`,
        icon: '📈',
      },
    };
  }

  // ====================================
  // Sales Stats
  // ====================================

  private async getSalesStats(userId: string) {
    // นับ Price Requests ของ Sales แยกตาม Workflow
    const [
      myDrafts,
      myPending,
      myCalculating,
      myPendingApproval,
      myApproved,
      myTotalSubmitted,
    ] = await Promise.all([
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: 'Draft' },
      }),
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: 'Pending' },
      }),
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: 'Calculating' },
      }),
      this.priceRequestRepo.count({
        where: { createdBy: userId, status: 'Pending Approval' },
      }),
      this.priceRequestRepo.count({
        where: {
          createdBy: userId,
          status: 'Approved',
          approvedAt: MoreThan(this.getStartOfMonth()),
        },
      }),
      this.priceRequestRepo.count({
        where: {
          createdBy: userId,
          status: In(['Pending', 'Calculating', 'Pending Approval', 'Approved']),
        },
      }),
    ]);

    // คำนวณ Total Value และ Success Rate
    const approvedRequests = await this.priceRequestRepo.find({
      where: {
        createdBy: userId,
        status: 'Approved',
        approvedAt: MoreThan(this.getStartOfMonth()),
      },
    });

    const totalValue = approvedRequests.reduce((sum, req) => {
      if (req.calculationResult) {
        try {
          const result = JSON.parse(req.calculationResult);
          return sum + (result.totalPrice || 0);
        } catch {
          return sum;
        }
      }
      return sum;
    }, 0);

    const successRate = myTotalSubmitted > 0
      ? Math.round((myApproved / myTotalSubmitted) * 100)
      : 0;

    return {
      myDraftRequests: {
        count: myDrafts,
        label: 'Draft - ของฉัน',
        icon: '📝',
      },
      myPendingRequests: {
        count: myPending,
        label: 'Pending - ส่งแล้ว',
        icon: '📤',
      },
      myCalculatingRequests: {
        count: myCalculating,
        label: 'Calculating - กำลังคำนวณ',
        icon: '🧮',
      },
      myPendingApprovalRequests: {
        count: myPendingApproval,
        label: 'Pending Approval - รออนุมัติ',
        icon: '⏳',
      },
      myApprovedRequests: {
        count: myApproved,
        label: 'Approved - อนุมัติแล้ว (เดือนนี้)',
        icon: '✅',
      },
      myTotalValue: {
        count: Math.round(totalValue),
        label: `มูลค่ารวม (เดือนนี้) - ฿${totalValue.toLocaleString('th-TH')}`,
        icon: '💰',
      },
      mySuccessRate: {
        count: successRate,
        label: `อัตราความสำเร็จ - ${myApproved}/${myTotalSubmitted} (${successRate}%)`,
        icon: '🎯',
      },
    };
  }

  // ====================================
  // Costing Stats
  // ====================================

  private async getCostingStats(userId: string) {
    // นับ Price Requests สำหรับ Costing แยกตาม Workflow
    const [
      pendingCount,
      calculatingCount,
      pendingApprovalCount,
      completedThisWeek,
      dummyItemsAvailable,
      pendingBOQMapping,
    ] = await Promise.all([
      this.priceRequestRepo.count({ where: { status: 'Pending' } }),
      this.priceRequestRepo.count({ where: { status: 'Calculating' } }),
      this.priceRequestRepo.count({ where: { status: 'Pending Approval' } }),
      this.priceRequestRepo.count({
        where: {
          status: 'Approved',
          approvedAt: MoreThan(this.getStartOfWeek()),
        },
      }),
      this.productRepo.count({ where: { itemStatus: 'AVAILABLE' } }),
      this.productRepo.count({
        where: {
          itemStatus: 'IN_USE',
          awaitingD365Creation: true,
        },
      }),
    ]);

    return {
      pendingRequests: {
        count: pendingCount,
        label: 'Pending - รอคำนวณ',
        icon: '📤',
      },
      calculatingRequests: {
        count: calculatingCount,
        label: 'Calculating - กำลังทำ',
        icon: '🧮',
      },
      pendingApprovalRequests: {
        count: pendingApprovalCount,
        label: 'Pending Approval - รออนุมัติ',
        icon: '⏳',
      },
      completedThisWeek: {
        count: completedThisWeek,
        label: 'Approved - เสร็จแล้ว (สัปดาห์นี้)',
        icon: '✅',
      },
      dummyItemsAvailable: {
        count: dummyItemsAvailable,
        label: 'Dummy Items - พร้อมใช้',
        icon: '📦',
      },
      pendingBOQMapping: {
        count: pendingBOQMapping,
        label: 'BOQ Mapping - รอ map กับ D365',
        icon: '🔗',
      },
    };
  }

  // ====================================
  // Admin Tasks
  // ====================================

  private async getAdminTasks(limit: number) {
    const [masterDataTasks, priceRequestTasks] = await Promise.all([
      this.getPendingMasterDataApprovals(limit),
      this.getPendingPriceRequestApprovals(limit),
    ]);

    return [
      ...masterDataTasks.map((task) => ({
        ...task,
        type: 'master-data-approval',
      })),
      ...priceRequestTasks.map((task) => ({
        ...task,
        type: 'price-request-approval',
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private async getPendingMasterDataApprovals(limit: number) {
    // StandardPrice เป็น ExternalDataEntity (sync จาก MongoDB) ไม่มี approval workflow
    // ดังนั้นจะดึงเฉพาะ entities ที่เป็น VersionedEntity และมี status = 'Draft'
    const [fabCosts, factors, lmes, exRates, scrapAllowances] = await Promise.all([
      this.fabCostRepo.find({
        where: { status: 'Draft' },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.sellingFactorRepo.find({
        where: { status: 'Draft' },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.lmeRepo.find({
        where: { status: 'Draft' },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.exRateRepo.find({
        where: { status: 'Draft' },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.scrapAllowanceRepo.find({
        where: { status: 'Draft' },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);

    return [
      ...fabCosts.map((item) => ({
        id: item.id,
        entityType: 'fab-cost',
        title: `FAB Cost - ${item.itemGroupCode}`,
        description: item.description,
        version: item.version,
        changeReason: item.changeReason,
        createdBy: 'Admin', // TODO: Add proper user tracking
        createdAt: item.createdAt,
        newValue: `${item.price} ${item.currency}`,
        itemGroup: item.itemGroupCode,
      })),
      ...factors.map((item) => ({
        id: item.id,
        entityType: 'selling-factor',
        title: `Selling Factor - ${item.tubeSize}`,
        description: item.description,
        version: item.version,
        changeReason: item.changeReason,
        createdBy: 'Admin', // TODO: Add proper user tracking
        createdAt: item.createdAt,
        newValue: item.factor.toString(),
        tubeSize: item.tubeSize,
      })),
      ...lmes.map((item) => ({
        id: item.id,
        entityType: 'lme-price',
        title: `LME Price - ${item.itemGroupName}`,
        description: item.description,
        version: item.version,
        changeReason: item.changeReason,
        createdBy: 'Admin', // TODO: Add proper user tracking
        createdAt: item.createdAt,
        newValue: `${item.price} ${item.currency}`,
        itemGroup: item.itemGroupCode,
      })),
      ...exRates.map((item) => ({
        id: item.id,
        entityType: 'exchange-rate',
        title: `Exchange Rate - ${item.sourceCurrencyCode}/${item.destinationCurrencyCode}`,
        description: item.description,
        version: item.version,
        changeReason: item.changeReason,
        createdBy: 'Admin', // TODO: Add proper user tracking
        createdAt: item.createdAt,
        newValue: item.rate.toString(),
        currencyPair: `${item.sourceCurrencyCode}/${item.destinationCurrencyCode}`,
      })),
      ...scrapAllowances.map((item) => ({
        id: item.id,
        entityType: 'scrap-allowance',
        title: `Scrap Allowance - ${item.category}`,
        description: item.description,
        version: item.version,
        changeReason: item.changeReason,
        createdBy: 'Admin', // TODO: Add proper user tracking
        createdAt: item.createdAt,
        newValue: `${item.allowancePercentage}%`,
        category: item.category,
      })),
    ];
  }

  private async getPendingPriceRequestApprovals(limit: number) {
    const requests = await this.priceRequestRepo.find({
      where: { status: 'Pending Approval' },
      relations: ['customer', 'product'],
      order: { updatedAt: 'DESC' },
      take: limit,
    });

    return requests.map((req) => ({
      id: req.id,
      requestNumber: req.id,
      customerName: req.customer?.name || req.customerName || 'N/A',
      productName: req.product?.name || req.productName || 'N/A',
      totalPrice: req.calculationResult ? JSON.parse(req.calculationResult).totalPrice : 0,
      createdAt: req.createdAt,
    }));
  }

  // ====================================
  // Costing Tasks
  // ====================================

  private async getCostingTasks(limit: number) {
    const [calcTasks, mappingTasks] = await Promise.all([
      this.getPendingCalculations(limit),
      this.getPendingMappings(limit),
    ]);

    return [
      ...calcTasks.map((task) => ({
        ...task,
        type: 'price-calculation',
      })),
      ...mappingTasks.map((task) => ({
        ...task,
        type: 'dummy-mapping',
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private async getPendingCalculations(limit: number) {
    const requests = await this.priceRequestRepo.find({
      where: { status: In(['Pending', 'Calculating']) },
      relations: ['customer', 'product'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return requests.map((req) => ({
      id: req.id,
      requestNumber: req.id,
      customerName: req.customer?.name || req.customerName || 'N/A',
      productName: req.product?.name || req.productName || 'N/A',
      createdAt: req.createdAt,
    }));
  }

  private async getPendingMappings(limit: number) {
    const items = await this.productRepo.find({
      where: {
        itemStatus: 'IN_USE',
        awaitingD365Creation: true,
      },
      order: { mappedDate: 'DESC' },
      take: limit,
    });

    return items.map((item) => ({
      id: item.id,
      dummyId: item.id,
      name: item.name,
      customerPO: item.customerPO,
      createdAt: item.mappedDate || item.createdAt,
    }));
  }

  // ====================================
  // Sales Tasks
  // ====================================

  private async getSalesTasks(userId: string, limit: number) {
    const requests = await this.priceRequestRepo.find({
      where: {
        createdBy: userId,
        status: In(['Draft', 'Pending', 'Calculating']),
      },
      relations: ['customer', 'product'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return requests.map((req) => ({
      id: req.id,
      type: 'my-request',
      requestNumber: req.id,
      title: `${req.id} - ${req.product?.name || req.productName || 'N/A'}`,
      customerName: req.customer?.name || req.customerName || 'N/A',
      status: req.status,
      createdAt: req.createdAt,
    }));
  }

  // ====================================
  // Helper: Date Methods
  // ====================================

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

  // ====================================
  // Helper: Count Methods
  // ====================================

  private async countPendingMasterData(): Promise<number> {
    // StandardPrice เป็น ExternalDataEntity (sync จาก MongoDB) ไม่มี approval workflow
    // ดังนั้นจะนับเฉพาะ entities ที่เป็น VersionedEntity และมี status = 'Draft'
    const [fabCost, factor, lme, exRate, scrapAllowance] = await Promise.all([
      this.fabCostRepo.count({ where: { status: 'Draft' } }),
      this.sellingFactorRepo.count({ where: { status: 'Draft' } }),
      this.lmeRepo.count({ where: { status: 'Draft' } }),
      this.exRateRepo.count({ where: { status: 'Draft' } }),
      this.scrapAllowanceRepo.count({ where: { status: 'Draft' } }),
    ]);

    const total = fabCost + factor + lme + exRate + scrapAllowance;
    console.log(`[countPendingMasterData] Total: ${total} (fabCost: ${fabCost}, factor: ${factor}, lme: ${lme}, exRate: ${exRate}, scrap: ${scrapAllowance})`);

    return total;
  }

  // ====================================
  // Default Stats (Fallback)
  // ====================================

  private async getDefaultStats() {
    return {
      message: {
        count: 0,
        label: 'No stats available for this role',
        icon: '❓',
      },
    };
  }

  // ====================================
  // Task Detail
  // ====================================

  async getTaskDetail(taskId: string, type: string, entityType?: string) {
    console.log(`[DashboardService] Getting task detail: ${taskId}, type: ${type}, entityType: ${entityType}`);

    if (type === 'price-request-approval' || type === 'price-calculation' || type === 'my-request') {
      // Get price request details
      const request = await this.priceRequestRepo.findOne({
        where: { id: taskId },
        relations: ['customer', 'product', 'creator'],
      });

      if (!request) {
        throw new Error('Price request not found');
      }

      return {
        id: request.id,
        type: 'price-request',
        requestNumber: request.id,
        status: request.status,
        customerName: request.customer?.name || request.customerName || 'N/A',
        productName: request.product?.name || request.productName || 'N/A',
        calculationResult: request.calculationResult ? JSON.parse(request.calculationResult) : null,
        specialRequests: request.specialRequests ? JSON.parse(request.specialRequests) : null,
        createdBy: request.creator?.username || request.createdBy || 'Unknown',
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        approvedAt: request.approvedAt,
        approvedBy: request.approvedBy,
      };
    } else if (type === 'master-data-approval') {
      // Get master data details based on entityType
      return this.getMasterDataDetail(taskId, entityType);
    } else if (type === 'dummy-mapping') {
      // Get product dummy mapping details
      const product = await this.productRepo.findOne({
        where: { id: taskId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      return {
        id: product.id,
        type: 'product-mapping',
        productName: product.name,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    }

    throw new Error(`Unknown task type: ${type}`);
  }

  private async getMasterDataDetail(taskId: string, entityType?: string) {
    console.log(`[DashboardService] Getting master data detail: ${taskId}, entityType: ${entityType}`);

    switch (entityType) {
      case 'fab-cost': {
        const item = await this.fabCostRepo.findOne({ where: { id: taskId } });
        if (!item) throw new Error('FAB Cost not found');
        return {
          id: item.id,
          type: 'fab-cost',
          entityType: 'fab-cost',
          name: item.itemGroupCode,
          version: item.version,
          status: item.status,
          changeReason: item.changeReason,
          cost: item.price,
          effectiveDate: item.effectiveFrom,
          expiryDate: item.effectiveTo,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          approvedAt: item.approvedAt,
          approvedBy: item.approvedBy,
        };
      }

      case 'selling-factor': {
        const item = await this.sellingFactorRepo.findOne({ where: { id: taskId } });
        if (!item) throw new Error('Selling Factor not found');
        return {
          id: item.id,
          type: 'selling-factor',
          entityType: 'selling-factor',
          tubeSize: item.tubeSize,
          version: item.version,
          status: item.status,
          changeReason: item.changeReason,
          factor: item.factor,
          effectiveDate: item.effectiveFrom,
          expiryDate: item.effectiveTo,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          approvedAt: item.approvedAt,
          approvedBy: item.approvedBy,
        };
      }

      case 'lme-price': {
        const item = await this.lmeRepo.findOne({ where: { id: taskId } });
        if (!item) throw new Error('LME Price not found');
        return {
          id: item.id,
          type: 'lme-price',
          entityType: 'lme-price',
          itemGroupCode: item.itemGroupCode,
          itemGroupName: item.itemGroupName,
          version: item.version,
          status: item.status,
          changeReason: item.changeReason,
          price: item.price,
          priceUnit: 'THB/ton',
          effectiveDate: item.effectiveFrom,
          expiryDate: item.effectiveTo,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          approvedAt: item.approvedAt,
          approvedBy: item.approvedBy,
        };
      }

      case 'exchange-rate': {
        const item = await this.exRateRepo.findOne({ where: { id: taskId } });
        if (!item) throw new Error('Exchange Rate not found');
        return {
          id: item.id,
          type: 'exchange-rate',
          entityType: 'exchange-rate',
          sourceCurrencyCode: item.sourceCurrencyCode,
          destinationCurrencyCode: item.destinationCurrencyCode,
          version: item.version,
          status: item.status,
          changeReason: item.changeReason,
          rate: item.rate,
          effectiveDate: item.effectiveFrom,
          expiryDate: item.effectiveTo,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          approvedAt: item.approvedAt,
          approvedBy: item.approvedBy,
        };
      }

      case 'standard-price': {
        const item = await this.standardPriceRepo.findOne({
          where: { id: taskId },
          relations: ['rawMaterial'],
        });
        if (!item) throw new Error('Standard Price not found');
        return {
          id: item.id,
          type: 'standard-price',
          entityType: 'standard-price',
          rawMaterialId: item.rawMaterialId,
          rawMaterialName: item.rawMaterial?.name || 'N/A',
          price: item.price,
          priceUnit: 'THB',
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}
