# Infraestrutura do painel

## Componentes

- `admin/index.html` inicia o Decap CMS sem alterar a página pública.
- `src/admin/config.ts` define as três coleções, o backend GitHub e a localização das mídias.
- `src/admin/image-control.tsx` e `src/admin/image-processing.ts` fazem a preparação local da foto antes do upload.
- `content/products`, `content/sprays` e `content/specials` guardam um JSON por item.
- `functions/api/auth.ts` e `functions/api/callback.ts` implementam o OAuth no formato Pages Functions para uma futura hospedagem Cloudflare.
- `scripts/validate-catalog.mjs` verifica campos, IDs, caminhos locais e existência das imagens durante o build.

## OAuth

As Pages Functions nunca colocam o segredo do GitHub no bundle. Configure apenas no ambiente privado da hospedagem:

```text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
PUBLIC_SITE_ORIGIN
GITHUB_OAUTH_SCOPE=public_repo
```

O fluxo usa `state` aleatório em cookie `HttpOnly`, `Secure` (em HTTPS) e `SameSite=Lax`, valida a origem exata e troca o `code` no servidor. O popup só aceita mensagens do opener e da origem confiável. Não use PAT, token no código, query string de origem ou `postMessage` com `*`.

Para desenvolvimento local, copie `functions/.dev.vars.example` para `functions/.dev.vars` e preencha valores de teste. O arquivo real é ignorado pelo Git.

## Hospedagem atual e próxima etapa

O site público continua no GitHub Pages enquanto o painel é validado. O workflow passa `VITE_BASE_PATH=/ambar-site/` para preservar os caminhos atuais. Em Cloudflare Pages, a base passa a ser `/` e as Functions ficam em `/api/auth` e `/api/callback`.

A migração de produção, troca de DNS, criação da aplicação OAuth no GitHub e cadastro das secrets são etapas externas. Elas exigem acesso à conta da hospedagem e só devem ser executadas depois da validação local do painel.
