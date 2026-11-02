import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight, Home, ArrowLeft, Wrench, Palette, Gauge, Rocket, Disc, Zap, Check } from 'lucide-react';
import { StatusBar } from '../ui/StatusBar';
import { TopCurrencyBar } from '../ui/TopCurrencyBar';
import { CARS_DATA, CarModel, CarCustomization } from '../../data/GameData';
import { saveManager } from '../../data/SaveManager';
import { soundManager } from '../../audio/SoundManager';
import { createProceduralCar, CarMeshComponents } from '../../game/models/CarGeometry';
import garageBg from '../../assets/images/neon_racing_garage_1793645052411.jpg';

interface GarageScreenProps {
  onBack: () => void;
  onHome: () => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  onBack,
  onHome,
}) => {
  const save = saveManager.get();
  const [selectedCarIndex, setSelectedCarIndex] = useState(() => {
    const idx = CARS_DATA.findIndex(c => c.id === save.selectedCarId);
    return idx >= 0 ? idx : 0;
  });

  const [activeModal, setActiveModal] = useState<'none' | 'upgrade' | 'customize'>('none');
  const currentCar = CARS_DATA[selectedCarIndex];

  // Upgrades & Customization state
  const upgrades = save.carUpgrades[currentCar.id] || { engine: 1, turbo: 1, tires: 1, nitro: 1 };
  const customization = save.carCustomizations[currentCar.id] || {
    color: currentCar.baseColor,
    wheelStyle: 'turbine',
    stripeStyle: 'twin_stripes',
    underglow: '#06B6D4',
  };

  // 3D Preview Turntable Canvas Ref
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const carMeshRef = useRef<CarMeshComponents | null>(null);

  // Set selected car in persistent save
  const handleSelectCar = (index: number) => {
    setSelectedCarIndex(index);
    const car = CARS_DATA[index];
    saveManager.save({ selectedCarId: car.id });
    soundManager.playClick();
  };

  // 3D Turntable initialization
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2.2, 5.8);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Studio lights for garage
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const blueRimLight = new THREE.DirectionalLight(0x06b6d4, 3.2); // Cyan rim light
    blueRimLight.position.set(-5, 6, -5);
    scene.add(blueRimLight);

    const floorLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 1.2);
    scene.add(floorLight);

    // Add Turntable circular platform
    const turntableGeom = new THREE.CylinderGeometry(3.2, 3.4, 0.12, 32);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const turntableMesh = new THREE.Mesh(turntableGeom, turntableMat);
    turntableMesh.position.y = -0.06;
    scene.add(turntableMesh);

    // Add glowing neon ring around turntable
    const ringGeom = new THREE.TorusGeometry(3.3, 0.04, 16, 64);
    ringGeom.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.position.y = 0.01;
    scene.add(ringMesh);

    // Spawn 3D Car
    const carComp = createProceduralCar(customization.color, customization, false);
    scene.add(carComp.root);
    carMeshRef.current = carComp;

    let frameId = 0;
    let rotationAngle = 0.4;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      rotationAngle += 0.007; // Slow smooth rotation
      carComp.root.rotation.y = rotationAngle;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentCar.id]);

  // Update 3D car customization in real-time
  useEffect(() => {
    if (carMeshRef.current) {
      carMeshRef.current.updateCustomization(customization);
    }
  }, [customization]);

  // Upgrade Purchase
  const handleUpgradeStat = (category: 'engine' | 'turbo' | 'tires' | 'nitro') => {
    const currentLvl = upgrades[category];
    if (currentLvl >= 5) return;
    const cost = (currentLvl + 1) * 2000;
    if (save.currency.coins < cost) return;

    soundManager.playReward();
    saveManager.addCoins(-cost);
    const updatedUpgrades = {
      ...upgrades,
      [category]: currentLvl + 1,
    };
    saveManager.save({
      carUpgrades: {
        ...save.carUpgrades,
        [currentCar.id]: updatedUpgrades,
      },
    });
  };

  // Customization Update
  const handleUpdateCustom = (updates: Partial<CarCustomization>) => {
    soundManager.playClick();
    const updated = { ...customization, ...updates };
    saveManager.save({
      carCustomizations: {
        ...save.carCustomizations,
        [currentCar.id]: updated,
      },
    });
  };

  // Calculate combined stats
  const speedVal = Math.min(100, Math.round(currentCar.baseStats.speed + upgrades.engine * 1.5));
  const accelVal = Math.min(100, Math.round(currentCar.baseStats.acceleration + upgrades.turbo * 1.5));
  const handlingVal = Math.min(100, Math.round(currentCar.baseStats.handling + upgrades.tires * 1.5));
  const nitroVal = Math.min(100, Math.round(currentCar.baseStats.nitro + upgrades.nitro * 1.5));

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-950 overflow-hidden select-none">
      {/* Background Neon Garage Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={garageBg}
          alt="Neon Garage"
          className="w-full h-full object-cover object-center opacity-45"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95" />
      </div>

      {/* Top Section */}
      <div className="z-10 w-full flex flex-col">
        <StatusBar />
        {/* Navigation Header */}
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
            GARAGE
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
      </div>

      {/* 3D Turntable Center Viewport */}
      <div className="relative flex-1 z-10 flex items-center justify-center min-h-[220px]">
        {/* Left/Right Turntable Arrows */}
        <button
          onClick={() => {
            const nextIdx = (selectedCarIndex - 1 + CARS_DATA.length) % CARS_DATA.length;
            handleSelectCar(nextIdx);
          }}
          className="absolute left-3 z-20 p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/90 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div ref={canvasMountRef} className="w-full h-full max-h-[300px]" />

        <button
          onClick={() => {
            const nextIdx = (selectedCarIndex + 1) % CARS_DATA.length;
            handleSelectCar(nextIdx);
          }}
          className="absolute right-3 z-20 p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/90 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Selected Car Info Badge */}
        <div className="absolute top-2 left-4 z-10">
          <h2 className="font-racing text-xl font-black text-white italic tracking-wide drop-shadow">
            {currentCar.name}
          </h2>
          <span className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase">
            {currentCar.rarity} · {currentCar.subtitle}
          </span>
        </div>
      </div>

      {/* Bottom Panel: Car Carousel + Stats + Actions */}
      <div className="z-10 w-full bg-slate-950/95 border-t border-slate-800 px-4 pt-3 pb-5 flex flex-col gap-3 shadow-2xl">
        {/* 4-Car Carousel matching reference */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          {CARS_DATA.map((car, idx) => {
            const isSelected = idx === selectedCarIndex;
            return (
              <button
                key={car.id}
                onClick={() => handleSelectCar(idx)}
                className={`relative flex-1 min-w-[70px] max-w-[85px] h-14 rounded-xl p-1.5 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/30 scale-105'
                    : 'border border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                {/* Car Silhouette preview with color swatch */}
                <div
                  className="w-10 h-4.5 rounded-md shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: car.baseColor }}
                >
                  <div className="w-5 h-1 bg-black/40 rounded-full" />
                </div>
                <span className="text-[10px] font-bold text-slate-200 mt-1 truncate w-full text-center">
                  {car.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* CAR STATS with Animated Progress Bars */}
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800/80 flex flex-col gap-2">
          <span className="text-[11px] font-racing font-bold text-slate-400 uppercase tracking-widest text-center">
            CAR STATS
          </span>

          {/* Speed */}
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 w-24">Speed</span>
            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${speedVal}%` }}
              />
            </div>
            <span className="text-xs font-mono-numbers font-bold text-white w-6 text-right">
              {speedVal}
            </span>
          </div>

          {/* Acceleration */}
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 w-24">Acceleration</span>
            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${accelVal}%` }}
              />
            </div>
            <span className="text-xs font-mono-numbers font-bold text-white w-6 text-right">
              {accelVal}
            </span>
          </div>

          {/* Handling */}
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 w-24">Handling</span>
            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${handlingVal}%` }}
              />
            </div>
            <span className="text-xs font-mono-numbers font-bold text-white w-6 text-right">
              {handlingVal}
            </span>
          </div>

          {/* Nitro */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300 w-24">Nitro</span>
            <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${nitroVal}%` }}
              />
            </div>
            <span className="text-xs font-mono-numbers font-bold text-white w-6 text-right">
              {nitroVal}
            </span>
          </div>
        </div>

        {/* Action Buttons: UPGRADE & CUSTOMIZE matching reference */}
        <div className="flex items-center gap-3">
          {/* UPGRADE BUTTON (Purple Gradient) */}
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveModal('upgrade');
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white font-racing font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg glow-purple active:scale-95 transition-all cursor-pointer border-t border-purple-300/40"
          >
            <Wrench className="w-5 h-5 stroke-[2.2]" />
            <span>UPGRADE</span>
          </button>

          {/* CUSTOMIZE BUTTON (Orange Gradient) */}
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveModal('customize');
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-black font-racing font-bold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg glow-orange active:scale-95 transition-all cursor-pointer border-t border-yellow-200"
          >
            <Palette className="w-5 h-5 stroke-[2.2]" />
            <span>CUSTOMIZE</span>
          </button>
        </div>
      </div>

      {/* UPGRADE MODAL */}
      {activeModal === 'upgrade' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-purple-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-400" />
                <h3 className="font-racing text-lg font-bold text-white">UPGRADE WORKSHOP</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {(['engine', 'turbo', 'tires', 'nitro'] as const).map(cat => {
                const lvl = upgrades[cat];
                const cost = (lvl + 1) * 2000;
                const canAfford = save.currency.coins >= cost && lvl < 5;
                const labels: Record<string, string> = {
                  engine: 'Engine Block (+Top Speed)',
                  turbo: 'Twin Turbo (+Acceleration)',
                  tires: 'Race Slicks (+Handling)',
                  nitro: 'Nitro Injectors (+Boost)',
                };

                return (
                  <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-white">{labels[cat]}</div>
                      <div className="text-[11px] text-purple-400">Level {lvl} / 5</div>
                    </div>
                    {lvl >= 5 ? (
                      <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-lg">
                        MAXED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpgradeStat(cat)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-lg text-xs font-racing font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md glow-purple active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>Upgrade</span>
                        <span className="font-mono-numbers">{cost.toLocaleString()} C</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-racing font-bold text-xs uppercase cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CUSTOMIZE MODAL */}
      {activeModal === 'customize' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-400" />
                <h3 className="font-racing text-lg font-bold text-white">CUSTOMIZATION</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Paint Color */}
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Body Paint Color
              </span>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {[
                  { name: 'Red', hex: '#E11D48' },
                  { name: 'Gold', hex: '#EAB308' },
                  { name: 'Blue', hex: '#0284C7' },
                  { name: 'White', hex: '#F8FAFC' },
                  { name: 'Matte Black', hex: '#18181B' },
                  { name: 'Lime', hex: '#10B981' },
                  { name: 'Purple', hex: '#A855F7' },
                ].map(c => (
                  <button
                    key={c.hex}
                    onClick={() => handleUpdateCustom({ color: c.hex })}
                    className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      customization.color === c.hex ? 'border-amber-400 scale-110 shadow-lg' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {customization.color === c.hex && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Wheel Style */}
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Wheel Rim Style
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { id: 'turbine' as const, label: 'Aero Turbine' },
                  { id: 'gold_dish' as const, label: 'Gold Deep Dish' },
                  { id: 'alloy' as const, label: 'Matte Alloy' },
                  { id: 'stock' as const, label: 'Stock Rims' },
                ].map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleUpdateCustom({ wheelStyle: w.id })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      customization.wheelStyle === w.id
                        ? 'bg-amber-500 text-black font-bold shadow-md'
                        : 'bg-slate-900 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Stripe Style */}
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Decals & Racing Stripes
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { id: 'none' as const, label: 'Clean Monotone' },
                  { id: 'twin_stripes' as const, label: 'Twin Stripes' },
                  { id: 'cyber_accent' as const, label: 'Cyber Chevrons' },
                  { id: 'racing_num' as const, label: 'Track #07 Roundel' },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleUpdateCustom({ stripeStyle: s.id })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      customization.stripeStyle === s.id
                        ? 'bg-amber-500 text-black font-bold shadow-md'
                        : 'bg-slate-900 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Underglow Neon */}
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Underglow Neon Light
              </span>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {[
                  { name: 'Off', hex: 'off', bg: '#334155' },
                  { name: 'Cyan', hex: '#06B6D4', bg: '#06B6D4' },
                  { name: 'Purple', hex: '#A855F7', bg: '#A855F7' },
                  { name: 'Amber', hex: '#F59E0B', bg: '#F59E0B' },
                  { name: 'Red', hex: '#EF4444', bg: '#EF4444' },
                  { name: 'Green', hex: '#10B981', bg: '#10B981' },
                ].map(u => (
                  <button
                    key={u.hex}
                    onClick={() => handleUpdateCustom({ underglow: u.hex })}
                    className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      customization.underglow === u.hex ? 'border-white scale-110 shadow-lg' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: u.bg }}
                    title={u.name}
                  >
                    {customization.underglow === u.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-racing font-bold text-xs uppercase cursor-pointer mt-2"
            >
              Done Customizing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
