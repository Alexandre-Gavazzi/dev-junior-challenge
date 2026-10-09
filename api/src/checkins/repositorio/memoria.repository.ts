import { diaNoHospital } from '../../common/relogio.js';
import { Checkin } from '../checkin.js';
import { CheckinsRepository } from './checkins.repository.js';

// Usado quando não há DATABASE_URL. A fila some quando a API reinicia.
export class CheckinsMemoriaRepository extends CheckinsRepository {
  private readonly checkins: Checkin[] = [];

  registrar(checkin: Checkin, dia: string): Promise<boolean> {
    // Sem await entre conferir e gravar: nenhuma outra requisição entra no meio
    const jaEntrou = this.checkins.some(
      (c) => c.cpf === checkin.cpf && diaNoHospital(c.chegadaEm) === dia,
    );
    if (!jaEntrou) this.checkins.push(checkin);
    return Promise.resolve(!jaEntrou);
  }

  listarDoDia(dia: string): Promise<Checkin[]> {
    return Promise.resolve(
      this.checkins
        .filter((c) => diaNoHospital(c.chegadaEm) === dia)
        .sort((a, b) => a.chegadaEm.getTime() - b.chegadaEm.getTime()),
    );
  }
}
