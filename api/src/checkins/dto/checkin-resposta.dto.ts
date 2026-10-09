import { ApiProperty } from '@nestjs/swagger';

export class CheckinRespostaDto {
  @ApiProperty({ example: '7f0e7488-0072-4d05-9f53-c74b38f5f545' })
  id: string;

  @ApiProperty({ example: 'Ana Souza' })
  nome: string;

  @ApiProperty({
    example: '***.111.111-**',
    description: 'CPF mascarado: a recepção não precisa do número completo',
  })
  cpf: string;

  @ApiProperty({
    example: '2026-10-09T13:00:00.000Z',
    description: 'Hora de chegada em UTC (ISO 8601)',
  })
  chegadaEm: string;
}

export class ErroDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'CPF não encontrado no cadastro de pacientes.' })
  message: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}
