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
uniform float u_scale;
uniform float u_edgeWidth;
uniform float u_jitter;
uniform int u_mode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_edgeColor;
uniform vec2 u_resolution;

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;
  vec2 pos = uv * u_scale;

  // Cell coordinates
  vec2 cellId = floor(pos);
  vec2 cellUv = fract(pos);

  float minDist = 10.0;
  float secondMinDist = 10.0;
  vec2 closestCell = vec2(0.0);

  // Check 3x3 neighborhood
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 neighborCell = cellId + neighbor;

      // Random point in neighbor cell with animation
      vec2 randomOffset = hash2(neighborCell);
      vec2 animatedOffset = sin(t + 6.2831 * randomOffset) * 0.5 + 0.5;
      vec2 point = neighbor + mix(vec2(0.5), animatedOffset, u_jitter);

      // Distance to point
      float dist = length(cellUv - point);

      // Track closest and second closest
      if (dist < minDist) {
        secondMinDist = minDist;
        minDist = dist;
        closestCell = neighborCell;
      } else if (dist < secondMinDist) {
        secondMinDist = dist;
      }
    }
  }

  vec3 color;

  if (u_mode == 0) {
    // Distance field - gradient from center
    float value = minDist;
    color = mix(u_color1, u_color2, value);

    // Add edges
    float edge = smoothstep(0.0, u_edgeWidth, secondMinDist - minDist);
    color = mix(u_edgeColor, color, edge);

  } else if (u_mode == 1) {
    // Cell colors based on ID
    vec3 cellColor = vec3(hash2(closestCell), fract(closestCell.x * 0.1 + closestCell.y * 0.2 + t * 0.1));
    color = mix(u_color1, u_color2, cellColor.x);

    // Add edges
    float edge = smoothstep(0.0, u_edgeWidth, secondMinDist - minDist);
    color = mix(u_edgeColor, color, edge);

  } else if (u_mode == 2) {
    // Edges only (like cell membrane)
    float edge = 1.0 - smoothstep(0.0, u_edgeWidth, secondMinDist - minDist);
    color = mix(u_color1, u_edgeColor, edge);

  } else {
    // Cracked - dark cracks with noise
    float edge = smoothstep(0.0, u_edgeWidth * 0.5, secondMinDist - minDist);
    float noise = fract(sin(dot(closestCell, vec2(12.9898, 78.233))) * 43758.5453);
    color = mix(u_color1, u_color2, noise * 0.3 + 0.7);
    color = mix(u_edgeColor, color, edge);
  }

  fragColor = vec4(color, 1.0);
}
`;

class VoronoiSketch implements Sketch {
  id = 'voronoi';
  name = 'Voronoi';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 0.3, min: 0.0, max: 2.0 },
    { name: 'scale', type: 'float', label: 'Scale', defaultValue: 6.0, min: 2.0, max: 20.0 },
    { name: 'edgeWidth', type: 'float', label: 'Edge Width', defaultValue: 0.05, min: 0.01, max: 0.3 },
    { name: 'jitter', type: 'float', label: 'Jitter', defaultValue: 0.4, min: 0.0, max: 1.0 },
    { name: 'mode', type: 'integer', label: 'Mode', defaultValue: 0, min: 0, max: 3 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#1a1a2e' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#4a9eff' },
    { name: 'edgeColor', type: 'color', label: 'Edge', defaultValue: '#ffffff' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 0.3;
  private scale = 6.0;
  private edgeWidth = 0.05;
  private jitter = 0.4;
  private mode = 0;
  private color1: [number, number, number] = [0.1, 0.1, 0.18];
  private color2: [number, number, number] = [0.29, 0.62, 1.0];
  private edgeColor: [number, number, number] = [1, 1, 1];

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
      scale: gl.getUniformLocation(this.program, 'u_scale')!,
      edgeWidth: gl.getUniformLocation(this.program, 'u_edgeWidth')!,
      jitter: gl.getUniformLocation(this.program, 'u_jitter')!,
      mode: gl.getUniformLocation(this.program, 'u_mode')!,
      color1: gl.getUniformLocation(this.program, 'u_color1')!,
      color2: gl.getUniformLocation(this.program, 'u_color2')!,
      edgeColor: gl.getUniformLocation(this.program, 'u_edgeColor')!,
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

    gl.uniform1f(this.uniforms.time, time);
    gl.uniform1f(this.uniforms.speed, this.speed);
    gl.uniform1f(this.uniforms.scale, this.scale);
    gl.uniform1f(this.uniforms.edgeWidth, this.edgeWidth);
    gl.uniform1f(this.uniforms.jitter, this.jitter);
    gl.uniform1i(this.uniforms.mode, this.mode);
    gl.uniform3fv(this.uniforms.color1, this.color1);
    gl.uniform3fv(this.uniforms.color2, this.color2);
    gl.uniform3fv(this.uniforms.edgeColor, this.edgeColor);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'speed' && typeof value === 'number') this.speed = value;
    else if (name === 'scale' && typeof value === 'number') this.scale = value;
    else if (name === 'edgeWidth' && typeof value === 'number') this.edgeWidth = value;
    else if (name === 'jitter' && typeof value === 'number') this.jitter = value;
    else if (name === 'mode' && typeof value === 'number') this.mode = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
    else if (name === 'edgeColor' && typeof value === 'string') this.edgeColor = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'scale') return this.scale;
    if (name === 'edgeWidth') return this.edgeWidth;
    if (name === 'jitter') return this.jitter;
    if (name === 'mode') return this.mode;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    if (name === 'edgeColor') return rgbToHex(...this.edgeColor);
    return undefined;
  }
}

export const voronoiFactory: SketchFactory = {
  id: 'voronoi',
  name: 'Voronoi',
  type: 'shader',
  create: () => new VoronoiSketch(),
};
