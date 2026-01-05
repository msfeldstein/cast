import { BaseEffect } from '../BaseEffect';
import { ControlDefinition, ControlValue } from '../../types/sketch';
import { EffectFactory } from '../../types/effect';

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixelSize;

void main() {
  vec2 uv = v_uv;

  // Calculate pixel grid
  float pixels = u_resolution.x / u_pixelSize;
  float aspect = u_resolution.x / u_resolution.y;

  vec2 pixelUv;
  pixelUv.x = floor(uv.x * pixels) / pixels;
  pixelUv.y = floor(uv.y * pixels * aspect) / (pixels * aspect);

  // Center the sample in the pixel
  pixelUv += 0.5 / vec2(pixels, pixels * aspect);

  fragColor = texture(u_texture, pixelUv);
}
`;

class PixelateEffect extends BaseEffect {
  id = 'pixelate';
  name = 'Pixelate';

  controls: ControlDefinition[] = [
    { name: 'pixelSize', type: 'float', label: 'Pixel Size', defaultValue: 8.0, min: 1.0, max: 64.0, step: 0.5 },
  ];

  private pixelSize = 8.0;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['pixelSize'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1f(this.uniforms.pixelSize, this.pixelSize);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'pixelSize' && typeof value === 'number') this.pixelSize = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'pixelSize') return this.pixelSize;
    return undefined;
  }
}

export const pixelateFactory: EffectFactory = {
  id: 'pixelate',
  name: 'Pixelate',
  create: () => new PixelateEffect(),
};
