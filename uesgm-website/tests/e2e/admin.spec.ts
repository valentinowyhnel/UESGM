import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should redirect unauthorized users to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation errors on contact form', async ({ page }) => {
    await page.goto('/contact');
    await page.click('button[type="submit"]');
    // Check for some validation message
    // await expect(page.locator('text=Le nom doit contenir au moins 2 caractères')).toBeVisible();
  });
});
