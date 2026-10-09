import { Injectable } from '@nestjs/common';
import { diaNoHospital } from '../common/relogio.js';
import { Checkin } from './checkin.js';

/**
 * Guarda os check-ins em memória enquanto a API está no ar.
 * Trocar por Postgres ou Oracle é reescrever só esta classe.
 */
@Injectable()
export class CheckinsRepository {
  private readonly checkins: Checkin[] = [];

  salvar(checkin: Checkin): void {
    this.checkins.push(checkin);
  }

  buscarDoDia(cpf: string, dia: string): Checkin | undefined {
    return this.checkins.find(
      (c) => c.cpf === cpf && diaNoHospital(c.chegadaEm) === dia,
    );
  }

  listarDoDia(dia: string): Checkin[] {
    return this.checkins
      .filter((c) => diaNoHospital(c.chegadaEm) === dia)
      .sort((a, b) => a.chegadaEm.getTime() - b.chegadaEm.getTime());
  }
}
