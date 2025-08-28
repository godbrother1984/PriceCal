import { Injectable } from '@nestjs/common';

@Injectable()
export class MockDataService {
  
  private readonly customers = [
    { id: 'CUST-001', name: 'Thai Summit Group' },
    { id: 'CUST-002', name: 'Honda Automobile' },
    { id: 'CUST-003', name: 'Toyota Motor' },
  ];

  private readonly products = [
    { id: 'FG-001', name: 'TS-PART-001' },
    { id: 'FG-002', name: 'HN-PART-245' },
    { id: 'FG-003', name: 'TY-PART-889' },
  ];
  
  private readonly rawMaterials = [
    { id: 'RM-AL-01', name: 'Aluminum Sheet 1.2mm', unit: 'kg' },
    { id: 'RM-CU-02', name: 'Copper Wire 0.5mm', unit: 'm' },
    { id: 'RM-ST-03', name: 'Steel Coil 2.0mm', unit: 'kg' },
    { id: 'RM-PC-04', name: 'Polycarbonate Pellet', unit: 'kg' },
  ];
  
  private priceRequests = [
    { id: 'REQ-00125', customerName: 'Thai Summit Group', productName: 'TS-PART-001', status: 'Approved' as const, createdBy: 'Somchai Jaidee', createdAt: '2025-08-28' },
    { id: 'REQ-00124', customerName: 'Honda Automobile', productName: 'HN-PART-245 (New)', status: 'Pending' as const, createdBy: 'Thanawat K.', createdAt: '2025-08-27' },
  ];

  private customerGroups = [
    { id: 'CG-001', name: 'Default', type: 'Default', description: 'กลุ่มราคามาตรฐานสำหรับลูกค้าทั่วไป' },
    { id: 'CG-002', name: 'ALL', type: 'All', description: 'กลุ่มราคาสำหรับวัตถุดิบทั่วไป' },
    { id: 'CG-003', name: 'Automotive A', type: 'Standard', description: 'กลุ่มลูกค้ายานยนต์ Tier 1' },
  ];

  private customerMappings = [
      { id: 'CM-001', customerId: 'CUST-001', customerName: 'Thai Summit Group', customerGroupId: 'CG-003' },
  ];

  private fabCosts = [
      { id: 'FC-001', customerGroupId: 'CG-003', costValue: 150.75, currency: 'THB' },
  ];

  private standardPrices = [
      { id: 'SP-001', rmId: 'RM-AL-01', customerGroupId: 'CG-003', price: 120.50, currency: 'USD' },
  ];

  private sellingFactors = [
      { id: 'SF-001', pattern: 'Pattern A', factor: 1.25 },
  ];

  private lmePrices = [
      { id: 'LME-001', itemGroupCode: 'AL', price: 2200.50, currency: 'USD' },
  ];

  private exchangeRates = [
      { id: 'ER-001', currencyPair: 'USD-THB', rate: 36.55 },
  ];


  // --- Price Requests ---
  findAllRequests() { return this.priceRequests; }
  addPriceRequest(requestData: any) {
    const newRequest = {
      id: `REQ-${Date.now().toString().slice(-5)}`,
      customerName: requestData.formData.newCustomerName || requestData.formData.customerName,
      productName: requestData.formData.newProductName || requestData.formData.productName,
      status: 'Pending' as const,
      createdBy: 'Current User',
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.priceRequests.unshift(newRequest);
    return newRequest;
  }

  // --- Master Data for Search ---
  findAllCustomers() { return this.customers; }
  findAllProducts() { return this.products; }
  findAllRawMaterials() { return this.rawMaterials; }

  // --- Master Data for Management Pages ---
  findAllCustomerGroups() { return this.customerGroups; }
  findAllCustomerMappings() { return this.customerMappings; }
  findAllFabCosts() { return this.fabCosts; }
  findAllStandardPrices() { return this.standardPrices; }
  findAllSellingFactors() { return this.sellingFactors; }
  findAllLmePrices() { return this.lmePrices; }
  findAllExchangeRates() { return this.exchangeRates; }
}
