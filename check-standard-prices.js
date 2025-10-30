const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './server/database.sqlite',
  synchronize: false,
});

async function checkStandardPrices() {
  await AppDataSource.initialize();

  console.log('\n=== Standard Prices ===');
  const prices = await AppDataSource.query(`
    SELECT
      sp.id,
      sp.rawMaterialId,
      sp.price,
      sp.currency,
      sp.isActive,
      sp.lastSyncedAt,
      rm.name as rawMaterialName
    FROM standard_prices sp
    LEFT JOIN raw_materials rm ON sp.rawMaterialId = rm.id
    LIMIT 20
  `);

  console.table(prices);
  console.log(`\nTotal: ${prices.length} records`);

  await AppDataSource.destroy();
}

checkStandardPrices().catch(console.error);
