import * as THREE from 'three';

export interface DeveloperRig {
  devCharGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  leftFingers: THREE.Group[];
  rightFingers: THREE.Group[];
  leftThumb: THREE.Mesh;
  rightThumb: THREE.Mesh;
  leftForearm: THREE.Mesh;
  rightForearm: THREE.Mesh;
  leftUpperArm: THREE.Mesh;
  rightUpperArm: THREE.Mesh;
  eyelidL?: THREE.Mesh;
  eyelidR?: THREE.Mesh;
}

export function createRealisticDeveloper(): {
  devCharGroup: THREE.Group;
  devRig: DeveloperRig;
} {
  const devCharGroup = new THREE.Group();

  // =========================================================================
  // MATERIALS: HIGH-DEFINITION REALISTIC HUMAN PALETTE
  // =========================================================================
  // Skin tone with warm subsurface undertones
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xe0a283, // Natural warm healthy skin
    roughness: 0.52,
    metalness: 0.06,
  });

  const skinShadeMat = new THREE.MeshStandardMaterial({
    color: 0xc48065, // Under-chin & shadow regions
    roughness: 0.60,
    metalness: 0.05,
  });

  const stubbleMat = new THREE.MeshStandardMaterial({
    color: 0x3d322b, // Clean designer stubble shadow
    roughness: 0.88,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x2e231e, // Deep espresso dark brown hair
    roughness: 0.82,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.15,
  });

  const eyeIrisMat = new THREE.MeshStandardMaterial({
    color: 0x3d281a, // Rich hazel-amber iris
    roughness: 0.1,
  });

  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 });

  const lipMat = new THREE.MeshStandardMaterial({
    color: 0xbf7571,
    roughness: 0.42,
  });

  const nailMat = new THREE.MeshStandardMaterial({
    color: 0xedb9a6,
    roughness: 0.25,
    metalness: 0.1,
  });

  // Streetwear Hoodie in Rich Twilight Navy
  const hoodieMat = new THREE.MeshStandardMaterial({
    color: 0x2d3a52, // Rich twilight slate navy
    roughness: 0.72,
    metalness: 0.05,
  });

  const hoodieRibMat = new THREE.MeshStandardMaterial({
    color: 0x242f42, // Ribbed trim
    roughness: 0.85,
  });

  const drawStringMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Metallic silver drawstrings
    metalness: 0.94,
    roughness: 0.15,
  });

  // Trousers: Tailored Dark Indigo Selvedge Denim
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x253144, // Premium dark indigo denim
    roughness: 0.68,
    metalness: 0.04,
  });

  const pantsSeamMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Amber contrast stitching thread
    roughness: 0.5,
  });

  // Socks
  const sockMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Athletic off-white ribbed socks
    roughness: 0.85,
  });

  // Designer Tech Sneakers (Multi-layer luxury runner)
  const sneakerUpperMat = new THREE.MeshStandardMaterial({
    color: 0x2c3a50, // Slate navy suede
    roughness: 0.55,
  });

  const sneakerMeshMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Breathable mesh panel
    roughness: 0.8,
  });

  const sneakerMidsoleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Sculpted crisp white foam midsole
    roughness: 0.32,
  });

  const sneakerOutsoleMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Classic gum rubber waffle outsole
    roughness: 0.45,
  });

  const sneakerAirMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, // Cyan heel cushion air bubble
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
  });

  const sneakerAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Radiant orange heel clip & swoosh
    emissive: 0xf97316,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  // =========================================================================
  // 1. LEGS & FEET (ANATOMICALLY REALISTIC SITTING POSE)
  // =========================================================================
  // Pelvic girdle firmly resting on chair cushion (Y = 0.52 to 0.58)
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.28), pantsMat);
  pelvis.position.set(0, 0.575, 0.02);
  pelvis.castShadow = true;
  devCharGroup.add(pelvis);

  // Left & Right Legs with natural ergonomic posture
  [-1, 1].forEach((side) => {
    const legGroup = new THREE.Group();
    // Natural hip joint spacing with subtle abduction
    const hipX = side * 0.145;
    legGroup.position.set(hipX, 0.575, 0.02);

    // Thigh: Muscle-tapered cylinder resting horizontally across chair seat cushion
    const thighLength = 0.36;
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.062, thighLength, 16),
      pantsMat
    );
    thigh.position.set(0, 0.0, -thighLength / 2);
    thigh.rotation.x = Math.PI / 2 + 0.03; // Gentle downward slope toward knees
    thigh.rotation.z = -side * 0.06; // Relaxed natural knee abduction
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Contrast Outseam along thigh
    const outseam = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.005, thighLength),
      pantsSeamMat
    );
    outseam.position.set(side * 0.068, 0.02, -thighLength / 2);
    legGroup.add(outseam);

    // Front Pocket Arc Seam
    const pocketArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.003, 6, 12, Math.PI / 2),
      pantsSeamMat
    );
    pocketArc.position.set(side * 0.03, 0.05, -0.06);
    pocketArc.rotation.x = Math.PI / 2;
    pocketArc.rotation.z = side * 0.5;
    legGroup.add(pocketArc);

    // Anatomical Knee Joint with draping fabric pleats
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(side * 0.015, -0.012, -thighLength);

    const patella = new THREE.Mesh(new THREE.SphereGeometry(0.064, 14, 12), pantsMat);
    kneeGroup.add(patella);

    // 3 Horizontal Fabric Tension Folds over Knee Cap
    [-0.018, 0.0, 0.018].forEach((ky) => {
      const pleat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.066, 0.066, 0.008, 14),
        pantsMat
      );
      pleat.position.set(0, ky, -0.008 - Math.abs(ky) * 0.2);
      pleat.rotation.x = Math.PI / 2;
      kneeGroup.add(pleat);
    });
    legGroup.add(kneeGroup);

    // Lower Leg / Calf / Shin: Tapering down to ankles
    const shinLength = 0.44;
    const shinAngleX = side === 1 ? 0.08 : 0.02; // Right foot relaxed slightly forward
    const shinGroup = new THREE.Group();
    shinGroup.position.set(side * 0.015, -0.012, -thighLength);
    shinGroup.rotation.x = shinAngleX;

    const calf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.044, shinLength, 16),
      pantsMat
    );
    calf.position.set(0, -shinLength / 2, 0);
    calf.castShadow = true;
    shinGroup.add(calf);

    // Jean Ankle Cuff Fold
    const jeanCuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.047, 0.009, 8, 16),
      pantsMat
    );
    jeanCuff.position.set(0, -shinLength + 0.025, 0);
    jeanCuff.rotation.x = Math.PI / 2;
    shinGroup.add(jeanCuff);

    // Ribbed Athletic Socks bridging into sneaker collar
    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.042, 0.065, 14),
      sockMat
    );
    sock.position.set(0, -shinLength + 0.005, 0);
    shinGroup.add(sock);

    legGroup.add(shinGroup);
    devCharGroup.add(legGroup);

    // =========================================================================
    // DESIGNER TECH SNEAKERS (RESTING FIRMLY ON FLOOR, Y = 0)
    // =========================================================================
    const shoeGroup = new THREE.Group();
    const shoeZ = side === 1 ? -0.38 : -0.34; // Subtle natural asymmetry
    shoeGroup.position.set(hipX + side * 0.015, 0, shoeZ);
    shoeGroup.rotation.y = side * 0.08; // Natural toe-out angle

    // Gum Rubber Outsole (contact with floor)
    const outsole = new THREE.Mesh(
      new THREE.BoxGeometry(0.098, 0.012, 0.25),
      sneakerOutsoleMat
    );
    outsole.position.set(0, 0.006, 0);
    outsole.receiveShadow = true;
    shoeGroup.add(outsole);

    // Sculpted EVA Midsole
    const midsole = new THREE.Mesh(
      new THREE.BoxGeometry(0.096, 0.028, 0.245),
      sneakerMidsoleMat
    );
    midsole.position.set(0, 0.024, 0);
    midsole.castShadow = true;
    shoeGroup.add(midsole);

    // Heel Air Cushion Unit
    const airBubble = new THREE.Mesh(
      new THREE.BoxGeometry(0.090, 0.014, 0.075),
      sneakerAirMat
    );
    airBubble.position.set(0, 0.024, 0.06);
    shoeGroup.add(airBubble);

    // Multi-Panel Upper (Suede + Breathable Mesh)
    const upper = new THREE.Mesh(
      new THREE.BoxGeometry(0.092, 0.062, 0.22),
      sneakerUpperMat
    );
    upper.position.set(0, 0.056, -0.01);
    upper.castShadow = true;
    shoeGroup.add(upper);

    // Breathable Vamp Mesh on Toe Box
    const vampMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.015, 0.09),
      sneakerMeshMat
    );
    vampMesh.position.set(0, 0.075, -0.065);
    vampMesh.rotation.x = -0.15;
    shoeGroup.add(vampMesh);

    // Rounded Toe Bumper
    const toeBumper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.088, 12),
      sneakerMidsoleMat
    );
    toeBumper.position.set(0, 0.038, -0.115);
    toeBumper.rotation.z = Math.PI / 2;
    shoeGroup.add(toeBumper);

    // Radiant Orange Accent Swoosh on Sides
    [-0.048, 0.048].forEach((swX) => {
      const swoosh = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, 0.015, 0.12),
        sneakerAccentMat
      );
      swoosh.position.set(swX, 0.055, 0.01);
      swoosh.rotation.z = swX > 0 ? -0.12 : 0.12;
      shoeGroup.add(swoosh);
    });

    // Padded Tongue & Criss-Cross Laces
    const tongue = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.012, 0.095),
      sneakerUpperMat
    );
    tongue.position.set(0, 0.088, -0.015);
    tongue.rotation.x = -0.32;
    shoeGroup.add(tongue);

    [-0.02, 0.005, 0.03].forEach((lz) => {
      const lace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.046, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      lace.position.set(0, 0.090, lz);
      lace.rotation.z = Math.PI / 2;
      shoeGroup.add(lace);
    });

    // Heel Pull-Tab with Orange Stripe
    const pullTab = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.028, 0.004),
      sneakerAccentMat
    );
    pullTab.position.set(0, 0.09, 0.10);
    shoeGroup.add(pullTab);

    devCharGroup.add(shoeGroup);
  });

  // =========================================================================
  // 2. SEATED TORSO & HOODIE (LINKED TO BREATHING ANIMATION)
  // =========================================================================
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.68, -0.01);
  torsoGroup.rotation.x = 0.05; // Natural ergonomic posture towards screens

  // Waist
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.22), hoodieMat);
  waist.position.set(0, 0, 0);
  waist.castShadow = true;
  torsoGroup.add(waist);

  // Ribbed Waistband Hem
  const waistHem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.176, 0.176, 0.038, 20),
    hoodieRibMat
  );
  waistHem.position.set(0, -0.07, 0);
  torsoGroup.add(waistHem);

  // Broad Athletic Chest & Back
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.34, 0.22), hoodieMat);
  chest.position.set(0, 0.21, -0.01);
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Front Kangaroo Pocket
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.13, 0.03), hoodieRibMat);
  pocket.position.set(0, 0.07, -0.12);
  pocket.rotation.x = -0.1;
  torsoGroup.add(pocket);

  // Draped Cowl Collar
  const cowl = new THREE.Mesh(new THREE.TorusGeometry(0.086, 0.024, 8, 20), hoodieMat);
  cowl.position.set(0, 0.36, -0.01);
  cowl.rotation.x = Math.PI / 2 - 0.15;
  torsoGroup.add(cowl);

  // Draped Hood in Back
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.10), hoodieMat);
  hood.position.set(0, 0.33, 0.08);
  hood.rotation.x = 0.15;
  hood.castShadow = true;
  torsoGroup.add(hood);

  // Metallic Drawstrings & Aglets
  [-0.055, 0.055].forEach((dx) => {
    const stringMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0028, 0.0028, 0.16, 8),
      drawStringMat
    );
    stringMesh.position.set(dx, 0.23, -0.13);
    torsoGroup.add(stringMesh);

    const aglet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0035, 0.022, 8),
      drawStringMat
    );
    aglet.position.set(dx, 0.14, -0.13);
    torsoGroup.add(aglet);
  });

  devCharGroup.add(torsoGroup);

  // =========================================================================
  // 3. HEAD, SCULPTED FACE, NATURAL HAIR & STUDIO REFERENCE HEADPHONES
  // =========================================================================
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.064, 0.15, 16), skinMat);
  neck.position.set(0, 1.20, -0.01);
  neck.rotation.x = 0.04;
  devCharGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.34, -0.03);
  headGroup.rotation.x = -0.06;

  // Head Base
  const headBase = new THREE.Mesh(new THREE.SphereGeometry(0.108, 24, 20), skinMat);
  headBase.scale.set(0.88, 1.08, 0.95);
  headBase.castShadow = true;
  headGroup.add(headBase);

  // Sculpted Jawline & Chin
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.075, 0.11), skinMat);
  jaw.position.set(0, -0.062, -0.04);
  headGroup.add(jaw);

  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.036, 0.042), skinMat);
  chin.position.set(0, -0.086, -0.082);
  headGroup.add(chin);

  // 5 O'Clock Stubble Shadow
  const stubble = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.065, 0.09), stubbleMat);
  stubble.position.set(0, -0.072, -0.055);
  headGroup.add(stubble);

  // Nose Bridge & Nostrils
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.055, 8), skinMat);
  nose.position.set(0, -0.012, -0.098);
  nose.rotation.x = -0.22;
  headGroup.add(nose);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), skinMat);
  noseTip.position.set(0, -0.034, -0.106);
  headGroup.add(noseTip);

  // Defined Lips
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.015, 0.018), lipMat);
  lips.position.set(0, -0.058, -0.092);
  headGroup.add(lips);

  // Hazel-Amber Eyes with Luminous Screen Reflections
  let eyelidL: THREE.Mesh | undefined;
  let eyelidR: THREE.Mesh | undefined;

  [-0.038, 0.038].forEach((ex, ei) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), eyeWhiteMat);
    eyeWhite.position.set(ex, 0.008, -0.088);
    headGroup.add(eyeWhite);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 10, 8), eyeIrisMat);
    iris.position.set(ex, 0.008, -0.10);
    headGroup.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), eyePupilMat);
    pupil.position.set(ex, 0.008, -0.106);
    headGroup.add(pupil);

    // Eyelid for natural blinking
    const eyelid = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      skinMat
    );
    eyelid.position.set(ex, 0.012, -0.086);
    eyelid.rotation.x = -0.2;
    headGroup.add(eyelid);

    if (ei === 0) eyelidL = eyelid;
    else eyelidR = eyelid;

    // Masculine Eyebrows
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.012), hairMat);
    brow.position.set(ex, 0.026, -0.092);
    brow.rotation.z = (ei === 0 ? -1 : 1) * 0.12;
    headGroup.add(brow);
  });

  // Layered Textured Crop Haircut
  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.114, 20, 16), hairMat);
  hairBase.position.set(0, 0.02, 0.01);
  hairBase.scale.set(0.9, 1.05, 0.98);
  headGroup.add(hairBase);

  // Textured pompadour/fringe strands
  for (let s = -4; s <= 4; s++) {
    const strand = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.065, 5), hairMat);
    strand.position.set(s * 0.018, 0.105, -0.065 + Math.abs(s) * 0.006);
    strand.rotation.x = -Math.PI / 3 + s * 0.04;
    strand.rotation.z = -s * 0.08;
    headGroup.add(strand);
  }

  // Premium Studio Reference Headphones
  const hpLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x141e2e,
    roughness: 0.6,
    metalness: 0.2,
  });
  const hpMetalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.95,
    roughness: 0.15,
  });

  // Headband
  const headband = new THREE.Mesh(
    new THREE.TorusGeometry(0.122, 0.014, 8, 24, Math.PI),
    hpLeatherMat
  );
  headband.position.set(0, 0.06, 0.01);
  headband.rotation.x = -Math.PI / 2;
  headband.rotation.z = Math.PI;
  headGroup.add(headband);

  // Earcups
  [-0.115, 0.115].forEach((hx) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.026, 16), hpLeatherMat);
    cup.position.set(hx, -0.02, 0);
    cup.rotation.z = Math.PI / 2;
    headGroup.add(cup);

    const metalRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.006, 16),
      hpMetalMat
    );
    metalRing.position.set(hx + (hx > 0 ? 0.014 : -0.014), -0.02, 0);
    metalRing.rotation.z = Math.PI / 2;
    headGroup.add(metalRing);
  });

  devCharGroup.add(headGroup);

  // =========================================================================
  // 4. ARMS, WRISTS, SMARTWATCH & ACTIVE DYNAMIC TYPING HANDS
  // =========================================================================
  const leftFingers: THREE.Group[] = [];
  const rightFingers: THREE.Group[] = [];
  let leftThumbMesh: THREE.Mesh;
  let rightThumbMesh: THREE.Mesh;

  // --- Left Arm & Hand ---
  const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.076, 16, 14), hoodieMat);
  leftShoulder.position.set(-0.21, 1.08, -0.02);
  devCharGroup.add(leftShoulder);

  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.046, 0.28, 14),
    hoodieMat
  );
  leftUpperArm.position.set(-0.23, 0.94, -0.08);
  leftUpperArm.rotation.x = 0.50;
  leftUpperArm.rotation.z = 0.14;
  devCharGroup.add(leftUpperArm);

  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.038, 0.26, 14),
    hoodieMat
  );
  leftForearm.position.set(-0.175, 0.805, -0.28);
  leftForearm.rotation.x = 1.30;
  leftForearm.rotation.y = -0.30;
  leftForearm.rotation.z = 0.20;
  devCharGroup.add(leftForearm);

  // Smartwatch on left wrist with illuminated display
  const watchGroup = new THREE.Group();
  watchGroup.position.set(-0.115, 0.822, -0.38);
  watchGroup.rotation.x = 1.35;
  watchGroup.rotation.y = -0.30;
  const watchCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.030, 0.011, 0.030),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
  );
  watchGroup.add(watchCase);
  const watchScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.002, 0.024),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.2,
    })
  );
  watchScreen.position.set(0, 0.006, 0);
  watchGroup.add(watchScreen);
  devCharGroup.add(watchGroup);

  // Left Hand: Positioned on keyboard left cluster (WASD, Cmd, Spacebar)
  const leftHand = new THREE.Group();
  leftHand.position.set(-0.10, 0.814, -0.44);
  leftHand.rotation.set(-0.04, 0.12, -0.04);

  const leftPalm = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.018, 0.068), skinMat);
  leftHand.add(leftPalm);

  // Thumb
  const leftThumbGroup = new THREE.Group();
  leftThumbGroup.position.set(0.038, -0.003, 0.012);
  leftThumbGroup.rotation.y = -0.50;
  leftThumbMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.034, 8), skinMat);
  leftThumbMesh.position.set(0, 0, -0.016);
  leftThumbMesh.rotation.x = Math.PI / 2.3;
  leftThumbGroup.add(leftThumbMesh);
  leftHand.add(leftThumbGroup);

  // 4 Articulated Fingers
  [-0.025, -0.008, 0.008, 0.025].forEach((fx) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(fx, 0.001, -0.034);

    const prox = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.0065, 0.024, 8), skinMat);
    prox.position.set(0, 0, -0.012);
    prox.rotation.x = 0.25;
    fGroup.add(prox);

    const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0055, 0.020, 8), skinMat);
    dist.position.set(0, -0.007, -0.026);
    dist.rotation.x = 0.60;
    fGroup.add(dist);

    const nail = new THREE.Mesh(new THREE.PlaneGeometry(0.0055, 0.0075), nailMat);
    nail.position.set(0, -0.003, -0.033);
    nail.rotation.x = -Math.PI / 3;
    fGroup.add(nail);

    leftFingers.push(fGroup);
    leftHand.add(fGroup);
  });
  devCharGroup.add(leftHand);

  // --- Right Arm & Hand ---
  const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.076, 16, 14), hoodieMat);
  rightShoulder.position.set(0.21, 1.08, -0.02);
  devCharGroup.add(rightShoulder);

  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.046, 0.28, 14),
    hoodieMat
  );
  rightUpperArm.position.set(0.23, 0.94, -0.08);
  rightUpperArm.rotation.x = 0.50;
  rightUpperArm.rotation.z = -0.14;
  devCharGroup.add(rightUpperArm);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.038, 0.26, 14),
    hoodieMat
  );
  rightForearm.position.set(0.175, 0.805, -0.28);
  rightForearm.rotation.x = 1.30;
  rightForearm.rotation.y = 0.30;
  rightForearm.rotation.z = -0.20;
  devCharGroup.add(rightForearm);

  // Right Hand: Positioned over right cluster / mouse
  const rightHand = new THREE.Group();
  rightHand.position.set(0.10, 0.814, -0.44);
  rightHand.rotation.set(-0.04, -0.12, 0.04);

  const rightPalm = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.018, 0.068), skinMat);
  rightHand.add(rightPalm);

  const rightThumbGroup = new THREE.Group();
  rightThumbGroup.position.set(-0.038, -0.003, 0.012);
  rightThumbGroup.rotation.y = 0.50;
  rightThumbMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.034, 8), skinMat);
  rightThumbMesh.position.set(0, 0, -0.016);
  rightThumbMesh.rotation.x = Math.PI / 2.3;
  rightThumbGroup.add(rightThumbMesh);
  rightHand.add(rightThumbGroup);

  [-0.025, -0.008, 0.008, 0.025].forEach((fx) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(fx, 0.001, -0.034);

    const prox = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.0065, 0.024, 8), skinMat);
    prox.position.set(0, 0, -0.012);
    prox.rotation.x = 0.25;
    fGroup.add(prox);

    const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0055, 0.020, 8), skinMat);
    dist.position.set(0, -0.007, -0.026);
    dist.rotation.x = 0.60;
    fGroup.add(dist);

    const nail = new THREE.Mesh(new THREE.PlaneGeometry(0.0055, 0.0075), nailMat);
    nail.position.set(0, -0.003, -0.033);
    nail.rotation.x = -Math.PI / 3;
    fGroup.add(nail);

    rightFingers.push(fGroup);
    rightHand.add(fGroup);
  });
  devCharGroup.add(rightHand);

  const devRig: DeveloperRig = {
    devCharGroup,
    torsoGroup,
    headGroup,
    leftHand,
    rightHand,
    leftFingers,
    rightFingers,
    leftThumb: leftThumbMesh,
    rightThumb: rightThumbMesh,
    leftForearm,
    rightForearm,
    leftUpperArm,
    rightUpperArm,
    eyelidL,
    eyelidR,
  };

  return {
    devCharGroup,
    devRig,
  };
}

/**
 * High-definition active animation:
 * - Natural breathing expansion in chest and torso
 * - Real active typing keystrokes (burst cadence across keycaps)
 * - Fluid wrist and forearm adjustments
 * - Right hand periodic workflow: Types code -> reaches over to precision mouse -> clicks and scrolls -> returns to keyboard!
 * - Head tracking monitors with eye blinking
 */
export function updateDeveloperAnimation(
  rig: DeveloperRig,
  elapsedTime: number
): void {
  const {
    torsoGroup,
    headGroup,
    leftHand,
    rightHand,
    leftFingers,
    rightFingers,
    leftThumb,
    rightThumb,
    rightForearm,
    rightUpperArm,
    eyelidL,
    eyelidR,
  } = rig;

  // 1. Natural Diaphragm Breathing & Ergonomic Micro-Shifts
  const breath = Math.sin(elapsedTime * 1.6) * 0.004;
  torsoGroup.position.y = 0.68 + breath;
  torsoGroup.rotation.x = 0.05 + Math.sin(elapsedTime * 1.6) * 0.005;

  // 2. Head Gaze Tracking: Shifts focus between Center Code, Left Telemetry & Laptop
  const headScan = Math.sin(elapsedTime * 0.35) * 0.07 + Math.sin(elapsedTime * 0.18) * 0.04;
  headGroup.rotation.y = headScan;
  headGroup.rotation.x = -0.06 + Math.sin(elapsedTime * 0.7) * 0.015;

  // Natural Blinking
  if (eyelidL && eyelidR) {
    const isBlinking = Math.sin(elapsedTime * 3.5) > 0.94;
    eyelidL.scale.y = isBlinking ? 1.0 : 0.05;
    eyelidR.scale.y = isBlinking ? 1.0 : 0.05;
  }

  // 3. Realistic Keyboard Typing & Mouse Navigation Cycle
  // A 12-second cycle:
  // 0s - 8.5s: Fast, active two-handed code typing (~110 WPM)
  // 8.5s - 11.5s: Right hand moves to mouse on desk, clicks & scrolls, then glides back!
  const workPhase = elapsedTime % 12.0;
  const isUsingMouse = workPhase >= 8.5 && workPhase < 11.2;

  // --- Left Hand Typing Cadence ---
  // Shifts across QWERTY left cluster
  const leftHandJitterX = Math.sin(elapsedTime * 4.2) * 0.018 + Math.cos(elapsedTime * 8.5) * 0.008;
  const leftHandJitterZ = Math.cos(elapsedTime * 3.6) * 0.012;
  leftHand.position.x = -0.10 + leftHandJitterX;
  leftHand.position.z = -0.44 + leftHandJitterZ;
  leftHand.rotation.z = Math.sin(elapsedTime * 5.0) * 0.03;
  leftHand.rotation.x = -0.04 + Math.sin(elapsedTime * 14.0) * 0.02;

  // Individual Left Finger Keystrokes (High articulation)
  leftFingers.forEach((finger, fIdx) => {
    const freq = 18 + fIdx * 4.2;
    const phase = fIdx * 1.8;
    const stroke = Math.max(0, Math.sin(elapsedTime * freq + phase));
    finger.position.y = -stroke * 0.006; // Clearly visible key travel
    finger.rotation.x = -stroke * 0.28;
  });

  if (leftThumb) {
    const thumbStroke = Math.max(0, Math.sin(elapsedTime * 5.5 + 0.5));
    leftThumb.position.y = -thumbStroke * 0.005;
  }

  // --- Right Hand: Typing or Navigating Mouse ---
  if (!isUsingMouse) {
    // Typing on right keyboard cluster
    const rightHandJitterX = Math.cos(elapsedTime * 4.4) * 0.018 + Math.sin(elapsedTime * 7.8) * 0.008;
    const rightHandJitterZ = Math.sin(elapsedTime * 3.8) * 0.012;
    rightHand.position.x = 0.10 + rightHandJitterX;
    rightHand.position.z = -0.44 + rightHandJitterZ;
    rightHand.position.y = 0.814;
    rightHand.rotation.set(-0.04, -0.12, 0.04);

    rightFingers.forEach((finger, fIdx) => {
      const freq = 17 + fIdx * 4.5;
      const phase = fIdx * 1.6 + 0.8;
      const stroke = Math.max(0, Math.sin(elapsedTime * freq + phase));
      finger.position.y = -stroke * 0.006;
      finger.rotation.x = -stroke * 0.28;
    });

    if (rightThumb) {
      const thumbStroke = Math.max(0, Math.sin(elapsedTime * 5.2 + 2.0));
      rightThumb.position.y = -thumbStroke * 0.005;
    }

    rightForearm.rotation.y = 0.30;
    rightUpperArm.rotation.z = -0.14;
  } else {
    // Transition to Mouse (Mouse is around x = 0.28, z = -0.42)
    const mouseT = (workPhase - 8.5) / 2.7; // 0 to 1
    // Smooth in-and-out curve
    const reachT = Math.sin(mouseT * Math.PI);

    const mouseTargetX = 0.28;
    const mouseTargetZ = -0.42;

    rightHand.position.x = THREE.MathUtils.lerp(0.10, mouseTargetX, reachT);
    rightHand.position.z = THREE.MathUtils.lerp(-0.44, mouseTargetZ, reachT);
    rightHand.position.y = 0.818 + Math.sin(mouseT * Math.PI) * 0.015; // Arc up and down onto mouse
    rightHand.rotation.set(-0.08, -0.05, 0.02);

    // Index finger click & middle finger wheel scroll on mouse
    const clickStroke = Math.max(0, Math.sin(elapsedTime * 6.5));
    if (rightFingers[1]) {
      rightFingers[1].position.y = -clickStroke * 0.005;
      rightFingers[1].rotation.x = -clickStroke * 0.22;
    }
    // Rest other fingers gently over the ergonomic mouse body
    rightFingers.forEach((f, idx) => {
      if (idx !== 1) {
        f.position.y = 0;
        f.rotation.x = -0.1;
      }
    });

    // Arm angles outward toward mouse pad
    rightForearm.rotation.y = THREE.MathUtils.lerp(0.30, 0.45, reachT);
    rightUpperArm.rotation.z = THREE.MathUtils.lerp(-0.14, -0.22, reachT);
  }
}
