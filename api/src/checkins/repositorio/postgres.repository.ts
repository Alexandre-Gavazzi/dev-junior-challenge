import {
  Logger,
  OnApplicationShutdown,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { Checkin } from '../checkin.js';
import { CheckinsRepository } from './checkins.repository.js';

interface LinhaCheckin {
  id: string;
  cpf: string;
  nome: string;
  chegada_em: Date;
}

export class CheckinsPostgresRepository
  extends CheckinsRepository
  implements OnApplicationShutdown
{
  private readonly logger = new Logger(CheckinsPostgresRepository.name);

  constructor(private readonly pool: Pool) {
    super();
  }

  // Sem ferramenta de migração: uma tabela só, criada na subida se não existir
  async criarTabela(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS checkins (
        id          uuid        PRIMARY KEY,
        cpf         char(11)    NOT NULL,
        nome        text        NOT NULL,
        chegada_em  timestamptz NOT NULL,
        dia         date        NOT NULL,
        CONSTRAINT checkins_um_por_dia UNIQUE (cpf, dia)
      );
      CREATE INDEX IF NOT EXISTS checkins_fila_do_dia ON checkins (dia, chegada_em);
    `);
  }

  async registrar(checkin: Checkin, dia: string): Promise<boolean> {
    // O índice único (cpf, dia) é quem garante um check-in por dia,
    // mesmo com mais de uma instância da API rodando.
    const resultado = await this.consultar(
      `INSERT INTO checkins (id, cpf, nome, chegada_em, dia)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cpf, dia) DO NOTHING`,
      [checkin.id, checkin.cpf, checkin.nome, checkin.chegadaEm, dia],
    );
    return resultado.rowCount === 1;
  }

  async listarDoDia(dia: string): Promise<Checkin[]> {
    const { rows } = await this.consultar<LinhaCheckin>(
      `SELECT id, cpf, nome, chegada_em
         FROM checkins
        WHERE dia = $1
        ORDER BY chegada_em, id`,
      [dia],
    );
    return rows.map((linha) => ({
      id: linha.id,
      cpf: linha.cpf,
      nome: linha.nome,
      chegadaEm: linha.chegada_em,
    }));
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }

  private async consultar<T extends object>(sql: string, valores: unknown[]) {
    try {
      return await this.pool.query<T>(sql, valores);
    } catch (erro) {
      this.logger.error(
        `Falha no banco: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
      throw new ServiceUnavailableException(
        'Não foi possível acessar a fila agora. Tente novamente.',
      );
    }
  }
}
