import * as THREE from "three";
import type { GameState } from "../GameState";
import type { Camp, Enemy } from "../types";

export interface EnemySystemContext {
  state: GameState;
  enemies: Enemy[];
  camps: Camp[];
  playerPosition: THREE.Vector3;
  heightAt: (x: number, z: number) => number;
  onThreat: (message: string) => void;
  onPlayerHit: (damage: number) => void;
}

export function updateEnemies(context: EnemySystemContext, dt: number): void {
  const { state, enemies, camps, playerPosition, heightAt, onThreat, onPlayerHit } = context;
  const protectedByFire = camps.some((camp) => camp.lit && camp.group.position.distanceTo(playerPosition) < 4.8);
  const night = (state.dayTime % 60) / 60 > 0.7;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);
    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
    const toPlayer = playerPosition.clone().sub(enemy.group.position);
    const distance = toPlayer.length();
    const range = enemy.alertRange * (night ? 1.25 : 1);
    const bearTerritory = enemy.kind !== "bear" || playerPosition.distanceTo(enemy.origin) < 8;

    enemy.alerted = distance < range && !protectedByFire && bearTerritory;
    if (enemy.alerted) {
      toPlayer.y = 0;
      toPlayer.normalize();
      const packBoost = enemy.kind === "wolf" && enemies.some(
        (other) => other !== enemy && other.kind === "wolf" && other.alive && other.group.position.distanceTo(playerPosition) < range
      ) ? 1.22 : 1;
      enemy.group.position.addScaledVector(toPlayer, dt * enemy.speed * packBoost * (state.weather === "storm" ? 1.15 : 1));
      enemy.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    } else {
      const patrol = enemy.origin.clone().add(new THREE.Vector3(
        Math.sin(state.dayTime * 0.22 + enemy.origin.x) * 2.2,
        0,
        Math.cos(state.dayTime * 0.18 + enemy.origin.z) * 2.2
      ));
      const toPatrol = patrol.sub(enemy.group.position).setY(0);
      if (toPatrol.lengthSq() > 0.15) enemy.group.position.addScaledVector(toPatrol.normalize(), dt * enemy.speed * 0.3);
      enemy.group.rotation.y += dt * 0.25;
    }

    enemy.group.position.y = heightAt(enemy.group.position.x, enemy.group.position.z) + 0.1;
    if (distance >= 1.25 || state.invulnerableTime > 0 || enemy.attackCooldown > 0) continue;
    state.health -= enemy.damage;
    enemy.attackCooldown = enemy.kind === "bear" ? 1.25 : 0.9;
    onPlayerHit(enemy.damage);
    if (state.logCooldown > 0) continue;
    onThreat(enemy.kind === "bear" ? "Um urso guarda a encosta." : enemy.kind === "wolf" ? "Lobos testam sua distancia." : "Uma gangue bloqueia a trilha.");
    state.logCooldown = 2;
  }
}
