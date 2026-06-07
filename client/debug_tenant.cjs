const { chromium } = require('playwright');
const axios = require('axios');

(async () => {
  try {
    const timestamp = Date.now();
    const email = `test_owner_${timestamp}@hostel.com`;
    const password = 'password123';

    console.log(`Registering new owner: ${email}`);
    await axios.post('http://localhost:5001/api/auth/register', {
        name: 'Automated Owner',
        email: email,
        password: password,
        role: 'owner',
        pgName: 'Auto PG'
    });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let pageCrashed = false;

    // Listen for console errors
    page.on('pageerror', exception => {
      console.error(`\n💥 UNCAUGHT PAGE EXCEPTION:\n${exception}\n`);
      pageCrashed = true;
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🔴 BROWSER ERROR: ${msg.text()}`);
      }
    });

    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    console.log('Waiting for navigation...');
    await page.waitForTimeout(2000);

    console.log('Navigating to tenants...');
    await page.goto('http://localhost:5173/owner/tenants');
    
    console.log('Waiting for page to load...');
    await page.waitForSelector('text=Add Tenant', { timeout: 10000 });
    await page.waitForTimeout(1000); // let animations settle

    console.log('Clicking Add Tenant...');
    await page.click('text=Add Tenant');

    console.log('Waiting to see if form appears or page crashes...');
    await page.waitForTimeout(2000);

    const isFormVisible = await page.isVisible('text=Register New Tenant');
    
    if (pageCrashed) {
      console.log('❌ FAILED: The page crashed.');
    } else if (isFormVisible) {
      console.log('✅ SUCCESS: Form opened successfully without crashing.');
    } else {
      console.log('⚠️ UNKNOWN: Form did not open, but no crash was detected.');
    }

    await browser.close();
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
})();
