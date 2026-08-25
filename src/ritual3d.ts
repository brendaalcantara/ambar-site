import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createCandleModel, createFlameVfx, type CandleQuality } from "./candleModel";
import { bindWebGLFallback } from "./candleFallback";

type MatchModel = {
  group: THREE.Group;
  headAnchor: THREE.Object3D;
  hitMeshes: THREE.Object3D[];
  dispose: () => void;
};

function makeMatchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, "#e1bd7f");
  gradient.addColorStop(.5, "#c99455");
  gradient.addColorStop(1, "#a96f3e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(96,53,24,.26)";
  for (let y = 5; y < 256; y += 11) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(60, y - 4, 150, y + 5, 256, y - 2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createMatch(quality: CandleQuality): MatchModel {
  const group = new THREE.Group();
  const resources: Array<THREE.Material | THREE.BufferGeometry | THREE.Texture> = [];
  const woodTexture = makeMatchTexture();
  woodTexture.repeat.set(3.5, 1);
  const stickMaterial = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: .86, color: 0xe1b579 });
  const stickGeometry = new RoundedBoxGeometry(1.28, .058, .058, quality === "mobile" ? 2 : 3, .012);
  const stick = new THREE.Mesh(stickGeometry, stickMaterial);
  stick.castShadow = true;
  group.add(stick);
  resources.push(woodTexture, stickMaterial, stickGeometry);

  const scorchedWoodMaterial = new THREE.MeshStandardMaterial({ color: 0x5a2e1f, roughness: .98 });
  const scorchedWoodGeometry = new RoundedBoxGeometry(.18, .061, .061, 2, .013);
  const scorchedWood = new THREE.Mesh(scorchedWoodGeometry, scorchedWoodMaterial);
  scorchedWood.position.x = .57;
  group.add(scorchedWood);
  resources.push(scorchedWoodMaterial, scorchedWoodGeometry);

  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x783326, roughness: .97 });
  const headGeometry = new THREE.IcosahedronGeometry(.1, quality === "mobile" ? 2 : 3);
  const headPositions = headGeometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < headPositions.count; i += 1) {
    const x = headPositions.getX(i);
    const y = headPositions.getY(i);
    const z = headPositions.getZ(i);
    const variation = 1 + Math.sin(x * 91 + y * 137 + z * 173) * .026 + Math.sin(x * 223 - z * 149) * .014;
    headPositions.setXYZ(i, x * variation, y * variation, z * variation);
  }
  headPositions.needsUpdate = true;
  headGeometry.computeVertexNormals();
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.x = .69;
  head.scale.set(1.23, .86, .92);
  head.castShadow = true;
  group.add(head);
  resources.push(headMaterial, headGeometry);

  const charMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2019, roughness: 1 });
  const charGeometry = new THREE.SphereGeometry(.032, 12, 8);
  const char = new THREE.Mesh(charGeometry, charMaterial);
  char.position.set(.705, .074, .047);
  char.scale.set(.9, .34, .48);
  group.add(char);
  resources.push(charMaterial, charGeometry);

  const grainMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, vertexColors: true });
  const grains = new THREE.InstancedMesh(new THREE.SphereGeometry(.007, 6, 5), grainMaterial, quality === "mobile" ? 26 : 46);
  const dummy = new THREE.Object3D();
  const grainColor = new THREE.Color();
  const count = grains.count;
  for (let i = 0; i < count; i += 1) {
    const a = i * 2.399;
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    dummy.position.set(.69 + Math.cos(a) * radial * .122, y * .086, Math.sin(a) * radial * .092);
    dummy.scale.setScalar(.68 + (i % 5) * .075);
    dummy.updateMatrix();
    grains.setMatrixAt(i, dummy.matrix);
    grainColor.setHSL(.018 + (i % 4) * .006, .52, .38 + (i % 5) * .018);
    grains.setColorAt(i, grainColor);
  }
  grains.instanceMatrix.needsUpdate = true;
  if (grains.instanceColor) grains.instanceColor.needsUpdate = true;
  group.add(grains);
  resources.push(grains.geometry, grainMaterial);

  const headAnchor = new THREE.Object3D();
  headAnchor.position.set(.755, .008, 0);
  group.add(headAnchor);
  const hitProxy = new THREE.Mesh(new THREE.CapsuleGeometry(.18, 1.12, 5, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hitProxy.rotation.z = Math.PI / 2;
  group.add(hitProxy);
  resources.push(hitProxy.geometry, hitProxy.material as THREE.Material);

  return {
    group,
    headAnchor,
    hitMeshes: [stick, head, char, hitProxy],
    dispose: () => {
      const seen = new Set<unknown>();
      resources.forEach((resource) => {
        if (seen.has(resource)) return;
        seen.add(resource);
        resource.dispose();
      });
    },
  };
}

function createEmbers(quality: CandleQuality): {
  points: THREE.Points;
  start: (time: number, origin: THREE.Vector3) => void;
  update: (time: number) => void;
  dispose: () => void;
} {
  const count = quality === "mobile" ? 8 : 18;
  const positions = new Float32Array(count * 3);
  const velocities = Array.from({ length: count }, (_, i) => new THREE.Vector3((i % 3 - 1) * .12, .28 + (i % 5) * .045, ((i * 7) % 5 - 2) * .045));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffa33a, size: quality === "mobile" ? .055 : .068, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  let startTime = -99;
  let origin = new THREE.Vector3();
  return {
    points,
    start: (time, nextOrigin) => { startTime = time; origin = nextOrigin.clone(); material.opacity = 1; },
    update: (time) => {
      const age = time - startTime;
      const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < count; i += 1) {
        const delay = i * .025;
        const t = Math.max(0, age - delay);
        attribute.setXYZ(i, origin.x + velocities[i].x * t, origin.y + velocities[i].y * t - .17 * t * t, origin.z + velocities[i].z * t);
      }
      attribute.needsUpdate = true;
      material.opacity = age >= 0 && age < 1.1 ? Math.max(0, 1 - age / 1.1) : 0;
    },
    dispose: () => { geometry.dispose(); material.dispose(); },
  };
}

export function mountRitual3D(container: HTMLElement, onComplete: () => void): { ignite: () => void; getCandleScreenPosition: () => { x: number; y: number }; dispose: () => void } {
  const quality: CandleQuality = window.matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop";
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
  camera.position.set(0, 2.28, quality === "mobile" ? 6.4 : 6.8);
  camera.lookAt(0, 1.18, 0);
  const renderer = new THREE.WebGLRenderer({
    antialias: quality === "desktop",
    alpha: true,
    depth: true,
    stencil: false,
    precision: quality === "mobile" ? "mediump" : "highp",
    powerPreference: quality === "mobile" ? "default" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "mobile" ? 1 : 1.45));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = quality === "desktop";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Arraste a cabeça do fósforo 3D até o pavio da vela");
  const disposeContextFallback = bindWebGLFallback(renderer.domElement, container, {
    message: "Use entrar sem acender para continuar",
  });

  let environment: THREE.WebGLRenderTarget | undefined;
  if (quality === "desktop") {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, .035);
    scene.environment = environment.texture;
    scene.environmentIntensity = .28;
    room.dispose();
    pmrem.dispose();
  }

  scene.add(new THREE.HemisphereLight(0x5e4939, 0x100d0b, .48));
  const rim = new THREE.DirectionalLight(0xc08b54, 1.18);
  rim.position.set(-3.5, 4.5, 4);
  rim.castShadow = quality === "desktop";
  rim.shadow.mapSize.set(768, 768);
  rim.shadow.radius = 5;
  rim.shadow.bias = -.00035;
  rim.shadow.normalBias = .025;
  scene.add(rim);
  const softbox = new THREE.DirectionalLight(0xffc88c, quality === "mobile" ? .6 : .9);
  softbox.position.set(2.8, 3.0, 3.4);
  scene.add(softbox);

  const candle = createCandleModel({ lit: false, quality, includeLid: false });
  candle.group.position.y = -.22;
  scene.add(candle.group);
  const matchRestDepth = quality === "mobile" ? 1.08 : .34;
  const match = createMatch(quality);
  if (quality === "mobile") {
    match.group.scale.setScalar(.7);
    match.group.position.set(-1.05, 1.44, matchRestDepth);
    match.group.rotation.z = 1.02;
  } else {
    match.group.position.set(-1.76, 1.3, matchRestDepth);
    match.group.rotation.z = 1.0;
  }
  scene.add(match.group);

  const matchFlame = createFlameVfx(quality);
  matchFlame.group.visible = false;
  matchFlame.group.scale.set(.57, .6, .57);
  matchFlame.group.position.set(.69, -.035, 0);
  match.group.add(matchFlame.group);
  const embers = createEmbers(quality);
  scene.add(embers.points);

  let ignited = false;
  let dragging = false;
  let snapping = false;
  let returning = false;
  let disposed = false;
  let completed = false;
  let igniteTime = -99;
  let snapStartTime = -99;
  let lastFrame = 0;
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -matchRestDepth);
  const planeHit = new THREE.Vector3();
  const headPointerOffset = new THREE.Vector3();
  const desiredHead = new THREE.Vector3();
  const moveDelta = new THREE.Vector3();
  const headWorld = new THREE.Vector3();
  const targetWorld = new THREE.Vector3();
  const matchHome = match.group.position.clone();
  const matchHomeRotation = match.group.rotation.z;
  const matchBaseScale = match.group.scale.x;
  const matchHeadRadius = .1 * matchBaseScale;
  const contactPoint = new THREE.Vector3();
  const contactDelta = new THREE.Vector3();
  const candleScreenPoint = new THREE.Vector3();
  const previousHeadWorld = new THREE.Vector3();
  const snapStartPosition = new THREE.Vector3();
  const snapEndPosition = new THREE.Vector3();
  const igniteStartPosition = new THREE.Vector3();
  const igniteExitPosition = new THREE.Vector3();
  let snapStartRotation = matchHomeRotation;
  let contactSide: -1 | 1 = -1;
  let snapContactAngle = -.26;
  let igniteStartRotation = matchHomeRotation;

  const setPointer = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };
  const announce = (message: string) => {
    const status = document.querySelector<HTMLElement>("#ritualStatus");
    if (status) status.textContent = message;
  };
  const updateContactPoint = () => {
    candle.group.localToWorld(targetWorld.copy(candle.matchTarget));
    contactPoint.copy(targetWorld);
    contactPoint.x += contactSide * matchHeadRadius * .9;
    contactPoint.y += .006;
    contactPoint.z += .045;
  };
  const contactAngleForSide = () => contactSide < 0 ? -.26 : Math.PI + .26;
  const lerpAngle = (start: number, end: number, amount: number) => {
    const delta = THREE.MathUtils.euclideanModulo(end - start + Math.PI, Math.PI * 2) - Math.PI;
    return start + delta * amount;
  };
  const segmentDistance2D = (start: THREE.Vector3, end: THREE.Vector3, point: THREE.Vector3) => {
    const vx = end.x - start.x;
    const vy = end.y - start.y;
    const lengthSquared = vx * vx + vy * vy;
    if (lengthSquared < 1e-6) return Math.hypot(point.x - end.x, point.y - end.y);
    const projection = THREE.MathUtils.clamp(((point.x - start.x) * vx + (point.y - start.y) * vy) / lengthSquared, 0, 1);
    return Math.hypot(point.x - (start.x + vx * projection), point.y - (start.y + vy * projection));
  };
  const beginSnapToWick = () => {
    if (snapping || ignited || disposed) return;
    snapping = true;
    dragging = false;
    returning = false;
    snapStartTime = clock.getElapsedTime();
    snapStartPosition.copy(match.group.position);
    snapStartRotation = match.group.rotation.z;
    snapContactAngle = contactAngleForSide();
    updateContactPoint();

    match.group.rotation.z = snapContactAngle;
    match.group.updateMatrixWorld(true);
    match.headAnchor.getWorldPosition(headWorld);
    snapEndPosition.copy(match.group.position).add(contactDelta.copy(contactPoint).sub(headWorld));
    match.group.position.copy(snapStartPosition);
    match.group.rotation.z = snapStartRotation;
    match.group.updateMatrixWorld(true);
    container.classList.remove("is-dragging");
    announce("Contato detectado. Encaixando o fósforo no pavio.");
  };
  const ignite = () => {
    if (ignited || disposed) return;
    snapping = false;
    updateContactPoint();
    match.group.rotation.z = snapContactAngle;
    match.group.updateMatrixWorld(true);
    match.headAnchor.getWorldPosition(headWorld);
    contactDelta.copy(contactPoint).sub(headWorld);
    match.group.position.add(contactDelta);
    match.group.updateMatrixWorld(true);
    igniteStartPosition.copy(match.group.position);
    igniteExitPosition.copy(match.group.position).add(new THREE.Vector3(contactSide < 0 ? -.72 : .72, .42, .12));
    igniteStartRotation = match.group.rotation.z;
    ignited = true;
    igniteTime = clock.getElapsedTime();
    matchFlame.group.visible = true;
    match.headAnchor.getWorldPosition(headWorld);
    embers.start(igniteTime, headWorld);
    announce("O fósforo encostou no pavio.");
    window.setTimeout(() => {
      if (disposed) return;
      candle.setFlameVisible(true);
      announce("A vela acendeu e permanecerá acesa durante a revelação.");
    }, reducedMotionQuery.matches ? 40 : 130);
    window.setTimeout(() => {
      if (disposed) return;
      matchFlame.group.visible = false;
    }, reducedMotionQuery.matches ? 120 : 300);
    window.setTimeout(() => {
      if (disposed) return;
      match.group.visible = false;
    }, reducedMotionQuery.matches ? 220 : 620);
    window.setTimeout(() => {
      if (disposed || completed) return;
      completed = true;
      onComplete();
    }, reducedMotionQuery.matches ? 330 : 980);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (ignited || snapping) return;
    event.preventDefault();
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(dragPlane, planeHit);
    match.headAnchor.getWorldPosition(headWorld);
    const hitGeometry = raycaster.intersectObjects(match.hitMeshes, false).length > 0;
    const hitTouchArea = planeHit.distanceTo(headWorld) < (quality === "mobile" ? .52 : .4);
    if (!hitGeometry && !hitTouchArea) return;
    dragging = true;
    returning = false;
    matchFlame.group.visible = true;
    headPointerOffset.copy(headWorld).sub(planeHit);
    previousHeadWorld.copy(headWorld);
    renderer.domElement.setPointerCapture(event.pointerId);
    container.classList.add("is-dragging");
    announce("Fósforo aceso. Aproxime a chama do pavio.");
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || ignited || snapping) return;
    event.preventDefault();
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(dragPlane, planeHit)) return;
    updateContactPoint();
    desiredHead.copy(planeHit).add(headPointerOffset);
    if (Math.abs(desiredHead.x - targetWorld.x) > .24) {
      contactSide = desiredHead.x < targetWorld.x ? -1 : 1;
      updateContactPoint();
    }
    const desiredDistance = Math.hypot(desiredHead.x - targetWorld.x, desiredHead.y - targetWorld.y);
    const approach = 1 - THREE.MathUtils.clamp((desiredDistance - .12) / 1.08, 0, 1);
    const naturalAngle = Math.atan2(targetWorld.y - match.group.position.y, targetWorld.x - match.group.position.x);
    const desiredAngle = lerpAngle(naturalAngle, contactAngleForSide(), approach * .94);
    match.group.rotation.z = lerpAngle(match.group.rotation.z, desiredAngle, .38);
    match.group.updateMatrixWorld(true);
    match.headAnchor.getWorldPosition(headWorld);
    moveDelta.copy(desiredHead).sub(headWorld);
    match.group.position.add(moveDelta);
    match.group.position.z = THREE.MathUtils.lerp(matchRestDepth, .05, approach);
    match.group.updateMatrixWorld(true);
    match.headAnchor.getWorldPosition(headWorld);

    const rimTop = candle.group.position.y + 2.19;
    const safeAboveRim = rimTop + matchHeadRadius * .72;
    const horizontalFromCenter = Math.abs(headWorld.x - candle.group.position.x);
    const insideJarProfile = horizontalFromCenter < 1.18;
    const outsideWickChannel = Math.abs(headWorld.x - targetWorld.x) > .18;
    if (insideJarProfile && outsideWickChannel && headWorld.y < safeAboveRim) {
      match.group.position.y += safeAboveRim - headWorld.y;
      match.group.updateMatrixWorld(true);
      match.headAnchor.getWorldPosition(headWorld);
    }

    const contactDistance = Math.hypot(headWorld.x - contactPoint.x, headWorld.y - contactPoint.y);
    const sweptContactDistance = segmentDistance2D(previousHeadWorld, headWorld, contactPoint);
    const depthDistance = Math.abs(headWorld.z - contactPoint.z);
    previousHeadWorld.copy(headWorld);
    const contactTolerance = quality === "mobile" ? .18 : .145;
    if ((contactDistance < contactTolerance || sweptContactDistance < contactTolerance) && depthDistance < .16) beginSnapToWick();
  };
  const onPointerUp = (event: PointerEvent) => {
    dragging = false;
    container.classList.remove("is-dragging");
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    if (!ignited && !snapping) {
      returning = true;
      matchFlame.group.visible = false;
      announce("O fósforo não alcançou o pavio e voltou à posição inicial.");
    }
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);

  let pageVisible = !document.hidden;
  const onVisibility = () => { pageVisible = !document.hidden; };
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
    if (disposed || !pageVisible) return;
    if (quality === "mobile" && time - lastFrame < 1000 / 40) return;
    lastFrame = time;
    const elapsed = clock.getElapsedTime();
    candle.update(elapsed, reducedMotionQuery.matches);
    if (matchFlame.group.visible) matchFlame.update(elapsed, reducedMotionQuery.matches);
    matchFlame.group.rotation.z = -match.group.rotation.z;
    embers.update(elapsed);
    if (snapping) {
      const snapProgress = THREE.MathUtils.smoothstep(elapsed - snapStartTime, 0, reducedMotionQuery.matches ? .06 : .22);
      match.group.position.lerpVectors(snapStartPosition, snapEndPosition, snapProgress);
      match.group.rotation.z = lerpAngle(snapStartRotation, snapContactAngle, snapProgress);
      if (snapProgress >= .999) ignite();
    } else if (returning && !ignited) {
      match.group.position.lerp(matchHome, reducedMotionQuery.matches ? .65 : .16);
      match.group.rotation.z = THREE.MathUtils.lerp(match.group.rotation.z, matchHomeRotation, reducedMotionQuery.matches ? .65 : .16);
      match.group.scale.setScalar(THREE.MathUtils.lerp(match.group.scale.x, matchBaseScale, .2));
      if (match.group.position.distanceTo(matchHome) < .012 && Math.abs(match.group.rotation.z - matchHomeRotation) < .01) {
        match.group.position.copy(matchHome);
        match.group.rotation.z = matchHomeRotation;
        returning = false;
      }
    } else if (!dragging && !ignited) {
      match.group.position.x = matchHome.x + Math.sin(elapsed * .75) * .025;
      match.group.rotation.z = matchHomeRotation + Math.sin(elapsed * .6) * .015;
    } else if (ignited && !reducedMotionQuery.matches) {
      const retreat = THREE.MathUtils.smoothstep(elapsed - igniteTime, .34, 1.08);
      match.group.position.lerpVectors(igniteStartPosition, igniteExitPosition, retreat);
      match.group.rotation.z = THREE.MathUtils.lerp(igniteStartRotation, igniteStartRotation + .18, retreat);
      match.group.scale.setScalar(THREE.MathUtils.lerp(matchBaseScale, matchBaseScale * .9, retreat));
    }
    renderer.render(scene, camera);
  });

  return {
    ignite,
    getCandleScreenPosition: () => {
      candle.group.localToWorld(candleScreenPoint.set(0, 1.05, 0));
      candleScreenPoint.project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: rect.left + (candleScreenPoint.x + 1) * .5 * rect.width,
        y: rect.top + (1 - candleScreenPoint.y) * .5 * rect.height,
      };
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      disposeContextFallback();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      candle.dispose();
      match.dispose();
      matchFlame.dispose();
      embers.dispose();
      environment?.dispose();
      renderer.dispose();
    },
  };
}
