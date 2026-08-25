export type CandleFallbackOptions = {
  lit?: boolean;
  message?: string;
  onActivate?: () => void;
};

export function showCandleFallback(
  container: HTMLElement,
  options: CandleFallbackOptions = {},
): () => void {
  container.querySelector(".webgl-candle-fallback")?.remove();

  const fallback = document.createElement(options.onActivate ? "button" : "div");
  fallback.className = `webgl-candle-fallback${options.lit ? " is-lit" : ""}${options.onActivate ? " is-interactive" : ""}`;
  fallback.setAttribute("aria-label", options.message ?? "Vela aromática Black Vanilla");
  if (fallback instanceof HTMLButtonElement) fallback.type = "button";

  fallback.innerHTML = `
    <span class="webgl-candle-fallback__scene" aria-hidden="true">
      <span class="webgl-candle-fallback__jar">
        <span class="webgl-candle-fallback__wax"></span>
        <span class="webgl-candle-fallback__wick"></span>
        <span class="webgl-candle-fallback__flame"></span>
        <span class="webgl-candle-fallback__label">
          <small>ÂMBAR ESSENCE</small>
          <strong>BLACK VANILLA</strong>
          <small>CERA VEGETAL · 100g</small>
        </span>
      </span>
    </span>
    <span class="webgl-candle-fallback__message">${options.message ?? "Visualização compatível"}</span>
  `;

  if (options.onActivate) fallback.addEventListener("click", options.onActivate, { once: true });
  container.classList.add("has-webgl-fallback");
  container.append(fallback);

  return () => {
    fallback.remove();
    if (!container.querySelector(".webgl-candle-fallback")) {
      container.classList.remove("has-webgl-fallback");
    }
  };
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
