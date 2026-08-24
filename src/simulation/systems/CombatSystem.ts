import * as THREE from "three";
import type { GameState } from "../GameState";
import type { Enemy } from "../types";

export interface AttackResult {
  started: boolean;
  target?: Enemy;
  knockback?: THREE.Vector3;
  defeated: boolean;
  message?: string;
}

export function resolveAttack(state: GameState, enemies: Enemy[], playerPosition: THREE.Vector3): AttackResult {
  const staminaCost = state.hasSpear ? 24 : 14;
  if (state.attackCooldown > 0) return { started: false, defeated: false };
  if (state.stamina < staminaCost) {
    return { started: false, defeated: false, message: "Sem stamina para atacar." };
  }
  state.stamina -= staminaCost;
  state.attackCooldown = state.hasSpear ? 0.48 : 0.8;
  const target = enemies
    .filter((enemy) => enemy.alive && enemy.group.position.distanceTo(playerPosition) < (state.hasSpear ? 2.8 : 1.65))
    .sort((a, b) => a.group.position.distanceTo(playerPosition) - b.group.position.distanceTo(playerPosition))[0];
  if (!target) return { started: true, defeated: false };

  target.health -= state.hasSpear ? 38 : 12;
  target.hitCooldown = 0.35;
  const knockback = target.group.position.clone().sub(playerPosition).setY(0).normalize().multiplyScalar(state.hasSpear ? 1.15 : 0.45);
  if (target.health > 0) {
    return {
      target,
      knockback,
      started: true,
      defeated: false,
      message: state.hasSpear ? "A lanca encontra o alvo." : "Golpe fraco. Uma arma seria melhor."
    };
  }

  target.alive = false;
  state.enemiesDefeated += 1;
  if (target.kind === "gang") state.inventory.cloth += 1;
  if (target.kind === "bear") state.inventory.food += 2;
  if (target.kind === "wolf") state.inventory.food += 1;
  const name = target.kind === "gang" ? "Patrulheiro" : target.kind === "bear" ? "Urso" : "Lobo";
  return { started: true, target, knockback, defeated: true, message: `${name} derrotado. Recurso recuperado.` };
}

export function startDodge(state: GameState): string | undefined {
  if (state.dodgeCooldown > 0 || state.dodgeTime > 0) return undefined;
  if (state.stamina < 32) return "Sem stamina para esquivar.";
  state.stamina -= 32;
  state.dodgeTime = 0.28;
  state.invulnerableTime = 0.36;
  state.dodgeCooldown = 0.62;
  return undefined;
}

export function updateCombatState(state: GameState, dt: number): void {
  state.attackCooldown = Math.max(0, state.attackCooldown - dt);
  state.dodgeCooldown = Math.max(0, state.dodgeCooldown - dt);
  state.dodgeTime = Math.max(0, state.dodgeTime - dt);
  state.invulnerableTime = Math.max(0, state.invulnerableTime - dt);
  const regenerating = state.attackCooldown === 0 && state.dodgeTime === 0;
  state.stamina = Math.min(100, state.stamina + dt * (regenerating ? 22 : 7));
}
