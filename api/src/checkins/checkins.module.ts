import { Logger, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { CadastroModule } from '../cadastro/cadastro.module.js';
import { Relogio } from '../common/relogio.js';
import { CheckinsController } from './checkins.controller.js';
import { CheckinsService } from './checkins.service.js';
import { CheckinsRepository } from './repositorio/checkins.repository.js';
import { CheckinsMemoriaRepository } from './repositorio/memoria.repository.js';
import { CheckinsPostgresRepository } from './repositorio/postgres.repository.js';

// Com DATABASE_URL a fila vai para o Postgres; sem ela, fica em memória
async function criarRepositorio(): Promise<CheckinsRepository> {
  const logger = new Logger('CheckinsModule');
  const url = process.env.DATABASE_URL;

  if (!url) {
    logger.log('Sem DATABASE_URL: fila guardada em memória');
    return new CheckinsMemoriaRepository();
  }

  const repositorio = new CheckinsPostgresRepository(
    new Pool({ connectionString: url }),
  );
  await repositorio.criarTabela();
  logger.log('Fila guardada no Postgres');
  return repositorio;
}

@Module({
  imports: [CadastroModule],
  controllers: [CheckinsController],
  providers: [
    CheckinsService,
    Relogio,
    { provide: CheckinsRepository, useFactory: criarRepositorio },
  ],
})
export class CheckinsModule {}
