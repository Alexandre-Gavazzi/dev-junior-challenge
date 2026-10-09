import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

// Usado pelo main.ts e pelo teste e2e, para os dois rodarem igual
export function configurarApp(app: INestApplication): void {
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      // Uma mensagem só, em texto, fácil de mostrar na tela
      exceptionFactory: (erros) => {
        const mensagem = erros
          .flatMap((erro) => Object.values(erro.constraints ?? {}))
          .at(0);
        return new BadRequestException(mensagem ?? 'Requisição inválida.');
      },
    }),
  );
}
