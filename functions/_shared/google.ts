import type { OAuthEnv } from "./oauth";

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
};

type GoogleJwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const decodeJsonPart = <T>(value: string): T => JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;

const tokenExchange = async (env: OAuthEnv, code: string, redirectUri: string) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) throw new Error("Google OAuth não configurado");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const payload = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !payload.id_token) throw new Error("Google recusou a autorização");
  return payload.id_token;
};

const verifySignature = async (signingInput: string, signature: ArrayBuffer, jwk: GoogleJwk) => {
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    signature,
    new TextEncoder().encode(signingInput),
  );
};

const verifyIdToken = async (idToken: string, clientId: string, expectedNonce: string) => {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("ID token inválido");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonPart<{ alg?: string; kid?: string }>(encodedHeader);
  const claims = decodeJsonPart<{
    iss?: string;
    aud?: string | string[];
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    nonce?: string;
    exp?: number;
    iat?: number;
  }>(encodedPayload);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Assinatura Google inválida");

  const keyResponse = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
    headers: { Accept: "application/json" },
  });
  if (!keyResponse.ok) throw new Error("Chaves Google indisponíveis");
  const keyPayload = (await keyResponse.json()) as { keys?: GoogleJwk[] };
  const jwk = keyPayload.keys?.find(key => key.kid === header.kid);
  if (!jwk) throw new Error("Chave Google desconhecida");
  const signatureBytes = decodeBase64Url(encodedSignature);
  const signature = signatureBytes.buffer.slice(
    signatureBytes.byteOffset,
    signatureBytes.byteOffset + signatureBytes.byteLength,
  ) as ArrayBuffer;
  const validSignature = await verifySignature(`${encodedHeader}.${encodedPayload}`, signature, jwk);
  if (!validSignature) throw new Error("Assinatura Google inválida");

  const now = Math.floor(Date.now() / 1000);
  const audienceMatches = Array.isArray(claims.aud) ? claims.aud.includes(clientId) : claims.aud === clientId;
  const issuerMatches = claims.iss === "accounts.google.com" || claims.iss === "https://accounts.google.com";
  const verifiedEmail = claims.email_verified === true || claims.email_verified === "true";
  if (
    !issuerMatches ||
    !audienceMatches ||
    !claims.sub ||
    !claims.email ||
    !verifiedEmail ||
    !claims.exp ||
    claims.exp <= now ||
    (claims.iat !== undefined && claims.iat > now + 60) ||
    claims.nonce !== expectedNonce
  ) {
    throw new Error("Identidade Google inválida");
  }

  return {
    sub: claims.sub,
    email: claims.email.toLowerCase(),
    name: claims.name?.trim() || claims.email,
  } satisfies GoogleIdentity;
};

const isAllowedEmail = (email: string, env: OAuthEnv) => {
  const allowed = (env.GOOGLE_ALLOWED_EMAILS || "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
};

export const authenticateGoogle = async ({ env, code, redirectUri, state }: { env: OAuthEnv; code: string; redirectUri: string; state: string }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_ALLOWED_EMAILS) {
    throw new Error("Google OAuth não está configurado");
  }
  const idToken = await tokenExchange(env, code, redirectUri);
  const identity = await verifyIdToken(idToken, env.GOOGLE_CLIENT_ID, state);
  if (!isAllowedEmail(identity.email, env)) throw new Error("Conta Google não autorizada");
  return identity;
};
