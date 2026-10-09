import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiGatewayTimeoutResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { paraResposta } from './checkin.js';
import { CheckinsService } from './checkins.service.js';
import { CheckinRespostaDto, ErroDto } from './dto/checkin-resposta.dto.js';
import { CriarCheckinDto } from './dto/criar-checkin.dto.js';

@ApiTags('checkins')
@ApiServiceUnavailableResponse({
  type: ErroDto,
  description: 'Banco de dados indisponível',
})
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Post()
  @ApiOperation({
    summary: 'Faz o check-in',
    description:
      'Busca o nome no cadastro de pacientes e coloca o paciente na fila do dia.',
  })
  @ApiCreatedResponse({ type: CheckinRespostaDto })
  @ApiBadRequestResponse({
    type: ErroDto,
    description: 'CPF vazio ou inválido',
  })
  @ApiNotFoundResponse({ type: ErroDto, description: 'CPF fora do cadastro' })
  @ApiConflictResponse({ type: ErroDto, description: 'Já fez check-in hoje' })
  @ApiBadGatewayResponse({ type: ErroDto, description: 'Cadastro fora do ar' })
  @ApiGatewayTimeoutResponse({
    type: ErroDto,
    description: 'Cadastro demorou mais de 3 s',
  })
  async criar(@Body() dto: CriarCheckinDto): Promise<CheckinRespostaDto> {
    return paraResposta(await this.checkins.criar(dto.cpf));
  }

  @Get()
  @ApiOperation({ summary: 'Fila de hoje, em ordem de chegada' })
  @ApiOkResponse({ type: [CheckinRespostaDto] })
  async listarFila(): Promise<CheckinRespostaDto[]> {
    return (await this.checkins.listarFilaDoDia()).map(paraResposta);
  }
}
