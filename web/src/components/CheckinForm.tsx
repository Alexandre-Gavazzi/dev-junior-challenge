import { useEffect, useState, type FormEvent } from 'react';
import { criarCheckin } from '../api';
import { contarDigitos, cpfValido, formatarCpf } from '../formatacao';

type Aviso = { tipo: 'sucesso' | 'erro'; texto: string };

interface Props {
  onCheckin: () => void;
}

export function CheckinForm({ onCheckin }: Props) {
  const [cpf, setCpf] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const completo = contarDigitos(cpf) === 11;
  const invalido = completo && !cpfValido(cpf);

  // No totem o próximo paciente não deve ver o nome de quem passou antes
  useEffect(() => {
    if (aviso?.tipo !== 'sucesso') return;
    const timer = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(timer);
  }, [aviso]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!completo || invalido || enviando) return;

    setEnviando(true);
    setAviso(null);
    try {
      const checkin = await criarCheckin(cpf);
      setAviso({
        tipo: 'sucesso',
        texto: `Check-in feito, ${checkin.nome}. Aguarde a chamada.`,
      });
      setCpf('');
      onCheckin();
    } catch (e) {
      setAviso({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Algo deu errado.',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cartao" onSubmit={enviar} noValidate>
      <h2>Check-in</h2>
      <label className="campo">
        <span>CPF</span>
        <input
          value={cpf}
          onChange={(e) => {
            setCpf(formatarCpf(e.target.value));
            setAviso(null);
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          maxLength={14}
          autoFocus
        />
      </label>
      {invalido && (
        <p className="aviso aviso-erro campo-aviso" role="alert">
          CPF inválido. Confira os números.
        </p>
      )}
      <button type="submit" disabled={!completo || invalido || enviando}>
        {enviando ? 'Enviando...' : 'Fazer check-in'}
      </button>
      {aviso && (
        <p
          className={`aviso aviso-${aviso.tipo}`}
          role={aviso.tipo === 'erro' ? 'alert' : 'status'}
        >
          {aviso.texto}
        </p>
      )}
    </form>
  );
}
