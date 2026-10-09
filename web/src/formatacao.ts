// 11111111111 -> 111.111.111-11 enquanto a pessoa digita
export function formatarCpf(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function contarDigitos(valor: string): number {
  return valor.replace(/\D/g, '').length;
}

// Mesma conta da API: só serve para avisar antes de enviar
export function cpfValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 11) return false;
  const calcular = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(d[9]) && calcular(10) === Number(d[10]);
}

const formatoHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export function formatarHora(iso: string): string {
  return formatoHora.format(new Date(iso));
}
