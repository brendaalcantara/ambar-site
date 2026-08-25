import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createCandleModel, type CandleQuality } from "./candleModel";
import { bindWebGLFallback } from "./candleFallback";

function makeCircularShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const gradient = ctx.createRadialGradient(256, 256, 16, 256, 256, 246);
  gradient.addColorStop(0, "rgba(96,65,44,.46)");
  gradient.addColorStop(.48, "rgba(117,82,58,.27)");
  gradient.addColorStop(.76, "rgba(138,103,75,.1)");
  gradient.addColorStop(1, "rgba(150,119,91,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function chooseQuality(): CandleQuality {
  return window.matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop";
}

export function mountCandle3D(container: HTMLElement): () => void {
  const quality = chooseQuality();
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
  camera.position.set(0, 2.38, 5.2);
  camera.lookAt(0, 1.02, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: quality === "desktop",
    alpha: true,
    depth: true,
    stencil: false,
    precision: quality === "mobile" ? "mediump" : "highp",
    powerPreference: quality === "mobile" ? "default" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "mobile" ? 1 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = .88;
  renderer.shadowMap.enabled = quality === "desktop";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Vela aromática Black Vanilla em 3D. Arraste para girar.");
  const disposeContextFallback = bindWebGLFallback(renderer.domElement, container, {
    lit: true,
    message: "Modo compatível da vela",
  });

  let environment: THREE.WebGLRenderTarget | undefined;
  if (quality === "desktop") {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, .035);
    scene.environment = environment.texture;
    scene.environmentIntensity = .82;
    room.dispose();
    pmrem.dispose();
  }

  scene.add(new THREE.HemisphereLight(0xfff5df, 0x71513c, .9));
  const key = new THREE.DirectionalLight(0xffe3b7, 2.05);
  key.position.set(3.2, 5.5, 4.2);
  key.castShadow = quality === "desktop";
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xabc29b, .72);
  rim.position.set(-4, 2.5, -3);
  scene.add(rim);
  const softbox = new THREE.DirectionalLight(0xffead3, quality === "mobile" ? .55 : .85);
  softbox.position.set(2.8, 3.25, 3.1);
  scene.add(softbox);
  const edgeStrip = new THREE.DirectionalLight(0xe9f1e2, quality === "mobile" ? .35 : .5);
  edgeStrip.position.set(-2.6, 2.3, 1.1);
  scene.add(edgeStrip);

  const candle = createCandleModel({ lit: true, quality, includeLid: false });
  candle.group.position.y = -.08;
  candle.group.scale.setScalar(.9);
  candle.group.rotation.y = -.08;
  scene.add(candle.group);

  const circularShadowTexture = makeCircularShadowTexture();
  const circularShadowMaterial = new THREE.MeshBasicMaterial({ map: circularShadowTexture, transparent: true, depthWrite: false, depthTest: true, toneMapped: false });
  const circularShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.48, 2.48), circularShadowMaterial);
  circularShadow.rotation.x = -Math.PI / 2;
  circularShadow.position.set(0, -.185, .08);
  circularShadow.renderOrder = -1;
  scene.add(circularShadow);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = .065;
  controls.minPolarAngle = Math.PI * .34;
  controls.maxPolarAngle = Math.PI * .57;
  controls.target.set(0, 1.02, 0);
  controls.autoRotate = !reducedMotionQuery.matches;
  controls.autoRotateSpeed = .28;

  let visible = true;
  let disposed = false;
  let lastFrame = 0;
  const clock = new THREE.Clock();
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .05 });
  intersectionObserver.observe(container);
  const onVisibility = () => { visible = !document.hidden; };
  document.addEventListener("visibilitychange", onVisibility);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  renderer.setAnimationLoop((time) => {
    if (disposed || !visible) return;
    if (quality === "mobile" && time - lastFrame < 1000 / 30) return;
    lastFrame = time;
    const elapsed = clock.getElapsedTime();
    controls.autoRotate = !reducedMotionQuery.matches;
    controls.update();
    candle.update(elapsed, reducedMotionQuery.matches);
    renderer.render(scene, camera);
  });

  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    disposeContextFallback();
    controls.dispose();
    candle.dispose();
    circularShadow.geometry.dispose();
    circularShadowMaterial.dispose();
    circularShadowTexture.dispose();
    environment?.dispose();
    renderer.dispose();
  };
}
