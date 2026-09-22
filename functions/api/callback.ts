import { createInstallationToken } from "../_shared/github-app";
import { authenticateGoogle } from "../_shared/google";
import { callbackPage, clearStateCookie, errorPage, noStoreHeaders, OAuthEnv, OAuthProvider, readCookie, safeEqual, trustedOrigin } from "../_shared/oauth";

type GitHubTokenResponse = { access_token?: string; error?: string; error_description?: string };

const providerFromState = (state: string): OAuthProvider => (state.startsWith("google:") ? "google" : "github");

export const onRequestGet = async ({ request, env }: { request: Request; env: OAuthEnv }) => {
  let origin = "";
  try {
    origin = trustedOrigin(env);
    if (new URL(request.url).origin !== origin) return new Response("Origem não autorizada", { status: 403, headers: noStoreHeaders() });
    const url = new URL(request.url);
    const code = url.searchParams.get("code") || "";
    const returnedState = url.searchParams.get("state") || "";
    const provider = providerFromState(returnedState);
    const storedState = readCookie(request, "ambar_oauth_state");
    const secureCookie = origin.startsWith("https://");
    if (!code || !returnedState || !storedState || !safeEqual(returnedState, storedState)) {
      return errorPage("A sessão de autorização expirou ou não confere.", origin, clearStateCookie(secureCookie), provider);
    }

    if (provider === "google") {
      const identity = await authenticateGoogle({ env, code, redirectUri: `${origin}/api/callback`, state: returnedState });
      const token = await createInstallationToken(env);
      return callbackPage({
        origin,
        token,
        messageProvider: "google",
        credentialProvider: "github",
        editor: { login: "ambar-google-editor", name: identity.name, email: identity.email },
        cookie: clearStateCookie(secureCookie),
      });
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return errorPage("OAuth do GitHub não está configurado.", origin, clearStateCookie(secureCookie), provider);
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "ambar-essence-catalog" },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, state: returnedState, redirect_uri: `${origin}/api/callback` }),
    });
    const payload = (await tokenResponse.json()) as GitHubTokenResponse;
    if (!tokenResponse.ok || !payload.access_token) {
      return errorPage(payload.error_description || payload.error || "O GitHub recusou a autorização.", origin, clearStateCookie(secureCookie), provider);
    }
    return callbackPage({ origin, token: payload.access_token, messageProvider: "github", cookie: clearStateCookie(secureCookie) });
  } catch {
    const returnedState = new URL(request.url).searchParams.get("state") || "";
    const provider = providerFromState(returnedState);
    return origin
      ? errorPage("Não foi possível concluir a autorização.", origin, clearStateCookie(origin.startsWith("https://")), provider)
      : new Response("OAuth indisponível", { status: 500, headers: noStoreHeaders() });
  }
};
