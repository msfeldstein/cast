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
uniform float u_saturation;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_hueShift;
uniform vec3 u_tint;
uniform float u_tintAmount;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 texColor = texture(u_texture, v_uv);
  vec3 color = texColor.rgb;

  // Convert to HSV for hue/saturation adjustments
  vec3 hsv = rgb2hsv(color);

  // Hue shift
  hsv.x = fract(hsv.x + u_hueShift);

  // Saturation
  hsv.y *= u_saturation;

  // Convert back to RGB
  color = hsv2rgb(hsv);

  // Brightness
  color *= u_brightness;

  // Contrast
  color = (color - 0.5) * u_contrast + 0.5;

  // Tint
  color = mix(color, color * u_tint, u_tintAmount);

  // Clamp
  color = clamp(color, 0.0, 1.0);

  fragColor = vec4(color, texColor.a);
}
`;

class ColorAdjustEffect extends BaseEffect {
  id = 'colorAdjust';
  name = 'Color Adjust';

  controls: ControlDefinition[] = [
    { name: 'saturation', type: 'float', label: 'Saturation', defaultValue: 1.0, min: 0.0, max: 2.0, step: 0.01 },
    { name: 'brightness', type: 'float', label: 'Brightness', defaultValue: 1.0, min: 0.0, max: 2.0, step: 0.01 },
    { name: 'contrast', type: 'float', label: 'Contrast', defaultValue: 1.0, min: 0.5, max: 2.0, step: 0.01 },
    { name: 'hueShift', type: 'float', label: 'Hue Shift', defaultValue: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    { name: 'tint', type: 'color', label: 'Tint', defaultValue: '#ffffff' },
    { name: 'tintAmount', type: 'float', label: 'Tint Amount', defaultValue: 0.0, min: 0.0, max: 1.0, step: 0.01 },
  ];

  private saturation = 1.0;
  private brightness = 1.0;
  private contrast = 1.0;
  private hueShift = 0.0;
  private tint: [number, number, number] = [1, 1, 1];
  private tintAmount = 0.0;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['saturation', 'brightness', 'contrast', 'hueShift', 'tint', 'tintAmount'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1f(this.uniforms.saturation, this.saturation);
    gl.uniform1f(this.uniforms.brightness, this.brightness);
    gl.uniform1f(this.uniforms.contrast, this.contrast);
    gl.uniform1f(this.uniforms.hueShift, this.hueShift);
    gl.uniform3fv(this.uniforms.tint, this.tint);
    gl.uniform1f(this.uniforms.tintAmount, this.tintAmount);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'saturation' && typeof value === 'number') this.saturation = value;
    else if (name === 'brightness' && typeof value === 'number') this.brightness = value;
    else if (name === 'contrast' && typeof value === 'number') this.contrast = value;
    else if (name === 'hueShift' && typeof value === 'number') this.hueShift = value;
    else if (name === 'tint' && typeof value === 'string') this.tint = hexToRgb(value);
    else if (name === 'tintAmount' && typeof value === 'number') this.tintAmount = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'saturation') return this.saturation;
    if (name === 'brightness') return this.brightness;
    if (name === 'contrast') return this.contrast;
    if (name === 'hueShift') return this.hueShift;
    if (name === 'tint') return rgbToHex(...this.tint);
    if (name === 'tintAmount') return this.tintAmount;
    return undefined;
  }
}

export const colorAdjustFactory: EffectFactory = {
  id: 'colorAdjust',
  name: 'Color Adjust',
  create: () => new ColorAdjustEffect(),
};
