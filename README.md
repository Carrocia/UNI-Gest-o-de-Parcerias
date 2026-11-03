# Permuta — painel de parcerias

Primeira versão da ferramenta para registrar permutas, acompanhar benefícios, contatos, eventos e materiais a enviar. A interface funciona em computador e celular.

## Abrir o projeto

Como o JavaScript usa módulos, abra o projeto por um servidor local (por exemplo, a extensão Live Server do VS Code) em vez de abrir `index.html` diretamente. Não há etapa de build nesta versão.

Sem Supabase configurado, os cadastros ficam neste navegador usando `localStorage`.

## Ativar o Supabase

1. Crie um projeto no Supabase.
2. Em **SQL Editor**, execute [`supabase/schema.sql`](supabase/schema.sql).
3. Copie a URL do projeto e a chave **anon/public** para [`src/config.js`](src/config.js).
4. Publique os arquivos em um servidor estático.

O banco dessa primeira versão permite leitura e inclusão sem autenticação para facilitar a validação interna. Antes de expor o endereço publicamente ou guardar informações sensíveis, configure login e políticas de acesso mais restritas no Supabase. Nunca coloque a chave `service_role` no navegador.

## O que já dá para fazer

- Cadastrar parceria de publicidade, torre ou outro tipo.
- Guardar o que a equipe oferece e recebe, contatos, links e observações.
- Registrar eventos, data para entrar em contato e prazo para enviar materiais.
- Acompanhar os próximos eventos e ações no painel e na agenda.
- Pesquisar e filtrar a base de parcerias.

Os dados demonstrativos não estão pré-carregados; a base inicia vazia para receber as parcerias reais.
