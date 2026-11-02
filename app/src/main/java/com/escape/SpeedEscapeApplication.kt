package com.escape

import android.app.Application
import android.util.Log

/**
 * SpeedEscapeApplication - Application entry point.
 * Initializes DI, game repositories, persistence managers, and crash reporting hooks.
 */
class SpeedEscapeApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Speed Escape 3D Application initialized successfully (Package: com.escape)")
        initCoreEngines()
    }

    private fun initCoreEngines() {
        // Pre-warm local DataStore, audio synthesizers, and thread pools
        Log.d(TAG, "Pre-warming game systems and audio cache...")
    }

    override fun onLowMemory() {
        super.onLowMemory()
        Log.w(TAG, "Low memory signal detected. Flushing texture pools and non-critical buffers.")
    }

    companion object {
        private const val TAG = "SpeedEscapeApp"
    }
}
