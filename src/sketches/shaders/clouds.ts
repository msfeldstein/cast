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
uniform float u_coverage;
uniform float u_softness;
uniform float u_speed;
uniform float u_scale;
uniform float u_layers;
uniform float u_brightness;
uniform vec3 u_skyColor;
uniform vec3 u_cloudColor;
uniform vec2 u_resolution;

// Hash for noise
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Gradient noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// FBM - layered noise for cloud shapes
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float time = u_time * u_speed;
  int octaves = int(u_layers * 5.0) + 3;

  // Layer multiple cloud passes at different speeds/scales
  float clouds = 0.0;

  // Main cloud layer
  vec2 cloudUv1 = uv * u_scale + vec2(time * 0.1, time * 0.05);
  float layer1 = fbm(cloudUv1, octaves);

  // Second layer - slower, larger
  vec2 cloudUv2 = uv * u_scale * 0.5 + vec2(time * 0.05, time * 0.02);
  float layer2 = fbm(cloudUv2, max(octaves - 1, 2));

  // Third layer - detail
  vec2 cloudUv3 = uv * u_scale * 2.0 + vec2(time * 0.15, -time * 0.08);
  float layer3 = fbm(cloudUv3, max(octaves - 2, 2));

  // Combine layers
  clouds = layer1 * 0.5 + layer2 * 0.35 + layer3 * 0.15;

  // Remap to 0-1 range (noise returns roughly -1 to 1)
  clouds = clouds * 0.5 + 0.5;

  // Apply coverage threshold with softness
  float threshold = 1.0 - u_coverage;
  float edge = u_softness * 0.5;
  clouds = smoothstep(threshold - edge, threshold + edge, clouds);

  // Add some variation to cloud brightness
  float brightness = 1.0 - layer3 * 0.2;
  brightness = mix(1.0, brightness, clouds);

  // Mix sky and clouds
  vec3 cloudShaded = u_cloudColor * brightness * u_brightness;
  vec3 color = mix(u_skyColor, cloudShaded, clouds);

  fragColor = vec4(color, 1.0);
}
`;

class CloudsSketch implements Sketch {
  id = 'clouds';
  name = 'Clouds';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'coverage', type: 'float', label: 'Coverage', defaultValue: 0.5, min: 0.0, max: 1.0 },
    { name: 'softness', type: 'float', label: 'Softness', defaultValue: 0.3, min: 0.01, max: 1.0 },
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 0.3, min: 0.0, max: 2.0 },
    { name: 'scale', type: 'float', label: 'Scale', defaultValue: 3.0, min: 0.5, max: 10.0 },
    { name: 'layers', type: 'float', label: 'Detail', defaultValue: 0.5, min: 0.0, max: 1.0 },
    { name: 'brightness', type: 'float', label: 'Brightness', defaultValue: 1.0, min: 0.5, max: 1.5 },
    { name: 'skyColor', type: 'color', label: 'Sky', defaultValue: '#4a90d9' },
    { name: 'cloudColor', type: 'color', label: 'Clouds', defaultValue: '#ffffff' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: {
    time: WebGLUniformLocation;
    coverage: WebGLUniformLocation;
    softness: WebGLUniformLocation;
    speed: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    layers: WebGLUniformLocation;
    brightness: WebGLUniformLocation;
    skyColor: WebGLUniformLocation;
    cloudColor: WebGLUniformLocation;
    resolution: WebGLUniformLocation;
  };

  private coverage = 0.5;
  private softness = 0.3;
  private speed = 0.3;
  private scale = 3.0;
  private layers = 0.5;
  private brightness = 1.0;
  private skyColor: [number, number, number] = [0.29, 0.56, 0.85];
  private cloudColor: [number, number, number] = [1.0, 1.0, 1.0];

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
      coverage: gl.getUniformLocation(this.program, 'u_coverage')!,
      softness: gl.getUniformLocation(this.program, 'u_softness')!,
      speed: gl.getUniformLocation(this.program, 'u_speed')!,
      scale: gl.getUniformLocation(this.program, 'u_scale')!,
      layers: gl.getUniformLocation(this.program, 'u_layers')!,
      brightness: gl.getUniformLocation(this.program, 'u_brightness')!,
      skyColor: gl.getUniformLocation(this.program, 'u_skyColor')!,
      cloudColor: gl.getUniformLocation(this.program, 'u_cloudColor')!,
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
    gl.uniform1f(this.uniforms.coverage, this.coverage);
    gl.uniform1f(this.uniforms.softness, this.softness);
    gl.uniform1f(this.uniforms.speed, this.speed);
    gl.uniform1f(this.uniforms.scale, this.scale);
    gl.uniform1f(this.uniforms.layers, this.layers);
    gl.uniform1f(this.uniforms.brightness, this.brightness);
    gl.uniform3fv(this.uniforms.skyColor, this.skyColor);
    gl.uniform3fv(this.uniforms.cloudColor, this.cloudColor);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'coverage' && typeof value === 'number') {
      this.coverage = value;
    } else if (name === 'softness' && typeof value === 'number') {
      this.softness = value;
    } else if (name === 'speed' && typeof value === 'number') {
      this.speed = value;
    } else if (name === 'scale' && typeof value === 'number') {
      this.scale = value;
    } else if (name === 'layers' && typeof value === 'number') {
      this.layers = value;
    } else if (name === 'brightness' && typeof value === 'number') {
      this.brightness = value;
    } else if (name === 'skyColor' && typeof value === 'string') {
      this.skyColor = hexToRgb(value);
    } else if (name === 'cloudColor' && typeof value === 'string') {
      this.cloudColor = hexToRgb(value);
    }
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'coverage') return this.coverage;
    if (name === 'softness') return this.softness;
    if (name === 'speed') return this.speed;
    if (name === 'scale') return this.scale;
    if (name === 'layers') return this.layers;
    if (name === 'brightness') return this.brightness;
    if (name === 'skyColor') return rgbToHex(...this.skyColor);
    if (name === 'cloudColor') return rgbToHex(...this.cloudColor);
    return undefined;
  }
}

export const cloudsFactory: SketchFactory = {
  id: 'clouds',
  name: 'Clouds',
  type: 'shader',
  create: () => new CloudsSketch(),
};
