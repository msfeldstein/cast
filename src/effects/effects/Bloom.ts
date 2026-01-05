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
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
uniform int u_samples;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 original = texture(u_texture, v_uv);

  // Blur for bloom (kawase-style blur approximation)
  vec4 bloom = vec4(0.0);
  float total = 0.0;

  for (int x = -4; x <= 4; x++) {
    for (int y = -4; y <= 4; y++) {
      if (abs(x) + abs(y) > u_samples) continue;

      vec2 offset = vec2(float(x), float(y)) * texelSize * u_radius;
      vec4 sample_color = texture(u_texture, v_uv + offset);

      // Extract bright parts
      float brightness = dot(sample_color.rgb, vec3(0.2126, 0.7152, 0.0722));
      float contribution = max(brightness - u_threshold, 0.0);

      // Weight by distance
      float weight = 1.0 / (1.0 + float(abs(x) + abs(y)));

      bloom += sample_color * contribution * weight;
      total += weight * contribution;
    }
  }

  if (total > 0.0) {
    bloom /= total;
  }

  // Combine original with bloom
  vec3 result = original.rgb + bloom.rgb * u_intensity;

  fragColor = vec4(result, original.a);
}
`;

class BloomEffect extends BaseEffect {
  id = 'bloom';
  name = 'Bloom';

  controls: ControlDefinition[] = [
    { name: 'threshold', type: 'float', label: 'Threshold', defaultValue: 0.5, min: 0.0, max: 1.0, step: 0.01 },
    { name: 'intensity', type: 'float', label: 'Intensity', defaultValue: 0.5, min: 0.0, max: 2.0, step: 0.01 },
    { name: 'radius', type: 'float', label: 'Radius', defaultValue: 3.0, min: 1.0, max: 10.0, step: 0.1 },
    { name: 'samples', type: 'integer', label: 'Quality', defaultValue: 4, min: 2, max: 8 },
  ];

  private threshold = 0.5;
  private intensity = 0.5;
  private radius = 3.0;
  private samples = 4;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['threshold', 'intensity', 'radius', 'samples'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1f(this.uniforms.threshold, this.threshold);
    gl.uniform1f(this.uniforms.intensity, this.intensity);
    gl.uniform1f(this.uniforms.radius, this.radius);
    gl.uniform1i(this.uniforms.samples, this.samples);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'threshold' && typeof value === 'number') this.threshold = value;
    else if (name === 'intensity' && typeof value === 'number') this.intensity = value;
    else if (name === 'radius' && typeof value === 'number') this.radius = value;
    else if (name === 'samples' && typeof value === 'number') this.samples = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'threshold') return this.threshold;
    if (name === 'intensity') return this.intensity;
    if (name === 'radius') return this.radius;
    if (name === 'samples') return this.samples;
    return undefined;
  }
}

export const bloomFactory: EffectFactory = {
  id: 'bloom',
  name: 'Bloom',
  create: () => new BloomEffect(),
};
