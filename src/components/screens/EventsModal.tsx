import React from 'react';
import { Calendar, Clock, Trophy, ArrowRight, Zap, Flame } from 'lucide-react';
import { soundManager } from '../../audio/SoundManager';
import { LevelInfo } from '../../data/GameData';

interface EventsModalProps {
  onClose: () => void;
  onEnterEvent: (eventLevel: LevelInfo) => void;
}

export const EventsModal: React.FC<EventsModalProps> = ({
  onClose,
  onEnterEvent,
}) => {
  const events = [
    {
      id: 'event_desert_clash',
      title: 'Desert Nitro Showdown',
      desc: 'Double nitro recharge speed! Reach the finish line in under 90 seconds.',
      tag: 'DAILY SPECIAL',
      timer: '14h 22m',
      rewardCoins: 5000,
      rewardXp: 600,
      level: {
        id: 'desert_3',
        number: 3,
        name: 'Nitro Showdown',
        laps: 2,
        rivalsCount: 5,
        targetTimeSec: 90.0,
        rewardCoins: 5000,
        rewardXp: 600,
        unlocked: true,
        stars: 3,
        bestTime: null,
      },
    },
    {
      id: 'event_canyon_cup',
      title: 'Canyon Championship Cup',
      desc: '3-lap endurance challenge against elite AI rivals.',
      tag: 'WEEKEND CUP',
      timer: '2d 08h',
      rewardCoins: 8000,
      rewardXp: 1000,
      level: {
        id: 'desert_6',
        number: 6,
        name: 'Canyon Grand Prix',
        laps: 3,
        rivalsCount: 5,
        targetTimeSec: 155.0,
        rewardCoins: 8000,
        rewardXp: 1000,
        unlocked: true,
        stars: 3,
        bestTime: null,
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-slate-950 border border-amber-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="font-racing text-lg font-bold text-white tracking-wide">
              SEASON EVENTS
            </h3>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {events.map(ev => (
            <div
              key={ev.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-racing font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {ev.tag}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {ev.timer}
                </span>
              </div>

              <div>
                <h4 className="font-racing font-bold text-sm text-white">{ev.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{ev.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>+{ev.rewardCoins.toLocaleString()} Coins</span>
                </div>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    onEnterEvent(ev.level);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-racing font-bold text-xs flex items-center gap-1 shadow-md glow-orange-sm active:scale-95 cursor-pointer"
                >
                  <span>RACE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-racing font-bold text-xs uppercase cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
