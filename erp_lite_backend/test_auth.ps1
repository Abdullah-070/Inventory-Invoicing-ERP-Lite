$BASE_URL = "http://127.0.0.1:8000"

Write-Host "Testing Authentication Flow"
Write-Host "=" * 50

# Test 0: Health Check
Write-Host "`n=== TEST 0: Health Check ===" -ForegroundColor Yellow
$healthUri = "$BASE_URL/health"
try {
    $response = Invoke-WebRequest -Uri $healthUri -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "PASS: Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "FAIL: Health check status $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
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
        Write-Host "PASS: Admin login successful" -ForegroundColor Green
        Write-Host "  User: $($data.user.username) ($($data.user.role))"
    } else {
        Write-Host "FAIL: Status $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
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
        Write-Host "PASS: Signup successful" -ForegroundColor Green
        Write-Host "  User: $($data.user.username)"
    } else {
        Write-Host "FAIL: Status $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
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
        Write-Host "PASS: New user login successful" -ForegroundColor Green
        Write-Host "  User: $($data.user.username)"
    } else {
        Write-Host "FAIL: Status $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n" + ("=" * 50)
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "`nAuthentication is working correctly." -ForegroundColor Green
