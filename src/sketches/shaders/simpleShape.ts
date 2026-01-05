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
uniform float u_rotationSpeed;
uniform float u_size;
uniform float u_strokeWidth;
uniform int u_shape; // 0 = circle, 1 = square, 2 = triangle
uniform int u_filled;
uniform vec3 u_fillColor;
uniform vec3 u_strokeColor;
uniform vec3 u_bgColor;
uniform vec2 u_resolution;

#define PI 3.14159265359

// Rotate point around origin
vec2 rotate(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// SDF for circle
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

// SDF for square (box)
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// SDF for equilateral triangle
float sdTriangle(vec2 p, float r) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) {
    p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  }
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_rotationSpeed;

  // Rotate the coordinate space
  vec2 p = rotate(uv, t);

  // Calculate distance based on shape
  float d;
  if (u_shape == 0) {
    // Circle
    d = sdCircle(p, u_size * 0.4);
  } else if (u_shape == 1) {
    // Square
    d = sdBox(p, vec2(u_size * 0.35));
  } else {
    // Triangle
    d = sdTriangle(p, u_size * 0.4);
  }

  vec3 color = u_bgColor;

  float strokeOuter = u_strokeWidth * 0.02;
  float strokeInner = strokeOuter * 0.5;

  if (u_filled == 1) {
    // Filled shape with stroke
    if (d < 0.0) {
      // Inside shape - fill color
      color = u_fillColor;
    }
    // Add stroke on edge
    float strokeDist = abs(d);
    if (strokeDist < strokeOuter) {
      float strokeAlpha = smoothstep(strokeOuter, strokeInner, strokeDist);
      color = mix(color, u_strokeColor, strokeAlpha);
    }
  } else {
    // Stroke only (no fill)
    float strokeDist = abs(d);
    if (strokeDist < strokeOuter) {
      float strokeAlpha = smoothstep(strokeOuter, strokeInner, strokeDist);
      color = mix(u_bgColor, u_strokeColor, strokeAlpha);
    }
  }

  // Anti-aliasing on outer edge
  float aa = fwidth(d) * 1.5;
  if (d > -aa && d < strokeOuter + aa) {
    float edgeAlpha = 1.0 - smoothstep(-aa, aa, d - strokeOuter);
    if (u_filled == 0) {
      // For stroke-only, also smooth inner edge
      float innerAlpha = smoothstep(-aa, aa, d + strokeOuter);
      edgeAlpha *= innerAlpha;
    }
  }

  fragColor = vec4(color, 1.0);
}
`;

class SimpleShapeSketch implements Sketch {
  id = 'simpleShape';
  name = 'Simple Shape';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'shape', type: 'integer', label: 'Shape (0=Circle, 1=Square, 2=Triangle)', defaultValue: 0, min: 0, max: 2 },
    { name: 'filled', type: 'integer', label: 'Filled (0=No, 1=Yes)', defaultValue: 1, min: 0, max: 1 },
    { name: 'rotationSpeed', type: 'float', label: 'Rotation Speed', defaultValue: 0.3, min: 0.0, max: 3.0 },
    { name: 'size', type: 'float', label: 'Size', defaultValue: 0.8, min: 0.1, max: 1.5 },
    { name: 'strokeWidth', type: 'float', label: 'Stroke Width', defaultValue: 3.0, min: 0.5, max: 10.0 },
    { name: 'fillColor', type: 'color', label: 'Fill Color', defaultValue: '#3366ff' },
    { name: 'strokeColor', type: 'color', label: 'Stroke Color', defaultValue: '#ffffff' },
    { name: 'bgColor', type: 'color', label: 'Background', defaultValue: '#0a0a0a' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private shape = 0;
  private filled = 1;
  private rotationSpeed = 0.3;
  private size = 0.8;
  private strokeWidth = 3.0;
  private fillColor: [number, number, number] = [0.2, 0.4, 1];
  private strokeColor: [number, number, number] = [1, 1, 1];
  private bgColor: [number, number, number] = [0.04, 0.04, 0.04];

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
      rotationSpeed: gl.getUniformLocation(this.program, 'u_rotationSpeed')!,
      size: gl.getUniformLocation(this.program, 'u_size')!,
      strokeWidth: gl.getUniformLocation(this.program, 'u_strokeWidth')!,
      shape: gl.getUniformLocation(this.program, 'u_shape')!,
      filled: gl.getUniformLocation(this.program, 'u_filled')!,
      fillColor: gl.getUniformLocation(this.program, 'u_fillColor')!,
      strokeColor: gl.getUniformLocation(this.program, 'u_strokeColor')!,
      bgColor: gl.getUniformLocation(this.program, 'u_bgColor')!,
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
    gl.uniform1f(this.uniforms.rotationSpeed, this.rotationSpeed);
    gl.uniform1f(this.uniforms.size, this.size);
    gl.uniform1f(this.uniforms.strokeWidth, this.strokeWidth);
    gl.uniform1i(this.uniforms.shape, this.shape);
    gl.uniform1i(this.uniforms.filled, this.filled);
    gl.uniform3fv(this.uniforms.fillColor, this.fillColor);
    gl.uniform3fv(this.uniforms.strokeColor, this.strokeColor);
    gl.uniform3fv(this.uniforms.bgColor, this.bgColor);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'shape' && typeof value === 'number') this.shape = value;
    else if (name === 'filled' && typeof value === 'number') this.filled = value;
    else if (name === 'rotationSpeed' && typeof value === 'number') this.rotationSpeed = value;
    else if (name === 'size' && typeof value === 'number') this.size = value;
    else if (name === 'strokeWidth' && typeof value === 'number') this.strokeWidth = value;
    else if (name === 'fillColor' && typeof value === 'string') this.fillColor = hexToRgb(value);
    else if (name === 'strokeColor' && typeof value === 'string') this.strokeColor = hexToRgb(value);
    else if (name === 'bgColor' && typeof value === 'string') this.bgColor = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'shape') return this.shape;
    if (name === 'filled') return this.filled;
    if (name === 'rotationSpeed') return this.rotationSpeed;
    if (name === 'size') return this.size;
    if (name === 'strokeWidth') return this.strokeWidth;
    if (name === 'fillColor') return rgbToHex(...this.fillColor);
    if (name === 'strokeColor') return rgbToHex(...this.strokeColor);
    if (name === 'bgColor') return rgbToHex(...this.bgColor);
    return undefined;
  }
}

export const simpleShapeFactory: SketchFactory = {
  id: 'simpleShape',
  name: 'Simple Shape',
  type: 'shader',
  create: () => new SimpleShapeSketch(),
};
