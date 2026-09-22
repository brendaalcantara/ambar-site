export type OAuthEnv = {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  PUBLIC_SITE_ORIGIN: string;
  GITHUB_OAUTH_SCOPE?: string;
};

export const STATE_COOKIE = "ambar_oauth_state";
export const OAUTH_STATE_TTL_SECONDS = 600;

export const noStoreHeaders = (extra: HeadersInit = {}) => ({
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  ...extra,
});

export const trustedOrigin = (env: OAuthEnv) => {
  if (!env.PUBLIC_SITE_ORIGIN) throw new Error("PUBLIC_SITE_ORIGIN não configurada");
  const parsed = new URL(env.PUBLIC_SITE_ORIGIN);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("PUBLIC_SITE_ORIGIN deve usar http ou https");
  return parsed.origin;
};

export const callbackUrl = (origin: string) => `${origin}/api/callback`;

export const randomState = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const cookieAttributes = (secure: boolean) => `Max-Age=${OAUTH_STATE_TTL_SECONDS}; Path=/api; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax`;
export const stateCookie = (value: string, secure = true) => `${STATE_COOKIE}=${value}; ${cookieAttributes(secure)}`;
export const clearStateCookie = (secure = true) => `${STATE_COOKIE}=; Max-Age=0; Path=/api; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax`;

export const readCookie = (request: Request, name: string) => {
  const cookieHeader = request.headers.get("Cookie") || request.headers.get("cookie") || "";
  for (const chunk of cookieHeader.split(";")) {
    const [key, ...parts] = chunk.trim().split("=");
    if (key === name) return parts.join("=");
  }
  return "";
};

export const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

export const errorPage = (message: string, origin: string, cookie?: string) => callbackPage({ origin, error: message, cookie });

const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

export const callbackPage = ({ origin, token, error, cookie }: { origin: string; token?: string; error?: string; cookie?: string }) => {
  const nonceBytes = new Uint8Array(18);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes)).replace(/=+$/g, "");
  const success = token ? `authorization:github:success:${scriptJson({ token, provider: "github" })}` : "";
  const failure = error ? `authorization:github:error:${scriptJson({ message: error })}` : "";
  const message = success || failure;
  const headers = new Headers(noStoreHeaders({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
  }));
  if (cookie) headers.set("Set-Cookie", cookie);
  const body = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Autorização do catálogo</title><style>body{font:16px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8f5ef;color:#32251e}main{text-align:center;padding:24px}p{color:#67574d}</style></head><body><main><strong>${token ? "Autorização concluída" : "Não foi possível autorizar"}</strong><p>${token ? "Esta janela será fechada." : "Feche esta janela e tente novamente."}</p></main><script nonce="${nonce}">
(() => {
  const trustedOrigin = ${scriptJson(origin)};
  const message = ${scriptJson(message)};
  const opener = window.opener;
  if (!opener) return;
  const send = () => opener.postMessage(message, trustedOrigin);
  const receive = event => {
    if (event.origin !== trustedOrigin || event.source !== opener || event.data !== 'authorizing:github') return;
    window.removeEventListener('message', receive);
    send();
    window.setTimeout(() => window.close(), 250);
  };
  window.addEventListener('message', receive);
  opener.postMessage('authorizing:github', trustedOrigin);
})();
</script></body></html>`;
  return new Response(body, { status: 200, headers });
};
