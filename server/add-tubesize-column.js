const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: false,
});

async function addTubeSizeColumn() {
  await AppDataSource.initialize();

  console.log('🔧 Adding tubeSize column to products table...');

  try {
    // ตรวจสอบว่ามี column อยู่แล้วหรือไม่
    const columns = await AppDataSource.query("PRAGMA table_info(products)");
    const hasTubeSize = columns.some(col => col.name === 'tubeSize');

    if (hasTubeSize) {
      console.log('✅ tubeSize column already exists!');
    } else {
      await AppDataSource.query('ALTER TABLE products ADD COLUMN tubeSize VARCHAR');
      console.log('✅ tubeSize column added successfully!');
    }

    // แสดงโครงสร้างตาราง
    console.log('\n📋 Current products table structure:');
    const tableInfo = await AppDataSource.query("PRAGMA table_info(products)");
    console.table(tableInfo.map(col => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0 ? 'YES' : 'NO',
      default: col.dflt_value
    })));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await AppDataSource.destroy();
}

addTubeSizeColumn().catch(console.error);
