import type * as THREE from "three";
import type { QualityLevel } from "../config/qualityProfiles";
import type { QualityManager } from "../render/QualityManager";

export interface PerformanceSnapshot {
  fps: number;
  drawCalls: number;
  triangles: number;
  quality: QualityLevel;
}

export class PerformanceMonitor {
  private elapsed = 0;
  private frames = 0;
  private lowFpsTime = 0;
  private highFpsTime = 0;
  private adjustmentCooldown = 8;
  private snapshot: PerformanceSnapshot;

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly quality: QualityManager) {
    this.snapshot = { fps: 0, drawCalls: 0, triangles: 0, quality: quality.profile.level };
  }

  update(dt: number): { snapshot?: PerformanceSnapshot; qualityChanged: boolean } {
    this.elapsed += dt;
    this.frames += 1;
    this.adjustmentCooldown = Math.max(0, this.adjustmentCooldown - dt);
    if (this.elapsed < 1) return { qualityChanged: false };

    const fps = this.frames / this.elapsed;
    this.snapshot = {
      fps: Math.round(fps),
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      quality: this.quality.profile.level
    };
    this.elapsed = 0;
    this.frames = 0;

    const lowThreshold = this.quality.profile.targetFps === 60 ? 46 : 26;
    const highThreshold = this.quality.profile.level === "low" ? 43 : 56;
    this.lowFpsTime = fps < lowThreshold ? this.lowFpsTime + 1 : 0;
    this.highFpsTime = fps > highThreshold ? this.highFpsTime + 1 : 0;

    let qualityChanged = false;
    if (this.adjustmentCooldown === 0 && this.lowFpsTime >= 4) {
      qualityChanged = this.quality.decrease();
    } else if (this.adjustmentCooldown === 0 && this.highFpsTime >= 12) {
      qualityChanged = this.quality.increase();
    }
    if (qualityChanged) {
      this.adjustmentCooldown = 15;
      this.lowFpsTime = 0;
      this.highFpsTime = 0;
      this.snapshot.quality = this.quality.profile.level;
    }
    return { snapshot: this.snapshot, qualityChanged };
  }
}
