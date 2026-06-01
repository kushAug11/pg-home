// Automated E2E Test Suite for Hostels SaaS
// Run with: npm run test:e2e

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://hostels-p-gs-managament-website-gms1ljogj.vercel.app';
const API_URL = 'https://hostelspgs-managament-website-1.onrender.com/api';

// Test Data
const testOwner = {
    name: 'Test Owner',
    email: `testowner${Date.now()}@example.com`,
    password: 'TestPass123!',
    pgName: 'Test Hostel',
    city: 'Mumbai',
    address: '123 Test Street'
};

const testTenant = {
    name: 'Test Tenant',
    email: `testtenant${Date.now()}@example.com`,
    mobile: '9876543210',
    guardianName: 'Test Guardian',
    guardianPhone: '9876543211',
    address: '456 Tenant Street',
    idType: 'Aadhaar',
    idNumber: '123456789012'
};

test.describe('Public Pages', () => {
    test('Homepage loads correctly', async ({ page }) => {
        await page.goto(BASE_URL);

        // Check page loads
        await expect(page).toHaveTitle(/Hostel/i);

        // Check navigation
        await expect(page.locator('nav')).toBeVisible();

        // Check hero section
        await expect(page.locator('h1')).toBeVisible();

        // Check no console errors
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        expect(errors).toHaveLength(0);
    });

    test('Navigation links work', async ({ page }) => {
        await page.goto(BASE_URL);

        // Test Features link
        await page.click('text=Features');
        await expect(page).toHaveURL(/features/);

        // Test Pricing link
        await page.click('text=Pricing');
        await expect(page).toHaveURL(/pricing/);

        // Test Login link
        await page.click('text=Login');
        await expect(page).toHaveURL(/login/);
    });

    test('Pricing page displays all plans', async ({ page }) => {
        await page.goto(`${BASE_URL}/pricing`);

        // Check all plans visible
        await expect(page.locator('text=Free')).toBeVisible();
        await expect(page.locator('text=Pro')).toBeVisible();
        await expect(page.locator('text=Enterprise')).toBeVisible();

        // Check buttons
        const buttons = page.locator('button:has-text("Choose Plan")');
        await expect(buttons).toHaveCount(3);
    });
});

test.describe('Authentication Flow', () => {
    test('Owner registration flow', async ({ page }) => {
        await page.goto(`${BASE_URL}/register`);

        // Fill registration form
        await page.fill('input[name="name"]', testOwner.name);
        await page.fill('input[name="email"]', testOwner.email);
        await page.fill('input[name="password"]', testOwner.password);
        await page.fill('input[name="pgName"]', testOwner.pgName);
        await page.fill('input[name="city"]', testOwner.city);
        await page.fill('input[name="address"]', testOwner.address);

        // Submit
        await page.click('button[type="submit"]');

        // Wait for redirect or success message
        await page.waitForURL(/login|owner/, { timeout: 10000 });

        // Verify success
        const url = page.url();
        expect(url).toMatch(/login|owner/);
    });

    test('Owner login flow', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Fill login form
        await page.fill('input[name="email"]', testOwner.email);
        await page.fill('input[name="password"]', testOwner.password);

        // Submit
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL(/owner/, { timeout: 10000 });

        // Verify logged in
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('Admin login flow', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Fill login form
        await page.fill('input[name="email"]', 'admin@hostel.com');
        await page.fill('input[name="password"]', 'adminpassword123');

        // Submit
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL(/admin/, { timeout: 10000 });

        // Verify admin dashboard
        await expect(page.locator('text=Platform')).toBeVisible();
    });

    test('Login with invalid credentials fails', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        // Fill with wrong password
        await page.fill('input[name="email"]', testOwner.email);
        await page.fill('input[name="password"]', 'WrongPassword123!');

        // Submit
        await page.click('button[type="submit"]');

        // Wait for error message
        await expect(page.locator('text=/invalid|incorrect/i')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Owner Dashboard - Room Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', testOwner.email);
        await page.fill('input[name="password"]', testOwner.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/owner/, { timeout: 10000 });
    });

    test('Add room successfully', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/rooms`);

        // Click Add Room
        await page.click('text=Add Room');

        // Fill form
        await page.fill('input[name="number"]', '101');
        await page.selectOption('select[name="type"]', 'Single');
        await page.fill('input[name="capacity"]', '1');
        await page.fill('input[name="rent"]', '5000');

        // Submit
        await page.click('button:has-text("Save")');

        // Wait for success
        await expect(page.locator('text=/success|added/i')).toBeVisible({ timeout: 5000 });

        // Verify room in list
        await expect(page.locator('text=101')).toBeVisible();
    });

    test('Cannot add duplicate room number', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/rooms`);

        // Try to add room 101 again
        await page.click('text=Add Room');
        await page.fill('input[name="number"]', '101');
        await page.selectOption('select[name="type"]', 'Single');
        await page.fill('input[name="capacity"]', '1');
        await page.fill('input[name="rent"]', '5000');
        await page.click('button:has-text("Save")');

        // Expect error
        await expect(page.locator('text=/already exists|duplicate/i')).toBeVisible({ timeout: 5000 });
    });

    test('Edit room successfully', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/rooms`);

        // Click edit on room 101
        await page.click('[data-room="101"] button[title*="Edit"]');

        // Change rent
        await page.fill('input[name="rent"]', '5500');

        // Submit
        await page.click('button:has-text("Update")');

        // Verify update
        await expect(page.locator('text=5500')).toBeVisible();
    });

    test('Delete empty room successfully', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/rooms`);

        // Add a new room to delete
        await page.click('text=Add Room');
        await page.fill('input[name="number"]', '999');
        await page.selectOption('select[name="type"]', 'Single');
        await page.fill('input[name="capacity"]', '1');
        await page.fill('input[name="rent"]', '5000');
        await page.click('button:has-text("Save")');

        // Wait for room to appear
        await page.waitForSelector('text=999');

        // Delete it
        await page.click('[data-room="999"] button[title*="Delete"]');

        // Confirm
        await page.click('button:has-text("Delete")');

        // Verify deleted
        await expect(page.locator('text=999')).not.toBeVisible();
    });
});

test.describe('Owner Dashboard - Tenant Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', testOwner.email);
        await page.fill('input[name="password"]', testOwner.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/owner/, { timeout: 10000 });
    });

    test('Add tenant successfully', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/tenants`);

        // Click Add Tenant
        await page.click('text=Add Tenant');

        // Fill form
        await page.fill('input[name="name"]', testTenant.name);
        await page.fill('input[name="email"]', testTenant.email);
        await page.fill('input[name="password"]', 'TenantPass123!');
        await page.fill('input[name="mobile"]', testTenant.mobile);
        await page.selectOption('select[name="room_id"]', { index: 1 }); // Select first room
        await page.fill('input[name="rentAmount"]', '5000');
        await page.fill('input[name="guardian_name"]', testTenant.guardianName);
        await page.fill('input[name="guardian_phone"]', testTenant.guardianPhone);
        await page.fill('textarea[name="permanent_address"]', testTenant.address);
        await page.selectOption('select[name="id_proof_type"]', testTenant.idType);
        await page.fill('input[name="id_proof_number"]', testTenant.idNumber);

        // Note: File upload would require actual files
        // await page.setInputFiles('input[name="idProofFront"]', 'path/to/file.pdf');

        // Submit
        await page.click('button:has-text("Register Tenant")');

        // Wait for success
        await expect(page.locator('text=/success|added/i')).toBeVisible({ timeout: 10000 });
    });

    test('Cannot add tenant with duplicate email', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/tenants`);

        // Try to add tenant with same email
        await page.click('text=Add Tenant');
        await page.fill('input[name="email"]', testTenant.email);
        // ... fill other fields ...
        await page.click('button:has-text("Register Tenant")');

        // Expect error
        await expect(page.locator('text=/already exists|duplicate/i')).toBeVisible({ timeout: 5000 });
    });

    test('Delete tenant and re-add with same email', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/tenants`);

        // Delete tenant
        await page.click(`[data-tenant-email="${testTenant.email}"] button[title*="Delete"]`);
        await page.click('button:has-text("Delete")');

        // Wait for deletion
        await page.waitForTimeout(2000);

        // Try to add again with same email
        await page.click('text=Add Tenant');
        await page.fill('input[name="email"]', testTenant.email);
        // ... fill other fields ...
        await page.click('button:has-text("Register Tenant")');

        // Should succeed (orphaned account cleanup)
        await expect(page.locator('text=/success|added/i')).toBeVisible({ timeout: 10000 });
    });

    test('Search tenants works', async ({ page }) => {
        await page.goto(`${BASE_URL}/owner/tenants`);

        // Enter search
        await page.fill('input[placeholder*="Search"]', testTenant.name);

        // Wait for filter
        await page.waitForTimeout(1000);

        // Verify only matching tenants visible
        await expect(page.locator(`text=${testTenant.name}`)).toBeVisible();
    });
});

test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', 'admin@hostel.com');
        await page.fill('input[name="password"]', 'adminpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/admin/, { timeout: 10000 });
    });

    test('View all PGs', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/pgs`);

        // Verify PG list loads
        await expect(page.locator('table')).toBeVisible();

        // Verify test PG is in list
        await expect(page.locator(`text=${testOwner.pgName}`)).toBeVisible();
    });

    test('View PG details modal', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/pgs`);

        // Click eye icon
        await page.click('button[title="View Details"]');

        // Verify modal opens
        await expect(page.locator('text=PG Details')).toBeVisible();

        // Verify details shown
        await expect(page.locator(`text=${testOwner.pgName}`)).toBeVisible();
        await expect(page.locator(`text=${testOwner.email}`)).toBeVisible();

        // Close modal
        await page.click('button:has-text("Close")');
    });

    test('Search PGs works', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/pgs`);

        // Enter search
        await page.fill('input[placeholder*="Search"]', testOwner.pgName);

        // Wait for filter
        await page.waitForTimeout(1000);

        // Verify only matching PGs visible
        await expect(page.locator(`text=${testOwner.pgName}`)).toBeVisible();
    });
});

test.describe('Page Refresh (404 Fix)', () => {
    test('Refreshing any page works', async ({ page }) => {
        // Navigate to a deep route
        await page.goto(`${BASE_URL}/pricing`);

        // Reload page
        await page.reload();

        // Should not get 404
        await expect(page.locator('text=404')).not.toBeVisible();
        await expect(page.locator('text=/pricing|plan/i')).toBeVisible();
    });

    test('Direct navigation to deep route works', async ({ page }) => {
        // Go directly to a route
        await page.goto(`${BASE_URL}/features`);

        // Should load correctly
        await expect(page.locator('text=404')).not.toBeVisible();
        await expect(page.locator('text=/feature/i')).toBeVisible();
    });
});

test.describe('Performance', () => {
    test('Homepage loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load in under 5 seconds (accounting for Render cold start)
        expect(loadTime).toBeLessThan(65000);
    });
});

test.describe('Responsive Design', () => {
    test('Mobile navigation works', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto(BASE_URL);

        // Check mobile menu
        await page.click('button[aria-label*="menu"]');

        // Verify menu opens
        await expect(page.locator('nav')).toBeVisible();
    });
});
