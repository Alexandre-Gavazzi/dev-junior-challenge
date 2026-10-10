import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Usado pelo main.ts e pelo teste e2e, para os dois rodarem igual
export function configurarApp(app: NestExpressApplication): void {
  // Não anunciar qual servidor está por trás
  app.disable('x-powered-by');

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

  // Documentação navegável em /docs (JSON em /docs-json)
  const documento = new DocumentBuilder()
    .setTitle('Check-in de pacientes')
    .setDescription(
      'Totem de check-in: busca o nome no cadastro e organiza a fila do dia.',
    )
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, documento),
  );
}
