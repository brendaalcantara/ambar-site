import { callbackUrl, noStoreHeaders, OAuthEnv, OAuthProvider, randomState, stateCookie, trustedOrigin } from "../_shared/oauth";

const allowedScopes = new Set(["public_repo", "repo"]);

const providerFromRequest = (request: Request): OAuthProvider | null => {
  const provider = new URL(request.url).searchParams.get("provider") || "github";
  return provider === "google" || provider === "github" ? provider : null;
};

export const onRequestGet = async ({ request, env }: { request: Request; env: OAuthEnv }) => {
  try {
    const origin = trustedOrigin(env);
    if (new URL(request.url).origin !== origin) {
      return new Response("Origem não autorizada", { status: 403, headers: noStoreHeaders() });
    }

    const provider = providerFromRequest(request);
    if (!provider) return new Response("Provedor OAuth inválido", { status: 400, headers: noStoreHeaders() });

    const state = `${provider}:${randomState()}`;
    const authorize = provider === "google"
      ? new URL("https://accounts.google.com/o/oauth2/v2/auth")
      : new URL("https://github.com/login/oauth/authorize");
    authorize.searchParams.set("client_id", provider === "google" ? env.GOOGLE_CLIENT_ID || "" : env.GITHUB_CLIENT_ID || "");
    authorize.searchParams.set("redirect_uri", callbackUrl(origin));
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("state", state);

    if (provider === "google") {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        return new Response("OAuth do Google não configurado", { status: 503, headers: noStoreHeaders() });
      }
      authorize.searchParams.set("scope", "openid email profile");
      authorize.searchParams.set("nonce", state);
      authorize.searchParams.set("prompt", "select_account");
    } else {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return new Response("OAuth do GitHub não configurado", { status: 503, headers: noStoreHeaders() });
      }
      const scope = env.GITHUB_OAUTH_SCOPE || "public_repo";
      if (!allowedScopes.has(scope)) return new Response("Escopo OAuth inválido", { status: 500, headers: noStoreHeaders() });
      authorize.searchParams.set("scope", scope);
    }

    return new Response(null, {
      status: 302,
      headers: noStoreHeaders({ Location: authorize.toString(), "Set-Cookie": stateCookie(state, origin.startsWith("https://")) }),
    });
  } catch {
    return new Response("OAuth indisponível", { status: 500, headers: noStoreHeaders() });
  }
};
