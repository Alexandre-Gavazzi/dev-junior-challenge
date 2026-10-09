import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CadastroClient } from '../cadastro/cadastro.client.js';
import { normalizarCpf } from '../common/cpf.js';
import { diaNoHospital, Relogio } from '../common/relogio.js';
import { Checkin } from './checkin.js';
import { CheckinsRepository } from './checkins.repository.js';

@Injectable()
export class CheckinsService {
  constructor(
    private readonly cadastro: CadastroClient,
    private readonly repositorio: CheckinsRepository,
    private readonly relogio: Relogio,
  ) {}

  async criar(cpfInformado: string): Promise<Checkin> {
    const cpf = normalizarCpf(cpfInformado);

    const paciente = await this.cadastro.buscarPorCpf(cpf);
    if (!paciente) {
      throw new NotFoundException(
        'CPF não encontrado no cadastro de pacientes.',
      );
    }

    // Verificação e gravação sem await entre elas: dois cliques seguidos
    // no totem não conseguem passar os dois por aqui.
    const agora = this.relogio.agora();
    if (this.repositorio.buscarDoDia(cpf, diaNoHospital(agora))) {
      throw new ConflictException('Este paciente já fez check-in hoje.');
    }

    const checkin: Checkin = {
      id: randomUUID(),
      cpf,
      nome: paciente.nome,
      chegadaEm: agora,
    };
    this.repositorio.salvar(checkin);
    return checkin;
  }

  listarFilaDoDia(): Checkin[] {
    return this.repositorio.listarDoDia(diaNoHospital(this.relogio.agora()));
  }
}
