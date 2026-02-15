/**
 * Tests E2E pour les événements UESGM avec Playwright
 */

const { test, expect } = require('@playwright/test')

test.describe('Gestion des Événements - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Visiter la page d'administration
    await page.goto('http://localhost:3000/portal')
  })

  test('connexion admin et accès aux événements', async ({ page }) => {
    // Remplir le formulaire de connexion
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    
    // Cliquer sur le bouton de connexion
    await page.click('button[type="submit"]')
    
    // Attendre la redirection vers le dashboard
    await page.waitForURL('**/admin/dashboard')
    
    // Naviguer vers la page des événements
    await page.click('a[href="/admin/evenements"]')
    await page.waitForURL('**/admin/evenements')
    
    // Vérifier que la page des événements est chargée
    await expect(page.locator('h1')).toContainText('Événements')
  })

  test('création d\'un événement avec publication immédiate', async ({ page }) => {
    // Connexion
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    // Aller à la page de création d'événement
    await page.goto('http://localhost:3000/admin/evenements/new')
    
    // Remplir le formulaire
    await page.fill('input[name="title"]', 'E2E Test Event Now')
    await page.fill('textarea[name="description"]', 'Description de test E2E pour publication immédiate')
    await page.fill('input[name="location"]', 'E2E Test Location')
    await page.fill('input[name="date"]', '2026-06-01')
    
    // Sélectionner la catégorie
    await page.selectOption('select[name="category"]', 'CULTURAL')
    
    // Mode de publication - Publier maintenant
    await page.check('input[value="NOW"]')
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]')
    
    // Vérifier le succès
    await expect(page.locator('text=Événement créé avec succès')).toBeVisible()
    
    // Retourner à la liste des événements
    await page.goto('http://localhost:3000/admin/evenements')
    
    // Vérifier que l'événement est dans la liste
    await expect(page.locator('text=E2E Test Event Now')).toBeVisible()
  })

  test('création d\'un événement avec publication programmée', async ({ page }) => {
    // Connexion
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    // Aller à la page de création d'événement
    await page.goto('http://localhost:3000/admin/evenements/new')
    
    // Remplir le formulaire
    await page.fill('input[name="title"]', 'E2E Test Event Scheduled')
    await page.fill('textarea[name="description"]', 'Description de test E2E pour publication programmée')
    await page.fill('input[name="location"]', 'E2E Scheduled Location')
    await page.fill('input[name="date"]', '2026-07-01')
    
    // Sélectionner la catégorie
    await page.selectOption('select[name="category"]', 'ACADEMIC')
    
    // Mode de publication - Programmer
    await page.check('input[value="SCHEDULED"]')
    
    // Définir la date de publication
    await page.fill('input[name="publishedAt"]', '2026-05-01T08:00')
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]')
    
    // Vérifier le succès
    await expect(page.locator('text=Événement créé avec succès')).toBeVisible()
  })

  test('vérification que l\'événement publié apparaît côté public', async ({ page }) => {
    // D'abord créer un événement publié côté admin
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    await page.goto('http://localhost:3000/admin/evenements/new')
    
    await page.fill('input[name="title"]', 'E2E Public Test Event')
    await page.fill('textarea[name="description"]', 'Cet événement doit être visible publiquement')
    await page.fill('input[name="location"]', 'Public Test Location')
    await page.fill('input[name="date"]', '2026-06-01')
    await page.selectOption('select[name="category"]', 'CULTURAL')
    await page.check('input[value="NOW"]')
    await page.click('button[type="submit"]')
    
    // Aller à la page publique des événements
    await page.goto('http://localhost:3000/evenements')
    
    // Vérifier que l'événement est visible
    await expect(page.locator('text=E2E Public Test Event')).toBeVisible()
  })

  test('vérification que l\'événement programmé n\'apparaît pas côté public', async ({ page }) => {
    // D'abord créer un événement programmé côté admin
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    await page.goto('http://localhost:3000/admin/evenements/new')
    
    await page.fill('input[name="title"]', 'E2E Scheduled Private Event')
    await page.fill('textarea[name="description"]', 'Cet événement ne doit pas être visible publiquement')
    await page.fill('input[name="location"]', 'Private Test Location')
    await page.fill('input[name="date"]', '2026-07-01')
    await page.selectOption('select[name="category"]', 'ACADEMIC')
    await page.check('input[value="SCHEDULED"]')
    await page.fill('input[name="publishedAt"]', '2026-12-01T08:00') // Date future
    await page.click('button[type="submit"]')
    
    // Aller à la page publique des événements
    await page.goto('http://localhost:3000/evenements')
    
    // Vérifier que l'événement n'est PAS visible
    await expect(page.locator('text=E2E Scheduled Private Event')).not.toBeVisible()
  })

  test('modification d\'un événement existant', async ({ page }) => {
    // Connexion
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    // Aller à la liste des événements
    await page.goto('http://localhost:3000/admin/evenements')
    
    // Trouver le premier événement et cliquer sur modifier
    const firstEvent = page.locator('.event-item').first()
    if (await firstEvent.isVisible()) {
      await firstEvent.locator('button:has-text("Modifier")').click()
      
      // Modifier le titre
      await page.fill('input[name="title"]', 'Événement Modifié E2E')
      
      // Soumettre les modifications
      await page.click('button[type="submit"]')
      
      // Vérifier le succès
      await expect(page.locator('text=Événement modifié avec succès')).toBeVisible()
    }
  })

  test('suppression d\'un événement', async ({ page }) => {
    // Connexion
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    // Aller à la liste des événements
    await page.goto('http://localhost:3000/admin/evenements')
    
    // Trouver un événement de test et le supprimer
    const testEvent = page.locator('text=E2E Test Event').first()
    if (await testEvent.isVisible()) {
      const eventContainer = testEvent.locator('..')
      await eventContainer.locator('button:has-text("Supprimer")').click()
      
      // Confirmer la suppression dans la modal
      await page.click('button:has-text("Confirmer")')
      
      // Vérifier le succès
      await expect(page.locator('text=Événement supprimé avec succès')).toBeVisible()
    }
  })

  test('validation du formulaire - champs requis', async ({ page }) => {
    // Connexion
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    // Aller à la page de création
    await page.goto('http://localhost:3000/admin/evenements/new')
    
    // Essayer de soumettre le formulaire vide
    await page.click('button[type="submit"]')
    
    // Vérifier les messages d'erreur
    await expect(page.locator('text=Le titre doit contenir au moins 3 caractères')).toBeVisible()
    await expect(page.locator('text=La description doit contenir au moins 10 caractères')).toBeVisible()
  })

  test('test du job de publication programmée', async ({ page }) => {
    // Cette test nécessite l'accès à l'API de publication
    // En pratique, vous pourriez simuler l'appel API ou utiliser un endpoint de test
    
    // Connexion admin
    await page.fill('input[name="email"]', 'president@uesgm.ma')
    await page.fill('input[name="password"]', 'UESGM_President_2025_Secret!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    
    // Créer un événement programmé pour dans le passé
    await page.goto('http://localhost:3000/admin/evenements/new')
    
    await page.fill('input[name="title"]', 'E2E Past Scheduled Event')
    await page.fill('textarea[name="description"]', 'Doit être publié automatiquement')
    await page.fill('input[name="location"]', 'Auto Publish Test')
    await page.fill('input[name="date"]', '2026-06-01')
    await page.selectOption('select[name="category"]', 'CULTURAL')
    await page.check('input[value="SCHEDULED"]')
    await page.fill('input[name="publishedAt"]', '2024-01-01T08:00') // Date passée
    await page.click('button[type="submit"]')
    
    // Simuler l'appel au job de publication (via API directe)
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/admin/events/publish-scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return res.json()
    })
    
    expect(response.success).toBe(true)
  })
})
