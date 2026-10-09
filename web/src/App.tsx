import { CheckinForm } from './components/CheckinForm';
import { Fila } from './components/Fila';
import { useFila } from './useFila';

export default function App() {
  const { fila, carregando, erro, atualizar } = useFila();

  return (
    <main className="pagina">
      <h1>Check-in de pacientes</h1>
      <div className="colunas">
        <CheckinForm onCheckin={() => void atualizar()} />
        <Fila fila={fila} carregando={carregando} erro={erro} />
      </div>
    </main>
  );
}
