/**
 * CarGeometry - Procedural 3D Sports Car composite mesh generator.
 * Uses cached shared textures and materials to prevent allocations and UI hanging.
 */

import * as THREE from 'three';
import { CarCustomization } from '../../data/GameData';

export interface CarMeshComponents {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  leftExhaust: THREE.Object3D;
  rightExhaust: THREE.Object3D;
  underglowLight: THREE.PointLight;
  underglowMesh: THREE.Mesh;
  headlightsGroup: THREE.Group;
  taillightsMesh: THREE.Mesh;
  updateCustomization: (custom: CarCustomization) => void;
  updateSteering: (steerRatio: number) => void;
  spinWheels: (rotationDelta: number) => void;
}

// Global texture caches to prevent redundant canvas creation and UI freezes
let sharedTireTexture: THREE.CanvasTexture | null = null;
let sharedContactShadowTexture: THREE.CanvasTexture | null = null;
const stripeTextureCache = new Map<string, THREE.CanvasTexture>();

function getSharedTireTexture(): THREE.CanvasTexture {
  if (!sharedTireTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#0f172a';
    for (let y = 0; y < 128; y += 16) {
      ctx.fillRect(0, y, 128, 4);
      ctx.fillRect(y, 0, 4, 128);
    }

    sharedTireTexture = new THREE.CanvasTexture(canvas);
    sharedTireTexture.wrapS = THREE.RepeatWrapping;
    sharedTireTexture.wrapT = THREE.RepeatWrapping;
    sharedTireTexture.repeat.set(2, 4);
    sharedTireTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return sharedTireTexture;
}

function getSharedShadowTexture(): THREE.CanvasTexture {
  if (!sharedContactShadowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    sharedContactShadowTexture = new THREE.CanvasTexture(canvas);
  }
  return sharedContactShadowTexture;
}

function getCachedStripeTexture(baseColorHex: string, stripeType: string): THREE.CanvasTexture {
  const cacheKey = `${baseColorHex}_${stripeType}`;
  if (stripeTextureCache.has(cacheKey)) {
    return stripeTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, 512, 512);

  if (stripeType === 'twin_stripes') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(230, 0, 20, 512);
    ctx.fillRect(262, 0, 20, 512);
    ctx.fillStyle = '#000000';
    ctx.fillRect(228, 0, 2, 512);
    ctx.fillRect(282, 0, 2, 512);
  } else if (stripeType === 'cyber_accent') {
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(120, 0);
    ctx.lineTo(256, 320);
    ctx.lineTo(392, 0);
    ctx.stroke();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(140, 0);
    ctx.lineTo(256, 300);
    ctx.lineTo(372, 0);
    ctx.stroke();
  } else if (stripeType === 'racing_num') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(256, 256, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('07', 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  stripeTextureCache.set(cacheKey, texture);
  return texture;
}

export function createProceduralCar(
  carColorHex = '#E11D48',
  customization?: CarCustomization,
  isShadowCaster = true
): CarMeshComponents {
  const root = new THREE.Group();
  root.name = 'SportsCarRoot';

  const baseCustom: CarCustomization = customization || {
    color: carColorHex,
    wheelStyle: 'turbine',
    stripeStyle: 'twin_stripes',
    underglow: '#06B6D4',
  };

  // 1. CAR BODY MATERIAL
  const stripeTexture = getCachedStripeTexture(baseCustom.color, baseCustom.stripeStyle);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseCustom.color),
    map: stripeTexture,
    metalness: 0.82,
    roughness: 0.22,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.55,
    metalness: 0.4,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1122,
    metalness: 0.95,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.95,
    roughness: 0.1,
  });

  // 2. PRIMARY SILHOUETTE: CHASSIS & AERODYNAMIC BODY
  const bodyGeom = new THREE.BoxGeometry(2.0, 0.48, 4.4, 2, 2, 4);
  const pos = bodyGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const y = pos.getY(i);
    if (z > 0.8) {
      const taper = 1.0 - (z - 0.8) * 0.25;
      pos.setX(i, pos.getX(i) * taper);
      if (y > 0) pos.setY(i, y * 0.7);
    }
    if (z < -1.0 && y < 0) {
      pos.setY(i, y * 0.5);
    }
  }
  bodyGeom.computeVertexNormals();

  const bodyMesh = new THREE.Mesh(bodyGeom, bodyMaterial);
  bodyMesh.position.y = 0.48;
  bodyMesh.castShadow = isShadowCaster;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Splitter & Diffuser
  const splitterGeom = new THREE.BoxGeometry(2.05, 0.08, 0.7);
  const splitterMesh = new THREE.Mesh(splitterGeom, carbonMaterial);
  splitterMesh.position.set(0, 0.26, 2.15);
  splitterMesh.castShadow = isShadowCaster;
  root.add(splitterMesh);

  const diffuserGeom = new THREE.BoxGeometry(1.9, 0.16, 0.6);
  const diffuserMesh = new THREE.Mesh(diffuserGeom, carbonMaterial);
  diffuserMesh.position.set(0, 0.32, -2.15);
  diffuserMesh.castShadow = isShadowCaster;
  root.add(diffuserMesh);

  // 3. SECONDARY READ: CABIN / COCKPIT
  const cabinGeom = new THREE.BoxGeometry(1.48, 0.46, 2.1, 2, 2, 3);
  const cabinPos = cabinGeom.attributes.position;
  for (let i = 0; i < cabinPos.count; i++) {
    const y = cabinPos.getY(i);
    const z = cabinPos.getZ(i);
    if (y > 0) {
      if (z > 0) cabinPos.setZ(i, z - 0.45);
      else cabinPos.setZ(i, z + 0.35);
      cabinPos.setX(i, cabinPos.getX(i) * 0.78);
    }
  }
  cabinGeom.computeVertexNormals();

  const cabinMesh = new THREE.Mesh(cabinGeom, glassMaterial);
  cabinMesh.position.set(0, 0.88, -0.2);
  cabinMesh.castShadow = isShadowCaster;
  root.add(cabinMesh);

  const roofGeom = new THREE.BoxGeometry(1.18, 0.06, 1.2);
  const roofMesh = new THREE.Mesh(roofGeom, bodyMaterial);
  roofMesh.position.set(0, 1.12, -0.25);
  roofMesh.castShadow = isShadowCaster;
  root.add(roofMesh);

  // 4. ACCENT DETAIL: REAR RACING SPOILER
  const spoilerGroup = new THREE.Group();
  spoilerGroup.position.set(0, 0.92, -2.05);

  const wingGeom = new THREE.BoxGeometry(2.0, 0.06, 0.45);
  const wingMesh = new THREE.Mesh(wingGeom, carbonMaterial);
  spoilerGroup.add(wingMesh);

  const uprightGeom = new THREE.BoxGeometry(0.06, 0.32, 0.28);
  const uprightLeft = new THREE.Mesh(uprightGeom, carbonMaterial);
  uprightLeft.position.set(-0.65, -0.16, 0);
  const uprightRight = new THREE.Mesh(uprightGeom, carbonMaterial);
  uprightRight.position.set(0.65, -0.16, 0);
  spoilerGroup.add(uprightLeft, uprightRight);
  root.add(spoilerGroup);

  // 5. LIGHTS
  const headlightsGroup = new THREE.Group();
  headlightsGroup.position.set(0, 0.52, 2.16);

  const headGeom = new THREE.BoxGeometry(0.38, 0.12, 0.1);
  const headMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  const headLeft = new THREE.Mesh(headGeom, headMat);
  headLeft.position.x = -0.72;
  const headRight = new THREE.Mesh(headGeom, headMat);
  headRight.position.x = 0.72;
  headlightsGroup.add(headLeft, headRight);
  root.add(headlightsGroup);

  const tailGeom = new THREE.BoxGeometry(1.7, 0.08, 0.06);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
  const taillightsMesh = new THREE.Mesh(tailGeom, tailMat);
  taillightsMesh.position.set(0, 0.58, -2.2);
  root.add(taillightsMesh);

  // 6. EXHAUSTS
  const exhaustGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 12);
  exhaustGeom.rotateX(Math.PI / 2);

  const leftExhaust = new THREE.Mesh(exhaustGeom, chromeMaterial);
  leftExhaust.position.set(-0.45, 0.34, -2.22);
  const rightExhaust = new THREE.Mesh(exhaustGeom, chromeMaterial);
  rightExhaust.position.set(0.45, 0.34, -2.22);
  root.add(leftExhaust, rightExhaust);

  // 7. SHARED WHEELS & BRAKES
  const tireTexture = getSharedTireTexture();
  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    map: tireTexture,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: baseCustom.wheelStyle === 'gold_dish' ? 0xeab308 : 0xcccccc,
    metalness: 0.9,
    roughness: 0.15,
  });

  const brakeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    metalness: 0.6,
    roughness: 0.3,
  });

  function createWheel(): THREE.Group {
    const wheelGroup = new THREE.Group();

    const tireGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 16);
    tireGeom.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeom, tireMaterial);
    tireMesh.castShadow = isShadowCaster;
    wheelGroup.add(tireMesh);

    const rimGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 14);
    rimGeom.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeom, rimMaterial);
    wheelGroup.add(rimMesh);

    const discGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12);
    discGeom.rotateZ(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeom, chromeMaterial);
    discMesh.position.x = 0.04;
    wheelGroup.add(discMesh);

    const caliperGeom = new THREE.BoxGeometry(0.08, 0.12, 0.08);
    const caliperMesh = new THREE.Mesh(caliperGeom, brakeMaterial);
    caliperMesh.position.set(0.05, 0.12, 0);
    wheelGroup.add(caliperMesh);

    return wheelGroup;
  }

  const frontLeftWheel = createWheel();
  frontLeftWheel.position.set(-1.02, 0.36, 1.3);

  const frontRightWheel = createWheel();
  frontRightWheel.position.set(1.02, 0.36, 1.3);

  const rearLeftWheel = createWheel();
  rearLeftWheel.position.set(-1.02, 0.36, -1.3);

  const rearRightWheel = createWheel();
  rearRightWheel.position.set(1.02, 0.36, -1.3);

  root.add(frontLeftWheel, frontRightWheel, rearLeftWheel, rearRightWheel);

  // 8. NEON UNDERGLOW
  const underglowGeom = new THREE.PlaneGeometry(1.8, 3.6);
  underglowGeom.rotateX(-Math.PI / 2);
  const underglowColor = baseCustom.underglow === 'off' ? '#000000' : baseCustom.underglow;
  const underglowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(underglowColor),
    transparent: true,
    opacity: baseCustom.underglow === 'off' ? 0.0 : 0.7,
    depthWrite: false,
  });
  const underglowMesh = new THREE.Mesh(underglowGeom, underglowMat);
  underglowMesh.position.y = 0.06;
  root.add(underglowMesh);

  const underglowLight = new THREE.PointLight(
    new THREE.Color(underglowColor),
    baseCustom.underglow === 'off' ? 0 : 3.0,
    3.5
  );
  underglowLight.position.set(0, 0.12, 0);
  root.add(underglowLight);

  // 9. SOFT CONTACT SHADOW GROUNDING
  const shadowTex = getSharedShadowTexture();
  const shadowGeom = new THREE.PlaneGeometry(2.6, 5.0);
  shadowGeom.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeom, shadowMat);
  contactShadow.position.y = 0.02;
  root.add(contactShadow);

  const updateCustomization = (custom: CarCustomization) => {
    bodyMaterial.color.set(custom.color);
    bodyMaterial.map = getCachedStripeTexture(custom.color, custom.stripeStyle);
    bodyMaterial.needsUpdate = true;

    rimMaterial.color.set(custom.wheelStyle === 'gold_dish' ? 0xeab308 : 0xcccccc);
    rimMaterial.needsUpdate = true;

    const ugColor = custom.underglow === 'off' ? '#000000' : custom.underglow;
    underglowMat.color.set(ugColor);
    underglowMat.opacity = custom.underglow === 'off' ? 0 : 0.7;
    underglowLight.color.set(ugColor);
    underglowLight.intensity = custom.underglow === 'off' ? 0 : 3.0;
  };

  const updateSteering = (steerRatio: number) => {
    const angle = steerRatio * 0.42;
    frontLeftWheel.rotation.y = angle;
    frontRightWheel.rotation.y = angle;
  };

  const spinWheels = (rotationDelta: number) => {
    frontLeftWheel.children[0].rotation.x += rotationDelta;
    frontRightWheel.children[0].rotation.x += rotationDelta;
    rearLeftWheel.children[0].rotation.x += rotationDelta;
    rearRightWheel.children[0].rotation.x += rotationDelta;
  };

  return {
    root,
    bodyMesh,
    frontLeftWheel,
    frontRightWheel,
    rearLeftWheel,
    rearRightWheel,
    leftExhaust,
    rightExhaust,
    underglowLight,
    underglowMesh,
    headlightsGroup,
    taillightsMesh,
    updateCustomization,
    updateSteering,
    spinWheels,
  };
}
