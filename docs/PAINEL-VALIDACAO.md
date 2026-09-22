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

## Ainda depende de integração externa

O login real, o commit feito pelo painel, o upload para GitHub, a execução do workflow e o OAuth em Cloudflare ainda precisam de uma conta autorizada, secrets e ambiente de hospedagem. Portanto, estes checks locais não são declaração de publicação nem de OAuth funcionando em produção.

## Revisão visual recomendada

Depois de configurar o ambiente, revisar `/admin/` em uma viewport desktop e em 390×844, testar a prévia das três coleções, criar um item de teste, ocultá-lo, reativá-lo, substituir uma foto e cancelar um upload. Depois confirmar no GitHub o JSON, o arquivo WebP e o deploy correspondente.
