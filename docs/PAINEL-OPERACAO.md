# Painel do catálogo Ámbar Essence

O painel fica em [`https://ambar-site.pages.dev/admin/`](https://ambar-site.pages.dev/admin/) e usa Decap CMS para editar os arquivos JSON versionados no próprio repositório. As coleções disponíveis são **Velas**, **Home sprays** e **Edições especiais**. O botão de publicar grava um commit simples no GitHub; o Cloudflare Pages e o workflow legado do GitHub Pages acompanham a branch `main` enquanto a migração de domínio permanece separada.

## Quem pode editar

Cada pessoa precisa estar na lista de contas Google autorizadas. A GitHub App do painel mantém a permissão de escrita no repositório `brendaalcantara/ambar-site` somente no servidor; os editores não precisam de uma conta GitHub com acesso direto. O painel não cria usuários próprios e não usa banco de dados. A lista de e-mails autorizados deve conter apenas pessoas que podem alterar o site.

O endereço público do painel não é uma barreira de acesso. A proteção depende do login Google, da lista de e-mails autorizados, da GitHub App limitada ao repositório e das secrets configuradas no ambiente de hospedagem.

## Editar um item

1. Abra [`https://ambar-site.pages.dev/admin/`](https://ambar-site.pages.dev/admin/) e entre com o Google autorizado. O GitHub permanece disponível como alternativa durante a transição.
2. Escolha uma das três coleções.
3. Edite os campos e use a prévia desktop/mobile antes de salvar.
4. Para ocultar um item sem perder seus dados, desative **Visível no catálogo**. Para remover de vez, use a exclusão e confirme.
5. Publique e confira o commit. O site pode levar alguns minutos para refletir a mudança.

O campo **ID estável** é criado uma vez e não deve ser alterado. A ordem usa números inteiros; empates são resolvidos pelo ID. O catálogo público ignora itens com `visible: false` e renumera a sequência visível.

## Fotos

O controle de imagem aceita JPEG, PNG e WebP de até 15 MB e 40 megapixels. Ele mostra a prévia, permite mover o ponto focal com toque, arraste, mouse ou teclado e oferece recortes opcionais 4:5, 4:3 e 1:1. A saída é WebP, com lado máximo de 1600 px, qualidade inicial 82, redução progressiva se necessário para ficar abaixo de 1 MB e sem metadados EXIF. Arquivos não são ampliados automaticamente.

HEIC/HEIF recebe uma mensagem explícita para converter antes do envio. A imagem processada é anexada pelo fluxo de mídia do Decap; nenhum base64 é salvo no JSON. Fotos antigas não são apagadas automaticamente, portanto a limpeza de arquivos órfãos precisa ser uma tarefa consciente.

## Mensagens esperadas

- **Imagem preparada e anexada**: o arquivo processado foi associado ao campo; ainda falta publicar o registro.
- **Commit concluído, deploy pendente**: o GitHub recebeu a alteração; aguarde o build automático do Cloudflare Pages ou do GitHub Pages e confira o endereço publicado antes de considerar a mudança disponível.
- **Sessão expirada ou não confere**: refaça o login; o estado OAuth é descartado após dez minutos.
- **O editor não disponibilizou o salvamento de mídia**: recarregue o painel e confira se o login está ativo.

Não há campos de preço, estoque, pedido, pagamento, cliente ou geração automática de imagens nesta versão.
