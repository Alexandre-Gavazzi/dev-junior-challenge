// Aceita com ou sem pontuação: 111.111.111-11 ou 11111111111
export const FORMATO_CPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

// Na fila só aparece o miolo do CPF: ***.111.111-**
export function mascararCpf(cpf: string): string {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}
