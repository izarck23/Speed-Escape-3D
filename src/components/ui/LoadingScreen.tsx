import React, { useEffect, useState } from 'react';
import { Gauge, Zap, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  levelName: string;
  onLoadingComplete: () => void;
}

const TIPS = [
  "Tap Nitro right as you exit sharp turns for an explosive speed recovery!",
  "Draft behind opponent slipstreams to build up passive boost reserves.",
  "Upgrading Handling increases your drift control and tire grip on asphalt.",
  "Top speed is capped by car tiers—unlock hypercars in the Garage!",
  "Hitting guardrails or rocks cuts speed drastically—stay centered on the highway.",
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ levelName, onLoadingComplete }) => {
  const [progress, setProgress] = useState(15);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * TIPS.length));

    const startTime = Date.now();
    const duration = 1200; // smooth 1.2s pre-warm & shader compile window

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round(15 + (elapsed / duration) * 85));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onLoadingComplete();
        }, 150);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-black flex flex-col items-center justify-between p-6 sm:p-10 select-none text-white relative overflow-hidden">
      {/* Background Animated Neon Streaks */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="w-full h-full bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Header Info */}
      <div className="z-10 w-full max-w-md flex items-center justify-between pt-6 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-racing font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-amber-400" /> Entering Race
          </span>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-wide text-white drop-shadow-md">
            {levelName}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300">60 FPS MODE</span>
        </div>
      </div>

      {/* Center Tachometer / Visual Loader */}
      <div className="z-10 flex flex-col items-center my-auto">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
          {/* Circular Track Background */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="48"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-800"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="60"
              cy="60"
              r="48"
              stroke="url(#neon-gradient)"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-75 ease-out"
              fill="transparent"
            />
            <defs>
              <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Tachometer Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Gauge className="w-7 h-7 text-amber-400 animate-pulse mb-1" />
            <div className="text-3xl sm:text-4xl font-racing font-black tracking-tight text-white drop-shadow-lg">
              {progress}<span className="text-amber-400 text-lg">%</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              WARMING TIRES
            </span>
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-64 sm:w-80 h-2 bg-slate-800 rounded-full mt-6 overflow-hidden border border-white/10 p-[1px]">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer Pro Tip */}
      <div className="z-10 w-full max-w-md bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Flame className="w-5 h-5 fill-amber-400/30" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
              PRO RACING TIP
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {TIPS[tipIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
