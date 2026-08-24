export interface InputCallbacks {
  onToggleCraft: () => void;
  onFood: () => void;
  onMedkit: () => void;
  onInteract: () => void;
  onAttack: () => void;
  onDodge: () => void;
  onToggleDiagnostics: () => void;
  onPinch: (scale: number) => void;
}

export class InputController {
  readonly keys = new Set<string>();
  readonly touchMove = { x: 0, y: 0 };

  private joystickPointer: number | null = null;
  private lastPinchDistance = 0;
  private readonly joystick = document.querySelector<HTMLElement>("#joystick");
  private readonly joystickKnob = document.querySelector<HTMLElement>("#joystickKnob");

  constructor(private readonly canvas: HTMLCanvasElement, private readonly callbacks: InputCallbacks) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.bindJoystick();
    this.bindActions();
    this.bindPinch();
  }

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    this.keys.add(key);
    if (event.repeat) return;
    if (key === "c") this.callbacks.onToggleCraft();
    if (key === "1") this.callbacks.onFood();
    if (key === "2") this.callbacks.onMedkit();
    if (key === "p") this.callbacks.onToggleDiagnostics();
    if (key === "shift") this.callbacks.onDodge();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key.toLowerCase());
  };

  private bindJoystick(): void {
    this.joystick?.addEventListener("pointerdown", (event) => {
      this.joystickPointer = event.pointerId;
      this.joystick?.setPointerCapture(event.pointerId);
      this.updateJoystick(event);
    });
    this.joystick?.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.joystickPointer) this.updateJoystick(event);
    });
    this.joystick?.addEventListener("pointerup", this.releaseJoystick);
    this.joystick?.addEventListener("pointercancel", this.releaseJoystick);
  }

  private updateJoystick(event: PointerEvent): void {
    if (!this.joystick || !this.joystickKnob) return;
    const rect = this.joystick.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    const radius = rect.width * 0.32;
    const length = Math.hypot(x, y);
    const scale = length > radius ? radius / length : 1;
    const clampedX = x * scale;
    const clampedY = y * scale;
    this.joystickKnob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
    this.touchMove.x = clampedX / radius;
    this.touchMove.y = clampedY / radius;
  }

  private readonly releaseJoystick = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointer) return;
    this.joystickPointer = null;
    this.touchMove.x = 0;
    this.touchMove.y = 0;
    if (this.joystickKnob) this.joystickKnob.style.transform = "translate(-50%, -50%)";
  };

  private bindActions(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        const action = button.dataset.action;
        if (action === "food") this.callbacks.onFood();
        if (action === "medkit") this.callbacks.onMedkit();
        if (action === "interact") this.callbacks.onInteract();
        if (action === "attack") this.callbacks.onAttack();
        if (action === "dodge") this.callbacks.onDodge();
        if (action === "camp") this.keys.add("f");
      });
      button.addEventListener("pointerup", () => this.keys.delete("f"));
      button.addEventListener("pointercancel", () => this.keys.delete("f"));
    });
  }

  private bindPinch(): void {
    this.canvas.addEventListener("touchstart", (event) => {
      if (event.touches.length === 2) this.lastPinchDistance = this.pinchDistance(event);
    }, { passive: true });
    this.canvas.addEventListener("touchmove", (event) => {
      if (event.touches.length !== 2 || this.lastPinchDistance === 0) return;
      const distance = this.pinchDistance(event);
      this.callbacks.onPinch(distance / this.lastPinchDistance);
      this.lastPinchDistance = distance;
      event.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener("touchend", () => {
      this.lastPinchDistance = 0;
    }, { passive: true });
  }

  private pinchDistance(event: TouchEvent): number {
    return Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );
  }
}
