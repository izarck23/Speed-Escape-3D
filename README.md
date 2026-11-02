# Speed Escape 3D

High-octane arcade 3D racing game featuring dynamic desert highways, customizable supercars, competitive AI opponents, and futuristic neon mobile arcade presentation.

**Application ID:** `com.escape`  
**Platform:** Android (API 26 to Android 15 / API 35) & Interactive Web Preview (Port 3000)  
**Architecture:** Clean Architecture + MVVM + Dedicated Game Loop & Thread-Safe UI Bridge  
**CI/CD:** Automated GitHub Actions APK build on push (`.github/workflows/build-apk.yml`)

---

## 1. Engine & Audio System Enhancements

- **Realistic Multi-Gear Supercar Audio**:
  - Procedural Web Audio API sound engine using multi-oscillator harmonic synthesis.
  - Multi-gear RPM simulation (1st to 5th gear with authentic rev sweeps from 1,000 to 7,800 RPM).
  - High-frequency turbocharger spool whine and exhaust backfire burble pops on deceleration and gear shifts.
  - Zero-click gain interpolation and automatic browser `AudioContext` resumption on user interaction.
  - Independent sound effects and music volume sliders with quick HUD mute/unmute toggle.

- **Zero-Hanging Loading System**:
  - Dedicated `LoadingScreen` with tachometer progress, component pre-warming, and async yield before entering gameplay.
  - Texture singletons and stripe texture caching in `CarGeometry` to avoid redundant 2D canvas creation.
  - Pre-allocated racer array in `RaceEngine` to eliminate garbage collection (GC) pauses during 60 FPS gameplay.

- **Ergonomic, Uninterrupted Touch Controls**:
  - HTML5 PointerCapture API integration so holding steering buttons (`<` and `>`) never cuts out when thumbs slide or roll.
  - Larger touch targets with glowing active visual feedback and haptic vibration (`navigator.vibrate`).
  - **Auto-Throttle Switch**: Casual players can use auto-acceleration and focus on steering + boost; hardcore players can enable dedicated manual Gas and Brake pedals.
  - **Screen-Zone Steering Mode**: Option to touch the left half of the screen to steer left and right half to steer right.

---

## 2. Screens & Features Matching the Visual Reference

1. **Main Menu**:
   - Status bar with time, signal, battery
   - Top player avatar (Lv. 5), coin counter (12,500), gem counter (50)
   - Centered 3D Racing Logo: `SPEED ESCAPE 3D v1.1` with checkered wings
   - Hero desert highway with sports car at sunset
   - Glowing orange **PLAY** CTA button
   - Bottom Navigation: Garage, Career, Events, Settings

2. **Garage**:
   - Header with back and home buttons
   - Interactive 3D Turntable Car Viewer with smooth camera orbit
   - 4-car horizontal carousel (Inferno GT, Thunder Z, Vortex R, Phantom X)
   - Car stats with animated bars: Speed (95), Acceleration (90), Handling (92), Nitro (88)
   - **UPGRADE** Workshop (Engine, Turbo, Tires, Nitro) modifying vehicle behavior
   - **CUSTOMIZE** Studio (Paint colors, Wheel rims, Decals/Stripes, Underglow neon)

3. **Level Select (Career)**:
   - World 1: Desert (unlocked), World 2: City, World 3: Mountains
   - Winding desert canyon road map with circular numbered nodes (1, 2, 3...)
   - Stars earned badges on completed nodes
   - Selected level info card with best time and rewards (+2,000 Coins / +250 XP)

4. **Settings**:
   - Graphics presets: Low, Medium, High, Ultra
   - Frame rate target: 30 FPS, 60 FPS, 90 FPS
   - Procedural Web Audio volume sliders for Sound and Music
   - Steering sensitivity slider & Control type (Tilt, Buttons, Touch, Keyboard)
   - Vibration toggle, Reset to default, and Save confirmation

5. **3D Gameplay**:
   - 3D chase camera with dynamic FOV during nitro boost and collision shake
   - Multi-lane desert highway with guardrails, canyon rocks, cacti, and hot air balloons
   - 5 AI opponent racers with obstacle avoidance and overtaking
   - HUD: POS. 1/6, LAP 1/2, Minimap with real-time racer coordinates, curved NITRO meter, digital speedometer, and timer
   - On-screen touch steering (< >), handbrake drift, and big glowing nitro button
   - Keyboard support: `A`/`D` or Left/Right to steer, `W`/`S` for gas/brake, `Space` for Nitro, `Shift` for Drift, `Esc` to pause

6. **Pause Overlay**:
   - Translucent backdrop over frozen 3D simulation
   - Resume, Restart, Settings, and Exit Race with confirmation guard

7. **Race Completed**:
   - Checkered flags banner, 3 animated gold stars, 1st place trophy
   - Race time, rewards (+2,000 Coins, +250 XP), confetti cannon
   - Next Race and Garage shortcuts

8. **Career Profile**:
   - Driver avatar with Lv. 5 badge and XP progress bar
   - Career records: 32 Races Won, XP, Coins
   - 20 Achievements with gold, silver, bronze medals, and progress trackers

---

## 3. Android Platform & GitHub CI/CD

### Target & Minimum SDK:
- `minSdk = 26` (Android 8.0 Oreo - covers 96%+ of active Android devices)
- `compileSdk = 35` / `targetSdk = 35` (Android 15 - latest Android release)
- Android 15 Edge-to-Edge compliance via `enableEdgeToEdge()` and `WindowInsetsCompat`.
- Display cutout support (`LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`).

### Building APK on Push via GitHub Actions:
The repository includes `.github/workflows/build-apk.yml`. Whenever you push code to GitHub:
1. GitHub Actions automatically checks out the repository.
2. Configures JDK 17 and Android SDK 35 with build-tools 35.0.0.
3. Executes `./gradlew assembleDebug` and `./gradlew testDebugUnitTest`.
4. Produces the installable APK: `app/build/outputs/apk/debug/app-debug.apk`.
5. Uploads the APK as a downloadable artifact in the GitHub repository's **Actions** tab.

### Local APK Build Command:
```bash
./gradlew assembleDebug
```
The resulting APK is generated at:
`app/build/outputs/apk/debug/app-debug.apk`
