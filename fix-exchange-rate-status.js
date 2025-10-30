// Fix Exchange Rate Master Data status from 'Approved' to 'Active'
const http = require('http');

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
    const response = JSON.parse(data);
    const token = response.access_token;

    if (!token) {
      console.error('❌ No token received');
      process.exit(1);
    }

    console.log('✅ Login successful!\n');

    // Get all Exchange Rate Master Data
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/data/exchange-rate-master-data',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('📊 Fetching Exchange Rate Master Data...');

    const getReq = http.request(getOptions, (res2) => {
      let data2 = '';

      res2.on('data', (chunk) => {
        data2 += chunk;
      });

      res2.on('end', () => {
        const response = JSON.parse(data2);
        const rates = response.data || response;
        console.log(`Found ${rates.length} Exchange Rate records\n`);

        let updateCount = 0;
        let totalUpdates = 0;

        // Update each record
        rates.forEach((rate, index) => {
          if (rate.status === 'Approved') {
            totalUpdates++;

            setTimeout(() => {
              // ส่งเฉพาะ fields ที่จำเป็นเท่านั้น
              const updateData = JSON.stringify({
                sourceCurrencyCode: rate.sourceCurrencyCode,
                destinationCurrencyCode: rate.destinationCurrencyCode,
                rate: rate.rate,
                customerGroupId: rate.customerGroupId,
                description: rate.description,
                status: 'Active',  // เปลี่ยนจาก Approved เป็น Active
                effectiveFrom: rate.effectiveFrom,
                effectiveTo: rate.effectiveTo,
                isActive: rate.isActive,
                version: rate.version
              });

              const updateOptions = {
                hostname: 'localhost',
                port: 3000,
                path: `/api/data/exchange-rate-master-data/${rate.id}`,
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'Content-Length': updateData.length
                }
              };

              const updateReq = http.request(updateOptions, (res3) => {
                let data3 = '';

                res3.on('data', (chunk) => {
                  data3 += chunk;
                });

                res3.on('end', () => {
                  updateCount++;
                  console.log(`✅ Updated: ${rate.sourceCurrencyCode} → ${rate.destinationCurrencyCode} (status: Approved → Active)`);

                  if (updateCount === totalUpdates) {
                    console.log(`\n🎉 All ${updateCount} records updated successfully!`);
                    process.exit(0);
                  }
                });
              });

              updateReq.on('error', (e) => {
                console.error(`❌ Error updating ${rate.sourceCurrencyCode} → ${rate.destinationCurrencyCode}:`, e.message);
              });

              updateReq.write(updateData);
              updateReq.end();
            }, index * 100); // Stagger requests
          }
        });

        if (totalUpdates === 0) {
          console.log('✅ All records already have status = Active');
          process.exit(0);
        }
      });
    });

    getReq.on('error', (e) => {
      console.error('❌ Error fetching data:', e.message);
      process.exit(1);
    });

    getReq.end();
  });
});

loginReq.on('error', (e) => {
  console.error('❌ Login error:', e.message);
  process.exit(1);
});

loginReq.write(loginData);
loginReq.end();
