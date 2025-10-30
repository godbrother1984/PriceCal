const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: false,
});

async function checkData() {
  await AppDataSource.initialize();

  console.log('\n📋 FAB Cost Data:\n');
  const fabCosts = await AppDataSource.query(
    'SELECT id, itemGroupName, itemGroupCode, costPerHour, currency, status FROM fab_costs ORDER BY itemGroupCode'
  );

  fabCosts.forEach(fc => {
    console.log(`  • ${fc.itemGroupCode} - ${fc.itemGroupName}: ${fc.costPerHour} ${fc.currency}/hr (${fc.status})`);
  });

  console.log('\n📋 LME Data:\n');
  const lmeData = await AppDataSource.query(
    'SELECT id, itemGroupName, itemGroupCode, price, currency, status FROM lme_master_data ORDER BY itemGroupCode'
  );

  lmeData.forEach(lme => {
    console.log(`  • ${lme.itemGroupCode} - ${lme.itemGroupName}: ${lme.price} ${lme.currency} (${lme.status})`);
  });

  await AppDataSource.destroy();
}

checkData().catch(console.error);
