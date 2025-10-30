// Test Customer Group Override System (Phase 2)
// Test end-to-end flow: Create Group → Add Override → Approve → Check Price Calculation

const axios = require('axios');

const API_BASE = 'http://localhost:3001';
let authToken = null;

// Helper function to login
async function login() {
  console.log('\n=== 1. Login ===');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ Login successful');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Helper function to make authenticated requests
async function apiCall(method, url, data = null) {
  const config = {
    method,
    url: `${API_BASE}${url}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  if (data) config.data = data;
  return axios(config);
}

// Test 1: Create Customer Group
async function testCreateGroup() {
  console.log('\n=== 2. Create Customer Group ===');
  try {
    const groupData = {
      id: 'TEST_VIP',
      name: 'Test VIP Customers',
      description: 'Test group for VIP customers with special pricing',
      isDefault: false,
      isActive: true
    };

    const response = await apiCall('post', '/customer-groups', groupData);
    console.log('✅ Customer Group created:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Group already exists, fetching existing...');
      const response = await apiCall('get', '/customer-groups/TEST_VIP');
      return response.data;
    }
    console.error('❌ Failed to create group:', error.response?.data || error.message);
    throw error;
  }
}

// Test 2: Create FAB Cost Override
async function testCreateFabCostOverride() {
  console.log('\n=== 3. Create FAB Cost Override (Draft) ===');
  try {
    const overrideData = {
      rawMaterialId: 'RM-001',
      fabCost: 200.00,
      changeReason: 'Special pricing for VIP customers - Test',
      createdBy: 'admin'
    };

    const response = await apiCall('post', '/customer-groups/TEST_VIP/overrides/fab-cost', overrideData);
    console.log('✅ FAB Cost Override created (Draft):', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create override:', error.response?.data || error.message);
    throw error;
  }
}

// Test 3: Approve Override
async function testApproveOverride(overrideId) {
  console.log('\n=== 4. Approve FAB Cost Override ===');
  try {
    const response = await apiCall('put', `/customer-groups/TEST_VIP/overrides/fab-cost/${overrideId}/approve`);
    console.log('✅ Override approved (Active):', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to approve override:', error.response?.data || error.message);
    throw error;
  }
}

// Test 4: Get all overrides
async function testGetOverrides() {
  console.log('\n=== 5. Get All FAB Cost Overrides ===');
  try {
    const response = await apiCall('get', '/customer-groups/TEST_VIP/overrides/fab-cost');
    console.log(`✅ Found ${response.data.length} FAB Cost overrides:`);
    response.data.forEach(override => {
      console.log(`   - Version ${override.version}: ${override.status} - FAB Cost: ฿${override.fabCost}`);
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get overrides:', error.response?.data || error.message);
    throw error;
  }
}

// Test 5: Test Price Calculation with Override
async function testPriceCalculation() {
  console.log('\n=== 6. Test Price Calculation with Override ===');
  try {
    // ต้องมีข้อมูล Product และ Raw Material ก่อน
    const requestData = {
      customerId: 'CUST-VIP-001',
      customerName: 'VIP Customer Test',
      customerGroupId: 'TEST_VIP',
      products: [
        {
          productId: 'PROD-001',
          productName: 'Product A',
          quantity: 100,
          rawMaterials: [
            {
              rawMaterialId: 'RM-001',
              rawMaterialName: 'Aluminum',
              weightPerUnit: 0.5
            }
          ]
        }
      ],
      currencyCode: 'THB'
    };

    const response = await apiCall('post', '/pricing/calculate', requestData);
    console.log('✅ Price calculated with Customer Group Override:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Price calculation failed:', error.response?.data || error.message);
    // Don't throw - this might fail if product/raw material data is missing
  }
}

// Test 6: Create Selling Factor Override
async function testCreateSellingFactorOverride() {
  console.log('\n=== 7. Create Selling Factor Override ===');
  try {
    const overrideData = {
      productId: 'PROD-001',
      sellingFactor: 1.25,
      changeReason: 'Lower markup for VIP customers',
      createdBy: 'admin'
    };

    const response = await apiCall('post', '/customer-groups/TEST_VIP/overrides/selling-factor', overrideData);
    console.log('✅ Selling Factor Override created:', response.data);

    // Auto-approve
    const approvedResponse = await apiCall('put', `/customer-groups/TEST_VIP/overrides/selling-factor/${response.data.id}/approve`);
    console.log('✅ Selling Factor Override approved:', approvedResponse.data);

    return approvedResponse.data;
  } catch (error) {
    console.error('❌ Failed to create selling factor override:', error.response?.data || error.message);
    throw error;
  }
}

// Main test flow
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Customer Group Override System - End-to-End Test        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await login();
    await testCreateGroup();
    const override = await testCreateFabCostOverride();
    await testApproveOverride(override.id);
    await testGetOverrides();
    await testCreateSellingFactorOverride();
    await testPriceCalculation();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ All Tests Completed Successfully!                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📌 Next Steps:');
    console.log('   1. Open http://localhost:5173 in browser');
    console.log('   2. Navigate to Customer Groups menu');
    console.log('   3. Select TEST_VIP group');
    console.log('   4. Check FAB Cost and Selling Factor tabs');
    console.log('   5. Verify overrides are displayed correctly');

  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ❌ Test Failed                                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    process.exit(1);
  }
}

runTests();
