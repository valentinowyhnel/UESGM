import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Connexion');
  });

  test('should redirect unauthenticated admin access', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Public Features', () => {
  test('should show events list', async ({ page }) => {
    await page.goto('/evenements');
    await expect(page.locator('h1')).toContainText('Événements');
  });

  test('should show contact form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('form')).toBeVisible();
  });
});
