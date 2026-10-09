import { mascararCpf } from '../common/cpf.js';
import { CheckinRespostaDto } from './dto/checkin-resposta.dto.js';

export interface Checkin {
  id: string;
  cpf: string;
  nome: string;
  chegadaEm: Date;
}

// O CPF completo não sai da API: a tela da recepção não precisa dele
export function paraResposta(checkin: Checkin): CheckinRespostaDto {
  return {
    id: checkin.id,
    nome: checkin.nome,
    cpf: mascararCpf(checkin.cpf),
    chegadaEm: checkin.chegadaEm.toISOString(),
  };
}
