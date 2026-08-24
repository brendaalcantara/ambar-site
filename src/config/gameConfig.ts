import type { Inventory, RecipeId, WeatherId } from "../simulation/types";

export const MAP_CONFIG = {
  seed: 77,
  tileSize: 2.25,
  radius: 23,
  exploreCellSize: 4
} as const;

export const CAMERA_CONFIG = {
  azimuthDegrees: 110,
  distance: 27,
  height: 22,
  mobileFrustum: 18,
  desktopFrustum: 28,
  minZoom: 0.85,
  maxZoom: 1.65
} as const;

export const PALETTE = {
  grass: 0x5d9a50,
  clearing: 0x9eb867,
  valley: 0x4f8c4f,
  cliff: 0x7a725b,
  snow: 0xe8f1ea,
  river: 0x3f8fc6,
  pineA: 0x22543a,
  pineB: 0x2f7040,
  trunk: 0x6e5136,
  player: 0xf2c15c,
  wolf: 0x66737c,
  bear: 0x6b4631,
  gang: 0x663c3d,
  trap: 0x1d1b18,
  camp: 0x8a6741,
  ember: 0xf09a3e,
  warning: 0xd94f38
} as const;

export const WEATHER_DATA: Record<WeatherId, { name: string; impact: string; fog: number; sky: number; cold: number }> = {
  sun: { name: "Sol instavel", impact: "luz atravessa as clareiras", fog: 96, sky: 0x9dcde0, cold: 0.2 },
  snow: { name: "Neve pesada", impact: "calor cai mais rapido", fog: 56, sky: 0xb6c9cf, cold: 1.15 },
  storm: { name: "Tempestade", impact: "visao curta e encontros tensos", fog: 42, sky: 0x59646a, cold: 0.75 }
};

export const RECIPES: Record<RecipeId, { cost: Partial<Inventory>; label: string }> = {
  spear: { cost: { wood: 2, stone: 2 }, label: "Lanca de pedra" },
  torch: { cost: { wood: 2, cloth: 1 }, label: "Tocha" },
  medkit: { cost: { cloth: 1, medicine: 1 }, label: "Kit medico" }
};
