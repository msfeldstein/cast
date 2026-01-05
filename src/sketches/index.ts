import { SketchFactory } from '../types/sketch';
import { plasmaFactory } from './shaders/plasma';
import { gradientFactory } from './shaders/gradient';
import { cloudsFactory } from './shaders/clouds';
import { cubesFactory } from './three/cubes';
import { concentricCirclesFactory } from './shaders/concentricCircles';
import { fireBlobFactory } from './shaders/fireBlob';
import { perlinNoiseFactory } from './shaders/perlinNoise';
import { voronoiFactory } from './shaders/voronoi';
import { kaleidoscopeFactory } from './shaders/kaleidoscope';
import { tunnelFactory } from './shaders/tunnel';
import { waveformFactory } from './shaders/waveform';

// All available sketches
export const sketches: SketchFactory[] = [
  plasmaFactory,
  gradientFactory,
  cloudsFactory,
  cubesFactory,
  concentricCirclesFactory,
  fireBlobFactory,
  perlinNoiseFactory,
  voronoiFactory,
  kaleidoscopeFactory,
  tunnelFactory,
  waveformFactory,
];

export {
  plasmaFactory,
  gradientFactory,
  cloudsFactory,
  cubesFactory,
  concentricCirclesFactory,
  fireBlobFactory,
  perlinNoiseFactory,
  voronoiFactory,
  kaleidoscopeFactory,
  tunnelFactory,
  waveformFactory,
};
