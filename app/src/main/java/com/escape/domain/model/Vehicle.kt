package com.escape.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class VehicleStats(
    val speed: Int,        // 0 - 100
    val acceleration: Int, // 0 - 100
    val handling: Int,     // 0 - 100
    val nitro: Int         // 0 - 100
)

@Serializable
data class VehicleCustomization(
    val colorHex: String,
    val wheelStyle: String,
    val stripeStyle: String,
    val underglowHex: String
)

@Serializable
data class VehicleUpgradeLevels(
    val engine: Int = 0,
    val turbo: Int = 0,
    val tires: Int = 0,
    val nitro: Int = 0
)

@Serializable
data class Vehicle(
    val id: String,
    val name: String,
    val subtitle: String,
    val rarity: String,
    val baseStats: VehicleStats,
    val baseColor: String,
    val costCoins: Int,
    val isUnlocked: Boolean
)
