import type { OAuthEnv } from "./oauth";

type InstallationTokenResponse = { token?: string; message?: string };

const concatBytes = (...parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const derLength = (length: number) => {
  if (length < 128) return new Uint8Array([length]);
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
};

const pemToDer = (pem: string) => {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  if (!body) throw new Error("Chave privada do GitHub inválida");
  const binary = atob(body);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const toPkcs8 = (pem: string) => {
  const der = pemToDer(pem);
  if (pem.includes("BEGIN PRIVATE KEY")) return der;
  if (!pem.includes("BEGIN RSA PRIVATE KEY")) throw new Error("Formato de chave privada não suportado");
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const algorithm = new Uint8Array([
    0x30,
    0x0d,
    0x06,
    0x09,
    0x2a,
    0x86,
    0x48,
    0x86,
    0xf7,
    0x0d,
    0x01,
    0x01,
    0x01,
    0x05,
    0x00,
  ]);
  const privateKey = concatBytes(new Uint8Array([0x04]), derLength(der.length), der);
  const body = concatBytes(version, algorithm, privateKey);
  return concatBytes(new Uint8Array([0x30]), derLength(body.length), body);
};

const base64Url = (bytes: Uint8Array | string) => {
  const binary = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const createAppJwt = async (appId: string, privateKeyPem: string) => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iss: appId, iat: now - 60, exp: now + 540 }));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    toPkcs8(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
};

export const createInstallationToken = async (env: OAuthEnv) => {
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_INSTALLATION_ID || !env.GITHUB_APP_PRIVATE_KEY) {
    throw new Error("GitHub App não está configurado");
  }
  const appJwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const response = await fetch(`https://api.github.com/app/installations/${encodeURIComponent(env.GITHUB_APP_INSTALLATION_ID)}/access_tokens`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${appJwt}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ambar-essence-catalog",
    },
  });
  const payload = (await response.json()) as InstallationTokenResponse;
  if (!response.ok || !payload.token) throw new Error("GitHub App não autorizou o catálogo");
  return payload.token;
};
