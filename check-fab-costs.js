const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './server/database.sqlite',
  synchronize: false,
});

async function checkFabCosts() {
  await AppDataSource.initialize();

  console.log('\n📋 Checking FAB Cost data...\n');

  const fabCosts = await AppDataSource.query(
    'SELECT id, itemGroup, costPerHour, currency, status, version FROM fab_costs ORDER BY itemGroup, version'
  );

  console.log(`Found ${fabCosts.length} FAB Cost records:\n`);
  fabCosts.forEach(fc => {
    console.log(`  • ${fc.itemGroup} - ${fc.costPerHour} ${fc.currency}/hr (v${fc.version}, ${fc.status})`);
  });

  const rawMaterials = await AppDataSource.query(
    'SELECT id, name, itemGroup FROM raw_materials LIMIT 5'
  );

  console.log(`\n📦 Sample Raw Materials with itemGroup:\n`);
  rawMaterials.forEach(rm => {
    console.log(`  • ${rm.id} - ${rm.name} (${rm.itemGroup || 'N/A'})`);
  });

  await AppDataSource.destroy();
}

checkFabCosts().catch(console.error);
