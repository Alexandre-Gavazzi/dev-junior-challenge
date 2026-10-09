import { Injectable } from '@nestjs/common';

// Isolado para os testes conseguirem controlar a hora
@Injectable()
export class Relogio {
  agora(): Date {
    return new Date();
  }
}

const FUSO_DO_HOSPITAL = 'America/Sao_Paulo';

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_DO_HOSPITAL,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Dia (AAAA-MM-DD) no fuso do hospital, qualquer que seja o fuso do servidor.
 * Um container em UTC "viraria o dia" às 21h de São Paulo sem isso.
 */
export function diaNoHospital(data: Date): string {
  return formatoDia.format(data);
}
