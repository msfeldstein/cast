import { Generation, GenerationFactory, ControlDefinition } from '../../types/generation';

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

class PlasmaGeneration implements Generation {
  id = 'plasma';
  name = 'Plasma';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'number', label: 'Speed', defaultValue: 1.0, min: 0.1, max: 5.0, step: 0.1 },
    { name: 'scale', type: 'number', label: 'Scale', defaultValue: 4.0, min: 1.0, max: 20.0, step: 0.5 },
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
  private color1 = [0.1, 0.3, 0.8];
  private color2 = [0.9, 0.2, 0.5];

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2');
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

  setControl(name: string, value: number | boolean | string): void {
    if (name === 'speed' && typeof value === 'number') {
      this.speed = value;
    } else if (name === 'scale' && typeof value === 'number') {
      this.scale = value;
    }
  }

  getControl(name: string): number | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'scale') return this.scale;
    return undefined;
  }
}

export const plasmaFactory: GenerationFactory = {
  id: 'plasma',
  name: 'Plasma',
  type: 'shader',
  create: () => new PlasmaGeneration(),
};
