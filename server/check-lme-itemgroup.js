const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: false,
});

async function checkLME() {
  await AppDataSource.initialize();

  console.log('\n📋 LME Master Data - Item Group Codes:\n');
  const lmeData = await AppDataSource.query(
    'SELECT id, itemGroupCode, price, currency, status FROM lme_master_data ORDER BY itemGroupCode'
  );

  lmeData.forEach(lme => {
    console.log(`  • ${lme.itemGroupCode} - ${lme.price} ${lme.currency} (${lme.status})`);
  });

  console.log('\n📦 FAB Costs - Item Groups:\n');
  const fabCosts = await AppDataSource.query(
    'SELECT id, itemGroup, costPerHour, currency, status FROM fab_costs ORDER BY itemGroup'
  );

  fabCosts.forEach(fc => {
    console.log(`  • ${fc.itemGroup} - ${fc.costPerHour} ${fc.currency}/hr (${fc.status})`);
  });

  console.log('\n🔍 Item Groups from D365:\n');
  const itemGroups = await AppDataSource.query(
    'SELECT code, name FROM d365_item_groups ORDER BY code'
  );

  itemGroups.forEach(ig => {
    console.log(`  • ${ig.code} - ${ig.name}`);
  });

  await AppDataSource.destroy();
}

checkLME().catch(console.error);
