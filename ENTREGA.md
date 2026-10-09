# Entrega · Alexandre Gavazzi

## Como rodar

### Com Docker (mais simples)

Precisa do Docker com Compose. Na raiz do repositório:

```bash
docker compose up --build
```

Sobem quatro serviços, nesta ordem: banco e cadastro, depois a API (só quando os dois estão prontos), depois a tela.

| O quê | Endereço |
|---|---|
| Tela de check-in e fila | http://localhost:5173 |
| API | http://localhost:3000 |
| Documentação da API (Swagger) | http://localhost:3000/docs |
| Cadastro (mock) | http://localhost:4000 |
| Postgres | `localhost:5432`, usuário e senha `desafio`, banco `checkin` |

Para parar: `docker compose down`. Para apagar também os dados do banco: `docker compose down -v`.

### Sem Docker

Precisa do Node 24 ou mais novo. Um terminal para cada:

```bash
# 1. cadastro
cd mock-service && npm install && npm start

# 2. api (porta 3000)
cd api && npm install && npm run start:dev

# 3. tela (porta 5173)
cd web && npm install && npm run dev
```

Assim a fila fica em memória. Para usar um Postgres, passe `DATABASE_URL` para a API (a tabela é criada sozinha na subida).

Variáveis da API, todas opcionais:

| Variável | Padrão | Para quê |
|---|---|---|
| `DATABASE_URL` | vazia (memória) | Postgres, ex.: `postgres://desafio:desafio@localhost:5432/checkin` |
| `CADASTRO_URL` | `http://localhost:4000` | Endereço do cadastro |
| `CADASTRO_TIMEOUT_MS` | `3000` | Limite de espera pelo cadastro |
| `WEB_ORIGIN` | `http://localhost:5173` | Origem liberada no CORS |
| `PORT` | `3000` | Porta da API |

### Testes

```bash
cd api && npm test          # serviço, cliente do cadastro, CPF, repositório em memória
cd api && npm run test:e2e  # API inteira com o cadastro simulado
cd web && npm test          # formulário de check-in
```

O teste do repositório no Postgres só roda com um banco de teste (ele esvazia a tabela). Com o compose no ar:

```bash
docker compose exec db psql -U desafio -d checkin -c "CREATE DATABASE checkin_teste"
cd api && TEST_DATABASE_URL=postgres://desafio:desafio@localhost:5432/checkin_teste npm run test:e2e
```

A cada push o GitHub Actions roda lint, testes (incluindo o Postgres), build e um check-in de ponta a ponta com o `docker compose`.

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
| 400 | CPF vazio, em formato inválido ou com dígito verificador errado |
| 404 | CPF não existe no cadastro |
| 409 | O paciente já fez check-in hoje |
| 502 | O cadastro está fora do ar ou respondeu algo inesperado |
| 503 | O banco está fora do ar |
| 504 | O cadastro passou de 3 segundos sem responder |

Tela em React (Vite) com o campo de CPF (já formata enquanto digita), mensagem de sucesso ou erro, e a fila do dia. A fila atualiza depois de cada check-in e a cada 10 segundos, pensando na recepção que fica com a tela aberta.

Também tem `GET /health`, a documentação navegável em `/docs` (Swagger, com todos os códigos de erro) e o `docker compose up` sobe tudo, com healthcheck em cada serviço.

## Onde guardei os dados

No Postgres, quando a API recebe `DATABASE_URL` (o compose já passa). Sem ela, em memória.

Comecei em memória para fechar o fluxo de ponta a ponta primeiro, mas deixei o acesso aos dados atrás de um contrato (`CheckinsRepository`) com duas versões: memória e Postgres. O serviço não sabe qual está em uso. Com o núcleo pronto, liguei o Postgres; a memória ficou como reserva para rodar sem instalar banco.

A tabela é uma só:

```sql
CREATE TABLE checkins (
  id          uuid        PRIMARY KEY,
  cpf         char(11)    NOT NULL,
  nome        text        NOT NULL,
  chegada_em  timestamptz NOT NULL,
  dia         date        NOT NULL,           -- dia em São Paulo
  CONSTRAINT checkins_um_por_dia UNIQUE (cpf, dia)
);
CREATE INDEX checkins_fila_do_dia ON checkins (dia, chegada_em);
```

O índice único garante um check-in por paciente por dia mesmo com mais de uma instância da API. O outro índice atende a consulta da fila (`WHERE dia = ... ORDER BY chegada_em`). Não usei ORM nem ferramenta de migração: com uma tabela, SQL direto é mais simples de ler e fica perto do que eu faria no Oracle.

## Decisões e dificuldades

**Cadastro como sistema externo que pode falhar.** O cliente do cadastro fica isolado (`CadastroClient`) e é injetado no serviço, então dá para trocar por um falso nos testes. Ele tem timeout de 3 segundos e separa "CPF não existe" (404, resposta normal do cadastro) de "cadastro com problema" (502 ou 504). A ideia é a recepção saber se o erro é do paciente ou do sistema.

**Uma dificuldade real aqui.** Quando derrubei o mock para testar, esperava o erro de conexão recusada (`ECONNREFUSED`). Mas rodando no Docker, a porta continua aberta pelo próprio Docker e o erro vem diferente (`UND_ERR_SOCKET`, resposta vazia). Se eu tivesse tratado só o `ECONNREFUSED`, a queda no Docker viraria um erro 500 genérico. Então qualquer falha de rede com o cadastro vira 502.

**CPF.** Aceito com ou sem pontuação e normalizo para 11 dígitos antes de chamar o cadastro. O README do cadastro diz "somente dígitos", então não quis depender de ele aceitar pontuação. Isso também evita que alguém mande algo como `../health` e faça a API chamar outra rota do cadastro.

Também confiro os dígitos verificadores, na tela e na API. Na tela, para quem está no totem saber na hora que digitou errado ("CPF inválido") em vez de receber "não encontrado". Na API, para não gastar uma chamada ao cadastro com um número que não pode existir. Os CPFs de teste do cadastro passam na conta (CPF com todos os dígitos iguais fecha o cálculo), então não bloqueei esse caso. Na prática:

| Exemplo | Resposta |
|---|---|
| `312.312.312-31` | 400, CPF inválido (nem chega ao cadastro) |
| `99999999999` ou `12345678909` | 404, CPF válido mas fora do cadastro |
| `11111111111` | 201, check-in feito |

**Check-in repetido.** O mesmo paciente não entra duas vezes na fila no mesmo dia (409). Pensei no totem: a pessoa aperta o botão duas vezes. Quem garante isso é o repositório, no mesmo passo da gravação: na memória, conferir e gravar acontecem sem `await` no meio; no Postgres, o `INSERT ... ON CONFLICT (cpf, dia) DO NOTHING` deixa o banco decidir. As duas versões passam pelo mesmo teste, que dispara três gravações simultâneas do mesmo CPF e espera que só uma entre.

**"Fila do dia" e fuso.** Guardo o horário de chegada em UTC e calculo o dia pelo fuso de São Paulo. O container da API roda em UTC; sem isso, a fila "viraria o dia" às 21h. Tem teste com 22h, 23h e meia-noite e meia.

**Dados do paciente.** A API só devolve o necessário para a recepção: nome, CPF mascarado (`***.111.111-**`) e horário. Data de nascimento não sai, e o CPF não vai para o log.

**Testes.** Testes de unidade no serviço (fluxo feliz, CPF inexistente, repetido, clique duplo, ordem e virada do dia), no cliente do cadastro (200, 404, 500, fora do ar, timeout) e no CPF. Um mesmo conjunto de testes de contrato roda contra o repositório em memória e contra um Postgres de verdade. Tem e2e da API com o cadastro simulado (incluindo a documentação Swagger) e testes do formulário com Testing Library. O Nest 12 já vem com Vitest no lugar do Jest; usei o que veio.

**Uma segunda dificuldade, achada testando.** Com o Postgres ligado, parei o banco para ver o 503 e a API inteira caiu. O `pg` avisa pelo evento `error` do pool quando o banco derruba uma conexão parada, e sem ninguém ouvindo esse evento o Node encerra o processo. Coloquei o ouvinte (só registra no log) e um teste que falha sem ele. Agora, com o banco fora, a API responde 503 e volta sozinha quando ele retorna.

**Outras pedras no caminho.** A imagem Docker com Node 22 falhou no `npm ci` porque o lock foi gerado com npm 11; passei para Node 24 (LTS).

**Uso de IA.** Usei o Claude Code como par durante o desenvolvimento: para discutir as opções de cada decisão, revisar o código e montar os testes. As escolhas acima foram minhas e revisei tudo o que entrou.

## O que faria com mais tempo

- Ferramenta de migração de banco (Flyway, Liquibase ou a do ORM) quando houver mais de uma tabela, e a versão Oracle do repositório.
- Status do atendimento (aguardando, chamado, atendido) e um botão de chamar na tela da recepção.
- Atualização da fila em tempo real (SSE ou WebSocket) em vez de consultar a cada 10 segundos.
- Retry com backoff na chamada ao cadastro e um circuit breaker se ele ficar instável.
- Autenticação na tela da recepção, já que ela mostra dados de pacientes.
- Logs estruturados com um id por requisição, para rastrear um check-in de ponta a ponta.
