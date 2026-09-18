import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { snorlaxAudio } from '../../utils/snorlaxAudio';

export interface Snorlax3DCanvasProps {
  isSleeping: boolean;
  isHappy: boolean;
  isBerryEating?: boolean;
  isOpen?: boolean;
  isGigantamax?: boolean;
  onPoke?: () => void;
  className?: string;
  size?: number; // pixel size
}

/**
 * High-fidelity 3D Snorlax modeled after the reference vinyl figurine:
 * - Waving right arm (viewer's left) raised high with 5 white claws
 * - Resting left arm (viewer's right) anchored on the ground
 * - Two huge chubby cream feet with circular caramel paw pads and 3 outer white claws each
 * - Massive round bulging tummy with warm cream patch
 * - 3D white conical fangs pointing upwards from the lower jaw
 * - Clean canonical horizontal sleepy slit eyes
 * - Forehead V-cowl dip and solid slate-teal pointed ears
 */

// 1. Soft matte vinyl bump texture for tactile surface
function createVinylBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    const val = THREE.MathUtils.clamp(128 + noise, 0, 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 2. Paw Pad Caramel Cushion Texture (Warm caramel milk-chocolate circle)
function createPawPadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 122);
  grad.addColorStop(0.0, '#a87153'); // warm caramel center
  grad.addColorStop(0.70, '#9e674b'); // authentic reference brown
  grad.addColorStop(0.95, '#8b573d'); // contour rim
  grad.addColorStop(1.0, '#754730'); // outer border
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Soft vinyl rim reflection
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 128, 92, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 3. Body Texture: Slate-teal fur with huge round cream tummy dome
function createBodyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Smooth vinyl slate-teal matching reference image
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  bgGrad.addColorStop(0.0, '#42788e'); // soft top highlight
  bgGrad.addColorStop(0.35, '#386e82'); // iconic reference slate-teal
  bgGrad.addColorStop(0.75, '#2e5d6f'); // mid shadow
  bgGrad.addColorStop(1.0, '#234755'); // deep ambient base
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Massive Round Cream Tummy Patch (Centered at x=512, facing camera)
  ctx.save();
  ctx.beginPath();
  // Snorlax's tummy is a huge, glorious, smooth dome
  ctx.ellipse(512, 590, 310, 325, 0, 0, Math.PI * 2);

  // Warm cream gradient matching reference
  const tmGrad = ctx.createRadialGradient(512, 540, 50, 512, 590, 330);
  tmGrad.addColorStop(0.0, '#faf2e4'); // luminous warm center
  tmGrad.addColorStop(0.65, '#eedfc8'); // reference warm custard-cream
  tmGrad.addColorStop(0.90, '#e0ceb4'); // soft contour warmth
  tmGrad.addColorStop(1.0, '#d1bfa4'); // feathered edge
  ctx.fillStyle = tmGrad;
  ctx.fill();

  // Subtle clean border transition
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#c8b69a';
  ctx.stroke();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4. Cream Fur Texture for feet
function createCreamFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
  grad.addColorStop(0.0, '#faf2e4');
  grad.addColorStop(0.70, '#eedfc8');
  grad.addColorStop(0.92, '#e0ceb4');
  grad.addColorStop(1.0, '#d1bfa4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4b. Soft Radial Contact Shadow Texture
function createSoftShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(4, 18, 26, 0.72)');
  grad.addColorStop(0.35, 'rgba(4, 18, 26, 0.45)');
  grad.addColorStop(0.65, 'rgba(4, 18, 26, 0.16)');
  grad.addColorStop(0.92, 'rgba(4, 18, 26, 0.02)');
  grad.addColorStop(1.0, 'rgba(4, 18, 26, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * 5. Dynamic Head Texture Renderer (1024x1024 Native)
 * Accurately reproduces the reference image:
 * - Slate-teal base with deep V-dip forehead notch
 * - Smooth cream face mask with peaks toward the ears
 * - Clean, thin, horizontal sleeping slit eyes `—   —`
 * - Subtle resting mouth line (3D fangs will be real 3D meshes!)
 */
function renderReferenceSnorlaxHead(
  ctx: CanvasRenderingContext2D,
  sleeping: boolean,
  happy: boolean,
  isBlink: boolean
) {
  ctx.clearRect(0, 0, 1024, 1024);

  // A. Slate-Teal Fur Base
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  bgGrad.addColorStop(0.0, '#42788e');
  bgGrad.addColorStop(0.40, '#386e82');
  bgGrad.addColorStop(0.75, '#2e5d6f');
  bgGrad.addColorStop(1.0, '#234755');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // B. Cream Face Mask with Iconic Forehead V-Dip
  ctx.save();
  ctx.beginPath();
  // Forehead center V-dip (slate-teal dips down directly in the center above the eyes):
  ctx.moveTo(512, 388);
  // Curve up-left to the left ear peak:
  ctx.bezierCurveTo(462, 368, 388, 250, 336, 240);
  // Around left temple:
  ctx.bezierCurveTo(276, 235, 206, 370, 186, 490);
  // Plump chubby left cheek swell:
  ctx.bezierCurveTo(176, 580, 196, 710, 240, 810);
  // Downward along left jaw:
  ctx.bezierCurveTo(280, 900, 310, 965, 330, 1024);
  // Across bottom of chin/neck:
  ctx.lineTo(694, 1024);
  // Upward along right jaw:
  ctx.bezierCurveTo(714, 965, 744, 900, 784, 810);
  // Plump chubby right cheek swell:
  ctx.bezierCurveTo(828, 710, 848, 580, 838, 490);
  // Around right temple:
  ctx.bezierCurveTo(818, 370, 748, 235, 688, 240);
  // Curve up-right to right peak and back down to forehead V-dip:
  ctx.bezierCurveTo(636, 250, 562, 368, 512, 388);
  ctx.closePath();

  // Cream gradient fill
  const faceGrad = ctx.createRadialGradient(512, 590, 30, 512, 610, 380);
  faceGrad.addColorStop(0.0, '#faf2e4');
  faceGrad.addColorStop(0.65, '#eedfc8');
  faceGrad.addColorStop(0.88, '#e0ceb4');
  faceGrad.addColorStop(1.0, '#d1bfa4');
  ctx.fillStyle = faceGrad;
  ctx.fill();

  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#c8b69a';
  ctx.stroke();

  // C. Snorlax's Canonical Eyes from Reference Image:
  // Clean, dark, clearly defined horizontal sleeping slit eyes
  ctx.strokeStyle = '#0a1a22'; // deep high-contrast charcoal navy
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (happy) {
    // Joyful crescent smiling eyes `^   ^`
    ctx.lineWidth = 14;
    // Left Eye
    ctx.beginPath();
    ctx.moveTo(344, 510);
    ctx.quadraticCurveTo(395, 460, 446, 510);
    ctx.stroke();

    // Right Eye
    ctx.beginPath();
    ctx.moveTo(578, 510);
    ctx.quadraticCurveTo(629, 460, 680, 510);
    ctx.stroke();

  } else if (sleeping) {
    // SLEEPING: Gentle horizontal slits with slight downward inner angle
    ctx.lineWidth = 14;
    // Left Eye
    ctx.beginPath();
    ctx.moveTo(342, 492);
    ctx.quadraticCurveTo(395, 508, 448, 502);
    ctx.stroke();

    // Right Eye
    ctx.beginPath();
    ctx.moveTo(682, 492);
    ctx.quadraticCurveTo(629, 508, 576, 502);
    ctx.stroke();

  } else if (isBlink) {
    // Blink: Flat horizontal resting line
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(346, 498);
    ctx.lineTo(444, 498);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(580, 498);
    ctx.lineTo(678, 498);
    ctx.stroke();

  } else {
    // EXACT MATCH TO REFERENCE IMAGE:
    // Bold, crisp, clearly visible horizontal sleeping slit lines `—      —`
    ctx.lineWidth = 14;

    // Left Eye: Horizontal slit with bold rounded ends
    ctx.beginPath();
    ctx.moveTo(340, 498);
    ctx.lineTo(450, 498);
    ctx.stroke();

    // Right Eye: Horizontal slit with bold rounded ends
    ctx.beginPath();
    ctx.moveTo(574, 498);
    ctx.lineTo(684, 498);
    ctx.stroke();
  }

  // D. Mouth line
  // Clean resting horizontal smile line (The 3D teeth will sit right on top in 3D!)
  ctx.lineWidth = 8.5;
  ctx.strokeStyle = '#122c36';

  if (happy) {
    ctx.beginPath();
    ctx.moveTo(420, 642);
    ctx.quadraticCurveTo(512, 638, 604, 642);
    ctx.bezierCurveTo(595, 730, 429, 730, 420, 642);
    ctx.closePath();
    ctx.fillStyle = '#6b202c';
    ctx.fill();
    ctx.stroke();
  } else {
    // Gentle resting smile line
    ctx.beginPath();
    ctx.moveTo(420, 650);
    ctx.quadraticCurveTo(512, 672, 604, 650);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Main Snorlax3DCanvas Component
 */
export const Snorlax3DCanvas: React.FC<Snorlax3DCanvasProps> = ({
  isSleeping,
  isHappy,
  isBerryEating = false,
  isOpen = false,
  isGigantamax = false,
  onPoke,
  className = '',
  size = 120,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const isSleepingRef = useRef(isSleeping);
  const isHappyRef = useRef(isHappy);
  const isBerryEatingRef = useRef(isBerryEating);
  const isOpenRef = useRef(isOpen);
  const isGigantamaxRef = useRef(isGigantamax);
  const triggerBerryBurstRef = useRef(false);
  const triggerSummonRingRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animStateRef = useRef<{
    hop: number;
    earWiggle: number;
    waveAmount: number;
    time: number;
  }>({
    hop: 0,
    earWiggle: 0,
    waveAmount: 0,
    time: 0,
  });

  // Keep refs synchronized
  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  useEffect(() => {
    isHappyRef.current = isHappy;
    if (isHappy) {
      animStateRef.current.earWiggle = 1.0;
      animStateRef.current.waveAmount = 1.0;
      animStateRef.current.hop = 0.35;
    }
  }, [isHappy]);

  useEffect(() => {
    isBerryEatingRef.current = isBerryEating;
    if (isBerryEating) {
      triggerBerryBurstRef.current = true;
      animStateRef.current.hop = 0.45;
      animStateRef.current.earWiggle = 1.0;
    }
  }, [isBerryEating]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      triggerSummonRingRef.current = true;
      animStateRef.current.waveAmount = 1.0;
    }
  }, [isOpen]);

  useEffect(() => {
    isGigantamaxRef.current = isGigantamax;
    if (isGigantamax) {
      animStateRef.current.hop = 0.6;
      animStateRef.current.earWiggle = 1.2;
    }
  }, [isGigantamax]);

  // Global mouse tracking for head orientation
  useEffect(() => {
    let mouseRaf: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseRaf) return;
      mouseRaf = requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseRef.current = { x: nx, y: ny };
        mouseRaf = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
    };
  }, []);

  // Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Reset fallback state on fresh setup attempt
    setUseFallback(false);

    // 1. Scene & Camera (Framed exactly like the reference photo)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    // Camera positioned at gentle eye level to capture the rotund belly and waving paw
    camera.position.set(0, 0.18, 3.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        precision: 'mediump',
      });
    } catch (err) {
      console.warn('Snorlax3DCanvas: WebGL unavailable, switching to 2D fallback', err);
      setUseFallback(true);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('Snorlax3DCanvas: WebGL context lost, switching to fallback');
      setUseFallback(true);
    };

    const handleContextRestored = () => {
      console.info('Snorlax3DCanvas: WebGL context restored, recovering scene');
      setUseFallback(false);
    };

    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    renderer.setSize(size, size);
    // Optimized pixel ratio capped at 1.0 to prevent GPU bottleneck on small widget
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 2. Lighting: Soft studio key light + cool rim light + gentle ground ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffdf7, 1.75);
    dirLight.position.set(2.8, 4.0, 3.6);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
    rimLight.position.set(-3.2, 2.8, -2.4);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.38);
    fillLight.position.set(-1.8, -1.2, 2.2);
    scene.add(fillLight);

    // Emotion Glow Halo Light behind character (Upgrade #2)
    const emotionLight = new THREE.PointLight(0x10f296, 0.55, 3.4);
    emotionLight.position.set(0, 0.35, -0.75);
    scene.add(emotionLight);

    // 3. Procedural Textures & Materials
    const bumpTexture = createVinylBumpTexture();
    const pawPadTexture = createPawPadTexture();
    const bodyTexture = createBodyTexture();
    const creamFurTexture = createCreamFurTexture();

    // Dynamic Head Canvas & Texture
    const headCanvas = document.createElement('canvas');
    headCanvas.width = 1024;
    headCanvas.height = 1024;
    const headCtx = headCanvas.getContext('2d')!;
    const headTexture = new THREE.CanvasTexture(headCanvas);
    headTexture.colorSpace = THREE.SRGBColorSpace;

    // Vinyl materials matching reference toy aesthetic
    const headMat = new THREE.MeshPhysicalMaterial({
      map: headTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.0020,
      roughness: 0.52,
      metalness: 0.02,
      sheen: 0.28,
      sheenColor: new THREE.Color(0x42788e),
      sheenRoughness: 0.55,
    });

    const bodyMat = new THREE.MeshPhysicalMaterial({
      map: bodyTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.0022,
      roughness: 0.54,
      metalness: 0.02,
      sheen: 0.28,
      sheenColor: new THREE.Color(0x42788e),
      sheenRoughness: 0.55,
    });

    // Solid slate-teal fur material for ears and arms
    const tealTextureCanvas = document.createElement('canvas');
    tealTextureCanvas.width = 256;
    tealTextureCanvas.height = 256;
    const ttCtx = tealTextureCanvas.getContext('2d')!;
    const tGrad = ttCtx.createLinearGradient(0, 0, 0, 256);
    tGrad.addColorStop(0.0, '#42788e');
    tGrad.addColorStop(0.4, '#386e82');
    tGrad.addColorStop(1.0, '#264f5f');
    ttCtx.fillStyle = tGrad;
    ttCtx.fillRect(0, 0, 256, 256);
    const tealFurTexture = new THREE.CanvasTexture(tealTextureCanvas);
    tealFurTexture.colorSpace = THREE.SRGBColorSpace;

    const tealMat = new THREE.MeshPhysicalMaterial({
      map: tealFurTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.0020,
      roughness: 0.52,
      metalness: 0.02,
      sheen: 0.28,
      sheenColor: new THREE.Color(0x42788e),
      sheenRoughness: 0.55,
    });

    const creamMat = new THREE.MeshPhysicalMaterial({
      map: creamFurTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.0020,
      roughness: 0.54,
      metalness: 0.01,
      sheen: 0.25,
      sheenColor: new THREE.Color(0xfffaec),
      sheenRoughness: 0.52,
    });

    const pawPadMat = new THREE.MeshPhysicalMaterial({
      map: pawPadTexture,
      roughness: 0.58,
      metalness: 0.02,
    });

    // Pure white vinyl cones for fangs and claws
    const whiteClawMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.24,
      metalness: 0.02,
      clearcoat: 0.35,
      clearcoatRoughness: 0.18,
    });

    // 4. Snorlax 3D Hierarchy
    const snorlaxRoot = new THREE.Group();
    snorlaxRoot.position.set(0, -0.22, 0);
    scene.add(snorlaxRoot);

    // Floor Soft Radial Contact Shadow (Upgrade #6)
    const softShadowTex = createSoftShadowTexture();
    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.25),
      new THREE.MeshBasicMaterial({
        map: softShadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    shadowMesh.position.set(0, -0.57, 0.05);
    shadowMesh.rotation.x = -Math.PI / 2;
    snorlaxRoot.add(shadowMesh);

    // Holographic Torus Summoning Ring on Chat Open (Upgrade #5)
    const summonRingGeo = new THREE.TorusGeometry(0.52, 0.016, 8, 64);
    const summonRingMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const summonRingMesh = new THREE.Mesh(summonRingGeo, summonRingMat);
    summonRingMesh.rotation.x = Math.PI / 2;
    summonRingMesh.position.set(0, -0.56, 0);
    snorlaxRoot.add(summonRingMesh);

    let summonRingProgress = 0;
    let isSummonRingActive = false;

    // 3D Berry Particle Burst System (Upgrade #1)
    const berryBursts: Array<{
      points: THREE.Points;
      velocities: THREE.Vector3[];
      age: number;
      maxAge: number;
    }> = [];

    const spawnBerryBurst = () => {
      const count = 24;
      const positions = new Float32Array(count * 3);
      const velocities: THREE.Vector3[] = [];

      for (let i = 0; i < count; i++) {
        // Origin around upper belly/mouth
        positions[i * 3] = (Math.random() - 0.5) * 0.16;
        positions[i * 3 + 1] = 0.35 + (Math.random() - 0.5) * 0.12;
        positions[i * 3 + 2] = 0.45 + (Math.random() - 0.5) * 0.10;

        velocities.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.055,
            Math.random() * 0.065 + 0.025,
            Math.random() * 0.045 + 0.015
          )
        );
      }

      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xff3b5c,
        size: 0.065,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
      });

      const pMesh = new THREE.Points(pGeo, pMat);
      snorlaxRoot.add(pMesh);
      berryBursts.push({
        points: pMesh,
        velocities,
        age: 0,
        maxAge: 1.35,
      });
    };

    // Body Container (Tilted slightly backward like the reference image sitting pose)
    const bodyGroup = new THREE.Group();
    bodyGroup.rotation.x = -0.10;
    snorlaxRoot.add(bodyGroup);

    // -------------------------------------------------------------
    // Rotund Pear-Shaped Torso with Forward Belly Dome (Proportional & Compact)
    // -------------------------------------------------------------
    const bodyGeo = new THREE.SphereGeometry(0.74, 56, 44);
    bodyGeo.rotateY(-Math.PI / 2);

    const bPos = bodyGeo.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      let vx = bPos.getX(i);
      let vy = bPos.getY(i);
      let vz = bPos.getZ(i);

      const t = THREE.MathUtils.clamp((vy + 0.74) / 1.48, 0, 1);
      // Bottom-heavy rotund shape
      const bellyCurve = Math.sin(t * Math.PI * 0.88);
      const lowerPlump = Math.exp(-Math.pow((t - 0.28) / 0.26, 2)) * 0.32;
      const widthScale = 0.90 + bellyCurve * 0.38 + lowerPlump;
      const depthScale = 0.84 + bellyCurve * 0.36 + lowerPlump * 0.85;

      vx *= widthScale;
      vz *= depthScale;

      // Front bulging belly dome
      if (vz > 0 && t > 0.04 && t < 0.86) {
        const pouch = Math.sin(t * Math.PI * 0.92) * 0.20 * Math.cos(THREE.MathUtils.clamp(vx / (widthScale * 0.78), -1, 1) * Math.PI * 0.5);
        vz += Math.max(0, pouch);
      }

      // Flat base for stable floor sitting
      if (t < 0.15) {
        vy = vy * 0.80 - 0.04;
      }

      bPos.setXYZ(i, vx, vy, vz);
    }
    bodyGeo.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, -0.04, 0);
    bodyGroup.add(bodyMesh);

    // -------------------------------------------------------------
    // Head Pivot Group (Snug, low neckless transition atop belly)
    // -------------------------------------------------------------
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.46, 0.02);
    bodyGroup.add(headGroup);

    // Plump chubby head mesh
    const headGeo = new THREE.SphereGeometry(0.53, 56, 44);
    headGeo.rotateY(-Math.PI / 2);

    const hPos = headGeo.attributes.position;
    for (let i = 0; i < hPos.count; i++) {
      let vx = hPos.getX(i);
      let vy = hPos.getY(i);
      let vz = hPos.getZ(i);

      const t = THREE.MathUtils.clamp((vy + 0.53) / 1.06, 0, 1);
      // Wide chubby lower cheeks
      const cheekChub = Math.exp(-Math.pow((t - 0.28) / 0.28, 2)) * 0.24 + (1.0 - t) * 0.08;
      const widthScale = 1.12 + cheekChub;
      const depthScale = 0.94 - t * 0.04;

      vx *= widthScale;
      vz *= depthScale;
      vy *= 0.92;

      hPos.setXYZ(i, vx, vy, vz);
    }
    headGeo.computeVertexNormals();

    const headMesh = new THREE.Mesh(headGeo, headMat);
    headGroup.add(headMesh);

    // 2 Pointed Triangular Ears (Solid slate teal - matching reference photo)
    const earGeo = new THREE.ConeGeometry(0.17, 0.36, 24);
    const ePos = earGeo.attributes.position;
    for (let i = 0; i < ePos.count; i++) {
      let vx = ePos.getX(i);
      let vy = ePos.getY(i);
      let vz = ePos.getZ(i);
      vz *= 0.72;
      ePos.setXYZ(i, vx, vy, vz);
    }
    earGeo.computeVertexNormals();

    // Left Ear
    const leftEar = new THREE.Mesh(earGeo, tealMat);
    leftEar.position.set(-0.35, 0.43, -0.02);
    leftEar.rotation.z = 0.38;
    leftEar.rotation.x = -0.14;
    headGroup.add(leftEar);

    // Right Ear
    const rightEar = new THREE.Mesh(earGeo, tealMat);
    rightEar.position.set(0.35, 0.43, -0.02);
    rightEar.rotation.z = -0.38;
    rightEar.rotation.x = -0.14;
    headGroup.add(rightEar);

    // -------------------------------------------------------------
    // REAL 3D WHITE FANGS PROTRUDING UPWARDS FROM LOWER JAW!
    // (Exact match to the reference image figurine)
    // -------------------------------------------------------------
    const fangGeo = new THREE.ConeGeometry(0.042, 0.10, 16);
    // Left Fang (Viewer's left)
    const leftFang = new THREE.Mesh(fangGeo, whiteClawMat);
    leftFang.position.set(-0.11, -0.065, 0.488);
    leftFang.rotation.x = -0.22;
    leftFang.rotation.z = -0.08;
    headGroup.add(leftFang);

    // Right Fang (Viewer's right)
    const rightFang = new THREE.Mesh(fangGeo, whiteClawMat);
    rightFang.position.set(0.11, -0.065, 0.488);
    rightFang.rotation.x = -0.22;
    rightFang.rotation.z = 0.08;
    headGroup.add(rightFang);

    // Initial Head Canvas Render
    renderReferenceSnorlaxHead(headCtx, isSleepingRef.current, isHappyRef.current, false);
    headTexture.needsUpdate = true;

    // -------------------------------------------------------------
    // THE ICONIC WAVING RIGHT ARM (Viewer's Left)
    // Raised high in that adorable beckoning / waving pose with 5 white claws!
    // -------------------------------------------------------------
    const wavingArmPivot = new THREE.Group();
    wavingArmPivot.position.set(-0.62, 0.22, 0.08);
    bodyGroup.add(wavingArmPivot);

    const armGeo = new THREE.CapsuleGeometry(0.17, 0.44, 20, 20);
    const wavingArmMesh = new THREE.Mesh(armGeo, tealMat);
    // Angled UP towards the head/ear
    wavingArmMesh.position.set(-0.10, 0.24, 0.05);
    wavingArmMesh.rotation.z = -0.42;
    wavingArmMesh.rotation.x = -0.18;
    wavingArmPivot.add(wavingArmMesh);

    // 5 Curved White Conical Claws along the top rim of the waving paw
    const wavingClawOffsets = [-0.075, -0.038, 0.0, 0.038, 0.075];
    wavingClawOffsets.forEach((cx, idx) => {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.065, 14), whiteClawMat);
      // Fan claws out neatly along the top arc of the paw
      const angle = -0.55 + (idx / 4) * 1.10;
      claw.position.set(
        -0.19 - Math.sin(angle) * 0.12,
        0.44 + Math.cos(angle) * 0.08,
        0.05 + cx * 0.4
      );
      claw.rotation.z = -angle;
      claw.rotation.x = 0.18;
      wavingArmPivot.add(claw);
    });

    // -------------------------------------------------------------
    // THE RESTING LEFT ARM (Viewer's Right)
    // Resting comfortably on the ground beside the belly with small claws
    // -------------------------------------------------------------
    const restingArmPivot = new THREE.Group();
    restingArmPivot.position.set(0.64, 0.08, 0.05);
    bodyGroup.add(restingArmPivot);

    const restingArmMesh = new THREE.Mesh(armGeo, tealMat);
    restingArmMesh.position.set(0.18, -0.22, 0.02);
    restingArmMesh.rotation.z = -0.65;
    restingArmMesh.rotation.x = 0.28;
    restingArmPivot.add(restingArmMesh);

    // Claws on resting hand touching the floor
    for (let c = 0; c < 3; c++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.048, 12), whiteClawMat);
      const cx = (c - 1) * 0.035;
      claw.position.set(0.32 + cx, -0.42, 0.12);
      claw.rotation.x = Math.PI / 2 - 0.2;
      restingArmPivot.add(claw);
    }

    // -------------------------------------------------------------
    // CHUBBY CREAM FEET WITH CARAMEL PAW PADS & 3 OUTER CLAWS EACH!
    // (Exact match to the reference photo!)
    // -------------------------------------------------------------
    const footGeo = new THREE.SphereGeometry(0.29, 32, 28);
    const footPos = footGeo.attributes.position;
    for (let i = 0; i < footPos.count; i++) {
      let vx = footPos.getX(i);
      let vy = footPos.getY(i);
      let vz = footPos.getZ(i);
      vx *= 1.14;
      vz *= 1.28;
      vy *= 0.90;
      if (vy < -0.06) {
        vy = vy * 0.75 - 0.02;
      }
      footPos.setXYZ(i, vx, vy, vz);
    }
    footGeo.computeVertexNormals();

    const padGeo = new THREE.CylinderGeometry(0.165, 0.175, 0.022, 32);

    // --- LEFT FOOT (Viewer's Left) ---
    const leftFootGroup = new THREE.Group();
    leftFootGroup.position.set(-0.52, -0.40, 0.52);
    leftFootGroup.rotation.x = -0.28;
    leftFootGroup.rotation.y = 0.18;
    bodyGroup.add(leftFootGroup);

    const leftFootMesh = new THREE.Mesh(footGeo, creamMat);
    leftFootGroup.add(leftFootMesh);

    // Large Circular Caramel Paw Pad on lower half of sole
    const leftFootPad = new THREE.Mesh(padGeo, pawPadMat);
    leftFootPad.position.set(-0.02, -0.08, 0.235);
    leftFootPad.rotation.x = Math.PI / 2;
    leftFootGroup.add(leftFootPad);

    // 3 CHUNKY WHITE CLAWS along the outer-left and top edge of the foot!
    // Matching `image.png`: claw 1 at ~9 o'clock (outer), claw 2 at ~10:30, claw 3 at ~12 o'clock (top)
    const leftClawAngles = [Math.PI, (Math.PI * 3) / 4, Math.PI / 2];
    leftClawAngles.forEach((ang) => {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.085, 14), whiteClawMat);
      const rad = 0.275;
      const cx = Math.cos(ang) * rad;
      const cy = Math.sin(ang) * rad + 0.02;
      claw.position.set(cx, cy, 0.14);
      claw.rotation.z = ang - Math.PI / 2;
      claw.rotation.x = 0.25;
      leftFootGroup.add(claw);
    });

    // --- RIGHT FOOT (Viewer's Right) ---
    const rightFootGroup = new THREE.Group();
    rightFootGroup.position.set(0.52, -0.40, 0.52);
    rightFootGroup.rotation.x = -0.28;
    rightFootGroup.rotation.y = -0.18;
    bodyGroup.add(rightFootGroup);

    const rightFootMesh = new THREE.Mesh(footGeo, creamMat);
    rightFootGroup.add(rightFootMesh);

    // Large Circular Caramel Paw Pad on lower half of sole
    const rightFootPad = new THREE.Mesh(padGeo, pawPadMat);
    rightFootPad.position.set(0.02, -0.08, 0.235);
    rightFootPad.rotation.x = Math.PI / 2;
    rightFootGroup.add(rightFootPad);

    // 3 CHUNKY WHITE CLAWS along the outer-right and top edge of the foot!
    // Matching `image.png`: claw 1 at ~3 o'clock (outer), claw 2 at ~1:30, claw 3 at ~12 o'clock (top)
    const rightClawAngles = [0, Math.PI / 4, Math.PI / 2];
    rightClawAngles.forEach((ang) => {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.085, 14), whiteClawMat);
      const rad = 0.275;
      const cx = Math.cos(ang) * rad;
      const cy = Math.sin(ang) * rad + 0.02;
      claw.position.set(cx, cy, 0.14);
      claw.rotation.z = ang - Math.PI / 2;
      claw.rotation.x = 0.25;
      rightFootGroup.add(claw);
    });

    // -------------------------------------------------------------
    // Floating "Zzz" Sleep Particles
    // -------------------------------------------------------------
    const zParticles: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const zCanvas = document.createElement('canvas');
      zCanvas.width = 128;
      zCanvas.height = 128;
      const zCtx = zCanvas.getContext('2d')!;
      zCtx.fillStyle = '#6ee7b7';
      zCtx.font = 'bold 72px sans-serif';
      zCtx.textAlign = 'center';
      zCtx.textBaseline = 'middle';
      zCtx.shadowColor = 'rgba(20, 184, 166, 0.8)';
      zCtx.shadowBlur = 14;
      zCtx.fillText('Z', 64, 64);

      const zTexture = new THREE.CanvasTexture(zCanvas);
      const zMat = new THREE.SpriteMaterial({
        map: zTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const zSprite = new THREE.Sprite(zMat);
      const scale = 0.16 + i * 0.06;
      zSprite.scale.set(scale, scale, 1);

      const zGroup = new THREE.Group();
      zGroup.add(zSprite);
      zGroup.position.set(0.35 + i * 0.10, 0.55 + i * 0.22, 0.2);
      snorlaxRoot.add(zGroup);
      zParticles.push(zGroup);
    }

    // -------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------
    let reqId: number = 0;
    const clock = new THREE.Clock();
    const lastFaceState = {
      sleeping: isSleepingRef.current,
      happy: isHappyRef.current,
      isBlink: false,
    };

    // Bug #6 Fix: Minimum blink duration lock (160ms) to prevent texture churn
    let blinkStartTime = 0;
    const BLINK_HOLD_MS = 160;

    // Bug #10 Fix: Respect tab visibility to conserve 100% CPU/GPU on hidden tabs
    let isTabVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const animate = () => {
      if (!isTabVisible) {
        reqId = 0;
        return;
      }
      // If user is viewing the 3D Chamber at the top of the page, pause Snorlax rendering
      if (typeof window !== 'undefined' && window.scrollY < window.innerHeight * 0.95) {
        reqId = requestAnimationFrame(animate);
        return;
      }

      reqId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      animStateRef.current.time += delta;
      const time = animStateRef.current.time;

      const sleeping = isSleepingRef.current;
      const happy = isHappyRef.current || animStateRef.current.hop > 0.1;

      // Cute periodic blink cycle with debounce
      const blinkPhase = Math.sin(time * 1.5);
      const rawBlink = blinkPhase > 0.94;
      const now = performance.now();
      if (rawBlink && !lastFaceState.isBlink) {
        blinkStartTime = now;
      }
      const isBlink = rawBlink || (now - blinkStartTime < BLINK_HOLD_MS);

      // Update head canvas texture ONLY when state genuinely changes
      if (
        lastFaceState.sleeping !== sleeping ||
        lastFaceState.happy !== happy ||
        lastFaceState.isBlink !== isBlink
      ) {
        renderReferenceSnorlaxHead(headCtx, sleeping, happy, isBlink);
        headTexture.needsUpdate = true;
        lastFaceState.sleeping = sleeping;
        lastFaceState.happy = happy;
        lastFaceState.isBlink = isBlink;
      }

      // Decay hop and ear wiggle
      if (animStateRef.current.hop > 0) {
        animStateRef.current.hop = Math.max(0, animStateRef.current.hop - delta * 1.6);
      }
      if (animStateRef.current.earWiggle > 0) {
        animStateRef.current.earWiggle = Math.max(0, animStateRef.current.earWiggle - delta * 2.2);
      }
      if (animStateRef.current.waveAmount > 0) {
        animStateRef.current.waveAmount = Math.max(0, animStateRef.current.waveAmount - delta * 1.4);
      }

      // Upgrade #2: Dynamic Emotion Halo Lighting
      const isGm = isGigantamaxRef.current;
      const targetEmotionIntensity = isGm ? 2.4 : sleeping ? 0.35 : happy ? 1.3 : 0.55;
      const targetEmotionColor = isGm
        ? new THREE.Color(0xff4433)
        : sleeping
        ? new THREE.Color(0x38bdf8)
        : happy
        ? new THREE.Color(0xfbbf24)
        : new THREE.Color(0x10f296);

      emotionLight.intensity = THREE.MathUtils.lerp(emotionLight.intensity, targetEmotionIntensity, 0.08);
      emotionLight.color.lerp(targetEmotionColor, 0.08);

      // Upgrade #9: Gigantamax Scale Transition
      const gmScaleTarget = isGm ? 1.35 : 1.0;
      snorlaxRoot.scale.lerp(new THREE.Vector3(gmScaleTarget, gmScaleTarget, gmScaleTarget), 0.08);

      // Upgrade #5: Expanding Summoning Ring Effect
      if (triggerSummonRingRef.current) {
        triggerSummonRingRef.current = false;
        isSummonRingActive = true;
        summonRingProgress = 0;
      }
      if (isSummonRingActive) {
        summonRingProgress += delta * 2.4;
        const sp = Math.min(1.0, summonRingProgress);
        const ringScale = 1.0 + sp * 2.8;
        summonRingMesh.scale.set(ringScale, ringScale, 1.0);
        summonRingMat.opacity = Math.max(0, 0.85 * (1.0 - sp));
        if (sp >= 1.0) {
          isSummonRingActive = false;
          summonRingMesh.scale.set(1, 1, 1);
          summonRingMat.opacity = 0;
        }
      }

      // Upgrade #1: 3D Berry Particle Burst
      if (triggerBerryBurstRef.current) {
        triggerBerryBurstRef.current = false;
        spawnBerryBurst();
      }
      for (let i = berryBursts.length - 1; i >= 0; i--) {
        const b = berryBursts[i];
        b.age += delta;
        const progress = b.age / b.maxAge;
        const posAttr = b.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let j = 0; j < b.velocities.length; j++) {
          const vx = b.velocities[j].x;
          const vy = b.velocities[j].y - delta * 0.08;
          const vz = b.velocities[j].z;
          b.velocities[j].y = vy;
          posAttr.setXYZ(
            j,
            posAttr.getX(j) + vx,
            posAttr.getY(j) + vy,
            posAttr.getZ(j) + vz
          );
        }
        posAttr.needsUpdate = true;
        (b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1.0 - progress);

        if (progress >= 1.0) {
          snorlaxRoot.remove(b.points);
          b.points.geometry.dispose();
          (b.points.material as THREE.PointsMaterial).dispose();
          berryBursts.splice(i, 1);
        }
      }

      // 1. Organic Belly Breathing squash & stretch
      const breathSpeed = sleeping ? 1.2 : 2.2;
      const breathAmp = sleeping ? 0.038 : 0.024;
      const breath = Math.sin(time * breathSpeed);

      const hopOffset = Math.sin(animStateRef.current.hop * Math.PI) * 0.22;
      snorlaxRoot.position.y = -0.22 + hopOffset;

      bodyGroup.scale.set(
        1 + breath * breathAmp,
        1 - breath * (breathAmp * 0.5),
        1 + breath * (breathAmp * 0.6)
      );

      // 2. Cursor tracking (Head smoothly follows cursor)
      const rawMouseX = mouseRef.current?.x ?? 0;
      const rawMouseY = mouseRef.current?.y ?? 0;
      const curMouseX = THREE.MathUtils.clamp(rawMouseX, -1, 1);
      const curMouseY = THREE.MathUtils.clamp(rawMouseY, -1, 1);

      const targetRotX = sleeping ? 0.03 : THREE.MathUtils.clamp(-curMouseY * 0.12, -0.10, 0.08);
      const targetRotY = sleeping ? 0.0 : THREE.MathUtils.clamp(curMouseX * 0.20, -0.22, 0.22);

      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetRotX, 0.08);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetRotY, 0.08);

      // 3. Ear Wiggles
      const earWiggleVal = Math.sin(time * 26) * animStateRef.current.earWiggle * 0.35;
      leftEar.rotation.z = 0.38 + earWiggleVal;
      rightEar.rotation.z = -0.38 - earWiggleVal;

      // 4. THE WAVING PAW ANIMATION! (Lucky cat beckoning wave)
      const waveBase = Math.sin(time * 3.2) * 0.08;
      const extraWave = Math.sin(time * 12) * 0.32 * animStateRef.current.waveAmount;
      wavingArmPivot.rotation.z = waveBase + extraWave;
      wavingArmPivot.rotation.y = Math.sin(time * 2.8) * 0.05;

      // 5. Floating "Zzz" Particles Animation
      zParticles.forEach((zg, idx) => {
        const sprite = zg.children[0] as THREE.Sprite;
        if (sleeping) {
          const zCycle = (time * 0.85 + idx * 0.48) % 1.7;
          const progress = zCycle / 1.7;
          zg.position.x = 0.28 + Math.sin(progress * Math.PI * 2) * 0.09 + idx * 0.09;
          zg.position.y = 0.58 + progress * 0.80;
          zg.position.z = 0.22;
          sprite.material.opacity = Math.sin(progress * Math.PI) * 0.90;
        } else {
          sprite.material.opacity = THREE.MathUtils.lerp(sprite.material.opacity, 0, 0.18);
        }
      });

      renderer.render(scene, camera);
    };

    const handleVisibilityChange = () => {
      isTabVisible = typeof document !== 'undefined' ? !document.hidden : true;
      if (isTabVisible && !reqId) {
        clock.start();
        reqId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animate();

    // Cleanup
    return () => {
      if (reqId) cancelAnimationFrame(reqId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      softShadowTex.dispose();
      summonRingGeo.dispose();
      summonRingMat.dispose();
      berryBursts.forEach((b) => {
        snorlaxRoot.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.PointsMaterial).dispose();
      });
      bumpTexture.dispose();
      pawPadTexture.dispose();
      bodyTexture.dispose();
      creamFurTexture.dispose();
      tealFurTexture.dispose();
      headTexture.dispose();
      headMat.dispose();
      bodyMat.dispose();
      tealMat.dispose();
      creamMat.dispose();
      pawPadMat.dispose();
      whiteClawMat.dispose();
      bodyGeo.dispose();
      headGeo.dispose();
      earGeo.dispose();
      armGeo.dispose();
      footGeo.dispose();
      padGeo.dispose();
      fangGeo.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      try {
        renderer.forceContextLoss();
        renderer.dispose();
      } catch (e) {
        // ignore
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  // Handle Poke / Click Interaction
  const handleClick = () => {
    animStateRef.current.hop = 1.0;
    animStateRef.current.earWiggle = 1.0;
    animStateRef.current.waveAmount = 1.0;

    if (isSleepingRef.current) {
      snorlaxAudio.playYawn();
    } else {
      snorlaxAudio.playPoke();
    }

    if (onPoke) {
      onPoke();
    }
  };

  if (useFallback) {
    return (
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Interactive Snorlax Pet Companion"
        className={`relative flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 group ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Animated Generation V Black/White Sprite Fallback (Upgrade #4) */}
        <div className="relative w-full h-full flex items-center justify-center p-1">
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/143.gif"
            alt="Snorlax Companion Sprite"
            className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(20,184,166,0.35)] transition-transform group-hover:scale-110"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              // If CDN fails, hide img and display SVG fallback
              (e.target as HTMLElement).style.display = 'none';
              const fallbackSvg = (e.target as HTMLElement).nextElementSibling;
              if (fallbackSvg) (fallbackSvg as HTMLElement).style.display = 'block';
            }}
          />
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md transition-transform hover:scale-105 hidden"
          >
            {/* Ears */}
            <polygon points="26,38 18,12 38,24" fill="#0c2d3a" />
            <polygon points="26,34 21,18 34,26" fill="#1e4d5f" />
            <polygon points="74,38 82,12 62,24" fill="#0c2d3a" />
            <polygon points="74,34 79,18 66,26" fill="#1e4d5f" />
            {/* Body */}
            <circle cx="50" cy="58" r="38" fill="#123d4e" />
            {/* Arms */}
            <ellipse cx="20" cy="56" rx="9" ry="12" fill="#0c2d3a" transform="rotate(-15 20 56)" />
            <ellipse cx="80" cy="56" rx="9" ry="12" fill="#0c2d3a" transform="rotate(15 80 56)" />
            {/* Cream Belly */}
            <ellipse cx="50" cy="62" rx="27" ry="24" fill="#fcf3df" />
            {/* Head */}
            <circle cx="50" cy="40" r="25" fill="#123d4e" />
            <path
              d="M 33,35 C 33,26 40,28 50,34 C 60,28 67,26 67,35 C 69,45 66,54 50,54 C 34,54 31,45 33,35 Z"
              fill="#fcf3df"
            />
            {/* Eyes */}
            {isHappy ? (
              <>
                <path d="M 38,39 Q 42,34 46,39" stroke="#0e232c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M 54,39 Q 58,34 62,39" stroke="#0e232c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <line x1="38" y1="38" x2="45" y2="38" stroke="#0e232c" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="55" y1="38" x2="62" y2="38" stroke="#0e232c" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}
            {/* Little Fangs & Smile */}
            {isHappy ? (
              <>
                <path d="M 44,45 Q 50,49 56,45" stroke="#0e232c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <polygon points="43,45 45,43 45,46" fill="#ffffff" />
                <polygon points="57,45 55,43 55,46" fill="#ffffff" />
              </>
            ) : (
              <>
                <path d="M 46,45 Q 50,47 54,45" stroke="#0e232c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <polygon points="44,45 46,43 46,46" fill="#ffffff" />
                <polygon points="56,45 54,43 54,46" fill="#ffffff" />
              </>
            )}
            {/* Feet */}
            <ellipse cx="32" cy="85" rx="11" ry="8" fill="#fcf3df" />
            <ellipse cx="68" cy="85" rx="11" ry="8" fill="#fcf3df" />
            <circle cx="32" cy="85" r="4.5" fill="#ab8765" />
            <circle cx="68" cy="85" r="4.5" fill="#ab8765" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Interactive 3D Snorlax Pet Companion"
      className={`relative cursor-pointer select-none transition-transform active:scale-95 ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
