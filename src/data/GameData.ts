/**
 * GameData - Definitions for cars, worlds, levels, achievements, and upgrades.
 */

export interface CarStats {
  speed: number;        // e.g. 95 (max km/h ~ 250)
  acceleration: number; // e.g. 90 (0-100 time)
  handling: number;     // e.g. 92 (steering sharpness)
  nitro: number;        // e.g. 88 (boost strength & refill rate)
}

export interface CarCustomization {
  color: string;         // Hex code
  wheelStyle: 'stock' | 'turbine' | 'alloy' | 'gold_dish';
  stripeStyle: 'none' | 'twin_stripes' | 'cyber_accent' | 'racing_num';
  underglow: string;     // Hex code or 'off'
}

export interface CarUpgradeLevels {
  engine: number;       // Level 0-5
  turbo: number;        // Level 0-5
  tires: number;        // Level 0-5
  nitro: number;        // Level 0-5
}

export interface CarModel {
  id: string;
  name: string;
  subtitle: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  baseStats: CarStats;
  baseColor: string;
  cost: number;
  unlocked: boolean;
  accentColor: string;
}

export const CARS_DATA: CarModel[] = [
  {
    id: 'inferno_gt',
    name: 'Inferno GT',
    subtitle: 'V10 Twin-Turbo Mid-Engine',
    rarity: 'Legendary',
    baseStats: { speed: 95, acceleration: 90, handling: 92, nitro: 88 },
    baseColor: '#E11D48', // Vibrant Racing Red
    accentColor: '#FB7185',
    cost: 0,
    unlocked: true,
  },
  {
    id: 'thunder_z',
    name: 'Thunder Z',
    subtitle: 'V8 Supercharged Aerofoil',
    rarity: 'Epic',
    baseStats: { speed: 92, acceleration: 94, handling: 89, nitro: 90 },
    baseColor: '#EAB308', // Solar Gold/Yellow
    accentColor: '#FDE047',
    cost: 15000,
    unlocked: true,
  },
  {
    id: 'vortex_r',
    name: 'Vortex R',
    subtitle: 'Quad-Motor Electric Hypercar',
    rarity: 'Epic',
    baseStats: { speed: 97, acceleration: 92, handling: 88, nitro: 95 },
    baseColor: '#0284C7', // Electric Blue
    accentColor: '#38BDF8',
    cost: 25000,
    unlocked: true,
  },
  {
    id: 'phantom_x',
    name: 'Phantom X',
    subtitle: 'Ultra-Lightweight Carbon Prototype',
    rarity: 'Legendary',
    baseStats: { speed: 94, acceleration: 88, handling: 96, nitro: 91 },
    baseColor: '#F8FAFC', // Pearl White
    accentColor: '#94A3B8',
    cost: 35000,
    unlocked: true,
  },
];

export interface LevelInfo {
  id: string;
  number: number;
  name: string;
  laps: number;
  rivalsCount: number;
  targetTimeSec: number;
  rewardCoins: number;
  rewardXp: number;
  unlocked: boolean;
  stars: number;
  bestTime: number | null; // seconds
}

export interface WorldInfo {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  levels: LevelInfo[];
}

export const WORLDS_DATA: WorldInfo[] = [
  {
    id: 'world_1',
    name: 'World 1\nDesert',
    description: 'Blazing canyon straights, red rock hairpins, and sunset speed traps.',
    unlocked: true,
    levels: [
      { id: 'desert_1', number: 1, name: 'Desert Run', laps: 2, rivalsCount: 5, targetTimeSec: 102.45, rewardCoins: 2000, rewardXp: 250, unlocked: true, stars: 3, bestTime: 72.45 },
      { id: 'desert_2', number: 2, name: 'Canyon Dash', laps: 2, rivalsCount: 5, targetTimeSec: 98.20, rewardCoins: 2200, rewardXp: 280, unlocked: true, stars: 3, bestTime: 78.10 },
      { id: 'desert_3', number: 3, name: 'Sunset Highway', laps: 2, rivalsCount: 5, targetTimeSec: 105.00, rewardCoins: 2500, rewardXp: 300, unlocked: true, stars: 3, bestTime: 82.50 },
      { id: 'desert_4', number: 4, name: 'Dune Storm', laps: 2, rivalsCount: 5, targetTimeSec: 110.00, rewardCoins: 2800, rewardXp: 320, unlocked: false, stars: 0, bestTime: null },
      { id: 'desert_5', number: 5, name: 'Oasis Sprint', laps: 3, rivalsCount: 5, targetTimeSec: 140.00, rewardCoins: 3200, rewardXp: 360, unlocked: false, stars: 0, bestTime: null },
      { id: 'desert_6', number: 6, name: 'Canyon Grand Prix', laps: 3, rivalsCount: 5, targetTimeSec: 155.00, rewardCoins: 4000, rewardXp: 450, unlocked: false, stars: 0, bestTime: null },
    ],
  },
  {
    id: 'world_2',
    name: 'World 2\nCity',
    description: 'Neon skyscrapers, underground tunnels, and elevated expressways.',
    unlocked: false,
    levels: [
      { id: 'city_1', number: 1, name: 'Downtown Rush', laps: 2, rivalsCount: 5, targetTimeSec: 95.00, rewardCoins: 3500, rewardXp: 400, unlocked: false, stars: 0, bestTime: null },
      { id: 'city_2', number: 2, name: 'Neon Boulevard', laps: 2, rivalsCount: 5, targetTimeSec: 100.00, rewardCoins: 3800, rewardXp: 420, unlocked: false, stars: 0, bestTime: null },
      { id: 'city_3', number: 3, name: 'Overpass Drift', laps: 2, rivalsCount: 5, targetTimeSec: 108.00, rewardCoins: 4200, rewardXp: 460, unlocked: false, stars: 0, bestTime: null },
    ],
  },
  {
    id: 'world_3',
    name: 'World 3\nMountains',
    description: 'High-altitude switchbacks, cliffside drops, and alpine mist.',
    unlocked: false,
    levels: [
      { id: 'mountains_1', number: 1, name: 'Alpine Climb', laps: 2, rivalsCount: 5, targetTimeSec: 115.00, rewardCoins: 5000, rewardXp: 500, unlocked: false, stars: 0, bestTime: null },
      { id: 'mountains_2', number: 2, name: 'Ridge Runner', laps: 2, rivalsCount: 5, targetTimeSec: 120.00, rewardCoins: 5500, rewardXp: 550, unlocked: false, stars: 0, bestTime: null },
    ],
  },
];

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  tier: 'gold' | 'silver' | 'bronze';
  unlocked: boolean;
  rewardCoins: number;
}

export const ACHIEVEMENTS_DATA: AchievementItem[] = [
  { id: 'ach_first_win', title: 'First Victory', description: 'Win your very first arcade race in 1st place.', tier: 'gold', unlocked: true, rewardCoins: 1000 },
  { id: 'ach_speed_demon', title: 'Speed Demon', description: 'Reach a top speed of 220 KM/H on the highway.', tier: 'gold', unlocked: true, rewardCoins: 1500 },
  { id: 'ach_nitro_surge', title: 'Nitro Surge', description: 'Drain an entire tank of Nitro in a single continuous boost.', tier: 'silver', unlocked: true, rewardCoins: 800 },
  { id: 'ach_desert_scout', title: 'Desert Scout', description: 'Complete 3 races across Desert Canyon.', tier: 'bronze', unlocked: true, rewardCoins: 500 },
  { id: 'ach_drift_master', title: 'Drift Master', description: 'Perform a continuous drift of over 200 meters.', tier: 'silver', unlocked: false, rewardCoins: 1200 },
  { id: 'ach_clean_racer', title: 'Flawless Run', description: 'Finish a race without colliding with any road barriers.', tier: 'gold', unlocked: false, rewardCoins: 2000 },
  { id: 'ach_garage_tuning', title: 'Tuning Specialist', description: 'Upgrade any vehicle system to maximum level 5.', tier: 'silver', unlocked: false, rewardCoins: 1500 },
  { id: 'ach_neon_nights', title: 'Underglow Stylist', description: 'Customize your car with vibrant neon underglow.', tier: 'bronze', unlocked: false, rewardCoins: 600 },
  { id: 'ach_champion_cup', title: 'Career Master', description: 'Accumulate 10 total race victories in Career mode.', tier: 'gold', unlocked: false, rewardCoins: 3000 },
  { id: 'ach_overtake_king', title: 'Overtake King', description: 'Pass 4 AI opponents in a single lap.', tier: 'silver', unlocked: false, rewardCoins: 1000 },
  { id: 'ach_lap_record', title: 'Lap Record Breaker', description: 'Set a lap time under 35 seconds.', tier: 'gold', unlocked: false, rewardCoins: 2500 },
  { id: 'ach_collector', title: 'Garage Mogul', description: 'Own all 4 high-performance supercars.', tier: 'gold', unlocked: false, rewardCoins: 5000 },
];
