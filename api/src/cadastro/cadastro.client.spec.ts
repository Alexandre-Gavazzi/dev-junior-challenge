import {
  BadGatewayException,
  GatewayTimeoutException,
  Logger,
} from '@nestjs/common';
import { CadastroClient } from './cadastro.client.js';

describe('CadastroClient', () => {
  const client = new CadastroClient({
    url: 'http://cadastro.test',
    timeoutMs: 50,
  });

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function respondeCom(status: number, corpo: unknown) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(corpo), { status }),
      ),
    );
  }

  it('retorna o nome quando o paciente existe', async () => {
    respondeCom(200, {
      cpf: '11111111111',
      nome: 'Ana Souza',
      dataNascimento: '1988-03-12',
    });

    await expect(client.buscarPorCpf('11111111111')).resolves.toEqual({
      nome: 'Ana Souza',
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://cadastro.test/pacientes/11111111111',
      expect.anything(),
    );
  });

  it('retorna null quando o cadastro responde 404', async () => {
    respondeCom(404, { erro: 'Paciente não encontrado' });

    await expect(client.buscarPorCpf('99999999999')).resolves.toBeNull();
  });

  it('lança 502 quando o cadastro responde erro 500', async () => {
    respondeCom(500, {});

    await expect(client.buscarPorCpf('11111111111')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('lança 502 quando o cadastro está fora do ar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    );

    await expect(client.buscarPorCpf('11111111111')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('lança 502 quando a resposta vem sem nome', async () => {
    respondeCom(200, { cpf: '11111111111' });

    await expect(client.buscarPorCpf('11111111111')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('lança 504 quando o cadastro passa do timeout', async () => {
    // fetch que só termina quando o AbortSignal dispara
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(init.signal?.reason),
            );
          }),
      ),
    );

    await expect(client.buscarPorCpf('11111111111')).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });
});
