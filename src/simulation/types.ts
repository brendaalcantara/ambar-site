import type * as THREE from "three";

export type WeatherId = "sun" | "snow" | "storm";
export type EnemyKind = "wolf" | "bear" | "gang";
export type ResourceKind = "wood" | "stone" | "food" | "cloth" | "medicine" | "radio";
export type GamePhase = "playing" | "won" | "lost";
export type RecipeId = "spear" | "torch" | "medkit";

export interface Enemy {
  kind: EnemyKind;
  group: THREE.Group;
  warning: THREE.Mesh;
  speed: number;
  damage: number;
  alertRange: number;
  health: number;
  origin: THREE.Vector3;
  alive: boolean;
  hitCooldown: number;
  attackCooldown: number;
  alerted: boolean;
}

export interface Trap {
  mesh: THREE.Mesh;
  ring: THREE.Mesh;
  triggered: boolean;
}

export interface Camp {
  group: THREE.Group;
  flame: THREE.Mesh;
  halo: THREE.Mesh;
  lit: boolean;
}

export interface ResourceNode {
  kind: ResourceKind;
  mesh: THREE.Group;
  collected: boolean;
}

export interface Inventory {
  wood: number;
  stone: number;
  food: number;
  cloth: number;
  medicine: number;
  radio: number;
  medkit: number;
}
