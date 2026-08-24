import * as THREE from "three";
import { detectInitialQuality, QUALITY_PROFILES, type QualityLevel, type QualityProfile } from "../config/qualityProfiles";

export class QualityManager {
  private level: QualityLevel;

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly sun: THREE.DirectionalLight) {
    this.level = detectInitialQuality();
    this.apply(this.level);
  }

  get profile(): QualityProfile {
    return QUALITY_PROFILES[this.level];
  }

  setLevel(level: QualityLevel): boolean {
    if (level === this.level) return false;
    this.apply(level);
    return true;
  }

  decrease(): boolean {
    if (this.level === "high") return this.setLevel("medium");
    if (this.level === "medium") return this.setLevel("low");
    return false;
  }

  increase(): boolean {
    if (this.level === "low") return this.setLevel("medium");
    if (this.level === "medium") return this.setLevel("high");
    return false;
  }

  reapplyResolution(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.profile.pixelRatioCap));
  }

  private apply(level: QualityLevel): void {
    this.level = level;
    const profile = QUALITY_PROFILES[level];
    this.renderer.shadowMap.enabled = profile.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap));
    this.sun.castShadow = profile.shadows;
    if (this.sun.shadow.mapSize.x !== profile.shadowMapSize) {
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
      this.sun.shadow.mapSize.set(profile.shadowMapSize, profile.shadowMapSize);
    }
  }
}
