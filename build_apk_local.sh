#!/bin/bash
set -e

echo "=========================================================="
echo "   Speed Escape 3D (com.escape) - Android APK Builder    "
echo "=========================================================="

# 1. Verify / Install Java 17
if ! command -v java &> /dev/null; then
    echo "[1/5] Java not detected in PATH. Installing OpenJDK 17..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq openjdk-17-jdk-headless unzip curl
fi

export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which javac || which java))))
echo "[1/5] JAVA_HOME is: $JAVA_HOME"
java -version

# 2. Verify / Setup Android SDK 35
ANDROID_DIR="${ANDROID_HOME:-$PWD/.tools/android-sdk}"
mkdir -p "$ANDROID_DIR"
if [ ! -d "$ANDROID_DIR/platforms/android-35" ] || [ ! -d "$ANDROID_DIR/build-tools/35.0.0" ]; then
    echo "[2/5] Setting up Android SDK 35 & build-tools 35.0.0 in $ANDROID_DIR..."
    mkdir -p "$ANDROID_DIR/cmdline-tools"
    if [ ! -d "$ANDROID_DIR/cmdline-tools/latest" ]; then
        echo "--> Downloading Android command-line tools..."
        curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/cmdline-tools.zip
        unzip -q /tmp/cmdline-tools.zip -d "$ANDROID_DIR/cmdline-tools"
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

# 3. Update local.properties and gradlew permissions
echo "[3/5] Configuring local.properties and permissions..."
echo "sdk.dir=$ANDROID_DIR" > local.properties
chmod +x gradlew

# 4. Execute Unit Tests
echo "[4/5] Executing Gradle unit tests..."
./gradlew testDebugUnitTest --continue --stacktrace

# 5. Assemble APK
echo "[5/5] Assembling Android Debug APK..."
./gradlew assembleDebug --stacktrace

# Verification
APK_PATH=$(find app/build/outputs/apk/debug/ -name "*.apk" | head -n 1)
if [ -f "$APK_PATH" ]; then
    echo "=========================================================="
    echo " BUILD SUCCESSFUL! "
    echo " APK Path: $APK_PATH"
    echo " APK Size: $(du -h "$APK_PATH" | cut -f1)"
    echo " Package ID: com.escape"
    echo "=========================================================="
else
    echo "ERROR: APK was not generated."
    exit 1
fi
