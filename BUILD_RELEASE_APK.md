# 🚀 Build Release APK - Complete Guide

## ✅ Pre-Build Checklist

Before building, ensure:
- [x] All crashes fixed (keyExtractor issue resolved)
- [x] Real location data integration complete
- [x] Types updated (OrderItem has farmerLat/farmerLng)
- [x] Debug code removed from production
- [x] All tests passed

---

## 📋 Quick Build Commands

### Option 1: Build Release APK (Recommended)

```powershell
# Clean previous builds
cd android
.\gradlew clean
cd ..

# Build release APK
cd android
.\gradlew assembleRelease
cd ..
```

**Output Location:**
```
android\app\build\outputs\apk\release\app-release.apk
```

### Option 2: Build Using React Native CLI

```powershell
# Build release
npx react-native run-android --mode=release
```

### Option 3: Build Signed APK (For Play Store)

```powershell
cd android
.\gradlew bundleRelease
cd ..
```

**Output Location:**
```
android\app\build\outputs\bundle\release\app-release.aab
```

---

## 🔧 Step-by-Step Build Instructions

### Step 1: Clean Previous Builds

```powershell
# Navigate to project root
cd c:\Users\nares\Downloads\AgriDirect

# Clean Gradle cache
cd android
.\gradlew clean
cd ..

# Clean Metro cache (optional but recommended)
npx react-native start --reset-cache
```

### Step 2: Install Dependencies (if needed)

```powershell
# Install npm packages
npm install

# OR using yarn
yarn install
```

### Step 3: Build Release APK

```powershell
# Build the release APK
cd android
.\gradlew assembleRelease
cd ..
```

**Expected output:**
```
> Task :app:assembleRelease
BUILD SUCCESSFUL in 2m 45s
```

### Step 4: Locate the APK

The APK will be at:
```
c:\Users\nares\Downloads\AgriDirect\android\app\build\outputs\apk\release\app-release.apk
```

File size: ~50-80 MB

### Step 5: Test the APK

```powershell
# Install on connected device
adb install android\app\build\outputs\apk\release\app-release.apk

# OR drag and drop the APK to your device
```

---

## 🔐 Signing Configuration (Optional)

The current setup uses debug keystore for release builds. For production (Google Play Store), you should:

### 1. Generate Release Keystore

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore agridirect-release-key.keystore -alias agridirect-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Create gradle.properties

Create `android/gradle.properties` (if not exists) and add:

```properties
MYAPP_RELEASE_STORE_FILE=agridirect-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=agridirect-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

**⚠️ IMPORTANT:** Add `gradle.properties` to `.gitignore`!

### 3. Place Keystore File

Copy the keystore file to:
```
android/app/agridirect-release-key.keystore
```

---

## 🏗️ Build Variants

### Debug Build (Development)
```powershell
cd android
.\gradlew assembleDebug
cd ..
```

### Release Build (Production - Unsigned)
```powershell
cd android
.\gradlew assembleRelease
cd ..
```

### Release Bundle (For Play Store)
```powershell
cd android
.\gradlew bundleRelease
cd ..
```

---

## 📦 Build Output Files

After successful build, you'll find:

### APK Files:
```
android/app/build/outputs/apk/
├── debug/
│   └── app-debug.apk
└── release/
    └── app-release.apk          ← This is what you need!
```

### AAB Files (for Play Store):
```
android/app/build/outputs/bundle/
└── release/
    └── app-release.aab          ← For Google Play Console
```

---

## 🐛 Common Build Issues & Solutions

### Issue 1: "Task failed with an exception"

**Solution:**
```powershell
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleRelease --stacktrace
cd ..
```

### Issue 2: "Out of memory" error

**Solution:**
Edit `android/gradle.properties` and add:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Issue 3: "Could not resolve dependencies"

**Solution:**
```powershell
# Clear Gradle cache
cd android
.\gradlew clean --refresh-dependencies
cd ..
```

### Issue 4: "SDK location not found"

**Solution:**
Create `android/local.properties`:
```properties
sdk.dir=C\:\\Users\\nares\\AppData\\Local\\Android\\Sdk
```

### Issue 5: Build stuck or very slow

**Solution:**
```powershell
# Stop Gradle daemon
cd android
.\gradlew --stop
cd ..

# Then rebuild
cd android
.\gradlew assembleRelease
cd ..
```

---

## ⚡ Optimization Tips

### 1. Enable ProGuard (Smaller APK)

Edit `android/app/build.gradle`:
```gradle
def enableProguardInReleaseBuilds = true  // Change to true
```

### 2. Enable Hermes (Faster startup)

Already enabled in your project! ✅

### 3. Enable App Bundle (Smaller download)

Use AAB instead of APK for Play Store:
```powershell
cd android
.\gradlew bundleRelease
cd ..
```

### 4. Split APKs by ABI

Edit `android/app/build.gradle`:
```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk true  // Keep this for universal APK
        }
    }
}
```

---

## 📊 Version Management

Current version in `android/app/build.gradle`:
```gradle
versionCode 2
versionName "1.1.0"
```

**For next release:**
1. Increment `versionCode` by 1 (required for updates)
2. Update `versionName` following semantic versioning:
   - Major.Minor.Patch (e.g., 1.2.0)
   - Major: Breaking changes
   - Minor: New features
   - Patch: Bug fixes

---

## 🎯 What's Included in This Build

### ✅ Bug Fixes:
- Fixed app crash when clicking orders (keyExtractor issue)
- Fixed FlashList key generation across all order screens
- Added null checks for order data validation
- Safe rendering of order items and details

### ✅ New Features:
- Real location data integration from backend
- Dynamic map showing actual pickup/dropoff locations
- Improved error handling with user-friendly messages
- Type-safe location data (farmerLat/farmerLng in OrderItem)

### ✅ Improvements:
- Removed debug code from production build
- Cleaned up console logs
- Optimized location data extraction
- Better fallback handling for missing data

---

## 🚀 Deployment Checklist

Before releasing to users:

### Testing:
- [ ] Install APK on physical device
- [ ] Test all order flows (Buyer, Farmer, Admin, Delivery)
- [ ] Test order creation
- [ ] Test order details screen
- [ ] Test order tracking screen
- [ ] Test map locations (verify real data is showing)
- [ ] Test navigation between screens
- [ ] Test with slow/no internet
- [ ] Test with various order statuses

### Performance:
- [ ] Check app size (should be ~50-80 MB)
- [ ] Check startup time
- [ ] Check memory usage
- [ ] Check battery drain

### Quality:
- [ ] No crashes on order click
- [ ] No console errors in production
- [ ] Maps show real locations (not fallbacks)
- [ ] All images load correctly
- [ ] All text is readable
- [ ] All buttons work

---

## 📤 Distribution

### Option 1: Direct APK Distribution
1. Copy `app-release.apk` to cloud storage (Google Drive, Dropbox)
2. Share download link with users
3. Users need to enable "Install from Unknown Sources"

### Option 2: Google Play Store (Recommended)
1. Create Google Play Developer account ($25 one-time)
2. Build AAB: `.\gradlew bundleRelease`
3. Upload to Play Console
4. Fill app details, screenshots, description
5. Submit for review

### Option 3: Internal Testing
1. Use Google Play Internal Testing
2. Add testers by email
3. They get instant updates
4. No review needed

---

## 📝 Build Notes

**Build Date:** 2026-08-12
**Version:** 1.1.0 (versionCode: 2)
**Build Type:** Release
**Signing:** Debug keystore (change for production)
**Backend:** https://agridirect-backend-80yz.onrender.com

**Changes in this version:**
- Fixed critical crash when clicking orders
- Integrated real location data from backend
- Improved map accuracy
- Better error handling
- Performance optimizations

---

## 🆘 Support

If build fails:
1. Check error message in terminal
2. Try `.\gradlew clean`
3. Check `BUILD_RELEASE_APK.md` for solutions
4. Check Node.js and Java versions
5. Update Android SDK if needed

**Required versions:**
- Node.js: 18.x or higher
- Java: JDK 17
- Android SDK: 33+
- Gradle: 8.x (auto-managed)

---

## ✅ Final Step

After successful build:
```powershell
# Navigate to output directory
cd android\app\build\outputs\apk\release

# List files
dir

# You should see: app-release.apk
```

**The APK is ready for installation! 🎉**
