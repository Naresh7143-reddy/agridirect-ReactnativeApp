@echo off
echo ========================================
echo   AgriDirect - Release APK Builder
echo   v1.1.0 - Bottom Sheet Edition
echo ========================================
echo.
echo What's new:
echo   - Fixed app crash on order click
echo   - Added smooth bottom sheet for orders
echo   - Real location data integration
echo   - Better UX and performance
echo.

echo [1/4] Cleaning previous builds...
cd android
call gradlew.bat clean
if errorlevel 1 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)
cd ..
echo     Clean completed!
echo.

echo [2/4] Building release APK...
echo     This may take 2-5 minutes...
cd android
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo ERROR: Build failed!
    echo.
    echo Trying with stacktrace for more details...
    call gradlew.bat assembleRelease --stacktrace
    cd ..
    pause
    exit /b 1
)
cd ..
echo     Build completed!
echo.

echo [3/4] Locating APK file...
set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
if exist "%APK_PATH%" (
    echo     APK found: %APK_PATH%
    echo.
    
    echo [4/4] Copying APK to project root...
    copy "%APK_PATH%" "AgriDirect-v1.1.0-BottomSheet.apk"
    echo     APK copied to: AgriDirect-v1.1.0-BottomSheet.apk
) else (
    echo ERROR: APK not found at expected location!
    echo Expected: %APK_PATH%
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESS!
echo ========================================
echo.
echo APK Location: %CD%\AgriDirect-v1.1.0-BottomSheet.apk
echo.
echo What to test:
echo   1. Open app and go to Orders
echo   2. Click any order
echo   3. Bottom sheet should slide up (no crash!)
echo   4. Swipe down or tap outside to close
echo   5. Try all order statuses
echo.
echo Next steps:
echo   1. Copy APK to your device
echo   2. Enable "Install from Unknown Sources"
echo   3. Install and test the app
echo.
pause
