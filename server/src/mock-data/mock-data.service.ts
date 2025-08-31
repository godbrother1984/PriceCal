// path: server/src/mock-data/mock-data.service.ts
// version: 2.4 (Audit Trail Enhancement)
// last-modified: 31 สิงหาคม 2568

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
    { 
      id: 'CG-DOM', 
      name: 'Domestic', 
      type: 'Domestic', 
      description: 'ลูกค้าในประเทศ',
      ...this.addAuditFields({})
    },
    { 
      id: 'CG-EXP', 
      name: 'Export', 
      type: 'Export', 
      description: 'ลูกค้าต่างประเทศ',
      ...this.addAuditFields({})
    },
  ];
  
  private customerMappings = [
    { 
      id: 'CM-001', 
      customerId: 'CUST-001', 
      customerName: 'Thai Summit Group', 
      customerGroupId: 'CG-DOM',
      ...this.addAuditFields({})
    },
    { 
      id: 'CM-002', 
      customerId: 'CUST-002', 
      customerName: 'Honda Automobile', 
      customerGroupId: 'CG-DOM',
      ...this.addAuditFields({})
    },
    { 
      id: 'CM-003', 
      customerId: 'CUST-003', 
      customerName: 'Toyota Motor', 
      customerGroupId: 'CG-DOM',
      ...this.addAuditFields({})
    },
  ];
  
  private fabCosts = [
    { 
      id: 'FC-001', 
      customerGroupId: 'CG-DOM', 
      costValue: 150, 
      currency: 'THB',
      ...this.addAuditFields({})
    },
    { 
      id: 'FC-002', 
      customerGroupId: 'CG-EXP', 
      costValue: 5, 
      currency: 'USD',
      ...this.addAuditFields({})
    },
  ];
  
  private standardPrices = [
    { 
      id: 'SP-001', 
      rmId: 'RM-AL-01', 
      price: 85, 
      currency: 'THB',
      ...this.addAuditFields({})
    },
    { 
      id: 'SP-002', 
      rmId: 'RM-CU-02', 
      price: 300, 
      currency: 'THB',
      ...this.addAuditFields({})
    },
  ];
  
  private sellingFactors = [
    { 
      id: 'SF-001', 
      pattern: 'Default', 
      factor: 1.25,
      ...this.addAuditFields({})
    },
  ];
  
  private lmePrices = [
    { 
      id: 'LME-001', 
      customerGroupId: 'CG-EXP', 
      itemGroupCode: 'AL', 
      price: 2200, 
      currency: 'USD',
      ...this.addAuditFields({})
    },
  ];
  
  private exchangeRates = [
    { 
      id: 'ER-001', 
      customerGroupId: 'CG-EXP', 
      sourceCurrency: 'USD', 
      destinationCurrency: 'THB', 
      rate: 36.5,
      ...this.addAuditFields({})
    },
  ];

  // --- Audit Trail Helper Methods ---
  private addAuditFields(data: any, isUpdate = false): any {
    const currentDate = new Date().toISOString();
    const currentUser = 'system'; // In real app, get from JWT token
    
    if (isUpdate) {
      return {
        ...data,
        modifyDate: currentDate,
        modifyUser: currentUser,
      };
    } else {
      return {
        ...data,
        createDate: currentDate,
        createUser: currentUser,
        modifyDate: currentDate,
        modifyUser: currentUser,
      };
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  }

  // --- Helper Methods ---
  private updateItem(collection: any[], id: string, dto: any) {
    const itemIndex = collection.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    
    const updatedItem = {
      ...collection[itemIndex],
      ...dto,
      ...this.addAuditFields(dto, true) // Add update audit fields
    };
    
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
    const newId = this.generateId('REQ');
    const newRequest = {
      id: newId,
      customerName: requestDto.formData.customerName || requestDto.formData.newCustomerName,
      productName: requestDto.formData.productName || requestDto.formData.newProductName,
      status: 'Pending' as const,
      createdBy: 'Current User', // Placeholder
      createdAt: new Date().toISOString().split('T')[0],
      ...requestDto,
      ...this.addAuditFields({})
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
      ...this.addAuditFields(requestDto, true)
    };
    
    this.priceRequests[requestIndex] = updatedRequest;
    console.log('[MockDataService] Updated Request:', updatedRequest.id);
    return updatedRequest;
  }

  // --- Master Data for Search ---
  findAllCustomers() { return this.customers; }
  findAllProducts() { return this.products; }
  findAllRawMaterials() { return this.rawMaterials; }

  // --- Customer Groups ---
  findAllCustomerGroups() { return this.customerGroups; }
  
  addCustomerGroup(groupDto: any) {
    const newGroup = {
      id: this.generateId('CG'),
      ...groupDto,
      ...this.addAuditFields({})
    };
    this.customerGroups.push(newGroup);
    console.log('[MockDataService] Created Customer Group:', newGroup.id);
    return newGroup;
  }

  updateCustomerGroup(id: string, groupDto: any) {
    const result = this.updateItem(this.customerGroups, id, groupDto);
    console.log('[MockDataService] Updated Customer Group:', id);
    return result;
  }

  deleteCustomerGroup(id: string) {
    this.customerGroups = this.deleteItem(this.customerGroups, id);
    console.log('[MockDataService] Deleted Customer Group:', id);
    return { message: `Deleted group with ID ${id}` };
  }

  // --- Customer Mappings ---
  findAllCustomerMappings() { return this.customerMappings; }
  
  addCustomerMapping(mapping: any) {
    const newMapping = {
      id: this.generateId('CM'),
      ...mapping,
      ...this.addAuditFields({})
    };
    this.customerMappings.push(newMapping);
    console.log('[MockDataService] Created Customer Mapping:', newMapping.id);
    return newMapping;
  }
  
  updateCustomerMapping(id: string, mappingDto: any) {
    const result = this.updateItem(this.customerMappings, id, mappingDto);
    console.log('[MockDataService] Updated Customer Mapping:', id);
    return result;
  }
  
  deleteCustomerMapping(id: string) {
    this.customerMappings = this.deleteItem(this.customerMappings, id);
    console.log('[MockDataService] Deleted Customer Mapping:', id);
    return { message: `Deleted mapping with ID ${id}` };
  }

  // --- Fab Costs ---
  findAllFabCosts() { return this.fabCosts; }
  
  addFabCost(cost: any) {
    const newCost = {
      id: this.generateId('FC'),
      ...cost,
      ...this.addAuditFields({})
    };
    this.fabCosts.push(newCost);
    console.log('[MockDataService] Created Fab Cost:', newCost.id);
    return newCost;
  }
  
  updateFabCost(id: string, costDto: any) {
    const result = this.updateItem(this.fabCosts, id, costDto);
    console.log('[MockDataService] Updated Fab Cost:', id);
    return result;
  }
  
  deleteFabCost(id: string) {
    this.fabCosts = this.deleteItem(this.fabCosts, id);
    console.log('[MockDataService] Deleted Fab Cost:', id);
    return { message: `Deleted fab cost with ID ${id}` };
  }
  
  // --- Other Masters ---
  findAllStandardPrices() { return this.standardPrices; }
  findAllSellingFactors() { return this.sellingFactors; }
  findAllLmePrices() { return this.lmePrices; }

  // --- Exchange Rates ---
  findAllExchangeRates() { return this.exchangeRates; }
  
  addExchangeRate(rate: any) {
    const newRate = {
      id: this.generateId('ER'),
      ...rate,
      ...this.addAuditFields({})
    };
    this.exchangeRates.push(newRate);
    console.log('[MockDataService] Created Exchange Rate:', newRate.id);
    return newRate;
  }
  
  updateExchangeRate(id: string, rateDto: any) {
    const result = this.updateItem(this.exchangeRates, id, rateDto);
    console.log('[MockDataService] Updated Exchange Rate:', id);
    return result;
  }
  
  deleteExchangeRate(id: string) {
    this.exchangeRates = this.deleteItem(this.exchangeRates, id);
    console.log('[MockDataService] Deleted Exchange Rate:', id);
    return { message: `Deleted exchange rate with ID ${id}` };
  }
}