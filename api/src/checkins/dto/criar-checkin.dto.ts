import { Transform } from 'class-transformer';
import { IsDefined, IsString, Matches } from 'class-validator';
import { FORMATO_CPF } from '../../common/cpf.js';

// Os validadores rodam de baixo para cima; com stopAtFirstError vale a primeira falha
export class CriarCheckinDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(FORMATO_CPF, {
    message: 'CPF inválido. Use 11 dígitos, com ou sem pontuação.',
  })
  @IsString({ message: 'Envie o CPF como texto.' })
  @IsDefined({ message: 'Informe o CPF.' })
  cpf: string;
}
