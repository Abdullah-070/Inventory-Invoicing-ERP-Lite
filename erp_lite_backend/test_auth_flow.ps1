#!/usr/bin/env pwsh
<#
End-to-end authentication flow test using PowerShell
#>

$BASE_URL = "http://127.0.0.1:8000"

Write-Host "Testing Authentication Flow" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Test 0: Health Check
Write-Host "`n=== TEST 0: Health Check ===" -ForegroundColor Yellow
$healthUri = "$BASE_URL/health"
try {
    $response = Invoke-WebRequest -Uri $healthUri -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend health check failed: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

# Test 1: Admin Login
Write-Host "`n=== TEST 1: Admin Login ===" -ForegroundColor Yellow
$loginUri = "$BASE_URL/api/v1/auth/login"
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $loginUri -Method Post -Body $loginBody -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        $adminToken = $data.access_token
        Write-Host "✓ Login successful" -ForegroundColor Green
        Write-Host "  User: $($data.user.username) ($($data.user.role))"
        Write-Host "  Token: $($adminToken.Substring(0,30))..."
    } else {
        Write-Host "✗ Login failed: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Signup
Write-Host "`n=== TEST 2: Signup New User ===" -ForegroundColor Yellow
$timestamp = Get-Date -Format "HHmmss"
$signupUri = "$BASE_URL/api/v1/auth/register"
$signupBody = @{
    username = "testuser$timestamp"
    email = "test$timestamp@example.com"
    password = "Test@1234567"
} | ConvertTo-Json

$newUsername = "testuser$timestamp"
$newPassword = "Test@1234567"

try {
    $response = Invoke-WebRequest -Uri $signupUri -Method Post -Body $signupBody -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✓ Signup successful" -ForegroundColor Green
        Write-Host "  User: $($data.user.username)"
        Write-Host "  Email: $($data.user.email)"
    } else {
        Write-Host "✗ Signup failed: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "  Response: $($response.Content)"
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Login with new user
Write-Host "`n=== TEST 3: Login New User ===" -ForegroundColor Yellow
$newLoginBody = @{
    username = $newUsername
    password = $newPassword
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $loginUri -Method Post -Body $newLoginBody -ContentType "application/json" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        $newToken = $data.access_token
        Write-Host "✓ Login successful" -ForegroundColor Green
        Write-Host "  User: $($data.user.username)"
        Write-Host "  Token: $($newToken.Substring(0,30))..."
    } else {
        Write-Host "✗ Login failed: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "`nAuthentication flow is working correctly:"
Write-Host "✓ Admin login works"
Write-Host "✓ User signup works"
Write-Host "✓ New user login works"
Write-Host "`nSystem is ready for testing!" -ForegroundColor Green
