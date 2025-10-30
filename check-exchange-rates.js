// Check Exchange Rate Master Data
const https = require('https');
const http = require('http');

const API_URL = 'http://localhost:3000';

function makeRequest(url, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => resolve(JSON.parse(responseData)));
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function checkExchangeRates() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await makeRequest(`${API_URL}/auth/login`, 'POST', {
      username: 'admin',
      password: 'admin'
    });
    const token = loginResponse.access_token;
    console.log('✅ Login successful!\n');

    // Fetch Exchange Rate Master Data
    console.log('📊 Fetching Exchange Rate Master Data...');
    const response = await makeRequest(`${API_URL}/api/data/exchange-rate-master-data`, 'GET', null, token);

    console.log('Response:', JSON.stringify(response, null, 2));
    const rates = response.data || response;
    console.log(`\nFound ${rates.length} Exchange Rate records\n`);

    // Group by customer group
    const generalRates = rates.filter(r => !r.customerGroupId || r.customerGroupId === null);
    const customerGroupRates = rates.filter(r => r.customerGroupId);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('General Exchange Rates (customerGroupId = null):');
    console.log('═══════════════════════════════════════════════════════════');
    generalRates.forEach(r => {
      console.log(`${r.sourceCurrencyCode} → ${r.destinationCurrencyCode}: ${r.rate}`);
      console.log(`  Status: ${r.status}, Active: ${r.isActive}, Version: ${r.version}`);
      console.log(`  CustomerGroupId: ${r.customerGroupId || 'null'}`);
      console.log('');
    });

    if (customerGroupRates.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('Customer Group Specific Exchange Rates:');
      console.log('═══════════════════════════════════════════════════════════');
      customerGroupRates.forEach(r => {
        console.log(`${r.sourceCurrencyCode} → ${r.destinationCurrencyCode}: ${r.rate}`);
        console.log(`  Status: ${r.status}, Active: ${r.isActive}, Version: ${r.version}`);
        console.log(`  CustomerGroupId: ${r.customerGroupId}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkExchangeRates();
