declare module "decap-cms-lib-auth" {
  export class NetlifyAuthenticator {
    constructor(config?: Record<string, unknown>);
    authenticate(options: Record<string, unknown>, callback: (error: unknown, data?: any) => void): void;
  }
}

declare module "decap-cms-ui-default" {
  export const AuthenticationPage: any;
}

declare module "decap-cms-backend-github" {
  export const GitHubBackend: any;
}
