import { BaseEffect } from '../BaseEffect';
import { ControlDefinition, ControlValue } from '../../types/sketch';
import { EffectFactory } from '../../types/effect';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 1, 1];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_threshold;
uniform float u_intensity;
uniform float u_mixOriginal;
uniform vec3 u_glowColor;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 original = texture(u_texture, v_uv);

  // Sobel edge detection
  float tl = luminance(texture(u_texture, v_uv + vec2(-1, -1) * texelSize).rgb);
  float t  = luminance(texture(u_texture, v_uv + vec2( 0, -1) * texelSize).rgb);
  float tr = luminance(texture(u_texture, v_uv + vec2( 1, -1) * texelSize).rgb);
  float l  = luminance(texture(u_texture, v_uv + vec2(-1,  0) * texelSize).rgb);
  float r  = luminance(texture(u_texture, v_uv + vec2( 1,  0) * texelSize).rgb);
  float bl = luminance(texture(u_texture, v_uv + vec2(-1,  1) * texelSize).rgb);
  float b  = luminance(texture(u_texture, v_uv + vec2( 0,  1) * texelSize).rgb);
  float br = luminance(texture(u_texture, v_uv + vec2( 1,  1) * texelSize).rgb);

  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

  float edge = sqrt(gx*gx + gy*gy);

  // Apply threshold
  edge = smoothstep(u_threshold, u_threshold + 0.1, edge);

  // Glow color
  vec3 glow = u_glowColor * edge * u_intensity;

  // Mix with original
  vec3 result = mix(glow, original.rgb + glow, u_mixOriginal);

  fragColor = vec4(result, original.a);
}
`;

class EdgeGlowEffect extends BaseEffect {
  id = 'edgeGlow';
  name = 'Edge Glow';

  controls: ControlDefinition[] = [
    { name: 'threshold', type: 'float', label: 'Threshold', defaultValue: 0.1, min: 0.0, max: 0.5, step: 0.01 },
    { name: 'intensity', type: 'float', label: 'Intensity', defaultValue: 1.5, min: 0.0, max: 5.0, step: 0.01 },
    { name: 'mixOriginal', type: 'float', label: 'Mix Original', defaultValue: 0.5, min: 0.0, max: 1.0, step: 0.01 },
    { name: 'glowColor', type: 'color', label: 'Glow Color', defaultValue: '#00ffff' },
  ];

  private threshold = 0.1;
  private intensity = 1.5;
  private mixOriginal = 0.5;
  private glowColor: [number, number, number] = [0, 1, 1];

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['threshold', 'intensity', 'mixOriginal', 'glowColor'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1f(this.uniforms.threshold, this.threshold);
    gl.uniform1f(this.uniforms.intensity, this.intensity);
    gl.uniform1f(this.uniforms.mixOriginal, this.mixOriginal);
    gl.uniform3fv(this.uniforms.glowColor, this.glowColor);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'threshold' && typeof value === 'number') this.threshold = value;
    else if (name === 'intensity' && typeof value === 'number') this.intensity = value;
    else if (name === 'mixOriginal' && typeof value === 'number') this.mixOriginal = value;
    else if (name === 'glowColor' && typeof value === 'string') this.glowColor = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'threshold') return this.threshold;
    if (name === 'intensity') return this.intensity;
    if (name === 'mixOriginal') return this.mixOriginal;
    if (name === 'glowColor') return rgbToHex(...this.glowColor);
    return undefined;
  }
}

export const edgeGlowFactory: EffectFactory = {
  id: 'edgeGlow',
  name: 'Edge Glow',
  create: () => new EdgeGlowEffect(),
};
