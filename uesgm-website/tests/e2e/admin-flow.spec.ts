import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should login as admin and create an event', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'admin@uesgm.ma');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify redirection to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Navigate to events management
    await page.click('text=Événements');

    // Click on create event
    await page.click('text=Créer un événement');

    // Fill event details
    await page.fill('input[name="title"]', 'Nouvel Événement Test');
    await page.fill('textarea[name="description"]', 'Description de l\'événement test par Playwright.');
    await page.fill('input[name="location"]', 'Libreville');
    await page.selectOption('select[name="category"]', 'CULTURAL');

    // Submit
    await page.click('button[type="submit"]');

    // Check success toast or list update
    await expect(page.locator('text=Événement créé avec succès')).toBeVisible();
  });

  test('should check contact form rate limiting', async ({ page }) => {
    await page.goto('/contact');

    const fillAndSubmit = async () => {
      await page.fill('input[name="name"]', 'Spammer');
      await page.fill('input[name="email"]', 'spam@example.com');
      await page.fill('textarea[name="message"]', 'Spamming the contact form for rate limit test.');
      await page.click('button[type="submit"]');
    };

    // Try multiple times
    for (let i = 0; i < 6; i++) {
      await fillAndSubmit();
      if (i >= 5) {
        await expect(page.locator('text=Trop de requêtes')).toBeVisible();
      }
    }
  });
});
