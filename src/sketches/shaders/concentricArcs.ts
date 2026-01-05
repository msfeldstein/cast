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
uniform float u_rotationTime;
uniform float u_zoomTime;
uniform float u_zoom;
uniform float u_arcCount;
uniform float u_arcWidth;
uniform float u_gapRatio;
uniform float u_alternateDirection;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_bgColor;
uniform vec2 u_resolution;

#define PI 3.14159265359
#define TAU 6.28318530718

void main() {
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // Use log-polar coordinates for seamless infinite zoom
  // In log-polar, zooming is just a translation
  float logDist = log(dist + 0.001) / log(2.0); // log base 2 of distance

  // Zoom animation - shift through log space (pre-accumulated)
  float zoomPhase = u_zoomTime;

  // Ring calculation in log space - rings expand outward continuously
  float ringPhase = (logDist + zoomPhase) * u_arcCount / u_zoom;
  float ringIndex = floor(ringPhase);
  float ringFrac = fract(ringPhase);

  // Check if we're in an arc (vs gap between rings)
  float arcPortion = 1.0 - u_gapRatio;
  bool inArc = ringFrac < arcPortion;

  // Fade at center and edges
  float centerFade = smoothstep(0.0, 0.05, dist);
  float edgeFade = 1.0 - smoothstep(0.6, 0.8, dist);

  if (!inArc) {
    fragColor = vec4(u_bgColor, 1.0);
    return;
  }

  // Calculate arc width falloff for anti-aliasing
  float arcEdge = smoothstep(0.0, 0.03, ringFrac) * smoothstep(arcPortion, arcPortion - 0.03, ringFrac);

  // Rotation per ring - alternating directions, tied to ring index
  int ring = int(mod(ringIndex, 100.0));
  float rotationDir = u_alternateDirection > 0.5 ? (mod(float(ring), 2.0) == 0.0 ? 1.0 : -1.0) : 1.0;
  float ringRotation = u_rotationTime * rotationDir * (1.0 + mod(float(ring), 5.0) * 0.2);

  // Adjust angle for rotation
  float rotatedAngle = angle + ringRotation;

  // Create arc segments (4 arcs per ring, each covering less than 90 degrees)
  float segmentAngle = TAU / 4.0;
  float arcAngle = segmentAngle * u_arcWidth;

  // Which segment and position within segment
  float normalizedAngle = mod(rotatedAngle + PI, TAU); // 0 to TAU
  float segmentIndex = normalizedAngle / segmentAngle;
  float segmentFrac = fract(segmentIndex) * segmentAngle;

  // Check if in arc portion of segment
  bool inArcSegment = segmentFrac < arcAngle;

  if (!inArcSegment) {
    fragColor = vec4(u_bgColor, 1.0);
    return;
  }

  // Anti-alias arc edges
  float arcSegmentEdge = smoothstep(0.0, 0.08, segmentFrac) * smoothstep(arcAngle, arcAngle - 0.08, segmentFrac);

  // Color based on ring - use continuous value for smooth color cycling
  float colorMix = mod(ringIndex, 2.0);
  vec3 arcColor = mix(u_color1, u_color2, colorMix);

  // Add subtle gradient based on angle
  float angleGradient = (sin(rotatedAngle * 2.0) * 0.5 + 0.5) * 0.15;
  arcColor += angleGradient;

  // Apply edge anti-aliasing and fades
  float alpha = arcEdge * arcSegmentEdge * centerFade * edgeFade;

  vec3 finalColor = mix(u_bgColor, arcColor, alpha);
  fragColor = vec4(finalColor, 1.0);
}
`;

class ConcentricArcsSketch implements Sketch {
  id = 'concentricArcs';
  name = 'Concentric Arcs';
  type: 'shader' = 'shader';

  controls: ControlDefinition[] = [
    { name: 'rotationSpeed', type: 'float', label: 'Rotation Speed', defaultValue: 0.5, min: 0.0, max: 3.0 },
    { name: 'zoomSpeed', type: 'float', label: 'Zoom Speed', defaultValue: 0.3, min: 0.0, max: 2.0 },
    { name: 'zoom', type: 'float', label: 'Base Zoom', defaultValue: 1.0, min: 0.2, max: 5.0 },
    { name: 'arcCount', type: 'float', label: 'Arc Rings', defaultValue: 8.0, min: 2.0, max: 20.0, step: 1.0 },
    { name: 'arcWidth', type: 'float', label: 'Arc Width', defaultValue: 0.7, min: 0.1, max: 0.95 },
    { name: 'gapRatio', type: 'float', label: 'Ring Gap', defaultValue: 0.2, min: 0.0, max: 0.5 },
    { name: 'alternateDirection', type: 'float', label: 'Alternate Dir', defaultValue: 1.0, min: 0.0, max: 1.0, step: 1.0 },
    { name: 'color1', type: 'color', label: 'Color 1', defaultValue: '#ff3366' },
    { name: 'color2', type: 'color', label: 'Color 2', defaultValue: '#3366ff' },
    { name: 'bgColor', type: 'color', label: 'Background', defaultValue: '#0a0a0a' },
  ];

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private uniforms!: Record<string, WebGLUniformLocation>;

  private rotationSpeed = 0.5;
  private zoomSpeed = 0.3;
  private zoom = 1.0;
  private arcCount = 8.0;
  private arcWidth = 0.7;
  private gapRatio = 0.2;
  private alternateDirection = 1.0;
  private color1: [number, number, number] = [1, 0.2, 0.4];
  private color2: [number, number, number] = [0.2, 0.4, 1];
  private bgColor: [number, number, number] = [0.04, 0.04, 0.04];

  private accumulatedRotation = 0;
  private accumulatedZoom = 0;
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
      rotationTime: gl.getUniformLocation(this.program, 'u_rotationTime')!,
      zoomTime: gl.getUniformLocation(this.program, 'u_zoomTime')!,
      zoom: gl.getUniformLocation(this.program, 'u_zoom')!,
      arcCount: gl.getUniformLocation(this.program, 'u_arcCount')!,
      arcWidth: gl.getUniformLocation(this.program, 'u_arcWidth')!,
      gapRatio: gl.getUniformLocation(this.program, 'u_gapRatio')!,
      alternateDirection: gl.getUniformLocation(this.program, 'u_alternateDirection')!,
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

    // Accumulate time for rotation and zoom separately to avoid jumps
    const deltaTime = time - this.lastRenderTime;
    this.accumulatedRotation += deltaTime * this.rotationSpeed;
    this.accumulatedZoom += deltaTime * this.zoomSpeed;
    this.lastRenderTime = time;

    // Pass accumulated values directly
    gl.uniform1f(this.uniforms.time, time);
    gl.uniform1f(this.uniforms.rotationTime, this.accumulatedRotation);
    gl.uniform1f(this.uniforms.zoomTime, this.accumulatedZoom);
    gl.uniform1f(this.uniforms.zoom, this.zoom);
    gl.uniform1f(this.uniforms.arcCount, this.arcCount);
    gl.uniform1f(this.uniforms.arcWidth, this.arcWidth);
    gl.uniform1f(this.uniforms.gapRatio, this.gapRatio);
    gl.uniform1f(this.uniforms.alternateDirection, this.alternateDirection);
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
    if (name === 'rotationSpeed' && typeof value === 'number') this.rotationSpeed = value;
    else if (name === 'zoomSpeed' && typeof value === 'number') this.zoomSpeed = value;
    else if (name === 'zoom' && typeof value === 'number') this.zoom = value;
    else if (name === 'arcCount' && typeof value === 'number') this.arcCount = value;
    else if (name === 'arcWidth' && typeof value === 'number') this.arcWidth = value;
    else if (name === 'gapRatio' && typeof value === 'number') this.gapRatio = value;
    else if (name === 'alternateDirection' && typeof value === 'number') this.alternateDirection = value;
    else if (name === 'color1' && typeof value === 'string') this.color1 = hexToRgb(value);
    else if (name === 'color2' && typeof value === 'string') this.color2 = hexToRgb(value);
    else if (name === 'bgColor' && typeof value === 'string') this.bgColor = hexToRgb(value);
  }

  getControl(name: string): ControlValue | undefined {
    if (name === 'rotationSpeed') return this.rotationSpeed;
    if (name === 'zoomSpeed') return this.zoomSpeed;
    if (name === 'zoom') return this.zoom;
    if (name === 'arcCount') return this.arcCount;
    if (name === 'arcWidth') return this.arcWidth;
    if (name === 'gapRatio') return this.gapRatio;
    if (name === 'alternateDirection') return this.alternateDirection;
    if (name === 'color1') return rgbToHex(...this.color1);
    if (name === 'color2') return rgbToHex(...this.color2);
    if (name === 'bgColor') return rgbToHex(...this.bgColor);
    return undefined;
  }
}

export const concentricArcsFactory: SketchFactory = {
  id: 'concentricArcs',
  name: 'Concentric Arcs',
  type: 'shader',
  create: () => new ConcentricArcsSketch(),
};
