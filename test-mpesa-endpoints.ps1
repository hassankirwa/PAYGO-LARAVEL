# M-Pesa API Testing Script for KOYO PayGo Platform
# Run this script to test all M-Pesa endpoints

Write-Host "🚀 KOYO PayGo M-Pesa API Testing Script" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://127.0.0.1:8000"

# Function to make HTTP requests
function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = @{}
    )
    
    Write-Host "🧪 Testing: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Cyan
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method GET -ContentType "application/json"
        } else {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $Url -Method POST -Body $jsonBody -ContentType "application/json"
        }
        
        Write-Host "✅ Success!" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
}

# Test 1: Configuration Overview
Test-Endpoint -Name "M-Pesa Configuration Overview" -Url "$baseUrl/test-mpesa"

# Test 2: Token Generation
Test-Endpoint -Name "Token Generation" -Url "$baseUrl/test-token"

# Test 3: STK Push
Test-Endpoint -Name "STK Push Payment" -Url "$baseUrl/test-stk-push"

# Test 4: C2B Simulate
Test-Endpoint -Name "C2B Paybill Simulation" -Url "$baseUrl/test-c2b-simulate"

# Test 5: C2B Till Payment
Test-Endpoint -Name "C2B Till Payment" -Url "$baseUrl/test-c2b-till"

# Test 6: Direct API Endpoint Tests
Write-Host "🔧 Testing Direct API Endpoints" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

# STK Push API Test
$stkBody = @{
    phone_number = "254712345678"
    amount = 100
    account_reference = "DIRECT-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
    transaction_desc = "Direct API Test Payment"
}

Test-Endpoint -Name "Direct STK Push API" -Url "$baseUrl/api/mpesa/stk-push" -Method "POST" -Body $stkBody

# C2B Simulate API Test
$c2bBody = @{
    phone_number = "254712345678"
    amount = 75
    account_reference = "C2B-DIRECT-$(Get-Date -Format 'yyyyMMddHHmmss')"
    bill_ref_number = "REF-$(Get-Date -Format 'yyyyMMddHHmmss')"
}

Test-Endpoint -Name "Direct C2B Simulate API" -Url "$baseUrl/api/mpesa/c2b-simulate" -Method "POST" -Body $c2bBody

Write-Host "🎉 M-Pesa API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Yellow
Write-Host "- All tests use sandbox environment" -ForegroundColor White
Write-Host "- Phone numbers are test numbers (254712345678)" -ForegroundColor White
Write-Host "- Amounts are small test amounts" -ForegroundColor White
Write-Host "- Check Laravel logs for detailed responses" -ForegroundColor White
Write-Host ""
Write-Host "📊 To view logs:" -ForegroundColor Yellow
Write-Host "cd paygo-backend && Get-Content storage/logs/laravel.log -Tail 50" -ForegroundColor Cyan 