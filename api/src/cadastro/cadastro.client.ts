import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

export interface CadastroConfig {
  url: string;
  timeoutMs: number;
}

export const CADASTRO_CONFIG = Symbol('CADASTRO_CONFIG');

// Só o que a fila precisa. Data de nascimento fica no cadastro.
export interface PacienteCadastro {
  nome: string;
}

@Injectable()
export class CadastroClient {
  private readonly logger = new Logger(CadastroClient.name);

  constructor(
    @Inject(CADASTRO_CONFIG) private readonly config: CadastroConfig,
  ) {}

  /** Retorna null quando o CPF não existe no cadastro (404). */
  async buscarPorCpf(cpf: string): Promise<PacienteCadastro | null> {
    const url = `${this.config.url}/pacientes/${encodeURIComponent(cpf)}`;

    try {
      const resposta = await fetch(url, {
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (resposta.status === 404) return null;
      if (!resposta.ok)
        throw new Error(`cadastro respondeu ${resposta.status}`);

      const corpo = (await resposta.json()) as { nome?: unknown };
      if (typeof corpo.nome !== 'string' || corpo.nome.trim() === '') {
        throw new Error('cadastro respondeu sem nome');
      }

      return { nome: corpo.nome };
    } catch (erro) {
      // CPF fica fora do log de propósito
      if (erro instanceof Error && erro.name === 'TimeoutError') {
        this.logger.warn(
          `Cadastro sem resposta em ${this.config.timeoutMs} ms`,
        );
        throw new GatewayTimeoutException(
          'O cadastro de pacientes demorou para responder. Tente novamente.',
        );
      }

      // Cadastro fora do ar aparece de formas diferentes (ECONNREFUSED,
      // conexão fechada pelo proxy do Docker...). Tudo vira 502.
      this.logger.error(
        `Falha ao consultar o cadastro: ${descreverErro(erro)}`,
      );
      throw new BadGatewayException(
        'Cadastro de pacientes indisponível no momento. Tente novamente.',
      );
    }
  }
}

function descreverErro(erro: unknown): string {
  if (!(erro instanceof Error)) return String(erro);
  const causa = (erro.cause as { code?: string } | undefined)?.code;
  return causa ? `${erro.message} (${causa})` : erro.message;
}
