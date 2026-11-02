/**
 * ParticleSystem - Object-pooled VFX engine for Nitro flames, tire drift smoke,
 * collision sparks, and high-speed motion blur lines.
 */

import * as THREE from 'three';

interface PooledParticle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

export class ParticleFX {
  private nitroPoints: THREE.Points;
  private smokePoints: THREE.Points;
  private sparkPoints: THREE.Points;

  private nitroParticles: PooledParticle[] = [];
  private smokeParticles: PooledParticle[] = [];
  private sparkParticles: PooledParticle[] = [];

  private nitroPositions: Float32Array;
  private nitroColors: Float32Array;
  private smokePositions: Float32Array;
  private smokeColors: Float32Array;
  private sparkPositions: Float32Array;
  private sparkColors: Float32Array;

  private readonly NITRO_COUNT = 80;
  private readonly SMOKE_COUNT = 120;
  private readonly SPARK_COUNT = 100;

  constructor(scene: THREE.Scene) {
    // 1. NITRO PARTICLES
    this.nitroPositions = new Float32Array(this.NITRO_COUNT * 3);
    this.nitroColors = new Float32Array(this.NITRO_COUNT * 3);
    for (let i = 0; i < this.NITRO_COUNT; i++) {
      this.nitroParticles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.35,
        size: 0.4,
        color: new THREE.Color(0x38bdf8),
      });
    }

    const nitroGeom = new THREE.BufferGeometry();
    nitroGeom.setAttribute('position', new THREE.BufferAttribute(this.nitroPositions, 3));
    nitroGeom.setAttribute('color', new THREE.BufferAttribute(this.nitroColors, 3));

    const nitroMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.nitroPoints = new THREE.Points(nitroGeom, nitroMat);
    scene.add(this.nitroPoints);

    // 2. SMOKE PARTICLES
    this.smokePositions = new Float32Array(this.SMOKE_COUNT * 3);
    this.smokeColors = new Float32Array(this.SMOKE_COUNT * 3);
    for (let i = 0; i < this.SMOKE_COUNT; i++) {
      this.smokeParticles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.7,
        size: 0.6,
        color: new THREE.Color(0x94a3b8),
      });
    }

    const smokeGeom = new THREE.BufferGeometry();
    smokeGeom.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));
    smokeGeom.setAttribute('color', new THREE.BufferAttribute(this.smokeColors, 3));

    const smokeMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.smokePoints = new THREE.Points(smokeGeom, smokeMat);
    scene.add(this.smokePoints);

    // 3. COLLISION SPARKS
    this.sparkPositions = new Float32Array(this.SPARK_COUNT * 3);
    this.sparkColors = new Float32Array(this.SPARK_COUNT * 3);
    for (let i = 0; i < this.SPARK_COUNT; i++) {
      this.sparkParticles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.4,
        size: 0.3,
        color: new THREE.Color(0xfbbf24),
      });
    }

    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    sparkGeom.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    scene.add(this.sparkPoints);
  }

  public emitNitro(leftExhaustWorld: THREE.Vector3, rightExhaustWorld: THREE.Vector3, carBackward: THREE.Vector3) {
    const origins = [leftExhaustWorld, rightExhaustWorld];
    for (const origin of origins) {
      for (let j = 0; j < 2; j++) {
        const p = this.nitroParticles.find(part => !part.active);
        if (!p) break;
        p.active = true;
        p.life = 0;
        p.maxLife = 0.2 + Math.random() * 0.15;
        p.position.copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1));
        p.velocity.copy(carBackward).multiplyScalar(22 + Math.random() * 8);
        p.velocity.x += (Math.random() - 0.5) * 2;
        p.velocity.y += (Math.random() - 0.5) * 2;
        p.color.set(Math.random() > 0.4 ? 0x06b6d4 : 0x3b82f6); // Electric blue / cyan
      }
    }
  }

  public emitDriftSmoke(leftTireWorld: THREE.Vector3, rightTireWorld: THREE.Vector3) {
    const tires = [leftTireWorld, rightTireWorld];
    for (const pos of tires) {
      const p = this.smokeParticles.find(part => !part.active);
      if (!p) break;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * 0.3;
      p.position.copy(pos);
      p.position.y += 0.1;
      p.velocity.set((Math.random() - 0.5) * 1.5, Math.random() * 1.5 + 0.5, (Math.random() - 0.5) * 1.5);
    }
  }

  public emitSparks(contactWorld: THREE.Vector3, count = 15) {
    for (let i = 0; i < count; i++) {
      const p = this.sparkParticles.find(part => !part.active);
      if (!p) break;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.25 + Math.random() * 0.2;
      p.position.copy(contactWorld);
      p.velocity.set(
        (Math.random() - 0.5) * 12,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 12
      );
      p.color.set(Math.random() > 0.3 ? 0xf59e0b : 0xef4444);
    }
  }

  public update(dt: number) {
    // 1. Update Nitro
    for (let i = 0; i < this.NITRO_COUNT; i++) {
      const p = this.nitroParticles[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
        } else {
          p.position.addScaledVector(p.velocity, dt);
          const alpha = 1 - p.life / p.maxLife;
          this.nitroPositions[i * 3] = p.position.x;
          this.nitroPositions[i * 3 + 1] = p.position.y;
          this.nitroPositions[i * 3 + 2] = p.position.z;
          this.nitroColors[i * 3] = p.color.r * alpha;
          this.nitroColors[i * 3 + 1] = p.color.g * alpha;
          this.nitroColors[i * 3 + 2] = p.color.b * alpha;
          continue;
        }
      }
      this.nitroPositions[i * 3 + 1] = -9999;
    }
    this.nitroPoints.geometry.attributes.position.needsUpdate = true;
    this.nitroPoints.geometry.attributes.color.needsUpdate = true;

    // 2. Update Smoke
    for (let i = 0; i < this.SMOKE_COUNT; i++) {
      const p = this.smokeParticles[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
        } else {
          p.position.addScaledVector(p.velocity, dt);
          const alpha = (1 - p.life / p.maxLife) * 0.4;
          this.smokePositions[i * 3] = p.position.x;
          this.smokePositions[i * 3 + 1] = p.position.y;
          this.smokePositions[i * 3 + 2] = p.position.z;
          this.smokeColors[i * 3] = 0.8 * alpha;
          this.smokeColors[i * 3 + 1] = 0.8 * alpha;
          this.smokeColors[i * 3 + 2] = 0.8 * alpha;
          continue;
        }
      }
      this.smokePositions[i * 3 + 1] = -9999;
    }
    this.smokePoints.geometry.attributes.position.needsUpdate = true;
    this.smokePoints.geometry.attributes.color.needsUpdate = true;

    // 3. Update Sparks
    for (let i = 0; i < this.SPARK_COUNT; i++) {
      const p = this.sparkParticles[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
        } else {
          p.velocity.y -= 18 * dt; // Gravity on sparks
          p.position.addScaledVector(p.velocity, dt);
          this.sparkPositions[i * 3] = p.position.x;
          this.sparkPositions[i * 3 + 1] = p.position.y;
          this.sparkPositions[i * 3 + 2] = p.position.z;
          this.sparkColors[i * 3] = p.color.r;
          this.sparkColors[i * 3 + 1] = p.color.g;
          this.sparkColors[i * 3 + 2] = p.color.b;
          continue;
        }
      }
      this.sparkPositions[i * 3 + 1] = -9999;
    }
    this.sparkPoints.geometry.attributes.position.needsUpdate = true;
    this.sparkPoints.geometry.attributes.color.needsUpdate = true;
  }

  public dispose() {
    this.nitroPoints.geometry.dispose();
    (this.nitroPoints.material as THREE.Material).dispose();
    this.smokePoints.geometry.dispose();
    (this.smokePoints.material as THREE.Material).dispose();
    this.sparkPoints.geometry.dispose();
    (this.sparkPoints.material as THREE.Material).dispose();
  }
}
