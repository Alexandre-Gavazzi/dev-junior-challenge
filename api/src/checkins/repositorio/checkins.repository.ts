import { Checkin } from '../checkin.js';

/**
 * Onde a fila fica guardada. O serviço só conhece este contrato;
 * hoje existem duas versões: memória e Postgres.
 */
export abstract class CheckinsRepository {
  /**
   * Grava o check-in. Retorna false se o paciente já entrou nesse dia.
   * Conferir e gravar acontecem juntos, para dois cliques ao mesmo tempo
   * não passarem os dois.
   */
  abstract registrar(checkin: Checkin, dia: string): Promise<boolean>;

  /** Check-ins do dia (AAAA-MM-DD), em ordem de chegada. */
  abstract listarDoDia(dia: string): Promise<Checkin[]>;
}
