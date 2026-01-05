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
uniform float u_octaves;
uniform float u_persistence;
uniform float u_lacunarity;
uniform float u_contrast;
uniform int u_mode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_resolution;

// Classic Perlin noise implementation
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  int octaves = int(u_octaves);

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    amplitude *= u_persistence;
    frequency *= u_lacunarity;
  }

  return value;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;
  vec3 pos = vec3(uv * u_scale, t * 0.5);

  float noise = fbm(pos);

  // Normalize to 0-1 range (noise is roughly -1 to 1)
  noise = noise * 0.5 + 0.5;

  // Apply contrast
  noise = pow(noise, u_contrast);

  vec3 color;

  if (u_mode == 0) {
    // Smooth gradient
    color = mix(u_color1, u_color2, noise);
  } else if (u_mode == 1) {
    // Ridged - creates mountain-like ridges
    float ridged = 1.0 - abs(noise * 2.0 - 1.0);
    ridged = pow(ridged, 2.0);
    color = mix(u_color1, u_color2, ridged);
  } else if (u_mode == 2) {
    // Stepped - creates contour lines
    float stepped = floor(noise * 8.0) / 8.0;
    color = mix(u_color1, u_color2, stepped);
  } else {
    // Turbulent - absolute value creates sharp features
    float turb = abs(fbm(pos * 2.0));
    color = mix(u_color1, u_color2, turb);
  }

  fragColor = vec4(color, 1.0);
}
`;

class PerlinNoiseSketch implements Sketch {
  id = 'perlinNoise';
  name = 'Perlin Noise';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 0.3, min: 0.0, max: 2.0 },
    { name: 'scale', type: 'float', label: 'Scale', defaultValue: 3.0, min: 0.5, max: 10.0 },
    { name: 'octaves', type: 'integer', label: 'Octaves', defaultValue: 5, min: 1, max: 8 },
    { name: 'persistence', type: 'float', label: 'Persistence', defaultValue: 0.5, min: 0.1, max: 0.9 },
    { name: 'lacunarity', type: 'float', label: 'Lacunarity', defaultValue: 2.0, min: 1.5, max: 3.0 },
    { name: 'contrast', type: 'float', label: 'Contrast', defaultValue: 1.0, min: 0.5, max: 3.0 },
    { name: 'mode', type: 'integer', label: 'Mode', defaultValue: 0, min: 0, max: 3 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#1a1a2e' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#eaf6ff' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 0.3;
  private scale = 3.0;
  private octaves = 5;
  private persistence = 0.5;
  private lacunarity = 2.0;
  private contrast = 1.0;
  private mode = 0;
  private color1: [number, number, number] = [0.1, 0.1, 0.18];
  private color2: [number, number, number] = [0.92, 0.96, 1.0];

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
      octaves: gl.getUniformLocation(this.program, 'u_octaves')!,
      persistence: gl.getUniformLocation(this.program, 'u_persistence')!,
      lacunarity: gl.getUniformLocation(this.program, 'u_lacunarity')!,
      contrast: gl.getUniformLocation(this.program, 'u_contrast')!,
      mode: gl.getUniformLocation(this.program, 'u_mode')!,
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

    gl.uniform1f(this.uniforms.time, time);
    gl.uniform1f(this.uniforms.speed, this.speed);
    gl.uniform1f(this.uniforms.scale, this.scale);
    gl.uniform1f(this.uniforms.octaves, this.octaves);
    gl.uniform1f(this.uniforms.persistence, this.persistence);
    gl.uniform1f(this.uniforms.lacunarity, this.lacunarity);
    gl.uniform1f(this.uniforms.contrast, this.contrast);
    gl.uniform1i(this.uniforms.mode, this.mode);
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
    else if (name === 'scale' && typeof value === 'number') this.scale = value;
    else if (name === 'octaves' && typeof value === 'number') this.octaves = value;
    else if (name === 'persistence' && typeof value === 'number') this.persistence = value;
    else if (name === 'lacunarity' && typeof value === 'number') this.lacunarity = value;
    else if (name === 'contrast' && typeof value === 'number') this.contrast = value;
    else if (name === 'mode' && typeof value === 'number') this.mode = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'scale') return this.scale;
    if (name === 'octaves') return this.octaves;
    if (name === 'persistence') return this.persistence;
    if (name === 'lacunarity') return this.lacunarity;
    if (name === 'contrast') return this.contrast;
    if (name === 'mode') return this.mode;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    return undefined;
  }
}

export const perlinNoiseFactory: SketchFactory = {
  id: 'perlinNoise',
  name: 'Perlin Noise',
  type: 'shader',
  create: () => new PerlinNoiseSketch(),
};
