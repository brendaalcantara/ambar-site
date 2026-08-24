import type { GamePhase, Inventory, WeatherId } from "./types";

export class GameState {
  health = 100;
  warmth = 100;
  hunger = 100;
  stamina = 100;
  inventory: Inventory = { wood: 1, stone: 1, food: 1, cloth: 0, medicine: 1, radio: 0, medkit: 0 };
  hasSpear = false;
  hasTorch = false;
  dayTime = 0;
  weatherTime = 0;
  weather: WeatherId = "sun";
  logCooldown = 0;
  lightningTimer = 0;
  attackCooldown = 0;
  dodgeCooldown = 0;
  dodgeTime = 0;
  invulnerableTime = 0;
  phase: GamePhase = "playing";
  enemiesDefeated = 0;
  craftOpen = false;
}
