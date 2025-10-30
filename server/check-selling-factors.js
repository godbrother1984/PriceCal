const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all(`
  SELECT
    version,
    patternName,
    patternCode,
    factor,
    status,
    createdBy,
    datetime(createdAt) as createdAt
  FROM selling_factors
  WHERE patternCode = 'PRM'
  ORDER BY version DESC, createdAt DESC
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('\n=== Selling Factors (PRM Pattern) ===\n');
  console.table(rows);

  const draftCount = rows.filter(r => r.status === 'Draft').length;
  const activeCount = rows.filter(r => r.status === 'Active').length;

  console.log(`\nSummary:`);
  console.log(`Total records: ${rows.length}`);
  console.log(`Draft: ${draftCount}`);
  console.log(`Active: ${activeCount}`);

  db.close();
});
