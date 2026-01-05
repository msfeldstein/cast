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
uniform float u_intensity;
uniform float u_spread;
uniform float u_turbulence;
uniform vec3 u_colorInner;
uniform vec3 u_colorMid;
uniform vec3 u_colorOuter;
uniform vec2 u_resolution;

// Simplex-like noise
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

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Distance from center
  float dist = length(uv);

  // Create turbulent displacement
  vec2 noiseCoord = uv * u_scale;
  float noise1 = fbm(noiseCoord + vec2(t * 0.3, t * 0.2), 5);
  float noise2 = fbm(noiseCoord * 1.5 + vec2(-t * 0.2, t * 0.4) + noise1 * u_turbulence, 4);

  // Displace the distance field with noise
  float blobDist = dist - noise1 * u_spread * 0.3 - noise2 * u_spread * 0.2;

  // Core flame shape - inverse distance, clamped
  float flame = 1.0 - smoothstep(0.0, u_spread, blobDist);
  flame = pow(flame, 1.5);

  // Add flickering at edges
  float flicker = snoise(vec2(t * 3.0, dist * 10.0)) * 0.1;
  flame += flicker * flame;

  // Intensity boost
  flame *= u_intensity;
  flame = clamp(flame, 0.0, 1.0);

  // Color gradient based on intensity
  vec3 color;
  if (flame > 0.7) {
    color = mix(u_colorMid, u_colorInner, (flame - 0.7) / 0.3);
  } else if (flame > 0.3) {
    color = mix(u_colorOuter, u_colorMid, (flame - 0.3) / 0.4);
  } else {
    color = u_colorOuter * (flame / 0.3);
  }

  // Add glow
  float glow = exp(-dist * 3.0) * u_intensity * 0.3;
  color += u_colorOuter * glow;

  fragColor = vec4(color, 1.0);
}
`;

class FireBlobSketch implements Sketch {
  id = 'fireBlob';
  name = 'Fire Blob';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 1.0, min: 0.1, max: 3.0 },
    { name: 'scale', type: 'float', label: 'Scale', defaultValue: 3.0, min: 1.0, max: 8.0 },
    { name: 'intensity', type: 'float', label: 'Intensity', defaultValue: 1.5, min: 0.5, max: 3.0 },
    { name: 'spread', type: 'float', label: 'Spread', defaultValue: 0.6, min: 0.2, max: 1.5 },
    { name: 'turbulence', type: 'float', label: 'Turbulence', defaultValue: 1.0, min: 0.0, max: 3.0 },
    { name: 'colorInner', type: 'color', label: 'Inner', defaultValue: '#ffffcc' },
    { name: 'colorMid', type: 'color', label: 'Middle', defaultValue: '#ff6600' },
    { name: 'colorOuter', type: 'color', label: 'Outer', defaultValue: '#cc0000' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 1.0;
  private scale = 3.0;
  private intensity = 1.5;
  private spread = 0.6;
  private turbulence = 1.0;
  private colorInner: [number, number, number] = [1, 1, 0.8];
  private colorMid: [number, number, number] = [1, 0.4, 0];
  private colorOuter: [number, number, number] = [0.8, 0, 0];

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
      scale: gl.getUniformLocation(this.program, 'u_scale')!,
      intensity: gl.getUniformLocation(this.program, 'u_intensity')!,
      spread: gl.getUniformLocation(this.program, 'u_spread')!,
      turbulence: gl.getUniformLocation(this.program, 'u_turbulence')!,
      colorInner: gl.getUniformLocation(this.program, 'u_colorInner')!,
      colorMid: gl.getUniformLocation(this.program, 'u_colorMid')!,
      colorOuter: gl.getUniformLocation(this.program, 'u_colorOuter')!,
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
    gl.uniform1f(this.uniforms.scale, this.scale);
    gl.uniform1f(this.uniforms.intensity, this.intensity);
    gl.uniform1f(this.uniforms.spread, this.spread);
    gl.uniform1f(this.uniforms.turbulence, this.turbulence);
    gl.uniform3fv(this.uniforms.colorInner, this.colorInner);
    gl.uniform3fv(this.uniforms.colorMid, this.colorMid);
    gl.uniform3fv(this.uniforms.colorOuter, this.colorOuter);
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
    else if (name === 'intensity' && typeof value === 'number') this.intensity = value;
    else if (name === 'spread' && typeof value === 'number') this.spread = value;
    else if (name === 'turbulence' && typeof value === 'number') this.turbulence = value;
    else if (name === 'colorInner' && typeof value === 'string') this.colorInner = hexToRgb(value);
    else if (name === 'colorMid' && typeof value === 'string') this.colorMid = hexToRgb(value);
    else if (name === 'colorOuter' && typeof value === 'string') this.colorOuter = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'scale') return this.scale;
    if (name === 'intensity') return this.intensity;
    if (name === 'spread') return this.spread;
    if (name === 'turbulence') return this.turbulence;
    if (name === 'colorInner') return rgbToHex(...this.colorInner);
    if (name === 'colorMid') return rgbToHex(...this.colorMid);
    if (name === 'colorOuter') return rgbToHex(...this.colorOuter);
    return undefined;
  }
}

export const fireBlobFactory: SketchFactory = {
  id: 'fireBlob',
  name: 'Fire Blob',
  type: 'shader',
  create: () => new FireBlobSketch(),
};
