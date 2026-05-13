import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing admin dashboard without session', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error message on failed login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Check for error toast or message (adjust selector based on UI implementation)
    await expect(page.locator('text=Erreur')).toBeVisible();
  });
});

test.describe('Public Navigation', () => {
  test('should load home page correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('UESGM');
  });

  test('should be able to submit contact form', async ({ page }) => {
    await page.goto('/contact');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('textarea[name="message"]', 'Hello, this is a test message from Playwright.');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=succès')).toBeVisible();
  });
});
