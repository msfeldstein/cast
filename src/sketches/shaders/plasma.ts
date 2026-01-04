import { Sketch, SketchFactory, ControlDefinition, ControlValue } from '../../types/sketch';

// Helper to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform vec3 u_color1;
uniform vec3 u_color2;

void main() {
  vec2 uv = v_uv * u_scale;
  float t = u_time * u_speed;

  float v = 0.0;
  v += sin((uv.x + t) * 3.14159);
  v += sin((uv.y + t) * 3.14159);
  v += sin((uv.x + uv.y + t) * 3.14159);
  v += sin(sqrt(uv.x * uv.x + uv.y * uv.y + 1.0) + t);

  v = v * 0.5;

  vec3 color = mix(u_color1, u_color2, sin(v * 3.14159) * 0.5 + 0.5);
  fragColor = vec4(color, 1.0);
}
`;

class PlasmaSketch implements Sketch {
  id = 'plasma';
  name = 'Plasma';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 1.0, min: 0.1, max: 5.0, step: 0.1 },
    { name: 'scale', type: 'float', label: 'Scale', defaultValue: 4.0, min: 1.0, max: 20.0, step: 0.5 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#1a4dcc' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#e63380' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: {
    time: WebGLUniformLocation;
    speed: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    color1: WebGLUniformLocation;
    color2: WebGLUniformLocation;
  };

  private speed = 1.0;
  private scale = 4.0;
  private color1: [number, number, number] = [0.1, 0.3, 0.8];
  private color2: [number, number, number] = [0.9, 0.2, 0.5];

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    // Create shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    this.uniforms = {
      time: gl.getUniformLocation(this.program, 'u_time')!,
      speed: gl.getUniformLocation(this.program, 'u_speed')!,
      scale: gl.getUniformLocation(this.program, 'u_scale')!,
      color1: gl.getUniformLocation(this.program, 'u_color1')!,
      color2: gl.getUniformLocation(this.program, 'u_color2')!,
    };

    // Create VAO
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  render(time: number): void {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.uniform1f(this.uniforms.time, time);
    gl.uniform1f(this.uniforms.speed, this.speed);
    gl.uniform1f(this.uniforms.scale, this.scale);
    gl.uniform3fv(this.uniforms.color1, this.color1);
    gl.uniform3fv(this.uniforms.color2, this.color2);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'speed' && typeof value === 'number') {
      this.speed = value;
    } else if (name === 'scale' && typeof value === 'number') {
      this.scale = value;
    } else if (name === 'color1' && typeof value === 'string') {
      this.color1 = hexToRgb(value);
    } else if (name === 'color2' && typeof value === 'string') {
      this.color2 = hexToRgb(value);
    }
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'scale') return this.scale;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    return undefined;
  }
}

export const plasmaFactory: SketchFactory = {
  id: 'plasma',
  name: 'Plasma',
  type: 'shader',
  create: () => new PlasmaSketch(),
};
