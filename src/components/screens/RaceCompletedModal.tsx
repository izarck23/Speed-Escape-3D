import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, ChevronRight, Car } from 'lucide-react';
import { soundManager } from '../../audio/SoundManager';

interface RaceCompletedModalProps {
  rank: number;
  timeSec: number;
  rewardCoins: number;
  rewardXp: number;
  onNextRace: () => void;
  onOpenGarage: () => void;
}

export const RaceCompletedModal: React.FC<RaceCompletedModalProps> = ({
  rank,
  timeSec,
  rewardCoins,
  rewardXp,
  onNextRace,
  onOpenGarage,
}) => {
  const mins = Math.floor(timeSec / 60);
  const secs = timeSec % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`;

  const starsEarned = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;
  const rankSuffix = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;

  // Trigger celebratory confetti on mount
  useEffect(() => {
    soundManager.playReward();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#e11d48', '#06b6d4', '#eab308', '#a855f7'],
      });
    } catch {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-slate-950/95 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
        {/* Checkered Flag Graphic Banner */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-4 bg-[repeating-linear-gradient(45deg,#fff,#fff_3px,#000_3px,#000_6px)] rounded-sm rotate-[-10deg]" />
          <h2 className="font-racing text-2xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 drop-shadow">
            RACE COMPLETED!
          </h2>
          <div className="w-7 h-4 bg-[repeating-linear-gradient(-45deg,#fff,#fff_3px,#000_3px,#000_6px)] rounded-sm rotate-[10deg]" />
        </div>

        {/* 3 Animated Stars */}
        <div className="flex items-center gap-2 my-1">
          {[1, 2, 3].map(s => (
            <div key={s} className="relative">
              <Star
                className={`w-9 h-9 transition-all duration-300 ${
                  s <= starsEarned
                    ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]'
                    : 'text-slate-700'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Rank Badge & Trophy */}
        <div className="flex items-center justify-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl w-full py-3 px-4 shadow-inner">
          <Trophy className="w-9 h-9 text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
          <div className="flex flex-col items-start">
            <span className="font-racing font-black text-4xl text-amber-400 italic leading-none drop-shadow">
              {rankSuffix}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-2" />

          <div className="flex flex-col items-start">
            <span className="text-[10px] font-racing font-bold text-slate-400 uppercase tracking-widest">
              RACE TIME
            </span>
            <span className="font-mono-numbers font-bold text-lg text-white">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Rewards Section matching reference */}
        <div className="w-full bg-slate-900/80 rounded-2xl p-3 border border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 flex items-center justify-center text-[10px] font-black text-black">
                C
              </div>
              <span className="text-xs font-semibold text-slate-300">REWARDS</span>
            </div>
            <span className="font-mono-numbers font-bold text-sm text-amber-400">
              +{rewardCoins.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-slate-300">XP GAINED</span>
            </div>
            <span className="font-mono-numbers font-bold text-sm text-amber-400">
              +{rewardXp}
            </span>
          </div>
        </div>

        {/* Action Buttons matching reference */}
        <div className="w-full flex items-center gap-3 mt-1">
          {/* NEXT RACE (Purple Gradient) */}
          <button
            onClick={() => {
              soundManager.playClick();
              onNextRace();
            }}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white font-racing font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-purple active:scale-95 transition-all cursor-pointer"
          >
            <span>NEXT RACE</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>

          {/* GARAGE */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenGarage();
            }}
            className="flex-1 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-racing font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>GARAGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
