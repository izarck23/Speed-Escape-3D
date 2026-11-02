package com.escape

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.escape.bridge.GameUiBridge

/**
 * MainActivity - Primary Activity hosting the Jetpack Compose HUD / Menus
 * alongside the underlying 3D Game Engine View with full support up to Android 15 (API 35).
 */
class MainActivity : ComponentActivity() {

    private val gameBridge = GameUiBridge.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        configureImmersiveMode()
    }

    private fun configureImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Support display cutouts on Android 9+ / Android 15
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
    }

    override fun onResume() {
        super.onResume()
        gameBridge.onResume()
    }

    override fun onPause() {
        super.onPause()
        gameBridge.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        gameBridge.onDestroy()
    }
}
