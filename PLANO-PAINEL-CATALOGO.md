# Plano de implementação — painel do catálogo Ámbar Essence

Data: 22/09/2026. Destinatário: agente executor usando gpt-5.6-luna com esforço max.
Este documento especifica trabalho futuro; não é evidência de implementação ou publicação.

## 1. Resultado esperado e decisões já tomadas

Entregar um painel em `/admin/`, em português, para os donos adicionarem, editarem, ocultarem, reativarem e excluírem itens. Cada item terá foto, título e descrição, além dos campos pertinentes ao catálogo. A foto deverá ser preparada no navegador, com enquadramento e prévia. Salvar deve gerar uma atualização no GitHub e uma publicação automática, sem exportação manual de arquivos.

Arquitetura escolhida: site estático Vite + Decap CMS + arquivos no GitHub + Cloudflare Pages com Pages Functions apenas para OAuth do GitHub. Sem banco de dados, servidor permanente, assinatura de CMS, armazenamento pago de imagens ou cadastro próprio de usuários. O usuário aceitou o login GitHub depois de discutir a alternativa de link sem autenticação. Não voltar à proposta de painel público com poder de escrita.

Cada editor precisa de conta GitHub e permissão de escrita no repositório. Isso concede acesso ao repositório, não apenas a produtos: explicar esse requisito na documentação dos responsáveis. O endereço do painel pode ser público; quem protege a escrita são OAuth e as permissões GitHub.

Meta de custo: operar nas cotas gratuitas, sem prometer gratuidade ilimitada. Não contratar plano nem ativar cobrança. Domínio próprio existente ou futuro é separado dessa meta.

Não incluir nesta entrega checkout, pagamentos, pedidos, login de clientes, estoque quantitativo, geração de imagens, reformulação visual ou edição de todas as seções institucionais. Preço não existe no catálogo atual: deixar fora desta versão, salvo nova solicitação. Oculto significa ausente do catálogo público, não confidencial no histórico Git.

## 2. Inventário confirmado e precauções iniciais

Repositório: `/Users/brendabba/Documents/projetos-pessoais/ambar-site`.

- `src/main.ts`: tipos `Product` e `Spray`, sete entradas em `products`, sete em `sprays`, renderização por `innerHTML`, duas edições especiais escritas no HTML (Moscow Mule e Vela em casca de coco).
- `src/style.css`: fotos de produtos com altura de 430px no desktop e 410px no mobile; sprays e especiais têm outros enquadramentos. Usa `object-fit: cover` e posições específicas por imagem.
- `public/products/`: fotos atuais. Algumas aparecem em mais de uma parte do site.
- `vite.config.ts`: desenvolvimento usa `/`; outros modos usam `/ambar-site/`. Isso precisa ser parametrizado para Cloudflare na raiz.
- `.github/workflows/deploy-pages.yml`: publicação atual no GitHub Pages a partir de `main`.
- `package.json`: scripts `dev`, `build` e `preview`; build executa TypeScript e Vite. Ainda não há suíte de testes declarada.
- `tsconfig.json`: strict, JSON habilitado e inclusão somente de `src`. Functions e scripts precisarão de verificação própria.
- Código Three.js e fallbacks existem e devem continuar funcionando.

Na inspeção final desta elaboração, `git status --short` estava vazio. Isso é um retrato, não uma autorização para limpar o checkout. No início, ler os AGENTS.md aplicáveis, executar status e diff, registrar branch e HEAD, conferir novamente o inventário. Preservar alterações de terceiros. Não usar reset/clean ou substituir arquivos inteiros sem inspecionar diferenças.

## 3. Organização proposta

```text
content/
  products/*.json
  sprays/*.json
  specials/*.json
public/
  products/                    # acervo existente preservado
  uploads/                     # novas imagens preparadas
admin/index.html               # segunda entrada Vite
src/
  catalog/schema.ts
  catalog/load.ts
  catalog/render.ts
  admin/main.ts
  admin/config.ts
  admin/preview.tsx             # se a integração Decap exigir React
  admin/image-control.tsx
  admin/image-processing.ts
functions/api/auth.ts
functions/api/callback.ts
functions/_shared/oauth.ts
scripts/validate-catalog.*
tests/catalog/
tests/admin/
tests/oauth/
docs/PAINEL-OPERACAO.md
docs/PAINEL-INFRAESTRUTURA.md
docs/PAINEL-VALIDACAO.md
```

Os nomes podem ser ajustados à versão das ferramentas, mantendo separação de responsabilidades. Vite deve gerar `dist/index.html` e `dist/admin/index.html`; arquivos em `public` não passam por compilação TypeScript. Não colocar imports TS em um HTML simplesmente copiado de `public`.

Instalar versões compatíveis e fixadas de Decap, React e dependências realmente necessárias, registradas no lockfile. Não usar CDN `latest`. O site público não deve importar React, Decap nem o editor de imagens; esses pacotes pertencem exclusivamente à entrada admin.

## 4. Contrato dos dados

Usar coleções de pasta do Decap, uma entrada JSON por item. Isso facilita edição, exclusão e conflitos independentes. Cada coleção possui `create: true`, exclusão habilitada, formato JSON e campo identificador `name`. Verificar a configuração exata na versão instalada.

Campos comuns:

| Campo | Regra |
| --- | --- |
| `id` | Identificador estável, único na coleção e igual ao nome do arquivo; gerado na criação, imutável na edição |
| `name` | Obrigatório, texto simples, 1–80 caracteres após trim |
| `description` | Texto simples até 500 caracteres; obrigatório para novos itens |
| `image` | Caminho local sob `products/` ou `uploads/`; resolver com BASE_URL |
| `imageAlt` | Descrição acessível, 1–160 caracteres; sugestão automática editável |
| `imagePosition` | Posição validada; aceitar posições legadas e preferir valores numéricos normalizados para novos itens |
| `visible` | Booleano; padrão true, com rótulo “Exibir no site” |
| `order` | Inteiro não negativo; empate resolvido por id |

Produtos preservam `mood` (acolhimento, leveza, energia, natureza), `moodLabel`, `notes`, `formats` e `accent`. Usar selects e paleta para evitar CSS arbitrário. Sprays preservam `profile`; especiais preservam a linha de apresentação hoje exibida acima do nome, por exemplo “Edição especial · 150g”. Não duplicar categoria de seção: a coleção determina o grupo, enquanto mood determina o filtro das fragrâncias.

Migração de sprays: como não há descrição separada hoje, permitir ausência apenas nos registros migrados; não inventar texto comercial. O formulário deve exigir descrição em novos cadastros e permitir ao editor completar os existentes. A apresentação de descrições novas precisa ser prevista sem quebrar o layout.

Identidade não pode depender de renomear o arquivo quando o título muda. Provar esse comportamento com o Decap real; gerar id na criação por extensão suportada caso necessário. Nomes iguais podem existir em coleções diferentes. Duplicação de id na mesma coleção deve falhar antes da publicação.

Validação deve ser reutilizada no build e, quando possível, no painel. Rejeitar dados inválidos, caminhos com `..`, protocolos externos, estilos livres e tipos incorretos. Validar existência das imagens. Erros precisam citar coleção, arquivo e campo, sem expor credenciais.

## 5. Fases e dependências

### Fase 0 — baseline e riscos técnicos

1. Registrar inventário atual, executar `npm ci` e `npm run build`, capturar o site em 390px e desktop para comparação.
2. Conferir quantidade e conteúdo dos 16 cartões existentes; registrar imagens, posições, links e ordem. Não confundir fotos editoriais com itens editáveis.
3. Confirmar versões atuais e documentação primária de Decap/Cloudflare/GitHub. Investigar em um protótipo pequeno a integração do editor de fotos com upload e o protocolo OAuth do Decap.
4. Não construir um CMS do zero nem adaptar APIs imaginadas. Se uma extensão depender de APIs internas, documentar e testar com a versão fixada; preferir API pública.

Saída: baseline documentado e decisões de integração comprovadas. Não bloquear migração de dados pela ausência de credenciais externas.

### Fase 1 — extrair catálogo sem regressão

1. Criar os 16 JSONs com IDs estáveis e ordem equivalente à atual. Preservar textos e posições exatamente, sem recomprimir fotos existentes.
2. Criar schema, validador e loader em build time (por exemplo, glob Vite com imports JSON), com filtragem e ordenação determinísticas.
3. Refatorar produtos, sprays e especiais para a mesma fonte de conteúdo. Não deixar os especiais hardcoded e fora do painel.
4. Tratar dados como texto, preferencialmente com DOM/textContent; se manter templates, escapar texto e atributos corretamente. Validar CSS e URLs separadamente. `encodeURIComponent` sozinho não protege atributos HTML.
5. Filtrar `visible` antes de renderizar/contar. Numeração contígua com `padStart(2, "0")`. Ocultar/editar/excluir não pode afetar outro item de nome parecido.
6. Manter links WhatsApp gerados a partir do nome, codificados e com número centralizado. Alt deve distinguir vela, spray e edição especial.
7. Zero itens: apresentar estado discreto no catálogo; filtro sem resultado deve informar ausência. Não renderizar cards vazios ou quebrar inicialização de animações.
8. Rodar validação no build e validar também caminhos sob `/` e `/ambar-site/`.

Aceite: mesma aparência e conteúdo inicial, sem regressão em filtros, links, mobile e cenas 3D.

### Fase 2 — painel e operações

1. Configurar entrada Vite independente e Decap com inicialização manual, idioma português registrado corretamente e três coleções com nomes amigáveis.
2. Usar modo simples de publicação, sem fluxo editorial com PR obrigatório. Confirmar que as regras da branch permitem esse modo; não reduzir proteções existentes silenciosamente.
3. Mostrar título, miniatura, visibilidade e ordem na listagem, com pesquisa. Explicar em português os campos e limites.
4. Criar prévia correspondente ao cartão da coleção, incluindo modo mobile. Reutilizar estilos/componentes quando viável sem carregar a página inteira e suas animações no iframe.
5. Exclusão deve pedir confirmação com o nome do item e avisar que ele sairá do site após a publicação. Confirmar o diálogo nativo; estender somente se não atender.
6. Ocultar deve salvar `visible: false`; reativar restaura o mesmo registro. Não chamar isso de estoque ou confidencialidade.
7. Cancelar edição deve preservar o registro anterior; avisar ao abandonar alterações não salvas. Tratar falha de rede, sessão expirada, permissão insuficiente e conflito de edição sem apresentar sucesso falso.
8. Salvar significa commit aceito. Exibir aviso de que atualização do site leva alguns minutos e um link para conferência; não dizer “já está no ar” sem confirmação do deploy. Não implementar polling com token privilegiado só para esse aviso.

Aceite: CRUD completo e persistência ao recarregar em backend de teste/local, sem confundir essa evidência com GitHub real.

### Fase 3 — imagem preparada automaticamente

Obrigatório: o dono escolhe uma imagem, ajusta enquadramento e vê o resultado antes de salvar. Decap documenta redimensionamento e recorte central, mas isso não comprova um editor interativo. Validar o recurso na versão instalada; adicionar controle/extensão se necessário.

Contrato proposto para novos uploads: JPEG, PNG e WebP de até 15 MB e 40 megapixels; saída WebP com lado maior até 1600px, qualidade inicial 82, meta até 500 KB e teto de 1 MB. Não ampliar fotos pequenas silenciosamente. Para dimensões insuficientes, apresentar orientação; para arquivo não decodificável, falhar sem apagar a foto anterior. HEIC deve receber mensagem explícita de conversão para JPEG nesta primeira versão, caso não haja suporte comprovado.

1. Corrigir orientação EXIF ao decodificar e remover metadados na regravação.
2. Permitir mover/ajustar enquadramento, com controles acessíveis por teclado e toque; oferecer modo de conter imagem para preservar o produto inteiro quando necessário.
3. Medir proporções reais das três coleções. Preservar imagens antigas e seus enquadramentos. Não impor uma proporção única à força nem alterar altura dos cartões sem comparação visual.
4. Salvar recorte e posição de modo que a prévia corresponda ao resultado final no desktop e mobile. Se adicionar `imageFit`, definir enum cover/contain e atualizar schema, renderer e preview juntos.
5. Gerar nome único estável por upload (id + identificador aleatório ou hash). Trocar foto não sobrescreve arquivo compartilhado ou cacheado de outro produto.
6. Persistir o arquivo processado via integração Decap, e não blob URL/base64 no JSON. Recarregar o painel e conferir a imagem salva. Não processar a mesma foto duas vezes pelo widget e por media_processing.
7. Liberar object URLs; impedir duplo envio; mostrar progresso e mensagens claras. Validar formato real, não somente extensão. Não permitir SVG/HTML como upload de produto.
8. Não excluir mídia automaticamente ao excluir um item: fotos podem ser compartilhadas. Limpeza de órfãos fica fora desta versão; documentar crescimento do repositório.

Aceite: orientação, tamanho, dimensões e bytes verificados no arquivo efetivamente salvo; prévia não é a única evidência. Testar foto vertical, horizontal, transparente, muito grande, pequena, corrompida e com nome repetido.

### Fase 4 — autenticação mínima no mesmo projeto

Implementar Pages Functions em `/api/auth` e `/api/callback`, com OAuth App do GitHub e protocolo de popup esperado pela versão Decap. Não inventar nomes de mensagens: conferir implementação/documentação do backend instalado.

Configuração privada somente em secrets server-side: client secret e chave de proteção do state, se usada. Client ID, origem pública, repo e branch são configuração; nenhum secret pode usar prefixo `VITE_` ou entrar em `public`, bundle, logs, commit, URL de retorno ou mensagem de erro.

Requisitos:

- State aleatório criptograficamente seguro, vinculado à sessão do navegador, com expiração curta e validação no callback. Cookie HttpOnly/Secure/SameSite compatível com retorno OAuth; remover após uso. Testar repetição e divergência de state.
- Redirect/callback e origem de postMessage definidos por configuração confiável, nunca por parâmetro arbitrário. Validar origem e source na negociação do popup; não entregar token com `targetOrigin: "*"`.
- Troca de code por token somente no servidor, com tratamento de cancelamento, erro e timeout. Escapar qualquer dado inserido em HTML de callback.
- Escopos mínimos compatíveis com backend e visibilidade real do repo; não pedir escopo de workflows por conveniência. Explicar alcance se repo privado exigir permissão ampla.
- Não usar token pessoal compartilhado, token embutido no site ou API pública de escrita com credencial de proprietário.
- GitHub continua responsável por autorização de escrita. Usuário sem acesso ao repo não consegue alterar arquivos. Nunca tratar apenas a existência do login como permissão.
- Responses OAuth sem cache; política de referência que evite vazamento de code; headers de segurança compatíveis com popup. Não aplicar COOP que quebre opener sem testar o fluxo.
- Logout, revogação e sessão expirada devem ter comportamento documentado. Não prometer que OAuth padrão armazena tokens apenas em cookie: verificar como o Decap realmente gerencia a sessão no navegador.

Criar exemplos de variáveis sem valores reais e ignorar arquivos locais de secrets. Testar Functions no runtime Cloudflare local, não apenas no servidor Vite. Um backend local sem autenticação deve ficar restrito a localhost e jamais ser selecionado no build de produção.

Aceite local: testes negativos passam. Aceite externo: login real, escrita permitida e escrita negada comprovados em ambiente de teste autorizado.

### Fase 5 — hospedagem e publicação

1. Parametrizar base Vite: raiz para Cloudflare, subcaminho apenas quando explicitamente configurado para compatibilidade. Evitar depender do nome arbitrário do modo para decidir domínio.
2. Configurar projeto Cloudflare com comando de build incluindo validação, saída `dist`, Functions na estrutura esperada e branch de produção confirmada. Segredos do ambiente de produção não devem ser distribuídos a previews de branches não confiáveis.
3. Restringir execução de Functions a `/api/*` usando roteamento apropriado. Catálogo e assets continuam estáticos, sem invocar função por visita.
4. Confirmar que navegação direta em `/admin/`, assets, callback e 404 funcionam. Não criar fallback SPA que devolva HTML no lugar de um arquivo JSON ou endpoint OAuth.
5. Conectar GitHub à Cloudflare. Não manter dois mecanismos concorrentes para publicar na mesma hospedagem. Preservar workflow atual até validar a migração; sua retirada pertence à mudança de hospedagem revisada.
6. Alterar produto de teste e comprovar cadeia: commit de conteúdo → build validado → deploy terminal bem-sucedido → site público atualizado. Repetir edição, ocultação, reativação e exclusão.
7. Falha de build deve preservar o deploy anterior. Para rollback, preferir revert do commit do catálogo, restabelecendo também a fonte, e verificar o novo deploy. Rollback apenas da hospedagem é emergencial e não corrige Git.
8. Não alterar DNS, domínio de produção ou desligar GitHub Pages sem autorização específica para a migração. O pedido atual autoriza elaborar este plano, não executar uma publicação ampla.

Documentar cotas atuais, build por atualização e ausência de garantia de custo zero ilimitado. Não usar GitHub Pages como destino definitivo para esse catálogo comercial: ver restrição de uso na fonte oficial.

## 6. Matriz mínima de testes

| Área | Casos obrigatórios | Evidência |
| --- | --- | --- |
| Migração | 7 produtos, 7 sprays, 2 especiais; textos e fotos preservados | Comparação de dados e capturas |
| Schema | id repetido, campos ausentes, imagem inexistente, caminho externo/traversal, limites | Testes que realmente falham com fixtures inválidas |
| Render | HTML malicioso como texto, aspas, acentos, nomes longos, 0/1/muitos itens | Testes e navegador |
| CRUD | criar, editar inclusive título, excluir confirmando/cancelando, ocultar/reativar | Reload comprova persistência |
| IDs | renomear não cria duplicata; nomes iguais em coleções distintas | Arquivos e histórico |
| Fotos | orientação, crop, contain, compressão, limites, formatos inválidos, imagem compartilhada | Dimensões/bytes e inspeção visual |
| OAuth | state ausente/errado/expirado/repetido; origem errada; code inválido; cancelamento | Testes de Functions e integração autorizada |
| Permissões | sem login; conta sem escrita; conta autorizada; sessão expirada | Teste real separado de mocks |
| Concorrência | duas abas editam o mesmo item; falha de rede ao salvar | Sem perda silenciosa/sucesso falso |
| Publicação | commit→deploy→site; build inválido preserva versão anterior | SHA e identificador de deploy |
| Caminhos | build raiz e subcaminho, acesso direto admin, uploads | Sem 404 e sem duplicar base |
| Regressão | filtros, WhatsApp, header/menu, candles/fallbacks, scroll | Desktop e mobile |
| Usabilidade | teclado, foco, leitor de tela básico, popup bloqueado | Registro manual |

Usar testes unitários para contrato/processamento e testes de navegador para integração do painel. Adicionar ferramentas enxutas (por exemplo Vitest/Playwright) somente onde houver testes significativos. Functions precisam de typecheck e testes no runtime adequado. Executar `git diff --check`, typechecks, suíte relevante e build após a última alteração.

Navegadores mínimos: Chromium desktop e viewport 390x844; WebKit/Safari para popup e imagens, com teste em dispositivo real quando disponível. Emulação não deve ser chamada de teste em iPhone real. Não dizer que está validado em navegadores que não foram executados.

Backend de teste do Decap, mocks e servidor local comprovam apenas suas camadas. O aceite operacional exige integração real GitHub + Cloudflare. Usar branch/projeto de teste autorizado para testes destrutivos, nunca apagar produtos reais só para demonstrar exclusão.

## 7. Configurações externas e bloqueios legítimos

Levantar apenas quando necessário, sem pedir que a usuária cole secrets no chat:

- Conta/projeto Cloudflare de destino e conexão GitHub autorizada.
- Repositório, branch, visibilidade e regras de proteção reais.
- Domínio/origem de teste e final para callback.
- OAuth App, Client ID e secret inserido diretamente no secret store.
- Contas dos editores e respectivas permissões.

Se faltar acesso externo, concluir código, testes locais, exemplos e instruções reproduzíveis. Relatar exatamente o que falta para provar operação; não declarar tarefa totalmente concluída nem inventar deploy. A falta de credencial externa não impede as fases 1–3 ou testes negativos da fase 4.

## 8. Documentação e conclusão

`docs/PAINEL-OPERACAO.md`: guia curto para donos com entrar, criar, enquadrar, editar, ocultar, excluir, aguardar publicação e reconhecer falha. Incluir que nome alterado conserva identidade e que exclusão não apaga o histórico Git.

`docs/PAINEL-INFRAESTRUTURA.md`: instalação reproduzível, configuração de base, repo, callback, variáveis públicas versus secrets, ambiente local/preview/produção, build, publicação, cotas, restauração e revogação de acesso. Comandos devem corresponder aos scripts entregues.

`docs/PAINEL-VALIDACAO.md`: data, SHA, ambiente, testes executados e resultados, capturas, arquivos de exemplo e evidências de deploy sem tokens. Separar “local aprovado”, “integração aprovada”, “produção aprovada” e “pendente”.

Checklist final:

- [ ] Todas as três coleções estão disponíveis e o acervo inicial foi preservado.
- [ ] Criar/editar/excluir/ocultar/reativar funcionam com persistência.
- [ ] Fotos são efetivamente preparadas e a prévia corresponde ao site.
- [ ] Login real funciona, escrita não autorizada falha, secrets não foram expostos.
- [ ] Salvar desencadeia publicação e existe evidência da versão resultante.
- [ ] Mobile, filtros, WhatsApp e efeitos atuais continuam funcionando.
- [ ] Build e testes finais passaram; limitações estão registradas.
- [ ] Donos conseguem seguir o guia sem editar código ou exportar pacotes.

## 9. Fontes para o executor conferir

Consultadas na elaboração; conferir compatibilidade com as versões instaladas. Não copiar opções sem validação.

- Backend GitHub e acesso: https://decapcms.org/docs/github-backend/
- Configuração, coleções e processamento de mídia: https://decapcms.org/docs/configuration-options/
- Widgets customizados: https://decapcms.org/docs/custom-widgets/
- Clientes OAuth externos: https://decapcms.org/docs/external-oauth-clients/
- OAuth GitHub: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- Cloudflare Functions: https://developers.cloudflare.com/pages/functions/
- Preços/cotas: https://developers.cloudflare.com/pages/functions/pricing/ e https://developers.cloudflare.com/pages/platform/limits/
- Restrição GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## 10. Prompt de execução para o próximo agente

> Execute o plano PLANO-PAINEL-CATALOGO.md neste repositório, em fases, usando gpt-5.6-luna com esforço max conforme seleção da tarefa. Comece pelo status/diff e instruções locais. Preserve trabalho existente. Implemente o catálogo editável completo com Decap, CRUD, ocultação, preparação de imagens e Functions OAuth; não substitua por exportação manual. Registre decisões e evidências em docs/PAINEL-VALIDACAO.md. Valide cada fase e continue autonomamente no que não depende de acesso externo. Não confunda mocks com integração real nem commit com deploy concluído. Não publique em produção, altere DNS ou desligue a hospedagem atual sem autorização para essa etapa. Ao final, reporte arquivos alterados, testes, evidência de persistência/publicação e bloqueios externos exatos. Não prometa perfeição; entregue os critérios de aceite comprovados.
