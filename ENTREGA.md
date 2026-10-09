# Entrega · Alexandre Gavazzi

## Como rodar

### Com Docker (mais simples)

Precisa do Docker com Compose. Na raiz do repositório:

```bash
docker compose up --build
```

| O quê | Endereço |
|---|---|
| Tela de check-in e fila | http://localhost:5173 |
| API | http://localhost:3000 |
| Cadastro (mock) | http://localhost:4000 |

Para parar: `docker compose down`.

### Sem Docker

Precisa do Node 20 ou mais novo. Um terminal para cada:

```bash
# 1. cadastro
cd mock-service && npm install && npm start

# 2. api (porta 3000)
cd api && npm install && npm run start:dev

# 3. tela (porta 5173)
cd web && npm install && npm run dev
```

A API lê duas variáveis, as duas opcionais: `CADASTRO_URL` (padrão `http://localhost:4000`) e `CADASTRO_TIMEOUT_MS` (padrão `3000`).

### Testes

```bash
cd api && npm test          # serviço de check-in e cliente do cadastro
cd api && npm run test:e2e  # API inteira, com o cadastro simulado
cd web && npm test          # formulário de check-in
```

CPFs de teste: `11111111111` a `55555555555` (mesmo dígito repetido). Qualquer outro não existe no cadastro.

## O que foi feito

API em NestJS com dois endpoints:

| Método | Rota | O que faz |
|---|---|---|
| POST | `/checkins` | Recebe `{ "cpf": "..." }`, busca o nome no cadastro e coloca o paciente na fila |
| GET | `/checkins` | Lista a fila de hoje em ordem de chegada |

Respostas de erro, sempre com `{ "message": "..." }` em português:

| Código | Quando |
|---|---|
| 400 | CPF vazio ou em formato inválido |
| 404 | CPF não existe no cadastro |
| 409 | O paciente já fez check-in hoje |
| 502 | O cadastro está fora do ar ou respondeu algo inesperado |
| 504 | O cadastro passou de 3 segundos sem responder |

Tela em React (Vite) com o campo de CPF (já formata enquanto digita), mensagem de sucesso ou erro, e a fila do dia. A fila atualiza depois de cada check-in e a cada 10 segundos, pensando na recepção que fica com a tela aberta.

Também tem `GET /health` na API e o `docker compose up` sobe tudo.

## Onde guardei os dados

Em memória, dentro da API. Se a API reiniciar, a fila zera.

Escolhi assim para garantir o fluxo completo funcionando primeiro, que é o que o desafio pede. Mas deixei o acesso aos dados isolado numa classe só (`CheckinsRepository`). O serviço não sabe onde os dados ficam, então trocar por Postgres ou Oracle é reescrever essa classe, sem mexer no resto. Por isso o Postgres do compose não sobe por padrão (`docker compose --profile banco up` sobe, se quiser).

## Decisões e dificuldades

**Cadastro como sistema externo que pode falhar.** O cliente do cadastro fica isolado (`CadastroClient`) e é injetado no serviço, então dá para trocar por um falso nos testes. Ele tem timeout de 3 segundos e separa "CPF não existe" (404, resposta normal do cadastro) de "cadastro com problema" (502 ou 504). A ideia é a recepção saber se o erro é do paciente ou do sistema.

**Uma dificuldade real aqui.** Quando derrubei o mock para testar, esperava o erro de conexão recusada (`ECONNREFUSED`). Mas rodando no Docker, a porta continua aberta pelo próprio Docker e o erro vem diferente (`UND_ERR_SOCKET`, resposta vazia). Se eu tivesse tratado só o `ECONNREFUSED`, a queda no Docker viraria um erro 500 genérico. Então qualquer falha de rede com o cadastro vira 502.

**CPF.** Aceito com ou sem pontuação e normalizo para 11 dígitos antes de chamar o cadastro. O README do cadastro diz "somente dígitos", então não quis depender de ele aceitar pontuação. Isso também evita que alguém mande algo como `../health` e faça a API chamar outra rota do cadastro. Não validei o dígito verificador porque os CPFs de teste (`11111111111`) seriam recusados; com dados reais eu validaria.

**Check-in repetido.** O mesmo paciente não entra duas vezes na fila no mesmo dia (409). Pensei no totem: a pessoa aperta o botão duas vezes. A verificação e a gravação acontecem sem `await` entre elas, então nem dois cliques ao mesmo tempo passam. Tem um teste para isso, e conferi que ele falha se a verificação for feita antes da chamada ao cadastro.

**"Fila do dia" e fuso.** Guardo o horário de chegada em UTC e calculo o dia pelo fuso de São Paulo. O container da API roda em UTC; sem isso, a fila "viraria o dia" às 21h. Tem teste com 22h, 23h e meia-noite e meia.

**Dados do paciente.** A API só devolve o necessário para a recepção: nome, CPF mascarado (`***.111.111-**`) e horário. Data de nascimento não sai, e o CPF não vai para o log.

**Testes.** Fiz testes de unidade no serviço (fluxo feliz, CPF inexistente, repetido, clique duplo, ordem e virada do dia) e no cliente do cadastro (200, 404, 500, fora do ar, timeout), um e2e da API com o cadastro simulado, e testes do formulário com Testing Library. O Nest 12 já vem com Vitest no lugar do Jest; usei o que veio.

**Outras pedras no caminho.** A imagem Docker com Node 22 falhou no `npm ci` porque o lock foi gerado com npm 11; passei para Node 24 (LTS).

**Uso de IA.** Usei o Claude Code como par durante o desenvolvimento: para discutir as opções de cada decisão, revisar o código e montar os testes. As escolhas acima foram minhas e revisei tudo o que entrou.

## O que faria com mais tempo

- Trocar a memória por banco (Postgres aqui, Oracle no hospital), com índice por dia e CPF.
- Status do atendimento (aguardando, chamado, atendido) e um botão de chamar na tela da recepção.
- Atualização da fila em tempo real (SSE ou WebSocket) em vez de consultar a cada 10 segundos.
- Retry com backoff na chamada ao cadastro e um circuit breaker se ele ficar instável.
- Autenticação na tela da recepção, já que ela mostra dados de pacientes.
- Pipeline no GitHub Actions rodando lint e testes a cada push.
- Logs estruturados com um id por requisição, para rastrear um check-in de ponta a ponta.
