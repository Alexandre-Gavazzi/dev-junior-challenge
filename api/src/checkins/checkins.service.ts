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
import { CheckinsRepository } from './repositorio/checkins.repository.js';

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

    const agora = this.relogio.agora();
    const checkin: Checkin = {
      id: randomUUID(),
      cpf,
      nome: paciente.nome,
      chegadaEm: agora,
    };

    // Quem garante um check-in por dia é o repositório, no mesmo passo da gravação
    const registrado = await this.repositorio.registrar(
      checkin,
      diaNoHospital(agora),
    );
    if (!registrado) {
      throw new ConflictException('Este paciente já fez check-in hoje.');
    }
    return checkin;
  }

  listarFilaDoDia(): Promise<Checkin[]> {
    return this.repositorio.listarDoDia(diaNoHospital(this.relogio.agora()));
  }
}
