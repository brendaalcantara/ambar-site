export type CandleFallbackOptions = {
  lit?: boolean;
  message?: string;
  onActivate?: () => void;
};

export type CandleFallbackController = {
  setProgress: (progress: number) => void;
  ignite: () => void;
  dispose: () => void;
};

const fallbackImageUrl = `${import.meta.env.BASE_URL}fallback/ambar-candle-mobile.webp`;

export function mountCandleFallback(
  container: HTMLElement,
  options: CandleFallbackOptions = {},
): CandleFallbackController {
  container.querySelector(".webgl-candle-fallback")?.remove();

  const fallback = document.createElement(options.onActivate ? "button" : "div");
  fallback.className = `webgl-candle-fallback${options.lit ? " is-lit" : ""}${options.onActivate ? " is-interactive" : ""}`;
  fallback.setAttribute("aria-label", options.message ?? (options.onActivate ? "Risque o fósforo para acender a vela" : "Vela aromática Black Vanilla"));
  if (fallback instanceof HTMLButtonElement) fallback.type = "button";

  fallback.innerHTML = `
    <span class="webgl-candle-fallback__scene" aria-hidden="true">
      <img class="webgl-candle-fallback__image" src="${fallbackImageUrl}" alt="" decoding="async">
      <span class="webgl-candle-fallback__flame"></span>
      <span class="webgl-candle-fallback__match">
        <span class="webgl-candle-fallback__match-stick"></span>
        <span class="webgl-candle-fallback__match-head"></span>
      </span>
    </span>
  `;

  container.classList.add("has-webgl-fallback");
  container.append(fallback);

  let ignitionTimer: number | undefined;
  const ignite = () => {
    if (!options.onActivate || fallback.classList.contains("is-igniting") || fallback.classList.contains("is-lit")) return;
    fallback.classList.add("is-igniting");
    ignitionTimer = window.setTimeout(() => {
      fallback.classList.remove("is-igniting");
      fallback.classList.add("is-lit");
      options.onActivate?.();
    }, 620);
  };
  if (options.onActivate) fallback.addEventListener("click", ignite);

  const setProgress = (progress: number) => {
    const nextProgress = Math.max(0, Math.min(1, progress));
    fallback.style.setProperty("--burn-progress", String(nextProgress));
    fallback.classList.toggle("is-extinguished", nextProgress >= .995);
  };

  const dispose = () => {
    if (ignitionTimer !== undefined) window.clearTimeout(ignitionTimer);
    if (options.onActivate) fallback.removeEventListener("click", ignite);
    fallback.remove();
    if (!container.querySelector(".webgl-candle-fallback")) container.classList.remove("has-webgl-fallback");
  };

  return { setProgress, ignite, dispose };
}

export function showCandleFallback(
  container: HTMLElement,
  options: CandleFallbackOptions = {},
): () => void {
  return mountCandleFallback(container, options).dispose;
}

export function bindWebGLFallback(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  options: CandleFallbackOptions,
): () => void {
  let removeFallback: (() => void) | undefined;
  const onContextLost = (event: Event) => {
    event.preventDefault();
    removeFallback?.();
    removeFallback = showCandleFallback(container, options);
  };
  const onContextRestored = () => {
    removeFallback?.();
    removeFallback = undefined;
  };

  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  return () => {
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    removeFallback?.();
  };
}
