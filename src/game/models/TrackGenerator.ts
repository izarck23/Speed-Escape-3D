/**
 * TrackGenerator - Procedural 3D Desert Highway Track and Environment.
 * Builds the curved racing highway, finish line checkered gantry, roadside guardrails,
 * canyon cliffs, cacti, hot air balloons, and waypoint checkpoints for navigation and AI.
 */

import * as THREE from 'three';

export interface TrackPoint {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  width: number;
  curvature: number;
}

export interface TrackData {
  root: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  waypoints: THREE.Vector3[];
  trackPoints: TrackPoint[];
  totalLength: number;
  roadMesh: THREE.Mesh;
  finishLineZ: number;
  getTrackPointAtT: (t: number) => TrackPoint;
  getClosestT: (pos: THREE.Vector3) => number;
}

export function createDesertHighwayTrack(scene: THREE.Scene): TrackData {
  const root = new THREE.Group();
  root.name = 'TrackEnvironmentRoot';

  // 1. DEFINE TRACK CONTROL POINTS (A sweeping oval / stadium canyon circuit with chicanes)
  // Total circumference ~ 1,600 meters
  const rawPoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 0),          // Finish / Start straight
    new THREE.Vector3(10, 0.5, 120),
    new THREE.Vector3(45, 1.5, 260),      // Turn 1 sweeping right
    new THREE.Vector3(120, 2.0, 380),
    new THREE.Vector3(220, 1.0, 440),     // Turn 2 apex
    new THREE.Vector3(320, 0.5, 410),
    new THREE.Vector3(380, 0, 310),       // East straight
    new THREE.Vector3(400, -1.0, 180),
    new THREE.Vector3(360, 0, 40),        // Turn 3 chicane
    new THREE.Vector3(320, 1.2, -80),
    new THREE.Vector3(300, 2.5, -220),    // Canyon climb
    new THREE.Vector3(260, 2.0, -360),
    new THREE.Vector3(170, 1.0, -460),    // North hairpin apex
    new THREE.Vector3(60, 0.5, -480),
    new THREE.Vector3(-40, 0, -420),      // Descent toward main straight
    new THREE.Vector3(-80, -0.5, -280),
    new THREE.Vector3(-60, 0, -140),
  ];

  const curve = new THREE.CatmullRomCurve3(rawPoints, true, 'centripetal');
  const totalLength = curve.getLength();

  // Sample discrete track slices
  const SAMPLE_COUNT = 300;
  const trackPoints: TrackPoint[] = [];
  const waypoints: THREE.Vector3[] = [];

  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const t = i / SAMPLE_COUNT;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    trackPoints.push({
      position: pt,
      tangent,
      normal,
      binormal,
      width: 18.0, // 4-lane wide highway
      curvature: 0,
    });
    if (i < SAMPLE_COUNT) {
      waypoints.push(pt.clone());
    }
  }

  // 2. PROCEDURAL ROAD SURFACE TEXTURE
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 512;
  const rCtx = roadCanvas.getContext('2d')!;

  // Asphalt base
  rCtx.fillStyle = '#23252b';
  rCtx.fillRect(0, 0, 512, 512);

  // Grain noise
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = Math.floor(Math.random() * 40 + 20);
    rCtx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.25)`;
    rCtx.fillRect(x, y, 2, 2);
  }

  // Outer solid lane markings
  rCtx.fillStyle = '#fbbf24'; // Yellow side stripes
  rCtx.fillRect(16, 0, 12, 512);
  rCtx.fillRect(484, 0, 12, 512);

  // Center dashed dividing lines
  rCtx.fillStyle = '#f8fafc';
  for (let y = 0; y < 512; y += 64) {
    rCtx.fillRect(250, y, 12, 36);
    rCtx.fillRect(134, y, 8, 36);
    rCtx.fillRect(370, y, 8, 36);
  }

  const roadTexture = new THREE.CanvasTexture(roadCanvas);
  roadTexture.wrapS = THREE.RepeatWrapping;
  roadTexture.wrapT = THREE.RepeatWrapping;
  roadTexture.repeat.set(1, 80);
  roadTexture.colorSpace = THREE.SRGBColorSpace;

  // 3. GENERATE ROAD RIBBON MESH
  const roadGeom = new THREE.BufferGeometry();
  const roadVertices: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const halfWidth = 9.0;
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const tp = trackPoints[i];
    const left = tp.position.clone().addScaledVector(tp.binormal, -halfWidth);
    const right = tp.position.clone().addScaledVector(tp.binormal, halfWidth);

    roadVertices.push(left.x, left.y + 0.05, left.z);
    roadVertices.push(right.x, right.y + 0.05, right.z);

    const v = (i / SAMPLE_COUNT) * 80;
    roadUvs.push(0, v);
    roadUvs.push(1, v);

    if (i < SAMPLE_COUNT) {
      const base = i * 2;
      roadIndices.push(base, base + 1, base + 2);
      roadIndices.push(base + 1, base + 3, base + 2);
    }
  }

  roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeom.setIndex(roadIndices);
  roadGeom.computeVertexNormals();

  const roadMaterial = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.8,
    metalness: 0.1,
  });

  const roadMesh = new THREE.Mesh(roadGeom, roadMaterial);
  roadMesh.receiveShadow = true;
  root.add(roadMesh);

  // 4. GUARDRAILS ALONG BOTH EDGES
  const guardMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
  });

  const railGeom = new THREE.CylinderGeometry(0.12, 0.12, 4.0, 8);
  railGeom.rotateX(Math.PI / 2);

  // Place guardrail posts every 4 track points
  const postGeom = new THREE.BoxGeometry(0.15, 0.9, 0.15);
  for (let i = 0; i < SAMPLE_COUNT; i += 3) {
    const tp = trackPoints[i];
    const leftPos = tp.position.clone().addScaledVector(tp.binormal, -halfWidth - 0.3);
    const rightPos = tp.position.clone().addScaledVector(tp.binormal, halfWidth + 0.3);

    const postLeft = new THREE.Mesh(postGeom, guardMat);
    postLeft.position.set(leftPos.x, leftPos.y + 0.45, leftPos.z);
    const postRight = new THREE.Mesh(postGeom, guardMat);
    postRight.position.set(rightPos.x, rightPos.y + 0.45, rightPos.z);
    root.add(postLeft, postRight);
  }

  // 5. FINISH LINE / CHECKPOINT GANTRY ARCH
  const gantryGroup = new THREE.Group();
  const startPt = trackPoints[0];
  gantryGroup.position.copy(startPt.position);
  gantryGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startPt.tangent);

  // Dual pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
  const pillarGeom = new THREE.BoxGeometry(1.2, 7.5, 1.2);
  const leftPillar = new THREE.Mesh(pillarGeom, pillarMat);
  leftPillar.position.set(-halfWidth - 1.2, 3.75, 0);
  const rightPillar = new THREE.Mesh(pillarGeom, pillarMat);
  rightPillar.position.set(halfWidth + 1.2, 3.75, 0);
  gantryGroup.add(leftPillar, rightPillar);

  // Overhead beam
  const beamGeom = new THREE.BoxGeometry(halfWidth * 2 + 3.6, 1.6, 1.4);
  const beamMesh = new THREE.Mesh(beamGeom, pillarMat);
  beamMesh.position.set(0, 7.0, 0);
  gantryGroup.add(beamMesh);

  // Checkered Finish Board on Beam
  const checkCanvas = document.createElement('canvas');
  checkCanvas.width = 256;
  checkCanvas.height = 64;
  const cCtx = checkCanvas.getContext('2d')!;
  for (let x = 0; x < 256; x += 32) {
    for (let y = 0; y < 64; y += 32) {
      cCtx.fillStyle = (x / 32 + y / 32) % 2 === 0 ? '#ffffff' : '#000000';
      cCtx.fillRect(x, y, 32, 32);
    }
  }
  const checkTex = new THREE.CanvasTexture(checkCanvas);
  const checkMat = new THREE.MeshBasicMaterial({ map: checkTex });
  const checkMesh = new THREE.Mesh(new THREE.PlaneGeometry(halfWidth * 2, 1.2), checkMat);
  checkMesh.position.set(0, 7.0, 0.72);
  gantryGroup.add(checkMesh);

  // Glowing neon sign on arch
  const signGeom = new THREE.PlaneGeometry(8, 0.8);
  const signMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const signMesh = new THREE.Mesh(signGeom, signMat);
  signMesh.position.set(0, 7.8, 0.73);
  gantryGroup.add(signMesh);

  root.add(gantryGroup);

  // 6. SCENIC DESERT CANYON ROCKS & CLIFFS
  const canyonMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c, // Sandstone terracotta
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });

  const rockGeom = new THREE.DodecahedronGeometry(1, 1);
  const rockInstanced = new THREE.InstancedMesh(rockGeom, canyonMat, 90);
  const dummy = new THREE.Object3D();

  let rockIdx = 0;
  for (let i = 10; i < SAMPLE_COUNT; i += 7) {
    const tp = trackPoints[i];
    // Place rocky outcroppings outside track boundaries
    const side = (rockIdx % 2 === 0 ? 1 : -1) * (halfWidth + 12 + Math.random() * 25);
    const rockPos = tp.position.clone().addScaledVector(tp.binormal, side);
    const scaleY = 12 + Math.random() * 28;
    const scaleXZ = 10 + Math.random() * 16;

    dummy.position.set(rockPos.x, rockPos.y + scaleY * 0.4, rockPos.z);
    dummy.scale.set(scaleXZ, scaleY, scaleXZ);
    dummy.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2);
    dummy.updateMatrix();

    rockInstanced.setMatrixAt(rockIdx, dummy.matrix);
    rockIdx++;
    if (rockIdx >= 90) break;
  }
  rockInstanced.instanceMatrix.needsUpdate = true;
  rockInstanced.castShadow = true;
  rockInstanced.receiveShadow = true;
  root.add(rockInstanced);

  // 7. DESERT SAGUARO CACTI
  const cactusMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Desert green
    roughness: 0.7,
    metalness: 0.1,
  });
  const cactusStemGeom = new THREE.CylinderGeometry(0.35, 0.4, 4.5, 8);
  const cactusInstanced = new THREE.InstancedMesh(cactusStemGeom, cactusMat, 40);

  let cactusIdx = 0;
  for (let i = 5; i < SAMPLE_COUNT; i += 12) {
    const tp = trackPoints[i];
    const side = (cactusIdx % 2 === 0 ? 1 : -1) * (halfWidth + 3.5 + Math.random() * 5);
    const cPos = tp.position.clone().addScaledVector(tp.binormal, side);

    dummy.position.set(cPos.x, cPos.y + 2.25, cPos.z);
    dummy.scale.set(1 + Math.random() * 0.4, 1 + Math.random() * 0.5, 1 + Math.random() * 0.4);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.updateMatrix();

    cactusInstanced.setMatrixAt(cactusIdx, dummy.matrix);
    cactusIdx++;
    if (cactusIdx >= 40) break;
  }
  cactusInstanced.instanceMatrix.needsUpdate = true;
  root.add(cactusInstanced);

  // 8. HOT AIR BALLOONS IN THE SKY (Visible in the reference screenshot!)
  const balloonMat1 = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
  const balloonMat2 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.6 });
  const balloonMat3 = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.6 });

  const balloonGeom = new THREE.SphereGeometry(6, 16, 16);
  const balloon1 = new THREE.Mesh(balloonGeom, balloonMat1);
  balloon1.position.set(180, 85, 200);

  const balloon2 = new THREE.Mesh(balloonGeom, balloonMat2);
  balloon2.position.set(-90, 75, -120);

  const balloon3 = new THREE.Mesh(balloonGeom, balloonMat3);
  balloon3.position.set(340, 95, -280);

  root.add(balloon1, balloon2, balloon3);

  // 9. VAST DESERT GROUND PLANE
  const groundGeom = new THREE.PlaneGeometry(1600, 1600);
  groundGeom.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412, // Warm desert sand
    roughness: 0.98,
    metalness: 0.02,
  });
  const groundMesh = new THREE.Mesh(groundGeom, groundMat);
  groundMesh.position.y = -0.5;
  groundMesh.receiveShadow = true;
  root.add(groundMesh);

  scene.add(root);

  // Helper functions
  const getTrackPointAtT = (t: number): TrackPoint => {
    const wrappedT = ((t % 1) + 1) % 1;
    const index = Math.floor(wrappedT * SAMPLE_COUNT);
    return trackPoints[Math.min(index, SAMPLE_COUNT)];
  };

  const getClosestT = (pos: THREE.Vector3): number => {
    let closestDistSq = Infinity;
    let closestIndex = 0;
    // Check every 3 points for speed
    for (let i = 0; i < SAMPLE_COUNT; i += 2) {
      const dSq = pos.distanceToSquared(trackPoints[i].position);
      if (dSq < closestDistSq) {
        closestDistSq = dSq;
        closestIndex = i;
      }
    }
    return closestIndex / SAMPLE_COUNT;
  };

  return {
    root,
    curve,
    waypoints,
    trackPoints,
    totalLength,
    roadMesh,
    finishLineZ: startPt.position.z,
    getTrackPointAtT,
    getClosestT,
  };
}
