import { test, expect } from '@playwright/test';

test.describe('Admin Console', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'UESGM' })).toBeVisible();
  });

  test('should load the contact page', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });
});
