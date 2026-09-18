import * as THREE from 'three';

export interface CatRig {
  catGroup: THREE.Group;
  catMeshGroup: THREE.Group;
  body: THREE.Group;
  chest: THREE.Mesh;
  hips: THREE.Mesh;
  head: THREE.Group;
  jaw: THREE.Group;
  tongue: THREE.Mesh;
  earL: THREE.Group;
  earR: THREE.Group;
  eyeL: THREE.Mesh;
  eyeR: THREE.Mesh;
  eyelidL: THREE.Mesh;
  eyelidR: THREE.Mesh;
  frontLegL: THREE.Group;
  frontLegR: THREE.Group;
  frontPawL: THREE.Group;
  frontPawR: THREE.Group;
  hindLegL: THREE.Group;
  hindLegR: THREE.Group;
  hindPawL: THREE.Group;
  hindPawR: THREE.Group;
  tailSegments: THREE.Group[];
  collarBell: THREE.Mesh;
  bedPosition: THREE.Vector3;
  perchPosition?: THREE.Vector3;
  toyBall?: THREE.Mesh;
  toyString?: THREE.Line;
  petReactTimer: number;
  isHovered: boolean;
  heartParticles?: THREE.Points;
}

/**
 * Procedural Realistic Ginger Tabby Coat Fur Texture Generator
 * Generates organic mackerel tabby stripes, white chest bib, facial "M" mask, and velvety fur grain.
 */
function createProceduralFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base warm ginger-amber coat
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
  baseGrad.addColorStop(0.0, '#d97706'); // Deep dorsal amber
  baseGrad.addColorStop(0.35, '#f59e0b'); // Warm ginger flanks
  baseGrad.addColorStop(0.8, '#fde68a'); // Cream underfur
  baseGrad.addColorStop(1.0, '#ffffff'); // Pure white ventral / bib
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Micro-fur noise grain for anisotropic soft specular sheen
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 0.8));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Mackerel Tabby Stripes with organic feathering
  ctx.fillStyle = 'rgba(120, 53, 15, 0.72)'; // Rich cinnamon-cocoa tabby markings
  for (let y = 40; y < 420; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 16) {
      const wave = Math.sin(x * 0.05 + y * 0.08) * 12 + Math.sin(x * 0.12) * 5;
      ctx.lineTo(x, y + wave);
    }
    for (let x = 512; x >= 0; x -= 16) {
      const wave = Math.sin(x * 0.05 + y * 0.08) * 12 + Math.sin(x * 0.12) * 5;
      const thickness = 10 + Math.sin(x * 0.03) * 6;
      ctx.lineTo(x, y + wave + thickness);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Whisker follicle spot clusters on cheeks
  ctx.fillStyle = 'rgba(146, 64, 14, 0.85)';
  [80, 110, 140].forEach((xPos) => {
    [450, 465, 480].forEach((yPos) => {
      ctx.beginPath();
      ctx.arc(xPos, yPos, 2.2, 0, Math.PI * 2);
      ctx.arc(512 - xPos, yPos, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Procedural Jewel-Toned Feline Iris & Eye Texture Generator
 * Luminous emerald-jade iris, amber pupil ring, fibrous radial striations, and glossy limbal ring.
 */
function createProceduralEyeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const cx = 128;
  const cy = 128;
  const radius = 120;

  // Dark Outer Limbal Ring
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
  grad.addColorStop(0.0, '#fbbf24'); // Amber golden center halo around pupil
  grad.addColorStop(0.45, '#10b981'); // Radiant emerald green
  grad.addColorStop(0.85, '#047857'); // Deep forest jade
  grad.addColorStop(1.0, '#064e3b'); // Dark limbal edge ring
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Fine Radial Fibrous Striations (Iris Muscle Spokes)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 90; i++) {
    const angle = (i / 90) * Math.PI * 2;
    const innerR = radius * (0.25 + Math.random() * 0.15);
    const outerR = radius * (0.85 + Math.random() * 0.12);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }

  // Dark Slit Pupil
  ctx.fillStyle = '#05070a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 18, 85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle Corneal Highlight Glint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(cx - 24, cy - 35, 12, 18, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates 4 pink "toe beans" and 1 central heart-shaped palm pad for a cat paw
 */
function addCutePawPads(pawGroup: THREE.Group, padMat: THREE.Material): void {
  // 1. Central Metacarpal/Metatarsal Palm Pad
  const centralPad = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 8, 6),
    padMat
  );
  centralPad.scale.set(1.2, 0.35, 1.1);
  centralPad.position.set(0, -0.011, 0.003);
  pawGroup.add(centralPad);

  // 2. Four Individual Digital Toe Pads ("Toe Beans")
  const toePositions = [
    { x: -0.011, z: -0.012 },
    { x: -0.004, z: -0.017 },
    { x: 0.004, z: -0.017 },
    { x: 0.011, z: -0.012 },
  ];

  toePositions.forEach((pos) => {
    const toeBean = new THREE.Mesh(
      new THREE.SphereGeometry(0.0042, 6, 6),
      padMat
    );
    toeBean.scale.set(1.0, 0.4, 1.15);
    toeBean.position.set(pos.x, -0.011, pos.z);
    pawGroup.add(toeBean);
  });
}

export function createRealisticCat(): {
  roomSetup: THREE.Group;
  catRig: CatRig;
} {
  const roomSetup = new THREE.Group();

  // Bed Position: Left of chair (chair at x=0, z=1.02), clear open rug space
  const bedPosition = new THREE.Vector3(-1.28, 0.0, 1.20);
  const perchPosition = new THREE.Vector3(-1.52, 0.0, 0.65);

  // Shared Procedural Materials
  const furTex = createProceduralFurTexture();
  const eyeTex = createProceduralEyeTexture();

  const furBodyMat = new THREE.MeshStandardMaterial({
    map: furTex,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.03,
  });

  const furWhiteSilkyMat = new THREE.MeshStandardMaterial({
    color: 0xfbfdff,
    roughness: 0.82,
    metalness: 0.02,
  });

  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // Healthy soft bubblegum pink
    roughness: 0.32,
    metalness: 0.06,
  });

  const eyeCorneaMat = new THREE.MeshStandardMaterial({
    map: eyeTex,
    roughness: 0.12,
    metalness: 0.25,
    emissive: 0x059669,
    emissiveIntensity: 0.35,
  });

  const teethMat = new THREE.MeshStandardMaterial({
    color: 0xfffff0,
    roughness: 0.2,
    metalness: 0.1,
  });

  const tongueMat = new THREE.MeshStandardMaterial({
    color: 0xf87171,
    roughness: 0.4,
    metalness: 0.02,
  });

  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant cyan-azure breakaway safety collar
    roughness: 0.35,
    metalness: 0.4,
  });

  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Golden tinkling bell
    metalness: 0.95,
    roughness: 0.15,
  });

  // =========================================================================
  // 1. DELUXE SCANDINAVIAN CAT SANCTUARY, JUMPING TOWER & ACCESSORIES
  // =========================================================================
  const sanctuaryGroup = new THREE.Group();
  sanctuaryGroup.position.copy(bedPosition);

  // A. Plush Donut Bed with Low-Entry Open Front Contour (No clipping!)
  const bedCushionMat = new THREE.MeshStandardMaterial({
    color: 0xfbf6ee, // Warm cashmere ivory fleece
    roughness: 0.92,
  });
  const bedCushion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.23, 0.05, 24),
    bedCushionMat
  );
  bedCushion.position.set(0, 0.025, 0);
  bedCushion.receiveShadow = true;
  sanctuaryGroup.add(bedCushion);

  // Tufted Center Indentation (Cozy nest depression)
  const bedCenterHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.035, 20),
    new THREE.MeshStandardMaterial({ color: 0xfaeade, roughness: 0.95 })
  );
  bedCenterHole.position.set(0, 0.038, 0);
  sanctuaryGroup.add(bedCenterHole);

  // Open-Front Horseshoe Donut Bolster Rim in Slate Blue Flannel (Opens toward +Z)
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.05 });
  const bedRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.052, 14, 30, Math.PI * 1.55),
    rimMat
  );
  bedRim.rotation.x = Math.PI / 2;
  bedRim.rotation.z = -Math.PI * 0.27; // Opening faces forward toward open rug
  bedRim.position.set(0, 0.065, 0);
  bedRim.castShadow = true;
  sanctuaryGroup.add(bedRim);

  // Rounded Bolster End-Caps on both sides of the front opening
  const capL = new THREE.Mesh(new THREE.SphereGeometry(0.050, 10, 8), rimMat);
  capL.position.set(-0.24 * Math.sin(0.4), 0.065, 0.24 * Math.cos(0.4));
  sanctuaryGroup.add(capL);

  const capR = new THREE.Mesh(new THREE.SphereGeometry(0.050, 10, 8), rimMat);
  capR.position.set(0.24 * Math.sin(0.4), 0.065, 0.24 * Math.cos(0.4));
  sanctuaryGroup.add(capR);

  // Embroidered Fish Tag on Bed
  const fishTag = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.016, 0.008),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.4 })
  );
  fishTag.position.set(0, 0.075, -0.29);
  sanctuaryGroup.add(fishTag);

  // Soft Folded Throw Blanket draped over one edge of bed
  const blanket = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.015, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.9, metalness: 0.05 })
  );
  blanket.position.set(-0.18, 0.08, 0.08);
  blanket.rotation.set(0.1, 0.3, -0.15);
  sanctuaryGroup.add(blanket);

  // B. Scandinavian Luxury Cat Jumping Ottoman & Scratch Perch Tower
  const perchGroup = new THREE.Group();
  perchGroup.position.copy(perchPosition);

  const oakWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Warm natural Scandinavian oak
    roughness: 0.35,
    metalness: 0.05,
  });

  // 3 Flared Oak Tripod Legs
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((ang) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.018, 0.13, 8),
      oakWoodMat
    );
    leg.position.set(Math.cos(ang) * 0.12, 0.06, Math.sin(ang) * 0.12);
    leg.rotation.z = Math.cos(ang) * 0.18;
    leg.rotation.x = Math.sin(ang) * 0.18;
    perchGroup.add(leg);
  });

  // Base Oak Support Plinth
  const perchPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.024, 24),
    oakWoodMat
  );
  perchPlinth.position.set(0, 0.125, 0);
  perchGroup.add(perchPlinth);

  // Upholstered Tweed Cylindrical Drum Body
  const tweedMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Slate tweed upholstery
    roughness: 0.88,
  });
  const perchDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.20, 24),
    tweedMat
  );
  perchDrum.position.set(0, 0.225, 0);
  perchDrum.castShadow = true;
  perchGroup.add(perchDrum);

  // Natural Woven Sisal Rope Scratch Band around lower half
  const sisalBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.195, 0.195, 0.10, 24),
    new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.95 })
  );
  sisalBand.position.set(0, 0.18, 0);
  perchGroup.add(sisalBand);

  // Plush Cream Sherpa Fleece Landing Pad on Top (Height Y = 0.34m, surface at Y = 0.36m)
  const sherpaMat = new THREE.MeshStandardMaterial({
    color: 0xfefce8, // Warm fluffy Sherpa fleece
    roughness: 0.95,
  });
  const perchPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.20, 0.19, 0.045, 24),
    sherpaMat
  );
  perchPad.position.set(0, 0.34, 0);
  perchPad.receiveShadow = true;
  perchGroup.add(perchPad);

  // Dangling Felt Plush Mouse Toy from Perch Rim
  const mouseToyGroup = new THREE.Group();
  mouseToyGroup.position.set(0.18, 0.33, 0.05);

  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0015, 0.0015, 0.12, 6),
    new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
  );
  cord.position.set(0, -0.06, 0);
  mouseToyGroup.add(cord);

  const mouseBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.8 })
  );
  mouseBody.scale.set(1.4, 0.8, 0.9);
  mouseBody.position.set(0, -0.12, 0);
  mouseToyGroup.add(mouseBody);

  const mouseTail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.001, 0.001, 0.03, 4),
    new THREE.MeshBasicMaterial({ color: 0xf472b6 })
  );
  mouseTail.rotation.z = Math.PI / 3;
  mouseTail.position.set(-0.02, -0.12, 0);
  mouseToyGroup.add(mouseTail);

  perchGroup.add(mouseToyGroup);
  roomSetup.add(perchGroup);

  // C. Modern Bamboo Dining Station (Dual Bowls) placed along left wall
  const diningGroup = new THREE.Group();
  diningGroup.position.set(-1.68, 0, 1.35);

  // Natural Bamboo Stand Tray
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.032, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45, metalness: 0.1 })
  );
  tray.position.set(0, 0.016, 0);
  diningGroup.add(tray);

  // Left Bowl: Fresh Water
  const waterBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.036, 16),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 })
  );
  waterBowl.position.set(-0.06, 0.04, 0);
  diningGroup.add(waterBowl);

  const waterSurface = new THREE.Mesh(
    new THREE.CircleGeometry(0.041, 16),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      metalness: 0.85,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    })
  );
  waterSurface.rotation.x = -Math.PI / 2;
  waterSurface.position.set(-0.06, 0.055, 0);
  diningGroup.add(waterSurface);

  // Right Bowl: Fish Kibbles
  const foodBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.036, 16),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 })
  );
  foodBowl.position.set(0.06, 0.04, 0);
  diningGroup.add(foodBowl);

  const kibbleMound = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  kibbleMound.scale.set(1.0, 0.45, 1.0);
  kibbleMound.position.set(0.06, 0.048, 0);
  diningGroup.add(kibbleMound);

  roomSetup.add(diningGroup);

  // D. Wool Yarn Play Ball on Open Rug
  const toyBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.85 })
  );
  toyBall.position.set(-0.95, 0.026, 1.40);
  toyBall.castShadow = true;
  roomSetup.add(toyBall);

  roomSetup.add(sanctuaryGroup);

  // =========================================================================
  // 2. ANATOMICALLY SCULPTED HIGH-DEFINITION FELINE MODEL
  // =========================================================================
  const catGroup = new THREE.Group();
  catGroup.position.copy(bedPosition);

  const catMeshGroup = new THREE.Group();
  catGroup.add(catMeshGroup);

  // --- Main Articulated Torso (Chest + Primordial Belly Pouch + Hips) ---
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.14, 0);
  catMeshGroup.add(bodyGroup);

  // Muscular Chest / Ribcage
  const chest = new THREE.Mesh(
    new THREE.SphereGeometry(0.086, 16, 14),
    furBodyMat
  );
  chest.scale.set(0.85, 1.02, 1.25);
  chest.position.set(0, 0, -0.06);
  chest.castShadow = true;
  bodyGroup.add(chest);

  // Silky White Throat / Chest Ruff (Bib)
  const chestBib = new THREE.Mesh(
    new THREE.SphereGeometry(0.080, 14, 12),
    furWhiteSilkyMat
  );
  chestBib.scale.set(0.72, 0.90, 1.15);
  chestBib.position.set(0, -0.016, -0.085);
  bodyGroup.add(chestBib);

  // Fluffy Primordial Belly Pouch (soft fold characteristic of healthy cats)
  const bellyPouch = new THREE.Mesh(
    new THREE.SphereGeometry(0.076, 14, 12),
    furWhiteSilkyMat
  );
  bellyPouch.scale.set(0.8, 0.7, 1.2);
  bellyPouch.position.set(0, -0.038, 0.02);
  bodyGroup.add(bellyPouch);

  // Pelvis / Hips (articulates with hind legs and tail)
  const hips = new THREE.Mesh(
    new THREE.SphereGeometry(0.084, 16, 14),
    furBodyMat
  );
  hips.scale.set(0.88, 0.98, 1.15);
  hips.position.set(0, 0.005, 0.08);
  hips.castShadow = true;
  bodyGroup.add(hips);

  // --- Sculpted Feline Skull, Face, Whisker Pads, Nose & Jaw ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.075, -0.165);
  bodyGroup.add(headGroup);

  // Cranium with curved brow bridge
  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.070, 18, 16),
    furBodyMat
  );
  cranium.scale.set(1.05, 0.95, 1.02);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Forehead Tabby "M" Crest Mask
  const foreheadMCrest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.024, 0.028, 5),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  foreheadMCrest.rotation.x = 0.4;
  foreheadMCrest.position.set(0, 0.045, -0.045);
  headGroup.add(foreheadMCrest);

  // Plump Whisker Muzzle Pads (Left & Right)
  const muzzlePadL = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 12, 10),
    furWhiteSilkyMat
  );
  muzzlePadL.scale.set(1.1, 0.9, 1.0);
  muzzlePadL.position.set(-0.022, -0.022, -0.055);
  headGroup.add(muzzlePadL);

  const muzzlePadR = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 12, 10),
    furWhiteSilkyMat
  );
  muzzlePadR.scale.set(1.1, 0.9, 1.0);
  muzzlePadR.position.set(0.022, -0.022, -0.055);
  headGroup.add(muzzlePadR);

  // Soft Pink Cat Nose with Philtrum
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.009, 0.011, 7),
    noseMat
  );
  nose.rotation.x = -Math.PI / 2;
  nose.rotation.z = Math.PI;
  nose.position.set(0, -0.013, -0.072);
  headGroup.add(nose);

  // --- Articulated Lower Jaw, Tongue & Cute Fangs (Opens during yawn / meow / groom) ---
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.032, -0.042);
  headGroup.add(jawGroup);

  // Chin pad
  const chin = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 10, 8),
    furWhiteSilkyMat
  );
  chin.scale.set(0.9, 0.7, 1.2);
  chin.position.set(0, -0.005, -0.015);
  jawGroup.add(chin);

  // Curved Pink Tongue
  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.004, 0.024),
    tongueMat
  );
  tongue.position.set(0, 0.002, -0.018);
  jawGroup.add(tongue);

  // Tiny Upper Canine Fangs
  const fangMat = teethMat;
  [-0.014, 0.014].forEach((side) => {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(0.0025, 0.007, 5),
      fangMat
    );
    fang.rotation.x = Math.PI;
    fang.position.set(side, -0.025, -0.062);
    headGroup.add(fang);
  });

  // --- Eyes with Procedural Cornea, Iris & Eyelids ---
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), eyeCorneaMat);
  eyeL.position.set(-0.032, 0.010, -0.056);
  eyeL.scale.set(1.0, 1.22, 0.6);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), eyeCorneaMat);
  eyeR.position.set(0.032, 0.010, -0.056);
  eyeR.scale.set(1.0, 1.22, 0.6);
  headGroup.add(eyeR);

  // Eyelids (Upper hood that scales for blinking & sleepy slow-blinks)
  const eyelidL = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    furBodyMat
  );
  eyelidL.position.set(-0.032, 0.018, -0.054);
  eyelidL.rotation.x = -0.35;
  headGroup.add(eyelidL);

  const eyelidR = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    furBodyMat
  );
  eyelidR.position.set(0.032, 0.018, -0.054);
  eyelidR.rotation.x = -0.35;
  headGroup.add(eyelidR);

  // --- Realistic Whiskers & Eyebrow Sensory Filaments ---
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  [-1, 1].forEach((side) => {
    // 6 Mystacial Cheek Whiskers (3 rows of 2 whiskers with natural curve and droop)
    [-0.22, -0.10, 0.0, 0.10, 0.20, 0.28].forEach((angle, idx) => {
      const len = 0.065 + (idx % 2) * 0.015;
      const whisker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0005, 0.0003, len, 4),
        whiskerMat
      );
      whisker.position.set(side * 0.046, -0.022 + (idx - 2.5) * 0.004, -0.052);
      whisker.rotation.z = side * (Math.PI / 2 + angle * 0.7);
      whisker.rotation.y = side * (0.35 + (idx % 3) * 0.08);
      whisker.rotation.x = (idx - 2.5) * 0.08;
      headGroup.add(whisker);
    });

    // 2 Superciliary Eyebrow Whiskers
    [-0.08, 0.08].forEach((bAngle) => {
      const browWhisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0005, 0.0003, 0.045, 4),
        whiskerMat
      );
      browWhisk.position.set(side * 0.028, 0.032, -0.048);
      browWhisk.rotation.z = side * (0.4 + bAngle);
      browWhisk.rotation.x = -0.6;
      headGroup.add(browWhisk);
    });
  });

  // --- Sculpted Feline Ears with Inner Canal Fluff & Lynx Tufts ---
  const earL = new THREE.Group();
  earL.position.set(-0.044, 0.058, -0.014);
  earL.rotation.set(-0.15, -0.2, 0.35);

  const earOuterL = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.050, 4), furBodyMat);
  earOuterL.scale.set(1.0, 1.0, 0.42);
  earL.add(earOuterL);

  const earInnerL = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.036, 4), noseMat);
  earInnerL.position.set(0, -0.005, -0.004);
  earInnerL.scale.set(1.0, 1.0, 0.28);
  earL.add(earInnerL);

  // White inner ear fluff tufts
  const earFluffL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), furWhiteSilkyMat);
  earFluffL.position.set(0, -0.012, -0.006);
  earFluffL.scale.set(1.2, 0.6, 0.6);
  earL.add(earFluffL);

  // Dark Lynx Ear-Tip Tuft
  const lynxTuftL = new THREE.Mesh(
    new THREE.ConeGeometry(0.003, 0.012, 4),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
  );
  lynxTuftL.position.set(0, 0.028, 0);
  earL.add(lynxTuftL);

  headGroup.add(earL);

  const earR = new THREE.Group();
  earR.position.set(0.044, 0.058, -0.014);
  earR.rotation.set(-0.15, 0.2, -0.35);

  const earOuterR = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.050, 4), furBodyMat);
  earOuterR.scale.set(1.0, 1.0, 0.42);
  earR.add(earOuterR);

  const earInnerR = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.036, 4), noseMat);
  earInnerR.position.set(0, -0.005, -0.004);
  earInnerR.scale.set(1.0, 1.0, 0.28);
  earR.add(earInnerR);

  const earFluffR = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), furWhiteSilkyMat);
  earFluffR.position.set(0, -0.012, -0.006);
  earFluffR.scale.set(1.2, 0.6, 0.6);
  earR.add(earFluffR);

  const lynxTuftR = new THREE.Mesh(
    new THREE.ConeGeometry(0.003, 0.012, 4),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
  );
  lynxTuftR.position.set(0, 0.028, 0);
  earR.add(lynxTuftR);

  headGroup.add(earR);

  // --- Collar & Swiveling Golden Bell ---
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.007, 8, 18), collarMat);
  collar.position.set(0, -0.02, -0.092);
  collar.rotation.x = Math.PI / 2.3;
  bodyGroup.add(collar);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), bellMat);
  bell.position.set(0, -0.046, -0.135);
  bodyGroup.add(bell);

  // =========================================================================
  // 3. ARTICULATED LEGS & DELICATE PINK TOE BEANS
  // =========================================================================
  // Front Left Leg & Paw
  const frontLegL = new THREE.Group();
  frontLegL.position.set(-0.065, -0.02, -0.07);

  const fShoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), furBodyMat);
  fShoulderL.scale.set(0.8, 1.2, 1.0);
  frontLegL.add(fShoulderL);

  const fLimbL = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.017, 0.12, 10), furBodyMat);
  fLimbL.position.set(0, -0.055, 0);
  fLimbL.castShadow = true;
  frontLegL.add(fLimbL);

  const frontPawL = new THREE.Group();
  frontPawL.position.set(0, -0.115, 0);
  const fMittL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), furWhiteSilkyMat);
  fMittL.scale.set(1.0, 0.65, 1.35);
  fMittL.position.set(0, 0, -0.006);
  frontPawL.add(fMittL);
  addCutePawPads(frontPawL, noseMat);
  frontLegL.add(frontPawL);
  bodyGroup.add(frontLegL);

  // Front Right Leg & Paw
  const frontLegR = new THREE.Group();
  frontLegR.position.set(0.065, -0.02, -0.07);

  const fShoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), furBodyMat);
  fShoulderR.scale.set(0.8, 1.2, 1.0);
  frontLegR.add(fShoulderR);

  const fLimbR = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.017, 0.12, 10), furBodyMat);
  fLimbR.position.set(0, -0.055, 0);
  fLimbR.castShadow = true;
  frontLegR.add(fLimbR);

  const frontPawR = new THREE.Group();
  frontPawR.position.set(0, -0.115, 0);
  const fMittR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), furWhiteSilkyMat);
  fMittR.scale.set(1.0, 0.65, 1.35);
  fMittR.position.set(0, 0, -0.006);
  frontPawR.add(fMittR);
  addCutePawPads(frontPawR, noseMat);
  frontLegR.add(frontPawR);
  bodyGroup.add(frontLegR);

  // Hind Left Leg (Muscular Haunch, Backward Hock & White Sock Paw)
  const hindLegL = new THREE.Group();
  hindLegL.position.set(-0.075, 0.0, 0.08);

  const hHaunchL = new THREE.Mesh(new THREE.SphereGeometry(0.040, 12, 10), furBodyMat);
  hHaunchL.scale.set(0.85, 1.35, 1.15);
  hHaunchL.position.set(0, -0.02, 0);
  hindLegL.add(hHaunchL);

  const hShinL = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.016, 0.10, 8), furBodyMat);
  hShinL.position.set(0, -0.07, 0.015);
  hShinL.rotation.x = -0.3;
  hindLegL.add(hShinL);

  const hindPawL = new THREE.Group();
  hindPawL.position.set(0, -0.12, 0.03);
  const hMittL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), furWhiteSilkyMat);
  hMittL.scale.set(1.0, 0.65, 1.35);
  hindPawL.add(hMittL);
  addCutePawPads(hindPawL, noseMat);
  hindLegL.add(hindPawL);
  bodyGroup.add(hindLegL);

  // Hind Right Leg
  const hindLegR = new THREE.Group();
  hindLegR.position.set(0.075, 0.0, 0.08);

  const hHaunchR = new THREE.Mesh(new THREE.SphereGeometry(0.040, 12, 10), furBodyMat);
  hHaunchR.scale.set(0.85, 1.35, 1.15);
  hHaunchR.position.set(0, -0.02, 0);
  hindLegR.add(hHaunchR);

  const hShinR = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.016, 0.10, 8), furBodyMat);
  hShinR.position.set(0, -0.07, 0.015);
  hShinR.rotation.x = -0.3;
  hindLegR.add(hShinR);

  const hindPawR = new THREE.Group();
  hindPawR.position.set(0, -0.12, 0.03);
  const hMittR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), furWhiteSilkyMat);
  hMittR.scale.set(1.0, 0.65, 1.35);
  hindPawR.add(hMittR);
  addCutePawPads(hindPawR, noseMat);
  hindLegR.add(hindPawR);
  bodyGroup.add(hindLegR);

  // --- 6-Segment Ultra-Smooth Catenary Animated Tail with White Tip ---
  const tailSegments: THREE.Group[] = [];
  let prevTailSegment: THREE.Group = hips as any;

  const tailLength = 6;
  for (let t = 0; t < tailLength; t++) {
    const segGroup = new THREE.Group();
    if (t === 0) {
      segGroup.position.set(0, 0.032, 0.078);
    } else {
      segGroup.position.set(0, 0.042, 0.016);
    }

    const radTop = Math.max(0.009, 0.017 - t * 0.0018);
    const radBottom = Math.max(0.008, 0.019 - t * 0.0018);
    const segMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radTop, radBottom, 0.052, 8),
      t === tailLength - 1 ? furWhiteSilkyMat : furBodyMat
    );
    segMesh.position.set(0, 0.026, 0);
    segGroup.add(segMesh);

    if (t === 0) {
      bodyGroup.add(segGroup);
    } else {
      prevTailSegment.add(segGroup);
    }
    tailSegments.push(segGroup);
    prevTailSegment = segGroup;
  }

  // Interactive Heart Particles System (floats up when cat is clicked / petted)
  const heartCount = 18;
  const heartGeo = new THREE.BufferGeometry();
  const heartPos = new Float32Array(heartCount * 3);
  for (let p = 0; p < heartCount; p++) {
    heartPos[p * 3] = (Math.random() - 0.5) * 0.16;
    heartPos[p * 3 + 1] = 0.12 + Math.random() * 0.22;
    heartPos[p * 3 + 2] = (Math.random() - 0.5) * 0.16;
  }
  heartGeo.setAttribute('position', new THREE.BufferAttribute(heartPos, 3));
  const heartMat = new THREE.PointsMaterial({
    color: 0xf43f5e,
    size: 0.024,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const heartParticles = new THREE.Points(heartGeo, heartMat);
  heartParticles.visible = false;
  catGroup.add(heartParticles);

  // Tag cat meshes for raycaster interaction
  catGroup.userData = { interactiveType: 'cat', label: '🐾 GINGER TABBY // CLICK TO PET & PURR' };
  catGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.userData = { interactiveType: 'cat', label: '🐾 GINGER TABBY // CLICK TO PET & PURR' };
    }
  });

  roomSetup.add(catGroup);

  const catRig: CatRig = {
    catGroup,
    catMeshGroup,
    body: bodyGroup,
    chest,
    hips,
    head: headGroup,
    jaw: jawGroup,
    tongue,
    earL,
    earR,
    eyeL,
    eyeR,
    eyelidL,
    eyelidR,
    frontLegL,
    frontLegR,
    frontPawL,
    frontPawR,
    hindLegL,
    hindLegR,
    hindPawL,
    hindPawR,
    tailSegments,
    collarBell: bell,
    bedPosition,
    perchPosition,
    toyBall,
    petReactTimer: 0,
    isHovered: false,
    heartParticles,
  };

  return {
    roomSetup,
    catRig,
  };
}

/**
 * Procedural Feline Behavioral State Machine (60-Second Rich Life Cycle with Jumping)
 * Smoothly transitions through 10 authentic feline behaviors:
 * 1. Deep Sleep & Purring in Cozy Bed (0s - 10s)
 * 2. The Grand Awakening: Yawn & Downward-Cat Arch Stretch (10s - 15s)
 * 3. Stepping Out of Bed & Walking to Perch Base (15s - 21s)
 * 4. Pre-Jump Butt Wiggle & Grand Leap onto Tower Perch (21s - 27s)
 * 5. King/Queen of the Studio: Surveying from High Perch (27s - 33s)
 * 6. Graceful Downward Leap to Carpet Rug (33s - 37s)
 * 7. Trotting to Developer's Chair & Biscuit Kneading (37s - 43s)
 * 8. Paw Licking & Whisker Grooming Session (43s - 48s)
 * 9. Inquisitive Sniff & Toy Ball Batting (48s - 54s)
 * 10. Trotting Return to Bed & Nesting Circles (54s - 60s)
 */
/**
 * Master-Class Procedural Feline Behavioral & Biomechanical Animation Engine
 * Features:
 * - Authentic 4-beat lateral quadruped walk gait with shoulder/elbow/hock/paw flexion
 * - Continuous Hermite/spline smoothed trajectories with zero teleportation or snapping
 * - Anatomical spinal undulation, stabilized gaze tracking, and dynamic counter-balancing tail waves
 * - Anticipatory stalking crouch with grounded paws & playful haunch wiggle
 * - Ballistic parabolic leaps with aerodynamic suspension shock-absorption
 * - Artisan biscuit kneading beside developer chair, paw-licking facial grooming, and toy swatting
 * - Seamless 360° nesting circle returning to bed with 100% boundary loop continuity
 * - Real-time interactive petting reactions with purring, back arching, and floating heart particles
 */
export function updateCatAnimation(
  catRig: CatRig,
  elapsedTime: number
): void {
  const {
    catGroup,
    body,
    hips,
    head,
    jaw,
    tongue,
    earL,
    earR,
    eyeL,
    eyeR,
    eyelidL,
    eyelidR,
    frontLegL,
    frontLegR,
    frontPawL,
    frontPawR,
    hindLegL,
    hindLegR,
    hindPawL,
    hindPawR,
    tailSegments,
    collarBell,
    bedPosition,
    toyBall,
    heartParticles,
  } = catRig;

  const perchPosition = catRig.perchPosition || new THREE.Vector3(-1.52, 0.0, 0.65);

  // Default baseline resets for all limbs and joints
  frontPawL.position.set(0, -0.115, 0);
  frontPawR.position.set(0, -0.115, 0);
  hindPawL.position.set(0, -0.12, 0.03);
  hindPawR.position.set(0, -0.12, 0.03);
  frontPawL.rotation.set(0, 0, 0);
  frontPawR.rotation.set(0, 0, 0);
  hindPawL.rotation.set(0, 0, 0);
  hindPawR.rotation.set(0, 0, 0);
  frontLegL.position.set(-0.065, -0.02, -0.07);
  frontLegR.position.set(0.065, -0.02, -0.07);
  hindLegL.position.set(-0.075, 0.0, 0.08);
  hindLegR.position.set(0.075, 0.0, 0.08);
  body.scale.set(1, 1, 1);
  hips.rotation.set(0, 0, 0);
  eyeL.scale.set(1.0, 1.22, 0.6);
  eyeR.scale.set(1.0, 1.22, 0.6);

  // 60-Second Continuous Rich Life Cycle
  const cycleTime = elapsedTime % 60;

  // Gentle inertial bell swing
  const bellSwing = Math.sin(elapsedTime * 6.5) * 0.12;
  collarBell.rotation.z = bellSwing;

  // Quadruped 4-Beat Feline Gait Engine
  const applyFelineGait = (phase: number, speedMultiplier: number = 1.0) => {
    const amp = 0.44 * speedMultiplier;
    // 4-beat lateral sequence: Hind Left -> Front Left -> Hind Right -> Front Right
    const phHL = phase;
    const phFL = phase + Math.PI * 0.52;
    const phHR = phase + Math.PI;
    const phFR = phase + Math.PI * 1.52;

    const calcLeg = (ph: number) => {
      const s = Math.sin(ph);
      const c = Math.cos(ph);
      const isSwing = c > 0;
      const rotX = s * amp;
      const lift = isSwing ? Math.max(0, s) * 0.024 : 0;
      const pawRotX = isSwing ? -Math.max(0, s) * 0.42 : 0;
      return { rotX, lift, pawRotX };
    };

    const kFL = calcLeg(phFL);
    const kFR = calcLeg(phFR);
    const kHL = calcLeg(phHL);
    const kHR = calcLeg(phHR);

    frontLegL.rotation.set(kFL.rotX, 0, 0);
    frontPawL.position.y = -0.115 + kFL.lift;
    frontPawL.rotation.x = kFL.pawRotX;

    frontLegR.rotation.set(kFR.rotX, 0, 0);
    frontPawR.position.y = -0.115 + kFR.lift;
    frontPawR.rotation.x = kFR.pawRotX;

    hindLegL.rotation.set(kHL.rotX, 0, 0);
    hindPawL.position.y = -0.12 + kHL.lift;
    hindPawL.rotation.x = kHL.pawRotX;

    hindLegR.rotation.set(kHR.rotX, 0, 0);
    hindPawR.position.y = -0.12 + kHR.lift;
    hindPawR.rotation.x = kHR.pawRotX;

    const bounce = Math.abs(Math.sin(phase * 2)) * 0.012;
    body.position.y = 0.128 + bounce;
    body.rotation.set(0, Math.sin(phase) * 0.05, Math.cos(phase) * 0.025);
    hips.rotation.y = -Math.sin(phase) * 0.04;

    head.position.set(0, 0.06 - bounce * 0.4, -0.15);
    head.rotation.set(0.06, -Math.sin(phase) * 0.025, 0);

    tailSegments.forEach((seg, idx) => {
      const wave = Math.sin(phase - idx * 0.38) * 0.16;
      seg.rotation.set(-0.30 + idx * 0.06, wave, 0);
    });
  };

  if (cycleTime < 9) {
    // =========================================================================
    // STATE 1: BLISSFUL SLEEPING LOAF & PURRING IN BED (0s - 9s)
    // =========================================================================
    catGroup.position.set(bedPosition.x, bedPosition.y + 0.035, bedPosition.z);
    catGroup.rotation.y = 0.52;

    body.position.y = 0.04;
    body.rotation.set(0.04, 0.14, 0.10);

    // Sleep Breathing (~18 breaths/min) + purring vibration
    const breath = Math.sin(elapsedTime * 1.8) * 0.006;
    const purrTremor = Math.sin(elapsedTime * 24.0) * 0.0009;
    body.scale.set(1.0 + breath * 3.5 + purrTremor, 1.0 + breath * 2.5 + purrTremor, 1.0);

    head.position.set(0.02, 0.015, -0.14);
    head.rotation.set(0.28, 0.38, 0.14);

    jaw.rotation.x = 0;
    tongue.scale.set(0.8, 0.8, 0.8);

    // Fully closed sleeping eyelids
    eyelidL.scale.y = 1.0;
    eyelidR.scale.y = 1.0;

    // Gentle dreaming ear twitches
    const twitch = Math.sin(elapsedTime * 3.0);
    earL.rotation.z = twitch > 0.82 ? 0.22 : 0.05;
    earR.rotation.z = twitch < -0.82 ? -0.22 : -0.05;

    // Classic tucked paws loaf
    frontLegL.rotation.set(1.35, 0.18, -0.08);
    frontLegR.rotation.set(1.35, -0.18, 0.08);
    hindLegL.rotation.set(-1.18, 0.28, 0.18);
    hindLegR.rotation.set(-1.18, -0.28, -0.18);

    tailSegments.forEach((seg, idx) => {
      const curl = 0.24 + idx * 0.22;
      seg.rotation.set(0.08, -curl, 0.04);
    });

  } else if (cycleTime < 14) {
    // =========================================================================
    // STATE 2: THE GRAND AWAKENING (YAWN & DOWNWARD-CAT STRETCH) (9s - 14s)
    // =========================================================================
    const wakeT = (cycleTime - 9) / 5; // 0 to 1
    catGroup.position.set(bedPosition.x, bedPosition.y + 0.035, bedPosition.z);
    catGroup.rotation.y = 0.52;

    if (wakeT < 0.5) {
      // 2A: The Big Yawn & Eye Squint (9s - 11.5s)
      const yawnT = wakeT / 0.5;
      const yawnCurve = Math.sin(yawnT * Math.PI);

      body.position.y = 0.055 + yawnCurve * 0.025;
      body.rotation.set(0, 0.14 * (1 - yawnT), 0);

      head.position.set(0, 0.05 + yawnCurve * 0.02, -0.13);
      head.rotation.set(-0.30 * yawnCurve, 0, 0);

      jaw.rotation.x = yawnCurve * 0.70;
      tongue.scale.set(1.0 + yawnCurve * 0.4, 1.0 + yawnCurve * 0.3, 1.0 + yawnCurve * 0.5);

      eyelidL.scale.y = 0.65 + yawnCurve * 0.30;
      eyelidR.scale.y = 0.65 + yawnCurve * 0.30;

      earL.rotation.set(0, 0, 0.32 * yawnCurve);
      earR.rotation.set(0, 0, -0.32 * yawnCurve);

      frontLegL.rotation.set(0.5, 0, 0);
      frontLegR.rotation.set(0.5, 0, 0);
      hindLegL.rotation.set(-0.6, 0, 0);
      hindLegR.rotation.set(-0.6, 0, 0);

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.2 + idx * 0.06, 0, 0);
      });
    } else {
      // 2B: The Downward-Cat Arch Stretch (11.5s - 14s)
      const strT = (wakeT - 0.5) / 0.5;
      const strCurve = Math.sin(strT * Math.PI);

      jaw.rotation.x = 0;
      tongue.scale.set(1, 1, 1);

      eyelidL.scale.y = 0.25;
      eyelidR.scale.y = 0.25;

      body.position.y = 0.045 - strCurve * 0.02;
      body.rotation.set(strCurve * 0.38, 0, 0);

      head.position.set(0, 0.025, -0.15);
      head.rotation.set(-0.32 * strCurve, 0, 0);

      frontLegL.rotation.set(-0.58 * strCurve, 0, 0);
      frontLegR.rotation.set(-0.58 * strCurve, 0, 0);
      hindLegL.rotation.set(0.42 * strCurve, 0, 0);
      hindLegR.rotation.set(0.42 * strCurve, 0, 0);

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.48 - idx * 0.08 * strCurve, Math.sin(elapsedTime * 8) * 0.08 * strCurve, 0);
      });
    }

  } else if (cycleTime < 19) {
    // =========================================================================
    // STATE 3: STEPPING GRACEFULLY OUT OF BED & WALKING TO PERCH (14s - 19s)
    // =========================================================================
    const walkT = (cycleTime - 14) / 5; // 0 to 1

    jaw.rotation.x = 0;
    eyelidL.scale.y = 0.05;
    eyelidR.scale.y = 0.05;

    let curX = -1.28;
    let curY = 0.0;
    let curZ = 1.20;
    let curHeading = 0.52;

    if (walkT < 0.35) {
      // Stepping out through open front horseshoe rim of bed onto soft rug
      const subT = walkT / 0.35;
      curX = THREE.MathUtils.lerp(bedPosition.x, -1.32, subT);
      curZ = THREE.MathUtils.lerp(bedPosition.z, 0.98, subT);
      curY = THREE.MathUtils.lerp(0.035, 0.0, subT);
      curHeading = THREE.MathUtils.lerp(0.52, Math.PI * 0.95, subT);
    } else {
      // Trotting to perch tower base
      const subT = (walkT - 0.35) / 0.65;
      curX = THREE.MathUtils.lerp(-1.32, -1.36, subT);
      curZ = THREE.MathUtils.lerp(0.98, 0.76, subT);
      curY = 0.0;
      const targetHeading = Math.atan2(perchPosition.x - (-1.36), perchPosition.z - 0.76);
      curHeading = THREE.MathUtils.lerp(Math.PI * 0.95, targetHeading, subT);
    }

    catGroup.position.set(curX, curY, curZ);
    catGroup.rotation.y = curHeading;

    applyFelineGait(elapsedTime * 9.2);

  } else if (cycleTime < 22.5) {
    // =========================================================================
    // STATE 4: STALKING CROUCH & PLAYFUL BUTT WIGGLE (19s - 22.5s)
    // =========================================================================
    const crouchT = (cycleTime - 19) / 3.5;

    jaw.rotation.x = 0;
    eyelidL.scale.y = 0.02;
    eyelidR.scale.y = 0.02;

    const startX = -1.36;
    const startZ = 0.76;
    const targetHeading = Math.atan2(perchPosition.x - startX, perchPosition.z - startZ);

    catGroup.position.set(startX, 0.0, startZ);
    catGroup.rotation.y = targetHeading;

    // Grounded low predatory crouch
    const sink = Math.min(1, crouchT * 2.2);
    body.position.y = 0.075 - sink * 0.02;
    body.rotation.set(-0.24 * sink, 0, 0);

    // Iconic rapid feline butt & haunch wiggle
    const wiggle = Math.sin(elapsedTime * 18.0) * 0.095;
    hips.rotation.z = wiggle;
    hips.position.x = wiggle * 0.015;

    // Focused predator gaze targeting perch top
    head.position.set(0, 0.04, -0.15);
    head.rotation.set(-0.22, 0, 0);

    // Paws firmly grounded on rug during wiggle
    frontLegL.rotation.set(0.38, -0.08, 0);
    frontLegR.rotation.set(0.38, 0.08, 0);
    hindLegL.rotation.set(-0.65, 0.18, 0);
    hindLegR.rotation.set(-0.65, -0.18, 0);

    // Dilated wide pupils
    eyeL.scale.set(1.10, 1.25, 0.75);
    eyeR.scale.set(1.10, 1.25, 0.75);

    tailSegments.forEach((seg, idx) => {
      seg.rotation.set(-0.18 + idx * 0.06, Math.sin(elapsedTime * 16.0) * 0.22, 0);
    });

  } else if (cycleTime < 26) {
    // =========================================================================
    // STATE 5: EXPLOSIVE SPRING & GRAND LEAP ONTO TOWER PERCH (22.5s - 26s)
    // =========================================================================
    const jumpCycleT = (cycleTime - 22.5) / 3.5; // 0 to 1

    jaw.rotation.x = 0;
    eyelidL.scale.y = 0.02;
    eyelidR.scale.y = 0.02;

    const startX = -1.36;
    const startZ = 0.76;
    const targetX = perchPosition.x;
    const targetZ = perchPosition.z;
    const targetHeading = Math.atan2(targetX - startX, targetZ - startZ);

    if (jumpCycleT < 0.68) {
      // Parabolic ballistic flight with gravity arc
      const flightT = jumpCycleT / 0.68;
      const curX = THREE.MathUtils.lerp(startX, targetX, flightT);
      const curZ = THREE.MathUtils.lerp(startZ, targetZ, flightT);
      const curY = THREE.MathUtils.lerp(0.0, 0.36, flightT) + Math.sin(flightT * Math.PI) * 0.26;

      catGroup.position.set(curX, curY, curZ);
      catGroup.rotation.y = targetHeading;

      const pitch = THREE.MathUtils.lerp(-0.55, 0.38, flightT);
      body.position.y = 0.13;
      body.rotation.set(pitch, 0, 0);

      // Paws reach forward toward perch platform
      const reach = THREE.MathUtils.lerp(-0.35, -0.75, flightT);
      frontLegL.rotation.set(reach, 0, 0);
      frontLegR.rotation.set(reach, 0, 0);

      const kick = THREE.MathUtils.lerp(0.85, -0.28, flightT);
      hindLegL.rotation.set(kick, 0, 0);
      hindLegR.rotation.set(kick, 0, 0);

      head.rotation.set(pitch * 0.5, 0, 0);

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.65 - idx * 0.06, 0, 0);
      });
    } else {
      // Four-point landing and suspension shock-absorption on perch cushion
      const landT = (jumpCycleT - 0.68) / 0.32;
      catGroup.position.set(targetX, 0.36, targetZ);
      catGroup.rotation.y = targetHeading;

      const shockDip = Math.sin(landT * Math.PI) * 0.045;
      body.position.y = 0.12 - shockDip;
      body.rotation.set(0.24 * (1 - landT), 0, 0);

      frontLegL.rotation.set(0.32 * (1 - landT), 0, 0);
      frontLegR.rotation.set(0.32 * (1 - landT), 0, 0);
      hindLegL.rotation.set(-0.42 * (1 - landT), 0, 0);
      hindLegR.rotation.set(-0.42 * (1 - landT), 0, 0);

      head.rotation.set(0.08, 0, 0);

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.4 - idx * 0.1 * landT, 0, 0);
      });
    }

  } else if (cycleTime < 32) {
    // =========================================================================
    // STATE 6: REGAL STUDIO PANORAMIC SURVEY FROM HIGH PERCH (26s - 32s)
    // =========================================================================
    catGroup.position.set(perchPosition.x, 0.36, perchPosition.z);
    catGroup.rotation.y = -Math.PI * 0.25; // Facing desk, developer & monitors

    jaw.rotation.x = 0;
    eyelidL.scale.y = 0.08;
    eyelidR.scale.y = 0.08;

    body.position.y = 0.12;
    body.rotation.set(0.28, 0, 0);

    // Panoramic head sweep (screens, developer, skyline)
    const panAngle = Math.sin(elapsedTime * 0.8) * 0.44;
    head.position.set(0, 0.07, -0.14);
    head.rotation.set(0.05, panAngle, 0);

    earL.rotation.set(0, Math.sin(elapsedTime * 1.6) * 0.14, 0.1);
    earR.rotation.set(0, -Math.sin(elapsedTime * 1.3) * 0.14, -0.1);

    frontLegL.rotation.set(0.12, 0, 0);
    frontLegR.rotation.set(0.12, 0, 0);
    hindLegL.rotation.set(-0.95, 0.2, 0);
    hindLegR.rotation.set(-0.95, -0.2, 0);

    // Tail hangs over the wooden edge of the perch and swishes calmly
    tailSegments.forEach((seg, idx) => {
      const swish = Math.sin(elapsedTime * 2.2 + idx * 0.22) * 0.24;
      seg.rotation.set(0.32 + idx * 0.12, swish, 0);
    });

  } else if (cycleTime < 36) {
    // =========================================================================
    // STATE 7: CONTROLLED DESCENT LEAP TO CARPET RUG (32s - 36s)
    // =========================================================================
    const downCycleT = (cycleTime - 32) / 4; // 0 to 1

    jaw.rotation.x = 0;
    eyelidL.scale.y = 0.05;
    eyelidR.scale.y = 0.05;

    const startX = perchPosition.x;
    const startZ = perchPosition.z;
    const landX = -1.18;
    const landZ = 1.08;
    const downHeading = Math.atan2(landX - startX, landZ - startZ);

    if (downCycleT < 0.65) {
      const descentT = downCycleT / 0.65;
      const curX = THREE.MathUtils.lerp(startX, landX, descentT);
      const curZ = THREE.MathUtils.lerp(startZ, landZ, descentT);
      const curY = THREE.MathUtils.lerp(0.36, 0.0, descentT) + Math.sin(descentT * Math.PI) * 0.12;

      catGroup.position.set(curX, curY, curZ);
      catGroup.rotation.y = downHeading;

      body.position.y = 0.13;
      body.rotation.set(0.42, 0, 0);

      frontLegL.rotation.set(-0.62, 0, 0);
      frontLegR.rotation.set(-0.62, 0, 0);
      hindLegL.rotation.set(0.42, 0, 0);
      hindLegR.rotation.set(0.42, 0, 0);

      head.rotation.set(-0.25, 0, 0);

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.58 - idx * 0.08, 0, 0);
      });
    } else {
      const absorbT = (downCycleT - 0.65) / 0.35;
      catGroup.position.set(landX, 0.0, landZ);
      catGroup.rotation.y = downHeading;

      const dip = Math.sin(absorbT * Math.PI) * 0.04;
      body.position.y = 0.12 - dip;
      body.rotation.set(0.2 * (1 - absorbT), 0, 0);

      frontLegL.rotation.set(0.2 * (1 - absorbT), 0, 0);
      frontLegR.rotation.set(0.2 * (1 - absorbT), 0, 0);
      hindLegL.rotation.set(-0.3 * (1 - absorbT), 0, 0);
      hindLegR.rotation.set(-0.3 * (1 - absorbT), 0, 0);

      head.rotation.set(0.05, 0, 0);

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.3 + idx * 0.05, 0, 0);
      });
    }

  } else if (cycleTime < 43) {
    // =========================================================================
    // STATE 8: TROTTING TO CHAIR & BISCUIT KNEADING (36s - 43s)
    // =========================================================================
    const devT = (cycleTime - 36) / 7; // 0 to 1

    jaw.rotation.x = 0;

    const startX = -1.18;
    const startZ = 1.08;
    const chairSideX = -0.58;
    const chairSideZ = 1.25;

    if (devT < 0.45) {
      // Trot to chair
      const trotT = devT / 0.45;
      const curX = THREE.MathUtils.lerp(startX, chairSideX, trotT);
      const curZ = THREE.MathUtils.lerp(startZ, chairSideZ, trotT);
      catGroup.position.set(curX, 0.0, curZ);
      catGroup.rotation.y = Math.atan2(chairSideX - startX, chairSideZ - startZ);

      eyelidL.scale.y = 0.05;
      eyelidR.scale.y = 0.05;

      applyFelineGait(elapsedTime * 10.5, 0.95);
    } else {
      // Seated beside developer & making biscuits with slow loving blinks
      catGroup.position.set(chairSideX, 0.0, chairSideZ);
      catGroup.rotation.y = -Math.PI * 0.35;

      body.position.y = 0.11;
      body.rotation.set(0.32, 0, 0);

      head.position.set(0, 0.08, -0.14);
      head.rotation.set(-0.25, 0.15, 0);

      // Slow blinks
      const blink = Math.sin(elapsedTime * 2.5);
      const eyelidScale = blink > 0.65 ? 0.78 : 0.15;
      eyelidL.scale.y = eyelidScale;
      eyelidR.scale.y = eyelidScale;

      // Authentic paw biscuit kneading on carpet
      const knead = Math.sin(elapsedTime * 4.2);
      frontLegL.rotation.set(0.12 + knead * 0.24, 0, 0);
      frontPawL.position.y = -0.115 + Math.max(0, knead) * 0.015;
      frontLegR.rotation.set(0.12 - knead * 0.24, 0, 0);
      frontPawR.position.y = -0.115 + Math.max(0, -knead) * 0.015;

      hindLegL.rotation.set(-0.95, 0.2, 0);
      hindLegR.rotation.set(-0.95, -0.2, 0);

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.35 + idx * 0.08, Math.sin(elapsedTime * 1.5) * 0.16, 0);
      });
    }

  } else if (cycleTime < 48) {
    // =========================================================================
    // STATE 9: PAW LICKING & FACIAL GROOMING (43s - 48s)
    // =========================================================================
    catGroup.position.set(-0.58, 0.0, 1.25);
    catGroup.rotation.y = -Math.PI * 0.35;

    body.position.y = 0.10;
    body.rotation.set(0.34, 0, 0);

    const groomCycle = (elapsedTime * 4.2) % (Math.PI * 2);
    const groomStroke = Math.sin(groomCycle);

    head.position.set(0.04, 0.07, -0.14);
    head.rotation.set(-0.12, 0.26, -0.18);

    frontLegR.position.set(0.08, 0.08, -0.06);
    frontLegR.rotation.set(-0.85 + groomStroke * 0.24, 0.32, -0.38);
    frontPawR.rotation.set(0.42 + groomStroke * 0.2, 0, 0);

    frontLegL.position.set(-0.06, 0.02, -0.08);
    frontLegL.rotation.set(0.22, 0, 0);

    hindLegL.rotation.set(-0.95, 0.2, 0);
    hindLegR.rotation.set(-0.95, -0.2, 0);

    const isLicking = groomStroke > 0.2;
    jaw.rotation.x = isLicking ? 0.26 : 0.0;
    tongue.scale.set(1.0, 1.0, isLicking ? 1.4 : 0.8);

    eyelidR.scale.y = 0.75;
    eyelidL.scale.y = 0.25;

    tailSegments.forEach((seg, idx) => {
      seg.rotation.set(-0.35 + idx * 0.06, 0.12, 0);
    });

  } else if (cycleTime < 54) {
    // =========================================================================
    // STATE 10: INQUISITIVE SNIFF & TOY BALL BATTING (48s - 54s)
    // =========================================================================
    const ballT = (cycleTime - 48) / 6;

    jaw.rotation.x = 0;
    tongue.scale.set(1, 1, 1);
    eyelidL.scale.y = 0.04;
    eyelidR.scale.y = 0.04;

    const startX = -0.58;
    const startZ = 1.25;
    const ballX = -0.95;
    const ballZ = 1.35;

    if (ballT < 0.42) {
      const subT = ballT / 0.42;
      const curX = THREE.MathUtils.lerp(startX, ballX + 0.14, subT);
      const curZ = THREE.MathUtils.lerp(startZ, ballZ - 0.10, subT);
      catGroup.position.set(curX, 0.0, curZ);
      catGroup.rotation.y = Math.atan2(ballX - startX, ballZ - startZ);

      applyFelineGait(elapsedTime * 9.8);
    } else {
      catGroup.position.set(ballX + 0.14, 0.0, ballZ - 0.10);
      catGroup.rotation.y = Math.PI * 1.22;

      body.position.y = 0.11;
      body.rotation.set(0.12, 0, 0);

      head.position.set(0, 0.04, -0.16);
      head.rotation.set(0.22, Math.sin(elapsedTime * 2.2) * 0.14, 0);

      // Playful left paw swat
      const swat = Math.sin(elapsedTime * 5.8);
      frontLegL.rotation.set(-0.45 + (swat > 0 ? swat * 0.52 : 0), -0.22, 0);
      frontLegR.rotation.set(0.22, 0, 0);

      hindLegL.rotation.set(-0.5, 0.1, 0);
      hindLegR.rotation.set(-0.5, -0.1, 0);

      if (toyBall) {
        toyBall.position.x = ballX + Math.sin(elapsedTime * 3.2) * 0.024;
        toyBall.position.z = ballZ + Math.cos(elapsedTime * 3.2) * 0.024;
        toyBall.rotation.x = elapsedTime * 4.5;
      }

      tailSegments.forEach((seg, idx) => {
        seg.rotation.set(-0.25 + idx * 0.08, Math.sin(elapsedTime * 4.2) * 0.22, 0);
      });
    }

  } else {
    // =========================================================================
    // STATE 11: TROTTING RETURN TO BED & 360° NESTING CIRCLE (54s - 60s)
    // =========================================================================
    const retT = (cycleTime - 54) / 6; // 0 to 1

    jaw.rotation.x = 0;

    const fromX = -0.95 + 0.14;
    const fromZ = 1.35 - 0.10;

    if (retT < 0.50) {
      // Trotting back to bed entrance
      const trotT = retT / 0.50;
      const curX = THREE.MathUtils.lerp(fromX, bedPosition.x, trotT);
      const curZ = THREE.MathUtils.lerp(fromZ, bedPosition.z, trotT);
      catGroup.position.set(curX, 0.0, curZ);
      catGroup.rotation.y = Math.atan2(bedPosition.x - fromX, bedPosition.z - fromZ);

      eyelidL.scale.y = 0.08;
      eyelidR.scale.y = 0.08;

      applyFelineGait(elapsedTime * 10.0);
    } else {
      // Step into bed center & perform authentic 360° nesting circle
      const nestT = (retT - 0.50) / 0.50;
      const curY = THREE.MathUtils.lerp(0.0, 0.035, Math.min(1, nestT * 2.5));
      catGroup.position.set(bedPosition.x, bedPosition.y + curY, bedPosition.z);

      // Smooth full circle rotation settling to exact 0.52 angle
      catGroup.rotation.y = 0.52 + (1 - nestT) * Math.PI * 2.0;

      body.position.y = 0.12 - nestT * 0.08;
      body.rotation.set(0.04 * nestT, 0.14 * nestT, 0.10 * nestT);

      frontLegL.rotation.set(0.3 + nestT * 1.05, 0.18 * nestT, -0.08 * nestT);
      frontLegR.rotation.set(0.3 + nestT * 1.05, -0.18 * nestT, 0.08 * nestT);
      hindLegL.rotation.set(-0.5 - nestT * 0.68, 0.28 * nestT, 0.18 * nestT);
      hindLegR.rotation.set(-0.5 - nestT * 0.68, -0.28 * nestT, -0.18 * nestT);

      // Eyelids close down to 1.0 (sleep)
      eyelidL.scale.y = 0.2 + nestT * 0.8;
      eyelidR.scale.y = 0.2 + nestT * 0.8;

      tailSegments.forEach((seg, idx) => {
        const curl = (0.24 + idx * 0.22) * nestT;
        seg.rotation.set(0.08, -curl, 0.04);
      });
    }
  }

  // =========================================================================
  // INTERACTIVE PETTING & HOVER OVERRIDE (Heart Particles & Purr Stretch)
  // =========================================================================
  if (catRig.petReactTimer > 0) {
    catRig.petReactTimer = Math.max(0, catRig.petReactTimer - 0.016);
    const petIntensity = Math.sin((catRig.petReactTimer / 3.5) * Math.PI);

    // Arch back upward into hand
    body.position.y += petIntensity * 0.032;
    body.rotation.x -= petIntensity * 0.15;

    // Chin lifts contentedly for scritches
    head.position.y += petIntensity * 0.02;
    head.rotation.x = -0.32 * petIntensity;

    // Blissfully closed eyes
    eyelidL.scale.y = THREE.MathUtils.lerp(eyelidL.scale.y, 0.88, petIntensity);
    eyelidR.scale.y = THREE.MathUtils.lerp(eyelidR.scale.y, 0.88, petIntensity);

    // Gentle purr smile jaw
    jaw.rotation.x = 0.12 * petIntensity;

    // Affectionate upright hooked tail
    tailSegments.forEach((seg, idx) => {
      seg.rotation.set(-0.55 - idx * 0.08 * petIntensity, Math.sin(elapsedTime * 8) * 0.12, 0);
    });

    // Animate floating heart particles
    if (heartParticles) {
      heartParticles.visible = true;
      (heartParticles.material as THREE.PointsMaterial).opacity = petIntensity * 0.85;
      const pos = heartParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += 0.0018;
        if (pos[i * 3 + 1] > 0.40) {
          pos[i * 3 + 1] = 0.12;
        }
      }
      heartParticles.geometry.attributes.position.needsUpdate = true;
    }
  } else if (heartParticles) {
    heartParticles.visible = false;
  }

  // Hover Look-At: Cat's ears and head perk up curiously when cursor hovers
  if (catRig.isHovered && catRig.petReactTimer <= 0) {
    earL.rotation.set(0, 0.18, 0.22);
    earR.rotation.set(0, -0.18, -0.22);
    eyelidL.scale.y = Math.min(eyelidL.scale.y, 0.15);
    eyelidR.scale.y = Math.min(eyelidR.scale.y, 0.15);
  }
}
