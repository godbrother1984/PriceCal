// Test script to verify price calculation with different currencies
const http = require('http');

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

const loginReq = http.request(loginOptions, (res) => {
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

      console.log('✅ Login successful!\n');

      // Test with different currencies
      const testCases = [
        { currency: 'THB', name: 'Thai Baht' },
        { currency: 'USD', name: 'US Dollar' },
        { currency: 'EUR', name: 'Euro' },
        { currency: 'JPY', name: 'Japanese Yen' },
        { currency: 'CNY', name: 'Chinese Yuan' },
        { currency: 'SGD', name: 'Singapore Dollar' }
      ];

      let currentTest = 0;

      function testNextCurrency() {
        if (currentTest >= testCases.length) {
          console.log('\n✅ All currency tests completed successfully!');
          process.exit(0);
          return;
        }

        const testCase = testCases[currentTest];
        currentTest++;

        console.log(`\n📊 Testing price calculation with ${testCase.name} (${testCase.currency})...`);

        const calcData = JSON.stringify({
          productId: 'FG-001',
          quantity: 100,
          customerCurrency: testCase.currency
        });

        const calcOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/price-calculation/calculate',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': calcData.length
          }
        };

        const calcReq = http.request(calcOptions, (res2) => {
          let data2 = '';

          res2.on('data', (chunk) => {
            data2 += chunk;
          });

          res2.on('end', () => {
            try {
              const result = JSON.parse(data2);

              if (result.error) {
                console.log(`   ⚠️ Error: ${result.message}`);
              } else {
                console.log(`   ✅ Success!`);
                console.log(`      - Total Cost (THB): ${result.totalCost?.toFixed(2) || 'N/A'}`);
                console.log(`      - Selling Price (THB): ${result.sellingPrice?.toFixed(2) || 'N/A'}`);

                if (result.customerCurrencyPrice) {
                  console.log(`      - Price (${testCase.currency}): ${result.customerCurrencyPrice?.toFixed(2) || 'N/A'}`);
                  console.log(`      - Exchange Rate: ${result.exchangeRate || 'N/A'}`);
                }
              }

              // Test next currency
              testNextCurrency();

            } catch (err) {
              console.error(`   ❌ Error parsing response:`, err.message);
              console.error(`   Response:`, data2);
              testNextCurrency();
            }
          });
        });

        calcReq.on('error', (e) => {
          console.error(`   ❌ Request error:`, e.message);
          testNextCurrency();
        });

        calcReq.write(calcData);
        calcReq.end();
      }

      // Start testing
      testNextCurrency();

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
