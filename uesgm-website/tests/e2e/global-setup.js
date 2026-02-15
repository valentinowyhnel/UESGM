/**
 * Setup global pour les tests E2E Playwright
 */

const { chromium } = require('@playwright/test')

async function globalSetup(config) {
  console.log('🚀 Setup global des tests E2E...')
  
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Vérifier que le serveur est accessible
    await page.goto(config.webServer.baseURL)
    await page.waitForSelector('body', { timeout: 30000 })
    
    // Vérifier la santé de l'API
    const response = await page.request.get(`${config.webServer.baseURL}/api/health`)
    const health = await response.json()
    
    if (health.status !== 'ok') {
      throw new Error(`Serveur non prêt: ${JSON.stringify(health)}`)
    }
    
    console.log('✅ Serveur prêt pour les tests E2E')
    
  } catch (error) {
    console.error('❌ Erreur setup E2E:', error.message)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

module.exports = globalSetup
