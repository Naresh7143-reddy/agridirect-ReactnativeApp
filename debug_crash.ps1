# AgriDirect Crash Debug Script
# Run this after connecting your phone with USB debugging enabled

$ADB = "C:\Users\nares\AppData\Local\Android\Sdk\platform-tools\adb.exe"

Write-Host "=== Checking connected devices ===" -ForegroundColor Green
& $ADB devices

Write-Host "`n=== Clearing old logs ===" -ForegroundColor Green
& $ADB logcat -c

Write-Host "`n=== Waiting for app to crash... ===" -ForegroundColor Yellow
Write-Host "Open the AgriDirect app on your phone now`n" -ForegroundColor Yellow

Write-Host "=== Live crash logs (Ctrl+C to stop) ===" -ForegroundColor Green
Write-Host "Showing ERRORS and app-specific logs...`n" -ForegroundColor Cyan

# Filter for app crashes and errors
& $ADB logcat -v time `
    *:E `
    ReactNativeJS:V `
    AndroidRuntime:E `
    System.err:V `
    com.agridirect:V `
    | Select-String -Pattern "agridirect|FATAL|AndroidRuntime|ReactNativeJS|firebase|appcheck|Error|Exception|Crash"
