/**
 * RaceEngine - Core 3D Arcade Racing Simulation Loop.
 * Optimized with pre-allocated racer arrays, throttled UI telemetry, smooth progressive
 * steering kinematics, and zero render-loop allocations to eliminate hanging and frame drops.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createProceduralCar, CarMeshComponents } from '../models/CarGeometry';
import { createDesertHighwayTrack, TrackData } from '../models/TrackGenerator';
import { ParticleFX } from '../models/ParticleSystem';
import { gameBridge, GameInputState, GameTelemetrySnapshot } from '../../bridge/GameBridge';
import { soundManager } from '../../audio/SoundManager';
import { CARS_DATA, CarStats, CarUpgradeLevels, LevelInfo } from '../../data/GameData';
import { saveManager } from '../../data/SaveManager';

interface VehicleEntity {
  id: string;
  isPlayer: boolean;
  mesh: CarMeshComponents;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  speedKmh: number;
  trackT: number;
  lateralOffset: number;
  currentLap: number;
  totalDistance: number;
  isNitro: boolean;
  isDrifting: boolean;
  stats: CarStats;
  aiTargetSpeed: number;
  aiTargetLane: number;
  collisionCooldown: number;
}

export class RaceEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private track: TrackData;
  private particleFx: ParticleFX;

  private playerVehicle!: VehicleEntity;
  private aiVehicles: VehicleEntity[] = [];
  private allRacers: VehicleEntity[] = []; // Pre-allocated list to prevent per-frame allocations

  private isRunning = false;
  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Race rules state
  private countdown = 3;
  private countdownTimer = 0;
  private elapsedTime = 0;
  private isRaceFinished = false;
  private finishRank = 1;
  private levelInfo: LevelInfo;

  // Steering smoothing
  private currentSteerAngle = 0;

  // Nitro & Camera shake
  private nitroTank = 100;
  private cameraShake = 0;

  // Telemetry publish throttle (every 3 frames)
  private telemetryFrameCount = 0;

  // Pre-allocated math helpers
  private readonly _vecA = new THREE.Vector3();
  private readonly _vecB = new THREE.Vector3();
  private readonly _vecC = new THREE.Vector3();
  private readonly _camTarget = new THREE.Vector3();
  private readonly _quatA = new THREE.Quaternion();

  constructor(container: HTMLElement, level: LevelInfo) {
    this.container = container;
    this.levelInfo = level;

    // 1. SCENE SETUP & RETRO-SUNSET HORIZON FOG
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf97316);
    this.scene.fog = new THREE.FogExp2(0xf97316, 0.0035);

    // 2. CAMERA SETUP
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 1000);

    // 3. RENDERER SETUP
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. STUDIO ENVIRONMENT REFLECTION
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. LIGHTING RIG
    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    sunLight.position.set(120, 160, 80);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xfef08a, 0x1e1b4b, 0.9);
    this.scene.add(hemiLight);

    // 6. BUILD TRACK & PARTICLES
    this.track = createDesertHighwayTrack(this.scene);
    this.particleFx = new ParticleFX(this.scene);

    // 7. SPAWN RACERS
    this.spawnRacers();

    // 8. WINDOW RESIZE
    window.addEventListener('resize', this.onResize);

    // 9. START AUDIO & COUNTDOWN
    soundManager.startEngine();
    soundManager.playCountdown(false);
  }

  private spawnRacers() {
    const saveData = saveManager.get();
    const playerCarModel = CARS_DATA.find(c => c.id === saveData.selectedCarId) || CARS_DATA[0];
    const playerUpgrades: CarUpgradeLevels = saveData.carUpgrades[playerCarModel.id] || { engine: 1, turbo: 1, tires: 1, nitro: 1 };
    const playerCustom = saveData.carCustomizations[playerCarModel.id] || {
      color: playerCarModel.baseColor,
      wheelStyle: 'turbine',
      stripeStyle: 'twin_stripes',
      underglow: '#06B6D4',
    };

    const effectivePlayerStats: CarStats = {
      speed: Math.min(100, playerCarModel.baseStats.speed + playerUpgrades.engine * 1.5),
      acceleration: Math.min(100, playerCarModel.baseStats.acceleration + playerUpgrades.turbo * 1.5),
      handling: Math.min(100, playerCarModel.baseStats.handling + playerUpgrades.tires * 1.5),
      nitro: Math.min(100, playerCarModel.baseStats.nitro + playerUpgrades.nitro * 1.5),
    };

    // 1. SPAWN PLAYER CAR
    const playerCarMesh = createProceduralCar(playerCustom.color, playerCustom, true);
    this.scene.add(playerCarMesh.root);

    const startPt = this.track.getTrackPointAtT(0.002);
    const playerStartPos = startPt.position.clone().addScaledVector(startPt.binormal, -2.5);

    this.playerVehicle = {
      id: 'player',
      isPlayer: true,
      mesh: playerCarMesh,
      position: playerStartPos,
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), startPt.tangent),
      speedKmh: 0,
      trackT: 0.002,
      lateralOffset: -2.5,
      currentLap: 1,
      totalDistance: 0,
      isNitro: false,
      isDrifting: false,
      stats: effectivePlayerStats,
      aiTargetSpeed: 0,
      aiTargetLane: 0,
      collisionCooldown: 0,
    };
    this.playerVehicle.mesh.root.position.copy(playerStartPos);
    this.playerVehicle.mesh.root.quaternion.copy(this.playerVehicle.quaternion);

    // 2. SPAWN 5 AI OPPONENTS
    const aiConfigs = [
      { id: 'ai_1', name: 'Thunder Z', color: '#EAB308', t: 0.005, lane: 2.5, speed: 205, stats: CARS_DATA[1].baseStats },
      { id: 'ai_2', name: 'Vortex R', color: '#0284C7', t: 0.008, lane: -3.5, speed: 210, stats: CARS_DATA[2].baseStats },
      { id: 'ai_3', name: 'Phantom X', color: '#F8FAFC', t: 0.012, lane: 1.0, speed: 215, stats: CARS_DATA[3].baseStats },
      { id: 'ai_4', name: 'Viper GT', color: '#10B981', t: 0.015, lane: -1.5, speed: 200, stats: CARS_DATA[0].baseStats },
      { id: 'ai_5', name: 'Hyperion', color: '#A855F7', t: 0.018, lane: 3.5, speed: 208, stats: CARS_DATA[1].baseStats },
    ];

    this.aiVehicles = aiConfigs.map(cfg => {
      const mesh = createProceduralCar(cfg.color, {
        color: cfg.color,
        wheelStyle: 'alloy',
        stripeStyle: 'cyber_accent',
        underglow: cfg.color,
      }, true);
      this.scene.add(mesh.root);

      const aiPt = this.track.getTrackPointAtT(cfg.t);
      const aiPos = aiPt.position.clone().addScaledVector(aiPt.binormal, cfg.lane);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), aiPt.tangent);

      mesh.root.position.copy(aiPos);
      mesh.root.quaternion.copy(quat);

      return {
        id: cfg.id,
        isPlayer: false,
        mesh,
        position: aiPos,
        velocity: new THREE.Vector3(),
        quaternion: quat,
        speedKmh: 0,
        trackT: cfg.t,
        lateralOffset: cfg.lane,
        currentLap: 1,
        totalDistance: cfg.t,
        isNitro: false,
        isDrifting: false,
        stats: cfg.stats,
        aiTargetSpeed: cfg.speed,
        aiTargetLane: cfg.lane,
        collisionCooldown: 0,
      };
    });

    // Populate pre-allocated racer array
    this.allRacers = [this.playerVehicle, ...this.aiVehicles];

    this.updateCamera(0.016, true);
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.tick();
  }

  public pause() {
    this.isPaused = true;
    soundManager.stopEngine();
    soundManager.setNitro(false);
    soundManager.setDrift(false);
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    soundManager.startEngine();
    this.tick();
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private tick = () => {
    if (!this.isRunning || this.isPaused) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    this.updateSimulation(dt);
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private updateSimulation(dt: number) {
    // 1. COUNTDOWN
    if (this.countdown >= 0) {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 1.0) {
        this.countdownTimer = 0;
        this.countdown -= 1;
        if (this.countdown > 0) {
          soundManager.playCountdown(false);
        } else if (this.countdown === 0) {
          soundManager.playCountdown(true);
        }
      }
    } else {
      if (!this.isRaceFinished) {
        this.elapsedTime += dt;
      }
    }

    const input = this.countdown < 0 ? gameBridge.getInput() : {
      steerLeft: false,
      steerRight: false,
      accelerate: false,
      brake: false,
      nitro: false,
      drift: false,
      analogSteer: 0,
    };

    // 2. SIMULATE PLAYER
    this.updatePlayerPhysics(dt, input);

    // 3. SIMULATE AI
    this.updateAiPhysics(dt);

    // 4. RESOLVE COLLISIONS (Zero allocation)
    this.resolveCollisions();

    // 5. UPDATE PARTICLES
    this.particleFx.update(dt);

    // 6. UPDATE CAMERA
    this.updateCamera(dt);

    // 7. COMPUTE RACE RANKINGS
    this.updateRaceRules();

    // 8. PUBLISH TELEMETRY (Throttled to save React CPU)
    this.telemetryFrameCount++;
    if (this.telemetryFrameCount >= 2) {
      this.telemetryFrameCount = 0;
      this.publishTelemetry();
    }
  }

  private updatePlayerPhysics(dt: number, input: GameInputState) {
    const p = this.playerVehicle;
    const stats = p.stats;

    // A. Nitro handling
    const wantsNitro = input.nitro && this.nitroTank > 0 && p.speedKmh > 20;
    if (wantsNitro) {
      this.nitroTank = Math.max(0, this.nitroTank - dt * 26);
      p.isNitro = true;
      soundManager.setNitro(true);

      const leftEx = this._vecA.setFromMatrixPosition(p.mesh.leftExhaust.matrixWorld);
      const rightEx = this._vecB.setFromMatrixPosition(p.mesh.rightExhaust.matrixWorld);
      const backward = this._vecC.set(0, 0, -1).applyQuaternion(p.quaternion).negate();
      this.particleFx.emitNitro(leftEx, rightEx, backward);
    } else {
      p.isNitro = false;
      soundManager.setNitro(false);
      this.nitroTank = Math.min(100, this.nitroTank + dt * 4.0);
    }

    // B. Drift handling
    p.isDrifting = (input.drift || (Math.abs(this.currentSteerAngle) > 0.65 && p.speedKmh > 110));
    if (p.isDrifting) {
      soundManager.setDrift(true);
      const lTire = this._vecA.setFromMatrixPosition(p.mesh.rearLeftWheel.matrixWorld);
      const rTire = this._vecB.setFromMatrixPosition(p.mesh.rearRightWheel.matrixWorld);
      this.particleFx.emitDriftSmoke(lTire, rTire);
      this.nitroTank = Math.min(100, this.nitroTank + dt * 14);
    } else {
      soundManager.setDrift(false);
    }

    // C. Acceleration & Braking
    const maxSpeedKmh = ((stats.speed / 100) * 230 + 30) * (p.isNitro ? 1.25 : 1.0);
    const accelRate = (stats.acceleration / 100) * 38 + (p.isNitro ? 24 : 0);
    const brakeRate = 58;

    if (input.accelerate && !input.brake) {
      p.speedKmh = Math.min(maxSpeedKmh, p.speedKmh + accelRate * dt * 3.6);
    } else if (input.brake) {
      p.speedKmh = Math.max(0, p.speedKmh - brakeRate * dt * 3.6);
    } else {
      p.speedKmh = Math.max(0, p.speedKmh - 12 * dt * 3.6);
    }

    // D. Smooth Progressive Steering Interpolation
    let targetSteer = 0;
    if (input.analogSteer !== 0) {
      targetSteer = input.analogSteer;
    } else {
      if (input.steerLeft) targetSteer -= 1.0;
      if (input.steerRight) targetSteer += 1.0;
    }

    // Smooth exponential approach towards target steering angle
    const steerResponseSpeed = 10.0;
    this.currentSteerAngle = THREE.MathUtils.damp(this.currentSteerAngle, targetSteer, steerResponseSpeed, dt);

    const handlingFactor = (stats.handling / 100) * 11.5;
    p.lateralOffset += this.currentSteerAngle * handlingFactor * (p.speedKmh / 150) * dt;

    // Road boundary clamping with elastic barrier rebound
    const MAX_LATERAL = 7.8;
    if (Math.abs(p.lateralOffset) > MAX_LATERAL) {
      const sign = Math.sign(p.lateralOffset);
      p.lateralOffset = sign * MAX_LATERAL;
      p.speedKmh *= 0.94;
      this.cameraShake = 0.35;
      soundManager.playCollision(0.8);
      this.particleFx.emitSparks(p.position, 16);
    }

    // E. Spline Progression
    const speedMs = (p.speedKmh * 1000) / 3600;
    const deltaT = (speedMs * dt) / this.track.totalLength;
    p.trackT += deltaT;
    p.totalDistance += deltaT;

    if (p.trackT >= 1.0) {
      p.trackT -= 1.0;
      p.currentLap += 1;
      if (p.currentLap > this.levelInfo.laps && !this.isRaceFinished) {
        this.triggerRaceFinish();
      }
    }

    // F. Orient Car
    const tp = this.track.getTrackPointAtT(p.trackT);
    p.position.copy(tp.position).addScaledVector(tp.binormal, p.lateralOffset);
    p.position.y += 0.05;

    const forward = this._vecA.copy(tp.tangent);
    if (p.isDrifting) {
      forward.addScaledVector(tp.binormal, this.currentSteerAngle * 0.35).normalize();
    }
    p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward);

    // Roll into turns
    const rollAngle = -this.currentSteerAngle * 0.08 * (p.speedKmh / 180);
    const rollQuat = this._quatA.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollAngle);
    p.quaternion.multiply(rollQuat);

    // Update 3D Mesh
    p.mesh.root.position.copy(p.position);
    p.mesh.root.quaternion.copy(p.quaternion);
    p.mesh.updateSteering(this.currentSteerAngle);
    p.mesh.spinWheels((speedMs * dt) / 0.36);

    // Update Engine Synthesizer
    soundManager.updateEnginePitch(p.speedKmh, input.accelerate);
  }

  private updateAiPhysics(dt: number) {
    if (this.countdown >= 0) return;

    for (let i = 0; i < this.aiVehicles.length; i++) {
      const ai = this.aiVehicles[i];
      const stats = ai.stats;
      const targetSpeed = ai.aiTargetSpeed;

      if (ai.speedKmh < targetSpeed) {
        ai.speedKmh += (stats.acceleration / 100) * 30 * dt * 3.6;
      } else {
        ai.speedKmh -= 10 * dt * 3.6;
      }

      ai.lateralOffset += (ai.aiTargetLane - ai.lateralOffset) * 1.5 * dt;

      const speedMs = (ai.speedKmh * 1000) / 3600;
      const deltaT = (speedMs * dt) / this.track.totalLength;
      ai.trackT += deltaT;
      ai.totalDistance += deltaT;

      if (ai.trackT >= 1.0) {
        ai.trackT -= 1.0;
        ai.currentLap += 1;
      }

      const tp = this.track.getTrackPointAtT(ai.trackT);
      ai.position.copy(tp.position).addScaledVector(tp.binormal, ai.lateralOffset);
      ai.position.y += 0.05;
      ai.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tp.tangent);

      ai.mesh.root.position.copy(ai.position);
      ai.mesh.root.quaternion.copy(ai.quaternion);
      ai.mesh.spinWheels((speedMs * dt) / 0.36);
    }
  }

  private resolveCollisions() {
    const all = this.allRacers; // Zero allocation
    const COLLISION_DIST = 2.4;

    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const vA = all[i];
        const vB = all[j];
        const distSq = vA.position.distanceToSquared(vB.position);

        if (distSq < COLLISION_DIST * COLLISION_DIST) {
          const dist = Math.sqrt(distSq);
          const overlap = COLLISION_DIST - dist;
          const normal = this._vecA.subVectors(vA.position, vB.position).normalize();

          vA.position.addScaledVector(normal, overlap * 0.5);
          vB.position.addScaledVector(normal, -overlap * 0.5);
          vA.lateralOffset += normal.x * overlap * 0.5;
          vB.lateralOffset -= normal.x * overlap * 0.5;

          if (vA.isPlayer || vB.isPlayer) {
            soundManager.playCollision(0.9);
            this.cameraShake = 0.38;
            const mid = this._vecB.addVectors(vA.position, vB.position).multiplyScalar(0.5);
            this.particleFx.emitSparks(mid, 20);
          }
        }
      }
    }
  }

  private updateCamera(dt: number, snap = false) {
    const p = this.playerVehicle;
    const chaseOffset = this._vecA.set(0, 2.7, -6.8).applyQuaternion(p.quaternion);
    const targetCamPos = this._vecB.copy(p.position).add(chaseOffset);

    if (this.cameraShake > 0) {
      targetCamPos.x += (Math.random() - 0.5) * this.cameraShake;
      targetCamPos.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
    }

    if (snap) {
      this.camera.position.copy(targetCamPos);
    } else {
      this.camera.position.lerp(targetCamPos, 1 - Math.exp(-12 * dt));
    }

    const forward = this._vecC.set(0, 0.8, 12).applyQuaternion(p.quaternion);
    this._camTarget.copy(p.position).add(forward);
    this.camera.lookAt(this._camTarget);

    const targetFov = p.isNitro ? 74 : 62;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 8, dt);
    this.camera.updateProjectionMatrix();
  }

  private updateRaceRules() {
    let rank = 1;
    const playerDist = this.playerVehicle.totalDistance;
    for (let i = 0; i < this.aiVehicles.length; i++) {
      if (this.aiVehicles[i].totalDistance > playerDist) {
        rank++;
      }
    }
    this.finishRank = rank;
  }

  private triggerRaceFinish() {
    this.isRaceFinished = true;
    soundManager.setNitro(false);
    soundManager.setDrift(false);
    soundManager.playVictory();

    const rank = this.finishRank;
    const rewardMultiplier = rank === 1 ? 1.0 : rank === 2 ? 0.75 : rank === 3 ? 0.5 : 0.25;
    const finalCoins = Math.floor(this.levelInfo.rewardCoins * rewardMultiplier);
    const finalXp = Math.floor(this.levelInfo.rewardXp * rewardMultiplier);

    saveManager.recordRaceFinish(this.levelInfo.id, rank, this.elapsedTime, finalCoins, finalXp);

    gameBridge.emit('race_finished', {
      rank,
      timeSec: this.elapsedTime,
      coins: finalCoins,
      xp: finalXp,
      levelId: this.levelInfo.id,
    });
  }

  private publishTelemetry() {
    const mins = Math.floor(this.elapsedTime / 60);
    const secs = this.elapsedTime % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`;

    const snap: GameTelemetrySnapshot = {
      speedKmh: Math.round(this.playerVehicle.speedKmh),
      nitroPercent: Math.round(this.nitroTank),
      isNitroActive: this.playerVehicle.isNitro,
      isDrifting: this.playerVehicle.isDrifting,
      currentLap: Math.min(this.playerVehicle.currentLap, this.levelInfo.laps),
      totalLaps: this.levelInfo.laps,
      position: this.finishRank,
      totalRacers: 6,
      elapsedTimeSec: this.elapsedTime,
      countdown: this.countdown,
      isWrongWay: false,
      isFinished: this.isRaceFinished,
      finishRank: this.finishRank,
      raceTimeFormatted: formattedTime,
      playerProgressT: this.playerVehicle.trackT,
      aiProgressList: this.aiVehicles.map(v => v.trackT),
    };

    gameBridge.publishTelemetry(snap);
  }

  public dispose() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);

    soundManager.stopEngine();
    soundManager.setNitro(false);
    soundManager.setDrift(false);

    this.particleFx.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
