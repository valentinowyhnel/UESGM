/**
 * Teardown global pour les tests E2E Playwright
 */

async function globalTeardown(config) {
  console.log('🧹 Nettoyage global des tests E2E...')
  
  // Nettoyer les données de test si nécessaire
  // Note: En pratique, vous pourriez appeler une API de nettoyage ici
  
  console.log('✅ Nettoyage terminé')
}

module.exports = globalTeardown
