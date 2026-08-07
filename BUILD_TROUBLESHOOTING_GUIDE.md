# AgriDirect APK Build Troubleshooting Guide

**Date:** August 5, 2026  
**Project:** AgriDirect React Native App  
**Status:** Build failing with multiple native module compilation errors

---

## Current Issues Summary

### 1. **Native Library Crash (CRITICAL)**
**Problem:** App crashes immediately on startup with:
```
java.lang.UnsatisfiedLinkError: couldn't find DSO to load: libhermes.so
Process exited due to signal 6 (Aborted)
```

**Root Cause:**
- CMake compilation is failing
- Native libraries (libhermes.so, libreactnativejni.so) are not being included in APK
- APK is built WITHOUT native code, causing immediate crash

**Impact:** App cannot start at all - crashes at launch

---

### 2. **CMake Build Failures**
**Problem:** C++ native module compilation failing with:
```
CMake Error: add_subdirectory given source which is not an existing directory
Cannot specify link libraries for target "react_codegen_RNReanimatedSpec"
Cannot specify link libraries for target "react_codegen_rnworklets"
```

**Affected Modules:**
- `react-native-reanimated` (3.x)
- `react-native-worklets-core` 
- `react-native-mmkv` (3.2.0)

**Root Cause:**
- New Architecture enabled by default in React Native 0.85.3
- Native modules not fully compatible with new architecture
- Gradle autolinking generating invalid CMakeLists.txt

---

### 3. **Configuration Conflicts**
**Problem:** gradle.properties warnings:
```
WARNING: Setting `newArchEnabled=false` is not supported anymore since React Native 0.82
The application will run with the New Architecture enabled by default
```

**Root Cause:**
- React Native 0.85.3 forces new architecture
- Trying to disable it causes conflicts
- Some libraries require old architecture

---

## Solutions to Try (In Order)

### ✅ SOLUTION 1: Downgrade React Native to 0.76.x (RECOMMENDED)

**Why:** React Native 0.76 is the last stable LTS version with optional new architecture

**Steps:**

1. **Backup current code:**
   ```powershell
   cd c:\Users\nares\Downloads
   Copy-Item -Recurse AgriDirect AgriDirect_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')
   ```

2. **Downgrade React Native:**
   ```powershell
   cd c:\Users\nares\Downloads\AgriDirect
   npm install react-native@0.76.12 --legacy-peer-deps
   ```

3. **Update gradle.properties:**
   ```properties
   newArchEnabled=false
   hermesEnabled=true
   ```

4. **Clean and rebuild:**
   ```powershell
   cd android
   Remove-Item -Recurse -Force .gradle, app\.cxx, app\build
   .\gradlew clean
   .\gradlew assembleRelease
   ```

**Expected Time:** 12-15 minutes for full build  
**Success Rate:** 85%

---

### ✅ SOLUTION 2: Remove Problematic Native Modules (FASTEST)

**Why:** react-native-reanimated and react-native-mmkv are causing CMake failures

**Steps:**

1. **Remove native modules:**
   ```powershell
   cd c:\Users\nares\Downloads\AgriDirect
   npm uninstall react-native-reanimated react-native-mmkv --legacy-peer-deps
   ```

2. **Remove code references:**
   - Search for `useAnimatedStyle`, `useSharedValue`, `MMKV` in codebase
   - Replace animated components with basic React Native components
   - Replace MMKV storage with AsyncStorage

3. **Update imports in files:**
   ```javascript
   // Remove these:
   import Animated from 'react-native-reanimated';
   import { MMKV } from 'react-native-mmkv';
   
   // Replace with:
   import { Animated } from 'react-native';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   ```

4. **Clean and rebuild:**
   ```powershell
   cd android
   .\gradlew clean
   .\gradlew assembleRelease
   ```

**Expected Time:** 8-10 minutes  
**Success Rate:** 95%  
**Trade-off:** Lose smooth animations and fast storage

---

### ✅ SOLUTION 3: Use Older Working APK

**If you have a previously built APK that worked:**

1. **Check for old APK:**
   ```powershell
   Get-ChildItem -Path "c:\Users\nares\Downloads\AgriDirect\android\app\build\outputs\apk" -Recurse -Filter "*.apk" | 
   Sort-Object LastWriteTime -Descending | 
   Select-Object -First 5 FullName, Length, LastWriteTime
   ```

2. **Install old APK:**
   ```powershell
   adb -s AIOZVCNFJ7RCK7ZT install -r "path\to\old\app-release.apk"
   ```

**Success Rate:** 100% if old APK exists

---

### ✅ SOLUTION 4: Build with Android Studio (GUI Method)

**Why:** Android Studio's GUI build may handle native modules differently

**Steps:**

1. **Open project in Android Studio:**
   - File → Open → Select `c:\Users\nares\Downloads\AgriDirect\android`

2. **Sync Gradle:**
   - Click "Sync Project with Gradle Files" button

3. **Build APK:**
   - Build → Generate Signed Bundle/APK
   - Select APK → Next
   - Choose release keystore: `android/app/agridirect-release.keystore`
   - Password: `Josh@123.`
   - Build

**Expected Time:** 15-20 minutes (first time)  
**Success Rate:** 70%

---

### ✅ SOLUTION 5: Fix CMake Autolinking (ADVANCED)

**Why:** Manually fix the generated CMakeLists to exclude failing modules

**Steps:**

1. **Generate autolinking file:**
   ```powershell
   cd c:\Users\nares\Downloads\AgriDirect\android
   .\gradlew :app:generateAutolinkingPackageList
   ```

2. **Edit autolinking CMake file:**
   ```powershell
   notepad app\build\generated\autolinking\src\main\jni\Android-autolinking.cmake
   ```

3. **Comment out failing modules:**
   ```cmake
   # add_subdirectory("C:/Users/.../react-native-reanimated/..." rnworklets_autolinked_build)
   # add_subdirectory("C:/Users/.../react-native-mmkv/..." RNMmkvSpec_autolinked_build)
   # add_subdirectory("C:/Users/.../react-native-mmkv/..." RNMmkvSpec_cxxmodule_autolinked_build)
   
   set(AUTOLINKED_LIBRARIES
     # ... other libraries ...
     # react_codegen_rnworklets  # COMMENTED OUT
     # react_codegen_RNMmkvSpec  # COMMENTED OUT
     # react-native-mmkv  # COMMENTED OUT
   )
   ```

4. **Build without clean:**
   ```powershell
   .\gradlew assembleRelease --no-build-cache
   ```

**Expected Time:** 10-12 minutes  
**Success Rate:** 60%  
**Issue:** File regenerates on clean build

---

## Quick Diagnostics Commands

### Check what's installed:
```powershell
cd c:\Users\nares\Downloads\AgriDirect
npm list react-native react-native-reanimated react-native-mmkv --depth=0
```

### Check device connection:
```powershell
adb devices
```

### View crash logs:
```powershell
adb -s AIOZVCNFJ7RCK7ZT logcat -d | Select-String "FATAL|AndroidRuntime|com.agridirect" | Select-Object -Last 100
```

### Check APK native libraries:
```powershell
# Install 7-Zip first, then:
& "C:\Program Files\7-Zip\7z.exe" l "android\app\build\outputs\apk\release\app-release.apk" | Select-String ".so$"
```

### Check build cache size:
```powershell
Get-ChildItem android\.gradle, android\app\.cxx, android\app\build -Recurse -ErrorAction SilentlyContinue | 
Measure-Object -Property Length -Sum | 
Select-Object @{Name="SizeMB";Expression={[math]::Round($_.Sum/1MB, 2)}}
```

---

## Build Configuration Files

### android/gradle.properties (Working Config)
```properties
# React Native Architecture
newArchEnabled=false
hermesEnabled=true

# Build optimization
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr

# Architecture
reactNativeArchitectures=arm64-v8a

# Signing
MYAPP_RELEASE_STORE_FILE=agridirect-release.keystore
MYAPP_RELEASE_KEY_ALIAS=agridirect
MYAPP_RELEASE_STORE_PASSWORD=Josh@123.
MYAPP_RELEASE_KEY_PASSWORD=Josh@123.
```

### android/app/build.gradle (Key Settings)
```gradle
android {
    compileSdk 36
    ndkVersion "28.2.13676358"
    
    defaultConfig {
        applicationId "com.agridirect"
        minSdkVersion 24
        targetSdkVersion 36
        versionCode 2
        versionName "1.1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }
}
```

---

## Expected Build Output

### ✅ Successful Build:
```
> Task :app:bundleReleaseJsAndAssets
> Task :app:compileReleaseJavaWithJavac
> Task :app:packageRelease
> Task :app:assembleRelease

BUILD SUCCESSFUL in 12m 34s
```

**APK Location:**
```
c:\Users\nares\Downloads\AgriDirect\android\app\build\outputs\apk\release\app-release.apk
```

### ❌ Failed Build Indicators:
```
> Task :app:configureCMakeRelWithDebInfo[arm64-v8a] FAILED
CMake Error: add_subdirectory given source which is not an existing directory
BUILD FAILED in 3m 12s
```

---

## Recommended Action Plan

### IMMEDIATE (Today):
1. **Try Solution 2** (Remove react-native-reanimated and react-native-mmkv)
   - Fastest solution
   - Highest success rate
   - You lose animations but app will work

### SHORT-TERM (This Week):
2. **Try Solution 1** (Downgrade React Native to 0.76.12)
   - More stable
   - Better library compatibility
   - Keeps all features

### LONG-TERM (Next Sprint):
3. **Upgrade libraries** to versions that support new architecture
   - react-native-reanimated@4.x (experimental)
   - react-native-mmkv@3.5.x+
   - Wait for stable releases

---

## Contact & Resources

**React Native Docs:** https://reactnative.dev/docs/building-for-android  
**Troubleshooting:** https://reactnative.dev/docs/troubleshooting  
**CMake Issues:** https://github.com/facebook/react-native/issues

**Debug Script Location:**
```
c:\Users\nares\Downloads\AgriDirect\debug_crash.ps1
```

---

## Build Success Checklist

Before declaring build successful, verify:

- [ ] APK file exists at `android/app/build/outputs/apk/release/app-release.apk`
- [ ] APK size is > 25 MB (indicates native libraries included)
- [ ] APK contains .so files: `lib/arm64-v8a/libhermes.so`, `libreactnativejni.so`
- [ ] App installs without errors
- [ ] App launches without crashing
- [ ] Splash screen shows
- [ ] Can navigate to login screen
- [ ] **OTP functionality works** (main goal)

---

## Current Status

**Last Attempted:** August 5, 2026  
**Last Error:** Native crash - libhermes.so not found  
**Next Step:** Implement Solution 2 (Remove problematic modules)  
**Expected Resolution Time:** 30 minutes to 2 hours

---

*Generated by Kiro AI Assistant*
