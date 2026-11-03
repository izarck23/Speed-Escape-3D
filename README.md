# Speed Escape 3D

High-octane arcade 3D racing game featuring dynamic desert highways, customizable supercars, competitive AI opponents, and futuristic neon arcade presentation.

- **Application ID / Namespace:** `com.escape`
- **Architecture:** Hybrid Android Architecture (Hardware-accelerated native WebView + 3D Three.js Engine + Jetpack Compose Foundation & Thread-Safe UI Bridge)
- **Target Platform:** Android (API 26 Oreo to Android 15 Vanilla Ice Cream / API 35) & Web Preview (Vite on Port 3000)
- **Build System:** Gradle 8.11.1 with Android Gradle Plugin (AGP) 8.7.2 & Kotlin 2.0.21

---

## 1. Project Requirements

| Requirement | Supported Version | Notes |
|---|---|---|
| **Java Development Kit (JDK)** | **Java 17** (OpenJDK 17 / Temurin 17 / Zulu 17) | Required for AGP 8.7.2 and Kotlin 2.0.21 |
| **Android SDK Platform** | **Android 15 (API 35)** | `compileSdk = 35`, `targetSdk = 35`, `minSdk = 26` |
| **Android Build-Tools** | **35.0.0** (or 34.0.0+) | Installed via Android SDK Manager (`sdkmanager`) |
| **Gradle** | **8.11.1** | Managed automatically via `./gradlew` |
| **Node.js (Optional for APK, required for Web preview)** | **Node.js 20 or 22** | Pre-bundled assets exist in `app/src/main/assets/web/` |

---

## 2. Local Build Commands

### Step A: Build Web Assets (If Modifying Frontend Code)
```bash
npm install
npm run build
mkdir -p app/src/main/assets/web
cp -r dist/* app/src/main/assets/web/
```

### Step B: Build Android APK
Make sure `JAVA_HOME` points to JDK 17 and `ANDROID_HOME` points to your Android SDK.

```bash
# Clean the build cache
./gradlew clean

# Run unit tests
./gradlew testDebugUnitTest --continue --stacktrace

# Assemble debug APK
./gradlew assembleDebug --stacktrace
```

### Automated One-Command Local Build
Run the provided automated build script, which handles SDK tool verification, asset synchronization, tests, and compilation:
```bash
chmod +x build_apk_local.sh
./build_apk_local.sh
```

---

## 3. APK Output Path

Upon a successful build, the debug APK is generated at:

- Standard Gradle path: `app/build/outputs/apk/debug/app-debug.apk`
- Easy-access testing folder: `testing/app-debug.apk` (and `testing/SpeedEscape3D-v1.1-debug.apk`)

---

## 4. GitHub Actions CI/CD

An automated workflow is configured at `.github/workflows/build-apk.yml`.

### Workflow Capabilities:
1. **Triggers**: On push or pull request to any branch, and manual trigger (`workflow_dispatch`).
2. **Environment**: Runs on `ubuntu-latest` with JDK 17 (Temurin) and Android SDK 35.
3. **Gradle Validation**: Validates the Gradle wrapper checksum via `gradle/actions/wrapper-validation@v4`.
4. **Asset Synchronization**: Builds the latest web bundle using Node.js 22 and packages it into `app/src/main/assets/web/`.
5. **Testing & Building**: Runs `./gradlew clean testDebugUnitTest assembleDebug`.
6. **Artifact Upload**: Uploads `app-debug.apk` as a downloadable artifact named `SpeedEscape3D-Debug-APK` retained for 30 days.
7. **Diagnostics**: Automatically prints test reports and environment info if a failure occurs.

### Required GitHub Secrets:
- **None required for Debug APK builds**.
- If signing a production Release APK with a custom keystore in the future:
  - `KEYSTORE_BASE64`: Base64-encoded release keystore
  - `KEYSTORE_PASSWORD`: Keystore password
  - `KEY_ALIAS`: Key alias name
  - `KEY_PASSWORD`: Key password

---

## 5. Troubleshooting

### 1. `sdk.dir` missing or SDK location not found
- Ensure `ANDROID_HOME` is exported: `export ANDROID_HOME=/path/to/android/sdk`
- Or create a `local.properties` file in the root directory:
  ```properties
  sdk.dir=/path/to/android/sdk
  ```

### 2. Java Version Incompatibility
- Verify Java 17 is active:
  ```bash
  java -version
  javac -version
  ```
- If Java 21 or Java 8 is selected by default, switch via `update-alternatives --config java` or set `export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`.

### 3. Missing Licenses in Android SDK
Run the SDK Manager license acceptance:
```bash
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
```

### 4. WebView / WebGL Rendering Issues on Older Emulators
- Ensure Hardware Acceleration is enabled in your Android Virtual Device (AVD).
- The application requires OpenGL ES 3.0+ hardware acceleration (standard on physical devices since Android 8.0).
