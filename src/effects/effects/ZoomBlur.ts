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
uniform float u_strength;
uniform float u_samples;
uniform vec2 u_center;

void main() {
  vec2 uv = v_uv;
  vec2 center = u_center;

  vec2 dir = uv - center;
  float dist = length(dir);

  vec4 color = vec4(0.0);
  float total = 0.0;

  int sampleCount = int(u_samples);

  for (int i = 0; i < 32; i++) {
    if (i >= sampleCount) break;

    float t = float(i) / float(sampleCount - 1);
    float scale = 1.0 - u_strength * t * dist;

    vec2 sampleUv = center + dir * scale;
    color += texture(u_texture, sampleUv);
    total += 1.0;
  }

  fragColor = color / total;
}
`;

class ZoomBlurEffect extends BaseEffect {
  id = 'zoomBlur';
  name = 'Zoom Blur';

  controls: ControlDefinition[] = [
    { name: 'strength', type: 'float', label: 'Strength', defaultValue: 0.3, min: 0.0, max: 1.0, step: 0.01 },
    { name: 'samples', type: 'integer', label: 'Samples', defaultValue: 16, min: 4, max: 32 },
    { name: 'centerX', type: 'float', label: 'Center X', defaultValue: 0.5, min: 0.0, max: 1.0, step: 0.01 },
    { name: 'centerY', type: 'float', label: 'Center Y', defaultValue: 0.5, min: 0.0, max: 1.0, step: 0.01 },
  ];

  private strength = 0.3;
  private samples = 16;
  private centerX = 0.5;
  private centerY = 0.5;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['strength', 'samples', 'center'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1f(this.uniforms.strength, this.strength);
    gl.uniform1f(this.uniforms.samples, this.samples);
    gl.uniform2f(this.uniforms.center, this.centerX, this.centerY);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'strength' && typeof value === 'number') this.strength = value;
    else if (name === 'samples' && typeof value === 'number') this.samples = value;
    else if (name === 'centerX' && typeof value === 'number') this.centerX = value;
    else if (name === 'centerY' && typeof value === 'number') this.centerY = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'strength') return this.strength;
    if (name === 'samples') return this.samples;
    if (name === 'centerX') return this.centerX;
    if (name === 'centerY') return this.centerY;
    return undefined;
  }
}

export const zoomBlurFactory: EffectFactory = {
  id: 'zoomBlur',
  name: 'Zoom Blur',
  create: () => new ZoomBlurEffect(),
};
