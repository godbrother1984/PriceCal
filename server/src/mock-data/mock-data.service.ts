// path: server/src/mock-data/mock-data.service.ts
// version: 2.3 (Data Consistency Fix)
// last-modified: 29 สิงหาคม 2568 14:40

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
    { 
      id: 'REQ-00125', 
      customerName: 'Thai Summit Group', 
      productName: 'TS-PART-001', 
      status: 'Approved' as const, 
      createdBy: 'Sales 01', 
      createdAt: '2024-08-28',
      costingBy: 'Pricer 01',
      formData: { customerId: 'CUST-001', customerName: 'Thai Summit Group', productId: 'FG-001', productName: 'TS-PART-001' },
      customerType: 'existing',
      productType: 'existing',
      boqItems: [],
      calculationResult: { basePrice: "1250.00", sellingFactor: 1.25, finalPrice: "1562.50", currency: "THB" },
    },
    { 
      id: 'REQ-00124', 
      customerName: 'Honda Automobile', 
      productName: 'HN-PART-245', 
      status: 'Pending' as const, 
      createdBy: 'Sales 02', 
      createdAt: '2024-08-27',
      costingBy: undefined,
      formData: { customerId: 'CUST-002', customerName: 'Honda Automobile', productId: 'FG-002', productName: 'HN-PART-245' },
      customerType: 'existing',
      productType: 'existing',
      boqItems: [],
      calculationResult: null,
    },
  ];

  private customerGroups = [
      { id: 'CG-DOM', name: 'Domestic', type: 'Domestic', description: 'ลูกค้าในประเทศ' },
      { id: 'CG-EXP', name: 'Export', type: 'Export', description: 'ลูกค้าต่างประเทศ' },
  ];
  
  private customerMappings = [
      { id: 'CM-001', customerId: 'CUST-001', customerName: 'Thai Summit Group', customerGroupId: 'CG-DOM' },
      { id: 'CM-002', customerId: 'CUST-002', customerName: 'Honda Automobile', customerGroupId: 'CG-DOM' },
      { id: 'CM-003', customerId: 'CUST-003', customerName: 'Toyota Motor', customerGroupId: 'CG-DOM' },
  ];
  
  private fabCosts = [
      { id: 'FC-001', customerGroupId: 'CG-DOM', costValue: 150, currency: 'THB' },
      { id: 'FC-002', customerGroupId: 'CG-EXP', costValue: 5, currency: 'USD' },
  ];
  
  private standardPrices = [
      { id: 'SP-001', rmId: 'RM-AL-01', price: 85, currency: 'THB' },
      { id: 'SP-002', rmId: 'RM-CU-02', price: 300, currency: 'THB' },
  ];
  
  private sellingFactors = [
      { id: 'SF-001', pattern: 'Default', factor: 1.25 },
  ];
  
  private lmePrices = [
      { id: 'LME-001', customerGroupId: 'CG-EXP', itemGroupCode: 'AL', price: 2200, currency: 'USD' },
  ];
  
  private exchangeRates = [
      { id: 'ER-001', customerGroupId: 'CG-EXP', sourceCurrency: 'USD', destinationCurrency: 'THB', rate: 36.5 },
  ];

  // --- Helper Methods ---
  private updateItem(collection: any[], id: string, dto: any) {
    const itemIndex = collection.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    const updatedItem = { ...collection[itemIndex], ...dto };
    collection[itemIndex] = updatedItem;
    return updatedItem;
  }
  private deleteItem(collection: any[], id: string) {
    const initialLength = collection.length;
    const newCollection = collection.filter(item => item.id !== id);
    if (newCollection.length === initialLength) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return newCollection;
  }

  // --- Price Requests ---
  findAllRequests() { 
    return this.priceRequests.map(({ id, customerName, productName, status, createdBy, createdAt, costingBy }) => ({
      id, customerName, productName, status, createdBy, createdAt, costingBy
    }));
  }
  findOneRequest(id: string) {
    const request = this.priceRequests.find(r => r.id === id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }
    return request;
  }
  addPriceRequest(requestDto: any) {
    const newId = `REQ-${String(Date.now()).slice(-5)}`;
    const newRequest = {
      id: newId,
      customerName: requestDto.formData.customerName || requestDto.formData.newCustomerName,
      productName: requestDto.formData.productName || requestDto.formData.newProductName,
      status: 'Pending' as const,
      createdBy: 'Current User', // Placeholder
      createdAt: new Date().toISOString().split('T')[0],
      ...requestDto,
    };
    this.priceRequests.unshift(newRequest);
    return newRequest;
  }
  updatePriceRequest(id: string, requestDto: any) {
    const requestIndex = this.priceRequests.findIndex(r => r.id === id);
    if (requestIndex === -1) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    const existingRequest = this.priceRequests[requestIndex];
    
    const updatedRequest = {
      ...existingRequest,
      ...requestDto,
      customerName: requestDto.formData.customerName || requestDto.formData.newCustomerName || existingRequest.customerName,
      productName: requestDto.formData.productName || requestDto.formData.newProductName || existingRequest.productName,
      id: id,
    };
    
    this.priceRequests[requestIndex] = updatedRequest;
    console.log('Updated Request:', updatedRequest);
    return updatedRequest;
  }

  // --- Master Data for Search ---
  findAllCustomers() { return this.customers; }
  findAllProducts() { return this.products; }
  findAllRawMaterials() { return this.rawMaterials; }

  // --- Customer Groups ---
  findAllCustomerGroups() { return this.customerGroups; }
  addCustomerGroup(groupDto: any) {
    const newGroup = { id: `CG-${Date.now()}`, ...groupDto };
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

