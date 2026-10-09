import { Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { CheckinsPostgresRepository } from './postgres.repository.js';

describe('CheckinsPostgresRepository', () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  it('não derruba a API quando o banco fecha uma conexão parada', async () => {
    // Pool sem conexão aberta: nada vai ao banco neste teste
    const pool = new Pool({
      connectionString: 'postgres://ninguem@127.0.0.1:1/x',
    });
    new CheckinsPostgresRepository(pool);

    expect(() =>
      pool.emit('error', new Error('terminating connection')),
    ).not.toThrow();

    await pool.end();
  });
});
