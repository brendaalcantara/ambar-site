import type { RecipeId } from "../simulation/types";

export interface HudSnapshot {
  health: number;
  warmth: number;
  hunger: number;
  stamina: number;
  weatherName: string;
  weatherImpact: string;
  region: string;
  day: number;
  period: string;
  inventory: Array<[string, number]>;
  objective: string;
}

export interface EndScreenContent {
  eyebrow: string;
  title: string;
  message: string;
}

export interface PerformanceView {
  fps: number;
  drawCalls: number;
  triangles: number;
  quality: string;
}

export class HudView {
  constructor(callbacks: { onToggleCraft: (open: boolean) => void; onCraft: (recipe: RecipeId) => void }) {
    document.querySelector("#closeCraft")?.addEventListener("click", () => callbacks.onToggleCraft(false));
    document.querySelector("#openCraft")?.addEventListener("click", () => callbacks.onToggleCraft(true));
    document.querySelectorAll<HTMLButtonElement>("[data-craft]").forEach((button) => {
      button.addEventListener("click", () => callbacks.onCraft(button.dataset.craft as RecipeId));
    });
    document.querySelector("#restartButton")?.addEventListener("click", () => window.location.reload());
  }

  setLog(message: string): void {
    const element = document.querySelector<HTMLElement>("#eventLog");
    if (element) element.textContent = message;
  }

  setCraftOpen(open: boolean): void {
    const panel = document.querySelector<HTMLElement>("#craftPanel");
    panel?.classList.toggle("open", open);
    panel?.setAttribute("aria-hidden", String(!open));
  }

  update(snapshot: HudSnapshot): void {
    this.setBar("#healthBar", snapshot.health);
    this.setBar("#warmthBar", snapshot.warmth);
    this.setBar("#hungerBar", snapshot.hunger);
    this.setBar("#staminaBar", snapshot.stamina);
    this.setText("#healthText", Math.round(snapshot.health));
    this.setText("#warmthText", Math.round(snapshot.warmth));
    this.setText("#hungerText", Math.round(snapshot.hunger));
    this.setText("#staminaText", Math.round(snapshot.stamina));
    this.setText("#weatherName", snapshot.weatherName);
    this.setText("#weatherImpact", snapshot.weatherImpact);
    this.setText("#regionName", snapshot.region);
    this.setText("#dayText", `Dia ${snapshot.day}`);
    this.setText("#periodText", snapshot.period);
    this.setText("#objective", snapshot.objective);
    const inventory = document.querySelector<HTMLElement>("#inventory");
    if (inventory) {
      inventory.innerHTML = snapshot.inventory
        .map(([label, value]) => `<span class="item">${label}<strong>${value}</strong></span>`)
        .join("");
    }
  }

  showEnd(content: EndScreenContent): void {
    const screen = document.querySelector<HTMLElement>("#endScreen");
    screen?.classList.add("open");
    screen?.setAttribute("aria-hidden", "false");
    this.setText("#endEyebrow", content.eyebrow);
    this.setText("#endTitle", content.title);
    this.setText("#endMessage", content.message);
  }

  setPerformanceVisible(visible: boolean): void {
    const element = document.querySelector<HTMLOutputElement>("#perfStats");
    if (element) element.hidden = !visible;
  }

  updatePerformance(stats: PerformanceView): void {
    const element = document.querySelector<HTMLOutputElement>("#perfStats");
    if (!element) return;
    element.textContent = `FPS ${stats.fps}\nDRAW ${stats.drawCalls}\nTRI ${stats.triangles}\nQUAL ${stats.quality.toUpperCase()}`;
  }

  flashDamage(): void {
    const element = document.querySelector<HTMLElement>("#damageFlash");
    if (!element) return;
    element.classList.remove("active");
    void element.offsetWidth;
    element.classList.add("active");
  }

  private setBar(selector: string, value: number): void {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  private setText(selector: string, value: string | number): void {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.textContent = String(value);
  }
}
