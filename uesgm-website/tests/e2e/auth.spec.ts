import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/Connexion/i);
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@uesgm.ma');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Check for error message - specific selector depends on your UI
    await expect(page.locator('text=Erreur')).toBeVisible();
  });
});
