// Aceita com ou sem pontuação: 111.111.111-11 ou 11111111111
export const FORMATO_CPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Confere os dois dígitos verificadores.
 * CPFs com todos os dígitos iguais (os de teste do cadastro) passam na conta,
 * então não bloqueio esse caso.
 */
export function digitosVerificadoresOk(cpf: string): boolean {
  const d = normalizarCpf(cpf);
  if (d.length !== 11) return false;

  const calcular = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcular(9) === Number(d[9]) && calcular(10) === Number(d[10]);
}

// Na fila só aparece o miolo do CPF: ***.111.111-**
export function mascararCpf(cpf: string): string {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}
