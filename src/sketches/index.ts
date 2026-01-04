import { SketchFactory } from '../types/sketch';
import { plasmaFactory } from './shaders/plasma';
import { gradientFactory } from './shaders/gradient';
import { cubesFactory } from './three/cubes';

// All available sketches
export const sketches: SketchFactory[] = [
  plasmaFactory,
  gradientFactory,
  cubesFactory,
];

export { plasmaFactory, gradientFactory, cubesFactory };
