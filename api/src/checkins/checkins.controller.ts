import { Body, Controller, Get, Post } from '@nestjs/common';
import { CheckinResposta, paraResposta } from './checkin.js';
import { CheckinsService } from './checkins.service.js';
import { CriarCheckinDto } from './dto/criar-checkin.dto.js';

@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Post()
  async criar(@Body() dto: CriarCheckinDto): Promise<CheckinResposta> {
    return paraResposta(await this.checkins.criar(dto.cpf));
  }

  @Get()
  listarFila(): CheckinResposta[] {
    return this.checkins.listarFilaDoDia().map(paraResposta);
  }
}
