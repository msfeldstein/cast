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
uniform float u_waves;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_thickness;
uniform float u_glow;
uniform int u_mode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_bgColor;
uniform vec2 u_resolution;

#define PI 3.14159265359

float wave(float x, float offset, float freq, float amp, float t) {
  return sin(x * freq + t + offset) * amp;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  vec3 color = u_bgColor;
  float totalGlow = 0.0;

  // Create multiple wave layers
  for (float i = 0.0; i < 8.0; i++) {
    if (i >= u_waves) break;

    float waveOffset = i * PI * 0.5;
    float freqMod = 1.0 + i * 0.3;
    float ampMod = 1.0 - i * 0.08;

    float waveY;

    if (u_mode == 0) {
      // Horizontal waves
      waveY = 0.5 + wave(uv.x, waveOffset, u_frequency * freqMod, u_amplitude * ampMod * 0.2, t);
      float dist = abs(uv.y - waveY);

      // Line
      float line = smoothstep(u_thickness, 0.0, dist);

      // Glow
      float glow = exp(-dist * 20.0 / u_glow) * u_glow;

      float waveColor = i / u_waves;
      vec3 lineColor = mix(u_color1, u_color2, waveColor);

      color += lineColor * (line + glow * 0.5);
      totalGlow += glow;

    } else if (u_mode == 1) {
      // Circular waves
      vec2 center = vec2(0.5 * u_resolution.x / u_resolution.y, 0.5);
      float dist = length(uv - center);
      float angle = atan(uv.y - 0.5, uv.x - center.x);

      float waveR = 0.2 + i * 0.05 + wave(angle, waveOffset, u_frequency * 0.5, u_amplitude * ampMod * 0.05, t);
      float ringDist = abs(dist - waveR);

      float line = smoothstep(u_thickness, 0.0, ringDist);
      float glow = exp(-ringDist * 20.0 / u_glow) * u_glow;

      float waveColor = i / u_waves;
      vec3 lineColor = mix(u_color1, u_color2, waveColor);

      color += lineColor * (line + glow * 0.5);
      totalGlow += glow;

    } else if (u_mode == 2) {
      // Stacked horizontal bars
      float barY = (i + 0.5) / u_waves;
      float waveAmp = wave(uv.x, waveOffset, u_frequency * freqMod, u_amplitude * 0.05, t);

      float barHeight = 0.5 / u_waves;
      float dist = abs(uv.y - barY);
      float bar = smoothstep(barHeight + u_thickness, barHeight, dist);

      // Modulate bar by wave
      bar *= 0.5 + waveAmp * 5.0;
      bar = clamp(bar, 0.0, 1.0);

      float glow = exp(-dist * 10.0 / u_glow) * u_glow * bar;

      float waveColor = i / u_waves;
      vec3 lineColor = mix(u_color1, u_color2, waveColor);

      color += lineColor * (bar * 0.8 + glow * 0.3);
      totalGlow += glow;

    } else {
      // Mirrored waves from center
      float centerY = 0.5;
      float waveVal = wave(uv.x, waveOffset, u_frequency * freqMod, u_amplitude * ampMod * 0.15, t);

      float topY = centerY + abs(waveVal);
      float botY = centerY - abs(waveVal);

      float distTop = abs(uv.y - topY);
      float distBot = abs(uv.y - botY);
      float dist = min(distTop, distBot);

      // Fill between
      float fill = (uv.y < topY && uv.y > botY) ? 1.0 : 0.0;
      fill *= 0.3;

      float line = smoothstep(u_thickness, 0.0, dist);
      float glow = exp(-dist * 15.0 / u_glow) * u_glow;

      float waveColor = i / u_waves;
      vec3 lineColor = mix(u_color1, u_color2, waveColor);

      color += lineColor * (fill + line + glow * 0.4);
      totalGlow += glow;
    }
  }

  // Clamp to prevent oversaturation
  color = clamp(color, 0.0, 1.5);

  fragColor = vec4(color, 1.0);
}
`;

class WaveformSketch implements Sketch {
  id = 'waveform';
  name = 'Waveform';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'speed', type: 'float', label: 'Speed', defaultValue: 1.0, min: 0.0, max: 3.0 },
    { name: 'waves', type: 'integer', label: 'Waves', defaultValue: 5, min: 1, max: 8 },
    { name: 'amplitude', type: 'float', label: 'Amplitude', defaultValue: 1.0, min: 0.1, max: 3.0 },
    { name: 'frequency', type: 'float', label: 'Frequency', defaultValue: 4.0, min: 1.0, max: 15.0 },
    { name: 'thickness', type: 'float', label: 'Thickness', defaultValue: 0.01, min: 0.002, max: 0.05 },
    { name: 'glow', type: 'float', label: 'Glow', defaultValue: 0.5, min: 0.0, max: 2.0 },
    { name: 'mode', type: 'integer', label: 'Mode', defaultValue: 0, min: 0, max: 3 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#ff0066' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#00ccff' },
    { name: 'bgColor', type: 'color', label: 'Background', defaultValue: '#0a0a14' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private speed = 1.0;
  private waves = 5;
  private amplitude = 1.0;
  private frequency = 4.0;
  private thickness = 0.01;
  private glow = 0.5;
  private mode = 0;
  private color1: [number, number, number] = [1, 0, 0.4];
  private color2: [number, number, number] = [0, 0.8, 1];
  private bgColor: [number, number, number] = [0.04, 0.04, 0.08];

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
      waves: gl.getUniformLocation(this.program, 'u_waves')!,
      amplitude: gl.getUniformLocation(this.program, 'u_amplitude')!,
      frequency: gl.getUniformLocation(this.program, 'u_frequency')!,
      thickness: gl.getUniformLocation(this.program, 'u_thickness')!,
      glow: gl.getUniformLocation(this.program, 'u_glow')!,
      mode: gl.getUniformLocation(this.program, 'u_mode')!,
      color1: gl.getUniformLocation(this.program, 'u_color1')!,
      color2: gl.getUniformLocation(this.program, 'u_color2')!,
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
    gl.uniform1f(this.uniforms.speed, this.speed);
    gl.uniform1f(this.uniforms.waves, this.waves);
    gl.uniform1f(this.uniforms.amplitude, this.amplitude);
    gl.uniform1f(this.uniforms.frequency, this.frequency);
    gl.uniform1f(this.uniforms.thickness, this.thickness);
    gl.uniform1f(this.uniforms.glow, this.glow);
    gl.uniform1i(this.uniforms.mode, this.mode);
    gl.uniform3fv(this.uniforms.color1, this.color1);
    gl.uniform3fv(this.uniforms.color2, this.color2);
    gl.uniform3fv(this.uniforms.bgColor, this.bgColor);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
  }

  setControl(name: string, value: ControlValue): void {
    if (name === 'speed' && typeof value === 'number') this.speed = value;
    else if (name === 'waves' && typeof value === 'number') this.waves = value;
    else if (name === 'amplitude' && typeof value === 'number') this.amplitude = value;
    else if (name === 'frequency' && typeof value === 'number') this.frequency = value;
    else if (name === 'thickness' && typeof value === 'number') this.thickness = value;
    else if (name === 'glow' && typeof value === 'number') this.glow = value;
    else if (name === 'mode' && typeof value === 'number') this.mode = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
    else if (name === 'bgColor' && typeof value === 'string') this.bgColor = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'speed') return this.speed;
    if (name === 'waves') return this.waves;
    if (name === 'amplitude') return this.amplitude;
    if (name === 'frequency') return this.frequency;
    if (name === 'thickness') return this.thickness;
    if (name === 'glow') return this.glow;
    if (name === 'mode') return this.mode;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    if (name === 'bgColor') return rgbToHex(...this.bgColor);
    return undefined;
  }
}

export const waveformFactory: SketchFactory = {
  id: 'waveform',
  name: 'Waveform',
  type: 'shader',
  create: () => new WaveformSketch(),
};
