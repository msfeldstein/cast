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
uniform float u_scale;
uniform float u_speed;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time * u_speed;

  // Generate noise-based displacement
  vec2 noiseCoord = uv * u_scale;

  float noiseX = snoise(noiseCoord + vec2(t, 0.0));
  float noiseY = snoise(noiseCoord + vec2(0.0, t) + vec2(100.0));

  vec2 displacement = vec2(noiseX, noiseY) * u_strength * 0.1;

  vec2 sampleUv = uv + displacement;

  // Clamp to avoid sampling outside texture
  sampleUv = clamp(sampleUv, 0.0, 1.0);

  fragColor = texture(u_texture, sampleUv);
}
`;

class WobbleEffect extends BaseEffect {
  id = 'wobble';
  name = 'Wobble';

  controls: ControlDefinition[] = [
    { name: 'strength', type: 'float', label: 'Strength', defaultValue: 0.3, min: 0.0, max: 2.0, step: 0.01 },
    { name: 'scale', type: 'float', label: 'Scale', defaultValue: 5.0, min: 1.0, max: 20.0, step: 0.1 },
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 1.0, min: 0.0, max: 5.0, step: 0.01 },
  ];

  private strength = 0.3;
  private scale = 5.0;
  private speed = 1.0;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['strength', 'scale', 'speed'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1f(this.uniforms.strength, this.strength);
    gl.uniform1f(this.uniforms.scale, this.scale);
    gl.uniform1f(this.uniforms.speed, this.speed);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'strength' && typeof value === 'number') this.strength = value;
    else if (name === 'scale' && typeof value === 'number') this.scale = value;
    else if (name === 'speed' && typeof value === 'number') this.speed = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'strength') return this.strength;
    if (name === 'scale') return this.scale;
    if (name === 'speed') return this.speed;
    return undefined;
  }
}

export const wobbleFactory: EffectFactory = {
  id: 'wobble',
  name: 'Wobble',
  create: () => new WobbleEffect(),
};
