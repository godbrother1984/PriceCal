import { Injectable } from '@nestjs/common';

// (Interfaces for Customer, Product, PriceRequest remain the same)

@Injectable()
export class MockDataService {
  // (customers, products, priceRequests arrays remain the same)
  
  private readonly customers = [
    { id: 'CUST-001', name: 'Thai Summit Group' },
    { id: 'CUST-002', name: 'Honda Automobile' },
  ];
  private readonly products = [
    { id: 'FG-001', name: 'TS-PART-001', drawingNo: 'D-TS-001' },
    { id: 'FG-002', name: 'HN-PART-245', drawingNo: 'D-HN-245' },
  ];
  private readonly priceRequests = [
    { id: 'REQ-00125', customerName: 'Thai Summit Group', productName: 'TS-PART-001', status: 'Approved', createdBy: 'Somchai Jaidee', createdAt: '2025-08-28' },
    { id: 'REQ-00124', customerName: 'Honda Automobile', productName: 'HN-PART-245 (New)', status: 'Pending', createdBy: 'Thanawat K.', createdAt: '2025-08-27' },
  ];

  findAllCustomers() { return this.customers; }
  findAllProducts() { return this.products; }
  findAllRequests() { return this.priceRequests; }
}