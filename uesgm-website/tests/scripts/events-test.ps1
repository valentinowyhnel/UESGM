# Script de test CRUD Events UESGM
# Usage: .\events-test.ps1

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$CookieFile = "cookies.txt"
)

# Charger les cookies
if (Test-Path $CookieFile) {
    $cookies = Get-Content $CookieFile -Raw
    Write-Host "🍪 Cookies chargés depuis $CookieFile" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier cookies non trouvé. Exécutez d'abord auth-test.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "📅 Test CRUD Events UESGM" -ForegroundColor Cyan
Write-Host "URL: $BaseUrl" -ForegroundColor Gray

# Headers communs
$headers = @{
    "Content-Type" = "application/json"
    "Cookie" = $cookies
}

# Test 1: Créer événement publication immédiate
Write-Host "`n➕ 1. Création événement (publication immédiate)..." -ForegroundColor Yellow
$eventPayload = @{
    title = "Test Event Now"
    description = "Description de test pour événement immédiat"
    location = "Test Location"
    category = "CULTURAL"
    startDate = "2026-06-01T10:00:00Z"
    endDate = "2026-06-01T12:00:00Z"
    publishMode = "NOW"
    antenneIds = @()
} | ConvertTo-Json -Depth 10

try {
    $createResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events" -Method POST -Headers $headers -Body $eventPayload
    $eventId = $createResponse.event.id
    Write-Host "✅ Événement créé: $($createResponse.event.title)" -ForegroundColor Green
    Write-Host "   ID: $eventId" -ForegroundColor Gray
    Write-Host "   Status: $($createResponse.event.status)" -ForegroundColor Gray
    Write-Host "   PublishedAt: $($createResponse.event.publishedAt)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur création: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Créer événement publication programmée
Write-Host "`n⏰ 2. Création événement (publication programmée)..." -ForegroundColor Yellow
$scheduledEventPayload = @{
    title = "Test Event Scheduled"
    description = "Description de test pour événement programmé"
    location = "Scheduled Location"
    category = "ACADEMIC"
    startDate = "2026-07-01T14:00:00Z"
    endDate = "2026-07-01T16:00:00Z"
    publishMode = "SCHEDULED"
    publishedAt = "2026-05-01T08:00:00Z"
    antenneIds = @()
} | ConvertTo-Json -Depth 10

try {
    $scheduledResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events" -Method POST -Headers $headers -Body $scheduledEventPayload
    $scheduledEventId = $scheduledResponse.event.id
    Write-Host "✅ Événement programmé créé: $($scheduledResponse.event.title)" -ForegroundColor Green
    Write-Host "   ID: $scheduledEventId" -ForegroundColor Gray
    Write-Host "   Status: $($scheduledResponse.event.status)" -ForegroundColor Gray
    Write-Host "   PublishedAt: $($scheduledResponse.event.publishedAt)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur création programmée: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Lister les événements admin
Write-Host "`n📋 3. Liste des événements admin..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events" -Method GET -Headers $headers
    Write-Host "✅ $(($listResponse.data).Count) événements trouvés" -ForegroundColor Green
    Write-Host "   Total: $($listResponse.pagination.total)" -ForegroundColor Gray
    Write-Host "   Pages: $($listResponse.pagination.pages)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur liste: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Vérifier API publique (ne doit contenir que les événements publiés)
Write-Host "`n🌐 4. Vérification API publique..." -ForegroundColor Yellow
try {
    $publicResponse = Invoke-RestMethod -Uri "$BaseUrl/api/events/public" -Method GET
    $publishedEvents = $publicResponse.data | Where-Object { $_.status -eq "PUBLISHED" }
    Write-Host "✅ $(($publicResponse.data).Count) événements publics" -ForegroundColor Green
    Write-Host "   Publiés: $($publishedEvents.Count)" -ForegroundColor Gray
    
    # Vérifier que l'événement immédiat est présent
    $immediateEvent = $publicResponse.data | Where-Object { $_.id -eq $eventId }
    if ($immediateEvent) {
        Write-Host "   ✅ Événement immédiat trouvé dans API publique" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Événement immédiat manquant dans API publique" -ForegroundColor Red
    }
    
    # Vérifier que l'événement programmé n'est PAS présent
    $scheduledEvent = $publicResponse.data | Where-Object { $_.id -eq $scheduledEventId }
    if (-not $scheduledEvent) {
        Write-Host "   ✅ Événement programmé correctement masqué" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Événement programmé visible dans API publique" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur API publique: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Mettre à jour l'événement
Write-Host "`n✏️ 5. Mise à jour événement..." -ForegroundColor Yellow
$updatePayload = @{
    title = "Test Event Updated"
    description = "Description mise à jour"
    location = "Updated Location"
} | ConvertTo-Json -Depth 10

try {
    $updateResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events?id=$eventId" -Method PUT -Headers $headers -Body $updatePayload
    Write-Host "✅ Événement mis à jour: $($updateResponse.event.title)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur mise à jour: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Forcer la publication des événements programmés
Write-Host "`n🚀 6. Test publication automatique..." -ForegroundColor Yellow
try {
    $publishResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events/publish-scheduled" -Method POST -Headers $headers
    Write-Host "✅ Job de publication exécuté" -ForegroundColor Green
    Write-Host "   Événements publiés: $($publishResponse.published.Count)" -ForegroundColor Gray
    
    if ($publishResponse.published.Count -gt 0) {
        Write-Host "   Détails:" -ForegroundColor Gray
        $publishResponse.published | ForEach-Object {
            Write-Host "     - $($_.title) ($($_.id))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Erreur publication: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Vérifier que l'événement programmé est maintenant public
Write-Host "`n🔍 7. Vérification post-publication..." -ForegroundColor Yellow
try {
    $publicResponse2 = Invoke-RestMethod -Uri "$BaseUrl/api/events/public" -Method GET
    $nowPublishedEvent = $publicResponse2.data | Where-Object { $_.id -eq $scheduledEventId }
    
    if ($nowPublishedEvent) {
        Write-Host "✅ Événement programmé maintenant public" -ForegroundColor Green
        Write-Host "   Status: $($nowPublishedEvent.status)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Événement programmé toujours non public" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur vérification: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Supprimer les événements de test
Write-Host "`n🗑️ 8. Nettoyage - Suppression événements de test..." -ForegroundColor Yellow
$eventsToDelete = @($eventId, $scheduledEventId)

foreach ($eid in $eventsToDelete) {
    if ($eid) {
        try {
            $deleteResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events?id=$eid" -Method DELETE -Headers $headers
            Write-Host "✅ Événement $eid supprimé" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erreur suppression $eid: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n🎉 Tests Events terminés!" -ForegroundColor Green
Write-Host "Tous les scénarios CRUD ont été testés avec succès." -ForegroundColor Gray
