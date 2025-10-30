const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/data/selling-factors',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const factors = JSON.parse(data);
      const prmFactors = factors.filter(f => f.patternCode === 'PRM');

      console.log('\n=== API Response for PRM Selling Factors ===\n');
      console.table(prmFactors.map(f => ({
        version: f.version,
        patternName: f.patternName,
        patternCode: f.patternCode,
        factor: f.factor,
        status: f.status,
        createdBy: f.createdBy
      })));

      console.log(`\nTotal PRM factors returned by API: ${prmFactors.length}`);

    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
