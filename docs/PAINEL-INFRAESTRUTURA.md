# Infraestrutura do painel

## Componentes

- `admin/index.html` inicia o Decap CMS sem alterar a página pública.
- `src/admin/config.ts` define as três coleções, o backend GitHub e a localização das mídias.
- `src/admin/image-control.tsx` e `src/admin/image-processing.ts` fazem a preparação local da foto antes do upload.
- `content/products`, `content/sprays` e `content/specials` guardam um JSON por item.
- `functions/api/auth.ts` e `functions/api/callback.ts` implementam o OAuth no formato Pages Functions usado no projeto Cloudflare Pages.
- `scripts/validate-catalog.mjs` verifica campos, IDs, caminhos locais e existência das imagens durante o build.

## OAuth

As Pages Functions nunca colocam segredos no bundle. O Google autentica a identidade do editor e a GitHub App entrega, somente no servidor, um token de instalação com permissão de conteúdo no repositório. Configure apenas no ambiente privado da hospedagem:

```text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
PUBLIC_SITE_ORIGIN
GITHUB_OAUTH_SCOPE=public_repo
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_ALLOWED_EMAILS
GITHUB_APP_ID
GITHUB_APP_INSTALLATION_ID
GITHUB_APP_PRIVATE_KEY
```

O fluxo usa `state` aleatório em cookie `HttpOnly`, `Secure` (em HTTPS) e `SameSite=Lax`, valida a origem exata, verifica a assinatura e o e-mail permitido do ID token do Google e troca o `code` no servidor. A GitHub App fica limitada ao repositório `brendaalcantara/ambar-site`; a chave privada nunca é enviada ao navegador. O popup só aceita mensagens do opener e da origem confiável. Não use PAT, token no código, query string de origem ou `postMessage` com `*`.

Para desenvolvimento local, copie `functions/.dev.vars.example` para `functions/.dev.vars` e preencha valores de teste. O arquivo real é ignorado pelo Git.

## Hospedagem e ambientes

O site público legado continua no [GitHub Pages](https://brendaalcantara.github.io/ambar-site/), com o workflow passando `VITE_BASE_PATH=/ambar-site/` para preservar os caminhos atuais. O painel operacional está publicado no projeto [Cloudflare Pages](https://ambar-site.pages.dev/) na raiz, onde a base é `/` e as Functions ficam em `/api/auth` e `/api/callback`.

O projeto Cloudflare `ambar-site` está conectado ao repositório `brendaalcantara/ambar-site`, branch `main`, com `npm run build` e saída `dist`. A aplicação OAuth do GitHub usa o callback `https://ambar-site.pages.dev/api/callback`; as quatro configurações do fluxo foram cadastradas como secrets do ambiente Production no Cloudflare. Nenhuma chave é enviada ao bundle, ao Git ou ao chat.

O DNS e o domínio personalizado não foram alterados. A troca definitiva de domínio ou a retirada do GitHub Pages continua sendo uma etapa separada, para ser feita somente quando a validação do novo endereço estiver concluída.
