import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { createCandleModel, type CandleQuality } from "./candleModel";

function makeGroundShadow(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 122);
  gradient.addColorStop(0, "rgba(74,48,32,.42)");
  gradient.addColorStop(.5, "rgba(91,58,38,.2)");
  gradient.addColorStop(1, "rgba(91,58,38,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export function mountBurnCandle3D(container: HTMLElement): { setProgress: (progress: number) => void; dispose: () => void } {
  const quality: CandleQuality = window.matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop";
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 35);
  camera.position.set(0, 2.28, 5.15);
  camera.lookAt(0, 1.02, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "mobile" ? 1.2 : 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = .9;
  container.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Vela Black Vanilla em 3D demonstrando o tempo de queima");

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .045);
  scene.environment = environment.texture;
  scene.environmentIntensity = .72;
  room.dispose();
  pmrem.dispose();
  RectAreaLightUniformsLib.init();

  scene.add(new THREE.HemisphereLight(0xfff4dd, 0x76543f, .92));
  const key = new THREE.DirectionalLight(0xffdeb0, 1.75);
  key.position.set(3.4, 5.2, 4.1);
  scene.add(key);
  const softbox = new THREE.RectAreaLight(0xffead4, quality === "mobile" ? 1.7 : 2.65, 2.2, 3.7);
  softbox.position.set(2.7, 3.2, 3.2);
  softbox.lookAt(0, 1.02, 0);
  scene.add(softbox);

  const candle = createCandleModel({ lit: true, quality, includeLid: false });
  candle.group.position.y = -.08;
  candle.group.scale.setScalar(quality === "mobile" ? .82 : .88);
  scene.add(candle.group);

  const shadowTexture = makeGroundShadow();
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 2.55), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -.1, .06);
  scene.add(shadow);

  let disposed = false;
  let visible = true;
  let wasExtinguished = false;
  const clock = new THREE.Clock();
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: .04 });
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

  renderer.setAnimationLoop(() => {
    if (disposed || !visible) return;
    candle.update(clock.getElapsedTime(), reducedMotionQuery.matches);
    renderer.render(scene, camera);
  });

  return {
    setProgress: (progress) => {
      const nextProgress = THREE.MathUtils.clamp(progress, 0, 1);
      const extinguished = nextProgress >= .995;
      candle.setBurnProgress(nextProgress);
      if (extinguished && !wasExtinguished) {
        candle.startSmoke(clock.getElapsedTime());
      }
      wasExtinguished = extinguished;
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      candle.dispose();
      shadow.geometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
