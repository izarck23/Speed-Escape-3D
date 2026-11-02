import React from 'react';
import { Play } from 'lucide-react';
import { StatusBar } from '../ui/StatusBar';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { BottomNavBar, ScreenTab } from '../ui/BottomNavBar';
import { soundManager } from '../../audio/SoundManager';
import bgImage from '../../assets/images/desert_highway_sunset_1793645053179.jpg';

interface MainMenuScreenProps {
  onStartRace: () => void;
  onNavigate: (tab: ScreenTab) => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  onStartRace,
  onNavigate,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-black overflow-hidden select-none">
      {/* Background Hero Image with Sunset Highway */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt="Desert Highway Racing"
          className="w-full h-full object-cover object-bottom"
          referrerPolicy="no-referrer"
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        {/* Ambient speed line streaks */}
        <div className="absolute bottom-28 left-0 right-0 h-40 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
      </div>

      {/* Top Section */}
      <div className="z-10 w-full flex flex-col">
        <StatusBar />
        <TopCurrencyBar
          onOpenProfile={() => onNavigate('profile')}
        />
      </div>

      {/* Center Hero: Logo & Title Lockup */}
      <div className="z-10 flex flex-col items-center justify-center my-auto px-4 text-center">
        {/* Checkered Flag Graphic Accent & Stylized Title */}
        <div className="relative flex flex-col items-center">
          {/* Subtle checkered flag wings behind logo */}
          <div className="flex items-center justify-center gap-3 mb-1 opacity-90">
            <div className="w-10 h-4 bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,#000_4px,#000_8px)] rounded-sm rotate-[-12deg] shadow-lg opacity-80" />
            <span className="text-[10px] tracking-widest font-black text-amber-400 uppercase bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
              Arcade Nitro
            </span>
            <div className="w-10 h-4 bg-[repeating-linear-gradient(-45deg,#fff,#fff_4px,#000_4px,#000_8px)] rounded-sm rotate-[12deg] shadow-lg opacity-80" />
          </div>

          <h1 className="font-racing text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-stroke-black">
            SPEED
          </h1>
          <h2 className="font-racing text-5xl sm:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 drop-shadow-[0_6px_16px_rgba(245,158,11,0.6)] text-stroke-black -mt-2">
            ESCAPE 3D
          </h2>

          <div className="mt-1 px-3 py-0.5 rounded-full bg-black/70 border border-white/20 backdrop-blur-sm">
            <span className="text-xs font-bold text-slate-200 font-racing tracking-widest">
              v1.1
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA & Navigation */}
      <div className="z-10 flex flex-col items-center gap-5 w-full">
        {/* Big Glowing PLAY Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onStartRace();
          }}
          className="group relative flex items-center justify-center gap-3 w-64 sm:w-72 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-black font-racing font-black text-2xl tracking-wider uppercase shadow-2xl glow-orange active:scale-95 transition-all duration-150 cursor-pointer border-t-2 border-yellow-200"
        >
          <div className="p-1 rounded-full bg-black/20 group-hover:scale-110 transition-transform">
            <Play className="w-7 h-7 fill-black stroke-black ml-0.5" />
          </div>
          <span className="drop-shadow">PLAY</span>
        </button>

        {/* Bottom Nav Bar */}
        <BottomNavBar
          activeTab="main_menu"
          onSelectTab={onNavigate}
        />
      </div>
    </div>
  );
};
