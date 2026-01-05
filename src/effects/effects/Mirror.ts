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
uniform int u_mode;
uniform float u_offset;

void main() {
  vec2 uv = v_uv;

  if (u_mode == 0) {
    // Horizontal mirror (left to right)
    if (uv.x > 0.5 + u_offset * 0.5) {
      uv.x = 1.0 - uv.x + u_offset;
    }
  } else if (u_mode == 1) {
    // Horizontal mirror (right to left)
    if (uv.x < 0.5 - u_offset * 0.5) {
      uv.x = 1.0 - uv.x - u_offset;
    }
  } else if (u_mode == 2) {
    // Vertical mirror (top to bottom)
    if (uv.y > 0.5 + u_offset * 0.5) {
      uv.y = 1.0 - uv.y + u_offset;
    }
  } else if (u_mode == 3) {
    // Vertical mirror (bottom to top)
    if (uv.y < 0.5 - u_offset * 0.5) {
      uv.y = 1.0 - uv.y - u_offset;
    }
  } else {
    // Quad mirror
    if (uv.x > 0.5) uv.x = 1.0 - uv.x;
    if (uv.y > 0.5) uv.y = 1.0 - uv.y;
  }

  fragColor = texture(u_texture, clamp(uv, 0.0, 1.0));
}
`;

class MirrorEffect extends BaseEffect {
  id = 'mirror';
  name = 'Mirror';

  controls: ControlDefinition[] = [
    { name: 'mode', type: 'integer', label: 'Mode', defaultValue: 0, min: 0, max: 4 },
    { name: 'offset', type: 'float', label: 'Offset', defaultValue: 0.0, min: -0.5, max: 0.5, step: 0.01 },
  ];

  private mode = 0;
  private offset = 0.0;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected getUniformNames(): string[] {
    return ['mode', 'offset'];
  }

  protected setUniforms(gl: WebGL2RenderingContext): void {
    gl.uniform1i(this.uniforms.mode, this.mode);
    gl.uniform1f(this.uniforms.offset, this.offset);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'mode' && typeof value === 'number') this.mode = value;
    else if (name === 'offset' && typeof value === 'number') this.offset = value;
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'mode') return this.mode;
    if (name === 'offset') return this.offset;
    return undefined;
  }
}

export const mirrorFactory: EffectFactory = {
  id: 'mirror',
  name: 'Mirror',
  create: () => new MirrorEffect(),
};
