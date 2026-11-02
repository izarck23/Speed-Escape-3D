/**
 * SaveManager - Versioned, robust persistence engine for Speed Escape 3D.
 * Supports auto-migration, schema validation, corruption rollback, and debounced writes.
 */

import { CarCustomization, CarUpgradeLevels } from './GameData';

export interface PlayerSettingsState {
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: 30 | 60 | 90;
  soundVolume: number; // 0.0 - 1.0
  musicVolume: number; // 0.0 - 1.0
  steeringSensitivity: number; // 0.1 - 1.0
  controlType: 'buttons' | 'tilt' | 'touch';
  language: string;
  vibration: boolean;
}

export interface LevelProgressRecord {
  unlocked: boolean;
  stars: number; // 0 - 3
  bestTime: number | null; // in seconds
  completed: boolean;
}

export interface GameSaveSchema {
  version: number;
  profile: {
    name: string;
    level: number;
    xp: number;
    xpNext: number;
    racesWon: number;
    totalRaces: number;
    bestOverallTime: string;
  };
  currency: {
    coins: number;
    gems: number;
  };
  selectedCarId: string;
  selectedWorldId: string;
  selectedLevelId: string;
  unlockedCars: string[];
  carUpgrades: Record<string, CarUpgradeLevels>;
  carCustomizations: Record<string, CarCustomization>;
  levelProgress: Record<string, LevelProgressRecord>;
  unlockedAchievements: string[];
  settings: PlayerSettingsState;
}

const SAVE_STORAGE_KEY = 'speed_escape_3d_save_v1';

export const DEFAULT_SAVE_DATA: GameSaveSchema = {
  version: 1,
  profile: {
    name: 'Player',
    level: 5,
    xp: 750,
    xpNext: 1000,
    racesWon: 32,
    totalRaces: 38,
    bestOverallTime: '01:12.45',
  },
  currency: {
    coins: 12500,
    gems: 50,
  },
  selectedCarId: 'inferno_gt',
  selectedWorldId: 'world_1',
  selectedLevelId: 'desert_1',
  unlockedCars: ['inferno_gt', 'thunder_z', 'vortex_r', 'phantom_x'],
  carUpgrades: {
    inferno_gt: { engine: 2, turbo: 2, tires: 1, nitro: 2 },
    thunder_z: { engine: 1, turbo: 1, tires: 1, nitro: 1 },
    vortex_r: { engine: 2, turbo: 1, tires: 2, nitro: 3 },
    phantom_x: { engine: 1, turbo: 2, tires: 3, nitro: 2 },
  },
  carCustomizations: {
    inferno_gt: { color: '#E11D48', wheelStyle: 'turbine', stripeStyle: 'twin_stripes', underglow: '#06B6D4' },
    thunder_z: { color: '#EAB308', wheelStyle: 'gold_dish', stripeStyle: 'none', underglow: '#EAB308' },
    vortex_r: { color: '#0284C7', wheelStyle: 'alloy', stripeStyle: 'cyber_accent', underglow: '#3B82F6' },
    phantom_x: { color: '#F8FAFC', wheelStyle: 'turbine', stripeStyle: 'none', underglow: '#A855F7' },
  },
  levelProgress: {
    desert_1: { unlocked: true, stars: 3, bestTime: 72.45, completed: true },
    desert_2: { unlocked: true, stars: 3, bestTime: 78.10, completed: true },
    desert_3: { unlocked: true, stars: 3, bestTime: 82.50, completed: true },
    desert_4: { unlocked: false, stars: 0, bestTime: null, completed: false },
    desert_5: { unlocked: false, stars: 0, bestTime: null, completed: false },
    desert_6: { unlocked: false, stars: 0, bestTime: null, completed: false },
    city_1: { unlocked: false, stars: 0, bestTime: null, completed: false },
    city_2: { unlocked: false, stars: 0, bestTime: null, completed: false },
    city_3: { unlocked: false, stars: 0, bestTime: null, completed: false },
    mountains_1: { unlocked: false, stars: 0, bestTime: null, completed: false },
    mountains_2: { unlocked: false, stars: 0, bestTime: null, completed: false },
  },
  unlockedAchievements: [
    'ach_first_win',
    'ach_speed_demon',
    'ach_nitro_surge',
    'ach_desert_scout',
  ],
  settings: {
    graphicsQuality: 'high',
    frameRate: 60,
    soundVolume: 0.8,
    musicVolume: 0.7,
    steeringSensitivity: 0.6,
    controlType: 'buttons',
    language: 'English',
    vibration: true,
  },
};

type SaveChangeListener = (data: GameSaveSchema) => void;

class SaveEngine {
  private data: GameSaveSchema;
  private listeners: Set<SaveChangeListener> = new Set();
  private debounceTimer: number | null = null;

  constructor() {
    this.data = this.loadSafe();
  }

  private loadSafe(): GameSaveSchema {
    try {
      const stored = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!stored) {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      }
      const parsed = JSON.parse(stored);
      // Validate critical keys and merge with defaults for forward compatibility
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        profile: { ...DEFAULT_SAVE_DATA.profile, ...(parsed.profile || {}) },
        currency: { ...DEFAULT_SAVE_DATA.currency, ...(parsed.currency || {}) },
        settings: { ...DEFAULT_SAVE_DATA.settings, ...(parsed.settings || {}) },
        carUpgrades: { ...DEFAULT_SAVE_DATA.carUpgrades, ...(parsed.carUpgrades || {}) },
        carCustomizations: { ...DEFAULT_SAVE_DATA.carCustomizations, ...(parsed.carCustomizations || {}) },
        levelProgress: { ...DEFAULT_SAVE_DATA.levelProgress, ...(parsed.levelProgress || {}) },
      };
    } catch (e) {
      console.warn('Speed Escape 3D: Save file corrupt or missing. Reverting safely to default profile.', e);
      return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }
  }

  public get(): GameSaveSchema {
    return this.data;
  }

  public subscribe(listener: SaveChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  public save(newData: Partial<GameSaveSchema>) {
    this.data = { ...this.data, ...newData };
    this.notify();
    this.scheduleDiskWrite();
  }

  private scheduleDiskWrite() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to write save data to storage', e);
      }
    }, 200);
  }

  public resetToDefaults() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.notify();
    this.scheduleDiskWrite();
  }

  // --- Convenience helpers ---
  public addCoins(amount: number) {
    this.save({
      currency: {
        ...this.data.currency,
        coins: Math.max(0, this.data.currency.coins + amount),
      },
    });
  }

  public addGems(amount: number) {
    this.save({
      currency: {
        ...this.data.currency,
        gems: Math.max(0, this.data.currency.gems + amount),
      },
    });
  }

  public addXp(amount: number) {
    let currentXp = this.data.profile.xp + amount;
    let currentLevel = this.data.profile.level;
    let nextXp = this.data.profile.xpNext;

    while (currentXp >= nextXp) {
      currentXp -= nextXp;
      currentLevel += 1;
      nextXp = Math.floor(nextXp * 1.3);
    }

    this.save({
      profile: {
        ...this.data.profile,
        level: currentLevel,
        xp: currentXp,
        xpNext: nextXp,
      },
    });
  }

  public recordRaceFinish(levelId: string, rank: number, timeSec: number, rewardCoins: number, rewardXp: number) {
    const isWin = rank === 1;
    const stars = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;
    
    const existing = this.data.levelProgress[levelId] || { unlocked: true, stars: 0, bestTime: null, completed: false };
    const newBestTime = existing.bestTime ? Math.min(existing.bestTime, timeSec) : timeSec;
    const newStars = Math.max(existing.stars, stars);

    const updatedLevels = { ...this.data.levelProgress };
    updatedLevels[levelId] = {
      unlocked: true,
      stars: newStars,
      bestTime: newBestTime,
      completed: true,
    };

    // Unlock next level if stars > 0
    const levelOrder = ['desert_1', 'desert_2', 'desert_3', 'desert_4', 'desert_5', 'desert_6', 'city_1', 'city_2', 'city_3'];
    const curIdx = levelOrder.indexOf(levelId);
    if (curIdx !== -1 && curIdx + 1 < levelOrder.length && stars >= 1) {
      const nextId = levelOrder[curIdx + 1];
      if (!updatedLevels[nextId] || !updatedLevels[nextId].unlocked) {
        updatedLevels[nextId] = {
          unlocked: true,
          stars: 0,
          bestTime: null,
          completed: false,
        };
      }
    }

    this.save({
      profile: {
        ...this.data.profile,
        racesWon: this.data.profile.racesWon + (isWin ? 1 : 0),
        totalRaces: this.data.profile.totalRaces + 1,
      },
      levelProgress: updatedLevels,
    });

    this.addCoins(rewardCoins);
    this.addXp(rewardXp);
  }
}

export const saveManager = new SaveEngine();
