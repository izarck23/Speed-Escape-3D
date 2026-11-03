#!/bin/bash
set -e

echo "=========================================================="
echo "   Speed Escape 3D (com.escape) - Android APK Builder    "
echo "=========================================================="

# 1. Verify / Install Java 17
if ! command -v java &> /dev/null; then
    echo "[1/6] Java not detected in PATH. Installing OpenJDK 17..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq openjdk-17-jdk-headless unzip curl
fi

export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which javac || which java))))
echo "[1/6] JAVA_HOME is: $JAVA_HOME"
java -version

# 2. Verify / Setup Android SDK 35
ANDROID_DIR="${ANDROID_HOME:-$PWD/.tools/android-sdk}"
mkdir -p "$ANDROID_DIR"
if [ ! -d "$ANDROID_DIR/platforms/android-35" ] || [ ! -d "$ANDROID_DIR/build-tools/35.0.0" ]; then
    echo "[2/6] Setting up Android SDK 35 & build-tools 35.0.0 in $ANDROID_DIR..."
    mkdir -p "$ANDROID_DIR/cmdline-tools"
    if [ ! -d "$ANDROID_DIR/cmdline-tools/latest" ]; then
        echo "--> Downloading Android command-line tools..."
        curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/cmdline-tools.zip
        unzip -q -o /tmp/cmdline-tools.zip -d "$ANDROID_DIR/cmdline-tools"
        rm -rf "$ANDROID_DIR/cmdline-tools/latest"
        mv "$ANDROID_DIR/cmdline-tools/cmdline-tools" "$ANDROID_DIR/cmdline-tools/latest"
        rm -f /tmp/cmdline-tools.zip
    fi
    echo "--> Accepting SDK licenses..."
    yes 2>/dev/null | "$ANDROID_DIR/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1 || true
    echo "--> Installing platforms;android-35 and build-tools;35.0.0..."
    "$ANDROID_DIR/cmdline-tools/latest/bin/sdkmanager" "platforms;android-35" "build-tools;35.0.0" "platform-tools"
fi

export ANDROID_HOME="$ANDROID_DIR"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

# 3. Synchronize Web Assets for Hybrid Android App
echo "[3/6] Synchronizing web assets..."
if command -v npm &> /dev/null; then
    npm run build
    mkdir -p app/src/main/assets/web
    cp -r dist/* app/src/main/assets/web/
fi

# 4. Update local.properties and gradlew permissions
echo "[4/6] Configuring local.properties and permissions..."
echo "sdk.dir=$ANDROID_DIR" > local.properties
chmod +x gradlew

# 5. Clean & Execute Unit Tests
echo "[5/6] Cleaning and executing Gradle unit tests..."
./gradlew clean testDebugUnitTest --continue --stacktrace

# 6. Assemble APK
echo "[6/6] Assembling Android Debug APK..."
./gradlew assembleDebug --stacktrace

# Verification
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "=========================================================="
    echo " BUILD SUCCESSFUL! "
    echo " APK Path: $APK_PATH"
    echo " APK Size: $(du -h "$APK_PATH" | cut -f1)"
    echo " Package ID: com.escape"
    echo "=========================================================="
else
    echo "ERROR: Target APK $APK_PATH was not generated."
    exit 1
fi
