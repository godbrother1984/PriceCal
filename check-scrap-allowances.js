const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './server/database.sqlite',
  synchronize: false,
});

async function checkScrapAllowances() {
  await AppDataSource.initialize();

  console.log('\n📋 Checking Scrap Allowance data...\n');

  const scrapAllowances = await AppDataSource.query(
    'SELECT id, itemGroupCode, itemGroupName, scrapPercentage, description, status, version FROM scrap_allowances ORDER BY itemGroupCode, version'
  );

  console.log(`Found ${scrapAllowances.length} Scrap Allowance records:\n`);
  scrapAllowances.forEach(sa => {
    console.log(`  • ${sa.itemGroupCode} - ${sa.itemGroupName}: ${(sa.scrapPercentage * 100).toFixed(2)}% (v${sa.version}, ${sa.status})`);
    console.log(`    Description: ${sa.description || 'N/A'}`);
  });

  await AppDataSource.destroy();
}

checkScrapAllowances().catch(console.error);
