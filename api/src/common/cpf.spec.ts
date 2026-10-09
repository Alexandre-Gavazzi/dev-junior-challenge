import { digitosVerificadoresOk, mascararCpf, normalizarCpf } from './cpf.js';

describe('cpf', () => {
  it.each([
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
  ])('aceita o CPF de teste do cadastro %s', (cpf) => {
    expect(digitosVerificadoresOk(cpf)).toBe(true);
  });

  it('aceita um CPF válido com pontuação', () => {
    expect(digitosVerificadoresOk('529.982.247-25')).toBe(true);
  });

  it.each(['312.312.312-31', '12345678901', '52998224724'])(
    'recusa %s, que tem dígito verificador errado',
    (cpf) => {
      expect(digitosVerificadoresOk(cpf)).toBe(false);
    },
  );

  it('normaliza e mascara', () => {
    expect(normalizarCpf('111.111.111-11')).toBe('11111111111');
    expect(mascararCpf('12345678909')).toBe('***.456.789-**');
  });
});
