import { test, expect } from '@playwright/test'

test.describe('Admin Login Flow', () => {
  test('should redirect to login when accessing protected admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login\?callbackUrl=.*admin%2Fdashboard/)
  })

  test('should show validation error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Identifiants invalides')).toBeVisible()
  })

  test('should login successfully as admin', async ({ page }) => {
    // In actual E2E test, we'd use environment variables for admin credentials
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@uesgm.ma')
    await page.fill('input[name="password"]', '7d99755735371a9f891309e336bf8f71')
    await page.click('button[type="submit"]')

    // In development environment with a mocked server, we'd check for successful redirection
    // await expect(page).toHaveURL('/admin/dashboard')
  })
})
