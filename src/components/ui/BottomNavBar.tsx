import React from 'react';
import { Car, Trophy, Calendar, Settings } from 'lucide-react';
import { soundManager } from '../../audio/SoundManager';

export type ScreenTab = 'main_menu' | 'garage' | 'career' | 'events' | 'settings' | 'gameplay' | 'profile';

interface BottomNavBarProps {
  activeTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: 'garage' as ScreenTab, label: 'Garage', icon: Car },
    { id: 'career' as ScreenTab, label: 'Career', icon: Trophy },
    { id: 'events' as ScreenTab, label: 'Events', icon: Calendar },
    { id: 'settings' as ScreenTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-around z-20 shadow-2xl">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playClick();
              onSelectTab(tab.id);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-amber-400 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg transition-all ${
                isActive ? 'bg-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/30' : ''
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className={`text-[11px] font-bold tracking-wide ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
