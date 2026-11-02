import React, { useState } from 'react';
import { ArrowLeft, Home, Lock, Star, Play, Clock, Award } from 'lucide-react';
import { StatusBar } from '../ui/StatusBar';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { WORLDS_DATA, WorldInfo, LevelInfo } from '../../data/GameData';
import { saveManager } from '../../data/SaveManager';
import { soundManager } from '../../audio/SoundManager';
import mapBg from '../../assets/images/desert_level_map_1793645053058.jpg';

interface LevelSelectScreenProps {
  onBack: () => void;
  onHome: () => void;
  onStartLevel: (level: LevelInfo) => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  onBack,
  onHome,
  onStartLevel,
}) => {
  const save = saveManager.get();
  const [selectedWorldId, setSelectedWorldId] = useState(save.selectedWorldId || 'world_1');
  const [selectedLevelId, setSelectedLevelId] = useState(save.selectedLevelId || 'desert_1');

  const currentWorld = WORLDS_DATA.find(w => w.id === selectedWorldId) || WORLDS_DATA[0];
  const selectedLevel = currentWorld.levels.find(l => l.id === selectedLevelId) || currentWorld.levels[0];

  // Merge save progress into level items
  const levelsWithProgress = currentWorld.levels.map(lvl => {
    const p = save.levelProgress[lvl.id];
    return {
      ...lvl,
      unlocked: p ? p.unlocked : lvl.unlocked,
      stars: p ? p.stars : lvl.stars,
      bestTime: p && p.bestTime ? p.bestTime : lvl.bestTime,
    };
  });

  const activeLevelProgress = levelsWithProgress.find(l => l.id === selectedLevelId) || levelsWithProgress[0];

  const handleSelectLevel = (lvl: typeof levelsWithProgress[0]) => {
    if (!lvl.unlocked) {
      soundManager.playCollision(0.4);
      return;
    }
    soundManager.playClick();
    setSelectedLevelId(lvl.id);
    saveManager.save({ selectedLevelId: lvl.id });
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-black overflow-hidden select-none">
      {/* Background Illustrated Desert Canyon Map */}
      <div className="absolute inset-0 z-0">
        <img
          src={mapBg}
          alt="Desert Canyon Map"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90" />
      </div>

      {/* Top Header */}
      <div className="z-10 w-full flex flex-col">
        <StatusBar />
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <button
            onClick={() => {
              soundManager.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="font-racing text-2xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            LEVEL SELECT
          </h1>

          <button
            onClick={() => {
              soundManager.playClick();
              onHome();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
        <TopCurrencyBar />

        {/* World Tabs matching reference */}
        <div className="flex items-center justify-center gap-2 px-4 py-2">
          {WORLDS_DATA.map(world => {
            const isSelected = world.id === selectedWorldId;
            return (
              <button
                key={world.id}
                onClick={() => {
                  if (!world.unlocked) {
                    soundManager.playCollision(0.3);
                    return;
                  }
                  soundManager.playClick();
                  setSelectedWorldId(world.id);
                  saveManager.save({ selectedWorldId: world.id });
                }}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-racing font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg glow-orange-sm'
                    : world.unlocked
                    ? 'bg-slate-900/80 text-slate-300 border border-slate-700'
                    : 'bg-slate-950/80 text-slate-500 border border-slate-900 cursor-not-allowed'
                }`}
              >
                <span>{world.name.split('\n')[1] || world.name}</span>
                {!world.unlocked && <Lock className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Interactive Winding Road Map with Level Nodes */}
      <div className="relative flex-1 z-10 flex items-center justify-center px-4 my-auto">
        {/* Winding Road SVG Overlay */}
        <div className="relative w-full max-w-xs h-72">
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 300 280">
            {/* Road Path curve */}
            <path
              d="M 60 40 Q 180 30 220 90 T 150 170 T 80 220 T 160 250"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="6"
              strokeDasharray="8 6"
              className="opacity-75"
            />
          </svg>

          {/* Placed Nodes on the curve */}
          {[
            { lvl: levelsWithProgress[0], x: 55, y: 35 },
            { lvl: levelsWithProgress[1], x: 215, y: 85 },
            { lvl: levelsWithProgress[2], x: 150, y: 165 },
            { lvl: levelsWithProgress[3], x: 75, y: 215 },
            { lvl: levelsWithProgress[4], x: 160, y: 250 },
            { lvl: levelsWithProgress[5], x: 240, y: 245 },
          ].map(({ lvl, x, y }) => {
            if (!lvl) return null;
            const isCurrent = lvl.id === selectedLevelId;

            return (
              <div
                key={lvl.id}
                style={{ left: `${x}px`, top: `${y}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              >
                <button
                  onClick={() => handleSelectLevel(lvl)}
                  className={`w-13 h-13 rounded-full flex flex-col items-center justify-center font-racing font-black text-lg transition-all duration-200 cursor-pointer ${
                    !lvl.unlocked
                      ? 'bg-slate-900/90 border-2 border-slate-700 text-slate-500 shadow-md'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 border-3 border-white text-black shadow-xl glow-orange scale-110'
                      : 'bg-slate-900/95 border-2 border-amber-400 text-white hover:scale-105 shadow-lg'
                  }`}
                >
                  {lvl.unlocked ? (
                    <span>{lvl.number}</span>
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Star rating badge under node */}
                {lvl.unlocked && (
                  <div className="flex items-center gap-0.5 mt-1 bg-black/70 px-1.5 py-0.5 rounded-full border border-white/20">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 ${
                          s <= lvl.stars
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Selected Level Info Card & Big PLAY Button */}
      <div className="z-10 w-full bg-slate-950/95 border-t border-slate-800 px-4 pt-3 pb-5 flex flex-col gap-3 shadow-2xl">
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-racing text-base font-bold text-white">
              Level {activeLevelProgress.number} - {activeLevelProgress.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Best: {activeLevelProgress.bestTime ? `${activeLevelProgress.bestTime.toFixed(2)}s` : '01:12.45'}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                +{activeLevelProgress.rewardCoins.toLocaleString()} C
              </span>
            </div>
          </div>

          {/* 3 Stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(s => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= activeLevelProgress.stars
                    ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Big Glowing PLAY Button matching reference */}
        <button
          onClick={() => {
            soundManager.playClick();
            onStartLevel(activeLevelProgress);
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-black font-racing font-black text-xl tracking-wider uppercase shadow-2xl glow-orange active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-t-2 border-yellow-200"
        >
          <Play className="w-6 h-6 fill-black stroke-black" />
          <span>PLAY</span>
        </button>
      </div>
    </div>
  );
};
