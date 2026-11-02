import React, { useState } from 'react';
import { ArrowLeft, Home, Volume2, Music, Disc, Globe, Smartphone, RotateCcw, Check } from 'lucide-react';
import { StatusBar } from '../ui/StatusBar';
import { PlayerSettingsState, saveManager } from '../../data/SaveManager';
import { soundManager } from '../../audio/SoundManager';

interface SettingsScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onHome,
}) => {
  const save = saveManager.get();
  const [settings, setSettings] = useState<PlayerSettingsState>(save.settings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSave = () => {
    soundManager.playClick();
    soundManager.setVolumes(settings.soundVolume, settings.musicVolume);
    saveManager.save({ settings });
    showToast('Settings saved successfully!');
  };

  const handleReset = () => {
    soundManager.playClick();
    const defaultSettings: PlayerSettingsState = {
      graphicsQuality: 'high',
      frameRate: 60,
      soundVolume: 0.8,
      musicVolume: 0.7,
      steeringSensitivity: 0.6,
      controlType: 'buttons',
      language: 'English',
      vibration: true,
    };
    setSettings(defaultSettings);
    soundManager.setVolumes(defaultSettings.soundVolume, defaultSettings.musicVolume);
    saveManager.save({ settings: defaultSettings });
    showToast('Reset to default configurations');
  };

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
            SETTINGS
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

      {/* Main Settings Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 text-white">
        {/* 1. Graphics Quality */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Graphics Quality
          </label>
          <div className="grid grid-cols-4 gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {(['low', 'medium', 'high', 'ultra'] as const).map(q => (
              <button
                key={q}
                onClick={() => {
                  soundManager.playClick();
                  setSettings(prev => ({ ...prev, graphicsQuality: q }));
                }}
                className={`py-2 rounded-xl text-xs font-racing font-bold capitalize transition-all cursor-pointer ${
                  settings.graphicsQuality === q
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md glow-orange-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Frame Rate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Frame Rate
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {([30, 60, 90] as const).map(fps => (
              <button
                key={fps}
                onClick={() => {
                  soundManager.playClick();
                  setSettings(prev => ({ ...prev, frameRate: fps }));
                }}
                className={`py-2 rounded-xl text-xs font-racing font-bold transition-all cursor-pointer ${
                  settings.frameRate === fps
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md glow-orange-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fps} FPS
              </button>
            ))}
          </div>
        </div>

        {/* 3. Sound Volume Slider */}
        <div className="flex flex-col gap-1.5 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">Sound Volume</span>
            </div>
            <span className="text-xs font-mono-numbers font-bold text-amber-400">
              {Math.round(settings.soundVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundVolume}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setSettings(prev => ({ ...prev, soundVolume: val }));
              soundManager.setVolumes(val, settings.musicVolume);
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* 4. Music Volume Slider */}
        <div className="flex flex-col gap-1.5 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">Music Volume</span>
            </div>
            <span className="text-xs font-mono-numbers font-bold text-amber-400">
              {Math.round(settings.musicVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.musicVolume}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setSettings(prev => ({ ...prev, musicVolume: val }));
              soundManager.setVolumes(settings.soundVolume, val);
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* 5. Steering Sensitivity */}
        <div className="flex flex-col gap-1.5 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">Steering Sensitivity</span>
            </div>
            <span className="text-xs font-mono-numbers font-bold text-amber-400">
              {Math.round(settings.steeringSensitivity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={settings.steeringSensitivity}
            onChange={e => {
              setSettings(prev => ({ ...prev, steeringSensitivity: parseFloat(e.target.value) }));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* 6. Control Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Control Type
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {(['tilt', 'buttons', 'touch'] as const).map(c => (
              <button
                key={c}
                onClick={() => {
                  soundManager.playClick();
                  setSettings(prev => ({ ...prev, controlType: c }));
                }}
                className={`py-2 rounded-xl text-xs font-racing font-bold capitalize transition-all cursor-pointer ${
                  settings.controlType === c
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md glow-orange-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 7. Language Selector */}
        <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">Language</span>
          </div>
          <select
            value={settings.language}
            onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="English">English</option>
            <option value="Spanish">Español</option>
            <option value="French">Français</option>
            <option value="German">Deutsch</option>
            <option value="Japanese">日本語</option>
          </select>
        </div>

        {/* 8. Vibration Toggle */}
        <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">Vibration Feedback</span>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              setSettings(prev => ({ ...prev, vibration: !prev.vibration }));
            }}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.vibration ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                settings.vibration ? 'left-6.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black text-xs font-racing font-bold px-4 py-2 rounded-full shadow-xl glow-orange">
          {toastMessage}
        </div>
      )}

      {/* Bottom RESET / SAVE Buttons matching reference */}
      <div className="z-10 w-full bg-slate-950/95 border-t border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-racing font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET</span>
        </button>

        <button
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-racing font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg glow-orange transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>SAVE</span>
        </button>
      </div>
    </div>
  );
};
