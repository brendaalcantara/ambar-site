import * as THREE from "three";
import { PALETTE } from "../config/gameConfig";

export function makeMaterial(color: number, roughness = 0.86): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02, flatShading: true });
}

export function createMaterials(): Record<keyof typeof PALETTE, THREE.MeshStandardMaterial> {
  return Object.fromEntries(
    Object.entries(PALETTE).map(([key, color]) => [key, makeMaterial(color)])
  ) as Record<keyof typeof PALETTE, THREE.MeshStandardMaterial>;
}
