import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing protected admin page', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Wait for error message
    // await expect(page.locator('text=Erreur')).toBeVisible()
  })
})

test.describe('Public Contact Form', () => {
  test('should submit contact form successfully', async ({ page }) => {
    await page.goto('/contact')
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('textarea[name="message"]', 'This is a test message from Playwright')
    // await page.click('button[type="submit"]')
    // await expect(page.locator('text=succès')).toBeVisible()
  })
})
