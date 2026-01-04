import { GenerationFactory } from '../types/generation';
import { plasmaFactory } from './shaders/plasma';
import { gradientFactory } from './shaders/gradient';
import { cubesFactory } from './sketches/cubes';

// All available generations
export const generations: GenerationFactory[] = [
  plasmaFactory,
  gradientFactory,
  cubesFactory,
];

export { plasmaFactory, gradientFactory, cubesFactory };
