import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, Play, RotateCcw, Settings, LogOut, ChevronLeft, ChevronRight, Zap, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { RaceEngine } from '../../game/engine/RaceEngine';
import { gameBridge, GameTelemetrySnapshot } from '../../bridge/GameBridge';
import { soundManager } from '../../audio/SoundManager';
import { LevelInfo } from '../../data/GameData';
import { saveManager } from '../../data/SaveManager';

interface GameplayScreenProps {
  level: LevelInfo;
  onExitRace: () => void;
  onRestartRace: () => void;
  onOpenSettings: () => void;
  onRaceCompleted: (result: { rank: number; timeSec: number; coins: number; xp: number }) => void;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  level,
  onExitRace,
  onRestartRace,
  onOpenSettings,
  onRaceCompleted,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RaceEngine | null>(null);

  const [telemetry, setTelemetry] = useState<GameTelemetrySnapshot>(gameBridge.getSnapshot());
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  // Control modes & settings
  const save = saveManager.get();
  const [autoThrottle, setAutoThrottle] = useState(true);
  const [touchSteerMode, setTouchSteerMode] = useState<'buttons' | 'screen_zones'>('buttons');

  // Active button press states for visual feedback
  const [pressingLeft, setPressingLeft] = useState(false);
  const [pressingRight, setPressingRight] = useState(false);
  const [pressingGas, setPressingGas] = useState(false);
  const [pressingBrake, setPressingBrake] = useState(false);
  const [pressingNitro, setPressingNitro] = useState(false);
  const [pressingDrift, setPressingDrift] = useState(false);

  // Initialize 3D Race Simulation
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    soundManager.playMusic('race');
    const engine = new RaceEngine(container, level);
    engineRef.current = engine;
    engine.start();

    const unsubTelemetry = gameBridge.subscribeTelemetry(snap => {
      setTelemetry({ ...snap });
    });

    const unsubEvents = gameBridge.on(evt => {
      if (evt.type === 'race_finished') {
        const payload = evt.payload as { rank: number; timeSec: number; coins: number; xp: number };
        onRaceCompleted(payload);
      }
    });

    return () => {
      unsubTelemetry();
      unsubEvents();
      engine.dispose();
      engineRef.current = null;
      soundManager.stopMusic();
    };
  }, [level]);

  // Haptic feedback helper
  const triggerHaptic = (ms = 12) => {
    if (save.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) {
        if (e.key === 'Escape') setIsPaused(false);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameBridge.setInput({ steerLeft: true });
        setPressingLeft(true);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameBridge.setInput({ steerRight: true });
        setPressingRight(true);
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        gameBridge.setInput({ accelerate: true });
        setPressingGas(true);
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        gameBridge.setInput({ brake: true });
        setPressingBrake(true);
      }
      if (e.key === ' ' || e.key === 'n' || e.key === 'N') {
        gameBridge.setInput({ nitro: true });
        setPressingNitro(true);
      }
      if (e.key === 'Shift' || e.key === 'c' || e.key === 'C') {
        gameBridge.setInput({ drift: true });
        setPressingDrift(true);
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        handlePauseToggle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameBridge.setInput({ steerLeft: false });
        setPressingLeft(false);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameBridge.setInput({ steerRight: false });
        setPressingRight(false);
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        gameBridge.setInput({ accelerate: autoThrottle });
        setPressingGas(false);
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        gameBridge.setInput({ brake: false });
        setPressingBrake(false);
      }
      if (e.key === ' ' || e.key === 'n' || e.key === 'N') {
        gameBridge.setInput({ nitro: false });
        setPressingNitro(false);
      }
      if (e.key === 'Shift' || e.key === 'c' || e.key === 'C') {
        gameBridge.setInput({ drift: false });
        setPressingDrift(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused, autoThrottle]);

  const handlePauseToggle = () => {
    soundManager.playClick();
    if (!isPaused) {
      engineRef.current?.pause();
      setIsPaused(true);
    } else {
      engineRef.current?.resume();
      setIsPaused(false);
    }
  };

  const handleMuteToggle = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    soundManager.playClick();
  };

  // Robust Pointer Handlers with PointerCapture for uninterrupted steering
  const handlePointerDownSteerLeft = (e: React.PointerEvent<HTMLButtonElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    gameBridge.setInput({ steerLeft: true });
    setPressingLeft(true);
    triggerHaptic(10);
  };

  const handlePointerUpSteerLeft = (e: React.PointerEvent<HTMLButtonElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    gameBridge.setInput({ steerLeft: false });
    setPressingLeft(false);
  };

  const handlePointerDownSteerRight = (e: React.PointerEvent<HTMLButtonElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    gameBridge.setInput({ steerRight: true });
    setPressingRight(true);
    triggerHaptic(10);
  };

  const handlePointerUpSteerRight = (e: React.PointerEvent<HTMLButtonElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    gameBridge.setInput({ steerRight: false });
    setPressingRight(false);
  };

  // Screen-Zone Steering (Touch left half to turn left, right half to turn right)
  const handleZoneTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (touchSteerMode !== 'screen_zones') return;
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : ('clientX' in e ? e.clientX : 0);
    const mid = window.innerWidth / 2;
    if (clientX < mid) {
      gameBridge.setInput({ steerLeft: true, steerRight: false });
      setPressingLeft(true);
      setPressingRight(false);
    } else {
      gameBridge.setInput({ steerRight: true, steerLeft: false });
      setPressingRight(true);
      setPressingLeft(false);
    }
  }, [touchSteerMode]);

  const handleZoneEnd = useCallback(() => {
    if (touchSteerMode !== 'screen_zones') return;
    gameBridge.setInput({ steerLeft: false, steerRight: false });
    setPressingLeft(false);
    setPressingRight(false);
  }, [touchSteerMode]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none touch-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Screen-Zone Steering Overlay (If enabled) */}
      {touchSteerMode === 'screen_zones' && (
        <div
          className="absolute inset-0 z-0 flex pointer-events-auto"
          onTouchStart={handleZoneTouch}
          onTouchMove={handleZoneTouch}
          onTouchEnd={handleZoneEnd}
          onTouchCancel={handleZoneEnd}
        >
          <div className={`flex-1 transition-colors ${pressingLeft ? 'bg-amber-500/10' : ''}`} />
          <div className={`flex-1 transition-colors ${pressingRight ? 'bg-amber-500/10' : ''}`} />
        </div>
      )}

      {/* ARCADE HUD OVERLAY */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-4 pointer-events-none">
        {/* Top HUD Cluster */}
        <div className="flex items-start justify-between w-full">
          {/* Top-Left: Position & Lap indicator */}
          <div className="flex flex-col bg-black/75 border border-white/20 backdrop-blur-md rounded-2xl px-3.5 py-2 pointer-events-auto shadow-2xl">
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] font-racing font-bold text-slate-400">POS.</span>
              <span className="font-racing font-black text-2xl text-white italic">
                {telemetry.position}
                <span className="text-xs text-slate-400 font-normal">/{telemetry.totalRacers}</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[10px] font-racing font-bold text-slate-400">LAP</span>
              <span className="font-racing font-bold text-xs text-amber-400">
                {telemetry.currentLap}/{telemetry.totalLaps}
              </span>
            </div>
          </div>

          {/* Top-Center: Curved Glowing NITRO Meter */}
          <div className="flex flex-col items-center pointer-events-auto">
            <div className="flex items-center gap-2 bg-black/75 border border-cyan-400/50 rounded-full px-4 py-1.5 shadow-xl glow-blue backdrop-blur-md">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400 animate-pulse" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-racing font-bold tracking-widest text-cyan-400 uppercase">
                  NITRO
                </span>
                <div className="w-28 sm:w-36 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-cyan-400/30">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-200 rounded-full transition-all duration-100"
                    style={{ width: `${telemetry.nitroPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Steering Mode & Auto-Throttle Pills */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => {
                  setAutoThrottle(!autoThrottle);
                  gameBridge.setInput({ accelerate: !autoThrottle });
                  soundManager.playClick();
                }}
                className={`px-2 py-0.5 rounded-full text-[9px] font-racing font-bold uppercase transition-all shadow pointer-events-auto cursor-pointer border ${
                  autoThrottle
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-black/60 text-slate-400 border-white/10'
                }`}
              >
                Auto-Gas: {autoThrottle ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => {
                  setTouchSteerMode(touchSteerMode === 'buttons' ? 'screen_zones' : 'buttons');
                  soundManager.playClick();
                }}
                className="px-2 py-0.5 rounded-full text-[9px] font-racing font-bold uppercase bg-black/60 text-slate-300 border border-white/10 shadow pointer-events-auto cursor-pointer"
              >
                Steer: {touchSteerMode === 'buttons' ? 'Arrows' : 'Zones'}
              </button>
            </div>
          </div>

          {/* Top-Right: Speedometer & Timer & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Speedometer & Timer cluster */}
            <div className="flex flex-col items-end bg-black/75 border border-white/20 backdrop-blur-md rounded-2xl px-3 sm:px-4 py-2 shadow-2xl">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-racing font-bold text-slate-400">KM/H</span>
                <span className="font-racing font-black text-2xl sm:text-3xl text-amber-400 italic">
                  {telemetry.speedKmh}
                </span>
              </div>
              <span className="text-xs font-mono-numbers font-bold text-slate-200 mt-0.5">
                ⏱ {telemetry.raceTimeFormatted}
              </span>
            </div>

            {/* Audio Mute Button */}
            <button
              onClick={handleMuteToggle}
              className="p-2.5 rounded-xl bg-black/75 border border-white/20 hover:bg-black/90 active:scale-95 text-white transition-all cursor-pointer shadow-lg"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
            </button>

            {/* Pause Button */}
            <button
              onClick={handlePauseToggle}
              className="p-2.5 rounded-xl bg-black/75 border border-white/20 hover:bg-black/90 active:scale-95 text-white transition-all cursor-pointer shadow-lg"
            >
              <Pause className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Center: Race Countdown Animation (3, 2, 1, GO!) */}
        {telemetry.countdown >= 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="font-racing font-black text-7xl sm:text-8xl italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 drop-shadow-[0_8px_24px_rgba(245,158,11,0.8)] text-stroke-thick scale-125 transition-transform duration-300">
              {telemetry.countdown > 0 ? telemetry.countdown : 'GO!'}
            </div>
          </div>
        )}

        {/* Middle-Left: Minimap Track */}
        <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-black/60 border border-white/15 rounded-2xl p-2 pointer-events-auto shadow-xl backdrop-blur-sm self-start my-auto">
          <svg className="w-full h-full" viewBox="0 0 100 120">
            <path
              d="M 50 15 C 80 15 88 45 80 75 C 72 105 30 110 20 85 C 10 60 20 15 50 15"
              fill="none"
              stroke="#334155"
              strokeWidth="6"
            />
            <line x1="45" y1="12" x2="55" y2="18" stroke="#f59e0b" strokeWidth="3" />
            {telemetry.aiProgressList.map((prog, idx) => {
              const angle = prog * Math.PI * 2;
              const cx = 50 + Math.cos(angle) * 30;
              const cy = 60 + Math.sin(angle) * 40;
              return <circle key={idx} cx={cx} cy={cy} r="3" fill="#eab308" />;
            })}
            {(() => {
              const angle = telemetry.playerProgressT * Math.PI * 2;
              const cx = 50 + Math.cos(angle) * 30;
              const cy = 60 + Math.sin(angle) * 40;
              return <circle cx={cx} cy={cy} r="5" fill="#e11d48" stroke="#38bdf8" strokeWidth="1.5" />;
            })()}
          </svg>
          <div className="text-[8px] sm:text-[9px] font-racing font-bold text-center text-slate-400 uppercase">
            Minimap
          </div>
        </div>

        {/* Bottom On-Screen Controls */}
        <div className="flex items-end justify-between w-full pointer-events-auto pb-1 sm:pb-2">
          {/* Left Controls: Steering Buttons with uninterrupted PointerCapture */}
          {touchSteerMode === 'buttons' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Steer Left */}
              <button
                onPointerDown={handlePointerDownSteerLeft}
                onPointerUp={handlePointerUpSteerLeft}
                onPointerCancel={handlePointerUpSteerLeft}
                className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full border-2 flex items-center justify-center active:scale-95 transition-all shadow-2xl backdrop-blur-md cursor-pointer ${
                  pressingLeft
                    ? 'bg-amber-500 border-yellow-300 text-black glow-orange scale-105'
                    : 'bg-black/75 border-white/25 text-white'
                }`}
              >
                <ChevronLeft className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
              </button>

              {/* Steer Right */}
              <button
                onPointerDown={handlePointerDownSteerRight}
                onPointerUp={handlePointerUpSteerRight}
                onPointerCancel={handlePointerUpSteerRight}
                className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full border-2 flex items-center justify-center active:scale-95 transition-all shadow-2xl backdrop-blur-md cursor-pointer ${
                  pressingRight
                    ? 'bg-amber-500 border-yellow-300 text-black glow-orange scale-105'
                    : 'bg-black/75 border-white/25 text-white'
                }`}
              >
                <ChevronRight className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-[10px] font-racing text-slate-300">
              👈 Tap Left to Steer | Tap Right 👉
            </div>
          )}

          {/* Right Controls: Gas/Brake (if manual), Drift, and NITRO */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Manual Gas & Brake pedals if Auto-Throttle is OFF */}
            {!autoThrottle && (
              <div className="flex items-center gap-1.5">
                {/* Brake */}
                <button
                  onPointerDown={(e) => {
                    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                    gameBridge.setInput({ brake: true });
                    setPressingBrake(true);
                  }}
                  onPointerUp={(e) => {
                    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                    gameBridge.setInput({ brake: false });
                    setPressingBrake(false);
                  }}
                  className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl cursor-pointer ${
                    pressingBrake
                      ? 'bg-red-600 border-red-300 text-white'
                      : 'bg-black/75 border-white/25 text-red-400'
                  }`}
                >
                  <span className="text-[10px] font-racing font-black">BRAKE</span>
                </button>

                {/* Gas */}
                <button
                  onPointerDown={(e) => {
                    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                    gameBridge.setInput({ accelerate: true });
                    setPressingGas(true);
                  }}
                  onPointerUp={(e) => {
                    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                    gameBridge.setInput({ accelerate: false });
                    setPressingGas(false);
                  }}
                  className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl cursor-pointer ${
                    pressingGas
                      ? 'bg-emerald-600 border-emerald-300 text-white'
                      : 'bg-black/75 border-white/25 text-emerald-400'
                  }`}
                >
                  <span className="text-[10px] font-racing font-black">GAS</span>
                </button>
              </div>
            )}

            {/* Handbrake / Drift Button */}
            <button
              onPointerDown={(e) => {
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                gameBridge.setInput({ drift: true });
                setPressingDrift(true);
                triggerHaptic(15);
              }}
              onPointerUp={(e) => {
                try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                gameBridge.setInput({ drift: false });
                setPressingDrift(false);
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl backdrop-blur-md cursor-pointer ${
                pressingDrift || telemetry.isDrifting
                  ? 'bg-amber-500 border-yellow-300 text-black glow-orange'
                  : 'bg-black/75 border-white/25 text-slate-200'
              }`}
            >
              <span className="text-[10px] font-racing font-black tracking-wide">DRIFT</span>
            </button>

            {/* NITRO BOOST BUTTON */}
            <button
              onPointerDown={(e) => {
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                gameBridge.setInput({ nitro: true });
                setPressingNitro(true);
                triggerHaptic(25);
              }}
              onPointerUp={(e) => {
                try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                gameBridge.setInput({ nitro: false });
                setPressingNitro(false);
              }}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 flex flex-col items-center justify-center text-white active:scale-95 transition-all shadow-2xl glow-blue cursor-pointer ${
                pressingNitro
                  ? 'bg-cyan-400 border-white text-black scale-105'
                  : 'bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-400 border-cyan-200'
              }`}
            >
              <Zap className="w-8 h-8 sm:w-9 sm:h-9 fill-white stroke-cyan-900" />
              <span className="text-[10px] sm:text-[11px] font-racing font-black tracking-wider uppercase mt-0.5">
                NITRO
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PAUSE MODAL OVERLAY */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs sm:max-w-sm bg-slate-950/95 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-2 bg-amber-500 slant-racing" />
              <h2 className="font-racing text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                PAUSED
              </h2>
              <div className="w-6 h-2 bg-amber-500 slant-racing" />
            </div>

            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                onClick={handlePauseToggle}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-racing font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg glow-orange active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>RESUME</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onRestartRace();
                }}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-racing font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESTART</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenSettings();
                }}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-racing font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>SETTINGS</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowExitConfirm(true);
                }}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-red-950/50 hover:border-red-500 text-slate-300 hover:text-red-400 font-racing font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>EXIT RACE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION DIALOG */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-950 border border-red-500/50 rounded-2xl p-5 flex flex-col items-center gap-3 text-center shadow-2xl">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
            <h3 className="font-racing text-lg font-bold text-white">Exit Race?</h3>
            <p className="text-xs text-slate-400">
              Current race progress will not be saved if you leave now.
            </p>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-racing font-bold text-xs uppercase cursor-pointer"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onExitRace();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-racing font-bold text-xs uppercase cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
