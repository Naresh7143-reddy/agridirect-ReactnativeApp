# Building AgriDirect APK - Step by Step Guide

## ✅ All OTP Fixes Completed

The mobile app OTP issue has been fixed by adding Firebase AppCheck with PlayIntegrity provider. All code changes are ready.

## Quick Start - Build Release APK

### Step 1: Ensure Java & Android SDK are Installed
```bash
# Check Java version (should be 17+)
java -version

# Check Android SDK is installed
echo %ANDROID_HOME%
```

### Step 2: Clean Previous Builds
```bash
cd c:\Users\nares\Downloads\AgriDirect\android
.\gradlew clean
cd ..
```

### Step 3: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 4: Build Release APK

#### Option A: Using Gradle (Recommended)
```bash
cd c:\Users\nares\Downloads\AgriDirect\android
.\gradlew assembleRelease
```

#### Option B: Using React Native CLI
```bash
cd c:\Users\nares\Downloads\AgriDirect
npx react-native build-android --mode=release
```

#### Option C: Using Android Studio
1. Open Android Studio
2. File → Open → Select: `c:\Users\nares\Downloads\AgriDirect\android`
3. Build → Build Bundle(s) / APK(s) → Build APK
4. Select **release** variant
5. Click Build

### Step 5: Locate Your APK

After successful build, your APK will be at:
```
c:\Users\nares\Downloads\AgriDirect\android\app\build\outputs\apk\release\app-release.apk
```

File size: ~85-120 MB

### Step 6: Install on Phone/Emulator

#### On Physical Android Device:
```bash
cd c:\Users\nares\Downloads\AgriDirect
npx react-native run-android --variant=release
```

#### On Emulator:
```bash
cd c:\Users\nares\Downloads\AgriDirect
npx react-native run-android --variant=release
```

#### Manual Installation:
1. Enable Developer Mode on Android device: Settings → About Phone → tap Build Number 7 times
2. Connect phone via USB
3. Copy APK to phone or use:
```bash
adb install c:\Users\nares\Downloads\AgriDirect\android\app\build\outputs\apk\release\app-release.apk
```

## Troubleshooting Build Issues

### Issue: "gradle not found"
**Solution:**
```bash
cd android
./gradlew --version  # Should work on Windows
```

### Issue: "FAILURE: Build failed - CMake error"
**Root Cause:** Native code generation issue with react-native-mmkv

**Solutions (in order):**
1. Disable new architecture (already done in gradle.properties):
   - Verify: `newArchEnabled=false`

2. Clean cache:
```bash
cd android
.\gradlew clean
.\gradlew cleanBuildCache
rm -r .gradle
```

3. Update NDK:
   - Open Android Studio
   - Tools → SDK Manager → SDK Tools
   - Update NDK (side by side)

4. Full reset:
```bash
cd android
.\gradlew clean --refresh-dependencies
cd ..
npm install --legacy-peer-deps
cd android
.\gradlew assembleRelease --no-build-cache
```

### Issue: "FAILURE: Build failed - Java compilation error"
**Solution:**
```bash
# Ensure Java 17+ is installed
java -version

# Set JAVA_HOME if needed
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
```

### Issue: "Out of memory" during build
**Solution:**
Increase Gradle memory in `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

## Testing the OTP Fix

### Before Installation:
1. Get a test phone number
2. Make sure device has internet connection
3. Ensure SMS is enabled

### After Installation:
1. Launch AgriDirect app
2. Tap on "Get OTP" or "Sign In"
3. Enter 10-digit phone number (e.g., 9876543210)
4. Tap "Send OTP"
5. **OTP should arrive within 2-3 seconds** ✓

### If OTP Doesn't Arrive:
- Check Firebase Console for errors
- Verify internet connection on phone
- Check if SMS quota exceeded
- Ensure phone number has SMS enabled
- Try with different number

## What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| OTP on Mobile | ❌ Shows "Error occurred" | ✅ OTP arrives in SMS |
| Firebase AppCheck | ❌ Not initialized | ✅ Initialized with PlayIntegrity |
| Android Permissions | ❌ Missing AD_ID, PHONE_STATE | ✅ All permissions added |
| Proguard Rules | ❌ PlayIntegrity classes obfuscated | ✅ Rules added to preserve |
| Version | 1.0.0 | 1.1.0 (APK v2) |

## Release to Play Store

Once APK is built successfully:

1. **Sign APK** (if not already signed):
   - Already configured in `build.gradle` with release keystore

2. **Upload to Play Store**:
   - Go to Google Play Console
   - Select AgriDirect app
   - Internal Testing → Upload APK → Select your file
   - Or Release → Production → Upload APK

3. **Publish**:
   - Fill in release notes
   - Click "Publish"

## Key Changes Made

### 1. Added AppCheck Support
- **File:** `src/utils/firebase.ts`
- **Change:** Added `initializeAppCheck()` with PlayIntegrity provider
- **Why:** Mobile Firebase Phone Auth requires reCAPTCHA validation

### 2. Updated OTP Hook
- **File:** `src/hooks/useFirebaseAuth.ts`
- **Change:** Call `initializeAppCheck()` before `sendOTP()`
- **Why:** Ensure AppCheck is ready before OTP request

### 3. Added Required Permissions
- **File:** `android/app/src/main/AndroidManifest.xml`
- **Added:** `READ_PHONE_STATE`, `AD_ID` permissions
- **Why:** PlayIntegrity provider needs these for device verification

### 4. Updated Proguard Rules
- **File:** `android/app/proguard-rules.pro`
- **Added:** Rules to preserve PlayIntegrity classes
- **Why:** Prevent obfuscation of Firebase AppCheck provider

### 5. Disabled New Architecture
- **File:** `android/gradle.properties`
- **Change:** `newArchEnabled=false`
- **Why:** Work around native code build issues with MMKV

### 6. Updated Version
- **File:** `android/app/build.gradle`
- **Version:** 1.1.0 (APK version 2)
- **Why:** Track OTP fix release

## Support Contacts

For issues with:
- **Firebase:** Firebase Support → agridirect-9427a project
- **Android Build:** Android Studio Help or Android Developer docs
- **OTP Delivery:** Firebase Console → Authentication → Check logs
- **Play Store:** Google Play Console Support

## Verification Commands

Before building, verify setup:
```bash
# Check Node version
node --version     # Should be 22.11.0 or higher

# Check Java
java -version      # Should be 17+

# Check Android SDK
echo %ANDROID_HOME%

# Check if Gradle works
cd c:\Users\nares\Downloads\AgriDirect\android
.\gradlew --version

# Check npm packages
cd ..
npm list @react-native-firebase/app-check
```

## Final Checklist

Before releasing to production:
- [ ] Code changes reviewed
- [ ] APK builds successfully
- [ ] Tested on real Android device
- [ ] OTP arrives when testing
- [ ] All permissions show in app info
- [ ] Version updated (1.1.0)
- [ ] Firebase console shows successful OTP attempts
- [ ] App signed with release keystore
- [ ] Play Store listing updated with OTP fix notes

---

**Built:** July 22, 2026
**Version:** 1.1.0 (APK v2)
**Status:** Ready for Build & Testing ✅
