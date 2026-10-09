import { mascararCpf } from '../common/cpf.js';

export interface Checkin {
  id: string;
  cpf: string;
  nome: string;
  chegadaEm: Date;
}

export interface CheckinResposta {
  id: string;
  nome: string;
  cpf: string;
  chegadaEm: string;
}

// O CPF completo não sai da API: a tela da recepção não precisa dele
export function paraResposta(checkin: Checkin): CheckinResposta {
  return {
    id: checkin.id,
    nome: checkin.nome,
    cpf: mascararCpf(checkin.cpf),
    chegadaEm: checkin.chegadaEm.toISOString(),
  };
}
