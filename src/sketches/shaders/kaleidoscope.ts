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
uniform float u_segments;
uniform float u_zoom;
uniform float u_rotation;
uniform float u_complexity;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec2 u_resolution;

#define PI 3.14159265359
#define TAU 6.28318530718

// Smooth minimum for blending shapes
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// 2D rotation matrix
mat2 rot2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Star/flower petal shape
float sdStar(vec2 p, float r, int n, float m) {
  float an = PI / float(n);
  float en = PI / m;
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));

  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
  return length(p) * sign(p.x);
}

// Hexagon SDF
float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

// Diamond/rhombus
float sdRhombus(vec2 p, vec2 b) {
  p = abs(p);
  float h = clamp((-2.0 * dot(p, b) + dot(b, b)) / dot(b, b), -1.0, 1.0);
  float d = length(p - 0.5 * b * vec2(1.0 - h, 1.0 + h));
  return d * sign(p.x * b.y + p.y * b.x - b.x * b.y);
}

void main() {
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Convert to polar coordinates
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);

  // Apply rotation
  angle += t * u_rotation;

  // Kaleidoscope fold - mirror around segment edges
  float segmentAngle = TAU / u_segments;
  angle = mod(angle, segmentAngle);
  if (angle > segmentAngle * 0.5) {
    angle = segmentAngle - angle;
  }

  // Back to cartesian with zoom
  vec2 kUv = vec2(cos(angle), sin(angle)) * radius * u_zoom;

  // Animated offset for movement
  vec2 offset = vec2(sin(t * 0.3) * 0.2, cos(t * 0.4) * 0.2);
  kUv += offset;

  // Create multiple crystalline shapes at different positions
  float shapes = 1.0;

  // Central flower/star
  float star1 = sdStar(kUv * rot2(t * 0.2), 0.15, 6, 2.5);
  shapes = min(shapes, star1);

  // Rotating hexagons
  vec2 hex1Pos = kUv - vec2(0.25, 0.1);
  float hex1 = sdHexagon(hex1Pos * rot2(-t * 0.3), 0.08);
  shapes = smin(shapes, hex1, 0.05);

  vec2 hex2Pos = kUv - vec2(-0.15, 0.25);
  float hex2 = sdHexagon(hex2Pos * rot2(t * 0.25), 0.06);
  shapes = smin(shapes, hex2, 0.05);

  // Diamond gems
  vec2 dia1Pos = kUv - vec2(0.1, -0.2);
  float dia1 = sdRhombus(dia1Pos * rot2(t * 0.4), vec2(0.06, 0.1));
  shapes = smin(shapes, dia1, 0.03);

  vec2 dia2Pos = kUv - vec2(-0.25, -0.1);
  float dia2 = sdRhombus(dia2Pos * rot2(-t * 0.35), vec2(0.05, 0.08));
  shapes = smin(shapes, dia2, 0.03);

  // Small accent stars
  vec2 star2Pos = kUv - vec2(0.3, 0.2);
  float star2 = sdStar(star2Pos * rot2(t * 0.5), 0.04, 5, 3.0);
  shapes = smin(shapes, star2, 0.02);

  // Concentric rings
  float rings = abs(radius * 4.0 - floor(radius * 4.0 + 0.5 + sin(t) * 0.2)) - 0.02;

  // Radial lines from center
  float radialAngle = mod(angle * u_segments, PI / 3.0);
  float radials = abs(sin(radialAngle * 6.0)) * 0.1 - 0.03;

  // Color based on distance to shapes
  vec3 color = u_color3 * 0.1; // Dark background

  // Shape fill with gradient
  if (shapes < 0.0) {
    float depth = -shapes;
    // Create faceted gem look with sharp color bands
    float band = floor(depth * u_complexity * 20.0);
    float bandFrac = fract(depth * u_complexity * 20.0);

    vec3 bandColor;
    if (mod(band, 3.0) < 1.0) {
      bandColor = mix(u_color1, u_color2, bandFrac);
    } else if (mod(band, 3.0) < 2.0) {
      bandColor = mix(u_color2, u_color3, bandFrac);
    } else {
      bandColor = mix(u_color3, u_color1, bandFrac);
    }

    // Add specular-like highlights
    float highlight = pow(1.0 - depth * 5.0, 3.0);
    bandColor += vec3(highlight * 0.5);

    color = bandColor;
  }

  // Shape edges - bright outlines
  float edgeDist = abs(shapes);
  if (edgeDist < 0.015) {
    float edgeIntensity = 1.0 - edgeDist / 0.015;
    color = mix(color, vec3(1.0), edgeIntensity * 0.8);
  }

  // Ring overlay
  if (rings < 0.01 && radius > 0.05) {
    float ringIntensity = 1.0 - rings / 0.01;
    vec3 ringColor = mix(u_color1, u_color2, sin(radius * 10.0 + t) * 0.5 + 0.5);
    color = mix(color, ringColor, ringIntensity * 0.4);
  }

  // Center glow
  float glow = exp(-radius * 6.0);
  color += u_color2 * glow * 0.5;

  // Sparkle effect
  float sparkle = sin(angle * u_segments * 2.0 + t * 3.0) * sin(radius * 20.0 - t * 5.0);
  sparkle = pow(max(sparkle, 0.0), 8.0);
  color += vec3(sparkle * 0.3);

  // Soft vignette
  float vignette = 1.0 - pow(radius * 1.2, 2.0);
  color *= max(vignette, 0.3);

  fragColor = vec4(color, 1.0);
}
`;

class KaleidoscopeSketch implements Sketch {
  id = 'kaleidoscope';
  name = 'Kaleidoscope';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 0.5, min: 0.0, max: 2.0 },
    { name: 'segments', type: 'integer', label: 'Segments', defaultValue: 6, min: 3, max: 16 },
    { name: 'zoom', type: 'float', label: 'Zoom', defaultValue: 3.0, min: 1.0, max: 10.0 },
    { name: 'rotation', type: 'float', label: 'Rotation', defaultValue: 0.2, min: -1.0, max: 1.0 },
    { name: 'complexity', type: 'float', label: 'Complexity', defaultValue: 3.0, min: 1.0, max: 8.0 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#ff3366' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#33ccff' },
    { name: 'color3', type: 'color', label: 'Color 3', defaultValue: '#ffcc00' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 0.5;
  private segments = 6;
  private zoom = 3.0;
  private rotation = 0.2;
  private complexity = 3.0;
  private color1: [number, number, number] = [1, 0.2, 0.4];
  private color2: [number, number, number] = [0.2, 0.8, 1];
  private color3: [number, number, number] = [1, 0.8, 0];

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
      segments: gl.getUniformLocation(this.program, 'u_segments')!,
      zoom: gl.getUniformLocation(this.program, 'u_zoom')!,
      rotation: gl.getUniformLocation(this.program, 'u_rotation')!,
      complexity: gl.getUniformLocation(this.program, 'u_complexity')!,
      color1: gl.getUniformLocation(this.program, 'u_color1')!,
      color2: gl.getUniformLocation(this.program, 'u_color2')!,
      color3: gl.getUniformLocation(this.program, 'u_color3')!,
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
    gl.uniform1f(this.uniforms.segments, this.segments);
    gl.uniform1f(this.uniforms.zoom, this.zoom);
    gl.uniform1f(this.uniforms.rotation, this.rotation);
    gl.uniform1f(this.uniforms.complexity, this.complexity);
    gl.uniform3fv(this.uniforms.color1, this.color1);
    gl.uniform3fv(this.uniforms.color2, this.color2);
    gl.uniform3fv(this.uniforms.color3, this.color3);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'speed' && typeof value === 'number') this.speed = value;
    else if (name === 'segments' && typeof value === 'number') this.segments = value;
    else if (name === 'zoom' && typeof value === 'number') this.zoom = value;
    else if (name === 'rotation' && typeof value === 'number') this.rotation = value;
    else if (name === 'complexity' && typeof value === 'number') this.complexity = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
    else if (name === 'color3' && typeof value === 'string') this.color3 = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'segments') return this.segments;
    if (name === 'zoom') return this.zoom;
    if (name === 'rotation') return this.rotation;
    if (name === 'complexity') return this.complexity;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    if (name === 'color3') return rgbToHex(...this.color3);
    return undefined;
  }
}

export const kaleidoscopeFactory: SketchFactory = {
  id: 'kaleidoscope',
  name: 'Kaleidoscope',
  type: 'shader',
  create: () => new KaleidoscopeSketch(),
};
