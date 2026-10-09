import { CheckinsMemoriaRepository } from '../src/checkins/repositorio/memoria.repository.js';
import { testarContratoDoRepositorio } from './contrato-repositorio.js';

describe('CheckinsMemoriaRepository', () => {
  testarContratoDoRepositorio(() =>
    Promise.resolve(new CheckinsMemoriaRepository()),
  );
});
