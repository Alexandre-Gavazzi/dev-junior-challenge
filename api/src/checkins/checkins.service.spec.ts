import { ConflictException, NotFoundException } from '@nestjs/common';
import { CadastroClient } from '../cadastro/cadastro.client.js';
import { Relogio } from '../common/relogio.js';
import { CheckinsRepository } from './checkins.repository.js';
import { CheckinsService } from './checkins.service.js';

describe('CheckinsService', () => {
  let cadastro: { buscarPorCpf: ReturnType<typeof vi.fn> };
  let relogio: { agora: ReturnType<typeof vi.fn> };
  let service: CheckinsService;

  // 10h da manhã em São Paulo (13h UTC)
  const MANHA = new Date('2026-10-09T13:00:00Z');

  beforeEach(() => {
    cadastro = {
      buscarPorCpf: vi.fn().mockResolvedValue({ nome: 'Ana Souza' }),
    };
    relogio = { agora: vi.fn().mockReturnValue(MANHA) };
    service = new CheckinsService(
      cadastro as unknown as CadastroClient,
      new CheckinsRepository(),
      relogio as unknown as Relogio,
    );
  });

  it('registra o check-in com o nome vindo do cadastro', async () => {
    const checkin = await service.criar('11111111111');

    expect(checkin).toMatchObject({
      cpf: '11111111111',
      nome: 'Ana Souza',
      chegadaEm: MANHA,
    });
    expect(service.listarFilaDoDia()).toHaveLength(1);
  });

  it('normaliza o CPF antes de consultar o cadastro', async () => {
    await service.criar('111.111.111-11');

    expect(cadastro.buscarPorCpf).toHaveBeenCalledWith('11111111111');
  });

  it('recusa CPF que não existe no cadastro', async () => {
    cadastro.buscarPorCpf.mockResolvedValue(null);

    await expect(service.criar('99999999999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(service.listarFilaDoDia()).toHaveLength(0);
  });

  it('recusa o segundo check-in do mesmo paciente no dia, mesmo com pontuação', async () => {
    await service.criar('11111111111');

    await expect(service.criar('111.111.111-11')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('não deixa dois cliques simultâneos entrarem na fila', async () => {
    const resultados = await Promise.allSettled([
      service.criar('11111111111'),
      service.criar('11111111111'),
    ]);

    expect(resultados.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(service.listarFilaDoDia()).toHaveLength(1);
  });

  it('lista a fila do dia em ordem de chegada', async () => {
    cadastro.buscarPorCpf
      .mockResolvedValueOnce({ nome: 'Ana Souza' })
      .mockResolvedValueOnce({ nome: 'Bruno Carvalho' });

    relogio.agora.mockReturnValue(new Date('2026-10-09T13:00:00Z'));
    await service.criar('11111111111');
    relogio.agora.mockReturnValue(new Date('2026-10-09T13:05:00Z'));
    await service.criar('22222222222');

    expect(service.listarFilaDoDia().map((c) => c.nome)).toEqual([
      'Ana Souza',
      'Bruno Carvalho',
    ]);
  });

  it('usa o dia de São Paulo, não o dia em UTC', async () => {
    // 22h de 09/10 em São Paulo já é 10/10 em UTC
    relogio.agora.mockReturnValue(new Date('2026-10-10T01:00:00Z'));
    await service.criar('11111111111');

    // 23h de 09/10 em São Paulo: mesmo dia, o paciente continua na fila
    relogio.agora.mockReturnValue(new Date('2026-10-10T02:00:00Z'));
    expect(service.listarFilaDoDia()).toHaveLength(1);

    // 00h30 de 10/10 em São Paulo: dia novo, fila vazia
    relogio.agora.mockReturnValue(new Date('2026-10-10T03:30:00Z'));
    expect(service.listarFilaDoDia()).toHaveLength(0);
  });

  it('deixa o paciente fazer check-in de novo no dia seguinte', async () => {
    await service.criar('11111111111');

    relogio.agora.mockReturnValue(new Date('2026-10-10T13:00:00Z'));

    await expect(service.criar('11111111111')).resolves.toBeDefined();
  });
});
