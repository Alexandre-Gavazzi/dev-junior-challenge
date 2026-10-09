import { Pool } from 'pg';
import { CheckinsPostgresRepository } from '../src/checkins/repositorio/postgres.repository.js';
import { testarContratoDoRepositorio } from './contrato-repositorio.js';

// Precisa de um Postgres de verdade. Sem TEST_DATABASE_URL o teste é pulado.
// Use um banco só para teste: a tabela é esvaziada a cada caso.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('CheckinsPostgresRepository (Postgres real)', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url });
    await new CheckinsPostgresRepository(pool).criarTabela();
  });

  afterAll(async () => {
    await pool.end();
  });

  testarContratoDoRepositorio(async () => {
    await pool.query('TRUNCATE checkins');
    return new CheckinsPostgresRepository(pool);
  });

  it('pode criar a tabela de novo sem erro', async () => {
    await expect(
      new CheckinsPostgresRepository(pool).criarTabela(),
    ).resolves.toBeUndefined();
  });
});
