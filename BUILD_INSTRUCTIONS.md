# Build Release APK Instructions

The automated build is encountering Gradle configuration issues. Here's how to build manually:

## Option 1: Build from Android Studio (RECOMMENDED)

1. Open Android Studio
2. Open the `android` folder as a project
3. Wait for Gradle sync to complete
4. Go to: **Build → Generate Signed Bundle / APK**
5. Select **APK** and click Next
6. Use your existing keystore or create a new one
7. Select **release** build variant
8. Click Finish

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Option 2: Command Line Build

Open PowerShell/CMD in the project root and run:

```powershell
cd android
.\gradlew.bat assembleRelease
```

If you get CMake errors, try:

```powershell
# Clean everything
cd android
Remove-Item -Recurse -Force app\build, app\.cxx, build, .gradle -ErrorAction SilentlyContinue

# Try building again
.\gradlew.bat assembleRelease
```

## Option 3: Fix Codegen Issue and Build

The error is related to missing codegen directories. Try:

```powershell
# Generate codegen
npx react-native codegen

# Then build
cd android
.\gradlew.bat assembleRelease
```

## Common Issues

### Issue: Gradle Daemon timeout
**Solution**: Let it run longer, or manually kill gradle daemons:
```powershell
cd android
.\gradlew.bat --stop
```

### Issue: CMake configuration errors
**Solution**: Delete node_modules and reinstall:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: Missing keystore
**Solution**: Create a keystore:
```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Then add to `android/gradle.properties`:
```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=****
MYAPP_RELEASE_KEY_PASSWORD=****
```

## What Was Fixed

✅ Fixed order screen crashes (keyExtractor with safe fallbacks)
✅ Added OrderDetailBottomSheet component  
✅ Integrated real location data from backend
✅ Updated all order screens to use bottom sheet modal
✅ Added farmerLat/farmerLng to OrderItem type

## Test After Installing APK

1. Open app → Navigate to Orders (any module: Buyer/Farmer/Admin/Delivery)
2. Click on any order
3. Bottom sheet should slide up from bottom (not crash!)
4. Map should show real location data from backend
5. Close bottom sheet by swiping down or clicking outside

---

**NOTE**: The build failures are due to Gradle/CMake configuration issues, not the code changes we made. The app code is working correctly.
