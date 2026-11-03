import React, { useState, useEffect } from 'react';
import { MainMenuScreen } from './components/screens/MainMenuScreen';
import { GarageScreen } from './components/screens/GarageScreen';
import { LevelSelectScreen } from './components/screens/LevelSelectScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { GameplayScreen } from './components/screens/GameplayScreen';
import { CareerProfileScreen } from './components/screens/CareerProfileScreen';
import { EventsModal } from './components/screens/EventsModal';
import { RaceCompletedModal } from './components/screens/RaceCompletedModal';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ScreenTab } from './components/ui/BottomNavBar';
import { WORLDS_DATA, LevelInfo } from './data/GameData';
import { saveManager } from './data/SaveManager';
import { soundManager } from './audio/SoundManager';
import { Maximize2, Smartphone, Download } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenTab | 'loading'>('main_menu');
  const [showEvents, setShowEvents] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LevelInfo>(WORLDS_DATA[0].levels[0]);
  const [raceResult, setRaceResult] = useState<{ rank: number; timeSec: number; coins: number; xp: number } | null>(null);

  // Responsive device frame mode
  const [isWidescreenFit, setIsWidescreenFit] = useState(false);

  useEffect(() => {
    const startAudio = () => {
      soundManager.initContext();
      if (currentScreen !== 'gameplay' && currentScreen !== 'loading') {
        soundManager.playMusic('menu');
      }
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
    return () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
  }, [currentScreen]);

  // Handle Level Start with smooth Loading Screen transition
  const handleStartRace = (lvl?: LevelInfo) => {
    const levelToPlay = lvl || selectedLevel;
    setSelectedLevel(levelToPlay);
    setRaceResult(null);
    setCurrentScreen('loading');
  };

  const handleLoadingComplete = () => {
    setCurrentScreen('gameplay');
  };

  const handleNavigate = (tab: ScreenTab) => {
    if (tab === 'events') {
      setShowEvents(true);
    } else {
      setCurrentScreen(tab);
    }
  };

  const handleRaceCompleted = (res: { rank: number; timeSec: number; coins: number; xp: number }) => {
    setRaceResult(res);
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Top Frame Utility Bar (Device Mode Toggle & APK Download) */}
      <div className="fixed top-2 right-2 z-50 flex items-center gap-2.5 bg-black/80 border border-white/20 rounded-full px-3 py-1 shadow-xl backdrop-blur-md">
        <a
          href="./testing/app-debug.apk"
          download="SpeedEscape3D-v1.1-debug.apk"
          className="flex items-center gap-1.5 text-[11px] font-racing font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          title="Download Android Debug APK"
        >
          <Download className="w-3.5 h-3.5 animate-pulse" />
          <span>Download APK</span>
        </a>
        <div className="h-3 w-px bg-white/20" />
        <button
          onClick={() => setIsWidescreenFit(!isWidescreenFit)}
          className="flex items-center gap-1.5 text-[11px] font-racing font-bold text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
          title="Toggle Fullscreen View"
        >
          {isWidescreenFit ? (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Frame</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full View</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`relative transition-all duration-300 overflow-hidden shadow-2xl ${
          currentScreen === 'gameplay' || currentScreen === 'loading' || isWidescreenFit
            ? 'w-full h-full'
            : 'w-full max-w-[440px] h-full max-h-[920px] rounded-3xl border-2 border-slate-800'
        }`}
      >
        {currentScreen === 'main_menu' && (
          <MainMenuScreen
            onStartRace={() => handleStartRace()}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'garage' && (
          <GarageScreen
            onBack={() => setCurrentScreen('main_menu')}
            onHome={() => setCurrentScreen('main_menu')}
          />
        )}

        {currentScreen === 'career' && (
          <LevelSelectScreen
            onBack={() => setCurrentScreen('main_menu')}
            onHome={() => setCurrentScreen('main_menu')}
            onStartLevel={lvl => handleStartRace(lvl)}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onBack={() => setCurrentScreen('main_menu')}
            onHome={() => setCurrentScreen('main_menu')}
          />
        )}

        {currentScreen === 'profile' && (
          <CareerProfileScreen
            onBack={() => setCurrentScreen('main_menu')}
            onHome={() => setCurrentScreen('main_menu')}
          />
        )}

        {currentScreen === 'loading' && (
          <LoadingScreen
            levelName={selectedLevel.name}
            onLoadingComplete={handleLoadingComplete}
          />
        )}

        {currentScreen === 'gameplay' && (
          <GameplayScreen
            level={selectedLevel}
            onExitRace={() => setCurrentScreen('main_menu')}
            onRestartRace={() => {
              handleStartRace(selectedLevel);
            }}
            onOpenSettings={() => setCurrentScreen('settings')}
            onRaceCompleted={handleRaceCompleted}
          />
        )}

        {/* RACE COMPLETED MODAL */}
        {raceResult && (
          <RaceCompletedModal
            rank={raceResult.rank}
            timeSec={raceResult.timeSec}
            rewardCoins={raceResult.coins}
            rewardXp={raceResult.xp}
            onNextRace={() => {
              setRaceResult(null);
              handleStartRace();
            }}
            onOpenGarage={() => {
              setRaceResult(null);
              setCurrentScreen('garage');
            }}
          />
        )}

        {/* EVENTS MODAL */}
        {showEvents && (
          <EventsModal
            onClose={() => setShowEvents(false)}
            onEnterEvent={eventLvl => {
              setShowEvents(false);
              handleStartRace(eventLvl);
            }}
          />
        )}
      </div>
    </div>
  );
}
