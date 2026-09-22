# Validação do painel e do catálogo

Data desta implementação: 22/09/2026.

## Checks reproduzíveis

```bash
npm ci
npm run validate:catalog
npm run typecheck:functions
npm run build
```

O catálogo migrado contém 7 velas, 7 home sprays e 2 edições especiais. O build também gera `dist/admin/index.html` e mantém a página pública como uma segunda entrada Vite.

## Evidência local atual

- `npm ci`: concluído; o npm reportou vulnerabilidades transitivas do conjunto Decap e elas ainda não foram corrigidas automaticamente.
- `npm run validate:catalog`: concluído com 7/7/2 registros e imagens locais encontradas.
- `npm run typecheck:functions`: concluído para as duas Pages Functions e o módulo OAuth compartilhado.
- `npm run build`: concluído para site e painel; o bundle do painel é separado do bundle público.
- `VITE_BASE_PATH=/ambar-site/ npm run build`: concluído para confirmar os caminhos do GitHub Pages.
- Vite local: `/` abriu o catálogo renderizado e `/admin/` abriu a tela de login do Decap.
- Wrangler Pages local: `/` e `/admin/` responderam 200; sem secrets, `/api/auth` falhou fechado; com valores fictícios, respondeu 302 para o GitHub com `state` e cookie de sessão.

## Evidência de integração externa

- Commit publicado no GitHub: `bc5e281` (`feat: add Decap catalog admin panel`).
- Cloudflare Pages: projeto `ambar-site`, branch `main`, build concluído com status `success`, saída `dist` e Functions detectadas em `/functions`.
- Rotas públicas verificadas com HTTP 200: `https://ambar-site.pages.dev/` e `https://ambar-site.pages.dev/admin/`.
- OAuth público verificado: `https://ambar-site.pages.dev/api/auth?provider=github` respondeu HTTP 302 para o GitHub, com `state` e cookie de sessão; o retorno autorizado abriu o painel autenticado.
- O cliente OAuth Google, a GitHub App limitada ao repositório e os seis secrets do ambiente Production foram configurados; a validação final do callback Google ocorre após a publicação deste commit.
- Painel autenticado verificado em `https://ambar-site.pages.dev/admin/`: três coleções disponíveis e sete entradas de Velas listadas (o acervo validado localmente continua 7/7/2).
- GitHub Pages preservado e respondendo HTTP 200 em `https://brendaalcantara.github.io/ambar-site/` e `/ambar-site/admin/`; nenhum DNS foi alterado.

O commit de conteúdo pelo painel, o upload real de uma foto e o teste destrutivo de excluir/reativar um item ainda não foram executados para não alterar o catálogo real durante a configuração. Eles devem ser feitos com um item autorizado de teste antes de uma migração definitiva de domínio.

## Revisão visual recomendada

Depois de configurar o ambiente, revisar `/admin/` em uma viewport desktop e em 390×844, testar a prévia das três coleções, criar um item de teste, ocultá-lo, reativá-lo, substituir uma foto e cancelar um upload. Depois confirmar no GitHub o JSON, o arquivo WebP e o deploy correspondente.
