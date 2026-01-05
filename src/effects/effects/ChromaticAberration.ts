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
uniform float u_radial;
uniform vec2 u_direction;

void main() {
  vec2 uv = v_uv;
  vec2 center = vec2(0.5);

  // Calculate offset direction
  vec2 dir;
  if (u_radial > 0.5) {
    // Radial aberration - offset based on distance from center
    dir = normalize(uv - center) * length(uv - center);
  } else {
    // Directional aberration
    dir = u_direction;
  }

  vec2 offset = dir * u_strength * 0.02;

  // Sample RGB channels with offset
  float r = texture(u_texture, uv + offset).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv - offset).b;
  float a = texture(u_texture, uv).a;

  fragColor = vec4(r, g, b, a);
}
`;

class ChromaticAberrationEffect extends BaseEffect {
  id = 'chromaticAberration';
  name = 'Chromatic Aberration';

  controls: ControlDefinition[] = [
    { name: 'strength', type: 'float', label: 'Strength', defaultValue: 0.5, min: 0.0, max: 3.0, step: 0.01 },
    { name: 'radial', type: 'float', label: 'Radial', defaultValue: 1.0, min: 0.0, max: 1.0, step: 1.0 },
    { name: 'directionX', type: 'float', label: 'Direction X', defaultValue: 1.0, min: -1.0, max: 1.0, step: 0.01 },
    { name: 'directionY', type: 'float', label: 'Direction Y', defaultValue: 0.0, min: -1.0, max: 1.0, step: 0.01 },
  ];

  private strength = 0.5;
  private radial = 1.0;
  private directionX = 1.0;
  private directionY = 0.0;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['strength', 'radial', 'direction'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1f(this.uniforms.strength, this.strength);
    gl.uniform1f(this.uniforms.radial, this.radial);
    gl.uniform2f(this.uniforms.direction, this.directionX, this.directionY);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'strength' && typeof value === 'number') this.strength = value;
    else if (name === 'radial' && typeof value === 'number') this.radial = value;
    else if (name === 'directionX' && typeof value === 'number') this.directionX = value;
    else if (name === 'directionY' && typeof value === 'number') this.directionY = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'strength') return this.strength;
    if (name === 'radial') return this.radial;
    if (name === 'directionX') return this.directionX;
    if (name === 'directionY') return this.directionY;
    return undefined;
  }
}

export const chromaticAberrationFactory: EffectFactory = {
  id: 'chromaticAberration',
  name: 'Chromatic Aberration',
  create: () => new ChromaticAberrationEffect(),
};
