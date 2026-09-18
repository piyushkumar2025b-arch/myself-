import * as THREE from 'three';

export interface WelcomeDroneRig {
  droneGroup: THREE.Group;
  body: THREE.Group;
  rotors: THREE.Group[];
  rotorBlades: THREE.Mesh[];
  bannerGroup: THREE.Group;
  bannerMesh: THREE.Mesh;
  statusLedL: THREE.PointLight;
  statusLedR: THREE.PointLight;
  basePosition: THREE.Vector3;
  bannerCanvasTex: THREE.CanvasTexture;
  stuntTimer?: number;
}

/**
 * Creates a high-resolution procedural canvas texture featuring "Welcome!"
 * in a very cute, rounded, cheerful kawaii font with pastel candy gradients,
 * 3D letter extrusion styling, stars, sparkles, and cute hearts.
 */
function createCuteWelcomeBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Clear background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Cute Rounded Pill / Cloud Bubble Background
  const pad = 16;
  const x = pad;
  const y = pad;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const r = 48; // Rounded corners

  // Glowing Outer Rim
  ctx.save();
  ctx.shadowColor = 'rgba(244, 114, 182, 0.75)'; // Soft neon rose glow
  ctx.shadowBlur = 24;

  // Background semi-translucent glass fill with delicate pastel gradient
  const bgGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  bgGrad.addColorStop(0.0, 'rgba(15, 23, 42, 0.88)'); // Deep slate base
  bgGrad.addColorStop(0.4, 'rgba(30, 27, 75, 0.92)'); // Rich twilight indigo
  bgGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.90)');
  ctx.fillStyle = bgGrad;

  // Rounded rectangle path
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();

  // Vibrant cute border (candy pink to cyber cyan with golden yellow accents)
  const borderGrad = ctx.createLinearGradient(x, y, x + w, y);
  borderGrad.addColorStop(0.0, '#ec4899'); // Hot pink
  borderGrad.addColorStop(0.3, '#f472b6'); // Pastel pink
  borderGrad.addColorStop(0.6, '#38bdf8'); // Sky cyan
  borderGrad.addColorStop(0.85, '#a855f7'); // Lilac purple
  borderGrad.addColorStop(1.0, '#fbbf24'); // Golden yellow
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();

  // Subtle inner decorative dashed stitch line for a cute plushie/kawaii feel
  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2.5;
  const innerR = 40;
  ctx.beginPath();
  ctx.moveTo(x + 14 + innerR, y + 14);
  ctx.lineTo(x + w - 14 - innerR, y + 14);
  ctx.arcTo(x + w - 14, y + 14, x + w - 14, y + 14 + innerR, innerR);
  ctx.lineTo(x + w - 14, y + h - 14 - innerR);
  ctx.arcTo(x + w - 14, y + h - 14, x + w - 14 - innerR, y + h - 14, innerR);
  ctx.lineTo(x + 14 + innerR, y + h - 14);
  ctx.arcTo(x + 14, y + h - 14, x + 14, y + h - 14 - innerR, innerR);
  ctx.lineTo(x + 14, y + 14 + innerR);
  ctx.arcTo(x + 14, y + 14, x + 14 + innerR, y + 14, innerR);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Cute Sparkles, Stars, and Hearts around the banner
  const drawStar = (cx: number, cy: number, spikes: number, outerRad: number, innerRad: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerRad);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRad, cy + Math.sin(rot) * outerRad);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRad, cy + Math.sin(rot) * innerRad);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRad);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawHeart = (hx: number, hy: number, size: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    const d = size;
    ctx.moveTo(hx, hy + d / 4);
    ctx.quadraticCurveTo(hx, hy, hx + d / 4, hy);
    ctx.quadraticCurveTo(hx + d / 2, hy, hx + d / 2, hy + d / 4);
    ctx.quadraticCurveTo(hx + d / 2, hy, hx + (d * 3) / 4, hy);
    ctx.quadraticCurveTo(hx + d, hy, hx + d, hy + d / 4);
    ctx.quadraticCurveTo(hx + d, hy + d / 2, hx + (d * 3) / 4, hy + (d * 3) / 4);
    ctx.lineTo(hx + d / 2, hy + d);
    ctx.lineTo(hx + d / 4, hy + (d * 3) / 4);
    ctx.quadraticCurveTo(hx, hy + d / 2, hx, hy + d / 4);
    ctx.fill();
    ctx.restore();
  };

  // Decorative cute elements
  drawStar(96, 92, 4, 22, 9, '#fbbf24');
  drawStar(canvas.width - 105, 96, 4, 24, 10, '#38bdf8');
  drawStar(145, 235, 4, 18, 7, '#f472b6');
  drawStar(canvas.width - 150, 230, 4, 20, 8, '#fcd34d');
  drawHeart(60, 160, 28, '#f43f5e');
  drawHeart(canvas.width - 100, 165, 28, '#ec4899');
  drawStar(canvas.width / 2 - 270, 72, 4, 14, 6, '#38bdf8');
  drawStar(canvas.width / 2 + 270, 72, 4, 14, 6, '#fbbf24');

  // CUTE "WELCOME!" TEXT
  // Using rounded, bubbly display font fallbacks
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textX = canvas.width / 2;
  const textY = canvas.height / 2 + 4;

  const cuteFont = '900 112px "Fredoka", "Comfortaa", "Nunito", "Quicksand", "Comic Sans MS", "Arial Rounded MT Bold", sans-serif';
  ctx.font = cuteFont;

  // 1. Text Deep 3D Drop Shadow / Extrusion in Rich Violet/Magenta
  ctx.fillStyle = '#4c0519';
  for (let offset = 12; offset >= 2; offset -= 2) {
    ctx.fillText('Welcome! ✨', textX, textY + offset);
  }

  // 2. Thick Outer Border Outline in Deep Cherry
  ctx.strokeStyle = '#831843';
  ctx.lineWidth = 18;
  ctx.lineJoin = 'round';
  ctx.strokeText('Welcome! ✨', textX, textY);

  // 3. Medium Stroke in Bright Neon Pink
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 10;
  ctx.lineJoin = 'round';
  ctx.strokeText('Welcome! ✨', textX, textY);

  // 4. Vibrant Pastel Rainbow Gradient Fill
  const textGrad = ctx.createLinearGradient(textX - 250, textY - 50, textX + 250, textY + 50);
  textGrad.addColorStop(0.0, '#ffffff');
  textGrad.addColorStop(0.2, '#fed7aa'); // Peach
  textGrad.addColorStop(0.45, '#fbcfe8'); // Bubblegum pink
  textGrad.addColorStop(0.7, '#bae6fd'); // Sky cyan
  textGrad.addColorStop(1.0, '#fef08a'); // Butter yellow
  ctx.fillStyle = textGrad;

  // Glowing Text Shadow
  ctx.shadowColor = '#f472b6';
  ctx.shadowBlur = 16;
  ctx.fillText('Welcome! ✨', textX, textY);

  // 5. Specular Top Highlight Streak across the letters for a glossy candy look
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = cuteFont;
  ctx.fillText('Welcome! ✨', textX, textY - 3);

  ctx.restore();

  // Bottom subtitle tag: "HAVE A WONDERFUL TIME" in cute rounded pills
  ctx.save();
  ctx.font = '700 24px "Comfortaa", "Nunito", "Quicksand", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#0ea5e9';
  ctx.shadowBlur = 10;
  ctx.fillText('✦   EXPLORE & ENJOY   ✦', textX, textY + 84);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates the high-tech sci-fi mini drone quadcopter carrying the cute welcome sign.
 */
export function createWelcomeDrone(): { droneGroup: THREE.Group; droneRig: WelcomeDroneRig } {
  const droneGroup = new THREE.Group();

  // Position at top right of the room in front of user view
  // (Room bounds: X ~ 1.95, Y ~ 2.45, Z ~ 0.75)
  const basePosition = new THREE.Vector3(1.95, 2.45, 0.75);
  droneGroup.position.copy(basePosition);

  // Articulated drone body group (for banking and altitude bobbing)
  const body = new THREE.Group();
  droneGroup.add(body);

  // Materials
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Glossy ceramic white chassis
    metalness: 0.85,
    roughness: 0.15,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Dark woven carbon-fiber rotor arms
    metalness: 0.9,
    roughness: 0.35,
  });

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  const magentaGlowMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xf472b6,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  const propMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.55,
    roughness: 0.2,
    metalness: 0.4,
  });

  // 1. Aerodynamic Central Fuselage Pod (Smooth capsule shape)
  const fuselage = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 18, 14),
    chassisMat
  );
  fuselage.scale.set(1.15, 0.55, 1.3);
  fuselage.castShadow = true;
  body.add(fuselage);

  // Upper Aero Dome Cowling
  const aeroDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
  );
  aeroDome.scale.set(1.0, 0.45, 1.1);
  aeroDome.position.set(0, 0.032, -0.01);
  body.add(aeroDome);

  // Cute Visor / Sensor Eye in front of drone (Like a smiling robot drone companion!)
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 3.0,
      metalness: 0.95,
      roughness: 0.05,
    })
  );
  visor.scale.set(1.1, 0.5, 0.6);
  visor.position.set(0, 0.005, 0.095);
  body.add(visor);

  // Visor lens frame
  const visorFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.044, 0.006, 8, 20),
    carbonMat
  );
  visorFrame.scale.set(1.1, 0.5, 1.0);
  visorFrame.position.set(0, 0.005, 0.093);
  body.add(visorFrame);

  // 2. 4 Angled Carbon-Fiber Rotor Strut Arms (X Configuration)
  const armAngles = [
    Math.PI * 0.25, // Front-Right
    Math.PI * 0.75, // Front-Left
    Math.PI * 1.25, // Rear-Left
    Math.PI * 1.75, // Rear-Right
  ];
  const armRadius = 0.22;

  const rotors: THREE.Group[] = [];
  const rotorBlades: THREE.Mesh[] = [];

  armAngles.forEach((angle, i) => {
    const armGroup = new THREE.Group();
    const xPos = Math.cos(angle) * armRadius;
    const zPos = Math.sin(angle) * armRadius;

    // Strut Tube
    const strutLen = Math.hypot(xPos, zPos);
    const strut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.008, strutLen, 8),
      carbonMat
    );
    strut.position.set(xPos * 0.5, 0, zPos * 0.5);
    strut.rotation.z = Math.PI / 2;
    strut.rotation.y = -angle;
    body.add(strut);

    // Motor Nacelle at arm tip
    const motorPod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.022, 0.038, 12),
      chassisMat
    );
    motorPod.position.set(xPos, 0.005, zPos);
    body.add(motorPod);

    // LED Glow Ring on Motor Base
    const isFront = i < 2;
    const ledRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.022, 0.004, 6, 16),
      isFront ? cyanGlowMat : magentaGlowMat
    );
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.set(xPos, -0.012, zPos);
    body.add(ledRing);

    // Rotor Propeller Assembly Group
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(xPos, 0.028, zPos);

    // Center Hub Spinner
    const hub = new THREE.Mesh(
      new THREE.ConeGeometry(0.014, 0.022, 8),
      carbonMat
    );
    rotorGroup.add(hub);

    // Dual Blade Rotor (Curved aerodynamic airfoils)
    const blade1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.003, 0.024),
      propMat
    );
    blade1.position.set(0, 0.006, 0);
    blade1.rotation.y = 0.12; // Pitch angle
    rotorGroup.add(blade1);

    const blade2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.003, 0.18),
      propMat
    );
    blade2.position.set(0, 0.006, 0);
    blade2.rotation.y = 0.12;
    rotorGroup.add(blade2);

    body.add(rotorGroup);
    rotors.push(rotorGroup);
    rotorBlades.push(blade1);
  });

  // 3. Cute Dual Landing Skids
  [-0.075, 0.075].forEach((sideX) => {
    const skidRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.20, 8),
      carbonMat
    );
    skidRail.rotation.x = Math.PI / 2;
    skidRail.position.set(sideX, -0.055, 0);
    body.add(skidRail);

    // Front/Back curved tips
    [-0.10, 0.10].forEach((endZ) => {
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 6, 6),
        chassisMat
      );
      tip.position.set(sideX, -0.052, endZ);
      body.add(tip);

      // Vertical Stanchion Strut connecting fuselage to skid
      const stanchion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0035, 0.0035, 0.045, 6),
        carbonMat
      );
      stanchion.position.set(sideX * 0.9, -0.032, endZ * 0.6);
      stanchion.rotation.z = sideX > 0 ? -0.22 : 0.22;
      body.add(stanchion);
    });
  });

  // 4. Dual High-Tech Pulsing Navigation Lights
  const statusLedL = new THREE.PointLight(0x38bdf8, 1.2, 1.8);
  statusLedL.position.set(-0.16, 0.02, 0.16);
  body.add(statusLedL);

  const statusLedR = new THREE.PointLight(0xf472b6, 1.2, 1.8);
  statusLedR.position.set(0.16, 0.02, 0.16);
  body.add(statusLedR);

  // 5. SUSPENDED CUTE "WELCOME!" DIGITAL BANNER
  const bannerGroup = new THREE.Group();
  bannerGroup.position.set(0, -0.22, 0.02); // Hanging below drone
  droneGroup.add(bannerGroup);

  // Dual Suspension Rigging Cables (Micro-wires)
  const cableMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 });
  const cableGeom1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.06, 0.16, 0),
    new THREE.Vector3(-0.18, 0.02, 0),
  ]);
  const cable1 = new THREE.Line(cableGeom1, cableMat);
  bannerGroup.add(cable1);

  const cableGeom2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.06, 0.16, 0),
    new THREE.Vector3(0.18, 0.02, 0),
  ]);
  const cable2 = new THREE.Line(cableGeom2, cableMat);
  bannerGroup.add(cable2);

  // Suspension Rings
  [-0.18, 0.18].forEach((rx) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.012, 0.0025, 8, 16),
      chassisMat
    );
    ring.position.set(rx, 0.02, 0);
    bannerGroup.add(ring);
  });

  // The Cute Welcome Sign Canvas Mesh (Curved / Angled towards camera)
  const bannerCanvasTex = createCuteWelcomeBannerTexture();
  const bannerMat = new THREE.MeshBasicMaterial({
    map: bannerCanvasTex,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Sign Dimensions: width 0.78m, height 0.24m (readable from anywhere in the scene!)
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.24),
    bannerMat
  );
  bannerMesh.position.set(0, -0.06, 0);
  bannerMesh.castShadow = true;
  bannerGroup.add(bannerMesh);

  // Sleek Frame Border around the banner
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.2,
  });
  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.80, 8), frameMat);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(0, 0.058, 0);
  bannerGroup.add(topBar);

  const botBar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.80, 8), frameMat);
  botBar.rotation.z = Math.PI / 2;
  botBar.position.set(0, -0.178, 0);
  bannerGroup.add(botBar);

  // Glowing Mini Beads on top bar ends
  [-0.40, 0.40].forEach((bx) => {
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 8, 8),
      magentaGlowMat
    );
    bead.position.set(bx, 0.058, 0);
    bannerGroup.add(bead);
  });

  droneGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.userData = {
        interactiveType: 'drone',
        label: '🛸 AI WELCOME DRONE // CLICK FOR 360° AERIAL STUNT',
      };
    }
  });

  const droneRig: WelcomeDroneRig = {
    droneGroup,
    body,
    rotors,
    rotorBlades,
    bannerGroup,
    bannerMesh,
    statusLedL,
    statusLedR,
    basePosition,
    bannerCanvasTex,
    stuntTimer: 0,
  };

  return { droneGroup, droneRig };
}

/**
 * Animates the drone with realistic quadcopter hovering physics:
 * - High-speed propeller rotation
 * - Vertical breathing altitude oscillations
 * - Gentle horizontal station-keeping figure-8 drift
 * - Aerodynamic banking / roll and pitch reaction
 * - Pendulum inertia on the suspended cute "Welcome!" banner
 * - Helical 360-degree aerial stunt barrel roll when stuntTimer > 0
 */
export function updateWelcomeDroneAnimation(
  rig: WelcomeDroneRig,
  elapsedTime: number
): void {
  const {
    droneGroup,
    body,
    rotors,
    bannerGroup,
    statusLedL,
    statusLedR,
    basePosition,
  } = rig;

  // Check if stunt active
  let isStunt = false;
  let stuntProgress = 0;
  if (rig.stuntTimer && rig.stuntTimer > 0) {
    rig.stuntTimer = Math.max(0, rig.stuntTimer - 0.016);
    isStunt = true;
    stuntProgress = 1.0 - (rig.stuntTimer / 1.4); // 0 to 1 over 1.4s
  }

  // 1. High-Speed Rotor Rotation (Spinning blur)
  const propSpeed = elapsedTime * (isStunt ? 95.0 : 48.0);
  rotors.forEach((rotor, idx) => {
    // Alternate CW and CCW rotation between adjacent motors
    const dir = idx % 2 === 0 ? 1 : -1;
    rotor.rotation.y = propSpeed * dir;
  });

  // 2. Flight Kinematics & Station Keeping Hover
  // Altitude bobbing (smooth organic float)
  const altBob = Math.sin(elapsedTime * 2.2) * 0.038 + Math.sin(elapsedTime * 4.6) * 0.008;

  // Horizontal micro figure-8 drift
  const driftX = Math.sin(elapsedTime * 1.3) * 0.045;
  const driftZ = Math.cos(elapsedTime * 1.7) * 0.032;

  let stuntY = 0;
  let stuntRoll = 0;
  if (isStunt) {
    // Smooth parabolic altitude climb and full 360 roll
    stuntY = Math.sin(stuntProgress * Math.PI) * 0.22;
    stuntRoll = stuntProgress * Math.PI * 2;
  }

  droneGroup.position.set(
    basePosition.x + driftX,
    basePosition.y + altBob + stuntY,
    basePosition.z + driftZ
  );

  // 3. Aerodynamic Banking (Roll & Pitch) in response to velocity derivatives
  const targetRoll = Math.cos(elapsedTime * 1.3) * 0.07 + stuntRoll;
  const targetPitch = -Math.sin(elapsedTime * 1.7) * 0.05 + (isStunt ? Math.sin(stuntProgress * Math.PI * 2) * 0.2 : 0);
  const yawOscillation = Math.sin(elapsedTime * 0.8) * 0.06;

  body.rotation.z = targetRoll;
  body.rotation.x = targetPitch;
  body.rotation.y = yawOscillation - 0.28; // Face gently toward the viewer / center workstation

  // 4. Suspended Banner Pendulum Physics
  // The hanging banner swings with slight lag behind the drone's movements
  const bannerSwingZ = -Math.sin(targetRoll) * 0.45 + Math.sin(elapsedTime * 1.9) * 0.025;
  const bannerSwingX = -targetPitch * 0.5 + Math.cos(elapsedTime * 2.1) * 0.02;
  bannerGroup.rotation.z = bannerSwingZ;
  bannerGroup.rotation.x = bannerSwingX;
  bannerGroup.rotation.y = yawOscillation - 0.28;

  // 5. Flashing Status LEDs
  const pulseSpeed = isStunt ? 18.0 : 6.0;
  const pulseL = (Math.sin(elapsedTime * pulseSpeed) + 1.0) * 0.5;
  const pulseR = (Math.cos(elapsedTime * pulseSpeed) + 1.0) * 0.5;
  statusLedL.intensity = 0.6 + pulseL * (isStunt ? 3.0 : 1.2);
  statusLedR.intensity = 0.6 + pulseR * (isStunt ? 3.0 : 1.2);
}
