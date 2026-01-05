import { Effect } from '../types/effect';
import { ControlDefinition, ControlValue } from '../types/sketch';

const BASE_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`;

export abstract class BaseEffect implements Effect {
  abstract id: string;
  abstract name: string;
  abstract controls: ControlDefinition[];

  enabled = true;

  protected canvas: OffscreenCanvas | null = null;
  protected gl: WebGL2RenderingContext | null = null;
  protected program: WebGLProgram | null = null;
  protected vao: WebGLVertexArrayObject | null = null;
  protected texture: WebGLTexture | null = null;
  protected uniforms: Record<string, WebGLUniformLocation> = {};

  protected abstract getFragmentShader(): string;
  protected abstract getUniformNames(): string[];

  async init(): Promise<void> {
    // Create offscreen canvas for WebGL context
    this.canvas = new OffscreenCanvas(1, 1);
    const gl = this.canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    // Create shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, BASE_VERTEX_SHADER);
    gl.compileShader(vs);

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, this.getFragmentShader());
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
    }

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(this.program));
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Get uniform locations
    this.uniforms = {
      texture: gl.getUniformLocation(this.program, 'u_texture')!,
      resolution: gl.getUniformLocation(this.program, 'u_resolution')!,
      time: gl.getUniformLocation(this.program, 'u_time')!,
    };

    for (const name of this.getUniformNames()) {
      this.uniforms[name] = gl.getUniformLocation(this.program, `u_${name}`)!;
    }

    // Create VAO with fullscreen quad
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

    // Create texture for source image
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  apply(
    source: OffscreenCanvas,
    destination: OffscreenCanvas,
    time: number,
    _deltaTime: number
  ): void {
    if (!this.enabled || !this.gl || !this.program || !this.vao || !this.texture || !this.canvas) {
      // If disabled, just copy source to destination
      const ctx = destination.getContext('2d')!;
      ctx.drawImage(source, 0, 0);
      return;
    }

    const gl = this.gl;

    // Resize canvas if needed
    if (this.canvas.width !== source.width || this.canvas.height !== source.height) {
      this.canvas.width = source.width;
      this.canvas.height = source.height;
    }

    gl.viewport(0, 0, source.width, source.height);

    // Upload source as texture
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    // Render effect
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uniforms.texture, 0);
    gl.uniform2f(this.uniforms.resolution, source.width, source.height);
    gl.uniform1f(this.uniforms.time, time);

    // Set effect-specific uniforms
    this.setUniforms(gl);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Copy result to destination
    const ctx = destination.getContext('2d')!;
    ctx.drawImage(this.canvas, 0, 0);
  }

  protected abstract setUniforms(gl: WebGL2RenderingContext): void;

  dispose(): void {
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.vao) this.gl.deleteVertexArray(this.vao);
      if (this.texture) this.gl.deleteTexture(this.texture);
    }
    this.gl = null;
    this.program = null;
    this.vao = null;
    this.texture = null;
    this.canvas = null;
  }

  abstract setControl(name: string, value: ControlValue): void;
  abstract getControl(name: string): ControlValue | undefined;
}
