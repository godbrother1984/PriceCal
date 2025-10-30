const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: false,
});

async function seedSampleData() {
  await AppDataSource.initialize();

  console.log('🌱 Seeding sample data...\n');

  try {
    // ==================== 1. Finished Goods (Products) ====================
    console.log('📦 Adding Finished Goods (Products)...');

    const fgData = [
      { id: 'FG-001', name: 'Copper Tube A-Grade 1/2"', description: 'High quality copper tube', category: 'Copper Tubes', unit: 'meter', tubeSize: '1/2 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-002', name: 'Copper Tube A-Grade 3/4"', description: 'High quality copper tube', category: 'Copper Tubes', unit: 'meter', tubeSize: '3/4 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-003', name: 'Copper Tube A-Grade 1"', description: 'High quality copper tube', category: 'Copper Tubes', unit: 'meter', tubeSize: '1 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-004', name: 'Copper Tube B-Grade 1/2"', description: 'Standard copper tube', category: 'Copper Tubes', unit: 'meter', tubeSize: '1/2 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-005', name: 'Copper Tube B-Grade 3/4"', description: 'Standard copper tube', category: 'Copper Tubes', unit: 'meter', tubeSize: '3/4 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-006', name: 'Brass Tube Premium 1"', description: 'Premium brass tube', category: 'Brass Tubes', unit: 'meter', tubeSize: '1 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-007', name: 'Brass Tube Premium 1-1/4"', description: 'Premium brass tube', category: 'Brass Tubes', unit: 'meter', tubeSize: '1-1/4 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-008', name: 'Brass Tube Standard 1-1/2"', description: 'Standard brass tube', category: 'Brass Tubes', unit: 'meter', tubeSize: '1-1/2 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-009', name: 'Aluminum Tube Light 1/2"', description: 'Lightweight aluminum tube', category: 'Aluminum Tubes', unit: 'meter', tubeSize: '1/2 inch', productSource: 'D365', hasBOQ: true, isActive: true },
      { id: 'FG-010', name: 'Aluminum Tube Heavy 3/4"', description: 'Heavy duty aluminum tube', category: 'Aluminum Tubes', unit: 'meter', tubeSize: '3/4 inch', productSource: 'D365', hasBOQ: true, isActive: true },
    ];

    for (const fg of fgData) {
      const exists = await AppDataSource.query('SELECT id FROM products WHERE id = ?', [fg.id]);
      if (exists.length === 0) {
        await AppDataSource.query(
          `INSERT INTO products (id, name, description, category, unit, tubeSize, productSource, hasBOQ, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [fg.id, fg.name, fg.description, fg.category, fg.unit, fg.tubeSize, fg.productSource, fg.hasBOQ ? 1 : 0, fg.isActive ? 1 : 0]
        );
        console.log(`  ✅ ${fg.id} - ${fg.name}`);
      }
    }

    // ==================== 2. Raw Materials ====================
    console.log('\n🔩 Adding Raw Materials...');

    const rmData = [
      { id: 'RM-CU-001', name: 'Copper Sheet 99.9%', unit: 'kg', category: 'Copper', itemGroupCode: 'COPPER', description: 'Pure copper sheet', isActive: true },
      { id: 'RM-CU-002', name: 'Copper Wire 99.5%', unit: 'kg', category: 'Copper', itemGroupCode: 'COPPER', description: 'High purity copper wire', isActive: true },
      { id: 'RM-CU-003', name: 'Copper Scrap Recycled', unit: 'kg', category: 'Copper', itemGroupCode: 'COPPER', description: 'Recycled copper material', isActive: true },
      { id: 'RM-BR-001', name: 'Brass Alloy C26000', unit: 'kg', category: 'Brass', itemGroupCode: 'BRASS', description: 'Cartridge brass 70/30', isActive: true },
      { id: 'RM-BR-002', name: 'Brass Alloy C36000', unit: 'kg', category: 'Brass', itemGroupCode: 'BRASS', description: 'Free-cutting brass', isActive: true },
      { id: 'RM-AL-001', name: 'Aluminum 6061-T6', unit: 'kg', category: 'Aluminum', itemGroupCode: 'ALUMINUM', description: 'Structural aluminum alloy', isActive: true },
      { id: 'RM-AL-002', name: 'Aluminum 7075-T6', unit: 'kg', category: 'Aluminum', itemGroupCode: 'ALUMINUM', description: 'High strength aluminum', isActive: true },
      { id: 'RM-ST-001', name: 'Stainless Steel 304', unit: 'kg', category: 'Steel', itemGroupCode: 'STEEL', description: 'Standard stainless steel', isActive: true },
      { id: 'RM-ST-002', name: 'Stainless Steel 316', unit: 'kg', category: 'Steel', itemGroupCode: 'STEEL', description: 'Marine grade stainless', isActive: true },
      { id: 'RM-ZN-001', name: 'Zinc Coating Material', unit: 'kg', category: 'Coating', itemGroupCode: 'ZINC', description: 'Galvanizing material', isActive: true },
    ];

    for (const rm of rmData) {
      const exists = await AppDataSource.query('SELECT id FROM raw_materials WHERE id = ?', [rm.id]);
      if (exists.length === 0) {
        await AppDataSource.query(
          `INSERT INTO raw_materials (id, name, unit, category, itemGroupCode, description, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [rm.id, rm.name, rm.unit, rm.category, rm.itemGroupCode, rm.description, rm.isActive ? 1 : 0]
        );
        console.log(`  ✅ ${rm.id} - ${rm.name}`);
      }
    }

    // ==================== 3. Customers ====================
    console.log('\n👥 Adding Customers...');

    const customerData = [
      { id: 'CUST-001', name: 'ABC Manufacturing Co., Ltd.', address: '123 Industrial Road, Bangkok', contactPerson: 'John Smith', phone: '02-123-4567', email: 'john@abc.com', isActive: true },
      { id: 'CUST-002', name: 'XYZ Trading Company', address: '456 Business Avenue, Chonburi', contactPerson: 'Sarah Johnson', phone: '038-234-5678', email: 'sarah@xyz.com', isActive: true },
      { id: 'CUST-003', name: 'Global Exports Ltd.', address: '789 Export Zone, Samut Prakan', contactPerson: 'Michael Chen', phone: '02-345-6789', email: 'michael@global.com', isActive: true },
      { id: 'CUST-004', name: 'Thai Industrial Group', address: '321 Factory District, Rayong', contactPerson: 'Somchai Sukjai', phone: '038-456-7890', email: 'somchai@thai-ind.co.th', isActive: true },
      { id: 'CUST-005', name: 'Pacific Components Inc.', address: '654 Tech Park, Pathum Thani', contactPerson: 'Emily Wong', phone: '02-567-8901', email: 'emily@pacific.com', isActive: true },
      { id: 'CUST-006', name: 'Eastern Electronics Co.', address: '987 Silicon Valley, Chachoengsao', contactPerson: 'David Lee', phone: '038-678-9012', email: 'david@eastern.com', isActive: true },
      { id: 'CUST-007', name: 'Southeast Metalworks', address: '147 Metal District, Samut Sakhon', contactPerson: 'Nattapong Wongchai', phone: '034-789-0123', email: 'nattapong@southeast.co.th', isActive: true },
      { id: 'CUST-008', name: 'International Parts Supply', address: '258 Logistics Hub, Bangkok', contactPerson: 'Jennifer Park', phone: '02-890-1234', email: 'jennifer@ips.com', isActive: true },
    ];

    for (const cust of customerData) {
      const exists = await AppDataSource.query('SELECT id FROM customers WHERE id = ?', [cust.id]);
      if (exists.length === 0) {
        await AppDataSource.query(
          `INSERT INTO customers (id, name, address, contactPerson, phone, email, isActive, source, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'MongoDB', datetime('now'), datetime('now'))`,
          [cust.id, cust.name, cust.address, cust.contactPerson, cust.phone, cust.email, cust.isActive ? 1 : 0]
        );
        console.log(`  ✅ ${cust.id} - ${cust.name}`);
      }
    }

    // ==================== 4. Standard Prices ====================
    console.log('\n💰 Adding Standard Prices...');

    const standardPrices = [
      { rawMaterialId: 'RM-CU-001', price: 285.50, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-CU-002', price: 290.75, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-CU-003', price: 265.00, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-BR-001', price: 195.50, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-BR-002', price: 205.25, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-AL-001', price: 125.00, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-AL-002', price: 145.50, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-ST-001', price: 95.75, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-ST-002', price: 115.50, currency: 'THB', version: 1, status: 'Active' },
      { rawMaterialId: 'RM-ZN-001', price: 85.00, currency: 'THB', version: 1, status: 'Active' },
    ];

    for (const sp of standardPrices) {
      const exists = await AppDataSource.query(
        'SELECT id FROM standard_prices WHERE rawMaterialId = ? AND isActive = 1',
        [sp.rawMaterialId]
      );
      if (exists.length === 0) {
        await AppDataSource.query(
          `INSERT INTO standard_prices (id, rawMaterialId, price, currency, isActive, createdAt, updatedAt)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          [sp.rawMaterialId, sp.price, sp.currency]
        );
        console.log(`  ✅ ${sp.rawMaterialId} - ${sp.price} ${sp.currency}/kg`);
      }
    }

    // ==================== สรุป ====================
    console.log('\n📊 Summary:');
    const fgCount = await AppDataSource.query('SELECT COUNT(*) as count FROM products');
    const rmCount = await AppDataSource.query('SELECT COUNT(*) as count FROM raw_materials');
    const custCount = await AppDataSource.query('SELECT COUNT(*) as count FROM customers');
    const spCount = await AppDataSource.query('SELECT COUNT(*) as count FROM standard_prices WHERE isActive = 1');

    console.log(`  • Products (FG): ${fgCount[0].count}`);
    console.log(`  • Raw Materials: ${rmCount[0].count}`);
    console.log(`  • Customers: ${custCount[0].count}`);
    console.log(`  • Standard Prices (Active): ${spCount[0].count}`);

    console.log('\n✅ Sample data seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }

  await AppDataSource.destroy();
}

seedSampleData().catch(console.error);
