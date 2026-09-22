import { callbackUrl, noStoreHeaders, OAuthEnv, randomState, stateCookie, trustedOrigin } from "../_shared/oauth";

const allowedScopes = new Set(["public_repo", "repo"]);

export const onRequestGet = async ({ request, env }: { request: Request; env: OAuthEnv }) => {
  try {
    const origin = trustedOrigin(env);
    if (new URL(request.url).origin !== origin) return new Response("Origem não autorizada", { status: 403, headers: noStoreHeaders() });
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return new Response("OAuth do GitHub não configurado", { status: 503, headers: noStoreHeaders() });
    const scope = env.GITHUB_OAUTH_SCOPE || "public_repo";
    if (!allowedScopes.has(scope)) return new Response("Escopo OAuth inválido", { status: 500, headers: noStoreHeaders() });
    const state = randomState();
    const authorize = new URL("https://github.com/login/oauth/authorize");
    authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    authorize.searchParams.set("redirect_uri", callbackUrl(origin));
    authorize.searchParams.set("scope", scope);
    authorize.searchParams.set("state", state);
    return new Response(null, {
      status: 302,
      headers: noStoreHeaders({ Location: authorize.toString(), "Set-Cookie": stateCookie(state, origin.startsWith("https://")) }),
    });
  } catch {
    return new Response("OAuth indisponível", { status: 500, headers: noStoreHeaders() });
  }
};
