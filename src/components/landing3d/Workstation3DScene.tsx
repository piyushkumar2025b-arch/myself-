import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createRealisticCat, updateCatAnimation, CatRig } from './Cat3D';
import { createRealisticDeveloper, updateDeveloperAnimation, DeveloperRig } from './HumanCharacter3D';
import { createWelcomeDrone, updateWelcomeDroneAnimation, WelcomeDroneRig } from './WelcomeDrone3D';
import { cyberAudio } from '../../utils/cyberAudio';

export type CameraPreset = 'overview' | 'workstation' | 'developer' | 'cat' | 'drone' | 'underdesk' | 'cpurig' | 'macbook' | 'skyline';

export interface Workstation3DSceneProps {
  scrollProgress: number; // 0 to 1
  mousePos?: { x: number; y: number }; // -1 to 1
  isEntered?: boolean;
  activePreset?: CameraPreset;
  zoomLevel?: number; // 0.6 to 1.6
  lightingMoodIndex?: number;
  onLightingMoodChange?: (moodIndex: number) => void;
  isAutoRotate360?: boolean;
}

// Multi-keyframe camera trajectory definition
interface CameraKeyframe {
  progress: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
}

export interface WorkstationLightMood {
  id: number;
  name: string;
  shortName: string;
  icon: string;
  ambientCol: number;
  ambientInt: number;
  keyCol: number;
  keyInt: number;
  hemiSky: number;
  hemiGround: number;
  hemiInt: number;
}

export const WORKSTATION_LIGHT_MOODS: WorkstationLightMood[] = [
  {
    id: 0,
    name: 'Daylight Studio',
    shortName: 'Daylight',
    icon: '☀️',
    ambientCol: 0xfff8f0,
    ambientInt: 1.55,
    keyCol: 0xffffff,
    keyInt: 4.8,
    hemiSky: 0xf0f9ff,
    hemiGround: 0x475569,
    hemiInt: 1.10,
  },
  {
    id: 1,
    name: 'Cyber Midnight Focus',
    shortName: 'Midnight',
    icon: '🌙',
    ambientCol: 0x0c1a30,
    ambientInt: 0.95,
    keyCol: 0x00f0ff,
    keyInt: 4.2,
    hemiSky: 0x071120,
    hemiGround: 0x0284c7,
    hemiInt: 0.90,
  },
  {
    id: 2,
    name: 'Golden Hour Sunset',
    shortName: 'Sunset',
    icon: '🌅',
    ambientCol: 0xffedd5,
    ambientInt: 1.65,
    keyCol: 0xf59e0b,
    keyInt: 5.6,
    hemiSky: 0xfef3c7,
    hemiGround: 0x9a3412,
    hemiInt: 1.20,
  },
  {
    id: 3,
    name: 'Neon Cyberpunk Matrix',
    shortName: 'Neon Matrix',
    icon: '🟣',
    ambientCol: 0x2e0854,
    ambientInt: 1.25,
    keyCol: 0x00f5d4,
    keyInt: 4.6,
    hemiSky: 0xc084fc,
    hemiGround: 0xf43f5e,
    hemiInt: 1.35,
  },
];

const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  {
    progress: 0.0,
    position: new THREE.Vector3(2.5, 1.82, 4.8),
    lookAt: new THREE.Vector3(0.0, 1.16, 0.0),
    fov: 45,
  },
  {
    progress: 0.25,
    position: new THREE.Vector3(1.6, 1.62, 3.5),
    lookAt: new THREE.Vector3(0.0, 1.18, -0.2),
    fov: 48,
  },
  {
    progress: 0.5,
    position: new THREE.Vector3(0.75, 1.45, 2.0),
    lookAt: new THREE.Vector3(0.0, 1.22, -0.4),
    fov: 52,
  },
  {
    progress: 0.75,
    position: new THREE.Vector3(0.18, 1.32, 0.8),
    lookAt: new THREE.Vector3(0.0, 1.26, -0.6),
    fov: 58,
  },
  {
    progress: 1.0,
    position: new THREE.Vector3(0.0, 1.28, -0.42),
    lookAt: new THREE.Vector3(0.0, 1.28, -4.0),
    fov: 65,
  },
];

// Helper to interpolate between camera keyframes
function interpolateCamera(progress: number): { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number } {
  const clamped = Math.max(0, Math.min(1, progress));

  let idx = 0;
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    if (clamped >= CAMERA_KEYFRAMES[i].progress && clamped <= CAMERA_KEYFRAMES[i + 1].progress) {
      idx = i;
      break;
    }
  }

  const k1 = CAMERA_KEYFRAMES[idx];
  const k2 = CAMERA_KEYFRAMES[idx + 1];
  const span = k2.progress - k1.progress;
  const localT = span > 0 ? (clamped - k1.progress) / span : 0;
  
  // Smoothstep easing
  const easeT = localT * localT * (3 - 2 * localT);

  const position = new THREE.Vector3().lerpVectors(k1.position, k2.position, easeT);
  const lookAt = new THREE.Vector3().lerpVectors(k1.lookAt, k2.lookAt, easeT);
  const fov = THREE.MathUtils.lerp(k1.fov, k2.fov, easeT);

  return { position, lookAt, fov };
}

export const Workstation3DScene: React.FC<Workstation3DSceneProps> = ({
  scrollProgress,
  mousePos,
  isEntered = false,
  activePreset = 'overview',
  zoomLevel = 1.0,
  lightingMoodIndex,
  onLightingMoodChange,
  isAutoRotate360 = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  // Live prop refs to avoid re-running effect or relying on stale closures
  const scrollProgressRef = useRef(scrollProgress);
  const mousePosRef = useRef<{ x: number; y: number }>(mousePos || { x: 0, y: 0 });
  const isEnteredRef = useRef(isEntered);
  const activePresetRef = useRef(activePreset);
  const prevPresetRef = useRef<CameraPreset | null>(null);
  const zoomLevelRef = useRef(zoomLevel);
  const isAutoRotate360Ref = useRef(isAutoRotate360);
  const onLightingMoodChangeRef = useRef(onLightingMoodChange);
  onLightingMoodChangeRef.current = onLightingMoodChange;

  const [hoveredHud, setHoveredHud] = useState<{ label: string; x: number; y: number } | null>(null);
  const [actionToast, setActionToast] = useState<{ message: string; id: number } | null>(null);
  const [webglError, setWebglError] = useState(false);

  const lightingMoodRef = useRef(0);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const keySpotRef = useRef<THREE.SpotLight | null>(null);

  const applyLightingMood = (mood: number, notifyToast: boolean = true) => {
    const safeMood = ((mood % WORKSTATION_LIGHT_MOODS.length) + WORKSTATION_LIGHT_MOODS.length) % WORKSTATION_LIGHT_MOODS.length;
    lightingMoodRef.current = safeMood;
    const config = WORKSTATION_LIGHT_MOODS[safeMood];
    if (config) {
      if (ambientLightRef.current) {
        ambientLightRef.current.color.setHex(config.ambientCol);
        ambientLightRef.current.intensity = config.ambientInt;
      }
      if (hemiLightRef.current) {
        hemiLightRef.current.color.setHex(config.hemiSky);
        hemiLightRef.current.groundColor.setHex(config.hemiGround);
        hemiLightRef.current.intensity = config.hemiInt;
      }
      if (keySpotRef.current) {
        keySpotRef.current.color.setHex(config.keyCol);
        keySpotRef.current.intensity = config.keyInt;
      }
      if (rendererRef.current) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }
      if (notifyToast) {
        setActionToast({ message: `💡 LIGHTING ATMOSPHERE: ${config.name.toUpperCase()}`, id: Date.now() });
      }
    }
  };

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
    if (mousePos) {
      mousePosRef.current = mousePos;
    }
    isEnteredRef.current = isEntered;
    zoomLevelRef.current = zoomLevel;
    isAutoRotate360Ref.current = isAutoRotate360;

    // Wake up animation loop if returning to chamber
    if (scrollProgress < 0.88 && !isEntered && !isRunningRef.current && animateRef.current) {
      animateRef.current();
    }

    const isPresetChange = prevPresetRef.current !== activePreset;
    prevPresetRef.current = activePreset;
    activePresetRef.current = activePreset;

    if (lightingMoodIndex !== undefined && lightingMoodIndex !== lightingMoodRef.current) {
      applyLightingMood(lightingMoodIndex, true);
    }

    // Only apply preset transitions to orbitState if preset actually changed
    // This allows free 360° mouse drag orbit without being reset on every re-render!
    if (isPresetChange) {
      const os = orbitState.current;
      if (activePreset === 'overview') {
        os.targetYaw = 0;
        os.targetPitch = 0;
        os.targetDistance = 5.451 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      } else if (activePreset === 'workstation') {
        // Perfectly centered on the triple monitor command center (Left 27" + Center 34" + Right 27")
        os.targetYaw = 0.0;
        os.targetPitch = 0.08;
        os.targetDistance = 3.35 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      } else if (activePreset === 'developer') {
        // Direct focus on the live developer typing at the command desk, framed by screens & headphones
        os.targetYaw = 0.28;
        os.targetPitch = 0.16;
        os.targetDistance = 2.45 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      } else if (activePreset === 'cat') {
        // Cinematic close-up on the realistic 3D feline, perch tower, bed, and play area
        os.targetYaw = 0.38;
        os.targetPitch = 0.22;
        os.targetDistance = 2.0 / zoomLevel;
        os.targetFocalX = -1.15;
        os.targetFocalY = 0.28;
        os.targetFocalZ = 0.95;
      } else if (activePreset === 'drone') {
        // Direct focus on the cute Welcome Drone flying in the top right of the room
        os.targetYaw = -0.32;
        os.targetPitch = -0.12;
        os.targetDistance = 1.7 / zoomLevel;
        os.targetFocalX = 1.95;
        os.targetFocalY = 2.45;
        os.targetFocalZ = 0.75;
      } else if (activePreset === 'underdesk') {
        // Centered on the illuminated micro helicopter helipad and sharpened NVIDIA box
        os.targetYaw = 0.0;
        os.targetPitch = -0.32;
        os.targetDistance = 3.4 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      } else if (activePreset === 'cpurig') {
        // Direct focus on the safely adjusted liquid-cooled CPU Rig and anti-vibration riser
        os.targetYaw = -0.38;
        os.targetPitch = 0.12;
        os.targetDistance = 2.35 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      } else if (activePreset === 'macbook') {
        os.targetYaw = 0.38;
        os.targetPitch = 0.22;
        os.targetDistance = 2.2 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      } else if (activePreset === 'skyline') {
        os.targetYaw = Math.PI;
        os.targetPitch = 0.06;
        os.targetDistance = 5.8 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      } else {
        os.targetDistance = 5.451 / zoomLevel;
        os.targetFocalX = 0.0;
        os.targetFocalY = 1.16;
        os.targetFocalZ = 0.0;
      }
    }
  }, [scrollProgress, mousePos, isEntered, activePreset, zoomLevel]);

  // References for live texture animation
  const texturesRef = useRef<{
    centerTex: THREE.CanvasTexture;
    leftTex: THREE.CanvasTexture;
    rightMonTex: THREE.CanvasTexture;
    rightTex: THREE.CanvasTexture;
    laptopTex: THREE.CanvasTexture;
    centerCtx: CanvasRenderingContext2D;
    leftCtx: CanvasRenderingContext2D;
    rightMonCtx: CanvasRenderingContext2D;
    rightCtx: CanvasRenderingContext2D;
    laptopCtx: CanvasRenderingContext2D;
  } | null>(null);

  const screenLightsRef = useRef<{
    centerLight: THREE.PointLight;
    leftLight: THREE.PointLight;
    rightMonLight: THREE.PointLight;
    rightLight: THREE.PointLight;
    laptopLight: THREE.PointLight;
  } | null>(null);

  const holoObjectsRef = useRef<THREE.Group[]>([]);
  const hangingStarsRef = useRef<{
    group: THREE.Group;
    star: THREE.Group;
  }[]>([]);
  const fansRef = useRef<THREE.Mesh[]>([]);
  const steamParticlesRef = useRef<THREE.Points | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const ramLedsRef = useRef<THREE.Mesh[]>([]);
  const beaconLightsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  const trafficMeshRef = useRef<THREE.Mesh[]>([]);
  const helicopterRotorRef = useRef<THREE.Group | null>(null);
  const catRigRef = useRef<CatRig | null>(null);
  const droneRigRef = useRef<WelcomeDroneRig | null>(null);
  const developerRigRef = useRef<DeveloperRig | null>(null);
  const devRigRef = useRef<{
    leftHand: THREE.Group;
    rightHand: THREE.Group;
    leftFingers: THREE.Mesh[];
    rightFingers: THREE.Mesh[];
    leftThumb: THREE.Mesh;
    rightThumb: THREE.Mesh;
    head: THREE.Group;
    torso: THREE.Group;
  } | null>(null);

  // Interactive Room State & Working Features
  const interactiveMeshesRef = useRef<THREE.Object3D[]>([]);
  const activeCodeFileIndexRef = useRef(0);
  const benchmarkTimerRef = useRef(0);
  const telemetryModeRef = useRef(0);
  const laptopTestTimerRef = useRef(0);
  const keyboardRippleTimerRef = useRef(0);
  const steamBurstTimerRef = useRef(0);
  const fanBoostTimerRef = useRef(0);
  const isLofiPlayingRef = useRef(false);

  const woofersRef = useRef<THREE.Mesh[]>([]);
  const keyGlowRef = useRef<THREE.Mesh | null>(null);

  // Dedicated refs for side walls to dynamically manage transparent red materiality in tilt mode
  const leftWallMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const rightWallMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const sideTrimMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Dedicated refs for new objects on workstation & landing page
  const snorlaxMascotRef = useRef<THREE.Group | null>(null);
  const snorlaxHopTimerRef = useRef<number>(0);
  const quantumCoreRef = useRef<THREE.Group | null>(null);
  const clockCanvasRef = useRef<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } | null>(null);
  const clockUpdateTimerRef = useRef<number>(0);

  // Smooth camera state for mouse parallax damping
  const currentCamPos = useRef(new THREE.Vector3(2.5, 1.82, 4.8));
  const currentCamLook = useRef(new THREE.Vector3(0.0, 1.16, 0.0));
  const smoothedScrollRef = useRef(scrollProgress);
  const animateRef = useRef<(() => void) | null>(null);

  const LIGHT_MOODS = WORKSTATION_LIGHT_MOODS;

  // Dynamic code repositories cyclable by clicking left monitor or keyboard
  const CODE_FILES = [
    {
      filename: 'AutonomousAI.ts',
      lang: 'TypeScript',
      lines: [
        '// PIYUSH KUMAR — PRODUCTION AUTONOMOUS ENGINE',
        'import { AutonomousAI, NeuralMesh } from "@core/systems";',
        'import { DistributedCluster, EdgeStream } from "@engine/network";',
        'import { WebGLRenderer, ShaderPipeline } from "@graphics/3d";',
        '',
        'export class IntelligentWorkstation extends AutonomousAI {',
        '  private readonly stack = ["TypeScript", "React", "Three.js", "AI", "Cloud"];',
        '  private clusterHealth: HealthCheck = "OPTIMAL_100%";',
        '',
        '  async deployExperience(): Promise<ClusterStatus> {',
        '    const cluster = await DistributedCluster.synchronize({ region: "global" });',
        '    console.log("[SYS]: Edge latency verified at 1.8ms");',
        '    return cluster.synthesize(this.stack);',
        '  }',
        '  >> [STREAM]: Neural network weights verified (99.99%)',
        '  >> [BUILD]: Fast HMR reload pipeline initialized in 14ms',
      ],
    },
    {
      filename: 'NeuralMeshPipeline.py',
      lang: 'Python / PyTorch',
      lines: [
        '# PIYUSH KUMAR — DISTRIBUTED TENSOR COMPUTE ENGINE',
        'import torch',
        'import torch.nn as nn',
        'from triton import cdiv, autotune, heuristics',
        '',
        'class NeuralLatentTransformer(nn.Module):',
        '    def __init__(self, d_model=4096, n_heads=32, device="cuda"):',
        '        super().__init__()',
        '        self.attention = nn.MultiheadAttention(d_model, n_heads)',
        '        self.norm = nn.RMSNorm(d_model, eps=1e-6)',
        '',
        '    def forward(self, tokens: torch.Tensor) -> torch.Tensor:',
        '        x = self.norm(tokens)',
        '        attn_out, _ = self.attention(x, x, x)',
        '        return tokens + attn_out',
        '# >> [BENCHMARK]: 1,540 TFLOPS FP16 throughput achieved',
      ],
    },
    {
      filename: 'VulkanComputeKernel.cpp',
      lang: 'C++20 / Vulkan',
      lines: [
        '// PIYUSH KUMAR — HIGH-PERFORMANCE LOW-LATENCY GRAPHICS',
        '#include <vulkan/vulkan.hpp>',
        '#include <glm/glm.hpp>',
        '',
        'namespace Engine::Graphics {',
        '  class RayTracingPipeline {',
        '  public:',
        '    void dispatchComputeKernel(VkCommandBuffer cmdBuffer) {',
        '      vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, m_pipeline);',
        '      vkCmdDispatch(cmdBuffer, 1920 / 16, 1080 / 16, 1);',
        '    }',
        '  private:',
        '    VkPipeline m_pipeline{VK_NULL_HANDLE};',
        '  };',
        '  // >> [GPU]: Ray dispatch completed in 0.42ms',
        '}',
      ],
    },
    {
      filename: 'DistributedConsensus.go',
      lang: 'Go / Raft',
      lines: [
        '// PIYUSH KUMAR — HIGH-AVAILABILITY CLUSTER CONSENSUS',
        'package cluster',
        '',
        'import (',
        '    "context"',
        '    "sync/atomic"',
        '    "time"',
        ')',
        '',
        'type ConsensusEngine struct {',
        '    clusterPeers []string',
        '    term         atomic.Uint64',
        '    commitIndex  atomic.Uint64',
        '}',
        '',
        'func (c *ConsensusEngine) BroadcastHeartbeat(ctx context.Context) error {',
        '    // >> [RAFT]: Zero packet drop across 12 distributed nodes',
        '    return nil',
        '}',
      ],
    },
  ];

  // 360-Degree Interactive Camera Orbit Controller State
  const orbitState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    yaw: 0,         // offset in radians from base azimuth
    pitch: 0,       // offset in radians from base elevation
    targetYaw: 0,
    targetPitch: 0,
    yawVel: 0,
    pitchVel: 0,
    distance: 5.451,
    targetDistance: 5.451,
    focalX: 0.0,
    focalY: 1.16,
    focalZ: 0.0,
    targetFocalX: 0.0,
    targetFocalY: 1.16,
    targetFocalZ: 0.0,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Reset interactive meshes registry
    interactiveMeshesRef.current = [];

    // Helper to register interactive objects for raycasting
    const registerInteractive = (obj: THREE.Object3D, type: string, label: string) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = { interactiveType: type, label };
          interactiveMeshesRef.current.push(child);
        }
      });
    };

    // 1. Scene & Atmospheric Fog (Ultra-clear, crisp studio depth with high-rise city vistas)
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x081326, 40, 95);
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 90);
    camera.position.set(2.5, 1.82, 4.8);
    cameraRef.current = camera;

    // 3. High-Performance WebGL Renderer (Direct Hardware Rasterization with Native Antialiasing & True Retina Clarity)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        precision: 'highp',
        stencil: false,
        depth: true,
      });
    } catch (err) {
      console.warn('Workstation3DScene: WebGL context creation failed or context blocked', err);
      setWebglError(true);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('Workstation3DScene: WebGL context lost');
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    renderer.setSize(width, height);
    // Crisp high-definition DPR for maximum sharpness, razor-clean edges, and visual fidelity
    const isMobileDevice = typeof window !== 'undefined' && (window.innerWidth < 768 || ('ontouchstart' in window));
    const pixelRatio = isMobileDevice ? Math.min(window.devicePixelRatio || 1, 2.0) : Math.min(window.devicePixelRatio || 1, 2.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14; // High-contrast, sharp clarity and rich specular highlights without blown out whites
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Photorealistic soft penumbra contact shadows
    renderer.shadowMap.autoUpdate = false; // Throttled updates for silky smooth 60/120 FPS camera orbit
    renderer.shadowMap.needsUpdate = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Highest available hardware texture filtering for razor-sharp textures at all angles
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 16);

    // =========================================================================
    // LIGHTING SYSTEM (Balanced Studio & Architectural Illumination for HD Clarity)
    // =========================================================================
    // Balanced architectural ambient light ensuring rich contrast and crisp depth
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.88);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Architectural Hemisphere Light (Warm ambient daylight from above, soft slate floor bounce from below)
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x334155, 0.68);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // Warm Crisp Key Spotlight focused onto workstation with sharp contact shadow
    const keySpot = new THREE.SpotLight(0xffffff, 4.2, 22, Math.PI / 2.8, 0.30, 1.0);
    keySpot.position.set(0.8, 3.6, 2.6);
    keySpot.target.position.set(0.0, 0.85, 0.2);
    keySpot.castShadow = true;
    keySpot.shadow.camera.near = 0.5;
    keySpot.shadow.camera.far = 10.0;
    keySpot.shadow.mapSize.width = 2048; // High-definition 2048x2048 shadow map for sharp contact shadows
    keySpot.shadow.mapSize.height = 2048;
    keySpot.shadow.bias = -0.00004;
    keySpot.shadow.normalBias = 0.02;
    keySpot.shadow.radius = 1.6;
    scene.add(keySpot);
    scene.add(keySpot.target);
    keySpotRef.current = keySpot;

    // Multi-Directional Balanced Studio Fill Lights (Keeps room bright, airy and clearly visible)
    const fillSpotL = new THREE.DirectionalLight(0xe0f2fe, 0.65);
    fillSpotL.position.set(-3.8, 3.2, 2.5);
    scene.add(fillSpotL);

    const fillSpotR = new THREE.DirectionalLight(0xfef9c3, 0.65);
    fillSpotR.position.set(3.8, 3.2, 2.5);
    scene.add(fillSpotR);

    const fillFront = new THREE.DirectionalLight(0xffffff, 0.60);
    fillFront.position.set(0.0, 2.6, 4.2);
    scene.add(fillFront);

    const fillRear = new THREE.DirectionalLight(0xcfdcf5, 0.55);
    fillRear.position.set(0.0, 3.2, -3.5);
    scene.add(fillRear);

    // Warm Desk Task Lamp Light
    const deskLampLight = new THREE.PointLight(0xfef3c7, 1.8, 3.5, 1.8);
    deskLampLight.position.set(-1.2, 1.35, 0.1);
    scene.add(deskLampLight);

    // Screen Point Lights casting vivid, authentic glow onto desk & workspace
    const centerLight = new THREE.PointLight(0x38bdf8, 1.8, 3.2, 1.8);
    centerLight.position.set(0.0, 1.28, 0.08);
    scene.add(centerLight);

    const leftLight = new THREE.PointLight(0x10b981, 1.2, 2.5, 1.8);
    leftLight.position.set(-1.15, 1.25, 0.15);
    scene.add(leftLight);

    // Right Vertical Extra Monitor Ambient Glow Light
    const rightMonLight = new THREE.PointLight(0x38bdf8, 1.2, 2.5, 1.8);
    rightMonLight.position.set(1.15, 1.25, 0.15);
    scene.add(rightMonLight);

    // Dedicated Internal PC Case Illumination Point Light (Adjusted safely with PC position)
    const rightLight = new THREE.PointLight(0x38bdf8, 1.1, 2.0, 1.8);
    rightLight.position.set(1.58, 1.05, 0.10);
    scene.add(rightLight);

    const laptopLight = new THREE.PointLight(0x38bdf8, 1.2, 2.2, 1.8);
    laptopLight.position.set(-0.82, 0.96, 0.22);
    scene.add(laptopLight);

    screenLightsRef.current = { centerLight, leftLight, rightMonLight, rightLight, laptopLight };

    // =========================================================================
    // PROCEDURAL CANVAS TEXTURE GENERATORS (FOR REAL TOUCH, WEAVE, PORES & GRAIN)
    // =========================================================================
    // 1. Fabric Texture with fine twill micro-weave, subtle horizontal compression ripples & noise
    const createFabricCanvasTex = (baseColor: string, weaveColor: string, isPants = false) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 512, 512);

      // Micro-woven twill threads
      ctx.strokeStyle = weaveColor;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.26;
      for (let i = 0; i < 512; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 512, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i + 512);
        ctx.stroke();
      }

      // Horizontal fabric folds and soft shading ripples
      ctx.globalAlpha = 0.16;
      const foldCount = isPants ? 10 : 8;
      for (let f = 0; f < foldCount; f++) {
        const y = (f / foldCount) * 512 + 24;
        const grad = ctx.createLinearGradient(0, y - 18, 0, y + 18);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.42)');
        grad.addColorStop(1, 'rgba(255,255,255,0.18)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y - 18, 512, 36);
      }

      ctx.globalAlpha = 1.0;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(isPants ? 4 : 5, isPants ? 5 : 4);
      return tex;
    };

    // 2. Perforated Luxury Leather Texture with micro-pores and diamond cross-stitch seams
    const createLeatherCanvasTex = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = '#101623';
      ctx.fillRect(0, 0, 512, 512);

      // Micro leather grain noise
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 4500; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        const rrad = 0.5 + Math.random() * 1.3;
        ctx.fillRect(rx, ry, rrad, rrad);
      }

      // Diamond quilting & subtle perforation dots
      ctx.strokeStyle = '#0284c7';
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1.4;
      for (let d = -512; d < 1024; d += 64) {
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(d + 512, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(d, 512);
        ctx.lineTo(d + 512, 0);
        ctx.stroke();
      }

      // Micro perforation dots at grid intersections
      ctx.fillStyle = '#38bdf8';
      ctx.globalAlpha = 0.60;
      for (let x = 32; x < 512; x += 64) {
        for (let y = 32; y < 512; y += 64) {
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    };

    // 3. Solid American Walnut Wood Grain Texture with Growth Rings & Satin Luster
    const createWoodGrainCanvasTex = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Warm rich walnut base with deep organic tones
      ctx.fillStyle = '#261a11';
      ctx.fillRect(0, 0, 1024, 512);

      // Wood grain growth layers with organic variation
      for (let w = 0; w < 96; w++) {
        const y = (w / 96) * 512;
        const alpha = 0.12 + Math.sin(w * 0.35) * 0.07;
        ctx.strokeStyle = w % 2 === 0 ? '#442e1d' : '#342214';
        ctx.lineWidth = 2.6 + Math.sin(w * 0.65) * 1.5;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(256, y + Math.sin(w * 0.28) * 22, 768, y - Math.cos(w * 0.28) * 22, 1024, y);
        ctx.stroke();
      }

      // Warm honey pore striations
      ctx.strokeStyle = '#b45309';
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      for (let p = 0; p < 480; p++) {
        const px = Math.random() * 1024;
        const py = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 18 + Math.random() * 32, py + (Math.random() - 0.5) * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    };

    // 4. Textured Woven Cordura Deskpad Texture (Light Charcoal Slate, no deep black)
    const createDeskpadCanvasTex = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = '#222c3d';
      ctx.fillRect(0, 0, 512, 512);

      // Micro cross-weave grid
      ctx.strokeStyle = '#38465b';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 512; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
      }
      for (let j = 0; j < 512; j += 2) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(512, j);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 4);
      return tex;
    };

    const woodGrainTex = createWoodGrainCanvasTex();
    const deskpadTex = createDeskpadCanvasTex();
    const fabricHoodieTex = createFabricCanvasTex('#334155', '#475569', false);
    const fabricPantsTex = createFabricCanvasTex('#273244', '#38465a', true);
    const leatherTex = createLeatherCanvasTex();

    // =========================================================================
    // LAYER 1: ARCHITECTURAL ROOM & HIGH-RESOLUTION STUDIO FLOOR
    // =========================================================================
    const roomGroup = new THREE.Group();

    // Ultra-Clear Architectural Structural Glass Material (Ultra-HD Clarity)
    const panoramicGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xcde9f6,
      transparent: true,
      opacity: 0.10,
      roughness: 0.015,
      metalness: 0.05,
      transmission: 0.96,
      ior: 1.52,
      reflectivity: 0.94,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Sleek Titanium-Graphite Architectural Mullions (Light graphite charcoal, no deep black)
    const mullionMat = new THREE.MeshStandardMaterial({
      color: 0x3d495b,
      metalness: 0.88,
      roughness: 0.25,
    });

    // Polished Stainless Steel Spider Brackets & Clamping Hardware
    const spiderFittingMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.96,
      roughness: 0.10,
    });

    // Structural Cantilever Steel I-Beams (Light charcoal steel, no deep black)
    const steelBeamMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.30,
    });

    // Architectural Color Materials (Requested Light Red Walls, Yellow Ceiling, White Front & Multi-color Corners)
    const wallLightRedMat = new THREE.MeshStandardMaterial({
      color: 0xeb6b6b, // Contemporary vibrant light red / warm coral rose
      roughness: 0.68,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });

    const wallTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf28b8b, // Lighter coral accent trim
      roughness: 0.45,
      metalness: 0.12,
    });

    // Dedicated Transparent Red Side Walls Materials (Refined luxury smoked ruby architectural glass)
    const sideWallRedMatLeft = new THREE.MeshStandardMaterial({
      color: 0xd9263e, // Deep, refined crimson ruby glass
      emissive: 0x5b0b14, // Subtle warm wine underglow
      emissiveIntensity: 0.10,
      roughness: 0.22,
      metalness: 0.16,
      transparent: true,
      opacity: 0.30, // Refined smoked ruby transparency
      side: THREE.DoubleSide,
      depthWrite: false, // Ensures interior scene objects render cleanly without z-fighting
    });
    leftWallMatRef.current = sideWallRedMatLeft;

    const sideWallRedMatRight = new THREE.MeshStandardMaterial({
      color: 0xd9263e, // Deep, refined crimson ruby glass
      emissive: 0x5b0b14,
      emissiveIntensity: 0.10,
      roughness: 0.22,
      metalness: 0.16,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    rightWallMatRef.current = sideWallRedMatRight;

    const sideWallTrimRedMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Refined rose-coral trim
      emissive: 0x4c0519,
      emissiveIntensity: 0.08,
      roughness: 0.28,
      metalness: 0.22,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    sideTrimMatRef.current = sideWallTrimRedMat;

    const ceilingYellowMat = new THREE.MeshStandardMaterial({
      color: 0xc8963e, // Warm architectural honey amber / Scandinavian golden oak finish
      roughness: 0.65,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    const ceilingRafterMat = new THREE.MeshStandardMaterial({
      color: 0xdfab54, // Soft warm champagne-cedar rafters
      roughness: 0.50,
      metalness: 0.10,
    });

    const frontWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp pure studio white
      roughness: 0.22,
      metalness: 0.15,
    });

    const frontWhiteAccent = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Architectural off-white satin
      roughness: 0.32,
      metalness: 0.10,
    });

    // Four Distinct Vibrant Floor Corner Edge Materials
    const cornerCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x0284c7,
      emissiveIntensity: 1.1,
      roughness: 0.25,
      metalness: 0.3,
    });

    const cornerEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.1,
      roughness: 0.25,
      metalness: 0.3,
    });

    const cornerVioletMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 1.1,
      roughness: 0.25,
      metalness: 0.3,
    });

    const cornerAmberMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.1,
      roughness: 0.25,
      metalness: 0.3,
    });

    // -------------------------------------------------------------------------
    // SIDE 1/6 (BOTTOM): CANTILEVERED OBSERVATION FLOOR & MULTI-COLORED CORNER EDGES
    // -------------------------------------------------------------------------
    const glassFloorGeo = new THREE.PlaneGeometry(8.4, 10.0);
    const glassFloor = new THREE.Mesh(glassFloorGeo, panoramicGlassMat);
    glassFloor.rotation.x = -Math.PI / 2;
    glassFloor.position.set(0, 0.001, 1.7);
    glassFloor.receiveShadow = true;
    roomGroup.add(glassFloor);

    // Deep structural steel cantilever beams visible beneath the glass floor (light charcoal)
    [-3.8, -1.9, 0.0, 1.9, 3.8].forEach((bx) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 10.0), steelBeamMat);
      beam.position.set(bx, -0.12, 1.7);
      roomGroup.add(beam);
    });
    // Cross-trusses
    [-2.8, -0.5, 1.8, 4.1, 6.4].forEach((bz) => {
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.16, 0.10), steelBeamMat);
      crossBeam.position.set(0, -0.09, bz);
      roomGroup.add(crossBeam);
    });

    // Glass panel modular seam grid lines (Architectural joint seals in light slate)
    const glassSeamMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    [-1.9, 1.9].forEach((sx) => {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.004, 9.8), glassSeamMat);
      seam.position.set(sx, 0.003, 1.7);
      roomGroup.add(seam);
    });
    [-0.5, 1.8, 4.1].forEach((sz) => {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.004, 0.015), glassSeamMat);
      seam.position.set(0, 0.003, sz);
      roomGroup.add(seam);
    });

    // Minimal perimeter floor frame border (Light graphite)
    const floorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 10.0), mullionMat);
    floorFrameL.position.set(-4.12, 0.02, 1.7);
    roomGroup.add(floorFrameL);

    const floorFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 10.0), mullionMat);
    floorFrameR.position.set(4.12, 0.02, 1.7);
    roomGroup.add(floorFrameR);

    // Studio Floor Inset Rug (Grounded woven designer slate rug, no deep black)
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Rich architectural slate
      roughness: 0.88,
      metalness: 0.05,
    });
    const rug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.01, 3.6), rugMat);
    rug.position.set(0, 0.006, 0.4);
    rug.receiveShadow = true;
    roomGroup.add(rug);

    // Designer Geometric Inlay Stripes across rug
    [-1.2, 0.0, 1.2].forEach((ix) => {
      const inlay = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.003, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 })
      );
      inlay.position.set(ix, 0.012, 0.4);
      roomGroup.add(inlay);
    });

    const rugBorder = new THREE.Mesh(
      new THREE.BoxGeometry(4.24, 0.006, 3.64),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4, metalness: 0.4 })
    );
    rugBorder.position.set(0, 0.005, 0.4);
    roomGroup.add(rugBorder);

    // Linear LED guidance strip along rug edge
    const ledMatCyan = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    const floorStripL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 3.6), ledMatCyan);
    floorStripL.position.set(-2.15, 0.007, 0.4);
    roomGroup.add(floorStripL);

    const floorStripR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 3.6), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    floorStripR.position.set(2.15, 0.007, 0.4);
    roomGroup.add(floorStripR);

    // =========================================================================
    // MULTI-COLORED FLOOR CORNER EDGES & ARCHITECTURAL BASEBOARD RUNNERS
    // (Requested: "make the floor corner edges too differnt coours so tehy look good")
    // =========================================================================
    // 1. Front-Left Corner Edge (Electric Cyan / Aqua)
    const flCornerEdgeX = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.08), cornerCyanMat);
    flCornerEdgeX.position.set(-3.3, 0.02, -3.16);
    roomGroup.add(flCornerEdgeX);

    const flCornerEdgeZ = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 1.6), cornerCyanMat);
    flCornerEdgeZ.position.set(-4.06, 0.02, -2.4);
    roomGroup.add(flCornerEdgeZ);

    const flCornerPilaster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), cornerCyanMat);
    flCornerPilaster.position.set(-4.05, 0.375, -3.15);
    roomGroup.add(flCornerPilaster);

    // 2. Front-Right Corner Edge (Radiant Emerald / Neon Mint)
    const frCornerEdgeX = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.08), cornerEmeraldMat);
    frCornerEdgeX.position.set(3.3, 0.02, -3.16);
    roomGroup.add(frCornerEdgeX);

    const frCornerEdgeZ = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 1.6), cornerEmeraldMat);
    frCornerEdgeZ.position.set(4.06, 0.02, -2.4);
    roomGroup.add(frCornerEdgeZ);

    const frCornerPilaster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), cornerEmeraldMat);
    frCornerPilaster.position.set(4.05, 0.375, -3.15);
    roomGroup.add(frCornerPilaster);

    // 3. Rear-Left Corner Edge (Neon Violet / Purple)
    const rlCornerEdgeX = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.08), cornerVioletMat);
    rlCornerEdgeX.position.set(-3.3, 0.02, 6.54);
    roomGroup.add(rlCornerEdgeX);

    const rlCornerEdgeZ = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 1.6), cornerVioletMat);
    rlCornerEdgeZ.position.set(-4.06, 0.02, 5.78);
    roomGroup.add(rlCornerEdgeZ);

    const rlCornerPilaster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), cornerVioletMat);
    rlCornerPilaster.position.set(-4.05, 0.375, 6.53);
    roomGroup.add(rlCornerPilaster);

    // 4. Rear-Right Corner Edge (Warm Sunset Amber / Gold)
    const rrCornerEdgeX = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.08), cornerAmberMat);
    rrCornerEdgeX.position.set(3.3, 0.02, 6.54);
    roomGroup.add(rrCornerEdgeX);

    const rrCornerEdgeZ = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 1.6), cornerAmberMat);
    rrCornerEdgeZ.position.set(4.06, 0.02, 5.78);
    roomGroup.add(rrCornerEdgeZ);

    const rrCornerPilaster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), cornerAmberMat);
    rrCornerPilaster.position.set(4.05, 0.375, 6.53);
    roomGroup.add(rrCornerPilaster);

    // Perimeter edge connecting runners (Left wall baseboard linking Cyan to Violet)
    const leftEdgeBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 5.0), cornerCyanMat);
    leftEdgeBaseboard.position.set(-4.08, 0.015, 1.7);
    roomGroup.add(leftEdgeBaseboard);

    // Right wall baseboard linking Emerald to Amber
    const rightEdgeBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 5.0), cornerEmeraldMat);
    rightEdgeBaseboard.position.set(4.08, 0.015, 1.7);
    roomGroup.add(rightEdgeBaseboard);

    // -------------------------------------------------------------------------
    // SIDE 2/6 (TOP): RADIANT ARCHITECTURAL YELLOW CEILING & DOWNLIGHT TRACKS
    // (Requested: "and the top one as yelow")
    // -------------------------------------------------------------------------
    const yellowCeilGeo = new THREE.PlaneGeometry(8.4, 10.0);
    const yellowCeiling = new THREE.Mesh(yellowCeilGeo, ceilingYellowMat);
    yellowCeiling.rotation.x = Math.PI / 2;
    yellowCeiling.position.set(0, 3.35, 1.7);
    yellowCeiling.receiveShadow = true;
    roomGroup.add(yellowCeiling);

    // Architectural Yellow Rafter Beams across the yellow ceiling
    [-3.8, -1.9, 0.0, 1.9, 3.8].forEach((rx) => {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 10.0), ceilingRafterMat);
      rafter.position.set(rx, 3.30, 1.7);
      roomGroup.add(rafter);
    });
    [-2.8, -0.5, 1.8, 4.1, 6.4].forEach((rz) => {
      const crossRafter = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.08, 0.08), ceilingRafterMat);
      crossRafter.position.set(0, 3.31, rz);
      roomGroup.add(crossRafter);
    });

    // Warm Architectural Recessed Downlight Center Rail
    const trackRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 8.6), ceilingRafterMat);
    trackRail.position.set(0, 3.32, 1.7);
    roomGroup.add(trackRail);

    // Minimalist micro pin-spot downlights (Warm golden accent fixtures)
    [-1.8, 0.2, 2.2, 4.2].forEach((pz) => {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.06, 16), ceilingRafterMat);
      can.position.set(0, 3.29, pz);
      roomGroup.add(can);

      const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.026, 16), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(0, 3.255, pz);
      roomGroup.add(bulb);
    });

    // -------------------------------------------------------------------------
    // SIDE 3/6 (FRONT): CRISP ARCHITECTURAL WHITE PORTAL & BULKHEAD TO TERRACE
    // (Requested: "and the front one as white so they lookgood")
    // -------------------------------------------------------------------------
    // Sleek architectural corner posts in crisp pure white
    const leftCornerPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.35, 0.12), frontWhiteMat);
    leftCornerPost.position.set(-4.1, 1.675, -3.2);
    roomGroup.add(leftCornerPost);

    const rightCornerPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.35, 0.12), frontWhiteMat);
    rightCornerPost.position.set(4.1, 1.675, -3.2);
    roomGroup.add(rightCornerPost);

    // Crisp White Architectural Header Beam bridging the portal
    const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.14, 0.16), frontWhiteMat);
    frontHeader.position.set(0, 3.28, -3.2);
    roomGroup.add(frontHeader);

    // Upper Front Architectural Bulkhead Wall Panel in Crisp White (y: 3.02 to 3.35)
    const frontBulkhead = new THREE.Mesh(new THREE.BoxGeometry(8.38, 0.32, 0.14), frontWhiteAccent);
    frontBulkhead.position.set(0, 3.19, -3.2);
    frontBulkhead.receiveShadow = true;
    roomGroup.add(frontBulkhead);

    // -------------------------------------------------------------------------
    // SIDE 4/6 (LEFT / WEST): CONTEMPORARY TRANSPARENT RED ARCHITECTURAL WALL
    // (Requested: "make the side walls while viewing in tiit mode transaprent but they are red color")
    // -------------------------------------------------------------------------
    const leftWallGeo = new THREE.PlaneGeometry(9.8, 3.35);
    const leftWall = new THREE.Mesh(leftWallGeo, sideWallRedMatLeft);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-4.1, 1.675, 1.7);
    leftWall.receiveShadow = false;
    roomGroup.add(leftWall);

    // Vertical Architectural Trim Ribs on Left Transparent Red Wall
    [-3.2, -1.6, 0.0, 1.6, 3.2, 4.8, 6.6].forEach((mZ) => {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.35, 0.06), sideWallTrimRedMat);
      mullion.position.set(-4.08, 1.675, mZ);
      roomGroup.add(mullion);

      // Stainless steel spider mounting fittings
      [0.8, 1.8, 2.8].forEach((fY) => {
        const fitting = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 12), spiderFittingMat);
        fitting.rotation.z = Math.PI / 2;
        fitting.position.set(-4.05, fY, mZ);
        roomGroup.add(fitting);
      });
    });

    // Horizontal architectural accent chair rails on Left Wall
    [1.1, 2.3].forEach((tY) => {
      const transom = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 9.8), sideWallTrimRedMat);
      transom.position.set(-4.08, tY, 1.7);
      roomGroup.add(transom);
    });

    // -------------------------------------------------------------------------
    // SIDE 5/6 (RIGHT / EAST): CONTEMPORARY TRANSPARENT RED ARCHITECTURAL WALL
    // (Requested: "make the side walls while viewing in tiit mode transaprent but they are red color")
    // -------------------------------------------------------------------------
    const rightWallGeo = new THREE.PlaneGeometry(9.8, 3.35);
    const rightWall = new THREE.Mesh(rightWallGeo, sideWallRedMatRight);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(4.1, 1.675, 1.7);
    rightWall.receiveShadow = false;
    roomGroup.add(rightWall);

    // Vertical Architectural Trim Ribs on Right Transparent Red Wall
    [-3.2, -1.6, 0.0, 1.6, 3.2, 4.8, 6.6].forEach((mZ) => {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.35, 0.06), sideWallTrimRedMat);
      mullion.position.set(4.08, 1.675, mZ);
      roomGroup.add(mullion);

      // Stainless steel spider mounting fittings
      [0.8, 1.8, 2.8].forEach((fY) => {
        const fitting = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 12), spiderFittingMat);
        fitting.rotation.z = Math.PI / 2;
        fitting.position.set(4.05, fY, mZ);
        roomGroup.add(fitting);
      });
    });

    // Horizontal architectural accent chair rails on Right Wall
    [1.1, 2.3].forEach((tY) => {
      const transom = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 9.8), sideWallTrimRedMat);
      transom.position.set(4.08, tY, 1.7);
      roomGroup.add(transom);
    });

    // =========================================================================
    // Framed AI Architectural Blueprint mounted prominently on Left Wall (Ultra-HD Gallery Art)
    // =========================================================================
    const artGroup = new THREE.Group();
    artGroup.position.set(-4.06, 1.85, 0.5);

    // Museum Shadowbox Frame (Brushed Titanium & Slate Graphite Trim, no deep black)
    const artFrameOuterMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.88,
      roughness: 0.22,
    });
    const artFrameBevelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.96,
      roughness: 0.12,
    });
    const artFrameOuter = new THREE.Mesh(new THREE.BoxGeometry(0.048, 1.48, 2.12), artFrameOuterMat);
    artFrameOuter.position.set(-0.02, 0, 0);
    // artFrameOuter.castShadow = true; (optimized out)
    artGroup.add(artFrameOuter);

    // Inner Metallic Bevel Liner
    const artFrameBevel = new THREE.Mesh(new THREE.BoxGeometry(0.052, 1.38, 2.02), artFrameBevelMat);
    artFrameBevel.position.set(-0.015, 0, 0);
    artGroup.add(artFrameBevel);

    // Conservation Off-White Museum Mat Board
    const matBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(1.98, 1.34),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.92 })
    );
    matBoard.position.set(0.005, 0, 0);
    matBoard.rotation.y = Math.PI / 2;
    artGroup.add(matBoard);

    // High-Resolution 2048x1440 Retina Engineering Blueprint Canvas
    const bpCanvas = document.createElement('canvas');
    bpCanvas.width = 2048;
    bpCanvas.height = 1440;
    const bpCtx = bpCanvas.getContext('2d')!;

    // Rich Dark Cyan/Obsidian Blueprint Blueprint Background
    bpCtx.fillStyle = '#060d19';
    bpCtx.fillRect(0, 0, 2048, 1440);

    // Fine Coordinate Grid (Every 32px)
    bpCtx.strokeStyle = 'rgba(14, 165, 233, 0.07)';
    bpCtx.lineWidth = 1;
    for (let gx = 0; gx < 2048; gx += 32) {
      bpCtx.beginPath();
      bpCtx.moveTo(gx, 0);
      bpCtx.lineTo(gx, 1440);
      bpCtx.stroke();
    }
    for (let gy = 0; gy < 1440; gy += 32) {
      bpCtx.beginPath();
      bpCtx.moveTo(0, gy);
      bpCtx.lineTo(2048, gy);
      bpCtx.stroke();
    }

    // Major Architectural Grid Modules (Every 160px)
    bpCtx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    bpCtx.lineWidth = 1.5;
    for (let gx = 0; gx < 2048; gx += 160) {
      bpCtx.beginPath();
      bpCtx.moveTo(gx, 0);
      bpCtx.lineTo(gx, 1440);
      bpCtx.stroke();
    }
    for (let gy = 0; gy < 1440; gy += 160) {
      bpCtx.beginPath();
      bpCtx.moveTo(0, gy);
      bpCtx.lineTo(2048, gy);
      bpCtx.stroke();
    }

    // Outer Technical Border & Calibration Marks
    bpCtx.strokeStyle = '#0284c7';
    bpCtx.lineWidth = 3;
    bpCtx.strokeRect(48, 48, 1952, 1344);
    bpCtx.strokeStyle = '#38bdf8';
    bpCtx.lineWidth = 1.5;
    bpCtx.strokeRect(60, 60, 1928, 1320);

    // Corner Alignment Reticles
    [[72, 72], [1976, 72], [72, 1368], [1976, 1368]].forEach(([cx, cy]) => {
      bpCtx.strokeStyle = '#38bdf8';
      bpCtx.lineWidth = 2;
      bpCtx.beginPath();
      bpCtx.arc(cx, cy, 14, 0, Math.PI * 2);
      bpCtx.moveTo(cx - 20, cy);
      bpCtx.lineTo(cx + 20, cy);
      bpCtx.moveTo(cx, cy - 20);
      bpCtx.lineTo(cx, cy + 20);
      bpCtx.stroke();
    });

    // Top Technical Header
    bpCtx.fillStyle = '#38bdf8';
    bpCtx.font = 'bold 36px "SF Mono", monospace';
    bpCtx.fillText('AI ACCELERATOR ENGINE // MULTI-CHIP TOPOLOGY SPECIFICATION', 90, 120);

    bpCtx.fillStyle = '#94a3b8';
    bpCtx.font = '18px "SF Mono", monospace';
    bpCtx.fillText('TSMC 3nm FinFET CoWoS-S Interposer • 24,576 FP8 Tensor Cores • 192GB HBM3e Memory Matrix (9.6 TB/s)', 90, 160);

    // Central Neural Die Schematic (Silicon Chip Layout)
    const chipCx = 1024;
    const chipCy = 680;

    // Substrate Package Base
    bpCtx.fillStyle = '#0f172a';
    bpCtx.fillRect(chipCx - 420, chipCy - 340, 840, 680);
    bpCtx.strokeStyle = '#38bdf8';
    bpCtx.lineWidth = 2.5;
    bpCtx.strokeRect(chipCx - 420, chipCy - 340, 840, 680);

    // Central Multi-Compute Core Die
    bpCtx.fillStyle = '#0369a1';
    bpCtx.fillRect(chipCx - 180, chipCy - 260, 360, 520);
    bpCtx.strokeStyle = '#00f0ff';
    bpCtx.lineWidth = 2;
    bpCtx.strokeRect(chipCx - 180, chipCy - 260, 360, 520);

    bpCtx.fillStyle = '#f8fafc';
    bpCtx.font = 'bold 24px "SF Mono", monospace';
    bpCtx.textAlign = 'center';
    bpCtx.fillText('TENSOR COMPUTE DIE', chipCx, chipCy - 210);
    bpCtx.fillStyle = '#38bdf8';
    bpCtx.font = '16px "SF Mono", monospace';
    bpCtx.fillText('64 SMs • 512 TENSOR ENGINES', chipCx, chipCy - 180);

    // 8x HBM3e Memory Stacks (Left & Right of Compute Die)
    for (let m = 0; m < 4; m++) {
      const my = chipCy - 240 + m * 135;
      // Left HBM
      bpCtx.fillStyle = '#1e293b';
      bpCtx.fillRect(chipCx - 390, my, 160, 105);
      bpCtx.strokeStyle = '#f59e0b';
      bpCtx.lineWidth = 2;
      bpCtx.strokeRect(chipCx - 390, my, 160, 105);
      bpCtx.fillStyle = '#f59e0b';
      bpCtx.font = 'bold 15px "SF Mono", monospace';
      bpCtx.fillText(`HBM3e #${m + 1}`, chipCx - 310, my + 45);
      bpCtx.fillStyle = '#94a3b8';
      bpCtx.font = '12px "SF Mono", monospace';
      bpCtx.fillText('24GB • 1.2 TB/s', chipCx - 310, my + 72);

      // Right HBM
      bpCtx.fillStyle = '#1e293b';
      bpCtx.fillRect(chipCx + 230, my, 160, 105);
      bpCtx.strokeStyle = '#f59e0b';
      bpCtx.lineWidth = 2;
      bpCtx.strokeRect(chipCx + 230, my, 160, 105);
      bpCtx.fillStyle = '#f59e0b';
      bpCtx.font = 'bold 15px "SF Mono", monospace';
      bpCtx.fillText(`HBM3e #${m + 5}`, chipCx + 310, my + 45);
      bpCtx.fillStyle = '#94a3b8';
      bpCtx.font = '12px "SF Mono", monospace';
      bpCtx.fillText('24GB • 1.2 TB/s', chipCx + 310, my + 72);

      // High-density interposer interconnect bus lines
      bpCtx.strokeStyle = '#0284c7';
      bpCtx.lineWidth = 1.5;
      for (let bl = 0; bl < 4; bl++) {
        bpCtx.beginPath();
        bpCtx.moveTo(chipCx - 230, my + 20 + bl * 20);
        bpCtx.lineTo(chipCx - 180, my + 20 + bl * 20);
        bpCtx.stroke();

        bpCtx.beginPath();
        bpCtx.moveTo(chipCx + 180, my + 20 + bl * 20);
        bpCtx.lineTo(chipCx + 230, my + 20 + bl * 20);
        bpCtx.stroke();
      }
    }

    // Micro-core execution grid inside Compute Die
    bpCtx.textAlign = 'left';
    for (let cx = 0; cx < 4; cx++) {
      for (let cy = 0; cy < 6; cy++) {
        const smX = chipCx - 150 + cx * 78;
        const smY = chipCy - 130 + cy * 58;
        bpCtx.fillStyle = '#0f172a';
        bpCtx.fillRect(smX, smY, 66, 46);
        bpCtx.strokeStyle = '#38bdf8';
        bpCtx.lineWidth = 1;
        bpCtx.strokeRect(smX, smY, 66, 46);
        bpCtx.fillStyle = '#10b981';
        bpCtx.font = '9px "SF Mono", monospace';
        bpCtx.fillText(`SM_${cx * 6 + cy}`, smX + 6, smY + 18);
        bpCtx.fillStyle = '#64748b';
        bpCtx.fillText('V-ACCEL', smX + 6, smY + 34);
      }
    }

    // Official Engineering Title Block (Lower Right Corner)
    bpCtx.fillStyle = '#0f172a';
    bpCtx.fillRect(1380, 1140, 580, 200);
    bpCtx.strokeStyle = '#38bdf8';
    bpCtx.lineWidth = 2;
    bpCtx.strokeRect(1380, 1140, 580, 200);

    bpCtx.fillStyle = '#f8fafc';
    bpCtx.font = 'bold 20px "SF Mono", monospace';
    bpCtx.fillText('PROJECT: PIYUSH KUMAR WORKSTATION ARCHITECTURE', 1404, 1180);
    bpCtx.fillStyle = '#38bdf8';
    bpCtx.font = '14px "SF Mono", monospace';
    bpCtx.fillText('SYS CODE: NEURAL-CLX-9900 • SCHEMATIC REV 4.8.2', 1404, 1215);
    bpCtx.fillStyle = '#10b981';
    bpCtx.font = '14px "SF Mono", monospace';
    bpCtx.fillText('STATUS: FABRICATION COMPLETE // PRODUCTION READY', 1404, 1248);
    bpCtx.fillStyle = '#94a3b8';
    bpCtx.font = '12px "SF Mono", monospace';
    bpCtx.fillText('AUTHORIZED SIGNATURE: PIYUSH KUMAR • LEAD PLATFORM ENGINEER', 1404, 1285);
    bpCtx.fillText('CLASSIFICATION: CONFIDENTIAL ARCHITECTURAL BLUEPRINT', 1404, 1312);

    const bpTex = new THREE.CanvasTexture(bpCanvas);
    bpTex.colorSpace = THREE.SRGBColorSpace;
    bpTex.generateMipmaps = true;
    bpTex.minFilter = THREE.LinearMipmapLinearFilter;
    bpTex.magFilter = THREE.LinearFilter;
    bpTex.anisotropy = maxAnisotropy;
    const bpMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.78, 1.18),
      new THREE.MeshBasicMaterial({ map: bpTex, toneMapped: false })
    );
    bpMesh.position.set(0.012, 0, 0);
    bpMesh.rotation.y = Math.PI / 2;
    artGroup.add(bpMesh);

    // Anti-Reflective Museum Glass Cover Pane with Subtle Specular Sheen
    const artGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.82, 1.22),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        roughness: 0.02,
        metalness: 0.1,
        transmission: 0.94,
        reflectivity: 0.95,
        clearcoat: 1.0,
      })
    );
    artGlass.position.set(0.022, 0, 0);
    artGlass.rotation.y = Math.PI / 2;
    artGroup.add(artGlass);

    // Architectural Gallery Picture Light Fixture (Mounted on Top of Frame)
    const picLightBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.72, 16),
      artFrameBevelMat
    );
    picLightBar.position.set(0.18, 0.82, 0);
    picLightBar.rotation.x = Math.PI / 2;
    artGroup.add(picLightBar);

    // Dual Mounting Arm Standoffs
    [-0.24, 0.24].forEach((az) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.20, 10), artFrameBevelMat);
      arm.position.set(0.09, 0.78, az);
      arm.rotation.z = -Math.PI / 3;
      artGroup.add(arm);
    });

    // Gallery Spotlight casting warm 3000K illumination down the blueprint artwork
    const gallerySpot = new THREE.SpotLight(0xffedd5, 2.8, 4.0, Math.PI / 3.2, 0.45, 1.2);
    gallerySpot.position.set(-3.85, 2.65, 0.5);
    gallerySpot.target.position.set(-4.06, 1.85, 0.5);
    scene.add(gallerySpot);
    scene.add(gallerySpot.target);

    roomGroup.add(artGroup);

    // =========================================================================
    // LUXURY ARCHITECTURAL ARC FLOOR LAMP (FLOS ARCO INSPIRED) — RIGHT SIDE
    // =========================================================================
    const arcGroup = new THREE.Group();
    arcGroup.position.set(3.1, 0, 0.8);
    const marbleBaseMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.18,
      metalness: 0.12,
    });
    const lampBrassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.96,
      roughness: 0.14,
    });
    const lampChromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.08,
    });

    // Chamfered Heavy Marble Pedestal Base with Guide Hole
    const arcBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, 0.24), marbleBaseMat);
    arcBase.position.set(0, 0.24, 0);
    // arcBase.castShadow = true; (optimized out)
    arcGroup.add(arcBase);

    // Brass Base Collar & Floor Glide
    const baseCollar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.25), lampBrassMat);
    baseCollar.position.set(0, 0.01, 0);
    arcGroup.add(baseCollar);

    // Cantilever Curved Tubular Stainless Steel Telescoping Arch
    const arcPoints = [
      new THREE.Vector3(0, 0.48, 0),
      new THREE.Vector3(0, 1.45, 0.02),
      new THREE.Vector3(-0.12, 2.15, -0.15),
      new THREE.Vector3(-0.35, 2.42, -0.45),
      new THREE.Vector3(-0.65, 2.36, -0.75),
      new THREE.Vector3(-0.85, 2.12, -0.90),
    ];
    const arcCurve = new THREE.CatmullRomCurve3(arcPoints);
    const arcTubeGeo = new THREE.TubeGeometry(arcCurve, 40, 0.016, 16, false);
    const arcTubeMesh = new THREE.Mesh(arcTubeGeo, lampChromeMat);
    // arcTubeMesh.castShadow = true; (optimized out)
    arcGroup.add(arcTubeMesh);

    // Brass Telescoping Coupler Rings
    [
      new THREE.Vector3(-0.12, 2.15, -0.15),
      new THREE.Vector3(-0.45, 2.40, -0.55),
    ].forEach((pt) => {
      const coupler = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 16), lampBrassMat);
      coupler.position.copy(pt);
      arcGroup.add(coupler);
    });

    // Spun Champagne Brass Hemispherical Dome Reflector Shade
    const shadeGroup = new THREE.Group();
    shadeGroup.position.set(-0.85, 2.12, -0.90);

    const shadeDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      lampBrassMat
    );
    shadeDome.rotation.x = Math.PI; // Opening faces downward
    // shadeDome.castShadow = true; (optimized out)
    shadeGroup.add(shadeDome);

    // Laser-Cut Top Air Cooling Crown
    const shadeCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.025, 16), lampBrassMat);
    shadeCrown.position.set(0, 0.02, 0);
    shadeGroup.add(shadeCrown);

    // Warm Internal Diffuser Bulb with High Efficacy Glow
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 2.8,
      roughness: 0.2,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), bulbMat);
    bulb.position.set(0, -0.06, 0);
    shadeGroup.add(bulb);

    arcGroup.add(shadeGroup);
    roomGroup.add(arcGroup);

    // Dedicated Warm Ambient Downlight from Arc Lamp onto Lounge Reading Zone
    const arcDownLight = new THREE.SpotLight(0xfef3c7, 2.2, 5.5, Math.PI / 3.8, 0.55, 1.5);
    arcDownLight.position.set(2.25, 2.1, -0.1);
    arcDownLight.target.position.set(2.25, 0.5, -0.1);
    scene.add(arcDownLight);
    scene.add(arcDownLight.target);

    // =========================================================================
    // ARCHITECTURAL ACOUSTIC WOOD SLAT WALL PANELS (SCANDINAVIAN OAK & FELT)
    // =========================================================================
    const oakSlatMat = new THREE.MeshStandardMaterial({
      color: 0xc28546, // Warm Natural White Oak
      roughness: 0.38,
      metalness: 0.10,
    });
    const feltBackingMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Acoustic Absorption Charcoal PET Felt
      roughness: 0.95,
      metalness: 0.05,
    });
    const panelGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
    });

    [-3.85, 3.85].forEach((px) => {
      // Felt Backing Board (Height: 2.0m, Width: 0.72m)
      const feltBoard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.0, 0.72), feltBackingMat);
      feltBoard.position.set(px, 1.55, -2.85);
      feltBoard.receiveShadow = true;
      roomGroup.add(feltBoard);

      // Fluted Solid Oak Slats (14 vertical beveled ribs per panel)
      const slatCount = 12;
      const slatWidth = 0.034;
      const slatDepth = 0.022;
      const slatSpacing = 0.058;
      const startZ = -2.85 - ((slatCount - 1) * slatSpacing) / 2;

      for (let s = 0; s < slatCount; s++) {
        const slatZ = startZ + s * slatSpacing;
        const slat = new THREE.Mesh(new THREE.BoxGeometry(slatDepth, 1.96, slatWidth), oakSlatMat);
        slat.position.set(px + (px > 0 ? -0.016 : 0.016), 1.55, slatZ);
        // slat.castShadow = true; (optimized out)
        roomGroup.add(slat);
      }

      // Vertical Linear Edge Accent LED Channel
      const edgeLED = new THREE.Mesh(new THREE.BoxGeometry(0.008, 1.96, 0.012), panelGlowMat);
      edgeLED.position.set(px + (px > 0 ? -0.022 : 0.022), 1.55, -2.85 + 0.36);
      roomGroup.add(edgeLED);
    });

    // =========================================================================
    // Floating Studio Shelves (Solid American Walnut, Concealed Brass Studs & Under-LED Wash)
    // =========================================================================
    const shelfWoodMat = new THREE.MeshStandardMaterial({
      color: 0x451a03, // Rich American Black Walnut
      roughness: 0.38,
      metalness: 0.12,
    });
    const shelfBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Satin brushed brass
      metalness: 0.95,
      roughness: 0.18,
    });
    const shelfGlowMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    [-4.05, 4.05].forEach((sx) => {
      const shelfGroup = new THREE.Group();
      shelfGroup.position.set(sx, 1.35, -1.0);

      // Main Solid Walnut Plank with Chamfered Edge
      const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.046, 1.65), shelfWoodMat);
      // shelfPlank.castShadow = true; (optimized out)
      shelfPlank.receiveShadow = true;
      shelfGroup.add(shelfPlank);

      // Underside Recessed Diffused LED Strip Channel (Washes wall downward)
      const underLED = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.005, 1.55), shelfGlowMat);
      underLED.position.set(sx > 0 ? -0.10 : 0.10, -0.024, 0);
      shelfGroup.add(underLED);

      // Heavy Brushed Brass Concealed Mounting Standoff Brackets
      [-0.62, 0.62].forEach((bz) => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.035), shelfBrassMat);
        bracket.position.set(sx > 0 ? -0.12 : 0.12, -0.065, bz);
        // bracket.castShadow = true; (optimized out)
        shelfGroup.add(bracket);
      });

      roomGroup.add(shelfGroup);
    });

    // -------------------------------------------------------------------------
    // Left Shelf Collection: Hardcover Technical Literature with Foil Spines & Brass Bookend
    // -------------------------------------------------------------------------
    const bookTitles = [
      { title: 'DEEP LEARNING ARCHITECTURES', color: 0x0f172a, foil: 0x38bdf8, h: 0.25, w: 0.052 },
      { title: 'DISTRIBUTED SYSTEMS // CLOUD', color: 0x1e3a8a, foil: 0xf59e0b, h: 0.23, w: 0.046 },
      { title: 'REALTIME RAY TRACING & SHADERS', color: 0x7c2d12, foil: 0xfde047, h: 0.26, w: 0.058 },
      { title: 'QUANTUM NEURAL ALGORITHMS', color: 0x064e3b, foil: 0x34d399, h: 0.22, w: 0.042 },
      { title: 'MATHEMATICAL LOGIC & GRAPHS', color: 0x581c87, foil: 0xf472b6, h: 0.24, w: 0.048 },
    ];

    let bookZ = -1.55;
    bookTitles.forEach((b, bIdx) => {
      const bookGrp = new THREE.Group();
      bookGrp.position.set(-4.05, 1.373 + b.h / 2, bookZ + b.w / 2);

      // Textured Book Cover Cloth
      const bookMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.21, b.h, b.w),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.62 })
      );
      // bookMesh.castShadow = true; (optimized out)
      bookGrp.add(bookMesh);

      // Acid-Free Cotton Paper Page Block
      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.19, b.h - 0.016, b.w - 0.008),
        new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.95 })
      );
      pages.position.set(-0.008, 0, 0);
      bookGrp.add(pages);

      // Embossed Gold / Holographic Foil Spine Lettering
      const spineFoil = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, b.h - 0.038, b.w - 0.008),
        new THREE.MeshStandardMaterial({ color: b.foil, metalness: 0.96, roughness: 0.12 })
      );
      spineFoil.position.set(0.106, 0, 0);
      bookGrp.add(spineFoil);

      // Silk Bookmark Ribbon draping off the edge
      if (bIdx === 2) {
        const ribbon = new THREE.Mesh(
          new THREE.BoxGeometry(0.002, 0.08, 0.008),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
        );
        ribbon.position.set(0.06, -b.h / 2 - 0.025, 0);
        bookGrp.add(ribbon);
      }

      roomGroup.add(bookGrp);
      bookZ += b.w + 0.008;
    });

    // Sculpted Brass L-Shape Bookend Supporting the Books
    const bookendMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.96, roughness: 0.15 });
    const bookendBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.008, 0.08), bookendMat);
    bookendBase.position.set(-4.05, 1.375, bookZ + 0.04);
    roomGroup.add(bookendBase);

    const bookendWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.008), bookendMat);
    bookendWall.position.set(-4.05, 1.45, bookZ);
    roomGroup.add(bookendWall);

    // Natural Echeveria Succulent in Fluted Ceramic Pot with Terracotta Accent
    const potMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.052, 0.095, 16), potMat);
    potMesh.position.set(-4.05, 1.42, -0.62);
    // potMesh.castShadow = true; (optimized out)
    roomGroup.add(potMesh);

    // Terracotta rim line
    const potRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.005, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.55 })
    );
    potRim.rotation.x = Math.PI / 2;
    potRim.position.set(-4.05, 1.468, -0.62);
    roomGroup.add(potRim);

    // Dark Potting Soil & Micro Pebbles Substrate
    const succulentSoilMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.062, 16),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 })
    );
    succulentSoilMesh.rotation.x = -Math.PI / 2;
    succulentSoilMesh.position.set(-4.05, 1.462, -0.62);
    roomGroup.add(succulentSoilMesh);

    // Multi-Tiered Realistic Echeveria Rosette Petals (Jade & Mint with Rose-Tinted Tips)
    const succulentMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.45 });
    const succulentTipMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.42 });

    for (let layer = 0; layer < 3; layer++) {
      const petalCount = 8 + layer * 2;
      const radius = 0.024 + layer * 0.016;
      const ly = 1.472 + layer * 0.012;

      for (let p = 0; p < petalCount; p++) {
        const pAngle = (p / petalCount) * Math.PI * 2 + layer * 0.35;
        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.014 - layer * 0.002, 10, 8),
          succulentMat
        );
        petal.scale.set(1.4, 0.5, 2.2);
        petal.position.set(
          -4.05 + Math.cos(pAngle) * radius,
          ly,
          -0.62 + Math.sin(pAngle) * radius
        );
        petal.rotation.y = -pAngle;
        petal.rotation.x = 0.45 - layer * 0.12;
        roomGroup.add(petal);

        // Rose petal tips
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), succulentTipMat);
        tip.position.set(
          -4.05 + Math.cos(pAngle) * (radius + 0.022),
          ly + 0.008,
          -0.62 + Math.sin(pAngle) * (radius + 0.022)
        );
        roomGroup.add(tip);
      }
    }

    // -------------------------------------------------------------------------
    // Right Shelf Collection: Kinetic 24K Gold Möbius Sculpture, Crystal Award & Journals
    // -------------------------------------------------------------------------
    // Polished Black Belgian Marble Plinth
    const marblePlinthMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.12,
      metalness: 0.35,
    });
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.045, 0.15), marblePlinthMat);
    plinth.position.set(4.05, 1.395, -1.35);
    // plinth.castShadow = true; (optimized out)
    roomGroup.add(plinth);

    // 24K Mirror Gold Intersecting Kinetic Möbius Loops
    const goldSculptMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.98,
      roughness: 0.06, // Mirror specular reflections
    });
    const loop1 = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 16, 36), goldSculptMat);
    loop1.position.set(4.05, 1.49, -1.35);
    loop1.rotation.set(0.65, 0.45, 0.2);
    // loop1.castShadow = true; (optimized out)
    roomGroup.add(loop1);

    const loop2 = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 16, 32), goldSculptMat);
    loop2.position.set(4.05, 1.49, -1.35);
    loop2.rotation.set(-0.55, -0.65, 0.4);
    // loop2.castShadow = true; (optimized out)
    roomGroup.add(loop2);

    // AI Engineering Excellence Optical Crystal Award Trophy
    const awardBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.058, 0.035, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.94, roughness: 0.15 })
    );
    awardBase.position.set(4.05, 1.39, -0.75);
    roomGroup.add(awardBase);

    // Inscribed Gold Plaque on Award Base
    const awardPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.016, 0.046),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.12 })
    );
    awardPlaque.position.set(4.00, 1.39, -0.75);
    roomGroup.add(awardPlaque);

    // Pure Optical Crystal Obelisk with Refractive Dispersion
    const trophyGeo = new THREE.CylinderGeometry(0.018, 0.042, 0.19, 6);
    const trophyMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.02,
      transmission: 0.95,
      ior: 1.54,
      reflectivity: 0.95,
      clearcoat: 1.0,
    });
    const trophy = new THREE.Mesh(trophyGeo, trophyMat);
    trophy.position.set(4.05, 1.50, -0.75);
    // trophy.castShadow = true; (optimized out)
    roomGroup.add(trophy);

    // Stacked Architectural & Technology Periodicals (ACM, IEEE, Wired Monographs)
    const journalData = [
      { color: 0x0284c7, spine: 'ACM TRANSACTIONS ON GRAPHICS', rot: 0.04 },
      { color: 0xec4899, spine: 'NEURAL INFORMATION PROCESSING (NeurIPS)', rot: -0.06 },
      { color: 0xf59e0b, spine: 'IEEE QUANTUM & HBM ARCHITECTURE', rot: 0.08 },
    ];
    journalData.forEach((j, ji) => {
      const mag = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.014, 0.32),
        new THREE.MeshStandardMaterial({ color: j.color, roughness: 0.38 })
      );
      mag.position.set(4.05, 1.38 + ji * 0.015, -0.30 + ji * 0.006);
      mag.rotation.y = j.rot;
      // mag.castShadow = true; (optimized out)
      roomGroup.add(mag);

      // Realistic White Paper Page Ridges along Magazine Edges
      const pageTrim = new THREE.Mesh(
        new THREE.BoxGeometry(0.232, 0.011, 0.312),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
      );
      pageTrim.position.set(4.05, 1.38 + ji * 0.015, -0.30 + ji * 0.006);
      pageTrim.rotation.y = j.rot;
      roomGroup.add(pageTrim);
    });

    // Floor-standing Modern Indoor Monstera Plant in Fluted Ceramic Pot on Walnut Tripod Stand
    const planterMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.32 }); // White fluted ceramic
    const floorPlanter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.48, 24), planterMat);
    floorPlanter.position.set(2.8, 0.38, -0.4);
    // floorPlanter.castShadow = true; (optimized out)
    floorPlanter.receiveShadow = true;
    roomGroup.add(floorPlanter);

    // Solid Walnut Tripod Stand for Planter
    const standMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.45 });
    for (let leg = 0; leg < 3; leg++) {
      const standAngle = (leg / 3) * Math.PI * 2;
      const standLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 12), standMat);
      standLeg.position.set(2.8 + Math.cos(standAngle) * 0.18, 0.19, -0.4 + Math.sin(standAngle) * 0.18);
      standLeg.rotation.z = Math.cos(standAngle) * 0.12;
      standLeg.rotation.x = Math.sin(standAngle) * 0.12;
      roomGroup.add(standLeg);
    }

    // Rich Dark Potting Soil
    const soilMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.20, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 })
    );
    soilMesh.position.set(2.8, 0.61, -0.4);
    roomGroup.add(soilMesh);

    // Monstera Central Stems
    for (let st = 0; st < 3; st++) {
      const sAngle = (st / 3) * Math.PI * 2 + 0.3;
      const plantStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.016, 0.55, 8),
        new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.6 })
      );
      plantStem.position.set(2.8 + Math.cos(sAngle) * 0.06, 0.82, -0.4 + Math.sin(sAngle) * 0.06);
      plantStem.rotation.z = Math.cos(sAngle) * 0.22;
      plantStem.rotation.x = Math.sin(sAngle) * 0.22;
      roomGroup.add(plantStem);
    }

    // Luscious High-Fidelity 3D Sculpted Monstera Deliciosa Leaves
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x047857,
      roughness: 0.22,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    const leafVeinMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.35,
      metalness: 0.05,
    });

    const leafConfigs = [
      { angle: 0.2, y: 0.95, tilt: 0.45, scale: 1.05 },
      { angle: 1.1, y: 1.05, tilt: 0.52, scale: 0.95 },
      { angle: 2.0, y: 0.90, tilt: 0.38, scale: 1.12 },
      { angle: 2.9, y: 1.10, tilt: 0.48, scale: 0.88 },
      { angle: 3.8, y: 0.98, tilt: 0.55, scale: 1.08 },
      { angle: 4.7, y: 1.02, tilt: 0.42, scale: 1.00 },
      { angle: 5.6, y: 0.92, tilt: 0.50, scale: 1.15 },
    ];

    leafConfigs.forEach((cfg) => {
      const leafGroup = new THREE.Group();
      const radius = 0.24 * cfg.scale;
      leafGroup.position.set(
        2.8 + Math.cos(cfg.angle) * radius,
        cfg.y,
        -0.4 + Math.sin(cfg.angle) * radius
      );
      leafGroup.rotation.y = cfg.angle + 0.3;
      leafGroup.rotation.x = cfg.tilt;
      leafGroup.rotation.z = Math.sin(cfg.angle) * 0.25;

      // Curved Leaf Petiole (Stem)
      const petiole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.010, 0.28, 8),
        leafVeinMat
      );
      petiole.position.set(0, -0.12, 0.08);
      petiole.rotation.x = -0.4;
      leafGroup.add(petiole);

      // Central Stiff Spine / Midrib
      const midrib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.007, 0.38, 8),
        leafVeinMat
      );
      midrib.position.set(0, 0.05, -0.04);
      midrib.rotation.x = 0.28;
      leafGroup.add(midrib);

      // Sculpted Organic Cordate Leaf Blade Segments (Deeply Lobed Monstera Silhouette)
      [-1, 1].forEach((side) => {
        // Main Broad Lateral Leaf Blade
        const bladeGeo = new THREE.CylinderGeometry(0.12 * cfg.scale, 0.04 * cfg.scale, 0.32 * cfg.scale, 12);
        const blade = new THREE.Mesh(bladeGeo, leafMat);
        blade.position.set(side * 0.065 * cfg.scale, 0.06, -0.02);
        blade.rotation.z = side * 0.35;
        blade.rotation.x = 0.25;
        blade.scale.set(0.65, 1.0, 0.035); // Flattened into broad contoured leaf blade
        // blade.castShadow = true; (optimized out)
        blade.receiveShadow = true;
        leafGroup.add(blade);

        // Fenestrated Pinnae Leaf Lobes (Outer Split Slits)
        for (let lobe = 0; lobe < 3; lobe++) {
          const lobeMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.048 * cfg.scale, 0.065 * cfg.scale, 0.004),
            leafMat
          );
          lobeMesh.position.set(
            side * (0.11 + lobe * 0.015) * cfg.scale,
            0.02 + lobe * 0.08,
            -0.02 - lobe * 0.02
          );
          lobeMesh.rotation.z = side * (0.55 + lobe * 0.12);
          // lobeMesh.castShadow = true; (optimized out)
          leafGroup.add(lobeMesh);
        }
      });

      roomGroup.add(leafGroup);
    });

    // Dedicated Floor Uplight illuminating the plant from below
    const plantSpot = new THREE.SpotLight(0x34d399, 1.2, 3.5, Math.PI / 4, 0.5, 1.6);
    plantSpot.position.set(2.8, 0.05, -0.15);
    plantSpot.target.position.set(2.8, 1.0, -0.4);
    scene.add(plantSpot);
    scene.add(plantSpot.target);

    // ======================================================================================
    // SIDE 6/6 (REAR / NORTH): CONTEMPORARY LIGHT RED ARCHITECTURAL WALL & SUITE ENTRANCE
    // (Requested: "make the room walls which are tehre make them red in colour light red")
    // ======================================================================================
    const rearWallGeo = new THREE.PlaneGeometry(8.2, 3.35);
    const rearWall = new THREE.Mesh(rearWallGeo, wallLightRedMat);
    rearWall.position.set(0, 1.675, 6.58);
    rearWall.rotation.y = Math.PI;
    rearWall.receiveShadow = true;
    roomGroup.add(rearWall);

    // Architectural Trim Ribs on Rear Wall
    [-4.1, -2.4, -0.8, 0.8, 2.4, 4.1].forEach((mX) => {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.35, 0.06), wallTrimMat);
      mullion.position.set(mX, 1.675, 6.56);
      roomGroup.add(mullion);

      // Stainless steel spider mounting fittings
      [0.8, 1.8, 2.8].forEach((fY) => {
        const fitting = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 12), spiderFittingMat);
        fitting.position.set(mX, fY, 6.53);
        roomGroup.add(fitting);
      });
    });

    // Horizontal architectural accent chair rails on Rear Wall
    [1.1, 2.4].forEach((tY) => {
      const transom = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.04, 0.04), wallTrimMat);
      transom.position.set(0, tY, 6.56);
      roomGroup.add(transom);
    });

    // Minimalist Dual Entrance Doors in Center with Tall Brushed Stainless Steel Pull Handles
    [-0.8, 0.8].forEach((hx) => {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 1.4, 16),
        spiderFittingMat
      );
      handle.position.set(hx > 0 ? 0.65 : -0.65, 1.3, 6.52);
      roomGroup.add(handle);
    });

    // Floating Transparent Acrylic Glass Studio Monogram Plaque (Suspended in space)
    const rearArtCanvas = document.createElement('canvas');
    rearArtCanvas.width = 512;
    rearArtCanvas.height = 200;
    const rCtx = rearArtCanvas.getContext('2d')!;
    rCtx.clearRect(0, 0, 512, 200);

    // Subtle translucent background badge (Light graphite, no deep black)
    rCtx.fillStyle = 'rgba(30, 41, 59, 0.80)';
    rCtx.roundRect(10, 10, 492, 180, 12);
    rCtx.fill();

    rCtx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    rCtx.lineWidth = 1.5;
    rCtx.strokeRect(20, 20, 472, 160);

    rCtx.fillStyle = '#f8fafc';
    rCtx.font = 'bold 18px monospace';
    rCtx.textAlign = 'center';
    rCtx.fillText('PIYUSH KUMAR // 360° OBSERVATION SUITE', 256, 95);
    rCtx.fillStyle = '#38bdf8';
    rCtx.font = '12px monospace';
    rCtx.fillText('DISTRIBUTED SYSTEMS & REALTIME 3D ARCHITECTURE', 256, 125);

    const rearArtTex = new THREE.CanvasTexture(rearArtCanvas);
    rearArtTex.colorSpace = THREE.SRGBColorSpace;
    rearArtTex.generateMipmaps = true;
    rearArtTex.minFilter = THREE.LinearMipmapLinearFilter;
    rearArtTex.magFilter = THREE.LinearFilter;
    rearArtTex.anisotropy = maxAnisotropy;
    const rearArtMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.8),
      new THREE.MeshBasicMaterial({ map: rearArtTex, transparent: true, opacity: 0.88, depthWrite: false })
    );
    rearArtMesh.position.set(0, 2.2, 6.50);
    rearArtMesh.rotation.y = Math.PI;
    roomGroup.add(rearArtMesh);

    // Minimalist Micro-Downlight on Ceiling gently highlighting the rear entrance
    const rearAccentLight = new THREE.SpotLight(0xcfdcf5, 0.45, 5, Math.PI / 5, 0.5, 1.5);
    rearAccentLight.position.set(0, 3.3, 5.5);
    rearAccentLight.target = rearArtMesh;
    scene.add(rearAccentLight);
    scene.add(rearAccentLight.target);

    // ======================================================================================
    // LAYER 2: FLOOR-TO-CEILING GLASS DOORS, PENTHOUSE BALCONY & OUTSIDE WORLD METROPOLIS
    // ======================================================================================
    const viewGroup = new THREE.Group();

    // --------------------------------------------------------------------------------------
    // A. ARCHITECTURAL GLASS DOORS & FRAME (Sitting at z = -3.2, spanning x = -3.2 to +3.2)
    // --------------------------------------------------------------------------------------
    // Requested: "and the front one as white so they lookgood"
    const doorFrameMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp pure studio white
      metalness: 0.20,
      roughness: 0.20,
    });
    const doorHandleMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db, // Brushed stainless steel
      metalness: 0.95,
      roughness: 0.12,
    });
    const doorTrackMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Architectural off-white track
      metalness: 0.35,
      roughness: 0.25,
    });

    // High-Clarity Tempered Architectural Glass Material
    const doorGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa5d8d0,
      transparent: true,
      opacity: 0.22,
      roughness: 0.03,
      metalness: 0.1,
      transmission: 0.93,
      ior: 1.52,
      reflectivity: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });

    const glassDoorSystem = new THREE.Group();
    glassDoorSystem.position.set(0, 0, -3.2);

    // 1. Outer Frame: Left Jamb, Right Jamb, and Top Header meeting the Bulkhead
    const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.12, 0.16), doorFrameMat);
    leftJamb.position.set(-3.2, 1.56, 0);
    glassDoorSystem.add(leftJamb);

    const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.12, 0.16), doorFrameMat);
    rightJamb.position.set(3.2, 1.56, 0);
    glassDoorSystem.add(rightJamb);

    const topHeader = new THREE.Mesh(new THREE.BoxGeometry(6.52, 0.10, 0.18), doorFrameMat);
    topHeader.position.set(0, 3.07, 0);
    glassDoorSystem.add(topHeader);

    // Floor Track with Metallic Guide Runners
    const floorTrack = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.024, 0.20), doorTrackMat);
    floorTrack.position.set(0, 0.012, 0);
    glassDoorSystem.add(floorTrack);

    [-0.04, 0.04].forEach((zOff) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(6.36, 0.008, 0.012),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.98, roughness: 0.1 })
      );
      rail.position.set(0, 0.026, zOff);
      glassDoorSystem.add(rail);
    });

    // 2. Four Large Floor-to-Ceiling Glass Sliding Doors (y = 0.02 to 3.02, width 1.62m each)
    const doorPanelsConfig = [
      { x: -2.43, z: 0.0, isSliding: false }, // Left fixed glass door
      { x: -0.81, z: 0.04, isSliding: true },  // Center-left sliding glass door
      { x: 0.81, z: -0.04, isSliding: true },  // Center-right sliding glass door
      { x: 2.43, z: 0.0, isSliding: false },  // Right fixed glass door
    ];

    doorPanelsConfig.forEach((dp) => {
      const panelGroup = new THREE.Group();
      panelGroup.position.set(dp.x, 1.54, dp.z);

      const panelW = 1.62;
      const panelH = 3.02;
      const fThick = 0.055;
      const fDepth = 0.06;

      // Outer Aluminum Door Frame Stile & Rails
      const leftStile = new THREE.Mesh(new THREE.BoxGeometry(fThick, panelH, fDepth), doorFrameMat);
      leftStile.position.set(-panelW / 2 + fThick / 2, 0, 0);
      panelGroup.add(leftStile);

      const rightStile = new THREE.Mesh(new THREE.BoxGeometry(fThick, panelH, fDepth), doorFrameMat);
      rightStile.position.set(panelW / 2 - fThick / 2, 0, 0);
      panelGroup.add(rightStile);

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(panelW, fThick, fDepth), doorFrameMat);
      topRail.position.set(0, panelH / 2 - fThick / 2, 0);
      panelGroup.add(topRail);

      const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(panelW, 0.07, fDepth), doorFrameMat);
      bottomRail.position.set(0, -panelH / 2 + 0.035, 0);
      panelGroup.add(bottomRail);

      // Crystal-Clear Tempered Glass Pane
      const glassPaneMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(panelW - fThick * 2, panelH - fThick - 0.07),
        doorGlassMat
      );
      panelGroup.add(glassPaneMesh);

      // Subtle Glass Polish Specular Glint Line
      const glintGeo = new THREE.PlaneGeometry(panelW * 0.65, 0.012);
      const glintMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
      });
      const glintMesh = new THREE.Mesh(glintGeo, glintMat);
      glintMesh.rotation.z = -Math.PI / 5;
      glintMesh.position.set(0, 0.08, 0.005);
      panelGroup.add(glintMesh);

      // Luxury Tall Architectural Door Pull Handles
      if (dp.isSliding) {
        const handleX = dp.x < 0 ? panelW / 2 - 0.10 : -panelW / 2 + 0.10;
        const handleGroup = new THREE.Group();
        handleGroup.position.set(handleX, -0.3, dp.x < 0 ? 0.045 : -0.045);

        // 1.3m tall cylindrical handle bar
        const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.3, 16), doorHandleMat);
        handleGroup.add(handleBar);

        // Standoff mounting brackets
        [-0.5, 0.5].forEach((yPost) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 12), doorHandleMat);
          post.rotation.x = Math.PI / 2;
          post.position.set(0, yPost, dp.x < 0 ? -0.025 : 0.025);
          handleGroup.add(post);
        });

        panelGroup.add(handleGroup);
      }

      glassDoorSystem.add(panelGroup);
    });

    viewGroup.add(glassDoorSystem);

    // --------------------------------------------------------------------------------------
    // B. OUTSIDE HIGH-RISE BALCONY / TERRACE (z = -3.25 to -5.4, width 7.4m)
    // --------------------------------------------------------------------------------------
    const balconyGroup = new THREE.Group();
    balconyGroup.position.set(0, 0, -4.3);

    // Outdoor Weather-Treated Composite Teak Wood Balcony Planks
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.55,
      metalness: 0.25,
    });
    const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.08, 2.2), deckMat);
    deckFloor.position.set(0, -0.04, 0);
    deckFloor.receiveShadow = true;
    balconyGroup.add(deckFloor);

    // Deck plank groove lines
    const grooveMat = new THREE.MeshBasicMaterial({ color: 0x070b13 });
    for (let gx = -3.6; gx <= 3.6; gx += 0.4) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.005, 2.18), grooveMat);
      groove.position.set(gx, 0.003, 0);
      balconyGroup.add(groove);
    }

    // Modern Frameless Glass Balustrade (Balcony Railing at the building edge)
    const railingGroup = new THREE.Group();
    railingGroup.position.set(0, 0, -1.08);

    const balustradeGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.15,
      transmission: 0.88,
      reflectivity: 0.9,
    });

    // Glass Railing Panels (1.15m height)
    const railingGlass = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.15, 0.02), balustradeGlassMat);
    railingGlass.position.set(0, 0.62, 0);
    railingGroup.add(railingGlass);

    // Continuous Brushed Stainless Steel Handrail Cap
    const handrailCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 7.4, 16),
      doorHandleMat
    );
    handrailCap.rotation.z = Math.PI / 2;
    handrailCap.position.set(0, 1.2, 0);
    railingGroup.add(handrailCap);

    // Metal Base Spigots / Clamping Posts
    const spigotMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    for (let sp = -3.4; sp <= 3.4; sp += 1.36) {
      const spigot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), spigotMat);
      spigot.position.set(sp, 0.09, 0);
      railingGroup.add(spigot);
    }

    // Recessed Warm Amber Balcony Footlights
    const balcLightMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    [-2.8, -0.9, 0.9, 2.8].forEach((lx) => {
      const balcLight = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 12), balcLightMat);
      balcLight.position.set(lx, 0.01, -0.8);
      balconyGroup.add(balcLight);
    });

    balconyGroup.add(railingGroup);
    viewGroup.add(balconyGroup);

    // --------------------------------------------------------------------------------------
    // C. REAL-LIFE OUTSIDE WORLD METROPOLIS (Skyscrapers, Towers, Highways, Skyline, Night Sky)
    // --------------------------------------------------------------------------------------
    const metropolisGroup = new THREE.Group();

    // 1. High-Resolution Commercial Glass Curtain Wall Texture (Office Skyscraper Windows)
    const officeCanvas = document.createElement('canvas');
    officeCanvas.width = 512;
    officeCanvas.height = 512;
    const officeCtx = officeCanvas.getContext('2d')!;

    // Architectural Dark Facade Glass Base
    officeCtx.fillStyle = '#040711';
    officeCtx.fillRect(0, 0, 512, 512);

    // Procedural office floors with architectural spandrel bands
    const numFloors = 32;
    const numBays = 24;
    const bayW = 512 / numBays;
    const floorH = 512 / numFloors;

    for (let f = 0; f < numFloors; f++) {
      const floorLitFactor = Math.random();
      // Floor spandrel line (structural dark metal between floors)
      officeCtx.fillStyle = '#090f1d';
      officeCtx.fillRect(0, f * floorH + floorH - 3, 512, 3);

      for (let b = 0; b < numBays; b++) {
        const rand = Math.random();
        const isOfficeLit = floorLitFactor > 0.35 ? rand > 0.28 : rand > 0.85;

        if (isOfficeLit) {
          // Warm 3000K incandescent, modern 4000K executive, or sleek 5500K daylight LED
          let lightCol = '#fbbf24';
          if (rand > 0.72) lightCol = '#fef08a';
          else if (rand > 0.45) lightCol = '#38bdf8';
          else if (rand > 0.25) lightCol = '#f8fafc';
          else lightCol = '#fbbf24';

          officeCtx.fillStyle = lightCol;
          officeCtx.fillRect(b * bayW + 2, f * floorH + 2, bayW - 4, floorH - 5);

          // Subtle internal office ceiling fixture silhouette line
          officeCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          officeCtx.fillRect(b * bayW + 4, f * floorH + 3, bayW - 8, 1.5);
        } else {
          // Darkened office window with subtle interior depth
          officeCtx.fillStyle = '#060a14';
          officeCtx.fillRect(b * bayW + 2, f * floorH + 2, bayW - 4, floorH - 5);
        }
      }
    }

    const officeTex = new THREE.CanvasTexture(officeCanvas);
    officeTex.colorSpace = THREE.SRGBColorSpace;
    officeTex.generateMipmaps = true;
    officeTex.minFilter = THREE.LinearMipmapLinearFilter;
    officeTex.magFilter = THREE.LinearFilter;
    officeTex.anisotropy = maxAnisotropy;
    officeTex.wrapS = THREE.RepeatWrapping;
    officeTex.wrapT = THREE.RepeatWrapping;

    // 2. High-Resolution Residential Luxury Tower Window Texture
    const resCanvas = document.createElement('canvas');
    resCanvas.width = 512;
    resCanvas.height = 512;
    const resCtx = resCanvas.getContext('2d')!;

    resCtx.fillStyle = '#03060f';
    resCtx.fillRect(0, 0, 512, 512);

    const resFloors = 24;
    const resBays = 16;
    const rBayW = 512 / resBays;
    const rFloorH = 512 / resFloors;

    for (let f = 0; f < resFloors; f++) {
      resCtx.fillStyle = '#080d19';
      resCtx.fillRect(0, f * rFloorH + rFloorH - 2, 512, 2);

      for (let b = 0; b < resBays; b++) {
        const isApartmentLit = Math.random() > 0.52;
        if (isApartmentLit) {
          const warmAmber = Math.random() > 0.4 ? '#fed7aa' : '#fde047';
          resCtx.fillStyle = warmAmber;
          resCtx.fillRect(b * rBayW + 3, f * rFloorH + 3, rBayW - 6, rFloorH - 6);
        } else {
          resCtx.fillStyle = '#060b17';
          resCtx.fillRect(b * rBayW + 3, f * rFloorH + 3, rBayW - 6, rFloorH - 6);
        }
      }
    }

    const resTex = new THREE.CanvasTexture(resCanvas);
    resTex.colorSpace = THREE.SRGBColorSpace;
    resTex.generateMipmaps = true;
    resTex.minFilter = THREE.LinearMipmapLinearFilter;
    resTex.magFilter = THREE.LinearFilter;
    resTex.anisotropy = maxAnisotropy;
    resTex.wrapS = THREE.RepeatWrapping;
    resTex.wrapT = THREE.RepeatWrapping;

    // Physically-Based Building Materials with Emissive Windows & Specular Sheen
    const bldMatCommercial = new THREE.MeshStandardMaterial({
      map: officeTex,
      emissiveMap: officeTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.82,
    });

    const bldMatResidential = new THREE.MeshStandardMaterial({
      map: resTex,
      emissiveMap: resTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      roughness: 0.35,
      metalness: 0.65,
    });

    const bldMatDark = new THREE.MeshStandardMaterial({
      color: 0x141e30,
      roughness: 0.45,
      metalness: 0.70,
    });

    // Beacon Red aviation warning lights material
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.95,
    });
    beaconLightsRef.current.push(beaconMat);

    // --- Key Landmark Skyscrapers with Detailed 3D Rooftops ---

    // 1. Center-Right Mega Corporate Spire Tower (x = 2.4, z = -11.5)
    const spireTower = new THREE.Group();
    spireTower.position.set(2.4, 0, -11.5);

    const bld1 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 16.0, 3.8), bldMatCommercial);
    bld1.position.y = 6.5;
    spireTower.add(bld1);

    // Parapet roof edge
    const bld1Parapet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.4, 4.0), bldMatDark);
    bld1Parapet.position.y = 14.6;
    spireTower.add(bld1Parapet);

    // Stepped mechanical crown
    const bld1Step = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.2, 2.8), bldMatCommercial);
    bld1Step.position.y = 16.1;
    spireTower.add(bld1Step);

    // Helipad on top
    const helipad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.08, 24),
      new THREE.MeshBasicMaterial({ color: 0x1e293b })
    );
    helipad.position.y = 17.74;
    spireTower.add(helipad);

    const heliRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.85, 24),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
    );
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.y = 17.79;
    spireTower.add(heliRing);

    // Rooftop HVAC chiller units
    const hvac1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.8), bldMatDark);
    hvac1.position.set(-0.8, 17.95, -0.6);
    spireTower.add(hvac1);

    // Spire Antenna with Blinking Aviation Warning Light
    const antennaStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.06, 3.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    antennaStem.position.y = 19.5;
    spireTower.add(antennaStem);

    const beaconLight1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), beaconMat);
    beaconLight1.position.y = 21.3;
    spireTower.add(beaconLight1);

    metropolisGroup.add(spireTower);

    // 2. Center-Left Neo-Metropolis Glass High-Rise (x = -3.2, z = -12.5)
    const finTower = new THREE.Group();
    finTower.position.set(-3.2, 0, -12.5);

    const bld2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 14.5, 3.6), bldMatCommercial);
    bld2.position.y = 5.8;
    finTower.add(bld2);

    // Vertical Illuminated Cyan Light Fins along building facade
    [-1.6, -0.5, 0.5, 1.6].forEach((fx) => {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 14.2, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      fin.position.set(fx, 5.8, 1.85);
      finTower.add(fin);
    });

    // Crown Spire with Parapet
    const finCrown = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 3.2), bldMatDark);
    finCrown.position.y = 13.6;
    finTower.add(finCrown);

    const finSpire = new THREE.Mesh(new THREE.ConeGeometry(0.12, 2.4, 8), bldMatDark);
    finSpire.position.y = 14.9;
    finTower.add(finSpire);

    const finBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), beaconMat);
    finBeacon.position.y = 16.1;
    finTower.add(finBeacon);

    metropolisGroup.add(finTower);

    // 3. Twin High-Rise Towers with Elevated Skybridge (x = -8.5 and -5.2, z = -17.0)
    const twinL = new THREE.Mesh(new THREE.BoxGeometry(2.6, 17.0, 2.6), bldMatResidential);
    twinL.position.set(-8.5, 7.0, -17.0);
    metropolisGroup.add(twinL);

    const twinR = new THREE.Mesh(new THREE.BoxGeometry(2.6, 17.0, 2.6), bldMatCommercial);
    twinR.position.set(-5.2, 7.0, -17.0);
    metropolisGroup.add(twinR);

    // High-altitude illuminated glass skybridge connecting twin towers
    const skybridge = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.75, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.88 })
    );
    skybridge.position.set(-6.85, 9.5, -17.0);
    metropolisGroup.add(skybridge);

    const twinBeaconL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), beaconMat);
    twinBeaconL.position.set(-8.5, 15.6, -17.0);
    metropolisGroup.add(twinBeaconL);

    const twinBeaconR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), beaconMat);
    twinBeaconR.position.set(-5.2, 15.6, -17.0);
    metropolisGroup.add(twinBeaconR);

    // 4. Cylindrical Observation Skyscraper on the right (x = 7.8, z = -15.0)
    const roundTower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 15.0, 24), bldMatCommercial);
    roundTower.position.set(7.8, 6.0, -15.0);
    metropolisGroup.add(roundTower);

    const roundCrown = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.08, 12, 24),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    roundCrown.rotation.x = Math.PI / 2;
    roundCrown.position.set(7.8, 13.5, -15.0);
    metropolisGroup.add(roundCrown);

    // 5. Tiered Art-Deco High-Rise in Midground (x = -0.5, z = -19.0)
    const deco1 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 12.0, 4.6), bldMatCommercial);
    deco1.position.set(-0.5, 4.5, -19.0);
    metropolisGroup.add(deco1);

    const deco2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.5, 3.4), bldMatCommercial);
    deco2.position.set(-0.5, 11.5, -19.0);
    metropolisGroup.add(deco2);

    const deco3 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 2.0), bldMatDark);
    deco3.position.set(-0.5, 15.0, -19.0);
    metropolisGroup.add(deco3);

    const decoBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), beaconMat);
    decoBeacon.position.set(-0.5, 16.8, -19.0);
    metropolisGroup.add(decoBeacon);

    // 6. Dense Realistic 360-Degree Metropolis Skyline (Surrounding all sides of the glass pavilion)
    const skyscraperConfigs = [
      // Front / South Skyline (Facing the main terrace glass)
      { x: -15.5, z: -15, w: 3.4, h: 14, d: 3.4, type: 'comm' },
      { x: -12.0, z: -20, w: 4.0, h: 16, d: 3.8, type: 'res' },
      { x: -13.5, z: -26, w: 3.6, h: 18, d: 3.6, type: 'comm' },
      { x: -10.0, z: -24, w: 3.2, h: 15, d: 3.2, type: 'res' },
      { x: -7.5, z: -22, w: 3.5, h: 15, d: 3.5, type: 'comm' },
      { x: -4.0, z: -24, w: 3.8, h: 17, d: 3.8, type: 'comm' },
      { x: -2.0, z: -26, w: 3.4, h: 19, d: 3.4, type: 'res' },
      { x: 1.2, z: -24, w: 3.6, h: 16, d: 3.6, type: 'comm' },
      { x: 4.2, z: -20, w: 4.2, h: 17, d: 4.0, type: 'res' },
      { x: 6.5, z: -24, w: 3.4, h: 15, d: 3.4, type: 'comm' },
      { x: 10.5, z: -20, w: 4.0, h: 18, d: 3.8, type: 'comm' },
      { x: 13.5, z: -17, w: 3.5, h: 14, d: 3.5, type: 'res' },
      { x: 16.0, z: -22, w: 3.8, h: 16, d: 3.8, type: 'comm' },
      { x: -19.0, z: -21, w: 4.2, h: 14, d: 4.2, type: 'res' },
      { x: -16.5, z: -30, w: 4.8, h: 22, d: 4.8, type: 'comm' },
      { x: -11.5, z: -32, w: 4.2, h: 20, d: 4.2, type: 'res' },
      { x: -6.5, z: -30, w: 4.0, h: 23, d: 4.0, type: 'comm' },
      { x: 0.0, z: -33, w: 5.2, h: 25, d: 5.2, type: 'comm' },
      { x: 5.0, z: -31, w: 4.6, h: 22, d: 4.6, type: 'res' },
      { x: 9.5, z: -30, w: 3.8, h: 21, d: 3.8, type: 'comm' },
      { x: 14.5, z: -28, w: 4.2, h: 19, d: 4.2, type: 'res' },
      { x: 19.0, z: -25, w: 4.0, h: 15, d: 4.0, type: 'comm' },
      { x: 22.0, z: -30, w: 4.8, h: 20, d: 4.8, type: 'comm' },

      // Left / West Skyline (Visible through the left transparent glass wall)
      { x: -17.0, z: -6.0, w: 4.2, h: 17, d: 4.0, type: 'comm' },
      { x: -20.0, z: 0.0, w: 4.6, h: 22, d: 4.4, type: 'res' },
      { x: -18.0, z: 6.0, w: 3.8, h: 16, d: 3.8, type: 'comm' },
      { x: -22.5, z: 12.0, w: 4.4, h: 19, d: 4.4, type: 'comm' },
      { x: -16.0, z: 16.0, w: 3.6, h: 14, d: 3.6, type: 'res' },

      // Right / East Skyline (Visible through the right transparent glass wall)
      { x: 17.0, z: -6.0, w: 4.2, h: 18, d: 4.0, type: 'comm' },
      { x: 20.0, z: 0.0, w: 4.4, h: 23, d: 4.4, type: 'res' },
      { x: 18.0, z: 6.0, w: 3.8, h: 16, d: 3.8, type: 'comm' },
      { x: 22.5, z: 12.0, w: 4.6, h: 20, d: 4.6, type: 'comm' },
      { x: 16.0, z: 16.0, w: 3.6, h: 15, d: 3.6, type: 'res' },

      // Rear / North Skyline (Visible through the rear transparent glass entrance wall)
      { x: -11.0, z: 19.0, w: 4.0, h: 17, d: 4.0, type: 'comm' },
      { x: -5.0, z: 22.0, w: 4.8, h: 24, d: 4.6, type: 'res' },
      { x: 0.0, z: 25.0, w: 5.2, h: 26, d: 5.0, type: 'comm' },
      { x: 5.5, z: 22.0, w: 4.4, h: 22, d: 4.2, type: 'comm' },
      { x: 11.0, z: 19.0, w: 4.0, h: 18, d: 4.0, type: 'res' },
    ];

    skyscraperConfigs.forEach((sc, idx) => {
      const mat = sc.type === 'comm' ? bldMatCommercial : bldMatResidential;
      const bldMesh = new THREE.Mesh(new THREE.BoxGeometry(sc.w, sc.h, sc.d), mat);
      bldMesh.position.set(sc.x, sc.h / 2 - 2.5, sc.z);
      metropolisGroup.add(bldMesh);

      // Rooftop parapet and crown
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(sc.w + 0.1, 0.35, sc.d + 0.1), bldMatDark);
      parapet.position.set(sc.x, sc.h - 2.3, sc.z);
      metropolisGroup.add(parapet);

      if (sc.h > 16) {
        const crownMesh = new THREE.Mesh(
          new THREE.BoxGeometry(sc.w * 0.65, 1.0, sc.d * 0.65),
          new THREE.MeshBasicMaterial({ color: idx % 3 === 0 ? 0x38bdf8 : 0xf59e0b })
        );
        crownMesh.position.set(sc.x, sc.h - 1.8, sc.z);
        metropolisGroup.add(crownMesh);

        const mastBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), beaconMat);
        mastBeacon.position.set(sc.x, sc.h - 1.1, sc.z);
        metropolisGroup.add(mastBeacon);
      }
    });

    // -------------------------------------------------------------------------
    // SUBTERRANEAN ILLUMINATED CITY GRID (Directly visible beneath the glass floor)
    // -------------------------------------------------------------------------
    const groundGridGroup = new THREE.Group();
    groundGridGroup.position.set(0, -6.5, 0);

    // Subterranean urban asphalt base in rich slate tone
    const groundBase = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 })
    );
    groundBase.rotation.x = -Math.PI / 2;
    groundGridGroup.add(groundBase);

    // Glowing city avenue street grids running below
    const streetLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const streetCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // North-South Urban Boulevards visible through the glass floor
    [-12, -6, 0, 6, 12].forEach((streetX) => {
      const avenue = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 70), streetLightMat);
      avenue.rotation.x = -Math.PI / 2;
      avenue.position.set(streetX, 0.02, 0);
      groundGridGroup.add(avenue);
    });

    // East-West Cross Streets
    [-15, -7.5, 0, 7.5, 15].forEach((streetZ) => {
      const avenue = new THREE.Mesh(new THREE.PlaneGeometry(70, 0.25), streetCyanMat);
      avenue.rotation.x = -Math.PI / 2;
      avenue.position.set(0, 0.02, streetZ);
      groundGridGroup.add(avenue);
    });

    // Low-Rise Illuminated Urban City Blocks below
    for (let bx = -15; bx <= 15; bx += 5.5) {
      for (let bz = -15; bz <= 15; bz += 6.5) {
        if (Math.abs(bx) < 2.5 && Math.abs(bz) < 2.5) continue;
        const bHeight = 1.2 + ((Math.abs(bx * 7 + bz * 13) % 10) / 10) * 2.8;
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(3.6, bHeight, 4.4),
          bldMatDark
        );
        block.position.set(bx, bHeight / 2, bz);
        groundGridGroup.add(block);

        // Rooftop light dot
        const roofLight = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.04, 0.4),
          (bx + bz) % 2 === 0 ? streetLightMat : streetCyanMat
        );
        roofLight.position.set(bx, bHeight + 0.02, bz);
        groundGridGroup.add(roofLight);
      }
    }

    metropolisGroup.add(groundGridGroup);

    // 7. Metropolis Ground Canyon Elevated Highway & Moving Traffic Light Streams
    const highwayGroup = new THREE.Group();
    highwayGroup.position.set(0, -2.6, -12.0);

    // Highway Flyover Roadbed with Realistic Parapets
    const flyover = new THREE.Mesh(
      new THREE.BoxGeometry(45, 0.25, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x080f1e, roughness: 0.8, metalness: 0.3 })
    );
    highwayGroup.add(flyover);

    // Highway Guardrails
    [-1.15, 1.15].forEach((railZ) => {
      const guardRail = new THREE.Mesh(new THREE.BoxGeometry(45, 0.3, 0.08), bldMatDark);
      guardRail.position.set(0, 0.25, railZ);
      highwayGroup.add(guardRail);
    });

    // Golden Headlight Stream (Traffic flowing right-to-left)
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const headlightMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.08), headlightMat);
    headlightMesh.position.set(2, 0.18, 0.45);
    highwayGroup.add(headlightMesh);
    trafficMeshRef.current.push(headlightMesh);

    // Ruby Taillight Stream (Traffic flowing left-to-right)
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.08), taillightMat);
    taillightMesh.position.set(-6, 0.18, -0.45);
    highwayGroup.add(taillightMesh);
    trafficMeshRef.current.push(taillightMesh);

    // Parallel expressway lower deck
    const lowerHeadlight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.08), headlightMat);
    lowerHeadlight.position.set(12, -0.6, 0.25);
    highwayGroup.add(lowerHeadlight);
    trafficMeshRef.current.push(lowerHeadlight);

    const lowerTaillight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.08), taillightMat);
    lowerTaillight.position.set(-14, -0.6, -0.25);
    highwayGroup.add(lowerTaillight);
    trafficMeshRef.current.push(lowerTaillight);

    metropolisGroup.add(highwayGroup);

    // 8. 360-Degree Seamless Panoramic Night Sky Dome with Realistic Celestial Stars
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext('2d')!;

    // Rich atmospheric night sky gradient
    const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0.0, '#010409'); // Zenith deep space midnight
    skyGrad.addColorStop(0.45, '#040b19'); // Mid sky navy
    skyGrad.addColorStop(0.75, '#091830'); // Atmospheric haze
    skyGrad.addColorStop(1.0, '#132644'); // City horizon light glow
    skyCtx.fillStyle = skyGrad;
    skyCtx.fillRect(0, 0, 1024, 512);

    // 350 twinkling celestial stars scattered across the full 360-degree cosmos
    for (let st = 0; st < 350; st++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 360;
      const sr = Math.random() * 1.3 + 0.3;
      const sa = Math.random() * 0.75 + 0.25;
      skyCtx.fillStyle = `rgba(255, 255, 255, ${sa})`;
      skyCtx.beginPath();
      skyCtx.arc(sx, sy, sr, 0, Math.PI * 2);
      skyCtx.fill();
    }

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    skyTex.generateMipmaps = true;
    skyTex.minFilter = THREE.LinearMipmapLinearFilter;
    skyTex.magFilter = THREE.LinearFilter;
    skyTex.anisotropy = maxAnisotropy;

    // 360-degree celestial sky sphere enclosing the entire universe
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(72, 32, 24),
      new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    skyDome.position.set(0, 8, 0);
    metropolisGroup.add(skyDome);

    viewGroup.add(metropolisGroup);
    roomGroup.add(viewGroup);
    scene.add(roomGroup);

    // =========================================================================
    // LAYER 3: HIGH-PRECISION WORKSTATION DESK, MACBOOK PRO & DUAL MONITORS
    // =========================================================================
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0.0, 0, 0.4);

    // Desk Surface (Executive Solid Dark American Walnut / Matte Composite with Chamfered Edges)
    const deskMat = new THREE.MeshPhysicalMaterial({
      color: 0x241a13, // Rich warm walnut tone
      map: woodGrainTex,
      roughness: 0.22, // Smooth satin feel
      metalness: 0.04, // Real organic wood desktop surface
      clearcoat: 0.58, // Luxurious hand-rubbed furniture lacquer
      clearcoatRoughness: 0.16,
      reflectivity: 0.6,
    });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.065, 0.96), deskMat);
    deskTop.position.set(0, 0.75, -0.10);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Ergonomic Chamfer Bevel Strips on Front, Left and Right (Rounded tactile corners)
    const bevelMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      map: woodGrainTex,
      metalness: 0.15,
      roughness: 0.28,
    });
    const deskFrontBevel = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.02, 0.03),
      bevelMat
    );
    deskFrontBevel.position.set(0, 0.77, 0.37);
    deskGroup.add(deskFrontBevel);

    // Left and Right Chamfered End Caps
    const deskLeftBevel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.96), bevelMat);
    deskLeftBevel.position.set(-1.79, 0.77, -0.10);
    deskGroup.add(deskLeftBevel);

    const deskRightBevel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.96), bevelMat);
    deskRightBevel.position.set(1.79, 0.77, -0.10);
    deskGroup.add(deskRightBevel);

    // Desk LED Edge Chamfer (Cyan subtle ambient glow line along perimeter)
    const deskEdge = new THREE.Mesh(
      new THREE.BoxGeometry(3.62, 0.01, 0.98),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.1,
      })
    );
    deskEdge.position.set(0, 0.74, -0.10);
    deskGroup.add(deskEdge);

    // Structural Under-Desk Steel C-Channels & Crossbar (Brushed Spacecraft Titanium)
    const steelLegMat = new THREE.MeshStandardMaterial({ color: 0x384556, metalness: 0.94, roughness: 0.18 });
    const beamF = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.04, 0.05), steelLegMat);
    beamF.position.set(0, 0.70, 0.28);
    deskGroup.add(beamF);

    const beamB = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.04, 0.05), steelLegMat);
    beamB.position.set(0, 0.70, -0.48);
    deskGroup.add(beamB);

    // Brushed Aluminum Circular Cable Grommet at Rear Center
    const grommetRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.015, 24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 })
    );
    grommetRing.position.set(0, 0.783, -0.32);
    deskGroup.add(grommetRing);

    const grommetBrush = new THREE.Mesh(
      new THREE.CircleGeometry(0.038, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    grommetBrush.position.set(0, 0.785, -0.32);
    grommetBrush.rotation.x = -Math.PI / 2;
    deskGroup.add(grommetBrush);

    // Heavy Chamfered Steel Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.76), steelLegMat);
    legL.position.set(-1.65, 0.38, -0.10);
    // legL.castShadow = true; (optimized out)
    deskGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.76), steelLegMat);
    legR.position.set(1.65, 0.38, -0.10);
    // legR.castShadow = true; (optimized out)
    deskGroup.add(legR);

    // Heavy-Duty T-Style Cast Aluminum Feet with Leveling Pads on Floor
    [-1.65, 1.65].forEach((lx) => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.86), steelLegMat);
      foot.position.set(lx, 0.018, -0.10);
      // foot.castShadow = true; (optimized out)
      deskGroup.add(foot);

      // Dual Knurled Floor Glides
      [-0.36, 0.36].forEach((fz) => {
        const glide = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
        );
        glide.position.set(lx, 0.008, -0.10 + fz);
        deskGroup.add(glide);
      });
    });

    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 0.04), steelLegMat);
    crossBar.position.set(0, 0.35, -0.22);
    deskGroup.add(crossBar);

    // =========================================================================
    // UNDER-DESK FEATURE LAYER: ARCHITECTURAL LIGHTING, NVIDIA GPU BOX,
    // REMOTE CONTROL HIGH-SPEED CAR, AND REMOTE CONTROL MICRO HELICOPTER
    // =========================================================================

    // 1. Under-Desk Architectural LED Light Bar (Washes downward with crisp, uniform light)
    const underDeskLightBar = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.015, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.2,
      })
    );
    underDeskLightBar.position.set(0, 0.71, 0.02);
    deskGroup.add(underDeskLightBar);

    // Dedicated Under-Desk Uniform Downlights
    const underDeskLightCenter = new THREE.PointLight(0xf0fdf4, 2.8, 3.2, 1.4);
    underDeskLightCenter.position.set(0, 0.68, 0.05);
    deskGroup.add(underDeskLightCenter);

    const underDeskLightLeft = new THREE.PointLight(0x76b900, 2.0, 2.6, 1.6); // NVIDIA Green Glow
    underDeskLightLeft.position.set(-0.85, 0.45, 0.05);
    deskGroup.add(underDeskLightLeft);

    const underDeskLightRight = new THREE.PointLight(0x38bdf8, 2.0, 2.6, 1.6); // Cyan RC Spotlight
    underDeskLightRight.position.set(0.65, 0.45, 0.05);
    deskGroup.add(underDeskLightRight);

    // Cable Management Raceway (J-channel along crossbar)
    const raceway = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.06, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    );
    raceway.position.set(0, 0.38, -0.22);
    deskGroup.add(raceway);

    // -------------------------------------------------------------------------
    // 2. SMALL NVIDIA COLLECTOR'S RETAIL BOX CONTAINING DUAL GPUS
    // -------------------------------------------------------------------------
    const nvidiaBoxGroup = new THREE.Group();
    nvidiaBoxGroup.position.set(-0.90, 0.01, 0.22);
    nvidiaBoxGroup.rotation.y = 0.18; // Angled invitingly toward camera

    // Dynamic High-Res NVIDIA Box Canvas Texture
    const nvdCanvas = document.createElement('canvas');
    nvdCanvas.width = 512;
    nvdCanvas.height = 256;
    const nvdCtx = nvdCanvas.getContext('2d')!;
    nvdCtx.fillStyle = '#0b0f19';
    nvdCtx.fillRect(0, 0, 512, 256);
    
    // NVIDIA Signature Diagonal Green Slash Pattern
    nvdCtx.fillStyle = '#76b900';
    nvdCtx.beginPath();
    nvdCtx.moveTo(0, 0);
    nvdCtx.lineTo(90, 0);
    nvdCtx.lineTo(24, 256);
    nvdCtx.lineTo(0, 256);
    nvdCtx.fill();

    // Geometric micro-grid lines
    nvdCtx.strokeStyle = 'rgba(118, 185, 0, 0.25)';
    nvdCtx.lineWidth = 1;
    for (let gx = 100; gx < 512; gx += 28) {
      nvdCtx.beginPath();
      nvdCtx.moveTo(gx, 0);
      nvdCtx.lineTo(gx - 40, 256);
      nvdCtx.stroke();
    }

    // NVIDIA Eye / Claw Logo
    nvdCtx.fillStyle = '#76b900';
    nvdCtx.beginPath();
    nvdCtx.arc(140, 68, 26, 0, Math.PI * 2);
    nvdCtx.fill();
    nvdCtx.fillStyle = '#0b0f19';
    nvdCtx.beginPath();
    nvdCtx.arc(140, 68, 16, 0, Math.PI * 2);
    nvdCtx.fill();
    nvdCtx.fillStyle = '#76b900';
    nvdCtx.beginPath();
    nvdCtx.arc(148, 68, 10, 0, Math.PI * 2);
    nvdCtx.fill();

    // Typography
    nvdCtx.fillStyle = '#ffffff';
    nvdCtx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    nvdCtx.fillText('GEFORCE RTX', 185, 78);

    nvdCtx.fillStyle = '#76b900';
    nvdCtx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    nvdCtx.fillText('4090 / 5090 FOUNDERS EDITION', 140, 118);

    nvdCtx.fillStyle = '#cbd5e1';
    nvdCtx.font = '13px monospace';
    nvdCtx.fillText('24GB GDDR6X • DUAL-AXIAL FLOW-THROUGH', 140, 148);
    nvdCtx.fillText('ADA LOVELACE / BLACKWELL • DLSS 3.5 • RAY TRACING', 140, 172);

    // Holographic Authenticity Seal badge
    nvdCtx.strokeStyle = '#f59e0b';
    nvdCtx.lineWidth = 2;
    nvdCtx.strokeRect(390, 185, 96, 45);
    nvdCtx.fillStyle = '#f59e0b';
    nvdCtx.font = 'bold 11px monospace';
    nvdCtx.fillText('OFFICIAL', 412, 204);
    nvdCtx.fillText('AUTHENTIC', 404, 220);

    const nvdTex = new THREE.CanvasTexture(nvdCanvas);
    nvdTex.colorSpace = THREE.SRGBColorSpace;
    nvdTex.generateMipmaps = true;
    nvdTex.minFilter = THREE.LinearMipmapLinearFilter;
    nvdTex.magFilter = THREE.LinearFilter;
    nvdTex.anisotropy = maxAnisotropy;

    // Outer NVIDIA Slate Titanium Collector Box
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x182438,
      roughness: 0.28,
      metalness: 0.5,
    });
    const boxOuter = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.34), boxMat);
    boxOuter.position.set(0, 0.07, 0);
    // boxOuter.castShadow = true; (optimized out)
    boxOuter.receiveShadow = true;
    nvidiaBoxGroup.add(boxOuter);

    // Front Graphic Panel with NVIDIA GeForce RTX branding
    const frontPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.12),
      new THREE.MeshBasicMaterial({ map: nvdTex, toneMapped: false })
    );
    frontPanel.position.set(0, 0.07, 0.171);
    nvidiaBoxGroup.add(frontPanel);

    // Propped Open Showcase Lid showing inner artwork
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.5,
    });
    const boxLid = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.015, 0.34), lidMat);
    boxLid.position.set(0, 0.22, -0.12);
    boxLid.rotation.x = -0.55; // Angled back open
    // boxLid.castShadow = true; (optimized out)
    nvidiaBoxGroup.add(boxLid);

    const lidGraphic = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.32),
      new THREE.MeshBasicMaterial({ map: nvdTex, toneMapped: false })
    );
    lidGraphic.position.set(0, 0.22, -0.11);
    lidGraphic.rotation.x = -0.55;
    nvidiaBoxGroup.add(lidGraphic);

    // High-Density Charcoal EVA Foam Insert Tray
    const foamMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
    const foamTray = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.32), foamMat);
    foamTray.position.set(0, 0.11, 0);
    nvidiaBoxGroup.add(foamTray);

    // GPU 1: NVIDIA FOUNDERS EDITION RTX CARD (Inside Box Left Slot)
    const gpu1Group = new THREE.Group();
    gpu1Group.position.set(-0.11, 0.135, 0.0);

    // Titanium Hourglass Outer Shroud
    const gpuFrameMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Titanium Gunmetal
      metalness: 0.94,
      roughness: 0.20,
    });
    const gpuChamferMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Diamond-cut silver chamfer
      metalness: 0.98,
      roughness: 0.12,
    });
    const gpuShroud = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.045, 0.26), gpuFrameMat);
    gpu1Group.add(gpuShroud);

    // Silver Beveled Perimeter Trim
    const gpuTrim = new THREE.Mesh(new THREE.BoxGeometry(0.195, 0.048, 0.012), gpuChamferMat);
    gpuTrim.position.set(0, 0, 0.125);
    gpu1Group.add(gpuTrim);

    // Dual Axial Flow-Through Fans
    [-0.06, 0.06].forEach((fz) => {
      // Outer Fan Ring
      const fanRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.045, 0.005, 12, 32),
        gpuChamferMat
      );
      fanRing.rotation.x = Math.PI / 2;
      fanRing.position.set(0, 0.024, fz);
      gpu1Group.add(fanRing);

      // Center Chrome Hub
      const fanHub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.008, 16),
        gpuChamferMat
      );
      fanHub.position.set(0, 0.024, fz);
      gpu1Group.add(fanHub);

      // 9 Curved Fan Blades
      for (let b = 0; b < 9; b++) {
        const bladeAngle = (b / 9) * Math.PI * 2;
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.003, 0.002, 0.028),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
        );
        blade.position.set(Math.cos(bladeAngle) * 0.026, 0.022, fz + Math.sin(bladeAngle) * 0.026);
        blade.rotation.y = bladeAngle + 0.35;
        gpu1Group.add(blade);
      }
    });

    // Glowing Green "GEFORCE RTX" Side Logo
    const gpuLogo = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.018, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x76b900 })
    );
    gpuLogo.position.set(-0.096, 0.005, 0);
    gpu1Group.add(gpuLogo);

    // Gold-plated PCIe 5.0 Connector Fingers with black rubber protector
    const pcieConnector = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.016, 0.11),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.98, roughness: 0.1 })
    );
    pcieConnector.position.set(0.096, -0.018, 0.02);
    gpu1Group.add(pcieConnector);

    nvidiaBoxGroup.add(gpu1Group);

    // GPU 2: SECOND WORKSTATION ACCELERATOR GPU (Inside Box Right Slot)
    const gpu2Group = new THREE.Group();
    gpu2Group.position.set(0.12, 0.135, 0.0);

    const gpu2Mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.25 });
    const gpu2Shroud = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.042, 0.25), gpu2Mat);
    gpu2Group.add(gpu2Shroud);

    // Blower Intake Fan Hub
    const blowerFan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.006, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    blowerFan.position.set(0, 0.022, 0.05);
    gpu2Group.add(blowerFan);

    const blowerCenter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.008, 16),
      gpuChamferMat
    );
    blowerCenter.position.set(0, 0.023, 0.05);
    gpu2Group.add(blowerCenter);

    // Silver Rear I/O Bracket
    const ioBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.185, 0.046, 0.004),
      gpuChamferMat
    );
    ioBracket.position.set(0, 0, -0.126);
    gpu2Group.add(ioBracket);

    // Cyan illuminated logo line
    const gpu2Led = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.014, 0.10),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    gpu2Led.position.set(0.091, 0.004, -0.02);
    gpu2Group.add(gpu2Led);

    nvidiaBoxGroup.add(gpu2Group);

    // Braided 16-Pin 12VHPWR Sleeved Cable coiled in accessory slot
    const gpuCableMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const coiledCable = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 10, 24), gpuCableMat);
    coiledCable.position.set(0.0, 0.125, -0.10);
    coiledCable.rotation.x = Math.PI / 2;
    nvidiaBoxGroup.add(coiledCable);

    deskGroup.add(nvidiaBoxGroup);

    // -------------------------------------------------------------------------
    // 3. REMOTE CONTROL (RC) MICRO HELICOPTER ON LANDING HELIPAD
    // -------------------------------------------------------------------------
    const heliGroup = new THREE.Group();
    heliGroup.position.set(-0.35, 0.008, -0.05);
    heliGroup.rotation.y = 0.24;

    // High-Tech Carbon Helipad Disc on Floor
    const helipadDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.004, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.2 })
    );
    helipadDisc.position.set(0, 0.002, 0);
    helipadDisc.receiveShadow = true;
    heliGroup.add(helipadDisc);

    // Helipad Glowing Cyan Outer Perimeter Ring
    const helipadRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.003, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
    );
    helipadRing.rotation.x = Math.PI / 2;
    helipadRing.position.set(0, 0.005, 0);
    heliGroup.add(helipadRing);

    // Helipad Bold White "H" Landing Graphic
    const hBarL = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.002, 0.14), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
    hBarL.position.set(-0.045, 0.005, 0);
    heliGroup.add(hBarL);

    const hBarR = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.002, 0.14), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
    hBarR.position.set(0.045, 0.005, 0);
    heliGroup.add(hBarR);

    const hBarC = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.002, 0.014), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
    hBarC.position.set(0, 0.005, 0);
    heliGroup.add(hBarC);

    // Helicopter Chassis & Aerodynamic Canopy
    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc, // Pearl White Gloss
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const canopyLimeMat = new THREE.MeshPhysicalMaterial({
      color: 0x22c55e, // Electric Lime Green Accent
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.8,
    });
    const windshieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a, // Tinted Smoke Acrylic
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.92,
    });

    // Main Fuselage Pod
    const heliFuselage = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), canopyMat);
    heliFuselage.scale.set(0.75, 0.9, 1.8);
    heliFuselage.position.set(0, 0.11, 0.04);
    // heliFuselage.castShadow = true; (optimized out)
    heliGroup.add(heliFuselage);

    // Lime Green Lower Body Chevron
    const limeStripe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.18), canopyLimeMat);
    limeStripe.position.set(0, 0.075, 0.04);
    heliGroup.add(limeStripe);

    // Cockpit Curved Windshield
    const windshield = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), windshieldMat);
    windshield.scale.set(0.72, 0.82, 1.2);
    windshield.position.set(0, 0.125, 0.11);
    heliGroup.add(windshield);

    // Aluminum Landing Skids
    const skidMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    [-0.07, 0.07].forEach((skidX) => {
      // Tubular skid runner
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.26, 12), skidMat);
      skid.rotation.x = Math.PI / 2;
      skid.position.set(skidX, 0.012, 0.02);
      // skid.castShadow = true; (optimized out)
      heliGroup.add(skid);

      // Curved skid front tip
      const skidTip = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 8, 12, Math.PI / 2), skidMat);
      skidTip.rotation.y = skidX > 0 ? Math.PI : 0;
      skidTip.position.set(skidX, 0.025, 0.15);
      heliGroup.add(skidTip);

      // Support Strut Legs (Forward & Aft)
      [-0.05, 0.07].forEach((strutZ) => {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 8), skidMat);
        strut.position.set(skidX * 0.72, 0.052, strutZ);
        strut.rotation.z = skidX > 0 ? 0.35 : -0.35;
        heliGroup.add(strut);
      });
    });

    // CNC Red-Anodized Main Rotor Mast & Swashplate
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.95, roughness: 0.15 });
    const rotorMast = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 12), mastMat);
    rotorMast.position.set(0, 0.18, 0.01);
    heliGroup.add(rotorMast);

    const swashplate = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 16), mastMat);
    swashplate.position.set(0, 0.17, 0.01);
    heliGroup.add(swashplate);

    // ROTATING MAIN ROTOR ASSEMBLY (Connected to live animation ref!)
    const rotorAssembly = new THREE.Group();
    rotorAssembly.position.set(0, 0.22, 0.01);

    // CNC Rotor Head Hub
    const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.016, 16), mastMat);
    rotorAssembly.add(rotorHub);

    // Flybar with aerodynamic paddles
    const flybar = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 8), skidMat);
    flybar.rotation.z = Math.PI / 2;
    flybar.position.set(0, 0.016, 0);
    rotorAssembly.add(flybar);

    [-0.09, 0.09].forEach((px) => {
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.003, 0.016), canopyLimeMat);
      paddle.position.set(px, 0.016, 0);
      rotorAssembly.add(paddle);
    });

    // Dual High-Performance Carbon-Fiber Rotor Blades (Span: 0.44m)
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.4 });
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // High-vis yellow tips

    [-1, 1].forEach((dir) => {
      const bladeG = new THREE.Group();
      bladeG.rotation.y = dir === 1 ? 0 : Math.PI;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.003, 0.032), bladeMat);
      blade.position.set(0.11, 0.004, 0);
      bladeG.add(blade);

      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0035, 0.032), tipMat);
      tip.position.set(0.21, 0.004, 0);
      bladeG.add(tip);

      rotorAssembly.add(bladeG);
    });

    heliGroup.add(rotorAssembly);
    helicopterRotorRef.current = rotorAssembly; // Connected for smooth rotor spin!

    // Carbon-Fiber Tail Boom
    const boomMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.32, 12), boomMat);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 0.115, -0.18);
    heliGroup.add(tailBoom);

    // Horizontal Stabilizer Wing
    const horizWing = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.003, 0.024), canopyLimeMat);
    horizWing.position.set(0, 0.118, -0.25);
    heliGroup.add(horizWing);

    // Vertical Tail Fin with Safety Stripes
    const vertFin = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.075, 0.045), canopyMat);
    vertFin.position.set(0, 0.138, -0.34);
    heliGroup.add(vertFin);

    const stripeFin = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.02, 0.045), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    stripeFin.position.set(0, 0.155, -0.34);
    heliGroup.add(stripeFin);

    // High-Speed Tail Rotor with Protective Guard Ring
    const tailGuard = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.003, 8, 16), canopyLimeMat);
    tailGuard.rotation.y = Math.PI / 2;
    tailGuard.position.set(0.014, 0.138, -0.34);
    heliGroup.add(tailGuard);

    const tailBlade = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.048, 0.008), tipMat);
    tailBlade.position.set(0.014, 0.138, -0.34);
    tailBlade.rotation.x = Math.PI / 4;
    heliGroup.add(tailBlade);

    // Starboard / Port Navigation Strobe LEDs
    const greenBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    greenBeacon.position.set(0.07, 0.014, 0.14);
    heliGroup.add(greenBeacon);

    const redBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    redBeacon.position.set(-0.07, 0.014, 0.14);
    heliGroup.add(redBeacon);

    deskGroup.add(heliGroup);

    // -------------------------------------------------------------------------
    // 4. REMOTE CONTROL (RC) HIGH-SPEED OFF-ROAD BUGGY CAR & TRANSMITTER
    // -------------------------------------------------------------------------
    const rcCarGroup = new THREE.Group();
    rcCarGroup.position.set(0.68, 0.01, -0.05);
    rcCarGroup.rotation.y = -0.32; // Aggressive 3/4 sports stance

    // Lower Carbon Tub Chassis & Aluminum Skid Plate
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 });
    const rcChassis = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.36), chassisMat);
    rcChassis.position.set(0, 0.055, 0);
    // rcChassis.castShadow = true; (optimized out)
    rcCarGroup.add(rcChassis);

    // Heavy-Duty Front Nylon Bumper with Silver Skid Plate
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.03), bumperMat);
    frontBumper.position.set(0, 0.048, 0.20);
    rcCarGroup.add(frontBumper);

    // Dual Miniature LED Fog/Headlights (High Brightness)
    [-0.045, 0.045].forEach((hx) => {
      const headlight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.010, 0.014, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      headlight.rotation.x = Math.PI / 2;
      headlight.position.set(hx, 0.065, 0.20);
      rcCarGroup.add(headlight);
    });

    // Aerodynamic Polycarbonate Racing Body in Electric Cyan & Tangerine
    const bodyCyanMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Vibrant Electric Cyan
      metalness: 0.25,
      roughness: 0.15,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
    });
    const bodyOrangeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316, // Sunset Orange Accent
      metalness: 0.25,
      roughness: 0.15,
      clearcoat: 0.95,
    });

    // Sculpted Main Buggy Body Shell
    const buggyShell = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.055, 0.28), bodyCyanMat);
    buggyShell.position.set(0, 0.09, -0.01);
    // buggyShell.castShadow = true; (optimized out)
    rcCarGroup.add(buggyShell);

    // Sleek Cabin Cockpit & Roof Air Scoop
    const cabinRoof = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.06, 4), bodyOrangeMat);
    cabinRoof.rotation.y = Math.PI / 4;
    cabinRoof.position.set(0, 0.14, 0.01);
    rcCarGroup.add(cabinRoof);

    // Windshield (Smoked Acrylic)
    const carWindshield = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
    );
    carWindshield.position.set(0, 0.13, 0.055);
    carWindshield.rotation.x = -0.65;
    rcCarGroup.add(carWindshield);

    // Racing Number Decal (#07) on hood
    const numCanvas = document.createElement('canvas');
    numCanvas.width = 128;
    numCanvas.height = 128;
    const numCtx = numCanvas.getContext('2d')!;
    numCtx.fillStyle = '#f97316';
    numCtx.fillRect(0, 0, 128, 128);
    numCtx.fillStyle = '#ffffff';
    numCtx.font = 'bold 80px sans-serif';
    numCtx.textAlign = 'center';
    numCtx.textBaseline = 'middle';
    numCtx.fillText('07', 64, 64);
    const numTex = new THREE.CanvasTexture(numCanvas);
    numTex.colorSpace = THREE.SRGBColorSpace;
    numTex.generateMipmaps = true;
    numTex.minFilter = THREE.LinearMipmapLinearFilter;
    numTex.magFilter = THREE.LinearFilter;
    numTex.anisotropy = maxAnisotropy;

    const raceNumMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, 0.07),
      new THREE.MeshBasicMaterial({ map: numTex, toneMapped: false })
    );
    raceNumMesh.position.set(0, 0.12, 0.11);
    raceNumMesh.rotation.x = -Math.PI / 2.8;
    rcCarGroup.add(raceNumMesh);

    // High-Downforce Dual-Element Rear GT Racing Wing
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.6 });
    const wingUpper = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.008, 0.065), wingMat);
    wingUpper.position.set(0, 0.165, -0.165);
    wingUpper.rotation.x = 0.18;
    rcCarGroup.add(wingUpper);

    // Wing Endplates
    [-0.10, 0.10].forEach((wx) => {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.038, 0.075), bodyOrangeMat);
      endplate.position.set(wx, 0.165, -0.165);
      rcCarGroup.add(endplate);
    });

    // Aluminum Wing Uprights
    [-0.055, 0.055].forEach((sx) => {
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.065, 0.015), bumperMat);
      upright.position.set(sx, 0.13, -0.16);
      upright.rotation.x = -0.22;
      rcCarGroup.add(upright);
    });

    // Visible Coilover Oil Shock Absorbers with Metallic Red Springs
    const springMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.95, roughness: 0.12 });
    const shockBodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });

    [
      { x: -0.09, z: 0.11, angle: -0.35 },
      { x: 0.09, z: 0.11, angle: 0.35 },
      { x: -0.09, z: -0.11, angle: -0.35 },
      { x: 0.09, z: -0.11, angle: 0.35 },
    ].forEach((sh) => {
      const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8), shockBodyMat);
      shock.position.set(sh.x, 0.082, sh.z);
      shock.rotation.z = sh.angle;
      rcCarGroup.add(shock);

      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.038, 10, 1, true), springMat);
      spring.position.set(sh.x, 0.082, sh.z);
      spring.rotation.z = sh.angle;
      rcCarGroup.add(spring);
    });

    // 4 Deep-Tread Knobby Rubber Monster Off-Road Tires
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Matte Deep Rubber Black
      roughness: 0.92,
      metalness: 0.05,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Anodized Cyan Beadlock
      metalness: 0.92,
      roughness: 0.18,
    });
    const nutMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Gold Center Hex Nut
      metalness: 0.98,
      roughness: 0.10,
    });

    [
      { x: -0.135, z: 0.11 },
      { x: 0.135, z: 0.11 },
      { x: -0.135, z: -0.11 },
      { x: 0.135, z: -0.11 },
    ].forEach((wheel) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wheel.x, 0.052, wheel.z);

      // Deep Tread Rubber Tire
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.042, 24), tireMat);
      tire.rotation.z = Math.PI / 2;
      // tire.castShadow = true; (optimized out)
      wheelGroup.add(tire);

      // Tire Knobby Treads (Raised lugs)
      for (let t = 0; t < 12; t++) {
        const treadAngle = (t / 12) * Math.PI * 2;
        const lug = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.006, 0.012), tireMat);
        lug.position.set(0, Math.cos(treadAngle) * 0.052, Math.sin(treadAngle) * 0.052);
        lug.rotation.x = -treadAngle;
        wheelGroup.add(lug);
      }

      // Anodized Beadlock 5-Spoke Rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.044, 16), rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Gold Anodized Hex Center Wheel Nut
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.048, 6), nutMat);
      nut.rotation.z = Math.PI / 2;
      wheelGroup.add(nut);

      rcCarGroup.add(wheelGroup);
    });

    // Flexible 2.4GHz Receiver Whip Antenna with Orange Racing Pennant
    const carAntennaStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.003, 0.22, 6),
      bumperMat
    );
    carAntennaStem.position.set(0.06, 0.21, -0.06);
    carAntennaStem.rotation.z = -0.12;
    rcCarGroup.add(carAntennaStem);

    const pennantGeo = new THREE.BufferGeometry();
    const pennantVertices = new Float32Array([
      0, 0, 0,
      -0.045, -0.015, 0,
      0, -0.030, 0,
    ]);
    pennantGeo.setAttribute('position', new THREE.BufferAttribute(pennantVertices, 3));
    pennantGeo.computeVertexNormals();
    const pennant = new THREE.Mesh(
      pennantGeo,
      new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide })
    );
    pennant.position.set(0.05, 0.31, -0.06);
    rcCarGroup.add(pennant);

    deskGroup.add(rcCarGroup);

    // -------------------------------------------------------------------------
    // 5. 2.4GHz PISTOL-GRIP RC TRANSMITTER (REMOTE CONTROLLER)
    // -------------------------------------------------------------------------
    const txGroup = new THREE.Group();
    txGroup.position.set(0.98, 0.01, 0.08);
    txGroup.rotation.y = -0.25;

    const txMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.3 });
    const txGripMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 });

    // Transmitter Base Foot
    const txBase = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.024, 0.09), txMat);
    txBase.position.set(0, 0.012, 0);
    // txBase.castShadow = true; (optimized out)
    txGroup.add(txBase);

    // Ergonomic Handle Grip
    const txHandle = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.14, 0.048), txGripMat);
    txHandle.position.set(0, 0.09, -0.01);
    txHandle.rotation.x = -0.15;
    txGroup.add(txHandle);

    // Upper Head & Screen Housing
    const txHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.055, 0.08), txMat);
    txHead.position.set(0, 0.17, 0.01);
    txGroup.add(txHead);

    // Index Trigger (Throttle / Brake)
    const trigger = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.028, 8), bumperMat);
    trigger.position.set(0, 0.11, 0.025);
    trigger.rotation.x = 0.45;
    txGroup.add(trigger);

    // Steering Wheel with Foam Rim and Mini Drilled Brake Disc
    const steerDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.004, 16), bumperMat);
    steerDisc.rotation.z = Math.PI / 2;
    steerDisc.position.set(0.036, 0.165, 0.02);
    txGroup.add(steerDisc);

    const steerRim = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 8, 20), txGripMat);
    steerRim.rotation.y = Math.PI / 2;
    steerRim.position.set(0.042, 0.165, 0.02);
    txGroup.add(steerRim);

    // Rubber Ducky Top Antenna
    const txAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.005, 0.09, 8), txMat);
    txAntenna.position.set(0, 0.23, -0.015);
    txGroup.add(txAntenna);

    // Green Power LED
    const txLed = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    txLed.position.set(0, 0.20, 0.03);
    txGroup.add(txLed);

    deskGroup.add(txGroup);

    // --- Dynamic High-Resolution Canvas Textures for All Screens (Monitors + Dedicated Laptop) ---
    // Center Ultrawide OLED (1536 x 700 @ 21:9 aspect ratio)
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 1536;
    cCanvas.height = 700;
    const centerCtx = cCanvas.getContext('2d', { alpha: false })!;
    const centerTex = new THREE.CanvasTexture(cCanvas);

    // Left Portrait Monitor (768 x 1210 @ ~0.634 aspect ratio)
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 768;
    lCanvas.height = 1210;
    const leftCtx = lCanvas.getContext('2d', { alpha: false })!;
    const leftTex = new THREE.CanvasTexture(lCanvas);

    // Right Vertical Extra Monitor (768 x 1210 @ ~0.634 aspect ratio)
    const rMonCanvas = document.createElement('canvas');
    rMonCanvas.width = 768;
    rMonCanvas.height = 1210;
    const rightMonCtx = rMonCanvas.getContext('2d', { alpha: false })!;
    const rightMonTex = new THREE.CanvasTexture(rMonCanvas);

    // Right PC AIO Liquid Cooler Pump LCD (512 x 512 true 1:1 circular ratio)
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 512;
    rCanvas.height = 512;
    const rightCtx = rCanvas.getContext('2d', { alpha: false })!;
    const rightTex = new THREE.CanvasTexture(rCanvas);

    // Dedicated MacBook Pro Liquid Retina Display (1024 x 640 @ 16:10 aspect ratio)
    const lapCanvas = document.createElement('canvas');
    lapCanvas.width = 1024;
    lapCanvas.height = 640;
    const laptopCtx = lapCanvas.getContext('2d', { alpha: false })!;
    const laptopTex = new THREE.CanvasTexture(lapCanvas);

    [centerTex, leftTex, rightMonTex, rightTex, laptopTex].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAnisotropy;
    });

    [centerCtx, leftCtx, rightMonCtx, rightCtx, laptopCtx].forEach((ctx) => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    });

    texturesRef.current = {
      centerTex,
      leftTex,
      rightMonTex,
      rightTex,
      laptopTex,
      centerCtx,
      leftCtx,
      rightMonCtx,
      rightCtx,
      laptopCtx,
    };

    // ===============================================
    // 1. DEDICATED OPEN APPLE MACBOOK PRO LAPTOP (PRECISION SHAPING)
    // ===============================================
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(-0.88, 0.785, 0.12);
    laptopGroup.rotation.y = 0.28; // Angled naturally toward developer

    const lapAluminumMat = new THREE.MeshStandardMaterial({
      color: 0x242d3d, // Authentic Space Gray CNC anodized unibody aluminum
      metalness: 0.94,
      roughness: 0.16,
    });
    const lapDarkMat = new THREE.MeshStandardMaterial({
      color: 0x182438,
      metalness: 0.85,
      roughness: 0.22,
    });

    // Laptop Bottom Chassis (Unibody CNC Chamfered)
    const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.26), lapAluminumMat);
    lapBase.castShadow = true;
    laptopGroup.add(lapBase);

    // Front Thumb Scoop Notch for opening display lid
    const lapFrontNotch = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.005, 0.006),
      new THREE.MeshStandardMaterial({ color: 0x223046, metalness: 0.9 })
    );
    lapFrontNotch.position.set(0, 0.005, 0.13);
    laptopGroup.add(lapFrontNotch);

    // Recessed Keyboard Well
    const lapKbWell = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.002, 0.13), lapDarkMat);
    lapKbWell.position.set(0, 0.006, -0.04);
    laptopGroup.add(lapKbWell);

    // Laser-Drilled Micro-Perforated Speaker Grills (Left & Right of Keyboard)
    [-0.174, 0.174].forEach((sx) => {
      const spkGrill = new THREE.Mesh(
        new THREE.PlaneGeometry(0.018, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x223046, roughness: 0.7 })
      );
      spkGrill.rotation.x = -Math.PI / 2;
      spkGrill.position.set(sx, 0.0065, -0.04);
      laptopGroup.add(spkGrill);
    });

    // Backlit Chiclet Key Matrix on Laptop
    for (let r = -2; r <= 2; r++) {
      for (let c = -6; c <= 6; c++) {
        if (r === 2 && Math.abs(c) < 3) continue; // Trackpad / spacebar
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(0.019, 0.003, 0.018),
          new THREE.MeshStandardMaterial({ color: 0x182438, roughness: 0.35, metalness: 0.4 })
        );
        key.position.set(c * 0.022, 0.008, -0.04 + r * 0.022);
        laptopGroup.add(key);
      }
    }

    // Laptop Glass Trackpad with Crisp Tactile Seam
    const lapTrackpad = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.002, 0.08),
      new THREE.MeshPhysicalMaterial({
        color: 0x1e2838,
        roughness: 0.08,
        metalness: 0.2,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
      })
    );
    lapTrackpad.position.set(0, 0.0065, 0.07);
    laptopGroup.add(lapTrackpad);

    // Laptop Screen Lid Assembly (Tilted back at ~108 degrees)
    const lapLidGroup = new THREE.Group();
    lapLidGroup.position.set(0, 0.006, -0.13); // Hinge line
    lapLidGroup.rotation.x = -0.28; // ~108 degrees open

    // Aluminum Cylindrical Display Hinge
    const lapHinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0x0e1726, metalness: 0.95, roughness: 0.1 })
    );
    lapHinge.rotation.z = Math.PI / 2;
    lapHinge.position.set(0, 0, 0);
    lapLidGroup.add(lapHinge);

    // Lid Aluminum Backplate
    const lapLidBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.007), lapAluminumMat);
    lapLidBack.position.set(0, 0.125, -0.0035);
    lapLidBack.castShadow = true;
    lapLidGroup.add(lapLidBack);

    // Glowing Apple Logo Silhouette on Back of Lid
    const appleGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.035, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    appleGlow.position.set(0, 0.125, -0.008);
    lapLidGroup.add(appleGlow);

    // Laptop Inner Screen Bezel
    const lapScreenBezel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.37, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x162134, roughness: 0.18, metalness: 0.85 })
    );
    lapScreenBezel.position.set(0, 0.125, 0.001);
    lapLidGroup.add(lapScreenBezel);

    // Top Center Camera Notch with Camera Lens Specular Dot
    const lapNotch = new THREE.Mesh(
      new THREE.PlaneGeometry(0.032, 0.008),
      new THREE.MeshBasicMaterial({ color: 0x111c2e })
    );
    lapNotch.position.set(0, 0.24, 0.002);
    lapLidGroup.add(lapNotch);

    const camLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.0018, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    camLens.position.set(0, 0.241, 0.0025);
    lapLidGroup.add(camLens);

    // Live High-Res Retina Laptop Screen Display (Crystal clear self-luminous)
    const lapScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.22),
      new THREE.MeshBasicMaterial({ map: laptopTex, toneMapped: false })
    );
    lapScreenMesh.position.set(0, 0.125, 0.002);
    lapLidGroup.add(lapScreenMesh);

    laptopGroup.add(lapLidGroup);

    // MagSafe 3 Braided Charging Cable & Magnetic Connector plugged into Left Side
    const magSafePlug = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.007, 0.016),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
    );
    magSafePlug.position.set(-0.194, 0.006, -0.07);
    laptopGroup.add(magSafePlug);

    // Glowing Amber Charging Status Micro-LED on MagSafe Connector
    const magSafeLED = new THREE.Mesh(
      new THREE.SphereGeometry(0.0016, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    magSafeLED.position.set(-0.198, 0.0075, -0.07);
    laptopGroup.add(magSafeLED);

    // Braided Power Cable curving back across desk surface
    const magCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0028, 0.0028, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 })
    );
    magCable.position.set(-0.21, 0.005, -0.15);
    magCable.rotation.x = Math.PI / 3;
    magCable.rotation.z = -Math.PI / 4;
    laptopGroup.add(magCable);

    // Dual Thunderbolt 4 / USB-C Ports with Precision Anodized Cutouts
    [-0.04, -0.01].forEach((pz) => {
      const tbPort = new THREE.Mesh(
        new THREE.BoxGeometry(0.002, 0.004, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.9 })
      );
      tbPort.position.set(-0.191, 0.006, pz);
      laptopGroup.add(tbPort);
    });

    deskGroup.add(laptopGroup);
    registerInteractive(laptopGroup, 'macbook', '💻 MACBOOK PRO M3 MAX // CLICK TO RUN TESTS');

    // =========================================================================
    // 2. CENTER ULTRA-WIDE CURVED OLED MONITOR (34") & ARTICULATED MOUNT
    // =========================================================================
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x162134, metalness: 0.88, roughness: 0.18 });

    // Center Monitor Main Chassis
    const centerBezel = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.86, 0.04), bezelMat);
    centerBezel.position.set(0, 1.28, -0.42);
    centerBezel.castShadow = true;
    deskGroup.add(centerBezel);
    registerInteractive(centerBezel, 'center_monitor', '🧠 AI AGENT BENCHMARK // CLICK TO RUN 1540 TFLOPS STRESS TEST');

    // Curved Rear Housing Extrusion with Ventilation Slats
    const centerBackHousing = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.65, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x1a263d, metalness: 0.85, roughness: 0.22 })
    );
    centerBackHousing.position.set(0, 1.28, -0.46);
    deskGroup.add(centerBackHousing);

    // Horizontal Cooling Ventilation Grille Slats on Back
    for (let v = -0.22; v <= 0.22; v += 0.07) {
      const ventSlat = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.008, 0.062),
        new THREE.MeshStandardMaterial({ color: 0x141f32, roughness: 0.7 })
      );
      ventSlat.position.set(0, 1.28 + v, -0.46);
      deskGroup.add(ventSlat);
    }

    // Aluminum Bottom Chin Bar with Green Status LED
    const centerChin = new THREE.Mesh(
      new THREE.BoxGeometry(1.84, 0.03, 0.042),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92, roughness: 0.18 })
    );
    centerChin.position.set(0, 0.86, -0.419);
    deskGroup.add(centerChin);

    const powerLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    powerLed.position.set(0.85, 0.86, -0.395);
    deskGroup.add(powerLed);

    // Center OLED Display Screen (Crystal clear, self-luminous)
    const centerScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.82),
      new THREE.MeshBasicMaterial({ map: centerTex, toneMapped: false })
    );
    centerScreen.position.set(0, 1.28, -0.398);
    deskGroup.add(centerScreen);
    registerInteractive(centerScreen, 'center_monitor', '🧠 AI AGENT BENCHMARK // CLICK TO RUN 1540 TFLOPS STRESS TEST');

    // BenQ Screen Light Bar mounted atop Center Monitor
    const lightBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.95, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.92, roughness: 0.18 })
    );
    lightBar.position.set(0, 1.74, -0.36);
    lightBar.rotation.z = Math.PI / 2;
    deskGroup.add(lightBar);
    registerInteractive(lightBar, 'lamp', '💡 ARCHITECTURAL LIGHTING // CLICK TO SWITCH MOOD');

    // Lightbar downward warm task glow strip
    const lightBarGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.015),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lightBarGlow.position.set(0, 1.728, -0.36);
    lightBarGlow.rotation.x = Math.PI / 2;
    deskGroup.add(lightBarGlow);

    // Heavy-Duty Gas-Spring Articulated Dual Monitor Arm System
    const mountClamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.10, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.15 })
    );
    mountClamp.position.set(0, 0.77, -0.52);
    deskGroup.add(mountClamp);

    const armPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 16), steelLegMat);
    armPole.position.set(0, 1.05, -0.52);
    deskGroup.add(armPole);

    // Articulated Arm Joint to Center Monitor
    const centerArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.16), steelLegMat);
    centerArm.position.set(0, 1.28, -0.48);
    deskGroup.add(centerArm);

    // =========================================================================
    // 3. LEFT VERTICAL OLED MONITOR (27") & PIVOT EXTENSION ARM
    // =========================================================================
    const leftBezel = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.96, 0.04), bezelMat);
    leftBezel.position.set(-1.19, 1.28, -0.24);
    leftBezel.rotation.y = 0.42;
    deskGroup.add(leftBezel);

    // Rear VESA Mount Plate on Left Monitor
    const vesaPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92 })
    );
    vesaPlate.position.set(-1.21, 1.28, -0.265);
    vesaPlate.rotation.y = 0.42;
    deskGroup.add(vesaPlate);

    const leftScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.92),
      new THREE.MeshBasicMaterial({ map: leftTex, toneMapped: false })
    );
    leftScreen.position.set(-1.18, 1.28, -0.218);
    leftScreen.rotation.y = 0.42;
    deskGroup.add(leftScreen);
    registerInteractive(leftScreen, 'left_monitor', '🖥️ CODE WORKBENCH // CLICK TO SWITCH REPOSITORY');
    registerInteractive(leftBezel, 'left_monitor', '🖥️ CODE WORKBENCH // CLICK TO SWITCH REPOSITORY');

    // Articulated Gas Spring Extension Arm linking from central pole to left display
    const armArmL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.035, 0.035), steelLegMat);
    armArmL.position.set(-0.62, 1.20, -0.40);
    armArmL.rotation.y = -0.32;
    deskGroup.add(armArmL);

    // =========================================================================
    // 3.5 RIGHT VERTICAL OLED MONITOR (27") & PIVOT EXTENSION ARM
    // =========================================================================
    const rightBezel = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.96, 0.04), bezelMat);
    rightBezel.position.set(1.19, 1.28, -0.24);
    rightBezel.rotation.y = -0.42;
    deskGroup.add(rightBezel);

    // Rear VESA Mount Plate on Right Monitor
    const vesaPlateR = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92 })
    );
    vesaPlateR.position.set(1.21, 1.28, -0.265);
    vesaPlateR.rotation.y = -0.42;
    deskGroup.add(vesaPlateR);

    const rightScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.92),
      new THREE.MeshBasicMaterial({ map: rightMonTex, toneMapped: false })
    );
    rightScreen.position.set(1.18, 1.28, -0.218);
    rightScreen.rotation.y = -0.42;
    deskGroup.add(rightScreen);
    registerInteractive(rightScreen, 'right_monitor', '📊 RTX 4090 DUAL GPU // CLICK TO CYCLE SPECS');
    registerInteractive(rightBezel, 'right_monitor', '📊 RTX 4090 DUAL GPU // CLICK TO CYCLE SPECS');

    // Articulated Gas Spring Extension Arm linking from central pole to right display
    const armArmR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.035, 0.035), steelLegMat);
    armArmR.position.set(0.62, 1.20, -0.40);
    armArmR.rotation.y = 0.32;
    deskGroup.add(armArmR);

    // =========================================================================
    // 4. SHOWCASE LIQUID-COOLED AI / GAMING PC TOWER (CPU RIG) — RIGHT CORNER
    // =========================================================================
    // Anti-Vibration High-End Studio Stand / Riser Base
    const riserMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92, roughness: 0.18 });
    const riserBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.016, 0.58), riserMat);
    riserBase.position.set(1.58, 0.776, 0.08);
    riserBase.rotation.y = -0.24;
    // riserBase.castShadow = true; (optimized out)
    riserBase.receiveShadow = true;
    deskGroup.add(riserBase);

    // Silicone vibration isolation pads
    const isolationPadMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
    [
      [-0.13, -0.25],
      [0.13, -0.25],
      [-0.13, 0.25],
      [0.13, 0.25],
    ].forEach(([px, pz]) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 16), isolationPadMat);
      pad.position.set(px, 0.011, pz);
      riserBase.add(pad);
    });

    const pcGroup = new THREE.Group();
    pcGroup.position.set(1.58, 0.785, 0.08);
    pcGroup.rotation.y = -0.24; // Angled inward to showcase internal components

    const pcCaseMat = new THREE.MeshStandardMaterial({
      color: 0x162134,
      metalness: 0.90,
      roughness: 0.18,
    });
    const pcFrameAccent = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.22,
    });

    // 1. Main Obsidian Aluminum Chassis Frame
    const pcFrame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.56, 0.54), pcCaseMat);
    pcFrame.position.y = 0.28;
    pcFrame.castShadow = true;
    pcGroup.add(pcFrame);

    // 4x CNC Machined Aluminum Feet with Rubber Dampeners
    const footMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    [
      [-0.11, -0.22],
      [0.11, -0.22],
      [-0.11, 0.22],
      [0.11, 0.22],
    ].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.024, 16), footMat);
      foot.position.set(fx, 0.012, fz);
      pcGroup.add(foot);
    });

    // 2. Dual Tempered Glass Showcase Panels
    const pcGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x08101e,
      metalness: 0.05,
      roughness: 0.02,
      transmission: 0.92,
      transparent: true,
      opacity: 0.45,
      ior: 1.5,
    });

    // Left Side Tempered Glass Panel
    const pcGlassSide = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.50), pcGlassMat);
    pcGlassSide.position.set(-0.141, 0.29, 0.0);
    pcGlassSide.rotation.y = -Math.PI / 2;
    pcGroup.add(pcGlassSide);

    // Front Tempered Glass Panel
    const pcGlassFront = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.50), pcGlassMat);
    pcGlassFront.position.set(0.0, 0.29, 0.271);
    pcGroup.add(pcGlassFront);

    // Corner Thumb-Screws on Glass Panel
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.1 });
    [
      [-0.23, 0.06],
      [0.23, 0.06],
      [-0.23, 0.52],
      [0.23, 0.52],
    ].forEach(([sz, sy]) => {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.008, 12), screwMat);
      screw.position.set(-0.143, sy, sz);
      screw.rotation.z = Math.PI / 2;
      pcGroup.add(screw);
    });

    // 3. Top Front I/O Control Module
    const ioBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.08), pcFrameAccent);
    ioBase.position.set(0, 0.565, 0.22);
    pcGroup.add(ioBase);

    // Power Button with glowing White/Cyan LED Halo Ring
    const pwrBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.005, 16), screwMat);
    pwrBtn.position.set(-0.07, 0.572, 0.23);
    pcGroup.add(pwrBtn);

    const pwrHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.011, 0.002, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    pwrHalo.position.set(-0.07, 0.574, 0.23);
    pwrHalo.rotation.x = Math.PI / 2;
    pcGroup.add(pwrHalo);

    // USB Ports (2x Blue USB 3.2 + 1x USB-C + Audio Jack)
    const usbBlueMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const usb1 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.004, 0.008), usbBlueMat);
    usb1.position.set(-0.02, 0.572, 0.23);
    pcGroup.add(usb1);

    const usb2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.004, 0.008), usbBlueMat);
    usb2.position.set(0.01, 0.572, 0.23);
    pcGroup.add(usb2);

    const usbC = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.003, 0.006),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    usbC.position.set(0.04, 0.572, 0.23);
    pcGroup.add(usbC);

    const audioJack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.004, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
    );
    audioJack.position.set(0.07, 0.572, 0.23);
    pcGroup.add(audioJack);

    // 4. ATX Motherboard (ASUS ROG Maximus Style)
    const moboMat = new THREE.MeshStandardMaterial({ color: 0x141f32, roughness: 0.55 });
    const mobo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.38, 0.38), moboMat);
    mobo.position.set(0.08, 0.32, -0.02);
    pcGroup.add(mobo);

    // Brushed Aluminum VRM Heatsinks
    const vrmMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const vrmTop = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.14), vrmMat);
    vrmTop.position.set(0.065, 0.47, -0.06);
    pcGroup.add(vrmTop);

    const vrmLeft = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.04), vrmMat);
    vrmLeft.position.set(0.065, 0.39, -0.14);
    pcGroup.add(vrmLeft);

    // 5. AIO Liquid CPU Cooler: Circular Pump Block with Realistic Subtle LCD Readout Screen
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x090e1a, metalness: 0.95, roughness: 0.16 });
    const pumpBlock = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 24), pumpMat);
    pumpBlock.position.set(0.06, 0.36, -0.04);
    pumpBlock.rotation.z = Math.PI / 2;
    pcGroup.add(pumpBlock);

    // Precision CNC-Machined Chamfered Outer Bezel Ring (NZXT Kraken / Corsair style)
    const fittingMat = new THREE.MeshStandardMaterial({ color: 0xcfd8e3, metalness: 0.95, roughness: 0.12 });
    const pumpBezel = new THREE.Mesh(new THREE.TorusGeometry(0.041, 0.0024, 12, 32), fittingMat);
    pumpBezel.position.set(0.044, 0.36, -0.04);
    pumpBezel.rotation.y = -Math.PI / 2;
    pcGroup.add(pumpBezel);

    // Soft Diffused Edge Light Ring (Soft, realistic CPU RGB aura)
    const pumpHaloMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.42, // Real-life subtle LED glow, not blinding
    });
    const pumpHalo = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.0016, 8, 32), pumpHaloMat);
    pumpHalo.position.set(0.0435, 0.36, -0.04);
    pumpHalo.rotation.y = -Math.PI / 2;
    pcGroup.add(pumpHalo);

    // Live Circular LCD Screen on CPU Pump Cap (Mapped to rightTex with refined CPU thermals)
    const pumpLcd = new THREE.Mesh(
      new THREE.CircleGeometry(0.035, 24),
      new THREE.MeshBasicMaterial({ map: rightTex, toneMapped: false })
    );
    pumpLcd.position.set(0.043, 0.36, -0.04);
    pumpLcd.rotation.y = -Math.PI / 2;
    pcGroup.add(pumpLcd);

    // Thick Braided Nylon Liquid Cooling Tubes with Chrome Compression Fittings
    const fit1 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.016, 16), fittingMat);
    fit1.position.set(0.048, 0.38, -0.02);
    fit1.rotation.z = Math.PI / 2;
    pcGroup.add(fit1);

    const fit2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.016, 16), fittingMat);
    fit2.position.set(0.048, 0.34, -0.02);
    fit2.rotation.z = Math.PI / 2;
    pcGroup.add(fit2);

    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.2 });
    const tube1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 16), tubeMat);
    tube1.position.set(0.03, 0.44, 0.02);
    tube1.rotation.z = 0.55;
    tube1.rotation.x = -0.4;
    pcGroup.add(tube1);

    const tube2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 16), tubeMat);
    tube2.position.set(0.02, 0.43, 0.05);
    tube2.rotation.z = 0.52;
    tube2.rotation.x = -0.35;
    pcGroup.add(tube2);

    // Top 360mm Aluminum Liquid Cooling Radiator
    const radMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.42), pcCaseMat);
    radMesh.position.set(0.0, 0.52, 0.0);
    pcGroup.add(radMesh);

    // 6. NVIDIA GeForce RTX 4090 / AI Beast GPU (Massive 3.5-slot Triple Fan Graphics Card)
    const gpuGroup = new THREE.Group();
    gpuGroup.position.set(-0.02, 0.22, -0.02);

    // Thick Aluminum Backplate & Shroud
    const gpuBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92, roughness: 0.18 })
    );
    // gpuBody.castShadow = true; (optimized out)
    gpuGroup.add(gpuBody);

    // Side Illuminated "GEFORCE RTX" Logo Badge
    const rtxBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.024),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    rtxBadge.position.set(-0.061, 0.03, 0.0);
    rtxBadge.rotation.y = -Math.PI / 2;
    gpuGroup.add(rtxBadge);

    // Dual GPU RGB Intake Fans with Soft Ambient Glow
    const gpuFanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.4 });
    const gFan1 = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.004, 8, 20), gpuFanMat);
    gFan1.position.set(-0.061, -0.02, -0.08);
    gFan1.rotation.y = -Math.PI / 2;
    gpuGroup.add(gFan1);

    const gFan2 = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.004, 8, 20), gpuFanMat);
    gFan2.position.set(-0.061, -0.02, 0.08);
    gFan2.rotation.y = -Math.PI / 2;
    gpuGroup.add(gFan2);

    // 12VHPWR Sleeved Braided Power Cables with Cable Combs
    const powerCableMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const gpuCable = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 12), powerCableMat);
    gpuCable.position.set(-0.05, -0.04, 0.08);
    gpuCable.rotation.x = Math.PI / 3;
    gpuGroup.add(gpuCable);

    pcGroup.add(gpuGroup);

    // 7. 4x Corsair Dominator / G.Skill Trident Z5 DDR5 RGB RAM Modules
    const ramLeds: THREE.Mesh[] = [];
    for (let r = 0; r < 4; r++) {
      // RAM PCB & Heatspreader
      const ramBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.05, 0.032),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
      );
      ramBody.position.set(0.06, 0.36, 0.02 + r * 0.016);
      pcGroup.add(ramBody);

      // Top Frosted RGB Light Diffuser Bar
      const ramLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.009, 0.008, 0.032),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.7 })
      );
      ramLight.position.set(0.06, 0.388, 0.02 + r * 0.016);
      pcGroup.add(ramLight);
      ramLeds.push(ramLight);
    }
    ramLedsRef.current = ramLeds;

    // 8. Dynamic Cooling Fans: Realistic Smoked Translucent Blades & Soft Diffused LED Ring
    const fanBladeMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1c,
      roughness: 0.45,
      metalness: 0.45,
    });
    const fanRingMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55, // Realistic soft diffused illumination
    });
    const fans: THREE.Mesh[] = [];

    // 3 Front Intake Fans
    for (let f = 0; f < 3; f++) {
      const fGroup = new THREE.Group();
      fGroup.position.set(0.0, 0.14 + f * 0.14, 0.25);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0045, 8, 24), fanRingMat);
      fGroup.add(ring);

      const blades = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.004, 6), fanBladeMat);
      fGroup.add(blades);

      pcGroup.add(fGroup);
      fans.push(blades);
    }

    // 1 Rear 120mm Exhaust Fan
    const rearFanGroup = new THREE.Group();
    rearFanGroup.position.set(0.04, 0.38, -0.24);
    const rearRing = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.0045, 8, 24), fanRingMat);
    rearFanGroup.add(rearRing);
    const rearBlades = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.004, 6), fanBladeMat);
    rearFanGroup.add(rearBlades);
    pcGroup.add(rearFanGroup);
    fans.push(rearBlades);

    fansRef.current = fans;

    // 9. Bottom PSU Chamber / Basement Shroud with Cutout Window
    const psuShroud = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.50), pcCaseMat);
    psuShroud.position.set(0.0, 0.065, 0.0);
    pcGroup.add(psuShroud);

    // PSU Display Cutout
    const psuBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    psuBadge.position.set(-0.131, 0.065, -0.08);
    psuBadge.rotation.y = -Math.PI / 2;
    pcGroup.add(psuBadge);

    deskGroup.add(pcGroup);
    registerInteractive(pcGroup, 'pc_rig', '⚡ LIQUID COOLED PC RIG // CLICK TO BOOST FANS');

    // =========================================================================
    // 5. STUDIO AUDIO INTERFACE & PLANAR HEADPHONE STAND (LEFT DESK)
    // =========================================================================
    // Audio Interface (Focusrite Scarlett / Apollo Twin style with brushed anodized finish)
    const audioGroup = new THREE.Group();
    audioGroup.position.set(-1.42, 0.80, 0.22);
    audioGroup.rotation.y = 0.32;

    const audioChassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.05, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.88, roughness: 0.22 }) // Anodized ruby red
    );
    // audioChassis.castShadow = true; (optimized out)
    audioGroup.add(audioChassis);

    // Front Black Brushed Faceplate
    const audioFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.176, 0.046),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1d, roughness: 0.3 })
    );
    audioFace.position.set(0, 0, 0.071);
    audioGroup.add(audioFace);

    // Main Monitor Level Heavy Knurled Aluminum Knob
    const knobBig = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.018, 24),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.96, roughness: 0.12 })
    );
    knobBig.position.set(0.042, 0.028, 0.0);
    audioGroup.add(knobBig);

    // Dual Input Preamp Gain Knobs with Glowing Ring Halo
    [-0.042, -0.012].forEach((gx) => {
      const gKnob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.014, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92, roughness: 0.2 })
      );
      gKnob.position.set(gx, 0.028, -0.02);
      audioGroup.add(gKnob);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.014, 0.0025, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      halo.position.set(gx, 0.027, -0.02);
      halo.rotation.x = Math.PI / 2;
      audioGroup.add(halo);
    });

    // Multi-Segment LED Level Meter on Top Plate
    [-0.008, 0.0, 0.008].forEach((my, mi) => {
      const ledCol = mi === 2 ? 0xef4444 : mi === 1 ? 0xf59e0b : 0x10b981;
      const meterLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.003, 0.005),
        new THREE.MeshBasicMaterial({ color: ledCol })
      );
      meterLed.position.set(0.042, 0.027, 0.038 + my);
      audioGroup.add(meterLed);
    });

    // 48V Phantom Power LED
    const led48v = new THREE.Mesh(
      new THREE.SphereGeometry(0.003, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    led48v.position.set(0.042, 0.028, -0.04);
    audioGroup.add(led48v);

    // Headphone 1/4" Output Jack with Knurled Bezel Nut
    const hpJack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.005, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.95 })
    );
    hpJack.position.set(0.06, 0, 0.073);
    hpJack.rotation.x = Math.PI / 2;
    audioGroup.add(hpJack);

    deskGroup.add(audioGroup);
    registerInteractive(audioGroup, 'audio_interface', '🎛️ FOCUSRITE SCARLETT // CLICK TO BOOST GAIN');

    // Audiophile Headphone Stand & Studio Planar Magnetic Headphones
    const standGroup = new THREE.Group();
    standGroup.position.set(-1.58, 0.785, -0.05);

    const standBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.016, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.94, roughness: 0.16 })
    );
    standGroup.add(standBase);

    // Sculpted Bent Walnut Arch Stand
    const standArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.015, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.45 })
    );
    standArch.position.set(0, 0.12, 0);
    standArch.rotation.z = Math.PI;
    standGroup.add(standArch);

    // Over-Ear Studio Planar Headphones draped on stand
    const hpBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.092, 0.012, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 })
    );
    hpBand.position.set(0, 0.21, 0);
    hpBand.rotation.z = Math.PI;
    standGroup.add(hpBand);

    // Left & Right Earcups with Open-Back Mesh Grills and Lambskin Pads
    [-0.092, 0.092].forEach((hpx) => {
      // Lambskin Ear Cushion
      const earpad = new THREE.Mesh(
        new THREE.TorusGeometry(0.034, 0.01, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 })
      );
      earpad.position.set(hpx, 0.18, 0);
      earpad.rotation.y = Math.PI / 2;
      standGroup.add(earpad);

      // CNC Machined Aluminum Outer Earcup
      const hpCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.022, 20),
        new THREE.MeshStandardMaterial({ color: 0x223046, metalness: 0.92, roughness: 0.16 })
      );
      hpCup.position.set(hpx + (hpx > 0 ? 0.01 : -0.01), 0.18, 0);
      hpCup.rotation.z = Math.PI / 2;
      standGroup.add(hpCup);

      // Honeycomb Open-Back Planar Grille
      const cupGrille = new THREE.Mesh(
        new THREE.CircleGeometry(0.032, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.3 })
      );
      cupGrille.position.set(hpx + (hpx > 0 ? 0.022 : -0.022), 0.18, 0);
      cupGrille.rotation.y = hpx > 0 ? Math.PI / 2 : -Math.PI / 2;
      standGroup.add(cupGrille);
    });

    deskGroup.add(standGroup);
    registerInteractive(standGroup, 'headphones', '🎧 SENNHEISER REFERENCE AUDIO // CLICK TO TEST');

    // =========================================================================
    // 6. CUSTOM 65% CNC MECHANICAL KEYBOARD & COILED AVIATOR CABLE
    // =========================================================================
    const kbGroup = new THREE.Group();
    kbGroup.position.set(0, 0.785, 0.16);

    // CNC Anodized Aluminum 6-Degree Wedge Keyboard Case (Deep Cobalt / Navy Titanium)
    const kbBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.022, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.94, roughness: 0.18 })
    );
    kbBase.position.set(0, 0.015, 0);
    // kbBase.castShadow = true; (optimized out)
    kbGroup.add(kbBase);

    // Bottom PVD Brass Accent Weight Bar
    const kbBrassWeight = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.003, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 })
    );
    kbBrassWeight.position.set(0, 0.004, 0);
    kbGroup.add(kbBrassWeight);

    // Aluminum Knurled Rotary Media Encoder Knob in Top Right Corner
    const kbKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.014, 16),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.96, roughness: 0.12 })
    );
    kbKnob.position.set(0.285, 0.035, -0.075);
    kbGroup.add(kbKnob);

    // Key Matrix Backlight Glow (Subtle Underglow)
    const keyGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.60, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.6,
      })
    );
    keyGlow.rotation.x = -Math.PI / 2;
    keyGlow.position.set(0, 0.027, 0);
    kbGroup.add(keyGlow);
    keyGlowRef.current = keyGlow;

    // Two-Tone PBT Double-Shot Keycaps (GMK Cyber Amber & Alabaster Palette)
    const keycapMatMain = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.28 }); // Crisp alabaster alphas
    const keycapMatMod = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.32 });  // Deep dark navy slate modifiers
    const keycapMatAmber = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.24 }); // Radiant tangerine Esc
    const keycapMatEnter = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.24 }); // Coral rose Enter
    const keycapMatCyan = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.22 });  // Electric cyan spacebar
    const keycapMatYellow = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.24 }); // Golden arrow cluster

    // Stepped Sculpted Keycap Rows with Cylindrical Concave Finger Dishes
    for (let row = -2; row <= 2; row++) {
      for (let col = -7; col <= 7; col++) {
        if (row === 2 && Math.abs(col) < 3) continue; // spacebar gap
        if (row === -2 && col === 7) continue; // Rotary knob location
        const isMod = Math.abs(col) >= 6 || row === -2;
        const isArrow = row >= 1 && col >= 5;
        const isEnter = row === 0 && col === 6;
        const isEsc = row === -2 && col === -7;

        const kMat = isEsc ? keycapMatAmber :
                     isEnter ? keycapMatEnter :
                     isArrow ? keycapMatYellow :
                     isMod ? keycapMatMod : keycapMatMain;

        const keyH = 0.012 + (row === -2 ? 0.003 : 0); // Sculpted row heights
        const keycap = new THREE.Mesh(new THREE.BoxGeometry(0.033, keyH, 0.031), kMat);
        keycap.position.set(col * 0.038, 0.032 + keyH / 2, row * 0.036);
        kbGroup.add(keycap);

        // Tactile concave cylindrical dish highlight on top of keycap
        const dishCap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.013, 0.013, 0.0015, 12),
          kMat
        );
        dishCap.position.set(col * 0.038, 0.032 + keyH + 0.0008, row * 0.036);
        dishCap.scale.set(1.1, 1, 0.9);
        kbGroup.add(dishCap);
      }
    }
    // Sculpted Spacebar with Rounded Profile
    const spacebar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.013, 0.031), keycapMatCyan);
    spacebar.position.set(0, 0.039, 2 * 0.036);
    kbGroup.add(spacebar);

    const spaceDish = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.002, 0.027), keycapMatCyan);
    spaceDish.position.set(0, 0.046, 2 * 0.036);
    kbGroup.add(spaceDish);

    // True 3D Parametric Coiled Aviator Keyboard Cable with Chrome Disconnect Coupler
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.38, metalness: 0.15 });

    // Helical spiral spring cable geometry
    const coilLoops = 14;
    const coilRadius = 0.013;
    const coilLength = 0.22;
    const coilPoints: THREE.Vector3[] = [];
    for (let c = 0; c <= coilLoops * 24; c++) {
      const angle = (c / 24) * Math.PI * 2;
      const progress = c / (coilLoops * 24);
      const cx = -0.11 + progress * coilLength;
      const cy = 0.016 + Math.sin(angle) * coilRadius;
      const cz = -0.19 + Math.cos(angle) * coilRadius;
      coilPoints.push(new THREE.Vector3(cx, cy, cz));
    }
    const coilCurve = new THREE.CatmullRomCurve3(coilPoints);
    const coilGeo = new THREE.TubeGeometry(coilCurve, 120, 0.0035, 8, false);
    const coilMesh = new THREE.Mesh(coilGeo, cableMat);
    kbGroup.add(coilMesh);

    // Chrome GX16 Aviator Coupler with Knurled Collar & Threading Ring
    const aviatorCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.032, 16),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.98, roughness: 0.1 })
    );
    aviatorCollar.position.set(0.12, 0.016, -0.19);
    aviatorCollar.rotation.z = Math.PI / 2;
    kbGroup.add(aviatorCollar);

    const aviatorKnurl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.010, 20),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.25 })
    );
    aviatorKnurl.position.set(0.12, 0.016, -0.19);
    aviatorKnurl.rotation.z = Math.PI / 2;
    kbGroup.add(aviatorKnurl);

    // Cable straight run leading to rear grommet
    const cableRear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0035, 0.26, 8),
      cableMat
    );
    cableRear.position.set(0.12, 0.016, -0.32);
    cableRear.rotation.x = Math.PI / 2;
    kbGroup.add(cableRear);

    deskGroup.add(kbGroup);
    registerInteractive(kbGroup, 'keyboard', '⌨️ MECHANICAL KEYBOARD // CLICK TO TYPE CODE');

    // =========================================================================
    // 7. PRECISION ERGONOMIC MOUSE (MX MASTER STYLE) & TEXTURED DESKPAD
    // =========================================================================
    // Micro-Weave Stitched Extended Deskpad with Procedural Cordura Weave
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      map: deskpadTex,
      roughness: 0.72,
      metalness: 0.06,
    });
    const mousePad = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.007, 0.42),
      padMat
    );
    mousePad.position.set(0.12, 0.788, 0.16);
    deskGroup.add(mousePad);

    // Dual-Color Stitched Perimeter Piping (Cyan inner, Warm amber outer seam)
    const padBorderInner = new THREE.Mesh(
      new THREE.BoxGeometry(0.99, 0.003, 0.43),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.4 })
    );
    padBorderInner.position.set(0.12, 0.786, 0.16);
    deskGroup.add(padBorderInner);

    const padBorderOuter = new THREE.Mesh(
      new THREE.BoxGeometry(1.00, 0.002, 0.44),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
    );
    padBorderOuter.position.set(0.12, 0.784, 0.16);
    deskGroup.add(padBorderOuter);

    // Modern Curved Glass OLED Smartphone lying flat on deskpad
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-0.32, 0.793, 0.16);

    // Phone titanium chassis
    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.008, 0.156),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92, roughness: 0.18 })
    );
    phoneGroup.add(phoneBody);

    // Phone OLED display with live lockscreen glow
    const phoneScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.074, 0.150),
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        roughness: 0.1,
      })
    );
    phoneScreen.rotation.x = -Math.PI / 2;
    phoneScreen.position.set(0, 0.0045, 0);
    phoneGroup.add(phoneScreen);

    // Camera island on back (raised edge)
    const phoneCamera = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.002, 0.028),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.1 })
    );
    phoneCamera.position.set(0.022, 0.005, -0.058);
    phoneGroup.add(phoneCamera);

    deskGroup.add(phoneGroup);

    // Ergonomic Sculpted Wireless Mouse
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(0.46, 0.792, 0.16);

    // Contoured Palm Shell
    const mouseBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.032, 0.11),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.28 })
    );
    mouseBody.position.set(0, 0.016, 0);
    // mouseBody.castShadow = true; (optimized out)
    mouseGroup.add(mouseBody);

    // Ergonomic Thumb Wing Flare on Left
    const thumbWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.014, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x162032, metalness: 0.7, roughness: 0.35 })
    );
    thumbWing.position.set(-0.042, 0.009, 0.01);
    mouseGroup.add(thumbWing);

    // Horizontal Thumb Scroll Wheel (Metal Knurled)
    const thumbWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.012, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.12 })
    );
    thumbWheel.position.set(-0.038, 0.022, -0.01);
    thumbWheel.rotation.z = Math.PI / 2;
    mouseGroup.add(thumbWheel);

    // Primary Top Tactile Rubber Scroll Wheel
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.007, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.8 })
    );
    wheel.position.set(0, 0.031, -0.032);
    wheel.rotation.z = Math.PI / 2;
    mouseGroup.add(wheel);

    // PTFE Glide Skates Underneath
    [-0.035, 0.035].forEach((myz) => {
      const skate = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.001, 0.015),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
      );
      skate.position.set(0, 0.0005, myz);
      mouseGroup.add(skate);
    });

    deskGroup.add(mouseGroup);
    registerInteractive(mouseGroup, 'mouse', '🖱️ ERGONOMIC WIRELESS MOUSE // CLICK TO CALIBRATE');

    // =========================================================================
    // 8. STUDIO REFERENCE ACTIVE MONITORS (KRK / YAMAHA HS SERIES SHAPING)
    // =========================================================================
    const speakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.20 });
    const wooferMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 }); // Woven Kevlar cone
    const dustCapMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25 });
    const tweeterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.95, roughness: 0.1 });
    const isoPadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }); // Decoupling pad

    [
      { x: -1.52, rotY: 0.35 },
      { x: 1.52, rotY: -0.35 },
    ].forEach((spk) => {
      const spGroup = new THREE.Group();
      spGroup.position.set(spk.x, 0.785, -0.15);
      spGroup.rotation.y = spk.rotY;

      // Acoustic Isolation Decoupling Foam Wedge
      const isoWedge = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.025, 0.24), isoPadMat);
      isoWedge.position.set(0, 0.012, 0);
      spGroup.add(isoWedge);

      // Speaker Cabinet (MDF with Chamfered Front Acoustic Baffle)
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.32, 0.22), speakerMat);
      cabinet.position.set(0, 0.185, 0);
      // cabinet.castShadow = true; (optimized out)
      spGroup.add(cabinet);

      // 5-Inch Woven Kevlar Woofer Cone
      const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.048, 0.012, 24), wooferMat);
      woofer.position.set(0, 0.145, 0.115);
      woofer.rotation.x = Math.PI / 2;
      spGroup.add(woofer);
      woofersRef.current.push(woofer);

      // Woofer Rubber Roll Surround & Center Inverted Dust Cap
      const dustCap = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 8), dustCapMat);
      dustCap.position.set(0, 0.145, 0.122);
      spGroup.add(dustCap);

      // 1-Inch Silk Dome Tweeter in Recessed Elliptical Acoustic Waveguide
      const waveguide = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.024, 0.008, 20),
        new THREE.MeshStandardMaterial({ color: 0x162134, roughness: 0.4 })
      );
      waveguide.position.set(0, 0.26, 0.114);
      waveguide.rotation.x = Math.PI / 2;
      spGroup.add(waveguide);

      const tweeter = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 8), tweeterMat);
      tweeter.position.set(0, 0.26, 0.118);
      spGroup.add(tweeter);

      // Bass Reflex Port Tube (Front-Firing Oval)
      const port = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16),
        new THREE.MeshStandardMaterial({ color: 0x141f32, roughness: 0.7 })
      );
      port.position.set(0, 0.065, 0.115);
      port.rotation.x = Math.PI / 2;
      spGroup.add(port);

      deskGroup.add(spGroup);
      registerInteractive(spGroup, 'speakers', '🎵 STUDIO REFERENCE MONITORS // CLICK TO TOGGLE LO-FI');
    });

    // =========================================================================
    // 9. CERAMIC ESPRESSO MUG & REALISTIC RISING STEAM
    // =========================================================================
    const mugGroup = new THREE.Group();
    mugGroup.position.set(-0.7, 0.785, 0.22);

    // Matte Nordic Ceramic Mug Exterior with Chamfered Rim
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.038, 0.092, 24),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.35, roughness: 0.38 })
    );
    mug.position.y = 0.046;
    // mug.castShadow = true; (optimized out)
    mugGroup.add(mug);
    registerInteractive(mugGroup, 'mug', '☕ ARTISAN ESPRESSO // CLICK FOR STEAM BURST');

    // Mug Inner Cavity (Dark Glazed Ceramic)
    const mugInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.041, 0.034, 0.088, 20),
      new THREE.MeshStandardMaterial({ color: 0x1f140a, roughness: 0.2 })
    );
    mugInner.position.y = 0.048;
    mugGroup.add(mugInner);

    // Fresh Steaming Dark Espresso with Crema Swirl
    const coffee = new THREE.Mesh(
      new THREE.CylinderGeometry(0.040, 0.040, 0.005, 20),
      new THREE.MeshStandardMaterial({ color: 0x2b1810, roughness: 0.25 })
    );
    coffee.position.y = 0.078;
    mugGroup.add(coffee);

    // Micro-Foam Latte Art Swirl Ring
    const cremaSwirl = new THREE.Mesh(
      new THREE.TorusGeometry(0.016, 0.004, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xc49b71, roughness: 0.4 })
    );
    cremaSwirl.position.set(0, 0.081, 0);
    cremaSwirl.rotation.x = Math.PI / 2;
    mugGroup.add(cremaSwirl);

    // Ergonomic D-Handle
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.026, 0.0065, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.35, roughness: 0.38 })
    );
    handle.position.set(-0.046, 0.046, 0);
    handle.rotation.y = Math.PI / 2;
    mugGroup.add(handle);

    // Rising Warm Steam Particles
    const steamCount = 24;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    for (let s = 0; s < steamCount; s++) {
      steamPos[s * 3] = (Math.random() - 0.5) * 0.035;
      steamPos[s * 3 + 1] = 0.085 + Math.random() * 0.18;
      steamPos[s * 3 + 2] = (Math.random() - 0.5) * 0.035;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xffedd5,
      size: 0.014,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    const steamPoints = new THREE.Points(steamGeo, steamMat);
    mugGroup.add(steamPoints);
    steamParticlesRef.current = steamPoints;

    deskGroup.add(mugGroup);

    // =========================================================================
    // 10. MINI 3D SNORLAX DESKTOP COMPANION / MASCOT
    // =========================================================================
    const snorlaxGroup = new THREE.Group();
    snorlaxGroup.position.set(-0.38, 0.785, -0.16);

    const snorlaxTealMat = new THREE.MeshStandardMaterial({
      color: 0x1b4e5d, // Authentic Pokémon Navy-Teal
      roughness: 0.65,
      metalness: 0.05,
    });
    const snorlaxCreamMat = new THREE.MeshStandardMaterial({
      color: 0xf3e8cc, // Authentic Pokémon Ivory Cream
      roughness: 0.72,
      metalness: 0.02,
    });
    const snorlaxTanMat = new THREE.MeshStandardMaterial({
      color: 0xcba275, // Warm caramel footpad tan
      roughness: 0.70,
    });
    const snorlaxWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.30,
    });
    const snorlaxBlackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
    });

    // Chubby Bottom-heavy Pear-shaped Body
    const snorlaxBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.046, 24, 20),
      snorlaxTealMat
    );
    snorlaxBody.scale.set(1.24, 1.08, 1.08);
    snorlaxBody.position.set(0, 0.046, 0);
    snorlaxGroup.add(snorlaxBody);

    // Cream Belly Patch
    const snorlaxBelly = new THREE.Mesh(
      new THREE.SphereGeometry(0.039, 20, 16),
      snorlaxCreamMat
    );
    snorlaxBelly.scale.set(1.04, 0.96, 0.52);
    snorlaxBelly.position.set(0, 0.043, 0.027);
    snorlaxGroup.add(snorlaxBelly);

    // Head Dome
    const snorlaxHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 24, 20),
      snorlaxTealMat
    );
    snorlaxHead.scale.set(1.10, 0.94, 1.0);
    snorlaxHead.position.set(0, 0.086, 0);
    snorlaxGroup.add(snorlaxHead);

    // Cream Face Patch
    const snorlaxFace = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 20, 16),
      snorlaxCreamMat
    );
    snorlaxFace.scale.set(0.94, 0.86, 0.42);
    snorlaxFace.position.set(0, 0.084, 0.021);
    snorlaxGroup.add(snorlaxFace);

    // Cute Pointed Ears
    [-0.024, 0.024].forEach((ex) => {
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.013, 0.024, 16),
        snorlaxTealMat
      );
      ear.position.set(ex, 0.120, 0);
      ear.rotation.z = ex > 0 ? -0.22 : 0.22;
      snorlaxGroup.add(ear);
    });

    // Bold Open Expressive Eyes with Specular Gleam
    [-0.012, 0.012].forEach((eyex) => {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.0042, 12, 10),
        snorlaxBlackMat
      );
      eye.scale.set(1.0, 1.25, 0.45);
      eye.position.set(eyex, 0.090, 0.036);
      snorlaxGroup.add(eye);

      // White Specular Catchlight
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.0013, 8, 8),
        snorlaxWhiteMat
      );
      glint.position.set(eyex - 0.0013, 0.092, 0.038);
      snorlaxGroup.add(glint);
    });

    // Cute White Fangs pointing UP
    [-0.008, 0.008].forEach((fx) => {
      const fang = new THREE.Mesh(
        new THREE.ConeGeometry(0.0025, 0.006, 8),
        snorlaxWhiteMat
      );
      fang.position.set(fx, 0.076, 0.036);
      fang.rotation.x = 0; // Apex points upward
      snorlaxGroup.add(fang);
    });

    // Chubby Arms resting forward
    [-0.040, 0.040].forEach((ax) => {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.012, 0.026, 8, 12),
        snorlaxTealMat
      );
      arm.position.set(ax, 0.052, 0.016);
      arm.rotation.z = ax > 0 ? -0.45 : 0.45;
      arm.rotation.x = 0.35;
      snorlaxGroup.add(arm);
    });

    // Paws & Feet sticking forward with Cream Color and Caramel Pads
    [-0.032, 0.032].forEach((fx) => {
      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 16, 12),
        snorlaxCreamMat
      );
      foot.scale.set(1.1, 0.65, 1.35);
      foot.position.set(fx, 0.012, 0.038);
      snorlaxGroup.add(foot);

      // Foot Pad
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(0.011, 14),
        snorlaxTanMat
      );
      pad.position.set(fx, 0.014, 0.052);
      pad.rotation.x = -0.35;
      snorlaxGroup.add(pad);

      // 3 Claws on foot
      [-0.006, 0, 0.006].forEach((cx) => {
        const claw = new THREE.Mesh(
          new THREE.ConeGeometry(0.002, 0.006, 6),
          snorlaxWhiteMat
        );
        claw.position.set(fx + cx, 0.010, 0.060);
        claw.rotation.x = Math.PI / 2;
        snorlaxGroup.add(claw);
      });
    });

    snorlaxMascotRef.current = snorlaxGroup;
    deskGroup.add(snorlaxGroup);
    registerInteractive(snorlaxGroup, 'snorlax_mascot', '💤 MINI SNORLAX MASCOT // CLICK TO PET & HOP');

    // =========================================================================
    // 11. LEVITATING CYBER QUANTUM CORE (Magnetic Induction Base)
    // =========================================================================
    const qBaseGroup = new THREE.Group();
    qBaseGroup.position.set(0.48, 0.785, -0.18);

    // Brushed titanium magnetic base
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.94,
      roughness: 0.18,
    });
    const plinthMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.052, 0.014, 24), plinthMat);
    plinthMesh.position.y = 0.007;
    // plinthMesh.castShadow = true; (optimized out)
    qBaseGroup.add(plinthMesh);

    // Glowing cyan base ring
    const plinthRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.040, 0.0025, 12, 32),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.2,
      })
    );
    plinthRing.rotation.x = Math.PI / 2;
    plinthRing.position.y = 0.014;
    qBaseGroup.add(plinthRing);

    // Floating Quantum Crystal Core
    const qCoreGroup = new THREE.Group();
    qCoreGroup.position.set(0.48, 0.855, -0.18);

    // Inner glowing facet core
    const qInnerCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.022, 0),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 2.5,
        roughness: 0.1,
        metalness: 0.9,
      })
    );
    qCoreGroup.add(qInnerCore);

    // Outer cyber wireframe cage
    const qOuterCage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.034, 0),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 1.6,
        wireframe: true,
      })
    );
    qCoreGroup.add(qOuterCage);

    // Spinning orbit ring
    const qOrbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.042, 0.0018, 12, 32),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.0,
      })
    );
    qOrbitRing.rotation.x = Math.PI / 3;
    qCoreGroup.add(qOrbitRing);

    // Localized cyan point light
    const qLight = new THREE.PointLight(0x06b6d4, 1.2, 0.9);
    qLight.position.set(0, 0, 0);
    qCoreGroup.add(qLight);

    quantumCoreRef.current = qCoreGroup;
    deskGroup.add(qBaseGroup);
    deskGroup.add(qCoreGroup);
    registerInteractive(qCoreGroup, 'quantum_core', '⚡ QUANTUM AI CORE // MAGNETIC LEVITATION MATRIX');

    // =========================================================================
    // 12. LIVE DIGITAL ATOMIC CHRONOMETER (Nixie / OLED Desk Clock)
    // =========================================================================
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-0.74, 0.785, -0.22);
    clockGroup.rotation.y = 0.20; // Angled toward chair

    // Artisan Dark Walnut Base with Brass Bevel
    const clockBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.016, 0.048),
      new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.35,
        metalness: 0.15,
      })
    );
    clockBase.position.y = 0.008;
    // clockBase.castShadow = true; (optimized out)
    clockGroup.add(clockBase);

    // Polished Brass Trim
    const clockTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.132, 0.004, 0.050),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.15,
      })
    );
    clockTrim.position.y = 0.017;
    clockGroup.add(clockTrim);

    // Dynamic 256x128 Canvas for Real-Time Time Rendering
    const clockCanvas = document.createElement('canvas');
    clockCanvas.width = 256;
    clockCanvas.height = 128;
    const clockCtx = clockCanvas.getContext('2d')!;
    clockCtx.fillStyle = '#060a12';
    clockCtx.fillRect(0, 0, 256, 128);
    clockCtx.fillStyle = '#06b6d4';
    clockCtx.font = 'bold 14px monospace';
    clockCtx.fillText('ATOMIC CHRONOMETER', 18, 30);
    clockCtx.fillStyle = '#f8fafc';
    clockCtx.font = 'bold 44px monospace';
    clockCtx.fillText('00:00:00', 18, 80);

    const clockTex = new THREE.CanvasTexture(clockCanvas);
    clockTex.colorSpace = THREE.SRGBColorSpace;
    clockTex.generateMipmaps = true;
    clockTex.minFilter = THREE.LinearMipmapLinearFilter;
    clockTex.magFilter = THREE.LinearFilter;
    clockTex.anisotropy = maxAnisotropy;
    clockCanvasRef.current = { canvas: clockCanvas, ctx: clockCtx, texture: clockTex };

    // Glass Screen Housing
    const clockScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.10, 0.048),
      new THREE.MeshBasicMaterial({ map: clockTex, side: THREE.DoubleSide })
    );
    clockScreen.position.set(0, 0.046, 0.012);
    clockScreen.rotation.x = -0.15;
    clockGroup.add(clockScreen);

    // Smoked Acrylic Outer Housing
    const clockHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.112, 0.056, 0.028),
      new THREE.MeshStandardMaterial({
        color: 0x1a263d,
        roughness: 0.15,
        metalness: 0.85,
        transparent: true,
        opacity: 0.65,
      })
    );
    clockHousing.position.set(0, 0.046, 0);
    clockHousing.rotation.x = -0.15;
    clockGroup.add(clockHousing);

    deskGroup.add(clockGroup);
    registerInteractive(clockGroup, 'desk_clock', '⏱️ PRECISION ATOMIC TIMEPIECE // NTP SYNC');

    // =========================================================================
    // 13. GEOMETRIC BIOPHILIC GLASS TERRARIUM & CRYSTAL SUCCULENT
    // =========================================================================
    const terrariumGroup = new THREE.Group();
    terrariumGroup.position.set(1.18, 0.785, -0.20);

    // Brass Wireframe Faceted Prism
    const prismGeo = new THREE.IcosahedronGeometry(0.048, 0);
    const prismFrame = new THREE.Mesh(
      prismGeo,
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        wireframe: true,
        metalness: 0.95,
        roughness: 0.15,
      })
    );
    prismFrame.position.y = 0.048;
    terrariumGroup.add(prismFrame);

    // Faceted Glass Panels
    const prismGlass = new THREE.Mesh(
      prismGeo,
      new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        roughness: 0.08,
        metalness: 0.1,
        transparent: true,
        opacity: 0.28,
      })
    );
    prismGlass.position.y = 0.048;
    terrariumGroup.add(prismGlass);

    // Dark organic soil mound
    const terrariumSoilMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.042, 0.016, 16),
      new THREE.MeshStandardMaterial({ color: 0x1f1610, roughness: 0.95 })
    );
    terrariumSoilMesh.position.y = 0.018;
    terrariumGroup.add(terrariumSoilMesh);

    // Succulent Rosette Petals (Emerald Jade)
    const terrariumSucculentMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.45,
      metalness: 0.08,
    });
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.020, 6), terrariumSucculentMat);
      petal.position.set(Math.cos(angle) * 0.016, 0.032, Math.sin(angle) * 0.016);
      petal.rotation.z = Math.cos(angle) * 0.45;
      petal.rotation.x = -Math.sin(angle) * 0.45;
      terrariumGroup.add(petal);
    }

    // Glowing Quartz Crystal Spikes inside Terrarium
    const terrariumCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.15,
      metalness: 0.9,
    });
    [[-0.012, 0.008], [0.010, -0.012]].forEach(([cx, cz], i) => {
      const crystal = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.005, 0.032, 6), terrariumCrystalMat);
      crystal.position.set(cx, 0.036, cz);
      crystal.rotation.z = i === 0 ? 0.25 : -0.20;
      terrariumGroup.add(crystal);
    });

    deskGroup.add(terrariumGroup);
    registerInteractive(terrariumGroup, 'terrarium', '🌿 BIOPHILIC BOTANICAL PRISM // DESK TERRARIUM');

    // =========================================================================
    // 14. REAR WALL CYBER NEON ART EMBLEM & SOFT WALL WASH
    // =========================================================================
    const neonGroup = new THREE.Group();
    neonGroup.position.set(0, 2.50, -3.14);

    // Floating Smoked Obsidian Acrylic Plaque
    const neonBackplate = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.48, 0.012),
      new THREE.MeshStandardMaterial({
        color: 0x1a263d,
        roughness: 0.18,
        metalness: 0.88,
        transparent: true,
        opacity: 0.75,
      })
    );
    neonGroup.add(neonBackplate);

    // Glowing Neon Glass Outline (Cyan & Magenta Dual Tube)
    const neonOuterFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.32, 0.42, 0.006),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.8,
        wireframe: true,
      })
    );
    neonOuterFrame.position.z = 0.008;
    neonGroup.add(neonOuterFrame);

    // Magenta Inner Neon Accent Bars
    const magentaNeonMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xdb2777,
      emissiveIntensity: 2.2,
    });
    [-0.95, 0.95].forEach((nx) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.32, 0.008), magentaNeonMat);
      bar.position.set(nx, 0, 0.010);
      neonGroup.add(bar);
    });

    // Soft Ambient Cyan Wall Wash Point Light
    const neonWashLight = new THREE.PointLight(0x06b6d4, 1.2, 2.8);
    neonWashLight.position.set(0, 0, 0.12);
    neonGroup.add(neonWashLight);

    roomGroup.add(neonGroup);

    scene.add(deskGroup);

    // ========================================================
    // LAYER 4: ERGONOMIC GAMING CHAIR & SCULPTED DEVELOPER
    // ========================================================
    const devGroup = new THREE.Group();
    devGroup.position.set(0.0, 0, 1.02);

    // 1. Ergonomic Gaming Chair (Refined curves & contours with Executive Cognac Saddle Leather)
    const chairLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x8a4522, // Rich executive cognac saddle leather
      map: leatherTex,
      roughness: 0.38,
      metalness: 0.15,
    });
    const chairAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // Vibrant cyber racing accents
      emissive: 0x0284c7,
      emissiveIntensity: 1.8,
    });
    const chairGoldStitch = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber gold perimeter stitching
      emissive: 0xd97706,
      emissiveIntensity: 1.4,
    });

    // Seat Bucket Base Cushion (top surface at y = 0.52)
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.50), chairLeatherMat);
    chairSeat.position.set(0, 0.48, 0);
    chairSeat.castShadow = true;
    chairSeat.receiveShadow = true;
    devGroup.add(chairSeat);

    // Raised Leather Perimeter Welt Piping Cord around Seat
    const seatWelt = new THREE.Mesh(
      new THREE.BoxGeometry(0.575, 0.012, 0.515),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.38, metalness: 0.4 })
    );
    seatWelt.position.set(0, 0.52, 0);
    devGroup.add(seatWelt);

    // Side Thigh Bolsters (Outside pelvis width, zero clipping)
    const bolsterL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.48), chairLeatherMat);
    bolsterL.position.set(-0.28, 0.53, 0);
    bolsterL.rotation.z = -0.22;
    devGroup.add(bolsterL);

    const bolsterR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.48), chairLeatherMat);
    bolsterR.position.set(0.28, 0.53, 0);
    bolsterR.rotation.z = 0.22;
    devGroup.add(bolsterR);

    // Bolster Edge Piping Lines
    [-0.31, 0.31].forEach((bx) => {
      const bPiping = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.48, 8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
      );
      bPiping.position.set(bx, 0.59, 0);
      bPiping.rotation.x = Math.PI / 2;
      devGroup.add(bPiping);
    });

    // Chair Backrest with Spine Contour (Behind torso)
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.82, 0.08), chairLeatherMat);
    chairBack.position.set(0, 0.94, 0.20);
    chairBack.rotation.x = -0.06;
    chairBack.castShadow = true;
    devGroup.add(chairBack);

    // Perimeter Welt Piping on Backrest
    const backWelt = new THREE.Mesh(
      new THREE.BoxGeometry(0.535, 0.835, 0.012),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.3 })
    );
    backWelt.position.set(0, 0.94, 0.24);
    backWelt.rotation.x = -0.06;
    devGroup.add(backWelt);

    // Ergonomic Spine Exoskeleton Support Ribs (Herman Miller / High-End Studio Ergonomics)
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.94, roughness: 0.18 });
    const spineColumn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.78, 0.04), spineMat);
    spineColumn.position.set(0, 0.94, 0.26);
    spineColumn.rotation.x = -0.06;
    devGroup.add(spineColumn);

    [-0.22, -0.07, 0.07, 0.22].forEach((ry) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.36 - Math.abs(ry) * 0.25, 0.022, 0.024), spineMat);
      rib.position.set(0, 0.94 + ry, 0.265 + ry * 0.05);
      rib.rotation.x = -0.06;
      devGroup.add(rib);
    });

    // Lumbar Wings (Outside torso width)
    const chairWingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.12), chairLeatherMat);
    chairWingL.position.set(-0.26, 0.92, 0.18);
    chairWingL.rotation.y = 0.25;
    chairWingL.rotation.x = -0.06;
    devGroup.add(chairWingL);

    const chairWingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.12), chairLeatherMat);
    chairWingR.position.set(0.26, 0.92, 0.18);
    chairWingR.rotation.y = -0.25;
    chairWingR.rotation.x = -0.06;
    devGroup.add(chairWingR);

    // Contoured Headrest & Lumbar Cushion
    const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.08), chairLeatherMat);
    headRest.position.set(0, 1.40, 0.24);
    devGroup.add(headRest);

    const lumbarCushion = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.05), chairLeatherMat);
    lumbarCushion.position.set(0, 0.70, 0.16);
    devGroup.add(lumbarCushion);

    // Lumbar Cushion Adjustment Straps & Metal Buckles
    [-0.06, 0.06].forEach((sy) => {
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.016, 0.008),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
      );
      strap.position.set(0, 0.70 + sy, 0.17);
      devGroup.add(strap);

      const buckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.022, 0.012),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
      );
      buckle.position.set(0.14, 0.70 + sy, 0.175);
      devGroup.add(buckle);
    });

    // Cyber Accent Stripes
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.68, 0.085), chairAccentMat);
    stripeL.position.set(-0.16, 0.94, 0.205);
    stripeL.rotation.x = -0.06;
    devGroup.add(stripeL);

    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.68, 0.085), chairAccentMat);
    stripeR.position.set(0.16, 0.94, 0.205);
    stripeR.rotation.x = -0.06;
    devGroup.add(stripeR);

    // Headrest stitched gold emblem
    const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.01), chairGoldStitch);
    emblem.position.set(0, 1.40, 0.285);
    devGroup.add(emblem);

    // 4D Adjustable Armrests (Outside arms, non-interfering)
    const armColL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 12), steelLegMat);
    armColL.position.set(-0.31, 0.60, 0.02);
    devGroup.add(armColL);

    const armPadL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.24), chairLeatherMat);
    armPadL.position.set(-0.31, 0.72, 0.02);
    devGroup.add(armPadL);

    const armColR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 12), steelLegMat);
    armColR.position.set(0.31, 0.60, 0.02);
    devGroup.add(armColR);

    const armPadR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.24), chairLeatherMat);
    armPadR.position.set(0.31, 0.72, 0.02);
    devGroup.add(armPadR);

    // Tilt Mechanism Box & Tension Adjustment Knobs under Seat
    const tiltMech = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.07, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.94, roughness: 0.18 })
    );
    tiltMech.position.set(0, 0.40, 0);
    devGroup.add(tiltMech);

    // Height Adjust Lever Paddle
    const lever = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.13, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.92, roughness: 0.2 })
    );
    lever.position.set(0.15, 0.40, 0.04);
    lever.rotation.z = Math.PI / 2.5;
    devGroup.add(lever);

    // Chair Gas Lift & Heavy-Duty 5-Star Wheelbase
    const starPole = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.38, 16), steelLegMat);
    starPole.position.set(0, 0.22, 0);
    devGroup.add(starPole);

    // 5 Wheelbase Arms & Hooded Twin-Wheel Casters
    for (let w = 0; w < 5; w++) {
      const angle = (w / 5) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.028, 0.32), steelLegMat);
      arm.position.set(Math.sin(angle) * 0.16, 0.055, Math.cos(angle) * 0.16);
      arm.rotation.y = angle;
      devGroup.add(arm);

      // Hooded Caster Housing & Wheels
      const caster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.022, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 })
      );
      caster.position.set(Math.sin(angle) * 0.32, 0.024, Math.cos(angle) * 0.32);
      caster.rotation.z = Math.PI / 2;
      devGroup.add(caster);
    }

    // =========================================================================
    // 2. REALISTIC HD DEVELOPER AT WORK (ANATOMICALLY SCULPTED, REAL LEGS, TYPING)
    // =========================================================================
    const { devCharGroup, devRig } = createRealisticDeveloper();
    devGroup.add(devCharGroup);
    scene.add(devGroup);
    developerRigRef.current = devRig;

    // =========================================================================
    // 3. REALISTIC 3D CAT IN ROOM (SCANDINAVIAN BED, JUMPING TOWER, PLAY ROUTINE)
    // =========================================================================
    const { roomSetup: catRoomGroup, catRig } = createRealisticCat();
    scene.add(catRoomGroup);
    catRigRef.current = catRig;
    registerInteractive(catRig.catGroup, 'cat', '🐾 GINGER TABBY CAT // CLICK TO PET & PURR');
    registerInteractive(catRoomGroup, 'cat', '🐾 GINGER TABBY CAT // CLICK TO PET & PURR');

    // =========================================================================
    // 3B. CUTE WELCOME DRONE AT TOP RIGHT OF THE ROOM
    // =========================================================================
    const { droneGroup, droneRig } = createWelcomeDrone();
    scene.add(droneGroup);
    droneRigRef.current = droneRig;
    registerInteractive(droneGroup, 'drone', '🛸 WELCOME DRONE // CLICK TO EXECUTE 360° AERIAL STUNT');
    // =========================================================================
    // LAYER 5: 3D HOLOGRAPHIC OBJECTS IN PHYSICAL WORLD SPACE
    // =========================================================================
    // 1. Floating Holographic AI Core (Left)
    const holoAI = new THREE.Group();
    holoAI.position.set(-2.0, 1.85, 0.1);

    const ringMatAI = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.4,
      wireframe: true,
    });
    const aiRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.008, 8, 32), ringMatAI);
    const aiRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 8, 32), ringMatAI);
    aiRing2.rotation.x = Math.PI / 3;
    const aiCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), ringMatAI);
    holoAI.add(aiRing1);
    holoAI.add(aiRing2);
    holoAI.add(aiCore);
    scene.add(holoAI);

    // 2. Artificially Made 3D Geometric Star Pendant Luminaires (Suspended from Ceiling on Right)
    const createArtisanStarFixture = (scale = 1.0) => {
      const starPendant = new THREE.Group();

      const starBrassMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Warm brushed architectural brass
        metalness: 0.94,
        roughness: 0.15,
      });
      const starGlowMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a, // Luminous incandescent filament glow
      });

      // Internal warm glowing filament core bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 16, 16), starGlowMat);
      starPendant.add(bulb);

      // Central faceted polyhedral chassis
      const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075 * scale, 0), starBrassMat);
      starPendant.add(coreMesh);

      // Extract unique vertices of icosahedron to project 12 faceted star points
      const icoGeo = new THREE.IcosahedronGeometry(0.075 * scale, 0);
      const posAttr = icoGeo.attributes.position;
      const vertexNormals: THREE.Vector3[] = [];
      for (let i = 0; i < posAttr.count; i++) {
        const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        if (!vertexNormals.some((u) => u.distanceTo(v) < 0.001)) {
          vertexNormals.push(v);
        }
      }

      // Add 12 tapered pyramid star spikes radiating along the vertex normals
      const spikeLen = 0.13 * scale;
      const spikeRad = 0.034 * scale;
      const coneGeo = new THREE.ConeGeometry(spikeRad, spikeLen, 4);

      vertexNormals.forEach((v) => {
        const spike = new THREE.Mesh(coneGeo, starBrassMat);
        const norm = v.clone().normalize();
        spike.position.copy(norm.clone().multiplyScalar(v.length() + spikeLen * 0.44));
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
        starPendant.add(spike);

        // Micro jewel luminous tip on each star spike
        const jewelTip = new THREE.Mesh(new THREE.SphereGeometry(0.006 * scale, 8, 8), starGlowMat);
        jewelTip.position.copy(norm.clone().multiplyScalar(v.length() + spikeLen));
        starPendant.add(jewelTip);
      });

      return starPendant;
    };

    const hangingStarsData: { group: THREE.Group; star: THREE.Group }[] = [];

    // Configuration for Artificially Made Hanging Stars suspended from ceiling (both right side and left side)
    const starsConfig = [
      // Right-side hanging stars suspended from ceiling
      { x: 2.15, z: 0.22, starY: 1.95, scale: 1.05, lightIntensity: 1.5, lightDist: 4.0 },
      { x: 2.80, z: -0.42, starY: 2.36, scale: 0.82, lightIntensity: 1.1, lightDist: 3.2 },
      // Left-side hanging stars suspended from ceiling
      { x: -2.15, z: 0.25, starY: 1.95, scale: 1.05, lightIntensity: 1.5, lightDist: 4.0 },
      { x: -2.85, z: -0.38, starY: 2.32, scale: 0.82, lightIntensity: 1.1, lightDist: 3.2 },
    ];

    const ceilingY = 3.34; // Exact underside of ceiling slab

    starsConfig.forEach((cfg) => {
      // Top-level fixture group anchored at ceiling (x, ceilingY, z) for physics pendulum sway
      const fixtureGroup = new THREE.Group();
      fixtureGroup.position.set(cfg.x, ceilingY, cfg.z);

      // 1. Ceiling Canopy / Mounting Rose (Flush turned brass disc on ceiling)
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 });
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), canopyMat);
      canopy.position.set(0, -0.01, 0);
      fixtureGroup.add(canopy);

      const cableDrop = ceilingY - cfg.starY; // Distance from ceiling to star center

      // 2. High-Tension Braided Suspension Cable
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x223046, metalness: 0.88, roughness: 0.25 });
      const suspCable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0035, 0.0035, cableDrop - 0.06, 8),
        cableMat
      );
      suspCable.position.set(0, -(cableDrop - 0.06) / 2 - 0.02, 0);
      fixtureGroup.add(suspCable);

      // 3. Socket Hardware Collar & Strain Relief Grip
      const socketMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.18 });
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.06, 16), socketMat);
      socket.position.set(0, -cableDrop + 0.08, 0);
      fixtureGroup.add(socket);

      // 4. The 3D Artificially Made Star Body
      const star = createArtisanStarFixture(cfg.scale);
      star.position.set(0, -cableDrop, 0);
      fixtureGroup.add(star);

      // 5. Warm Point Light inside the star
      const starLight = new THREE.PointLight(0xf59e0b, cfg.lightIntensity, cfg.lightDist, 1.8);
      starLight.position.set(0, -cableDrop, 0);
      fixtureGroup.add(starLight);

      scene.add(fixtureGroup);
      hangingStarsData.push({ group: fixtureGroup, star });
    });

    hangingStarsRef.current = hangingStarsData;
    holoObjectsRef.current = [holoAI];

    // ==========================================================
    // LAYER 6: SUBTLE ATMOSPHERIC DUST PARTICLES
    // ==========================================================
    const particleCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const col1 = new THREE.Color(0x38bdf8);
    const col2 = new THREE.Color(0xf59e0b);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 10;
      pPositions[i * 3 + 1] = 0.2 + Math.random() * 4.0;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const c = Math.random() > 0.5 ? col1 : col2;
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    // ===============================================
    // CANVAS TEXTURE RENDER LOOP (HIGH-RES RETINA IDE & TELEMETRY)
    // ===============================================
    let codeLineOffset = 0;
    const codeLines = [
      '// PIYUSH KUMAR — PRODUCTION AUTONOMOUS ENGINE',
      'import { AutonomousAI, NeuralMesh } from "@core/systems";',
      'import { DistributedCluster, EdgeStream } from "@engine/network";',
      'import { WebGLRenderer, ShaderPipeline } from "@graphics/3d";',
      '',
      'export class IntelligentWorkstation extends AutonomousAI {',
      '  private readonly stack = ["TypeScript", "React", "Three.js", "AI", "Cloud"];',
      '  private clusterHealth: HealthCheck = "OPTIMAL_100%";',
      '',
      '  async deployExperience(): Promise<ClusterStatus> {',
      '    const cluster = await DistributedCluster.synchronize({ region: "global" });',
      '    console.log("[SYS]: Edge latency verified at 3.8ms");',
      '    return cluster.synthesize(this.stack);',
      '  }',
      '}',
      '>> [READY]: 18 Edge microservices connected. 0 errors.',
      '>> [STREAM]: Neural network weights verified (99.99%)',
      '>> [BUILD]: Fast HMR reload pipeline initialized in 14ms',
    ];

    let renderCycle = 0;
    const renderCanvasTextures = (time: number, forceAll: boolean = false) => {
      const tex = texturesRef.current;
      if (!tex) return;

      const { centerCtx, centerTex, leftCtx, leftTex, rightMonCtx, rightMonTex, rightCtx, rightTex, laptopCtx, laptopTex } = tex;

      const doCenter = forceAll || renderCycle === 0;
      const doLaptopAndCooler = forceAll || renderCycle === 1;
      const doLeft = forceAll || renderCycle === 2;
      const doRightMon = forceAll || renderCycle === 3;
      if (!forceAll) {
        renderCycle = (renderCycle + 1) % 4;
      }

      // 1. Center Ultrawide Screen: Authentic Professional IDE (1536x700 buffer)
      if (doCenter) {
        if (benchmarkTimerRef.current > 0) {
          centerCtx.fillStyle = '#060a14';
          centerCtx.fillRect(0, 0, 1536, 700);

          // Glowing Benchmark Header
          centerCtx.fillStyle = '#10b981';
          centerCtx.font = 'bold 26px "SF Mono", monospace';
          centerCtx.fillText('⚡ AI NEURAL CLUSTER BENCHMARK RUNNING...', 50, 56);

          centerCtx.fillStyle = '#38bdf8';
          centerCtx.font = 'bold 16px "SF Mono", monospace';
          centerCtx.fillText('TOTAL COMPUTE: 1,540 TFLOPS (FP16 Tensor Cores Active)  |  Latency: 1.4ms', 50, 88);

          // Multi-core stress test bars
          for (let b = 0; b < 8; b++) {
            const by = 118 + b * 64;
            const barW = 800 + Math.sin(time * 8 + b * 0.9) * 450;
            centerCtx.fillStyle = '#1e293b';
            centerCtx.fillRect(50, by, 1436, 42);

            const bGrad = centerCtx.createLinearGradient(50, 0, 1486, 0);
            bGrad.addColorStop(0, '#0284c7');
            bGrad.addColorStop(0.5, '#38bdf8');
            bGrad.addColorStop(1, '#a855f7');
            centerCtx.fillStyle = bGrad;
            centerCtx.fillRect(50, by, Math.max(80, barW), 42);

            centerCtx.fillStyle = '#ffffff';
            centerCtx.font = 'bold 15px "SF Mono", monospace';
            centerCtx.fillText(`COMPUTE ENGINE NODE #${b + 1} — ACTIVE LOAD 99.8% [${(barW / 14.36).toFixed(1)}%]`, 70, by + 27);
          }

          centerCtx.fillStyle = '#f59e0b';
          centerCtx.font = 'bold 15px "SF Mono", monospace';
          centerCtx.fillText(`BENCHMARK PROGRESS: ${benchmarkTimerRef.current.toFixed(1)}s REMAINING // ZERO THERMAL THROTTLING`, 50, 672);
          centerTex.needsUpdate = true;
        } else {
          const curFile = CODE_FILES[activeCodeFileIndexRef.current % CODE_FILES.length];
          const activeLines = curFile.lines;

          centerCtx.fillStyle = '#080c14';
          centerCtx.fillRect(0, 0, 1536, 700);

          // Left Activity Bar (x: 0 to 46)
          centerCtx.fillStyle = '#0b101d';
          centerCtx.fillRect(0, 0, 46, 700);
          centerCtx.strokeStyle = '#1e293b';
          centerCtx.lineWidth = 1;
          centerCtx.beginPath();
          centerCtx.moveTo(46, 0);
          centerCtx.lineTo(46, 700);
          centerCtx.stroke();

          // Activity Bar Micro-Icons
          centerCtx.fillStyle = '#38bdf8';
          centerCtx.fillRect(16, 20, 14, 14); // File explorer icon active
          centerCtx.fillStyle = '#64748b';
          centerCtx.fillRect(16, 54, 14, 14); // Search
          centerCtx.fillRect(16, 88, 14, 14); // Git
          centerCtx.fillRect(16, 122, 14, 14); // Debug

          // Sidebar Explorer (x: 46 to 246)
          centerCtx.fillStyle = '#0d1322';
          centerCtx.fillRect(46, 0, 200, 700);
          centerCtx.beginPath();
          centerCtx.moveTo(246, 0);
          centerCtx.lineTo(246, 700);
          centerCtx.stroke();

          centerCtx.fillStyle = '#94a3b8';
          centerCtx.font = 'bold 12px "SF Mono", Monaco, monospace';
          centerCtx.fillText('EXPLORER: WORKSPACE', 58, 28);

          const files = [
            { name: '▾ src', color: '#94a3b8', indent: 0, fileIdx: -1 },
            { name: '  ▾ core', color: '#94a3b8', indent: 10, fileIdx: -1 },
            { name: '    ● AutonomousAI.ts', color: '#38bdf8', indent: 20, fileIdx: 0 },
            { name: '      DistributedCluster.ts', color: '#cbd5e1', indent: 20, fileIdx: 1 },
            { name: '  ▾ components', color: '#94a3b8', indent: 10, fileIdx: -1 },
            { name: '      NeuralShaderPipeline.ts', color: '#cbd5e1', indent: 20, fileIdx: 2 },
            { name: '      Workstation3DScene.tsx', color: '#cbd5e1', indent: 20, fileIdx: 3 },
            { name: '    package.json', color: '#f59e0b', indent: 10, fileIdx: -1 },
            { name: '    tsconfig.json', color: '#38bdf8', indent: 10, fileIdx: -1 },
          ];

          files.forEach((file, idx) => {
            const fy = 60 + idx * 26;
            const isSelected = file.fileIdx === activeCodeFileIndexRef.current;
            if (isSelected) {
              centerCtx.fillStyle = '#1e293b';
              centerCtx.fillRect(46, fy - 18, 200, 26);
            }
            centerCtx.fillStyle = isSelected ? '#38bdf8' : file.color;
            centerCtx.font = isSelected ? 'bold 12px "SF Mono", monospace' : '12px "SF Mono", monospace';
            centerCtx.fillText(file.name, 54 + file.indent, fy);
          });

          // Top Tab Bar (x: 246 to 1536, y: 0 to 42)
          centerCtx.fillStyle = '#0b111e';
          centerCtx.fillRect(246, 0, 1290, 42);

          // Active Tab
          centerCtx.fillStyle = '#162032';
          centerCtx.fillRect(246, 0, 240, 42);
          centerCtx.fillStyle = '#38bdf8';
          centerCtx.fillRect(246, 0, 240, 3); // Cyan top active line
          centerCtx.fillStyle = '#f8fafc';
          centerCtx.font = 'bold 13px "SF Mono", monospace';
          centerCtx.fillText(`● ${curFile.filename}`, 266, 26);

          // Inactive Tabs
          centerCtx.fillStyle = '#64748b';
          centerCtx.font = '12px "SF Mono", monospace';
          centerCtx.fillText('Terminal (pnpm)', 520, 26);
          centerCtx.fillText('Benchmark (1540 TFLOPS)', 690, 26);

          // Breadcrumb line (y: 42 to 68)
          centerCtx.fillStyle = '#090e18';
          centerCtx.fillRect(246, 42, 1290, 26);
          centerCtx.fillStyle = '#64748b';
          centerCtx.font = '12px "SF Mono", monospace';
          centerCtx.fillText(`src  ›  ${curFile.filename}  ›  language: ${curFile.lang}`, 266, 60);

          // Code Lines & Gutter (y: 70 to 660)
          centerCtx.font = '15px "SF Mono", Menlo, Consolas, monospace';
          for (let l = 0; l < 15; l++) {
            const lineIdx = (Math.floor(codeLineOffset) + l) % activeLines.length;
            const lineText = activeLines[lineIdx];
            const yPos = 100 + l * 36;

            // Gutter line number
            centerCtx.fillStyle = '#475569';
            centerCtx.fillText(String(l + 1).padStart(2, ' '), 258, yPos);

            // Syntax Highlighting
            if (lineText.startsWith('//') || lineText.startsWith('>>') || lineText.startsWith(' *') || lineText.startsWith('/*')) {
              centerCtx.fillStyle = '#10b981';
            } else if (lineText.includes('import') || lineText.includes('export') || lineText.includes('class') || lineText.includes('async') || lineText.includes('return') || lineText.includes('private') || lineText.includes('const') || lineText.includes('interface')) {
              centerCtx.fillStyle = '#c084fc';
            } else if (lineText.includes('IntelligentWorkstation') || lineText.includes('AutonomousAI') || lineText.includes('DistributedCluster') || lineText.includes('ClusterStatus') || lineText.includes('ShaderPipeline') || lineText.includes('NeuralMesh')) {
              centerCtx.fillStyle = '#38bdf8';
            } else if (lineText.includes('"TypeScript"') || lineText.includes('"OPTIMAL_100%"') || lineText.includes('"@core/systems"') || lineText.includes('"global"')) {
              centerCtx.fillStyle = '#34d399';
            } else if (lineText.includes('deployExperience') || lineText.includes('synchronize') || lineText.includes('synthesize') || lineText.includes('console.log')) {
              centerCtx.fillStyle = '#fbbf24';
            } else {
              centerCtx.fillStyle = '#f1f5f9';
            }
            centerCtx.fillText(lineText, 296, yPos);
          }

          // Realistic pulsing IDE typing cursor on the active highlighted line
          const activeLineIdx = 7;
          const activeLineText = activeLines[(Math.floor(codeLineOffset) + activeLineIdx) % activeLines.length] || '';
          const activeCursorX = 296 + centerCtx.measureText(activeLineText).width + 6;
          const activeCursorY = 100 + activeLineIdx * 36 - 16;
          if (Math.floor(time * 3.5) % 2 === 0) {
            centerCtx.fillStyle = '#38bdf8';
            centerCtx.fillRect(activeCursorX, activeCursorY, 3, 20);
          }

          // Bottom Status Bar (y: 666 to 700)
          centerCtx.fillStyle = '#0b111e';
          centerCtx.fillRect(0, 666, 1536, 34);
          centerCtx.fillStyle = '#38bdf8';
          centerCtx.font = 'bold 12px "SF Mono", monospace';
          centerCtx.fillText(`  ⚡ main*  |  UTF-8  |  ${curFile.lang}  |  Prettier: ✓  |  ESLint: 0 warnings  |  Port: 3000  |  14ms latency`, 20, 688);

          centerTex.needsUpdate = true;
        }
      }

      // 2. Dedicated Laptop Screen: macOS Terminal & Live Cluster Status (1024x640 buffer)
      if (doLaptopAndCooler && laptopCtx && laptopTex) {
        if (laptopTestTimerRef.current > 0) {
          laptopCtx.fillStyle = '#060a14';
          laptopCtx.fillRect(0, 0, 1024, 640);

          laptopCtx.fillStyle = '#101a2f';
          laptopCtx.fillRect(0, 0, 1024, 40);
          laptopCtx.fillStyle = '#10b981';
          laptopCtx.font = 'bold 15px "SF Mono", monospace';
          laptopCtx.fillText('⚡ VITEST V2.1.0 — PARALLEL WORKER SUITE', 24, 26);

          const testRows = [
            '✓ src/ai/AutonomousAgent.test.ts (24 passed, 110ms)',
            '✓ src/graphics/RaytracerPipeline.test.ts (18 passed, 84ms)',
            '✓ src/network/DistributedCluster.test.ts (32 passed, 142ms)',
            '✓ src/audio/CyberSynthesizer.test.ts (14 passed, 46ms)',
            '✓ src/physics/KinematicsRig.test.ts (28 passed, 98ms)',
            '✓ src/system/FastHMRPipeline.test.ts (26 passed, 62ms)',
          ];

          testRows.forEach((row, rIdx) => {
            laptopCtx.fillStyle = '#10b981';
            laptopCtx.font = 'bold 15px "SF Mono", monospace';
            laptopCtx.fillText(row, 24, 86 + rIdx * 46);
          });

          laptopCtx.fillStyle = '#38bdf8';
          laptopCtx.font = 'bold 16px "SF Mono", monospace';
          laptopCtx.fillText('Test Suites: 6 passed, 6 total', 24, 400);
          laptopCtx.fillText('Tests:       142 passed, 142 total (100% test coverage)', 24, 432);
          laptopCtx.fillText('Snapshots:   0 total', 24, 464);
          laptopCtx.fillText('Duration:    542ms [Zero flakiness, verified production ready]', 24, 496);

          laptopCtx.fillStyle = '#1e293b';
          laptopCtx.fillRect(24, 530, 976, 32);
          laptopCtx.fillStyle = '#10b981';
          laptopCtx.fillRect(24, 530, 976, 32);
          laptopCtx.fillStyle = '#000000';
          laptopCtx.font = 'bold 14px "SF Mono", monospace';
          laptopCtx.fillText('✔ ALL 142 TEST SUITES EXECUTED AND PASSED CLEANLY', 40, 552);

          laptopTex.needsUpdate = true;
        } else {
          laptopCtx.fillStyle = '#060912';
          laptopCtx.fillRect(0, 0, 1024, 640);

          // macOS Top Menu Bar (y: 0 to 30)
          laptopCtx.fillStyle = '#0d1527';
          laptopCtx.fillRect(0, 0, 1024, 30);
          laptopCtx.fillStyle = '#f8fafc';
          laptopCtx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
          laptopCtx.fillText('  Terminal  Shell  Edit  View  Window  Help', 20, 20);
          laptopCtx.fillStyle = '#94a3b8';
          laptopCtx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
          laptopCtx.fillText('WiFi [●]   100% [⚡]   Sat 10:42 AM', 810, 20);

          // macOS Window Header (y: 30 to 66)
          laptopCtx.fillStyle = '#101a2f';
          laptopCtx.fillRect(0, 30, 1024, 36);

          // Window Control Buttons (Red, Amber, Green)
          laptopCtx.fillStyle = '#ef4444';
          laptopCtx.beginPath();
          laptopCtx.arc(22, 48, 6, 0, Math.PI * 2);
          laptopCtx.fill();

          laptopCtx.fillStyle = '#f59e0b';
          laptopCtx.beginPath();
          laptopCtx.arc(42, 48, 6, 0, Math.PI * 2);
          laptopCtx.fill();

          laptopCtx.fillStyle = '#10b981';
          laptopCtx.beginPath();
          laptopCtx.arc(62, 48, 6, 0, Math.PI * 2);
          laptopCtx.fill();

          laptopCtx.fillStyle = '#94a3b8';
          laptopCtx.font = '13px "SF Mono", monospace';
          laptopCtx.fillText('piyush@macbook-pro:~ (zsh) — 110×36 [CLICK TO RUN TESTS]', 86, 52);

          // Terminal Prompt & Command
          laptopCtx.fillStyle = '#10b981';
          laptopCtx.font = 'bold 15px "SF Mono", monospace';
          laptopCtx.fillText('➜  piyush-portfolio git:(main) ✗ pnpm dev:cluster', 24, 98);

          // Live Real-Time Mini Waveform Graph (CPU / Memory throughput)
          laptopCtx.fillStyle = '#091122';
          laptopCtx.fillRect(24, 114, 976, 110);
          laptopCtx.strokeStyle = '#1e293b';
          laptopCtx.strokeRect(24, 114, 976, 110);

          // Waveform gradient fill
          const waveGrad = laptopCtx.createLinearGradient(0, 114, 0, 224);
          waveGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
          waveGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

          laptopCtx.beginPath();
          laptopCtx.moveTo(24, 224);
          for (let x = 0; x <= 976; x += 8) {
            const waveY = 175 + Math.sin(x * 0.02 + time * 5) * 22 + Math.cos(x * 0.01 - time * 2) * 12;
            laptopCtx.lineTo(24 + x, waveY);
          }
          laptopCtx.lineTo(1000, 224);
          laptopCtx.closePath();
          laptopCtx.fillStyle = waveGrad;
          laptopCtx.fill();

          // Waveform stroke line
          laptopCtx.strokeStyle = '#38bdf8';
          laptopCtx.lineWidth = 2.0;
          laptopCtx.beginPath();
          for (let x = 0; x <= 976; x += 8) {
            const waveY = 175 + Math.sin(x * 0.02 + time * 5) * 22 + Math.cos(x * 0.01 - time * 2) * 12;
            if (x === 0) laptopCtx.moveTo(24 + x, waveY);
            else laptopCtx.lineTo(24 + x, waveY);
          }
          laptopCtx.stroke();

          laptopCtx.fillStyle = '#38bdf8';
          laptopCtx.font = 'bold 13px "SF Mono", monospace';
          laptopCtx.fillText('CPU: 14.2% (12 Cores @ 5.2GHz) | RAM: 8.6GB / 64GB DDR5 | NET: 480 Mbps | GPU: RTX 4090 (28°C)', 36, 138);

          // Terminal Log Lines
          const terminalLogs = [
            '● [CORE]: Neural cluster synchronized with edge mesh (3.8ms latency)',
            '▲ [REACT 19]: Streaming SSR pipelines active and mounted on client',
            '✓ [CONTAINER]: Docker sandbox healthy — all microservices optimal',
            '⚡ [VITE]: Hot reload websocket established on http://localhost:3000',
            '★ [DATABASE]: Production Supabase connection verified & authenticated',
            '➜  Ready in 248 ms. Watching for continuous file changes...',
          ];

          laptopCtx.font = '14px "SF Mono", monospace';
          terminalLogs.forEach((log, idx) => {
            laptopCtx.fillStyle = idx === 0 ? '#38bdf8' : idx === 1 ? '#a855f7' : idx === 2 ? '#34d399' : idx === 3 ? '#f59e0b' : idx === 4 ? '#38bdf8' : '#e2e8f0';
            laptopCtx.fillText(log, 24, 260 + idx * 36);
          });

          // Blinking Cursor
          if (Math.floor(time * 3) % 2 === 0) {
            laptopCtx.fillStyle = '#38bdf8';
            laptopCtx.fillRect(24, 480, 10, 18);
          }

          laptopTex.needsUpdate = true;
        }
      }

      // 3. Left Portrait Screen: Telemetry & Cluster Architecture (768x1210 buffer)
      if (doLeft) {
        leftCtx.fillStyle = '#070b14';
        leftCtx.fillRect(0, 0, 768, 1210);

        const curTelemetryMode = telemetryModeRef.current;
        let modeTitle = 'SYSTEM TELEMETRY & EDGE CLUSTERS';
        let modeSub = 'PIYUSH KUMAR // HIGH-PERFORMANCE COMPUTING NODE [CLICK TO SWITCH]';
        let servers = [
          { name: 'SRV 01 // CLOUD INFERENCE', base: 64, color: '#38bdf8' },
          { name: 'SRV 02 // NEURAL PIPELINE', base: 82, color: '#a855f7' },
          { name: 'SRV 03 // VECTOR EMBEDDINGS', base: 45, color: '#34d399' },
          { name: 'SRV 04 // SUPABASE POSTGRES', base: 92, color: '#f59e0b' },
          { name: 'SRV 05 // EDGE CACHE PROXY', base: 38, color: '#38bdf8' },
          { name: 'SRV 06 // WEBSOCKET BUS', base: 74, color: '#06b6d4' },
        ];

        if (curTelemetryMode === 1) {
          modeTitle = 'NVIDIA RTX 4090 GPU ACCELERATORS';
          modeSub = 'DUAL GPU RIG // 48GB GDDR6X // 32,768 CUDA CORES [CLICK TO SWITCH]';
          servers = [
            { name: 'GPU 01 // CORE CLOCK (2,840 MHz)', base: 88, color: '#10b981' },
            { name: 'GPU 01 // VRAM ALLOCATION (21.4 GB)', base: 89, color: '#38bdf8' },
            { name: 'GPU 01 // TENSOR CORES (AUTOPRECISION)', base: 96, color: '#a855f7' },
            { name: 'GPU 02 // CORE CLOCK (2,810 MHz)', base: 76, color: '#10b981' },
            { name: 'GPU 02 // VRAM ALLOCATION (18.2 GB)', base: 75, color: '#38bdf8' },
            { name: 'GPU 02 // TENSOR CORES (BF16 GEMM)', base: 84, color: '#a855f7' },
          ];
        } else if (curTelemetryMode === 2) {
          modeTitle = 'NVMe GEN5 RAID 0 & FIBER NETWORK';
          modeSub = '14,000 MB/s READ // 100GbE QSFP28 BACKPLANE [CLICK TO SWITCH]';
          servers = [
            { name: 'NVMe 01 // SEQUENTIAL READ (14.2 GB/s)', base: 94, color: '#f59e0b' },
            { name: 'NVMe 02 // SEQUENTIAL WRITE (11.8 GB/s)', base: 82, color: '#f59e0b' },
            { name: 'RAID CACHE // DIRECT MEMORY DMA', base: 98, color: '#38bdf8' },
            { name: 'ETH 01 // 100GbE CLUSTER BACKBONE', base: 72, color: '#34d399' },
            { name: 'P99 LATENCY // INTRA-NODE (0.12ms)', base: 95, color: '#10b981' },
            { name: 'PACKET LOSS // ZERO BUFFER DROPS', base: 100, color: '#10b981' },
          ];
        }

        leftCtx.fillStyle = '#10b981';
        leftCtx.font = 'bold 22px "SF Mono", monospace';
        leftCtx.fillText(modeTitle, 28, 48);

        leftCtx.fillStyle = '#64748b';
        leftCtx.font = '14px "SF Mono", monospace';
        leftCtx.fillText(modeSub, 28, 76);

        servers.forEach((srv, b) => {
          const barVal = srv.base + Math.sin(time * 2.5 + b) * 12;
          const by = 110 + b * 115;

          leftCtx.fillStyle = '#94a3b8';
          leftCtx.font = 'bold 15px "SF Mono", monospace';
          leftCtx.fillText(srv.name, 28, by);

          leftCtx.fillStyle = '#f8fafc';
          leftCtx.font = '14px "SF Mono", monospace';
          leftCtx.fillText(`${Math.floor(barVal)}%  |  ${(barVal * 0.18).toFixed(1)}ms`, 610, by);

          // Track bar
          leftCtx.fillStyle = '#1e293b';
          leftCtx.fillRect(28, by + 12, 712, 28);

          // Fill gradient bar
          const srvGrad = leftCtx.createLinearGradient(28, 0, 740, 0);
          srvGrad.addColorStop(0, '#0284c7');
          srvGrad.addColorStop(1, srv.color);

          leftCtx.fillStyle = srvGrad;
          leftCtx.fillRect(28, by + 12, Math.max(20, (barVal / 100) * 712), 28);
        });

        // Bottom Network I/O Sparkline
        leftCtx.fillStyle = '#0f172a';
        leftCtx.fillRect(28, 830, 712, 330);
        leftCtx.strokeStyle = '#1e293b';
        leftCtx.strokeRect(28, 830, 712, 330);

        leftCtx.fillStyle = '#38bdf8';
        leftCtx.font = 'bold 16px "SF Mono", monospace';
        leftCtx.fillText('REAL-TIME NETWORK I/O BANDWIDTH (420 MB/s)', 48, 865);

        leftCtx.strokeStyle = '#38bdf8';
        leftCtx.lineWidth = 2.5;
        leftCtx.beginPath();
        for (let x = 0; x <= 672; x += 12) {
          const gy = 1000 + Math.sin(x * 0.04 + time * 4) * 55 + Math.cos(x * 0.02 - time * 2) * 25;
          if (x === 0) leftCtx.moveTo(48 + x, gy);
          else leftCtx.lineTo(48 + x, gy);
        }
        leftCtx.stroke();

        leftTex.needsUpdate = true;
      }

      // 3.5 Right Portrait Screen: Neural Pipeline & GPU Accelerator Telemetry (768x1210 buffer)
      if (doRightMon && rightMonCtx && rightMonTex) {
        rightMonCtx.fillStyle = '#070b14';
        rightMonCtx.fillRect(0, 0, 768, 1210);

        // Header Title & GPU Identifier
        rightMonCtx.fillStyle = '#38bdf8';
        rightMonCtx.font = 'bold 22px "SF Mono", monospace';
        rightMonCtx.fillText('AI / NEURAL ACCELERATOR & GPU RIG', 28, 48);

        rightMonCtx.fillStyle = '#94a3b8';
        rightMonCtx.font = '14px "SF Mono", monospace';
        rightMonCtx.fillText('NVIDIA RTX 4090 // 24GB GDDR6X // 16,384 CUDA CORES', 28, 76);

        // Active Inference Loss Curve & Learning Waveform
        rightMonCtx.fillStyle = '#0f172a';
        rightMonCtx.fillRect(28, 96, 712, 220);
        rightMonCtx.strokeStyle = '#1e293b';
        rightMonCtx.strokeRect(28, 96, 712, 220);

        rightMonCtx.fillStyle = '#34d399';
        rightMonCtx.font = 'bold 15px "SF Mono", monospace';
        rightMonCtx.fillText('LIVE MODEL LOSS & INFERENCE LATENCY (1.8ms)', 48, 128);

        rightMonCtx.fillStyle = '#cbd5e1';
        rightMonCtx.font = '13px "SF Mono", monospace';
        rightMonCtx.fillText('Tokens/sec: 144.2 t/s  |  Batch: 32  |  P99: 12.4ms', 48, 150);

        // Animated gradient waveform graph
        const lossGrad = rightMonCtx.createLinearGradient(0, 160, 0, 300);
        lossGrad.addColorStop(0, 'rgba(56, 189, 248, 0.38)');
        lossGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

        rightMonCtx.beginPath();
        rightMonCtx.moveTo(48, 300);
        for (let x = 0; x <= 672; x += 10) {
          const ly = 240 + Math.sin(x * 0.03 + time * 3.5) * 32 + Math.cos(x * 0.015 - time * 2) * 16;
          rightMonCtx.lineTo(48 + x, ly);
        }
        rightMonCtx.lineTo(720, 300);
        rightMonCtx.closePath();
        rightMonCtx.fillStyle = lossGrad;
        rightMonCtx.fill();

        rightMonCtx.strokeStyle = '#38bdf8';
        rightMonCtx.lineWidth = 2.2;
        rightMonCtx.beginPath();
        for (let x = 0; x <= 672; x += 10) {
          const ly = 240 + Math.sin(x * 0.03 + time * 3.5) * 32 + Math.cos(x * 0.015 - time * 2) * 16;
          if (x === 0) rightMonCtx.moveTo(48 + x, ly);
          else rightMonCtx.lineTo(48 + x, ly);
        }
        rightMonCtx.stroke();

        // Tensor Core Performance Gauges
        const tensorEngines = [
          { name: 'FP16 TENSOR CORES (AUTOPRECISION)', base: 92, color: '#38bdf8' },
          { name: 'BF16 MATRIX MULTIPLY (GEMM PIPELINE)', base: 86, color: '#a855f7' },
          { name: 'INT8 QUANTIZED INFERENCE (TRITON)', base: 95, color: '#34d399' },
          { name: 'VRAM MEMORY BANDWIDTH (1,008 GB/s)', base: 78, color: '#f59e0b' },
        ];

        tensorEngines.forEach((eng, idx) => {
          const barVal = eng.base + Math.sin(time * 2.2 + idx * 1.5) * 6;
          const ey = 345 + idx * 72;

          rightMonCtx.fillStyle = '#94a3b8';
          rightMonCtx.font = 'bold 13px "SF Mono", monospace';
          rightMonCtx.fillText(eng.name, 28, ey);

          rightMonCtx.fillStyle = '#f8fafc';
          rightMonCtx.font = '13px "SF Mono", monospace';
          rightMonCtx.fillText(`${Math.floor(barVal)}%`, 695, ey);

          rightMonCtx.fillStyle = '#1e293b';
          rightMonCtx.fillRect(28, ey + 8, 712, 18);

          const engGrad = rightMonCtx.createLinearGradient(28, 0, 740, 0);
          engGrad.addColorStop(0, '#0284c7');
          engGrad.addColorStop(1, eng.color);

          rightMonCtx.fillStyle = engGrad;
          rightMonCtx.fillRect(28, ey + 8, Math.max(16, (barVal / 100) * 712), 18);
        });

        // Active Neural Model Workloads
        rightMonCtx.fillStyle = '#0f172a';
        rightMonCtx.fillRect(28, 655, 712, 235);
        rightMonCtx.strokeStyle = '#1e293b';
        rightMonCtx.strokeRect(28, 655, 712, 235);

        rightMonCtx.fillStyle = '#38bdf8';
        rightMonCtx.font = 'bold 15px "SF Mono", monospace';
        rightMonCtx.fillText('DEPLOYED MODEL WORKLOADS (ONLINE)', 48, 688);

        const models = [
          { name: '● LLM Transformer Engine', tag: '128k ctx • 70B Quant', state: 'ONLINE // OPTIMAL', col: '#10b981' },
          { name: '▲ Latent Spatial Denoiser', tag: '60 FPS • Realtime', state: 'STREAMING', col: '#a855f7' },
          { name: '✓ Neural Feature Extractor', tag: 'Vision Transformer', state: 'READY // 0 ERR', col: '#38bdf8' },
          { name: '⚡ Spectral Audio Latent Synth', tag: '48kHz Low-Latency', state: 'HOT STANDBY', col: '#f59e0b' },
        ];

        models.forEach((mod, mIdx) => {
          const my = 720 + mIdx * 40;
          rightMonCtx.fillStyle = mod.col;
          rightMonCtx.font = 'bold 14px "SF Mono", monospace';
          rightMonCtx.fillText(mod.name, 48, my);

          rightMonCtx.fillStyle = '#94a3b8';
          rightMonCtx.font = '13px "SF Mono", monospace';
          rightMonCtx.fillText(mod.tag, 290, my);

          rightMonCtx.fillStyle = mod.col;
          rightMonCtx.font = 'bold 12px "SF Mono", monospace';
          rightMonCtx.fillText(mod.state, 550, my);
        });

        // 24GB GDDR6X High-Density Memory Matrix (4x8 Grid Blocks)
        rightMonCtx.fillStyle = '#0f172a';
        rightMonCtx.fillRect(28, 910, 712, 240);
        rightMonCtx.strokeStyle = '#1e293b';
        rightMonCtx.strokeRect(28, 910, 712, 240);

        rightMonCtx.fillStyle = '#34d399';
        rightMonCtx.font = 'bold 15px "SF Mono", monospace';
        rightMonCtx.fillText('VRAM ALLOCATION MAP (18.6GB / 24GB ALLOCATED)', 48, 940);

        const cols = 8;
        const rows = 4;
        const cellW = 76;
        const cellH = 26;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const blockIndex = r * cols + c;
            const bx = 48 + c * (cellW + 7);
            const by = 960 + r * (cellH + 7);

            // Colored status blocks
            const isHot = blockIndex < 22;
            const isCold = blockIndex >= 22 && blockIndex < 28;
            rightMonCtx.fillStyle = isHot ? '#0284c7' : isCold ? '#334155' : '#1e293b';
            rightMonCtx.fillRect(bx, by, cellW, cellH);

            rightMonCtx.fillStyle = isHot ? '#e0f2fe' : '#64748b';
            rightMonCtx.font = '10px "SF Mono", monospace';
            rightMonCtx.fillText(`B-${blockIndex}`, bx + 6, by + 16);
          }
        }

        // Bottom GPU Engine Status Strip
        rightMonCtx.fillStyle = '#070b14';
        rightMonCtx.fillRect(28, 1162, 712, 36);
        rightMonCtx.fillStyle = '#38bdf8';
        rightMonCtx.font = 'bold 13px "SF Mono", monospace';
        rightMonCtx.fillText('CUDA 12.4 | PYTORCH 2.3 | TENSORRT-LLM | TRITON ENGINE', 48, 1184);

        rightMonTex.needsUpdate = true;
      }

      // 4. AIO Liquid Cooler LCD Pump Screen (High-Res 512x512 circular telemetry display)
      if (doLaptopAndCooler) {
      rightCtx.fillStyle = '#050914';
      rightCtx.fillRect(0, 0, 512, 512);

      const cx = 256;
      const cy = 256;
      const radius = 190;

      // Outer radial background track
      rightCtx.strokeStyle = '#1e293b';
      rightCtx.lineWidth = 12;
      rightCtx.beginPath();
      rightCtx.arc(cx, cy, radius, 0.75 * Math.PI, 2.25 * Math.PI);
      rightCtx.stroke();

      // Dynamic Coolant Flow Arc (Realistic soft blue-cyan gradient)
      const tempVal = 38 + Math.sin(time * 0.8) * 3;
      const arcProgress = ((tempVal - 25) / 60) * 1.5 * Math.PI;
      const grad = rightCtx.createLinearGradient(60, 60, 450, 450);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.7, '#38bdf8');
      grad.addColorStop(1, '#818cf8');

      rightCtx.strokeStyle = grad;
      rightCtx.lineWidth = 12;
      rightCtx.lineCap = 'round';
      rightCtx.beginPath();
      rightCtx.arc(cx, cy, radius, 0.75 * Math.PI, 0.75 * Math.PI + arcProgress);
      rightCtx.stroke();

      // Inner circular dial bezel
      rightCtx.fillStyle = '#080e1c';
      rightCtx.beginPath();
      rightCtx.arc(cx, cy, radius - 20, 0, Math.PI * 2);
      rightCtx.fill();

      rightCtx.strokeStyle = '#1e293b';
      rightCtx.lineWidth = 2.5;
      rightCtx.beginPath();
      rightCtx.arc(cx, cy, radius - 20, 0, Math.PI * 2);
      rightCtx.stroke();

      // Digital Temperature Readout
      rightCtx.fillStyle = '#f8fafc';
      rightCtx.font = 'bold 74px "SF Mono", monospace';
      rightCtx.textAlign = 'center';
      rightCtx.fillText(`${Math.round(tempVal)}°C`, cx, cy + 22);

      rightCtx.fillStyle = '#38bdf8';
      rightCtx.font = 'bold 18px "SF Mono", monospace';
      rightCtx.fillText('CPU TEMP', cx, cy - 48);

      rightCtx.fillStyle = '#10b981';
      rightCtx.font = '16px "SF Mono", monospace';
      rightCtx.fillText('5.4 GHz • 2450 RPM', cx, cy + 62);

      rightCtx.fillStyle = '#94a3b8';
      rightCtx.font = '13px "SF Mono", monospace';
      rightCtx.fillText('COOLANT 31°C // OPTIMAL', cx, cy + 88);

      rightTex.needsUpdate = true;
      }
    };

    // ===============================================
    // ANIMATION & CAMERA INTERPOLATION LOOP
    // ===============================================
    let lastTexUpdate = 0;
    let shadowFrameCounter = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      // Check if paused because user has scrolled into portfolio or tab is hidden
      if (scrollProgressRef.current >= 0.88 || isEnteredRef.current || (typeof document !== 'undefined' && document.hidden)) {
        isRunningRef.current = false;
        return;
      }

      isRunningRef.current = true;
      frameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const delta = Math.min(clock.getDelta(), 0.08);

      // Canvas texture updates: throttled smoothly to 1.0s interval and paused completely during active 360-degree user drag
      // This reserves 100% of GPU compute and bandwidth for 60/120 FPS camera orbit
      if (!orbitState.current.isDragging && (elapsedTime - lastTexUpdate > 1.0)) {
        codeLineOffset += 1.0;
        renderCanvasTextures(elapsedTime, false);
        lastTexUpdate = elapsedTime;
      }

      // Update Active Action Timers
      if (benchmarkTimerRef.current > 0) {
        benchmarkTimerRef.current = Math.max(0, benchmarkTimerRef.current - 0.016);
      }
      if (laptopTestTimerRef.current > 0) {
        laptopTestTimerRef.current = Math.max(0, laptopTestTimerRef.current - 0.016);
      }
      if (fanBoostTimerRef.current > 0) {
        fanBoostTimerRef.current = Math.max(0, fanBoostTimerRef.current - 0.016);
      }
      if (steamBurstTimerRef.current > 0) {
        steamBurstTimerRef.current = Math.max(0, steamBurstTimerRef.current - 0.016);
      }
      if (keyboardRippleTimerRef.current > 0) {
        keyboardRippleTimerRef.current = Math.max(0, keyboardRippleTimerRef.current - 0.016);
      }

      // Rotate PC Fans (with Turbo Boost when fanBoostTimer is active)
      const fanSpeedMultiplier = fanBoostTimerRef.current > 0 ? 3.8 : 1.0;
      fansRef.current.forEach((fan, idx) => {
        fan.rotation.x += 0.15 * fanSpeedMultiplier * (idx % 2 === 0 ? 1 : -1);
      });

      // Studio Monitor Woofers bass pulsation
      if (isLofiPlayingRef.current) {
        const bassPulse = 1.0 + Math.sin(elapsedTime * 9.0) * 0.08 + Math.cos(elapsedTime * 18.0) * 0.04;
        woofersRef.current.forEach((w) => {
          w.scale.set(bassPulse, 1.0, bassPulse);
        });
      } else {
        woofersRef.current.forEach((w) => {
          w.scale.set(1.0, 1.0, 1.0);
        });
      }

      // Mechanical Keyboard RGB ripple effect
      if (keyGlowRef.current) {
        if (keyboardRippleTimerRef.current > 0) {
          const glowHue = (elapsedTime * 3.5) % 1;
          (keyGlowRef.current.material as THREE.MeshBasicMaterial).color.setHSL(glowHue, 1.0, 0.65);
          (keyGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85 + Math.sin(elapsedTime * 24) * 0.15;
        } else {
          (keyGlowRef.current.material as THREE.MeshBasicMaterial).color.set(0x38bdf8);
          (keyGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.55;
        }
      }

      // Animate Live Seated HD Realistic Developer (typing, natural breathing, hand & head kinematics)
      if (developerRigRef.current) {
        updateDeveloperAnimation(developerRigRef.current, elapsedTime);
      }

      // Animate Realistic 3D Cat (sleeping beside chair, stretching, sitting up, and exploring the room)
      if (catRigRef.current) {
        updateCatAnimation(catRigRef.current, elapsedTime);
      }

      // Animate Cute Flying Welcome Drone (top right of room)
      if (droneRigRef.current) {
        updateWelcomeDroneAnimation(droneRigRef.current, elapsedTime);
      }

      // Animate RAM RGB sticks
      ramLedsRef.current.forEach((ram, idx) => {
        const hue = (elapsedTime * 0.5 + idx * 0.25) % 1;
        const col = new THREE.Color().setHSL(hue, 0.9, 0.55);
        (ram.material as THREE.MeshStandardMaterial).color.copy(col);
        (ram.material as THREE.MeshStandardMaterial).emissive.copy(col);
      });

      // Animate Steam particles (accelerates when espresso burst is active, throttled to avoid CPU-GPU vertex stalls)
      if (steamParticlesRef.current && (steamBurstTimerRef.current > 0 || (Math.floor(elapsedTime * 20) % 3 === 0))) {
        const steamSpeed = steamBurstTimerRef.current > 0 ? 0.0036 : 0.0012;
        const posAttr = steamParticlesRef.current.geometry.attributes.position;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3 + 1] += steamSpeed;
          if (arr[i * 3 + 1] > 0.25) {
            arr[i * 3 + 1] = 0.05;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Rotate 3D Holographic Orbitals
      holoObjectsRef.current.forEach((holo) => {
        holo.rotation.y += 0.015;
        holo.rotation.x += 0.01;
        holo.position.y = 1.85 + Math.sin(elapsedTime * 1.5) * 0.05;
      });

      // Natural subtle physics pendulum sway & rotational drift for Hanging Stars
      hangingStarsRef.current.forEach((item, idx) => {
        const swaySpeed = 0.82 + idx * 0.24;
        item.group.rotation.z = Math.sin(elapsedTime * swaySpeed + idx * 1.6) * 0.024;
        item.group.rotation.x = Math.cos(elapsedTime * (swaySpeed * 0.72) + idx * 1.1) * 0.015;
        item.star.rotation.y += 0.0035 * (idx === 0 ? 1 : -1);
      });

      // Gentle particle drift
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.015;
      }

      // Rotate RC Micro Helicopter Main Rotor
      if (helicopterRotorRef.current) {
        helicopterRotorRef.current.rotation.y += 0.28;
      }

      // Animate Mini 3D Snorlax Desktop Mascot (Breathing & Hop Reactivity)
      if (snorlaxMascotRef.current) {
        if (snorlaxHopTimerRef.current > 0) {
          snorlaxHopTimerRef.current -= delta;
          const hopElapsed = 1.6 - snorlaxHopTimerRef.current;
          const hopBounce = Math.abs(Math.sin(hopElapsed * Math.PI * 3)) * 0.038;
          snorlaxMascotRef.current.position.y = 0.785 + hopBounce;
          snorlaxMascotRef.current.rotation.y = Math.sin(hopElapsed * Math.PI * 4) * 0.22;
        } else {
          snorlaxMascotRef.current.position.y = 0.785;
          snorlaxMascotRef.current.rotation.y = Math.sin(elapsedTime * 0.8) * 0.05;
        }
      }

      // Animate Levitating Cyber Quantum Core
      if (quantumCoreRef.current) {
        const floatY = Math.sin(elapsedTime * 2.2) * 0.009;
        quantumCoreRef.current.position.y = 0.855 + floatY;
        quantumCoreRef.current.rotation.y += 0.018;
        quantumCoreRef.current.rotation.x = Math.sin(elapsedTime * 1.5) * 0.14;
      }

      // Live Dynamic Atomic Chronometer Canvas Texture Update (sync to 1.0s ticks)
      if (clockCanvasRef.current) {
        clockUpdateTimerRef.current += delta;
        if (clockUpdateTimerRef.current > 1.0) {
          clockUpdateTimerRef.current = 0;
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const ss = String(now.getSeconds()).padStart(2, '0');
          const { ctx, texture } = clockCanvasRef.current;

          ctx.fillStyle = '#060a12';
          ctx.fillRect(0, 0, 256, 128);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.strokeRect(3, 3, 250, 122);

          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 13px "SF Mono", monospace';
          ctx.fillText('LIVE ATOMIC CHRONO', 18, 28);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 44px "SF Mono", monospace';
          ctx.fillText(`${hh}:${mm}:${ss}`, 18, 78);

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 12px "SF Mono", monospace';
          ctx.fillText('NTP STRATUM-1 • 60 FPS', 18, 108);

          texture.needsUpdate = true;
        }
      }

      // Pulse Skyscraper Aviation Warning Beacons
      if (beaconLightsRef.current.length > 0) {
        const beaconPulse = 0.3 + 0.7 * (Math.sin(elapsedTime * 2.8) > 0.35 ? 1 : 0.15);
        beaconLightsRef.current.forEach((bMat) => {
          bMat.opacity = beaconPulse;
        });
      }

      // Animate Metropolis Highway Traffic Streams
      if (trafficMeshRef.current.length > 0) {
        trafficMeshRef.current.forEach((tMesh, idx) => {
          const speed = idx % 2 === 0 ? -0.09 : 0.11;
          tMesh.position.x += speed;
          if (tMesh.position.x > 22) tMesh.position.x = -22;
          if (tMesh.position.x < -22) tMesh.position.x = 22;
        });
      }

      // Frame-rate independent buttery smooth damping factors
      const orbitLerp = 1.0 - Math.exp(-8.5 * delta);
      const camLerp = 1.0 - Math.exp(-7.2 * delta);
      const scrollLerp = 1.0 - Math.exp(-8.0 * delta);

      // Smooth scroll interpolation (eliminates discrete scroll step jumps)
      smoothedScrollRef.current = THREE.MathUtils.lerp(
        smoothedScrollRef.current,
        scrollProgressRef.current,
        scrollLerp
      );
      const currentProgress = smoothedScrollRef.current;

      // Update 360-degree orbit state with inertia damping and auto-rotate support
      const os = orbitState.current;
      if (isAutoRotate360Ref.current && !os.isDragging) {
        os.targetYaw -= 0.35 * delta;
      }
      if (!os.isDragging) {
        os.targetYaw += os.yawVel;
        os.targetPitch += os.pitchVel;
        const decay = Math.exp(-5.8 * delta);
        os.yawVel *= decay;
        os.pitchVel *= decay;
      }
      // Clamping pitch for natural viewing angles (looking up at ceiling stars, looking down to desk & chair)
      os.targetPitch = Math.max(-0.75, Math.min(0.85, os.targetPitch));

      // Buttery smooth drag interpolation: highly responsive yet completely free of micro-jitter
      const dragSmoothing = 1.0 - Math.exp(-24.0 * delta);
      if (os.isDragging) {
        os.yaw = THREE.MathUtils.lerp(os.yaw, os.targetYaw, dragSmoothing);
        os.pitch = THREE.MathUtils.lerp(os.pitch, os.targetPitch, dragSmoothing);
      } else {
        os.yaw = THREE.MathUtils.lerp(os.yaw, os.targetYaw, orbitLerp);
        os.pitch = THREE.MathUtils.lerp(os.pitch, os.targetPitch, orbitLerp);
      }
      os.distance = THREE.MathUtils.lerp(os.distance || 5.451, os.targetDistance || 5.451, orbitLerp);
      os.focalX = THREE.MathUtils.lerp(os.focalX ?? 0.0, os.targetFocalX ?? 0.0, orbitLerp);
      os.focalY = THREE.MathUtils.lerp(os.focalY ?? 1.16, os.targetFocalY ?? 1.16, orbitLerp);
      os.focalZ = THREE.MathUtils.lerp(os.focalZ ?? 0.0, os.targetFocalZ ?? 0.0, orbitLerp);

      // Compute Multi-Keyframe Camera Position & LookAt from smoothed progress
      const currentMouse = mousePosRef.current || { x: 0, y: 0 };
      const { position: targetPos, lookAt: targetLook, fov } = interpolateCamera(currentProgress);

      // Mouse Parallax Damping
      const mouseDamping = Math.max(0, 1 - currentProgress * 1.2);
      const mouseX = (currentMouse.x ?? 0) * 0.35 * mouseDamping;
      const mouseY = -(currentMouse.y ?? 0) * 0.2 * mouseDamping;

      // Calculate 360-degree spherical position around dynamic focal point
      const focalPoint = new THREE.Vector3(os.focalX, os.focalY, os.focalZ);
      const baseR = os.distance; // Smooth distance with zoom & preset awareness
      const baseAzimuth = 0.4800; // atan2(2.5, 4.8)
      const baseElevation = 0.1213; // asin((1.82 - 1.16) / baseR)

      const theta = baseAzimuth + os.yaw;
      const phi = baseElevation + os.pitch;

      // Adaptive radial fit so 360° lateral orbit stays cleanly framed inside the chamber
      const sideFit = 1.0 - 0.22 * Math.pow(Math.sin(theta), 2);
      const effectiveR = baseR * sideFit;

      const orbitCamX = focalPoint.x + effectiveR * Math.cos(phi) * Math.sin(theta);
      const orbitCamY = focalPoint.y + effectiveR * Math.sin(phi);
      const orbitCamZ = focalPoint.z + effectiveR * Math.cos(phi) * Math.cos(theta);

      const orbitLookX = focalPoint.x;
      const orbitLookY = focalPoint.y + Math.sin(phi) * 0.3;
      const orbitLookZ = focalPoint.z;

      // Blend smoothly between 360 orbit at landing page and straight flight track during scroll
      const orbitBlend = Math.max(0, 1 - currentProgress * 2.2);

      // Subtle cinematic breathing float for lifelike immersion
      const idleFloatY = Math.sin(elapsedTime * 0.75) * 0.014 * orbitBlend;
      const idleFloatX = Math.cos(elapsedTime * 0.55) * 0.010 * orbitBlend;

      const finalTargetX = THREE.MathUtils.lerp(targetPos.x + mouseX + idleFloatX, orbitCamX + mouseX * 0.5 + idleFloatX, orbitBlend);
      const finalTargetY = THREE.MathUtils.lerp(targetPos.y + mouseY + idleFloatY, orbitCamY + mouseY * 0.5 + idleFloatY, orbitBlend);
      const finalTargetZ = THREE.MathUtils.lerp(targetPos.z, orbitCamZ, orbitBlend);

      const finalLookX = THREE.MathUtils.lerp(targetLook.x + mouseX * 0.2, orbitLookX + mouseX * 0.1, orbitBlend);
      const finalLookY = THREE.MathUtils.lerp(targetLook.y, orbitLookY, orbitBlend);
      const finalLookZ = THREE.MathUtils.lerp(targetLook.z, orbitLookZ, orbitBlend);

      const activeCamLerp = os.isDragging ? (1.0 - Math.exp(-22.0 * delta)) : camLerp;
      currentCamPos.current.lerp(new THREE.Vector3(finalTargetX, finalTargetY, finalTargetZ), activeCamLerp);
      currentCamLook.current.lerp(new THREE.Vector3(finalLookX, finalLookY, finalLookZ), activeCamLerp);

      camera.position.copy(currentCamPos.current);
      camera.lookAt(currentCamLook.current);
      camera.fov = fov;
      camera.updateProjectionMatrix();

      // Emissive screen light scaling with proximity
      if (screenLightsRef.current) {
        const boost = 1 + currentProgress * 1.2;
        screenLightsRef.current.centerLight.intensity = 3.6 * boost;
        screenLightsRef.current.leftLight.intensity = 2.2 * boost;
        screenLightsRef.current.rightMonLight.intensity = 2.2 * boost;
      }

      // Dynamic transparency adjustment for side walls during tilt mode:
      // While viewing in tilt mode (dragging/orbiting, elevation pitch, or lateral viewing angles),
      // the side walls remain vibrantly red while smoothly turning transparent to reveal
      // the complete workstation interior without obstruction!
      if (leftWallMatRef.current && rightWallMatRef.current) {
        const tiltIntensity = Math.min(
          1.0,
          Math.abs(os.pitch) * 2.2 + Math.abs(os.yaw) * 1.1 + (os.isDragging ? 0.35 : 0)
        );

        const camX = currentCamPos.current.x;
        // If camera swings towards left or tilts, increase left wall transparency
        const leftAngleFactor = camX < -0.6 ? Math.min(1.0, (-camX - 0.6) / 2.8) : 0;
        const targetLeftOpacity = THREE.MathUtils.lerp(
          0.34,
          0.14,
          Math.max(tiltIntensity, leftAngleFactor)
        );
        leftWallMatRef.current.opacity = THREE.MathUtils.lerp(
          leftWallMatRef.current.opacity,
          targetLeftOpacity,
          0.12
        );

        // If camera swings towards right or tilts, increase right wall transparency
        const rightAngleFactor = camX > 0.6 ? Math.min(1.0, (camX - 0.6) / 2.8) : 0;
        const targetRightOpacity = THREE.MathUtils.lerp(
          0.34,
          0.14,
          Math.max(tiltIntensity, rightAngleFactor)
        );
        rightWallMatRef.current.opacity = THREE.MathUtils.lerp(
          rightWallMatRef.current.opacity,
          targetRightOpacity,
          0.12
        );

        if (sideTrimMatRef.current) {
          const targetTrimOpacity = THREE.MathUtils.lerp(0.42, 0.18, tiltIntensity);
          sideTrimMatRef.current.opacity = THREE.MathUtils.lerp(
            sideTrimMatRef.current.opacity,
            targetTrimOpacity,
            0.12
          );
        }
      }

      // Throttled shadow map update: zero shadow passes during active orbit drag for smooth 60/120 FPS
      if (!os.isDragging) {
        shadowFrameCounter++;
        if (shadowFrameCounter % 3 === 0) {
          renderer.shadowMap.needsUpdate = true;
        }
      }

      // Direct native WebGL hardware rendering
      renderer.render(scene, camera);
    };

    // 1. Initial draw on mount: all screens rendered once with complete high-def visuals
    renderCanvasTextures(0, true);

    // Start initial loop
    animateRef.current = animate;
    if (scrollProgressRef.current < 0.88 && !isEnteredRef.current) {
      animate();
    }

    // Raycaster for 3D Hardware Interactivity & Tooltip Feedback
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    let lastHoveredLabel = '';

    // Trigger functional reaction when hardware is clicked
    const triggerInteraction = (type: string) => {
      const showToast = (msg: string) => {
        setActionToast({ message: msg, id: Date.now() });
      };

      switch (type) {
        case 'center_monitor':
          benchmarkTimerRef.current = 6.0;
          cyberAudio.playClickConfirm();
          showToast('🚀 1,540 TFLOPS AI BENCHMARK INITIATED — ALL FP16 TENSOR CORES AT 99.8% LOAD');
          break;

        case 'left_monitor':
          telemetryModeRef.current = (telemetryModeRef.current + 1) % 3;
          cyberAudio.playClickConfirm();
          if (telemetryModeRef.current === 0) {
            showToast('🌐 TELEMETRY: EDGE CLUSTER MICROSERVICES & LIVE INFERENCE NODES');
          } else if (telemetryModeRef.current === 1) {
            showToast('⚡ TELEMETRY: DUAL NVIDIA RTX 4090 GPU CLOCKS & VRAM THROUGHPUT');
          } else {
            showToast('💾 TELEMETRY: NVMe GEN5 RAID 0 & 100GbE FIBER BACKBONE');
          }
          break;

        case 'right_monitor':
          activeCodeFileIndexRef.current = (activeCodeFileIndexRef.current + 1) % CODE_FILES.length;
          cyberAudio.playClickConfirm();
          showToast(`📂 REPOSITORY: SWITCHED TO ${CODE_FILES[activeCodeFileIndexRef.current].filename}`);
          break;

        case 'macbook':
          laptopTestTimerRef.current = 6.0;
          cyberAudio.playClickConfirm();
          showToast('⚡ MACBOOK PRO M3 MAX: VITEST PARALLEL WORKER SUITE RUNNING (142/142 TESTS PASSED)');
          break;

        case 'pc_rig':
          fanBoostTimerRef.current = 7.0;
          cyberAudio.playClickConfirm();
          showToast('🌀 TURBO LIQUID COOLING ENGAGED: FANS ACCELERATING TO 3,200 RPM (24°C SUB-AMBIENT)');
          break;

        case 'lamp': {
          const nextMood = (lightingMoodRef.current + 1) % WORKSTATION_LIGHT_MOODS.length;
          cyberAudio.playLampSwitch(true);
          applyLightingMood(nextMood, true);
          onLightingMoodChangeRef.current?.(nextMood);
          break;
        }

        case 'audio_interface':
          cyberAudio.playClickConfirm();
          showToast('🎛️ FOCUSRITE SCARLETT 18i20: PREAMP GAIN OPTIMIZED (+4dBu REFERENCE HEADROOM)');
          break;

        case 'headphones':
          cyberAudio.playClickConfirm();
          showToast('🎧 SENNHEISER REFERENCE AUDIO: 20Hz - 45kHz FLAT MONITORING PROFILE ENGAGED');
          break;

        case 'keyboard':
          keyboardRippleTimerRef.current = 4.0;
          cyberAudio.playKeyboardClack();
          showToast('⌨️ CUSTOM CNC 65% MECHANICAL KEYBOARD: 140 WPM CODE FLOW (LUBED HOLY PANDAS)');
          break;

        case 'mouse':
          cyberAudio.playClickConfirm();
          showToast('🖱️ ERGONOMIC MASTER MOUSE: 26,000 DPI SENSOR CALIBRATED TO 4,000Hz POLLING RATE');
          break;

        case 'speakers':
          isLofiPlayingRef.current = !isLofiPlayingRef.current;
          if (isLofiPlayingRef.current) {
            cyberAudio.startLofiBeat();
            showToast('🎵 KRK STUDIO MONITORS: LO-FI AMBIENT SYNTH BEATS ACTIVATED');
          } else {
            cyberAudio.stopLofiBeat();
            showToast('🔇 KRK STUDIO MONITORS: AUDIO MUTED');
          }
          break;

        case 'mug':
          steamBurstTimerRef.current = 6.0;
          cyberAudio.playCoffeeSteam();
          showToast('☕ ARTISAN DOUBLE-SHOT ESPRESSO: STEAM BURST ACTIVATED (+100 CODING ENERGY)');
          break;

        case 'cat':
          if (catRigRef.current) {
            catRigRef.current.petReactTimer = 3.5;
            catRigRef.current.isHovered = true;
          }
          cyberAudio.playPurrAndMeow();
          showToast('🐾 GINGER TABBY PURRING CONTENTEDLY // AFFECTION LEVEL 100%');
          break;

        case 'drone':
          if (droneRigRef.current) {
            droneRigRef.current.stuntTimer = 1.4;
          }
          cyberAudio.playDroneStunt();
          showToast('🛸 WELCOME DRONE: EXECUTING 360° AERIAL STUNT & TURBO ROTOR BOOST');
          break;

        case 'snorlax_mascot':
          snorlaxHopTimerRef.current = 1.6;
          cyberAudio.playClickConfirm();
          showToast('💤 MINI SNORLAX: HAPPY HOP & CHIRP (+200 REST & CODING STAMINA)');
          break;

        case 'quantum_core':
          cyberAudio.playClickConfirm();
          showToast('⚡ QUANTUM AI CORE: MAGNETIC LEVITATION OVERCLOCKED (128 QUBITS COHERENCE)');
          break;

        case 'desk_clock':
          cyberAudio.playClickConfirm();
          showToast('⏱️ ATOMIC TIMEPIECE: SYNCHRONIZED TO NTP STRATUM-1 REFERENCE');
          break;

        case 'terrarium':
          cyberAudio.playClickConfirm();
          showToast('🌿 BIOPHILIC BOTANICAL PRISM: DESKTOP AIR PURIFIED (100% OXYGEN SATURATION)');
          break;

        default:
          break;
      }
    };

    // 360-Degree Unified Interactive Drag, Orbit, Touch & Keyboard Navigation
    const onStartDrag = (clientX: number, clientY: number, target: HTMLElement | null) => {
      if (scrollProgressRef.current > 0.85 || isEnteredRef.current) return;
      if (target && target.closest('button, a, input, textarea, select')) {
        return;
      }
      orbitState.current.isDragging = true;
      orbitState.current.startX = clientX;
      orbitState.current.startY = clientY;
      orbitState.current.lastX = clientX;
      orbitState.current.lastY = clientY;
      orbitState.current.yawVel = 0;
      orbitState.current.pitchVel = 0;

      container.style.cursor = 'grabbing';
      if (document.body) {
        document.body.style.cursor = 'grabbing';
      }
    };

    const onMoveDrag = (clientX: number, clientY: number, cancelable: boolean, preventDef: () => void): boolean => {
      mousePosRef.current = {
        x: (clientX / window.innerWidth) * 2 - 1,
        y: (clientY / window.innerHeight) * 2 - 1,
      };

      if (orbitState.current.isDragging) {
        if (cancelable) preventDef();

        const dx = clientX - orbitState.current.lastX;
        const dy = clientY - orbitState.current.lastY;
        orbitState.current.lastX = clientX;
        orbitState.current.lastY = clientY;

        const sensX = 0.0075;
        const sensY = 0.0050;

        orbitState.current.targetYaw -= dx * sensX;
        orbitState.current.targetPitch += dy * sensY;
        orbitState.current.yawVel = -dx * sensX * 0.35;
        orbitState.current.pitchVel = dy * sensY * 0.35;
        setHoveredHud(null);
        return true;
      }
      return false;
    };

    const onEndDrag = (clientX: number, clientY: number) => {
      const dx = Math.abs(clientX - orbitState.current.startX);
      const dy = Math.abs(clientY - orbitState.current.startY);
      const wasClick = dx < 6 && dy < 6;

      if (orbitState.current.isDragging) {
        orbitState.current.isDragging = false;
        container.style.cursor = 'grab';
        if (document.body) {
          document.body.style.cursor = '';
        }
      }

      // If released without significant drag, trigger click interaction
      if (wasClick && scrollProgressRef.current < 0.85 && !isEnteredRef.current) {
        const rect = container.getBoundingClientRect();
        mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseNDC, camera);
        const hits = raycaster.intersectObjects(interactiveMeshesRef.current, false);
        if (hits.length > 0 && hits[0].object.userData?.interactiveType) {
          triggerInteraction(hits[0].object.userData.interactiveType);
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0) return;
      onStartDrag(e.clientX, e.clientY, e.target as HTMLElement | null);
    };

    const handlePointerMove = (e: PointerEvent) => {
      onMoveDrag(e.clientX, e.clientY, e.cancelable, () => {
        if (e.cancelable) e.preventDefault();
      });

      if (!orbitState.current.isDragging) {
        // Interactive Hover Raycasting
        const rect = container.getBoundingClientRect();
        mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouseNDC, camera);
        const hits = raycaster.intersectObjects(interactiveMeshesRef.current, false);
        if (hits.length > 0 && hits[0].object.userData?.label) {
          const label = hits[0].object.userData.label;
          if (label !== lastHoveredLabel) {
            lastHoveredLabel = label;
            cyberAudio.playHoverBlip();
          }
          setHoveredHud({ label, x: e.clientX, y: e.clientY });
          container.style.cursor = 'pointer';
        } else {
          if (lastHoveredLabel !== '') {
            lastHoveredLabel = '';
            setHoveredHud(null);
            container.style.cursor = 'grab';
          }
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      onEndDrag(e.clientX, e.clientY);
    };

    // Touch support for mobile/tablets
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        onStartDrag(touch.clientX, touch.clientY, e.target as HTMLElement | null);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const handled = onMoveDrag(touch.clientX, touch.clientY, e.cancelable, () => {
          if (e.cancelable) e.preventDefault();
        });
        if (handled && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch) {
        onEndDrag(touch.clientX, touch.clientY);
      } else {
        orbitState.current.isDragging = false;
      }
    };

    // Keyboard 360-degree navigation support (Arrow keys or A/D/W/S)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scrollProgressRef.current > 0.85 || isEnteredRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        orbitState.current.targetYaw += 0.08;
        orbitState.current.yawVel = 0.025;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        orbitState.current.targetYaw -= 0.08;
        orbitState.current.yawVel = -0.025;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        orbitState.current.targetPitch += 0.05;
        orbitState.current.pitchVel = 0.018;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        orbitState.current.targetPitch -= 0.05;
        orbitState.current.pitchVel = -0.018;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (orbitState.current.isDragging) {
        e.preventDefault();
      }
    };

    // Attach listeners to window so drag immediately works from anywhere on screen
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);

    // Tab visibility handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunningRef.current = false;
        cancelAnimationFrame(frameIdRef.current);
      } else if (scrollProgressRef.current < 0.88 && !isEnteredRef.current && !isRunningRef.current) {
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Passive scroll sync for instant 120 FPS camera response & wakeup
    const handleScrollSync = () => {
      const scrollY = window.scrollY;
      const trackHeight = window.innerHeight * 1.4;
      const progress = Math.min(1, Math.max(0, scrollY / Math.max(trackHeight, 1)));
      scrollProgressRef.current = progress;
      if (progress < 0.88 && !isEnteredRef.current && !isRunningRef.current) {
        animate();
      }
    };
    window.addEventListener('scroll', handleScrollSync, { passive: true });

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || ('ontouchstart' in window));
      renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio || 1, 2.0) : Math.min(window.devicePixelRatio || 1, 2.5));
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      isRunningRef.current = false;
      animateRef.current = null;
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScrollSync);
      window.removeEventListener('resize', handleResize);
      if (document.body) {
        document.body.style.cursor = '';
      }
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      try {
        renderer.forceContextLoss();
        renderer.dispose();
      } catch (e) {
        // ignore
      }
      scene.clear();
    };
  }, []);

  // Auto-dismiss action toast after 4.2s
  useEffect(() => {
    if (!actionToast) return;
    const t = setTimeout(() => {
      setActionToast(null);
    }, 4200);
    return () => clearTimeout(t);
  }, [actionToast]);

  // Pause / resume loop when user scrolls into or out of 3D workstation view
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
    isEnteredRef.current = isEntered;
    if (mousePos) {
      mousePosRef.current = mousePos;
    }

    if (scrollProgress >= 0.88 || isEntered) {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        cancelAnimationFrame(frameIdRef.current);
      }
    } else {
      if (!isRunningRef.current && animateRef.current && rendererRef.current) {
        animateRef.current();
      }
    }
  }, [scrollProgress, isEntered, mousePos]);

  if (webglError) {
    return (
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#070b14] text-white p-6 z-10 select-none">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-2xl backdrop-blur-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">3D Chamber Standby</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Hardware graphics acceleration was paused by the browser. You can proceed directly into Piyush's portfolio or restart the chamber.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold tracking-wider transition-all cursor-pointer"
            >
              RELOAD CHAMBER
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('main-portfolio-stage');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: window.innerHeight * 2.4, behavior: 'smooth' });
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wider transition-all shadow-lg cursor-pointer"
            >
              ENTER PORTFOLIO
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
        isEntered ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        zIndex: 0,
        touchAction: 'none',
        display: isEntered || scrollProgress >= 0.88 ? 'none' : 'block',
      }}
    >
      {/* Interactive Hover Tooltip / HUD Pin */}
      {hoveredHud && !orbitState.current.isDragging && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-1.5 rounded-md bg-slate-950/90 border border-sky-500/60 shadow-[0_0_20px_rgba(56,189,248,0.4)] backdrop-blur-md transition-transform duration-75"
          style={{
            left: hoveredHud.x,
            top: hoveredHud.y - 12,
          }}
        >
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-xs font-semibold tracking-wider text-sky-200">
              {hoveredHud.label}
            </span>
          </div>
        </div>
      )}

      {/* Floating Action Confirmation Toast */}
      {actionToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-2.5 rounded-lg bg-slate-950/95 border border-emerald-500/70 shadow-[0_0_30px_rgba(16,185,129,0.4)] backdrop-blur-md flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wide text-emerald-300">
              {actionToast.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
