const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: false,
});

async function addSampleTubeSize() {
  await AppDataSource.initialize();

  console.log('🔧 Adding sample tubeSize data...');

  try {
    // ดูข้อมูล Product ที่มีอยู่
    const products = await AppDataSource.query('SELECT id, name, tubeSize FROM products LIMIT 5');
    console.log('\n📋 Current products:');
    console.table(products);

    // เพิ่มข้อมูล tubeSize ตัวอย่าง
    const sampleSizes = ['1/2 inch', '3/4 inch', '1 inch', '1-1/4 inch', '1-1/2 inch'];

    for (let i = 0; i < Math.min(products.length, sampleSizes.length); i++) {
      await AppDataSource.query(
        'UPDATE products SET tubeSize = ? WHERE id = ?',
        [sampleSizes[i], products[i].id]
      );
      console.log(`✅ Updated ${products[i].id} (${products[i].name}) → tubeSize: ${sampleSizes[i]}`);
    }

    // แสดงผลลัพธ์
    console.log('\n📋 Updated products:');
    const updated = await AppDataSource.query('SELECT id, name, tubeSize FROM products WHERE tubeSize IS NOT NULL');
    console.table(updated);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await AppDataSource.destroy();
}

addSampleTubeSize().catch(console.error);
