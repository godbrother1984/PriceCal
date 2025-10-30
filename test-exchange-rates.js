// Test script to check Exchange Rate Master Data
const https = require('http');

// 1. Login
const loginData = JSON.stringify({
  username: 'admin',
  password: 'admin'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('🔐 Logging in...');

const loginReq = https.request(loginOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const token = response.access_token;

      if (!token) {
        console.error('❌ No token received:', data);
        process.exit(1);
      }

      console.log('✅ Login successful!');

      // 2. Fetch Exchange Rate Master Data
      const dataOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/data/exchange-rate-master-data',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('\n📊 Fetching Exchange Rate Master Data...');

      const dataReq = https.request(dataOptions, (res2) => {
        let data2 = '';

        res2.on('data', (chunk) => {
          data2 += chunk;
        });

        res2.on('end', () => {
          const rates = JSON.parse(data2);

          console.log(`\n✅ Found ${rates.length} Exchange Rate records:\n`);

          // Group by source currency
          const grouped = {};
          rates.forEach(rate => {
            if (!grouped[rate.sourceCurrencyCode]) {
              grouped[rate.sourceCurrencyCode] = [];
            }
            grouped[rate.sourceCurrencyCode].push(rate);
          });

          // Display grouped data
          Object.keys(grouped).sort().forEach(sourceCurrency => {
            console.log(`\n${sourceCurrency} →`);
            grouped[sourceCurrency].forEach(rate => {
              console.log(`  ${rate.destinationCurrencyCode}: ${rate.rate}`);
            });
          });

          // Check if we have all THB → other currencies
          const thbRates = grouped['THB'] || [];
          const requiredDestinations = ['USD', 'EUR', 'JPY', 'CNY', 'SGD'];
          const missingDestinations = requiredDestinations.filter(
            dest => !thbRates.find(r => r.destinationCurrencyCode === dest)
          );

          if (missingDestinations.length === 0) {
            console.log('\n✅ All required THB → (USD, EUR, JPY, CNY, SGD) rates are present!');
          } else {
            console.log(`\n⚠️ Missing THB rates for: ${missingDestinations.join(', ')}`);
          }

          process.exit(0);
        });
      });

      dataReq.on('error', (e) => {
        console.error('❌ Error fetching data:', e.message);
        process.exit(1);
      });

      dataReq.end();

    } catch (err) {
      console.error('❌ Error parsing login response:', err.message);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

loginReq.on('error', (e) => {
  console.error('❌ Login error:', e.message);
  process.exit(1);
});

loginReq.write(loginData);
loginReq.end();
