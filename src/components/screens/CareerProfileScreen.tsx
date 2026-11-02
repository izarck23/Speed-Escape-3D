import React, { useState } from 'react';
import { ArrowLeft, Home, Trophy, Star, Award, Lock, CheckCircle2, BarChart3, User } from 'lucide-react';
import { StatusBar } from '../ui/StatusBar';
import { saveManager } from '../../data/SaveManager';
import { ACHIEVEMENTS_DATA } from '../../data/GameData';
import { soundManager } from '../../audio/SoundManager';
import avatarImg from '../../assets/images/driver_avatar_racing_1793645052637.jpg';

interface CareerProfileScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export const CareerProfileScreen: React.FC<CareerProfileScreenProps> = ({
  onBack,
  onHome,
}) => {
  const save = saveManager.get();
  const profile = save.profile;
  const currency = save.currency;

  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard'>('achievements');

  const unlockedCount = ACHIEVEMENTS_DATA.filter(a => save.unlockedAchievements.includes(a.id)).length;

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-950 overflow-hidden select-none">
      {/* Top Section */}
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
            CAREER
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {/* Player Profile Card matching reference */}
        <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-3 border-amber-400 overflow-hidden bg-slate-950 shadow-xl shadow-amber-500/25">
              <img
                src={avatarImg}
                alt="Driver Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 rounded-full text-black font-bold">
              <Award className="w-4 h-4 fill-black" />
            </div>
          </div>

          <h2 className="font-racing text-xl font-black text-white italic tracking-wide mt-2">
            {profile.name}
          </h2>
          <span className="text-xs font-bold font-racing text-amber-400 tracking-wider">
            Lv. {profile.level}
          </span>

          {/* XP Progress Bar */}
          <div className="w-full max-w-xs flex flex-col gap-1 mt-2">
            <div className="flex items-center justify-between text-[11px] font-mono-numbers text-slate-400">
              <span>XP Progress</span>
              <span className="font-bold text-white">
                {profile.xp.toLocaleString()} / {profile.xpNext.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (profile.xp / profile.xpNext) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3-Column Career Stats Strip matching reference */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center shadow-lg">
          {/* Races Won */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-racing font-black text-lg text-white">
                {profile.racesWon}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Races Won
            </span>
          </div>

          {/* XP */}
          <div className="flex flex-col items-center border-x border-slate-800">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-racing font-black text-lg text-white">
                {(profile.racesWon * 80 + profile.xp).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              XP
            </span>
          </div>

          {/* Coins */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                C
              </div>
              <span className="font-racing font-black text-lg text-white">
                {currency.coins.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Coins
            </span>
          </div>
        </div>

        {/* ACHIEVEMENTS Section matching reference */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-racing text-sm font-bold text-white uppercase tracking-wider">
              ACHIEVEMENTS
            </h3>
            <span className="text-xs font-mono-numbers font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
              {unlockedCount} / {ACHIEVEMENTS_DATA.length}
            </span>
          </div>

          {/* Medals Showcase Strip */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {ACHIEVEMENTS_DATA.slice(0, 5).map(ach => {
              const isUnlocked = save.unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-400 shadow-md glow-orange-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  {isUnlocked ? (
                    <Award className="w-6 h-6 text-amber-400 fill-amber-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Achievements List */}
          <div className="flex flex-col gap-2 mt-1">
            {ACHIEVEMENTS_DATA.map(ach => {
              const isUnlocked = save.unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                    isUnlocked
                      ? 'bg-slate-950/80 border-amber-500/30'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isUnlocked ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{ach.title}</h4>
                      <p className="text-[11px] text-slate-400">{ach.description}</p>
                    </div>
                  </div>
                  <span className="font-mono-numbers font-bold text-amber-400 shrink-0 ml-2">
                    +{ach.rewardCoins} C
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom LEADERBOARD & PROFILE Action Buttons matching reference */}
      <div className="z-10 w-full bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('leaderboard');
          }}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-racing font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg glow-purple active:scale-95 transition-all cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          <span>LEADERBOARD</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab('achievements');
          }}
          className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-racing font-bold text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <User className="w-4 h-4" />
          <span>PROFILE</span>
        </button>
      </div>
    </div>
  );
};
