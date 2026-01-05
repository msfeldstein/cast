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
uniform float u_twist;
uniform float u_depth;
uniform float u_ringCount;
uniform float u_wobble;
uniform int u_pattern;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_resolution;

#define PI 3.14159265359
#define TAU 6.28318530718

void main() {
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Distance from center
  float dist = length(uv);

  // Angle around center
  float angle = atan(uv.y, uv.x);

  // Add wobble based on time and angle
  float wobbleAmount = sin(angle * 3.0 + t * 2.0) * u_wobble * 0.1;
  dist += wobbleAmount;

  // Inverse distance for tunnel depth effect
  float depth = u_depth / (dist + 0.01);

  // Twist the tunnel
  float tunnelAngle = angle + depth * u_twist * 0.1;

  // Create texture coordinates
  float texU = tunnelAngle / TAU + 0.5; // 0 to 1 around tunnel
  float texV = fract(depth * 0.1 - t); // scrolling depth

  // Create pattern based on mode
  float pattern;

  if (u_pattern == 0) {
    // Rings
    pattern = sin(depth * u_ringCount - t * 5.0) * 0.5 + 0.5;
  } else if (u_pattern == 1) {
    // Checker
    float checkU = floor(texU * 8.0);
    float checkV = floor(texV * 8.0);
    pattern = mod(checkU + checkV, 2.0);
  } else if (u_pattern == 2) {
    // Spiral
    float spiral = sin(tunnelAngle * 4.0 + depth * 2.0 - t * 3.0) * 0.5 + 0.5;
    pattern = spiral;
  } else if (u_pattern == 3) {
    // Grid lines
    float lineU = smoothstep(0.45, 0.5, abs(fract(texU * 8.0) - 0.5));
    float lineV = smoothstep(0.45, 0.5, abs(fract(texV * 8.0) - 0.5));
    pattern = max(lineU, lineV);
  } else {
    // Hexagon-ish
    float hex1 = sin(tunnelAngle * 6.0 + depth) * 0.5 + 0.5;
    float hex2 = sin(depth * u_ringCount - t * 3.0) * 0.5 + 0.5;
    pattern = hex1 * hex2;
  }

  // Mix colors
  vec3 color = mix(u_color1, u_color2, pattern);

  // Depth fog
  float fog = 1.0 - smoothstep(0.0, 0.5, dist);
  color *= fog;

  // Center glow
  float glow = exp(-dist * 8.0) * 0.5;
  color += mix(u_color2, u_color1, 0.5) * glow;

  // Vignette
  float vignette = 1.0 - smoothstep(0.3, 0.7, dist);
  color *= 0.5 + vignette * 0.5;

  fragColor = vec4(color, 1.0);
}
`;

class TunnelSketch implements Sketch {
  id = 'tunnel';
  name = 'Tunnel';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 0.5, min: 0.0, max: 2.0 },
    { name: 'twist', type: 'float', label: 'Twist', defaultValue: 1.0, min: 0.0, max: 5.0 },
    { name: 'depth', type: 'float', label: 'Depth', defaultValue: 1.0, min: 0.2, max: 3.0 },
    { name: 'ringCount', type: 'float', label: 'Rings', defaultValue: 10.0, min: 2.0, max: 30.0, step: 1.0 },
    { name: 'wobble', type: 'float', label: 'Wobble', defaultValue: 0.3, min: 0.0, max: 2.0 },
    { name: 'pattern', type: 'integer', label: 'Pattern', defaultValue: 0, min: 0, max: 4 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#000033' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#00ffff' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 0.5;
  private twist = 1.0;
  private depth = 1.0;
  private ringCount = 10.0;
  private wobble = 0.3;
  private pattern = 0;
  private color1: [number, number, number] = [0, 0, 0.2];
  private color2: [number, number, number] = [0, 1, 1];

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
      twist: gl.getUniformLocation(this.program, 'u_twist')!,
      depth: gl.getUniformLocation(this.program, 'u_depth')!,
      ringCount: gl.getUniformLocation(this.program, 'u_ringCount')!,
      wobble: gl.getUniformLocation(this.program, 'u_wobble')!,
      pattern: gl.getUniformLocation(this.program, 'u_pattern')!,
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
    gl.uniform1f(this.uniforms.twist, this.twist);
    gl.uniform1f(this.uniforms.depth, this.depth);
    gl.uniform1f(this.uniforms.ringCount, this.ringCount);
    gl.uniform1f(this.uniforms.wobble, this.wobble);
    gl.uniform1i(this.uniforms.pattern, this.pattern);
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
    else if (name === 'twist' && typeof value === 'number') this.twist = value;
    else if (name === 'depth' && typeof value === 'number') this.depth = value;
    else if (name === 'ringCount' && typeof value === 'number') this.ringCount = value;
    else if (name === 'wobble' && typeof value === 'number') this.wobble = value;
    else if (name === 'pattern' && typeof value === 'number') this.pattern = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'twist') return this.twist;
    if (name === 'depth') return this.depth;
    if (name === 'ringCount') return this.ringCount;
    if (name === 'wobble') return this.wobble;
    if (name === 'pattern') return this.pattern;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    return undefined;
  }
}

export const tunnelFactory: SketchFactory = {
  id: 'tunnel',
  name: 'Tunnel',
  type: 'shader',
  create: () => new TunnelSketch(),
};
