import { Module } from '@nestjs/common';
import { CadastroModule } from '../cadastro/cadastro.module.js';
import { Relogio } from '../common/relogio.js';
import { CheckinsController } from './checkins.controller.js';
import { CheckinsRepository } from './checkins.repository.js';
import { CheckinsService } from './checkins.service.js';

@Module({
  imports: [CadastroModule],
  controllers: [CheckinsController],
  providers: [CheckinsService, CheckinsRepository, Relogio],
})
export class CheckinsModule {}
