import { Sketch, SketchFactory, ControlDefinition, ControlValue } from '../../types/sketch';

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
uniform float u_gridX;
uniform float u_gridY;
uniform float u_ringCount;
uniform float u_ringWidth;
uniform float u_pulseStrength;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_resolution;

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Create grid
  vec2 gridSize = vec2(u_gridX, u_gridY);
  vec2 cellUv = fract(uv * gridSize) - 0.5;
  vec2 cellId = floor(uv * gridSize);

  // Distance from center of each cell
  float dist = length(cellUv) * 2.0;

  // Phase offset per cell for variety
  float phaseOffset = (cellId.x + cellId.y * 3.14159) * 0.5;

  // Create expanding rings
  float rings = fract(dist * u_ringCount - t + phaseOffset);

  // Sharp ring edges with width control
  float ring = smoothstep(0.0, u_ringWidth, rings) * smoothstep(u_ringWidth * 2.0, u_ringWidth, rings);

  // Pulse effect - rings get brighter as they expand
  float pulse = 1.0 - dist * u_pulseStrength;
  pulse = clamp(pulse, 0.2, 1.0);

  // Fade at cell edges
  float edge = 1.0 - smoothstep(0.4, 0.5, max(abs(cellUv.x), abs(cellUv.y)));

  ring *= edge * pulse;

  vec3 color = mix(u_color1, u_color2, ring);

  fragColor = vec4(color, 1.0);
}
`;

class ConcentricCirclesSketch implements Sketch {
  id = 'concentricCircles';
  name = 'Concentric Circles';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 0.5, min: 0.0, max: 3.0 },
    { name: 'gridX', type: 'integer', label: 'Grid X', defaultValue: 4, min: 1, max: 12 },
    { name: 'gridY', type: 'integer', label: 'Grid Y', defaultValue: 4, min: 1, max: 12 },
    { name: 'ringCount', type: 'float', label: 'Ring Count', defaultValue: 5.0, min: 1.0, max: 15.0 },
    { name: 'ringWidth', type: 'float', label: 'Ring Width', defaultValue: 0.15, min: 0.02, max: 0.4 },
    { name: 'pulseStrength', type: 'float', label: 'Pulse', defaultValue: 0.5, min: 0.0, max: 1.0 },
    { name: 'color1', type: 'color', label: 'Background', defaultValue: '#0a0a1a' },
    { name: 'color2', type: 'color', label: 'Rings', defaultValue: '#00ffaa' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 0.5;
  private gridX = 4;
  private gridY = 4;
  private ringCount = 5.0;
  private ringWidth = 0.15;
  private pulseStrength = 0.5;
  private color1: [number, number, number] = [0.04, 0.04, 0.1];
  private color2: [number, number, number] = [0, 1, 0.67];

  private accumulatedTime = 0;
  private lastRenderTime = 0;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
    }

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    this.uniforms = {
      time: gl.getUniformLocation(this.program, 'u_time')!,
      speed: gl.getUniformLocation(this.program, 'u_speed')!,
      gridX: gl.getUniformLocation(this.program, 'u_gridX')!,
      gridY: gl.getUniformLocation(this.program, 'u_gridY')!,
      ringCount: gl.getUniformLocation(this.program, 'u_ringCount')!,
      ringWidth: gl.getUniformLocation(this.program, 'u_ringWidth')!,
      pulseStrength: gl.getUniformLocation(this.program, 'u_pulseStrength')!,
      color1: gl.getUniformLocation(this.program, 'u_color1')!,
      color2: gl.getUniformLocation(this.program, 'u_color2')!,
      resolution: gl.getUniformLocation(this.program, 'u_resolution')!,
    };

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

    // Accumulate time based on speed to avoid jumps when speed changes
    const deltaTime = time - this.lastRenderTime;
    this.accumulatedTime += deltaTime * this.speed;
    this.lastRenderTime = time;

    gl.uniform1f(this.uniforms.time, this.accumulatedTime);
    gl.uniform1f(this.uniforms.speed, 1.0); // Speed is now baked into accumulated time
    gl.uniform1f(this.uniforms.gridX, this.gridX);
    gl.uniform1f(this.uniforms.gridY, this.gridY);
    gl.uniform1f(this.uniforms.ringCount, this.ringCount);
    gl.uniform1f(this.uniforms.ringWidth, this.ringWidth);
    gl.uniform1f(this.uniforms.pulseStrength, this.pulseStrength);
    gl.uniform3fv(this.uniforms.color1, this.color1);
    gl.uniform3fv(this.uniforms.color2, this.color2);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'speed' && typeof value === 'number') this.speed = value;
    else if (name === 'gridX' && typeof value === 'number') this.gridX = value;
    else if (name === 'gridY' && typeof value === 'number') this.gridY = value;
    else if (name === 'ringCount' && typeof value === 'number') this.ringCount = value;
    else if (name === 'ringWidth' && typeof value === 'number') this.ringWidth = value;
    else if (name === 'pulseStrength' && typeof value === 'number') this.pulseStrength = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'gridX') return this.gridX;
    if (name === 'gridY') return this.gridY;
    if (name === 'ringCount') return this.ringCount;
    if (name === 'ringWidth') return this.ringWidth;
    if (name === 'pulseStrength') return this.pulseStrength;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    return undefined;
  }
}

export const concentricCirclesFactory: SketchFactory = {
  id: 'concentricCircles',
  name: 'Concentric Circles',
  type: 'shader',
  create: () => new ConcentricCirclesSketch(),
};
