const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface Checkin {
  id: string;
  nome: string;
  cpf: string;
  chegadaEm: string;
}

export async function criarCheckin(cpf: string): Promise<Checkin> {
  return chamar<Checkin>('/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf }),
  });
}

export async function listarFila(): Promise<Checkin[]> {
  return chamar<Checkin[]>('/checkins');
}

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, init);
  } catch {
    throw new Error('Não foi possível falar com o servidor. Tente novamente.');
  }

  const corpo: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    // A API sempre devolve { message } nos erros
    const mensagem = (corpo as { message?: unknown } | null)?.message;
    throw new Error(
      typeof mensagem === 'string' ? mensagem : 'Algo deu errado. Tente novamente.',
    );
  }
  return corpo as T;
}
