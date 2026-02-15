# Script de test de sécurité UESGM
# Usage: .\security-test.ps1

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$CookieFile = "cookies.txt"
)

Write-Host "🔒 Test de sécurité UESGM" -ForegroundColor Cyan
Write-Host "URL: $BaseUrl" -ForegroundColor Gray

# Test 1: Accès non authentifié aux routes admin
Write-Host "`n🚫 1. Test accès non authentifié..." -ForegroundColor Yellow
$adminEndpoints = @(
    "/api/admin/events",
    "/api/admin/documents", 
    "/api/admin/projects",
    "/api/admin/members"
)

foreach ($endpoint in $adminEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl$endpoint" -Method GET -ErrorAction Stop
        Write-Host "❌ $endpoint - Accès non autorisé mais réussi!" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✅ $endpoint - Correctement protégé (401)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $endpoint - Code inattendu: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
}

# Test 2: Rate limiting sur login
Write-Host "`n⏱️ 2. Test rate limiting login..." -ForegroundColor Yellow
$loginAttempts = 0
$maxAttempts = 10

for ($i = 1; $i -le $maxAttempts; $i++) {
    try {
        $csrfResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/csrf" -Method GET
        $csrfToken = $csrfResponse.csrfToken
        
        $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/callback/credentials" -Method POST `
            -Body @{
                email = "fake@test.com"
                password = "wrongpassword"
                csrfToken = $csrfToken
            } `
            -ContentType "application/x-www-form-urlencoded" `
            -ErrorAction Stop
            
        Write-Host "❌ Tentative $i - Login réussi avec faux credentials!" -ForegroundColor Red
        
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            Write-Host "✅ Rate limiting activé après $i tentatives (429)" -ForegroundColor Green
            break
        } elseif ($_.Exception.Response.StatusCode -eq 401) {
            $loginAttempts++
        } else {
            Write-Host "⚠️  Tentative $i - Code inattendu: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Milliseconds 100
}

if ($loginAttempts -eq $maxAttempts) {
    Write-Host "⚠️  Rate limiting non activé après $maxAttempts tentatives" -ForegroundColor Yellow
}

# Test 3: Validation des entrées (Events)
Write-Host "`n🛡️ 3. Test validation des entrées..." -ForegroundColor Yellow

# Charger les cookies si disponibles
$cookies = ""
if (Test-Path $CookieFile) {
    $cookies = Get-Content $CookieFile -Raw
}

$headers = @{
    "Content-Type" = "application/json"
}
if ($cookies) {
    headers["Cookie"] = $cookies
}

# Test payloads invalides
$invalidPayloads = @(
    @{ title = ""; description = "Test"; category = "CULTURAL" },
    @{ title = "Test"; description = ""; category = "CULTURAL" },
    @{ title = "Test"; description = "Test"; category = "INVALID" },
    @{ title = "Test"; description = "Test"; startDate = "invalid-date" }
)

foreach ($payload in $invalidPayloads) {
    try {
        $jsonPayload = $payload | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events" -Method POST -Headers $headers -Body $jsonPayload -ErrorAction Stop
        Write-Host "❌ Payload invalide accepté: $($payload | ConvertTo-Json -Compress)" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "✅ Payload invalide rejeté: $($payload | ConvertTo-Json -Compress)" -ForegroundColor Green
        } elseif ($_.Exception.Response.StatusCode -eq 401 -and -not $cookies) {
            Write-Host "⚠️  Non authentifié - impossible de tester la validation" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Code inattendu: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
}

# Test 4: Injection SQL (basique)
Write-Host "`n💉 4. Test injection SQL..." -ForegroundColor Yellow
$sqlInjectionPayloads = @(
    "'; DROP TABLE Event; --",
    "' OR '1'='1",
    "admin'--",
    "'; SELECT * FROM User; --"
)

foreach ($payload in $sqlInjectionPayloads) {
    try {
        $testPayload = @{
            title = $payload
            description = "Test description"
            category = "CULTURAL"
            startDate = "2026-06-01T10:00:00Z"
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events" -Method POST -Headers $headers -Body $testPayload -ErrorAction Stop
        Write-Host "⚠️  Injection SQL possible: $payload" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✅ Injection SQL bloquée: $payload" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Code inattendu: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
}

# Test 5: XSS Protection
Write-Host "`n🔥 5. Test protection XSS..." -ForegroundColor Yellow
$xssPayloads = @(
    "<script>alert('XSS')</script>",
    "javascript:alert('XSS')",
    "<img src=x onerror=alert('XSS')>",
    "';alert('XSS');//"
)

foreach ($payload in $xssPayloads) {
    try {
        $testPayload = @{
            title = $payload
            description = "Test description with $payload"
            category = "CULTURAL"
            startDate = "2026-06-01T10:00:00Z"
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/events" -Method POST -Headers $headers -Body $testPayload -ErrorAction Stop
        Write-Host "⚠️  XSS possible: $payload" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✅ XSS bloqué: $payload" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Code inattendu: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
}

# Test 6: Vérification des headers de sécurité
Write-Host "`n🔐 6. Test headers de sécurité..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl" -Method GET
    $securityHeaders = @(
        "X-Content-Type-Options",
        "X-Frame-Options", 
        "X-XSS-Protection",
        "Strict-Transport-Security",
        "Content-Security-Policy"
    )
    
    $foundHeaders = 0
    foreach ($header in $securityHeaders) {
        if ($response.Headers[$header]) {
            Write-Host "✅ $header : $($response.Headers[$header])" -ForegroundColor Green
            $foundHeaders++
        } else {
            Write-Host "❌ $header : Manquant" -ForegroundColor Red
        }
    }
    
    Write-Host "📊 Headers de sécurité: $foundHeaders/$($securityHeaders.Count)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Erreur vérification headers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Tests de sécurité terminés!" -ForegroundColor Green
Write-Host "Revoyez les résultats pour identifier les vulnérabilités." -ForegroundColor Gray
