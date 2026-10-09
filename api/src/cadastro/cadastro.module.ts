import { Module } from '@nestjs/common';
import {
  CADASTRO_CONFIG,
  CadastroClient,
  CadastroConfig,
} from './cadastro.client.js';

@Module({
  providers: [
    CadastroClient,
    {
      provide: CADASTRO_CONFIG,
      useFactory: (): CadastroConfig => ({
        url: process.env.CADASTRO_URL ?? 'http://localhost:4000',
        timeoutMs: Number(process.env.CADASTRO_TIMEOUT_MS) || 3000,
      }),
    },
  ],
  exports: [CadastroClient],
})
export class CadastroModule {}
