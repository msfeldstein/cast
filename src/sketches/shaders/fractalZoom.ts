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
uniform float u_zoom;
uniform float u_iterations;
uniform float u_colorCycles;
uniform int u_fractalType;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec2 u_resolution;
uniform vec2 u_center;

#define PI 3.14159265359

vec3 palette(float t, vec3 a, vec3 b, vec3 c) {
  return a + b * cos(6.28318 * (c * t + vec3(0.0, 0.33, 0.67)));
}

// Mandelbrot iteration
vec2 mandelbrot(vec2 z, vec2 c) {
  return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
}

// Julia iteration
vec2 julia(vec2 z, vec2 c) {
  return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
}

// Burning ship iteration
vec2 burningShip(vec2 z, vec2 c) {
  z = abs(z);
  return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
}

void main() {
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Continuous zoom
  float zoomLevel = exp(mod(t, 20.0) * 0.5) * u_zoom;

  // Zoom toward center point with slight movement
  vec2 center = u_center + vec2(sin(t * 0.1) * 0.01, cos(t * 0.13) * 0.01);

  vec2 c = uv / zoomLevel + center;
  vec2 z = c;

  float iter = 0.0;
  int maxIter = int(u_iterations);

  for (int i = 0; i < 200; i++) {
    if (i >= maxIter) break;

    if (u_fractalType == 0) {
      // Mandelbrot
      z = mandelbrot(z, c);
    } else if (u_fractalType == 1) {
      // Julia set with animated parameter
      vec2 juliaC = vec2(-0.7 + sin(t * 0.2) * 0.1, 0.27 + cos(t * 0.15) * 0.1);
      z = julia(z, juliaC);
    } else {
      // Burning ship
      z = burningShip(z, c);
    }

    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }

  // Smooth iteration count
  float smoothIter = iter;
  if (iter < float(maxIter)) {
    float log_zn = log(dot(z, z)) / 2.0;
    float nu = log(log_zn / log(2.0)) / log(2.0);
    smoothIter = iter + 1.0 - nu;
  }

  // Color based on iteration count
  float colorVal = smoothIter / float(maxIter);
  colorVal = pow(colorVal, 0.5); // Gamma correction
  colorVal *= u_colorCycles;

  vec3 color;
  if (iter >= float(maxIter)) {
    // Inside the set - use dark color
    color = u_color1 * 0.1;
  } else {
    // Outside - create gradient
    color = palette(colorVal + t * 0.1, u_color1, u_color2, u_color3);
  }

  fragColor = vec4(color, 1.0);
}
`;

class FractalZoomSketch implements Sketch {
  id = 'fractalZoom';
  name = 'Fractal Zoom';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Zoom Speed', defaultValue: 0.3, min: 0.0, max: 2.0 },
    { name: 'zoom', type: 'float', label: 'Base Zoom', defaultValue: 1.0, min: 0.1, max: 5.0 },
    { name: 'iterations', type: 'float', label: 'Iterations', defaultValue: 100.0, min: 20.0, max: 200.0, step: 10.0 },
    { name: 'colorCycles', type: 'float', label: 'Color Cycles', defaultValue: 3.0, min: 1.0, max: 10.0 },
    { name: 'fractalType', type: 'integer', label: 'Type (0=Mandelbrot, 1=Julia, 2=BurningShip)', defaultValue: 0, min: 0, max: 2 },
    { name: 'centerX', type: 'float', label: 'Center X', defaultValue: -0.745, min: -2.0, max: 2.0 },
    { name: 'centerY', type: 'float', label: 'Center Y', defaultValue: 0.186, min: -2.0, max: 2.0 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#0a0a20' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#ff6600' },
    { name: 'color3', type: 'color', label: 'Color 3', defaultValue: '#00ffff' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 0.3;
  private zoom = 1.0;
  private iterations = 100.0;
  private colorCycles = 3.0;
  private fractalType = 0;
  private centerX = -0.745;
  private centerY = 0.186;
  private color1: [number, number, number] = [0.04, 0.04, 0.13];
  private color2: [number, number, number] = [1, 0.4, 0];
  private color3: [number, number, number] = [0, 1, 1];

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
      zoom: gl.getUniformLocation(this.program, 'u_zoom')!,
      iterations: gl.getUniformLocation(this.program, 'u_iterations')!,
      colorCycles: gl.getUniformLocation(this.program, 'u_colorCycles')!,
      fractalType: gl.getUniformLocation(this.program, 'u_fractalType')!,
      center: gl.getUniformLocation(this.program, 'u_center')!,
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
    gl.uniform1f(this.uniforms.zoom, this.zoom);
    gl.uniform1f(this.uniforms.iterations, this.iterations);
    gl.uniform1f(this.uniforms.colorCycles, this.colorCycles);
    gl.uniform1i(this.uniforms.fractalType, this.fractalType);
    gl.uniform2f(this.uniforms.center, this.centerX, this.centerY);
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
    else if (name === 'zoom' && typeof value === 'number') this.zoom = value;
    else if (name === 'iterations' && typeof value === 'number') this.iterations = value;
    else if (name === 'colorCycles' && typeof value === 'number') this.colorCycles = value;
    else if (name === 'fractalType' && typeof value === 'number') this.fractalType = value;
    else if (name === 'centerX' && typeof value === 'number') this.centerX = value;
    else if (name === 'centerY' && typeof value === 'number') this.centerY = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
    else if (name === 'color3' && typeof value === 'string') this.color3 = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'zoom') return this.zoom;
    if (name === 'iterations') return this.iterations;
    if (name === 'colorCycles') return this.colorCycles;
    if (name === 'fractalType') return this.fractalType;
    if (name === 'centerX') return this.centerX;
    if (name === 'centerY') return this.centerY;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    if (name === 'color3') return rgbToHex(...this.color3);
    return undefined;
  }
}

export const fractalZoomFactory: SketchFactory = {
  id: 'fractalZoom',
  name: 'Fractal Zoom',
  type: 'shader',
  create: () => new FractalZoomSketch(),
};
