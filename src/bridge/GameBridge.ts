/**
 * GameBridge - Decoupled, thread-safe communication layer between
 * React UI (HUD, Overlays, Dialogs) and the 3D Game Engine.
 */

export interface GameTelemetrySnapshot {
  speedKmh: number;
  nitroPercent: number; // 0 - 100
  isNitroActive: boolean;
  isDrifting: boolean;
  currentLap: number;
  totalLaps: number;
  position: number;     // 1 - 6
  totalRacers: number;
  elapsedTimeSec: number;
  countdown: number;    // 3, 2, 1, 0 (GO), -1 (race started)
  isWrongWay: boolean;
  isFinished: boolean;
  finishRank: number;
  raceTimeFormatted: string;
  playerProgressT: number; // 0.0 - 1.0 along the track
  aiProgressList: number[];
}

export interface GameInputState {
  steerLeft: boolean;
  steerRight: boolean;
  accelerate: boolean;
  brake: boolean;
  nitro: boolean;
  drift: boolean;
  analogSteer: number; // -1.0 to 1.0 (for tilt or touch dragging)
}

export type GameEventListener = (event: { type: string; payload?: unknown }) => void;

class BridgeEngine {
  private inputState: GameInputState = {
    steerLeft: false,
    steerRight: false,
    accelerate: true, // Default arcade auto-throttle unless braking
    brake: false,
    nitro: false,
    drift: false,
    analogSteer: 0,
  };

  private snapshot: GameTelemetrySnapshot = {
    speedKmh: 0,
    nitroPercent: 100,
    isNitroActive: false,
    isDrifting: false,
    currentLap: 1,
    totalLaps: 2,
    position: 1,
    totalRacers: 6,
    elapsedTimeSec: 0,
    countdown: 3,
    isWrongWay: false,
    isFinished: false,
    finishRank: 1,
    raceTimeFormatted: '00:00.00',
    playerProgressT: 0,
    aiProgressList: [0, 0, 0, 0, 0],
  };

  private listeners: Set<GameEventListener> = new Set();
  private telemetryCallbacks: Set<(snap: GameTelemetrySnapshot) => void> = new Set();

  public getInput(): GameInputState {
    return this.inputState;
  }

  public setInput(input: Partial<GameInputState>) {
    this.inputState = { ...this.inputState, ...input };
  }

  public publishTelemetry(snap: GameTelemetrySnapshot) {
    this.snapshot = snap;
    this.telemetryCallbacks.forEach(fn => fn(snap));
  }

  public getSnapshot(): GameTelemetrySnapshot {
    return this.snapshot;
  }

  public subscribeTelemetry(cb: (snap: GameTelemetrySnapshot) => void): () => void {
    this.telemetryCallbacks.add(cb);
    return () => this.telemetryCallbacks.delete(cb);
  }

  public emit(type: string, payload?: unknown) {
    this.listeners.forEach(fn => fn({ type, payload }));
  }

  public on(cb: GameEventListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const gameBridge = new BridgeEngine();
