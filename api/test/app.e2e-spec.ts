import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { CadastroClient } from '../src/cadastro/cadastro.client.js';
import { configurarApp } from '../src/configurar-app.js';

// API inteira (rotas, validação, serviço), com o cadastro simulado
describe('Check-ins (e2e)', () => {
  let app: INestApplication<App>;

  const pacientes: Record<string, string> = {
    '11111111111': 'Ana Souza',
    '22222222222': 'Bruno Carvalho',
  };

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CadastroClient)
      .useValue({
        buscarPorCpf: (cpf: string) =>
          Promise.resolve(pacientes[cpf] ? { nome: pacientes[cpf] } : null),
      })
      .compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('faz o check-in e mostra o paciente na fila', async () => {
    const criado = await request(app.getHttpServer())
      .post('/checkins')
      .send({ cpf: '111.111.111-11' })
      .expect(201);

    expect(criado.body).toMatchObject({
      nome: 'Ana Souza',
      cpf: '***.111.111-**',
    });

    const fila = await request(app.getHttpServer())
      .get('/checkins')
      .expect(200);
    expect(fila.body).toHaveLength(1);
    expect(fila.body[0].nome).toBe('Ana Souza');
  });

  it('responde 404 para CPF fora do cadastro', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/checkins')
      .send({ cpf: '99999999999' })
      .expect(404);

    expect(resposta.body.message).toBe(
      'CPF não encontrado no cadastro de pacientes.',
    );
  });

  it('responde 409 no segundo check-in do dia', async () => {
    await request(app.getHttpServer())
      .post('/checkins')
      .send({ cpf: '22222222222' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/checkins')
      .send({ cpf: '22222222222' })
      .expect(409);
  });

  it.each([
    [{}, 'Informe o CPF.'],
    [{ cpf: 11111111111 }, 'Envie o CPF como texto.'],
    [{ cpf: '123' }, 'CPF inválido. Use 11 dígitos, com ou sem pontuação.'],
    [{ cpf: '312.312.312-31' }, 'CPF inválido. Confira os números.'],
    [
      { cpf: '../health' },
      'CPF inválido. Use 11 dígitos, com ou sem pontuação.',
    ],
  ])('responde 400 para %j', async (corpo, mensagem) => {
    const resposta = await request(app.getHttpServer())
      .post('/checkins')
      .send(corpo)
      .expect(400);

    expect(resposta.body.message).toBe(mensagem);
  });

  it('responde o health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok' });
  });
});
