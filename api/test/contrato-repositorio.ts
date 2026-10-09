import { randomUUID } from 'node:crypto';
import { Checkin } from '../src/checkins/checkin.js';
import { CheckinsRepository } from '../src/checkins/repositorio/checkins.repository.js';

// Mesma bateria para todas as versões do repositório (memória e Postgres)
export function testarContratoDoRepositorio(
  criar: () => Promise<CheckinsRepository>,
) {
  const HOJE = '2026-10-09';
  const AMANHA = '2026-10-10';
  let repositorio: CheckinsRepository;

  function checkin(cpf: string, chegada: string, nome = 'Paciente'): Checkin {
    return { id: randomUUID(), cpf, nome, chegadaEm: new Date(chegada) };
  }

  beforeEach(async () => {
    repositorio = await criar();
  });

  it('grava e lista o check-in do dia', async () => {
    const ana = checkin('11111111111', '2026-10-09T13:00:00Z', 'Ana Souza');

    await expect(repositorio.registrar(ana, HOJE)).resolves.toBe(true);

    expect(await repositorio.listarDoDia(HOJE)).toEqual([ana]);
  });

  it('recusa o mesmo CPF duas vezes no mesmo dia', async () => {
    await repositorio.registrar(
      checkin('11111111111', '2026-10-09T13:00:00Z'),
      HOJE,
    );

    await expect(
      repositorio.registrar(
        checkin('11111111111', '2026-10-09T15:00:00Z'),
        HOJE,
      ),
    ).resolves.toBe(false);
    expect(await repositorio.listarDoDia(HOJE)).toHaveLength(1);
  });

  it('aceita o mesmo CPF em outro dia', async () => {
    await repositorio.registrar(
      checkin('11111111111', '2026-10-09T13:00:00Z'),
      HOJE,
    );

    await expect(
      repositorio.registrar(
        checkin('11111111111', '2026-10-10T13:00:00Z'),
        AMANHA,
      ),
    ).resolves.toBe(true);
  });

  it('lista só o dia pedido, em ordem de chegada', async () => {
    await repositorio.registrar(
      checkin('22222222222', '2026-10-09T13:05:00Z', 'Bruno'),
      HOJE,
    );
    await repositorio.registrar(
      checkin('11111111111', '2026-10-09T13:00:00Z', 'Ana'),
      HOJE,
    );
    await repositorio.registrar(
      checkin('33333333333', '2026-10-10T13:00:00Z', 'Carla'),
      AMANHA,
    );

    const fila = await repositorio.listarDoDia(HOJE);

    expect(fila.map((c) => c.nome)).toEqual(['Ana', 'Bruno']);
  });

  it('com dois registros simultâneos do mesmo CPF, só um entra', async () => {
    const resultados = await Promise.all([
      repositorio.registrar(
        checkin('11111111111', '2026-10-09T13:00:00Z'),
        HOJE,
      ),
      repositorio.registrar(
        checkin('11111111111', '2026-10-09T13:00:00Z'),
        HOJE,
      ),
      repositorio.registrar(
        checkin('11111111111', '2026-10-09T13:00:00Z'),
        HOJE,
      ),
    ]);

    expect(resultados.filter(Boolean)).toHaveLength(1);
    expect(await repositorio.listarDoDia(HOJE)).toHaveLength(1);
  });
}
