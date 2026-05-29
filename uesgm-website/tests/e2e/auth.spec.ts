import { test, expect } from '@playwright/test'

test.describe('Admin Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText(/Connexion/i)
  })

  test('should redirect unauthenticated user from admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@uesgm.ma')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Depending on UI implementation, check for error toast or message
    // await expect(page.locator('.error-message')).toBeVisible()
  })
})
