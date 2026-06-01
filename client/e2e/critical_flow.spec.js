import { test, expect } from '@playwright/test';

test.describe('Critical User Journey: Owner', () => {

    test('should login and view dashboard', async ({ page }) => {
        // 1. Navigate to Login
        await page.goto('/login');
        await expect(page).toHaveTitle(/Hostel Management/i);

        // 2. Perform Login (Assuming test credentials or mock mode)
        // Note: In a real CI env, we'd seed this user first or use a known test account.
        await page.fill('input[type="email"]', 'owner@test.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 3. Verify Redirection to Dashboard
        await expect(page).toHaveURL(/\/owner\/dashboard/);

        // 4. Verify Critical Elements
        await expect(page.getByText('Dashboard')).toBeVisible();
        await expect(page.getByText('Quick Actions')).toBeVisible();

        // 5. Verify Real-Time Badge (Wait for it to appear after timeout)
        // The "Live Updates" badge appears after 1000ms mock delay
        await expect(page.getByText('Live Updates')).toBeVisible({ timeout: 5000 });
    });

    test('should responsive layout on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/login');
        // Basic check that inputs are visible without horizontal scroll
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        // Check if hamburger menu exists (if implemented) or logic adapts
        // For now, just verifying it renders.
    });

});
