package com.escape.bridge

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class GameTelemetry(
    val speedKmh: Int = 0,
    val nitroPercent: Int = 100,
    val currentLap: Int = 1,
    val totalLaps: Int = 2,
    val position: Int = 1,
    val totalRacers: Int = 6,
    val raceTimeSec: Float = 0f,
    val isPaused: Boolean = false,
    val isFinished: Boolean = false
)

data class GameInput(
    val steerLeft: Boolean = false,
    val steerRight: Boolean = false,
    val accelerate: Boolean = true,
    val brake: Boolean = false,
    val nitro: Boolean = false,
    val drift: Boolean = false,
    val analogSteer: Float = 0f
)

class GameUiBridge private constructor() {

    private val _telemetry = MutableStateFlow(GameTelemetry())
    val telemetry: StateFlow<GameTelemetry> = _telemetry.asStateFlow()

    private val _input = MutableStateFlow(GameInput())
    val input: StateFlow<GameInput> = _input.asStateFlow()

    fun updateTelemetry(snapshot: GameTelemetry) {
        _telemetry.value = snapshot
    }

    fun sendInput(newInput: GameInput) {
        _input.value = newInput
    }

    fun onResume() {
        // Resume LibGDX render loop
    }

    fun onPause() {
        // Pause LibGDX render loop & audio
    }

    fun onDestroy() {
        // Dispose GL resources
    }

    companion object {
        @Volatile
        private var instance: GameUiBridge? = null

        fun getInstance(): GameUiBridge =
            instance ?: synchronized(this) {
                instance ?: GameUiBridge().also { instance = it }
            }
    }
}
