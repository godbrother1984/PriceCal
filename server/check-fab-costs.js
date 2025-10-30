const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  synchronize: false,
});

async function checkFabCosts() {
  await AppDataSource.initialize();

  console.log('\n📋 Checking FAB Cost data...\n');

  const fabCosts = await AppDataSource.query(
    'SELECT id, itemGroupCode, costPerHour, currency, status, version FROM fab_costs ORDER BY itemGroupCode, version'
  );

  console.log(`Found ${fabCosts.length} FAB Cost records:\n`);
  fabCosts.forEach(fc => {
    console.log(`  • ${fc.itemGroupCode} - ${fc.costPerHour} ${fc.currency}/hr (v${fc.version}, ${fc.status})`);
  });

  const rawMaterials = await AppDataSource.query(
    'SELECT id, name, itemGroupCode, itemGroup FROM raw_materials LIMIT 5'
  );

  console.log(`\n📦 Sample Raw Materials with itemGroupCode:\n`);
  rawMaterials.forEach(rm => {
    console.log(`  • ${rm.id} - ${rm.name} (${rm.itemGroupCode} - ${rm.itemGroup || 'N/A'})`);
  });

  await AppDataSource.destroy();
}

checkFabCosts().catch(console.error);
