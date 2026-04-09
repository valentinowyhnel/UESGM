import { test, expect } from '@playwright/test';

test('Public home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/UESGM/);
});

test('Admin login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('form')).toBeVisible();
});

test('Submit contact form', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'This is a test message with more than ten characters.');
  await page.click('button[type="submit"]');
  // Expect a success toast or message
});
