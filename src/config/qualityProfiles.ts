export type QualityLevel = "low" | "medium" | "high";

export interface QualityProfile {
  level: QualityLevel;
  pixelRatioCap: number;
  shadows: boolean;
  shadowMapSize: number;
  snowParticles: number;
  cloudCount: number;
  targetFps: number;
}

export const QUALITY_PROFILES: Record<QualityLevel, QualityProfile> = {
  low: {
    level: "low",
    pixelRatioCap: 1,
    shadows: false,
    shadowMapSize: 512,
    snowParticles: 48,
    cloudCount: 6,
    targetFps: 30
  },
  medium: {
    level: "medium",
    pixelRatioCap: 1.35,
    shadows: true,
    shadowMapSize: 1024,
    snowParticles: 96,
    cloudCount: 10,
    targetFps: 30
  },
  high: {
    level: "high",
    pixelRatioCap: 2,
    shadows: true,
    shadowMapSize: 2048,
    snowParticles: 160,
    cloudCount: 14,
    targetFps: 60
  }
};

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

export function detectInitialQuality(): QualityLevel {
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
  if (memory <= 3 || cores <= 4) return "low";
  if (mobile || memory <= 6 || cores <= 6) return "medium";
  return "high";
}
