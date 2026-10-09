import { useCallback, useEffect, useRef, useState } from 'react';
import { listarFila, type Checkin } from './api';

const INTERVALO_MS = 10_000;

export function useFila() {
  const [fila, setFila] = useState<Checkin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const ultimaBusca = useRef(0);

  const atualizar = useCallback(async () => {
    // Se duas buscas se cruzarem, só a mais recente vale
    const busca = ++ultimaBusca.current;
    try {
      const dados = await listarFila();
      if (busca !== ultimaBusca.current) return;
      setFila(dados);
      setErro(null);
    } catch (e) {
      if (busca !== ultimaBusca.current) return;
      setErro(e instanceof Error ? e.message : 'Erro ao carregar a fila.');
    } finally {
      if (busca === ultimaBusca.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // Busca externa: o setState só acontece depois do await, não no efeito
    // oxlint-disable-next-line react/set-state-in-effect
    void atualizar();
    const timer = setInterval(() => void atualizar(), INTERVALO_MS);
    return () => clearInterval(timer);
  }, [atualizar]);

  return { fila, carregando, erro, atualizar };
}
