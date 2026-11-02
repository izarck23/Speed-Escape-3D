import React from 'react';
import { Plus } from 'lucide-react';
import { saveManager } from '../../data/SaveManager';
import { soundManager } from '../../audio/SoundManager';
import avatarImg from '../../assets/images/driver_avatar_racing_1793645052637.jpg';

interface TopCurrencyBarProps {
  onOpenProfile?: () => void;
  onOpenStore?: () => void;
}

export const TopCurrencyBar: React.FC<TopCurrencyBarProps> = ({
  onOpenProfile,
  onOpenStore,
}) => {
  const save = saveManager.get();
  const profile = save.profile;
  const currency = save.currency;

  const handlePlusCoins = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    soundManager.playReward();
    saveManager.addCoins(1000);
  };

  const handlePlusGems = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    soundManager.playReward();
    saveManager.addGems(10);
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-2 z-20">
      {/* Left: Avatar & Level */}
      <button
        onClick={() => {
          soundManager.playClick();
          onOpenProfile?.();
        }}
        className="flex items-center gap-2 group cursor-pointer focus:outline-none"
        title="View Driver Career Profile"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-900 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <img
              src={avatarImg}
              alt="Driver Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold text-white font-racing tracking-wide drop-shadow">
            Lv. {profile.level}
          </span>
          <div className="w-14 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/20 mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (profile.xp / profile.xpNext) * 100)}%` }}
            />
          </div>
        </div>
      </button>

      {/* Right: Coins & Gems */}
      <div className="flex items-center gap-2">
        {/* Coins Pill */}
        <div className="flex items-center gap-1.5 bg-black/70 border border-amber-500/40 rounded-full pl-2 pr-1 py-1 shadow-md">
          {/* Gold Coin Icon */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-yellow-200 flex items-center justify-center shadow-inner border border-yellow-200">
            <span className="text-[10px] font-black text-amber-950">C</span>
          </div>
          <span className="text-xs font-bold font-mono-numbers text-white pr-1">
            {currency.coins.toLocaleString()}
          </span>
          <button
            onClick={handlePlusCoins}
            className="w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 flex items-center justify-center text-black font-bold transition-transform cursor-pointer"
            title="Get 1,000 Free Coins"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {/* Gems Pill */}
        <div className="flex items-center gap-1.5 bg-black/70 border border-cyan-500/40 rounded-full pl-2 pr-1 py-1 shadow-md">
          {/* Blue Diamond Icon */}
          <div className="w-4 h-4 rotate-45 bg-gradient-to-tr from-cyan-600 via-sky-400 to-blue-200 flex items-center justify-center border border-cyan-200">
            <div className="w-1.5 h-1.5 bg-white -rotate-45" />
          </div>
          <span className="text-xs font-bold font-mono-numbers text-white pr-1">
            {currency.gems.toLocaleString()}
          </span>
          <button
            onClick={handlePlusGems}
            className="w-5 h-5 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 flex items-center justify-center text-black font-bold transition-transform cursor-pointer"
            title="Get 10 Free Gems"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
