import type { GameState } from "../GameState";

export interface SurvivalEnvironment {
  sheltered: boolean;
  nearRiver: boolean;
  inMountains: boolean;
  weatherCold: number;
  dayPhase: number;
}

export function updateSurvival(state: GameState, environment: SurvivalEnvironment, dt: number): boolean {
  const riverChill = environment.nearRiver ? 0.35 : 0;
  const mountainChill = environment.inMountains ? 0.45 : 0;
  const nightChill = environment.dayPhase > 0.7 ? 0.65 : 0;
  const torchHeat = state.hasTorch ? 0.38 : 0;
  state.hunger -= dt * (environment.sheltered ? 0.5 : 0.72);
  state.warmth -= dt * Math.max(
    0.08,
    environment.weatherCold + riverChill + mountainChill + nightChill - torchHeat - (environment.sheltered ? 1.05 : 0)
  );
  if (environment.sheltered) state.warmth = Math.min(100, state.warmth + dt * 2.2);
  if (state.hunger < 25) state.health -= dt * 2.1;
  if (state.warmth < 22) state.health -= dt * 2.6;
  if (state.health > 0) return false;
  state.health = 0;
  return true;
}
