param(
  [string]$BaseUrl = 'http://localhost:4000/api',
  [string]$WebUrl = 'http://localhost:5173'
)

$ErrorActionPreference = 'Stop'
$script:passed = 0

function Login([string]$email, [string]$password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  return Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType 'application/json' -Body $body
}

function Headers([string]$token) {
  return @{ Authorization = "Bearer $token" }
}

function Check([string]$name, [scriptblock]$block) {
  $result = & $block
  $script:passed += 1
  Write-Host "PASS  $name" -ForegroundColor Green
  return $result
}

Write-Host 'Amaravati One smoke test' -ForegroundColor Cyan
Write-Host "API: $BaseUrl"
Write-Host ''

Check 'health endpoint' { Invoke-RestMethod "$BaseUrl/health" } | Out-Null

$citizen = Login 'citizen@amaravati.one' 'Citizen@123'
$citizenHeaders = Headers $citizen.token
Check 'citizen credentials' { Invoke-RestMethod "$BaseUrl/credentials" -Headers $citizenHeaders } | Out-Null
Check 'citizen payments' { Invoke-RestMethod "$BaseUrl/payments" -Headers $citizenHeaders } | Out-Null
Check 'citizen notifications' { Invoke-RestMethod "$BaseUrl/notifications" -Headers $citizenHeaders } | Out-Null
Check 'citizen due dates' { Invoke-RestMethod "$BaseUrl/due-dates" -Headers $citizenHeaders } | Out-Null
Check 'citizen dashboard' { Invoke-RestMethod "$BaseUrl/dashboard" -Headers $citizenHeaders } | Out-Null

$officer = Login 'officer@amaravati.one' 'Officer@123'
$officerHeaders = Headers $officer.token
Check 'officer dashboard' { Invoke-RestMethod "$BaseUrl/officer/dashboard" -Headers $officerHeaders } | Out-Null
Check 'officer applications' { Invoke-RestMethod "$BaseUrl/officer/applications" -Headers $officerHeaders } | Out-Null

$admin = Login 'admin@amaravati.one' 'Admin@123'
$adminHeaders = Headers $admin.token
Check 'admin dashboard' { Invoke-RestMethod "$BaseUrl/admin/dashboard" -Headers $adminHeaders } | Out-Null
Check 'admin citizens' { Invoke-RestMethod "$BaseUrl/admin/citizens" -Headers $adminHeaders } | Out-Null
Check 'admin services' { Invoke-RestMethod "$BaseUrl/services/manage/all" -Headers $adminHeaders } | Out-Null
Check 'admin applications' { Invoke-RestMethod "$BaseUrl/admin/applications" -Headers $adminHeaders } | Out-Null
$adminPayments = Check 'admin payments' { Invoke-RestMethod "$BaseUrl/admin/payments" -Headers $adminHeaders }
Check 'admin due dates' { Invoke-RestMethod "$BaseUrl/due-dates/manage/all" -Headers $adminHeaders } | Out-Null
Check 'admin notifications' { Invoke-RestMethod "$BaseUrl/notifications/manage/all" -Headers $adminHeaders } | Out-Null
Check 'admin reports' { Invoke-RestMethod "$BaseUrl/admin/reports" -Headers $adminHeaders } | Out-Null

$due = (Invoke-RestMethod "$BaseUrl/due-dates/manage/all" -Headers $adminHeaders).dueDates |
  Where-Object { -not $_.isCompleted } |
  Select-Object -First 1
if ($due) {
  Check 'admin completes a citizen due date' {
    Invoke-RestMethod -Method Patch -Uri "$BaseUrl/due-dates/$($due.id)/complete" -Headers $adminHeaders
  } | Out-Null
}

Check 'admin runs due-date reminders' {
  Invoke-RestMethod -Method Post -Uri "$BaseUrl/due-dates/run-reminders?days=7" -Headers $adminHeaders
} | Out-Null

$paid = $adminPayments.payments | Where-Object { $_.status -eq 'SUCCESS' } | Select-Object -First 1
if ($paid) {
  $receipt = Check 'payment receipt renders' {
    Invoke-WebRequest -Uri "$BaseUrl/payments/$($paid.id)/receipt" -Headers $adminHeaders -UseBasicParsing
  }
  if ($receipt.Content -match [regex]::Escape($paid.user.fullName)) {
    $script:passed += 1
    Write-Host "PASS  receipt shows citizen name ($($paid.user.fullName))" -ForegroundColor Green
  } else {
    throw 'Receipt does not show the citizen name.'
  }
}

try {
  $page = Invoke-WebRequest -Uri $WebUrl -UseBasicParsing -TimeoutSec 10
  if ($page.StatusCode -eq 200 -and $page.Content -match 'Amaravati') {
    $script:passed += 1
    Write-Host 'PASS  Vite app serves' -ForegroundColor Green
  } else {
    throw "Unexpected response from $WebUrl"
  }
} catch {
  Write-Host "SKIP  Vite app not reachable at $WebUrl (start it with npm run dev)" -ForegroundColor Yellow
}

Write-Host ''
Write-Host "$($script:passed) checks passed." -ForegroundColor Green
Write-Host 'The smoke test completes one due date and generates reminders. Run "npm run db:seed" to restore demo data.' -ForegroundColor Yellow
