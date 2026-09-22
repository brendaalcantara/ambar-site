import { GitHubBackend } from "decap-cms-backend-github";
import { CatalogAuthenticationPage } from "./auth-page";

const GitHubBackendBase = GitHubBackend as any;

export class CatalogGitHubBackend extends GitHubBackendBase {
  private googleEditor?: { login: string; name: string; email?: string };

  async authenticate(state: { token?: string; editor?: { login: string; name: string; email?: string } }) {
    this.googleEditor = state.editor;
    this.bypassWriteAccessCheckForAppTokens = Boolean(state.editor);
    const user = await super.authenticate(state);
    return state.editor ? { ...user, editor: state.editor } : user;
  }

  async currentUser({ token }: { token: string }) {
    if (this.googleEditor) return { ...this.googleEditor, avatar_url: "" };
    return super.currentUser({ token });
  }

  authComponent() {
    const backend = this;
    return (props: Record<string, unknown>) => <CatalogAuthenticationPage {...(props as any)} backend={backend} />;
  }

  logout() {
    this.googleEditor = undefined;
    this.bypassWriteAccessCheckForAppTokens = false;
    return super.logout();
  }
}
