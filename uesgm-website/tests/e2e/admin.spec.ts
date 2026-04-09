import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@uesgm.ma');
    await page.fill('input[name="password"]', '7d99755735371a9f891309e336bf8f71');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('should display the admin dashboard with stats', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('.stats-card')).toBeVisible();
  });

  test('should allow creating a new event', async ({ page }) => {
    await page.goto('/admin/evenements');
    await page.click('button:has-text("Nouveau")');
    await page.fill('input[name="title"]', 'E2E Test Event');
    await page.fill('textarea[name="description"]', 'Description of the E2E test event.');
    await page.fill('input[name="location"]', 'Rabat');
    await page.selectOption('select[name="category"]', 'CULTURAL');
    await page.fill('input[name="startDate"]', '2025-01-01T10:00');
    await page.click('button[type="submit"]');
    await expect(page.locator('table')).toContainText('E2E Test Event');
  });

  test('should allow uploading a document', async ({ page }) => {
    await page.goto('/admin/bibliotheque');
    await page.click('button:has-text("Ajouter")');
    await page.fill('input[name="title"]', 'E2E Test Doc');
    // Simulate file upload (Mocking or using a real test file)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('.upload-dropzone');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/sample.pdf');
    await page.click('button[type="submit"]');
    await expect(page.locator('table')).toContainText('E2E Test Doc');
  });
});

test.describe('Public Access', () => {
  test('should display the public home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Union des Étudiants et Stagiaires Gabonais au Maroc');
  });

  test('should allow submitting a contact message', async ({ page }) => {
    await page.goto('/contact');
    await page.fill('input[name="name"]', 'John E2E');
    await page.fill('input[name="email"]', 'john@e2e.com');
    await page.fill('input[name="subject"]', 'E2E Subject');
    await page.fill('textarea[name="message"]', 'This is an E2E test message.');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
