# Painel do catálogo Ámbar Essence

O painel fica em `/admin/` e usa Decap CMS para editar os arquivos JSON versionados no próprio repositório. As coleções disponíveis são **Velas**, **Home sprays** e **Edições especiais**. O botão de publicar grava um commit simples no GitHub; o deploy do site é uma etapa separada do GitHub Pages/Cloudflare.

## Quem pode editar

Cada pessoa precisa de uma conta GitHub com permissão de escrita no repositório `brendaalcantara/ambar-site`. O painel não cria usuários próprios e não usa banco de dados. A permissão é do repositório inteiro, então ela deve ser concedida apenas a quem pode alterar o site.

O endereço público do painel não é uma barreira de acesso. A proteção depende do login OAuth do GitHub, da permissão no repositório e das secrets configuradas no ambiente de hospedagem.

## Editar um item

1. Abra `/admin/` e entre com o GitHub.
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
- **Commit concluído, deploy pendente**: o GitHub recebeu a alteração, mas a hospedagem ainda precisa executar o workflow.
- **Sessão expirada ou não confere**: refaça o login; o estado OAuth é descartado após dez minutos.
- **O editor não disponibilizou o salvamento de mídia**: recarregue o painel e confira se o login está ativo.

Não há campos de preço, estoque, pedido, pagamento, cliente ou geração automática de imagens nesta versão.
