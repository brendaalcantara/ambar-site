import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type CandleQuality = "mobile" | "desktop";

export type CandleModel = {
  group: THREE.Group;
  matchTarget: THREE.Vector3;
  setFlameVisible: (visible: boolean) => void;
  setBurnProgress: (progress: number) => void;
  startSmoke: (time: number) => void;
  update: (time: number, reducedMotion?: boolean) => void;
  dispose: () => void;
};

function seededNoise(seed: number): () => number {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function makeNoiseTexture(size: number, seed: number, contrast = 42): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const random = seededNoise(seed);
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 128 + Math.floor((random() - .5) * contrast);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function makeWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const gradient = ctx.createLinearGradient(0, 0, 768, 768);
  gradient.addColorStop(0, "#e0bf84");
  gradient.addColorStop(.5, "#c69a5c");
  gradient.addColorStop(1, "#ad7942");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 768, 768);
  for (let y = -20; y < 800; y += 24) {
    ctx.strokeStyle = y % 48 === 0 ? "rgba(90,50,20,.42)" : "rgba(104,64,29,.2)";
    ctx.lineWidth = y % 48 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(-30, y);
    ctx.bezierCurveTo(140, y - 22, 220, y + 20, 390, y - 5);
    ctx.bezierCurveTo(510, y - 24, 650, y + 23, 800, y - 8);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function makeLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");

  const backdrop = ctx.createLinearGradient(0, 0, 1400, 800);
  backdrop.addColorStop(0, "#e5c5b2");
  backdrop.addColorStop(.42, "#d5ab93");
  backdrop.addColorStop(1, "#b98265");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, 1400, 800);

  const drawBean = (x: number, y: number, length: number, angle: number, width: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const beanGradient = ctx.createLinearGradient(0, -width, 0, width);
    beanGradient.addColorStop(0, "#2f1a18");
    beanGradient.addColorStop(.5, "#5c3128");
    beanGradient.addColorStop(1, "#251512");
    ctx.strokeStyle = beanGradient;
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.bezierCurveTo(-length * .2, -width * .65, length * .18, width * .5, length / 2, 0);
    ctx.stroke();
    ctx.restore();
  };

  const drawFlower = (x: number, y: number, scale: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    for (let petal = 0; petal < 5; petal += 1) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * petal) / 5);
      const petalGradient = ctx.createLinearGradient(0, -96 * scale, 0, 14 * scale);
      petalGradient.addColorStop(0, "rgba(255,248,228,.72)");
      petalGradient.addColorStop(.62, "rgba(244,222,194,.98)");
      petalGradient.addColorStop(1, "rgba(197,142,113,.82)");
      ctx.fillStyle = petalGradient;
      ctx.beginPath();
      ctx.ellipse(0, -39 * scale, 24 * scale, 60 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#9d6347";
    ctx.beginPath();
    ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(250,221,179,.9)";
    ctx.beginPath();
    ctx.arc(-2 * scale, -3 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawFlower(82, 98, 1.04, -.42);
  drawFlower(1318, 98, 1.04, .58);
  drawFlower(80, 704, .92, .5);
  drawFlower(1320, 704, .96, -.64);
  drawBean(94, 255, 236, -.93, 22);
  drawBean(1306, 255, 236, .93, 22);
  drawBean(94, 620, 222, .84, 20);
  drawBean(1306, 620, 222, -.84, 20);

  const random = seededNoise(8842);
  for (let i = 0; i < 760; i += 1) {
    const alpha = .018 + random() * .026;
    ctx.fillStyle = random() > .5 ? `rgba(83,48,36,${alpha})` : `rgba(255,244,226,${alpha})`;
    const size = .7 + random() * 1.8;
    ctx.fillRect(random() * 1400, random() * 800, size, size);
  }

  ctx.fillStyle = "#f5f0ef";
  ctx.fillRect(132, 68, 1136, 664);
  ctx.strokeStyle = "rgba(108,83,76,.72)";
  ctx.lineWidth = 2.2;
  ctx.strokeRect(132, 68, 1136, 664);
  ctx.strokeStyle = "rgba(116,91,83,.68)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(134, 202);
  ctx.lineTo(1266, 202);
  ctx.moveTo(134, 624);
  ctx.lineTo(1266, 624);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#66544e";
  ctx.font = "500 22px Arial, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("ÂMBAR ESSENCE VELAS AROMÁTICAS", 700, 150);
  ctx.fillStyle = "#4b3b3a";
  ctx.font = "500 78px Didot, 'Bodoni MT', Georgia, serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("BLACK VANILLA", 700, 401);
  ctx.fillStyle = "#675754";
  ctx.font = "500 25px Arial, sans-serif";
  ctx.letterSpacing = "2.2px";
  ctx.fillText("AROMA DOCE ACONCHEGANTE", 700, 452);
  ctx.font = "400 21px Arial, sans-serif";
  ctx.letterSpacing = "1.8px";
  ctx.fillText("CERA VEGETAL", 700, 532);
  ctx.font = "400 20px Arial, sans-serif";
  ctx.letterSpacing = "1.4px";
  ctx.fillText("100g", 700, 690);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeJarGeometry(segments: number): THREE.BufferGeometry {
  const profile = [
    // Open, thin lower edge: avoids the dense glass disc that looked like a
    // clipped shadow against the dark ritual background.
    new THREE.Vector2(.94, .075),
    new THREE.Vector2(1.01, .08),
    new THREE.Vector2(1.045, .13),
    new THREE.Vector2(1.055, 2.06),
    new THREE.Vector2(1.04, 2.15),
    new THREE.Vector2(1.0, 2.19),
    new THREE.Vector2(.968, 2.18),
    new THREE.Vector2(.955, 2.135),
  ];
  const latheGeometry = new THREE.LatheGeometry(profile, segments);
  // The glass has no texture map, so its UV seam can be removed. Welding the
  // coincident vertices gives transmission a continuous normal around the jar.
  latheGeometry.deleteAttribute("uv");
  const geometry = mergeVertices(latheGeometry, 1e-5);
  latheGeometry.dispose();
  geometry.computeVertexNormals();
  return geometry;
}

function makeWaxGeometry(segments: number): THREE.LatheGeometry {
  const profile = [
    new THREE.Vector2(0, -.07),
    new THREE.Vector2(.88, -.07),
    new THREE.Vector2(.945, 0),
    new THREE.Vector2(.95, 1.72),
    new THREE.Vector2(.86, 1.76),
    new THREE.Vector2(.68, 1.74),
    new THREE.Vector2(.48, 1.68),
    new THREE.Vector2(.24, 1.62),
    new THREE.Vector2(0, 1.6),
  ];
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.computeVertexNormals();
  return geometry;
}

export function createFlameVfx(): {
  group: THREE.Group;
  light: THREE.PointLight;
  material: THREE.ShaderMaterial;
  update: (time: number, reducedMotion: boolean) => void;
  dispose: () => void;
} {
  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float upper = smoothstep(.12, 1.0, uv.y);
        p.x *= mix(1.0, .48, upper);
        p.x += sin(uTime * 8.0 + uv.y * 10.0) * .028 * upper;
        p.y += sin(uTime * 11.0 + uv.y * 7.0) * .014 * upper;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 p = vUv - vec2(.5, .42);
        float y = vUv.y;
        vec2 basePoint = vec2(p.x / .34, (y - .17) / .17);
        float roundedBase = 1.0 - smoothstep(.84, 1.04, length(basePoint));
        float taper = mix(.31, .045, smoothstep(.18, .98, y));
        float upperBody = (1.0 - smoothstep(taper * .74, taper, abs(p.x))) * smoothstep(.13, .27, y);
        float body = max(roundedBase, upperBody);
        float top = 1.0 - smoothstep(.83, 1.0, vUv.y);
        float shimmer = .88 + .12 * sin(uTime * 15.0 + vUv.y * 24.0 + hash(vUv * 9.0) * 3.0);
        float alpha = body * top * shimmer * uIntensity;
        vec2 corePoint = vec2(p.x / .16, (y - .18) / .115);
        float roundedCore = 1.0 - smoothstep(.78, 1.06, length(corePoint));
        float coreStem = smoothstep(.25, .05, abs(p.x)) * smoothstep(.2, .34, y) * (1.0 - smoothstep(.48, .76, y));
        float core = max(roundedCore, coreStem);
        vec3 amber = vec3(1.0, .34, .055);
        vec3 gold = vec3(1.0, .72, .18);
        vec3 ivory = vec3(1.0, .97, .72);
        vec3 blue = vec3(.16, .28, .75);
        vec3 color = mix(amber, gold, smoothstep(.15, .62, vUv.y));
        color = mix(color, ivory, core);
        color = mix(blue, color, smoothstep(.03, .18, vUv.y));
        if (alpha < .015) discard;
        gl_FragColor = vec4(color * (1.1 + core * .7), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const group = new THREE.Group();
  const planeGeometry = new THREE.PlaneGeometry(.5, .86, 18, 28);
  planeGeometry.translate(0, .36, 0);
  const front = new THREE.Mesh(planeGeometry, material);
  const cross = new THREE.Mesh(planeGeometry, material);
  cross.rotation.y = Math.PI / 2;
  cross.scale.set(.82, .96, .82);
  front.renderOrder = 6;
  cross.renderOrder = 6;
  group.add(front, cross);
  const light = new THREE.PointLight(0xff9f37, 2.15, 4.4, 2);
  light.position.y = .2;
  group.add(light);
  return {
    group,
    light,
    material,
    update: (time, reducedMotion) => {
      const motionTime = reducedMotion ? time * .15 : time;
      uniforms.uTime.value = motionTime;
      const flicker = reducedMotion ? 1 : 1 + Math.sin(time * 12.7) * .05 + Math.sin(time * 21.3) * .025;
      uniforms.uIntensity.value = flicker;
      light.intensity = 2.1 * flicker;
    },
    dispose: () => {
      planeGeometry.dispose();
      material.dispose();
    },
  };
}

function makeSmoke(quality: CandleQuality): {
  group: THREE.Group;
  start: (time: number) => void;
  update: (time: number) => void;
  dispose: () => void;
} {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 128;
  textureCanvas.height = 128;
  const ctx = textureCanvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  ctx.clearRect(0, 0, 128, 128);
  const lobes = [
    { x: 64, y: 72, radius: 32, alpha: .68 },
    { x: 48, y: 60, radius: 24, alpha: .4 },
    { x: 78, y: 48, radius: 28, alpha: .48 },
    { x: 58, y: 35, radius: 20, alpha: .3 },
  ];
  lobes.forEach(({ x, y, radius, alpha }) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(.34, `rgba(255,255,255,${alpha * .62})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  });
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const count = quality === "mobile" ? 13 : 22;
  const random = seededNoise(2718);
  const group = new THREE.Group();
  const particles: Array<{
    sprite: THREE.Sprite;
    material: THREE.SpriteMaterial;
    delay: number;
    seed: number;
    phase: number;
    lifetime: number;
  }> = [];
  for (let i = 0; i < count; i += 1) {
    const seed = random();
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: new THREE.Color().setHSL(.075, .07, .27 + seed * .08),
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 9;
    group.add(sprite);
    particles.push({
      sprite,
      material,
      delay: i * .095,
      seed,
      phase: random() * Math.PI * 2,
      lifetime: 2.15 + random() * .65,
    });
  }
  group.visible = false;
  let startTime = Number.POSITIVE_INFINITY;
  let active = false;
  return {
    group,
    start: (time) => {
      startTime = time;
      active = true;
      group.visible = true;
      particles.forEach(({ material }) => { material.opacity = 0; });
    },
    update: (time) => {
      if (!active) return;
      const elapsed = time - startTime;
      let hasVisibleParticle = false;
      particles.forEach(({ sprite, material, delay, seed, phase, lifetime }) => {
        const age = elapsed - delay;
        if (age <= 0 || age >= lifetime) {
          material.opacity = 0;
          return;
        }
        hasVisibleParticle = true;
        const life = age / lifetime;
        const curl = Math.sin(age * (2.15 + seed * .8) + phase);
        const secondCurl = Math.sin(age * 1.17 + phase * .63);
        sprite.position.set(
          curl * (.022 + life * .13) + secondCurl * life * .055,
          age * (.32 + seed * .085),
          Math.cos(age * 1.55 + phase) * (.018 + life * .055),
        );
        const scale = .085 + life * .28 + Math.sin(age * 3.2 + phase) * .012;
        sprite.scale.set(scale * (.76 + seed * .22), scale, 1);
        sprite.material.rotation = curl * .24;
        const fadeIn = THREE.MathUtils.smoothstep(life, 0, .16);
        const fadeOut = 1 - THREE.MathUtils.smoothstep(life, .48, 1);
        material.opacity = fadeIn * fadeOut * (.28 + seed * .16);
      });
      if (!hasVisibleParticle && elapsed > count * .095 + 2.9) {
        active = false;
        group.visible = false;
      }
    },
    dispose: () => {
      particles.forEach(({ material }) => material.dispose());
      texture.dispose();
    },
  };
}

function makeLid(quality: CandleQuality): THREE.Group {
  const segments = quality === "mobile" ? 48 : 80;
  const group = new THREE.Group();
  const woodTexture = makeWoodTexture();
  const material = new THREE.MeshStandardMaterial({ map: woodTexture, color: 0xd2ad70, roughness: .72, bumpMap: makeNoiseTexture(128, 73, 28), bumpScale: .025 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, .23, segments, 2), material);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  const bevel = new THREE.Mesh(new THREE.TorusGeometry(1.025, .055, 12, segments), new THREE.MeshStandardMaterial({ color: 0xa4733b, roughness: .58 }));
  bevel.rotation.x = Math.PI / 2;
  bevel.position.y = -.115;
  group.add(bevel);
  return group;
}

export function createCandleModel(options: { lit: boolean; quality: CandleQuality; includeLid?: boolean }): CandleModel {
  const { lit, quality, includeLid = true } = options;
  const segments = quality === "mobile" ? 48 : 88;
  const group = new THREE.Group();
  const resources: Array<THREE.Texture | THREE.Material | THREE.BufferGeometry> = [];
  const waxBump = makeNoiseTexture(quality === "mobile" ? 128 : 256, 41, 36);
  resources.push(waxBump);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8eee7,
    roughness: .055,
    metalness: 0,
    transmission: .98,
    thickness: .22,
    ior: 1.48,
    attenuationColor: new THREE.Color(0xdbe2d7),
    attenuationDistance: 3.8,
    clearcoat: .32,
    clearcoatRoughness: .08,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const jarGeometry = makeJarGeometry(segments);
  const jar = new THREE.Mesh(jarGeometry, glassMaterial);
  jar.renderOrder = 1;
  jar.castShadow = true;
  jar.receiveShadow = true;
  group.add(jar);
  resources.push(glassMaterial, jarGeometry);

  const waxMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeee5d7,
    roughness: .78,
    sheen: .16,
    sheenColor: new THREE.Color(0xfff5dd),
    sheenRoughness: .86,
    bumpMap: waxBump,
    bumpScale: .018,
  });
  const waxGeometry = makeWaxGeometry(segments);
  const wax = new THREE.Mesh(waxGeometry, waxMaterial);
  wax.position.y = .18;
  wax.castShadow = true;
  group.add(wax);
  resources.push(waxMaterial, waxGeometry);

  const meltMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf5ecdc, roughness: .34, clearcoat: .28, clearcoatRoughness: .18 });
  const meltPool = new THREE.Mesh(new THREE.RingGeometry(.23, .72, segments, 4), meltMaterial);
  meltPool.rotation.x = -Math.PI / 2;
  meltPool.position.y = 1.892;
  meltPool.scale.y = .88;
  group.add(meltPool);
  resources.push(meltPool.geometry, meltMaterial);

  const wickMaterial = new THREE.MeshStandardMaterial({ color: 0x38251d, roughness: .96 });
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(.014, .017, .205, 12, 3), wickMaterial);
  wick.position.y = 2.005;
  wick.rotation.z = -.045;
  group.add(wick);
  resources.push(wick.geometry, wickMaterial);
  const charMaterial = new THREE.MeshStandardMaterial({ color: 0x181210, roughness: .96, emissive: 0x5c1905, emissiveIntensity: lit ? .32 : 0 });
  const char = new THREE.Mesh(new THREE.CylinderGeometry(.017, .014, .055, 12, 2), charMaterial);
  char.position.set(-.004, 2.126, 0);
  char.rotation.z = -.045;
  group.add(char);
  resources.push(char.geometry, charMaterial);

  const labelTexture = makeLabelTexture();
  const labelMaterial = new THREE.MeshStandardMaterial({
    map: labelTexture,
    roughness: .96,
    metalness: 0,
    // Keep the paper visually opaque, but place it in Three's transparent
    // render pass so the transmissive glass cannot sample/refract the label.
    transparent: true,
    opacity: 1,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
  });
  const labelRadius = 1.074;
  const labelGeometry = new THREE.PlaneGeometry(1.46, .98, 48, 1);
  const labelPositions = labelGeometry.getAttribute("position");
  for (let index = 0; index < labelPositions.count; index += 1) {
    const x = labelPositions.getX(index);
    const surfaceZ = Math.sqrt(Math.max(0, labelRadius * labelRadius - x * x));
    labelPositions.setZ(index, surfaceZ - labelRadius);
  }
  labelPositions.needsUpdate = true;
  labelGeometry.computeVertexNormals();
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, 1.04, labelRadius + .014);
  label.renderOrder = 20;
  group.add(label);
  resources.push(labelTexture, labelMaterial, labelGeometry);

  if (includeLid) {
    const lid = makeLid(quality);
    lid.position.set(-1.18, .12, -.72);
    lid.rotation.set(.08, -.42, -.13);
    group.add(lid);
  }

  const flame = createFlameVfx();
  flame.group.position.y = 2.135;
  flame.group.scale.set(.55, .58, .55);
  flame.group.visible = lit;
  group.add(flame.group);

  const smoke = makeSmoke(quality);
  smoke.group.position.y = 2.14;
  group.add(smoke.group);

  const matchTarget = new THREE.Vector3(-.004, 2.13, 0);
  let flameEnabled = lit;
  let burnProgress = 0;
  const syncFlameVisibility = () => {
    const visible = flameEnabled && burnProgress < .995;
    flame.group.visible = visible;
    flame.light.visible = visible;
    charMaterial.emissiveIntensity = visible ? .32 : 0;
  };
  return {
    group,
    matchTarget,
    setFlameVisible: (visible) => {
      flameEnabled = visible;
      syncFlameVisibility();
    },
    setBurnProgress: (progress) => {
      burnProgress = THREE.MathUtils.clamp(progress, 0, 1);
      const surfaceY = THREE.MathUtils.lerp(1.892, 1.58, burnProgress);
      const waxScale = (surfaceY - .18) / (1.892 - .18);
      const wickScale = THREE.MathUtils.lerp(1, .18, burnProgress);
      const wickHeight = .205 * wickScale;
      wax.scale.y = waxScale;
      meltPool.position.y = surfaceY;
      wick.scale.y = wickScale;
      wick.position.y = surfaceY + wickHeight * .52;
      char.position.y = surfaceY + wickHeight + .018;
      flame.group.position.y = char.position.y + .009;
      smoke.group.position.y = char.position.y + .014;
      syncFlameVisibility();
    },
    startSmoke: (time) => smoke.start(time),
    update: (time, reducedMotion = false) => {
      if (flame.group.visible) flame.update(time, reducedMotion);
      smoke.update(time);
    },
    dispose: () => {
      smoke.dispose();
      const seen = new Set<unknown>();
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Points)) return;
        if (!seen.has(object.geometry)) {
          seen.add(object.geometry);
          object.geometry.dispose();
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture && !seen.has(value)) {
              seen.add(value);
              value.dispose();
            }
          });
          if (!seen.has(material)) {
            seen.add(material);
            material.dispose();
          }
        });
      });
      resources.forEach((resource) => {
        if (seen.has(resource)) return;
        seen.add(resource);
        resource.dispose();
      });
    },
  };
}
