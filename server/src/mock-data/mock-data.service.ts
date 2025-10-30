// path: server/src/mock-data/mock-data.service.ts
// version: 3.0 (Complete with Currencies Support)
// last-modified: 1 กันยายน 2568

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

  // --- D365 Mock Data ---
  private d365RawMaterials = [
    { id: 'RM-AL-01', name: 'Aluminum Sheet 1.2mm', description: 'High grade aluminum for automotive parts' },
    { id: 'RM-CU-02', name: 'Copper Wire 0.5mm', description: 'Pure copper wire for electrical components' },
    { id: 'RM-ST-03', name: 'Steel Coil 2.0mm', description: 'Cold rolled steel coil for stamping' },
    { id: 'RM-PC-04', name: 'Polycarbonate Pellet', description: 'Engineering grade plastic pellets' },
    { id: 'RM-AL-05', name: 'Aluminum Rod 10mm', description: 'Aluminum rod for machining' },
    { id: 'RM-ST-06', name: 'Stainless Steel 304', description: 'Corrosion resistant steel' },
  ];

  private d365FabPatterns = [
    { id: 'FAB-STAMP', name: 'Stamping', description: 'Metal stamping process' },
    { id: 'FAB-CAST', name: 'Casting', description: 'Metal casting process' },
    { id: 'FAB-MACH', name: 'Machining', description: 'CNC machining process' },
    { id: 'FAB-WELD', name: 'Welding', description: 'Metal welding process' },
    { id: 'FAB-ASSY', name: 'Assembly', description: 'Parts assembly process' },
  ];

  private d365ItemGroups = [
    { id: 'IG-ALU', name: 'Aluminum', description: 'Aluminum based materials' },
    { id: 'IG-STL', name: 'Steel', description: 'Steel based materials' },
    { id: 'IG-COP', name: 'Copper', description: 'Copper based materials' },
    { id: 'IG-PLS', name: 'Plastic', description: 'Plastic materials' },
    { id: 'IG-ELC', name: 'Electronic', description: 'Electronic components' },
  ];

  // --- Currencies ---
  private currencies = [
    {
      id: 'CUR-THB',
      code: 'THB',
      name: 'Thai Baht',
      symbol: '฿',
      isActive: true,
      ...this.addAuditFields({})
    },
    {
      id: 'CUR-USD',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      isActive: true,
      ...this.addAuditFields({})
    },
    {
      id: 'CUR-EUR',
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      isActive: true,
      ...this.addAuditFields({})
    },
    {
      id: 'CUR-JPY',
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      isActive: true,
      ...this.addAuditFields({})
    },
    {
      id: 'CUR-CNY',
      code: 'CNY',
      name: 'Chinese Yuan',
      symbol: '¥',
      isActive: true,
      ...this.addAuditFields({})
    },
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
      customerGroupName: 'Domestic',
      ...this.addAuditFields({})
    },
  ];

  private fabCosts = [
    {
      id: 'FC-001',
      customerGroupId: 'CG-DOM',
      customerGroupName: 'Domestic',
      costValue: 150.50,
      currency: 'THB',
      currencyName: 'Thai Baht',
      ...this.addAuditFields({})
    },
  ];

  private standardPrices = [
    {
      id: 'SP-001',
      rmId: 'RM-AL-01',
      rmName: 'Aluminum Sheet 1.2mm',
      price: 85.00,
      currency: 'THB',
      currencyName: 'Thai Baht',
      ...this.addAuditFields({})
    },
    {
      id: 'SP-002',
      rmId: 'RM-CU-02', 
      rmName: 'Copper Wire 0.5mm',
      price: 125.50,
      currency: 'THB',
      currencyName: 'Thai Baht',
      ...this.addAuditFields({})
    },
  ];

  private sellingFactors = [
    {
      id: 'SF-001',
      pattern: 'FAB-STAMP',
      patternName: 'Stamping',
      factor: 1.25,
      ...this.addAuditFields({})
    },
    {
      id: 'SF-002',
      pattern: 'FAB-CAST',
      patternName: 'Casting', 
      factor: 1.35,
      ...this.addAuditFields({})
    },
  ];

  private lmePrices = [
    {
      id: 'LME-001',
      customerGroupId: 'CG-DOM',
      customerGroupName: 'Domestic',
      itemGroupCode: 'IG-ALU',
      itemGroupName: 'Aluminum',
      price: 2850.00,
      currency: 'USD',
      currencyName: 'US Dollar',
      ...this.addAuditFields({})
    },
  ];

  private exchangeRates = [
    {
      id: 'ER-001',
      customerGroupId: 'CG-DOM',
      customerGroupName: 'Domestic',
      sourceCurrency: 'USD',
      sourceCurrencyName: 'US Dollar',
      destinationCurrency: 'THB',
      destinationCurrencyName: 'Thai Baht',
      rate: 35.50,
      ...this.addAuditFields({})
    },
  ];

  // Helper method for audit fields
  private addAuditFields(data: any) {
    const now = new Date().toISOString();
    return {
      ...data,
      createDate: now,
      createUser: 'system',
      modifyDate: now,
      modifyUser: 'system'
    };
  }

  // --- D365 Data Methods ---
  findAllD365RawMaterials() {
    return this.d365RawMaterials;
  }

  findAllD365FabPatterns() {
    return this.d365FabPatterns;
  }

  findAllD365ItemGroups() {
    return this.d365ItemGroups;
  }

  // --- Currencies Methods ---
  findAllCurrencies() {
    return this.currencies.filter(currency => currency.isActive);
  }

  addCurrency(currencyData: any) {
    const newCurrency = {
      id: `CUR-${String(Date.now()).slice(-5)}`,
      ...currencyData,
      isActive: currencyData.isActive === 'true',
      ...this.addAuditFields({})
    };
    
    this.currencies.push(newCurrency);
    return newCurrency;
  }

  updateCurrency(id: string, currencyData: any) {
    const index = this.currencies.findIndex(currency => currency.id === id);
    if (index === -1) {
      throw new NotFoundException(`Currency with ID "${id}" not found`);
    }

    this.currencies[index] = {
      ...this.currencies[index],
      ...currencyData,
      isActive: currencyData.isActive === 'true',
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.currencies[index];
  }

  deleteCurrency(id: string) {
    const index = this.currencies.findIndex(currency => currency.id === id);
    if (index === -1) {
      throw new NotFoundException(`Currency with ID "${id}" not found`);
    }
    
    // Soft delete - mark as inactive instead of removing
    this.currencies[index] = {
      ...this.currencies[index],
      isActive: false,
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return { message: `Currency "${this.currencies[index].name}" deactivated successfully` };
  }

  // --- Price Requests ---
  findAllRequests() {
    return this.priceRequests;
  }

  findOneRequest(id: string) {
    const request = this.priceRequests.find(req => req.id === id);
    if (!request) {
      throw new NotFoundException(`Price request with ID "${id}" not found`);
    }
    return request;
  }

  addPriceRequest(requestData: any) {
    const newRequest = {
      id: `REQ-${String(Date.now()).slice(-5)}`,
      ...requestData,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    // Auto-assign default group to new customers
    if (requestData.customerType === 'new' && requestData.formData?.newCustomerName) {
      // Find or create default customer group
      let defaultGroup = this.customerGroups.find(g => g.name === 'Default');
      if (!defaultGroup) {
        defaultGroup = {
          id: 'CG-DEFAULT',
          name: 'Default',
          type: 'Domestic',
          description: 'Default group for new customers',
          ...this.addAuditFields({})
        };
        this.customerGroups.push(defaultGroup);
      }
      
      // Create temporary customer entry
      const tempCustomerId = `TEMP-CUST-${String(Date.now()).slice(-5)}`;
      const tempCustomer = {
        id: tempCustomerId,
        name: requestData.formData.newCustomerName
      };
      this.customers.push(tempCustomer);
      
      // Create customer mapping to default group
      const newMapping = {
        id: `CM-${String(Date.now()).slice(-5)}`,
        customerId: tempCustomerId,
        customerName: requestData.formData.newCustomerName,
        customerGroupId: defaultGroup.id,
        customerGroupName: defaultGroup.name,
        ...this.addAuditFields({})
      };
      this.customerMappings.push(newMapping);
    }
    
    this.priceRequests.push(newRequest);
    return newRequest;
  }

  updatePriceRequest(id: string, requestData: any) {
    const index = this.priceRequests.findIndex(req => req.id === id);
    if (index === -1) {
      throw new NotFoundException(`Price request with ID "${id}" not found`);
    }
    this.priceRequests[index] = { ...this.priceRequests[index], ...requestData };
    return this.priceRequests[index];
  }

  findAllCustomers() {
    return this.customers;
  }

  findAllProducts() {
    return this.products;
  }

  findAllRawMaterials() {
    return this.rawMaterials;
  }

  // --- Customer Groups ---
  findAllCustomerGroups() {
    return this.customerGroups;
  }

  addCustomerGroup(groupData: any) {
    const newGroup = {
      id: `CG-${String(Date.now()).slice(-5)}`,
      ...groupData,
      ...this.addAuditFields({})
    };
    this.customerGroups.push(newGroup);
    return newGroup;
  }

  updateCustomerGroup(id: string, groupData: any) {
    const index = this.customerGroups.findIndex(group => group.id === id);
    if (index === -1) {
      throw new NotFoundException(`Customer group with ID "${id}" not found`);
    }
    
    this.customerGroups[index] = {
      ...this.customerGroups[index],
      ...groupData,
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.customerGroups[index];
  }

  deleteCustomerGroup(id: string) {
    const index = this.customerGroups.findIndex(group => group.id === id);
    if (index === -1) {
      throw new NotFoundException(`Customer group with ID "${id}" not found`);
    }
    
    const deletedGroup = this.customerGroups.splice(index, 1)[0];
    return { message: `Customer group "${deletedGroup.name}" deleted successfully` };
  }

  // --- Customer Mappings ---
  findAllCustomerMappings() {
    return this.customerMappings;
  }

  addCustomerMapping(mappingData: any) {
    const customer = this.customers.find(c => c.id === mappingData.customerId);
    const customerGroup = this.customerGroups.find(g => g.id === mappingData.customerGroupId);

    const newMapping = {
      id: `CM-${String(Date.now()).slice(-5)}`,
      ...mappingData,
      customerName: customer?.name || '',
      customerGroupName: customerGroup?.name || '',
      ...this.addAuditFields({})
    };
    
    this.customerMappings.push(newMapping);
    return newMapping;
  }

  updateCustomerMapping(id: string, mappingData: any) {
    const index = this.customerMappings.findIndex(mapping => mapping.id === id);
    if (index === -1) {
      throw new NotFoundException(`Customer mapping with ID "${id}" not found`);
    }

    const customer = this.customers.find(c => c.id === mappingData.customerId);
    const customerGroup = this.customerGroups.find(g => g.id === mappingData.customerGroupId);

    this.customerMappings[index] = {
      ...this.customerMappings[index],
      ...mappingData,
      customerName: customer?.name || '',
      customerGroupName: customerGroup?.name || '',
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.customerMappings[index];
  }

  deleteCustomerMapping(id: string) {
    const index = this.customerMappings.findIndex(mapping => mapping.id === id);
    if (index === -1) {
      throw new NotFoundException(`Customer mapping with ID "${id}" not found`);
    }
    
    const deletedMapping = this.customerMappings.splice(index, 1)[0];
    return { message: `Customer mapping for "${deletedMapping.customerName}" deleted successfully` };
  }

  // --- Fab Costs ---
  findAllFabCosts() {
    return this.fabCosts;
  }

  addFabCost(costData: any) {
    const customerGroup = this.customerGroups.find(g => g.id === costData.customerGroupId);
    const currency = this.currencies.find(c => c.id === costData.currency);
    
    const newCost = {
      id: `FC-${String(Date.now()).slice(-5)}`,
      ...costData,
      customerGroupName: customerGroup?.name || '',
      currencyName: currency?.name || '',
      ...this.addAuditFields({})
    };
    
    this.fabCosts.push(newCost);
    return newCost;
  }

  updateFabCost(id: string, costData: any) {
    const index = this.fabCosts.findIndex(cost => cost.id === id);
    if (index === -1) {
      throw new NotFoundException(`Fab cost with ID "${id}" not found`);
    }

    const customerGroup = this.customerGroups.find(g => g.id === costData.customerGroupId);
    const currency = this.currencies.find(c => c.id === costData.currency);

    this.fabCosts[index] = {
      ...this.fabCosts[index],
      ...costData,
      customerGroupName: customerGroup?.name || '',
      currencyName: currency?.name || '',
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.fabCosts[index];
  }

  deleteFabCost(id: string) {
    const index = this.fabCosts.findIndex(cost => cost.id === id);
    if (index === -1) {
      throw new NotFoundException(`Fab cost with ID "${id}" not found`);
    }
    
    const deletedCost = this.fabCosts.splice(index, 1)[0];
    return { message: `Fab cost deleted successfully` };
  }

  // --- Standard Prices ---
  findAllStandardPrices() {
    return this.standardPrices;
  }

  addStandardPrice(priceData: any) {
    const rawMaterial = this.d365RawMaterials.find(rm => rm.id === priceData.rmId);
    const currency = this.currencies.find(c => c.id === priceData.currency);
    
    const newPrice = {
      id: `SP-${String(Date.now()).slice(-5)}`,
      ...priceData,
      rmName: rawMaterial?.name || '',
      currencyName: currency?.name || '',
      ...this.addAuditFields({})
    };
    
    this.standardPrices.push(newPrice);
    return newPrice;
  }

  updateStandardPrice(id: string, priceData: any) {
    const index = this.standardPrices.findIndex(price => price.id === id);
    if (index === -1) {
      throw new NotFoundException(`Standard price with ID "${id}" not found`);
    }

    const rawMaterial = this.d365RawMaterials.find(rm => rm.id === priceData.rmId);
    const currency = this.currencies.find(c => c.id === priceData.currency);

    this.standardPrices[index] = {
      ...this.standardPrices[index],
      ...priceData,
      rmName: rawMaterial?.name || '',
      currencyName: currency?.name || '',
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.standardPrices[index];
  }

  deleteStandardPrice(id: string) {
    const index = this.standardPrices.findIndex(price => price.id === id);
    if (index === -1) {
      throw new NotFoundException(`Standard price with ID "${id}" not found`);
    }
    
    const deletedPrice = this.standardPrices.splice(index, 1)[0];
    return { message: `Standard price for "${deletedPrice.rmName}" deleted successfully` };
  }

  // --- Selling Factors ---
  findAllSellingFactors() {
    return this.sellingFactors;
  }

  addSellingFactor(factorData: any) {
    const fabPattern = this.d365FabPatterns.find(fp => fp.id === factorData.pattern);
    
    const newFactor = {
      id: `SF-${String(Date.now()).slice(-5)}`,
      ...factorData,
      patternName: fabPattern?.name || '',
      ...this.addAuditFields({})
    };
    
    this.sellingFactors.push(newFactor);
    return newFactor;
  }

  updateSellingFactor(id: string, factorData: any) {
    const index = this.sellingFactors.findIndex(factor => factor.id === id);
    if (index === -1) {
      throw new NotFoundException(`Selling factor with ID "${id}" not found`);
    }

    const fabPattern = this.d365FabPatterns.find(fp => fp.id === factorData.pattern);

    this.sellingFactors[index] = {
      ...this.sellingFactors[index],
      ...factorData,
      patternName: fabPattern?.name || '',
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.sellingFactors[index];
  }

  deleteSellingFactor(id: string) {
    const index = this.sellingFactors.findIndex(factor => factor.id === id);
    if (index === -1) {
      throw new NotFoundException(`Selling factor with ID "${id}" not found`);
    }
    
    const deletedFactor = this.sellingFactors.splice(index, 1)[0];
    return { message: `Selling factor for "${deletedFactor.patternName}" deleted successfully` };
  }

  // --- LME Prices ---
  findAllLmePrices() {
    return this.lmePrices;
  }

  addLmePrice(priceData: any) {
    const customerGroup = this.customerGroups.find(g => g.id === priceData.customerGroupId);
    const itemGroup = this.d365ItemGroups.find(ig => ig.id === priceData.itemGroupCode);
    const currency = this.currencies.find(c => c.id === priceData.currency);
    
    const newPrice = {
      id: `LME-${String(Date.now()).slice(-5)}`,
      ...priceData,
      customerGroupName: customerGroup?.name || '',
      itemGroupName: itemGroup?.name || '',
      currencyName: currency?.name || '',
      ...this.addAuditFields({})
    };
    
    this.lmePrices.push(newPrice);
    return newPrice;
  }

  updateLmePrice(id: string, priceData: any) {
    const index = this.lmePrices.findIndex(price => price.id === id);
    if (index === -1) {
      throw new NotFoundException(`LME price with ID "${id}" not found`);
    }

    const customerGroup = this.customerGroups.find(g => g.id === priceData.customerGroupId);
    const itemGroup = this.d365ItemGroups.find(ig => ig.id === priceData.itemGroupCode);
    const currency = this.currencies.find(c => c.id === priceData.currency);

    this.lmePrices[index] = {
      ...this.lmePrices[index],
      ...priceData,
      customerGroupName: customerGroup?.name || '',
      itemGroupName: itemGroup?.name || '',
      currencyName: currency?.name || '',
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.lmePrices[index];
  }

  deleteLmePrice(id: string) {
    const index = this.lmePrices.findIndex(price => price.id === id);
    if (index === -1) {
      throw new NotFoundException(`LME price with ID "${id}" not found`);
    }
    
    const deletedPrice = this.lmePrices.splice(index, 1)[0];
    return { message: `LME price deleted successfully` };
  }

  // --- Exchange Rates ---
  findAllExchangeRates() {
    return this.exchangeRates;
  }

  addExchangeRate(rateData: any) {
    const customerGroup = this.customerGroups.find(g => g.id === rateData.customerGroupId);
    const sourceCurrency = this.currencies.find(c => c.id === rateData.sourceCurrency);
    const destinationCurrency = this.currencies.find(c => c.id === rateData.destinationCurrency);
    
    const newRate = {
      id: `ER-${String(Date.now()).slice(-5)}`,
      ...rateData,
      customerGroupName: customerGroup?.name || '',
      sourceCurrencyName: sourceCurrency?.name || '',
      destinationCurrencyName: destinationCurrency?.name || '',
      ...this.addAuditFields({})
    };
    
    this.exchangeRates.push(newRate);
    return newRate;
  }

  updateExchangeRate(id: string, rateData: any) {
    const index = this.exchangeRates.findIndex(rate => rate.id === id);
    if (index === -1) {
      throw new NotFoundException(`Exchange rate with ID "${id}" not found`);
    }

    const customerGroup = this.customerGroups.find(g => g.id === rateData.customerGroupId);
    const sourceCurrency = this.currencies.find(c => c.id === rateData.sourceCurrency);
    const destinationCurrency = this.currencies.find(c => c.id === rateData.destinationCurrency);

    this.exchangeRates[index] = {
      ...this.exchangeRates[index],
      ...rateData,
      customerGroupName: customerGroup?.name || '',
      sourceCurrencyName: sourceCurrency?.name || '',
      destinationCurrencyName: destinationCurrency?.name || '',
      modifyDate: new Date().toISOString(),
      modifyUser: 'current-user'
    };
    
    return this.exchangeRates[index];
  }

  deleteExchangeRate(id: string) {
    const index = this.exchangeRates.findIndex(rate => rate.id === id);
    if (index === -1) {
      throw new NotFoundException(`Exchange rate with ID "${id}" not found`);
    }
    
    const deletedRate = this.exchangeRates.splice(index, 1)[0];
    return { message: `Exchange rate deleted successfully` };
  }
}
