import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class MockDataService {
  
  private customers = [
    { id: 'CUST-001', name: 'Thai Summit Group' },
    { id: 'CUST-002', name: 'Honda Automobile' },
    { id: 'CUST-003', name: 'Toyota Motor' },
  ];

  private products = [
    { id: 'FG-001', name: 'TS-PART-001' },
    { id: 'FG-002', name: 'HN-PART-245' },
    { id: 'FG-003', name: 'TY-PART-889' },
  ];
  
  private rawMaterials = [
    { id: 'RM-AL-01', name: 'Aluminum Sheet 1.2mm', unit: 'kg' },
    { id: 'RM-CU-02', name: 'Copper Wire 0.5mm', unit: 'm' },
    { id: 'RM-ST-03', name: 'Steel Coil 2.0mm', unit: 'kg' },
    { id: 'RM-PC-04', name: 'Polycarbonate Pellet', unit: 'kg' },
  ];
  
  private priceRequests = [
    { id: 'REQ-00125', customerName: 'Thai Summit Group', productName: 'TS-PART-001', status: 'Approved' as const, createdBy: 'Somchai Jaidee', createdAt: '2025-08-28', costingBy: 'Costing A' },
    { id: 'REQ-00124', customerName: 'Honda Automobile', productName: 'HN-PART-245 (New)', status: 'Pending' as const, createdBy: 'Thanawat K.', createdAt: '2025-08-27', costingBy: undefined },
    { id: 'REQ-00123', customerName: 'Toyota Motor', productName: 'TY-PART-889', status: 'Rejected' as const, createdBy: 'Somchai Jaidee', createdAt: '2025-08-26', costingBy: 'Costing B' },
  ];

  private customerGroups = [
    { id: 'CG-001', name: 'Default', type: 'Default', description: 'กลุ่มราคามาตรฐานสำหรับลูกค้าทั่วไป' },
    { id: 'CG-002', name: 'ALL', type: 'All', description: 'กลุ่มราคาสำหรับวัตถุดิบทั่วไป' },
    { id: 'CG-003', name: 'Automotive A', type: 'Standard', description: 'กลุ่มลูกค้ายานยนต์ Tier 1' },
    { id: 'CG-004', name: 'Electronics B', type: 'Standard', description: 'กลุ่มลูกค้าเครื่องใช้ไฟฟ้า' },
  ];

  private customerMappings = [
      { id: 'CM-001', customerId: 'CUST-001', customerName: 'Thai Summit Group', customerGroupId: 'CG-003' },
      { id: 'CM-002', customerId: 'CUST-003', customerName: 'Toyota Motor', customerGroupId: 'CG-003' },
  ];

  private fabCosts = [
      { id: 'FC-001', customerGroupId: 'CG-003', costValue: 150.75, currency: 'THB' },
      { id: 'FC-002', customerGroupId: 'CG-004', costValue: 175.00, currency: 'THB' },
      { id: 'FC-003', customerGroupId: 'CG-001', costValue: 210.50, currency: 'THB' },
  ];

  private standardPrices = [
      { id: 'SP-001', rmId: 'RM-AL-01', customerGroupId: 'CG-003', price: 120.50, currency: 'USD' },
      { id: 'SP-002', rmId: 'RM-CU-02', customerGroupId: 'CG-003', price: 250.00, currency: 'USD' },
  ];

  private sellingFactors = [
      { id: 'SF-001', pattern: 'Pattern A', factor: 1.25 },
      { id: 'SF-002', pattern: 'Pattern B', factor: 1.35 },
  ];

  private lmePrices = [
      { id: 'LME-001', customerGroupId: 'CG-002', itemGroupCode: 'AL', price: 2200.50, currency: 'USD' },
      { id: 'LME-002', customerGroupId: 'CG-002', itemGroupCode: 'CU', price: 8500.00, currency: 'USD' },
  ];

  private exchangeRates = [
      { id: 'ER-001', customerGroupId: 'CG-002', currencyPair: 'USD-THB', rate: 36.55 },
      { id: 'ER-002', customerGroupId: 'CG-002', currencyPair: 'JPY-THB', rate: 0.25 },
      { id: 'ER-003', customerGroupId: 'CG-003', currencyPair: 'USD-THB', rate: 36.50 },
  ];

  // --- Generic update and delete logic ---
  private updateItem(collection: any[], id: string, itemDto: any) {
    const itemIndex = collection.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new NotFoundException(`Item with ID ${id} not found.`);
    }
    const { id: dtoId, ...updateData } = itemDto;
    collection[itemIndex] = { ...collection[itemIndex], ...updateData };
    return collection[itemIndex];
  }

  private deleteItem(collection: any[], id: string) {
    const initialLength = collection.length;
    const updatedCollection = collection.filter(item => item.id !== id);
    if (collection.length === initialLength) {
        throw new NotFoundException(`Item with ID ${id} not found.`);
    }
    return updatedCollection; 
  }

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
      costingBy: undefined,
    };
    this.priceRequests.unshift(newRequest);
    return newRequest;
  }

  // --- Master Data for Search ---
  findAllCustomers() { return this.customers; }
  findAllProducts() { return this.products; }
  findAllRawMaterials() { return this.rawMaterials; }

  // --- Customer Groups ---
  findAllCustomerGroups() { return this.customerGroups; }
  addCustomerGroup(group: any) {
    const newGroup = { id: `CG-${Date.now()}`, ...group };
    this.customerGroups.push(newGroup);
    return newGroup;
  }
  updateCustomerGroup(id: string, groupDto: any) {
    return this.updateItem(this.customerGroups, id, groupDto);
  }
  deleteCustomerGroup(id: string) {
    this.customerGroups = this.deleteItem(this.customerGroups, id);
    return { message: `Deleted group with ID ${id}` };
  }

  // --- Customer Mappings ---
  findAllCustomerMappings() { return this.customerMappings; }
  addCustomerMapping(mapping: any) {
    const newMapping = { id: `CM-${Date.now()}`, ...mapping };
    this.customerMappings.push(newMapping);
    return newMapping;
  }
  updateCustomerMapping(id: string, mappingDto: any) {
    return this.updateItem(this.customerMappings, id, mappingDto);
  }
  deleteCustomerMapping(id: string) {
    this.customerMappings = this.deleteItem(this.customerMappings, id);
    return { message: `Deleted mapping with ID ${id}` };
  }

  // --- Fab Costs ---
  findAllFabCosts() { return this.fabCosts; }
  addFabCost(cost: any) {
    const newCost = { id: `FC-${Date.now()}`, ...cost };
    this.fabCosts.push(newCost);
    return newCost;
  }
  updateFabCost(id: string, costDto: any) {
    return this.updateItem(this.fabCosts, id, costDto);
  }
  deleteFabCost(id: string) {
    this.fabCosts = this.deleteItem(this.fabCosts, id);
    return { message: `Deleted fab cost with ID ${id}` };
  }
  
  // --- Standard Prices ---
  findAllStandardPrices() { return this.standardPrices; }
  
  // --- Selling Factors ---
  findAllSellingFactors() { return this.sellingFactors; }

  // --- LME Prices ---
  findAllLmePrices() { return this.lmePrices; }

  // --- Exchange Rates ---
  findAllExchangeRates() { return this.exchangeRates; }
  addExchangeRate(rate: any) {
    const newRate = { id: `ER-${Date.now()}`, ...rate };
    this.exchangeRates.push(newRate);
    return newRate;
  }
  updateExchangeRate(id: string, rateDto: any) {
    return this.updateItem(this.exchangeRates, id, rateDto);
  }
  deleteExchangeRate(id: string) {
    this.exchangeRates = this.deleteItem(this.exchangeRates, id);
    return { message: `Deleted exchange rate with ID ${id}` };
  }
}
