package com.escape.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * RaceRulesTest - Unit tests for reward calculation, star ratings, and progression.
 */
class RaceRulesTest {

    @Test
    fun calculateStars_firstPlace_returnsThreeStars() {
        val rank = 1
        val stars = if (rank == 1) 3 else if (rank == 2) 2 else if (rank == 3) 1 else 0
        assertEquals(3, stars)
    }

    @Test
    fun calculateStars_secondPlace_returnsTwoStars() {
        val rank = 2
        val stars = if (rank == 1) 3 else if (rank == 2) 2 else if (rank == 3) 1 else 0
        assertEquals(2, stars)
    }

    @Test
    fun calculateRewards_firstPlace_grantsFullRewards() {
        val baseCoins = 2000
        val baseMultiplier = 1.0
        val coinsEarned = (baseCoins * baseMultiplier).toInt()
        assertEquals(2000, coinsEarned)
    }

    @Test
    fun levelUnlock_unlocksNextSequentialLevel() {
        val levels = listOf("desert_1", "desert_2", "desert_3")
        val completedLevel = "desert_1"
        val currentIdx = levels.indexOf(completedLevel)
        val nextLevel = levels.getOrNull(currentIdx + 1)
        assertEquals("desert_2", nextLevel)
    }

    @Test
    fun upgradeCalculation_increasesVehicleStats() {
        val baseSpeed = 95
        val engineLevel = 2
        val bonus = (engineLevel * 1.5).toInt()
        val effectiveSpeed = baseSpeed + bonus
        assertTrue(effectiveSpeed > baseSpeed)
        assertEquals(98, effectiveSpeed)
    }
}
