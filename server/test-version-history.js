// Test Version History and Rollback workflow
// This script will:
// 1. Login to get JWT token
// 2. Fetch Selling Factors data
// 3. Test Version History API
// 4. Test Rollback API (if Archived version exists)

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

// Step 1: Login
async function login() {
  console.log('\n========================================');
  console.log('Step 1: Login to get JWT token');
  console.log('========================================\n');

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
      console.log(`Token: ${JWT_TOKEN.substring(0, 50)}...`);
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

// Step 2: Fetch Selling Factors
async function fetchSellingFactors() {
  console.log('\n========================================');
  console.log('Step 2: Fetch Selling Factors');
  console.log('========================================\n');

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

      // Group by patternCode
      const grouped = {};
      factors.forEach(f => {
        if (!grouped[f.patternCode]) grouped[f.patternCode] = [];
        grouped[f.patternCode].push(f);
      });

      // Display grouped data
      Object.keys(grouped).forEach(code => {
        const versions = grouped[code];
        console.log(`📦 ${code} Pattern (${versions.length} versions):`);
        versions.forEach(v => {
          console.log(`   v${v.version} | Status: ${v.status} | Factor: ${v.factor} | ID: ${v.id}`);
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

// Step 3: Test Version History API
async function testVersionHistory(recordId, patternName) {
  console.log('\n========================================');
  console.log(`Step 3: Test Version History for ${patternName}`);
  console.log('========================================\n');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: `/api/data/selling-factors/history/${recordId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  };

  try {
    const response = await makeRequest(options);

    if (response.statusCode === 200) {
      const history = response.data;
      console.log(`✅ Version History API works! Found ${history.length} versions\n`);

      history.forEach(v => {
        console.log(`v${v.version} | ${v.status} | Factor: ${v.factor} | Created: ${v.createdAt}`);
        if (v.approvedBy) {
          console.log(`   └─ Approved by: ${v.approvedBy} at ${v.approvedAt}`);
        }
      });

      return history;
    } else {
      console.error('❌ Version History API failed:', response);
      return [];
    }
  } catch (error) {
    console.error('❌ Version History error:', error.message);
    return [];
  }
}

// Step 4: Test Rollback API (if Archived version exists)
async function testRollback(archivedRecordId, patternName) {
  console.log('\n========================================');
  console.log(`Step 4: Test Rollback for ${patternName}`);
  console.log('========================================\n');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: `/api/data/selling-factors/rollback/${archivedRecordId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  };

  const postData = JSON.stringify({ username: 'testuser' });

  try {
    const response = await makeRequest(options, postData);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ Rollback API works!');
      console.log('New Draft version created:');
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.error('❌ Rollback API failed:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ Rollback error:', error.message);
    return null;
  }
}

// Main execution
async function runTests() {
  console.log('\n🚀 Starting Version History + Rollback Tests...\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without login. Exiting...');
    return;
  }

  // Step 2: Fetch Selling Factors
  const factors = await fetchSellingFactors();
  if (factors.length === 0) {
    console.error('\n❌ No selling factors found. Exiting...');
    return;
  }

  // Find a record with multiple versions
  const grouped = {};
  factors.forEach(f => {
    if (!grouped[f.patternCode]) grouped[f.patternCode] = [];
    grouped[f.patternCode].push(f);
  });

  // Find pattern with multiple versions
  let testPattern = null;
  for (const code in grouped) {
    if (grouped[code].length > 1) {
      testPattern = { code, versions: grouped[code] };
      break;
    }
  }

  if (!testPattern) {
    console.log('\n⚠️  No pattern with multiple versions found. Using first pattern...');
    const firstCode = Object.keys(grouped)[0];
    testPattern = { code: firstCode, versions: grouped[firstCode] };
  }

  // Step 3: Test Version History
  const testRecord = testPattern.versions[0];
  const history = await testVersionHistory(testRecord.id, testPattern.code);

  // Step 4: Test Rollback (if Archived version exists)
  const archivedVersion = history.find(v => v.status === 'Archived');
  if (archivedVersion) {
    console.log(`\n✅ Found Archived version (v${archivedVersion.version}). Testing Rollback...`);
    await testRollback(archivedVersion.id, testPattern.code);
  } else {
    console.log('\n⚠️  No Archived version found. Skipping Rollback test.');
    console.log('   (Rollback can only be tested on Archived versions)');
  }

  console.log('\n========================================');
  console.log('✅ All Tests Completed!');
  console.log('========================================\n');
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
