// Test Rollback on Archived Version
// This script will test rollback functionality on the existing Archived version

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3001;
let JWT_TOKEN = '';

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Login
async function login() {
  console.log('\n📝 Logging in...');
  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const postData = JSON.stringify({ username: 'admin', password: 'admin' });

  try {
    const response = await makeRequest(options, postData);
    if (response.statusCode === 200 || response.statusCode === 201) {
      JWT_TOKEN = response.data.access_token;
      console.log('✅ Login successful!');
      return true;
    } else {
      console.error('❌ Login failed:', response);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

// Test Rollback on specific Archived version
async function testRollback(archivedId) {
  console.log(`\n🔄 Testing Rollback on Archived version: ${archivedId}`);

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: `/api/data/selling-factors/${archivedId}/rollback`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  };

  const postData = JSON.stringify({ username: 'testuser' });

  try {
    const response = await makeRequest(options, postData);

    console.log('\n📊 Response Status:', response.statusCode);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('\n✅ Rollback successful!');
      return response.data;
    } else {
      console.log('\n❌ Rollback failed!');
      return null;
    }
  } catch (error) {
    console.error('❌ Rollback error:', error.message);
    return null;
  }
}

// Fetch all Selling Factors after rollback
async function fetchSellingFactors() {
  console.log('\n📋 Fetching all Selling Factors...');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/data/selling-factors',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  };

  try {
    const response = await makeRequest(options);

    if (response.statusCode === 200) {
      const factors = response.data;
      console.log(`✅ Found ${factors.length} Selling Factor records\n`);

      // Group by patternCode and show all versions
      const grouped = {};
      factors.forEach(f => {
        if (!grouped[f.patternCode]) grouped[f.patternCode] = [];
        grouped[f.patternCode].push(f);
      });

      Object.keys(grouped).forEach(code => {
        const versions = grouped[code];
        console.log(`\n📦 ${code} Pattern (${versions.length} versions):`);
        versions.forEach(v => {
          const emoji = v.status === 'Active' ? '🟢' : v.status === 'Draft' ? '🟡' : '⚫';
          console.log(`   ${emoji} v${v.version} | ${v.status} | Factor: ${v.factor}`);
        });
      });

      return factors;
    } else {
      console.error('❌ Failed to fetch selling factors:', response);
      return [];
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
    return [];
  }
}

// Main execution
async function runTest() {
  console.log('\n========================================');
  console.log('🧪 Testing Rollback on Archived Version');
  console.log('========================================');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without login. Exiting...');
    return;
  }

  // Step 2: Fetch current state (before rollback)
  console.log('\n--- BEFORE ROLLBACK ---');
  await fetchSellingFactors();

  // Step 3: Test Rollback on Archived version
  // Use the ID from previous test: c2e82bc4-b0db-4fb1-94ee-5eb22ec3aa9c (STD v3 Archived)
  const archivedId = 'c2e82bc4-b0db-4fb1-94ee-5eb22ec3aa9c';
  const result = await testRollback(archivedId);

  if (result) {
    // Step 4: Fetch updated state (after rollback)
    console.log('\n--- AFTER ROLLBACK ---');
    await fetchSellingFactors();
  }

  console.log('\n========================================');
  console.log('✅ Test Completed!');
  console.log('========================================\n');
}

// Run the test
runTest().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
