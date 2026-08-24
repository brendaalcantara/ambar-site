import * as THREE from "three";
import { CAMERA_CONFIG } from "../config/gameConfig";

export class CameraController {
  readonly camera = new THREE.OrthographicCamera(-26, 26, 16, -16, 0.1, 180);

  private readonly offset: THREE.Vector3;
  private readonly lead = new THREE.Vector3();
  private userZoom = 1;

  constructor() {
    const azimuth = THREE.MathUtils.degToRad(CAMERA_CONFIG.azimuthDegrees);
    this.offset = new THREE.Vector3(
      Math.cos(azimuth) * CAMERA_CONFIG.distance,
      CAMERA_CONFIG.height,
      Math.sin(azimuth) * CAMERA_CONFIG.distance
    );
    this.camera.position.copy(this.offset);
    this.camera.lookAt(0, 0, 0);
    this.applyFraming();
  }

  updateLead(direction: THREE.Vector3, dt: number): void {
    const target = direction.lengthSq() > 0 ? direction.clone().multiplyScalar(3.8) : new THREE.Vector3();
    this.lead.lerp(target, 1 - Math.pow(0.002, dt));
  }

  update(playerPosition: THREE.Vector3, dt: number): void {
    const target = playerPosition.clone().add(this.offset);
    this.camera.position.lerp(target, 1 - Math.pow(0.001, dt));
    const focus = playerPosition.clone().add(this.lead);
    this.camera.lookAt(focus.x, focus.y, focus.z);
  }

  applyPinch(scale: number): void {
    this.userZoom = THREE.MathUtils.clamp(
      this.userZoom * scale,
      CAMERA_CONFIG.minZoom,
      CAMERA_CONFIG.maxZoom
    );
    this.applyFraming();
  }

  applyFraming(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const mobile = window.innerWidth <= 720 || aspect < 0.72;
    const frustum = mobile ? CAMERA_CONFIG.mobileFrustum : CAMERA_CONFIG.desktopFrustum;
    this.camera.left = (-frustum * aspect) / 2;
    this.camera.right = (frustum * aspect) / 2;
    this.camera.top = frustum / 2;
    this.camera.bottom = -frustum / 2;
    this.camera.zoom = this.userZoom;
    this.camera.updateProjectionMatrix();
  }
}
