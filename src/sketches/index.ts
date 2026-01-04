import { SketchFactory } from '../types/sketch';
import { plasmaFactory } from './shaders/plasma';
import { gradientFactory } from './shaders/gradient';
import { cloudsFactory } from './shaders/clouds';
import { cubesFactory } from './three/cubes';

// All available sketches
export const sketches: SketchFactory[] = [
  plasmaFactory,
  gradientFactory,
  cloudsFactory,
  cubesFactory,
];

export { plasmaFactory, gradientFactory, cloudsFactory, cubesFactory };
