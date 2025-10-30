const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './server/database.sqlite',
  synchronize: false,
});

async function checkProducts() {
  await AppDataSource.initialize();

  const products = await AppDataSource.query('SELECT id, name, tubeSize FROM products LIMIT 10');

  console.log('\n=== Products with tubeSize ===');
  console.table(products);

  const withTubeSize = products.filter(p => p.tubeSize);
  const withoutTubeSize = products.filter(p => !p.tubeSize);

  console.log(`\n✅ Products with tubeSize: ${withTubeSize.length}`);
  console.log(`❌ Products without tubeSize: ${withoutTubeSize.length}`);

  await AppDataSource.destroy();
}

checkProducts().catch(console.error);
