import { Component, Fragment, type MouseEvent, type ReactNode } from "react";
import { NetlifyAuthenticator } from "decap-cms-lib-auth";
import { AuthenticationPage } from "decap-cms-ui-default";

type Provider = "google" | "github";

type AuthPageProps = {
  onLogin: (data: unknown) => void;
  inProgress?: boolean;
  base_url?: string;
  siteId?: string;
  authEndpoint?: string;
  config: { backend: { auth_scope?: string }; logo_url?: string; logo?: { src?: string }; site_url?: string };
  t: (key: string) => string;
};

type AuthPageState = { loginError?: string; provider?: Provider };

const providerLabel: Record<Provider, ReactNode> = {
  google: "Entrar com o Google",
  github: "Usar GitHub como alternativa",
};

export class CatalogAuthenticationPage extends Component<AuthPageProps, AuthPageState> {
  state: AuthPageState = {};

  handleLogin = (provider: Provider) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const cfg = {
      base_url: this.props.base_url,
      site_id: document.location.host.split(":")[0] === "localhost" ? "demo.decapcms.org" : this.props.siteId,
      auth_endpoint: this.props.authEndpoint,
    };
    const auth = new NetlifyAuthenticator(cfg);
    const scope = provider === "google" ? "openid email profile" : this.props.config.backend.auth_scope || "public_repo";
    this.setState({ loginError: undefined, provider });
    auth.authenticate({ provider, scope }, (error, data) => {
      if (error) {
        this.setState({ loginError: error instanceof Error ? error.message : "Não foi possível concluir o login.", provider: undefined });
        return;
      }
      this.setState({ provider: undefined });
      this.props.onLogin(data);
    });
  };

  renderButton = (provider: Provider, LoginButton: any) => (
    <LoginButton key={provider} onClick={this.handleLogin(provider)}>
      {providerLabel[provider]}
    </LoginButton>
  );

  render() {
    const { config, inProgress, t } = this.props;
    const activeProvider = this.state.provider;
    return (
      <AuthenticationPage
        loginDisabled={Boolean(inProgress || activeProvider)}
        loginErrorMessage={this.state.loginError}
        logoUrl={config.logo_url}
        logo={config.logo}
        siteUrl={config.site_url}
        t={t}
        renderPageContent={({ LoginButton }: { LoginButton: any }) => (
          <Fragment>
            {this.renderButton("google", LoginButton)}
            {this.renderButton("github", LoginButton)}
          </Fragment>
        )}
      />
    );
  }
}
