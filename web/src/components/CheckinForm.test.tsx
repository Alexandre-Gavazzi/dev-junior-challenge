import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckinForm } from './CheckinForm';

function respondeCom(status: number, corpo: unknown) {
  const fetchFalso = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(corpo), { status }),
  );
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

describe('CheckinForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('formata o CPF e só libera o botão com 11 dígitos', async () => {
    render(<CheckinForm onCheckin={() => {}} />);
    const campo = screen.getByLabelText('CPF');
    const botao = screen.getByRole('button', { name: 'Fazer check-in' });

    await userEvent.type(campo, '1111111111');
    expect(botao).toBeDisabled();

    await userEvent.type(campo, '1');
    expect(campo).toHaveValue('111.111.111-11');
    expect(botao).toBeEnabled();
  });

  it('mostra o nome do paciente e avisa a fila depois do check-in', async () => {
    const fetchFalso = respondeCom(201, {
      id: '1',
      nome: 'Ana Souza',
      cpf: '***.111.111-**',
      chegadaEm: '2026-10-09T13:00:00.000Z',
    });
    const onCheckin = vi.fn();
    render(<CheckinForm onCheckin={onCheckin} />);

    await userEvent.type(screen.getByLabelText('CPF'), '11111111111');
    await userEvent.click(screen.getByRole('button', { name: 'Fazer check-in' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check-in feito, Ana Souza.',
    );
    expect(screen.getByLabelText('CPF')).toHaveValue('');
    expect(onCheckin).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchFalso.mock.calls[0][1].body)).toEqual({
      cpf: '111.111.111-11',
    });
  });

  it('mostra a mensagem da API quando o CPF não está no cadastro', async () => {
    respondeCom(404, { message: 'CPF não encontrado no cadastro de pacientes.' });
    const onCheckin = vi.fn();
    render(<CheckinForm onCheckin={onCheckin} />);

    await userEvent.type(screen.getByLabelText('CPF'), '99999999999');
    await userEvent.click(screen.getByRole('button', { name: 'Fazer check-in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'CPF não encontrado no cadastro de pacientes.',
    );
    expect(onCheckin).not.toHaveBeenCalled();
  });

  it('avisa quando o servidor está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<CheckinForm onCheckin={() => {}} />);

    await userEvent.type(screen.getByLabelText('CPF'), '11111111111');
    await userEvent.click(screen.getByRole('button', { name: 'Fazer check-in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor.',
    );
  });
});
