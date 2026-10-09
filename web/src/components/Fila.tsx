import type { Checkin } from '../api';
import { formatarHora } from '../formatacao';

interface Props {
  fila: Checkin[];
  carregando: boolean;
  erro: string | null;
}

export function Fila({ fila, carregando, erro }: Props) {
  return (
    <section className="cartao">
      <h2>
        Fila de hoje <span className="contador">{fila.length}</span>
      </h2>

      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="vazio">Carregando a fila...</p>
      ) : fila.length === 0 ? (
        <p className="vazio">Ninguém na fila ainda hoje.</p>
      ) : (
        <ol className="fila">
          {fila.map((checkin, i) => (
            <li key={checkin.id}>
              <span className="posicao">{i + 1}</span>
              <span className="paciente">
                <strong>{checkin.nome}</strong>
                <small>{checkin.cpf}</small>
              </span>
              <time dateTime={checkin.chegadaEm}>
                {formatarHora(checkin.chegadaEm)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
