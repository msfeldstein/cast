import { Layer, BlendMode } from './Layer';

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_baseTexture;
uniform sampler2D u_blendTexture;
uniform float u_opacity;
uniform int u_blendMode;

vec3 blendNormal(vec3 base, vec3 blend) {
  return blend;
}

vec3 blendAdditive(vec3 base, vec3 blend) {
  return min(base + blend, vec3(1.0));
}

vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return vec3(
    base.r < 0.5 ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
    base.g < 0.5 ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
    base.b < 0.5 ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
  );
}

void main() {
  vec4 base = texture(u_baseTexture, v_texCoord);
  vec4 blend = texture(u_blendTexture, v_texCoord);

  vec3 result;
  if (u_blendMode == 0) {
    result = blendNormal(base.rgb, blend.rgb);
  } else if (u_blendMode == 1) {
    result = blendAdditive(base.rgb, blend.rgb);
  } else if (u_blendMode == 2) {
    result = blendMultiply(base.rgb, blend.rgb);
  } else if (u_blendMode == 3) {
    result = blendScreen(base.rgb, blend.rgb);
  } else if (u_blendMode == 4) {
    result = blendOverlay(base.rgb, blend.rgb);
  } else {
    result = blendNormal(base.rgb, blend.rgb);
  }

  float blendAlpha = blend.a * u_opacity;
  fragColor = vec4(mix(base.rgb, result, blendAlpha), max(base.a, blendAlpha));
}
`;

export class Compositor {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private baseTexture: WebGLTexture;
  private blendTexture: WebGLTexture;
  private framebuffer: WebGLFramebuffer;
  private outputTexture: WebGLTexture;

  private locations: {
    baseTexture: WebGLUniformLocation;
    blendTexture: WebGLUniformLocation;
    opacity: WebGLUniformLocation;
    blendMode: WebGLUniformLocation;
  };

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    // Create shader program
    this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);

    // Get uniform locations
    this.locations = {
      baseTexture: gl.getUniformLocation(this.program, 'u_baseTexture')!,
      blendTexture: gl.getUniformLocation(this.program, 'u_blendTexture')!,
      opacity: gl.getUniformLocation(this.program, 'u_opacity')!,
      blendMode: gl.getUniformLocation(this.program, 'u_blendMode')!,
    };

    // Create VAO with full-screen quad
    this.vao = this.createQuadVAO();

    // Create textures
    this.baseTexture = this.createTexture();
    this.blendTexture = this.createTexture();
    this.outputTexture = this.createTexture();

    // Create framebuffer for intermediate results
    this.framebuffer = gl.createFramebuffer()!;
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      throw new Error('Vertex shader error: ' + gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      throw new Error('Fragment shader error: ' + gl.getShaderInfoLog(fs));
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return program;
  }

  private createQuadVAO(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    // Position buffer
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // TexCoord buffer
    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);
    const texBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    return vao;
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  private blendModeToInt(mode: BlendMode): number {
    switch (mode) {
      case 'normal': return 0;
      case 'additive': return 1;
      case 'multiply': return 2;
      case 'screen': return 3;
      case 'overlay': return 4;
      default: return 0;
    }
  }

  composite(layers: Layer[]): void {
    const gl = this.gl;
    const visibleLayers = layers.filter(l => l.visible && l.generation);

    if (visibleLayers.length === 0) {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Start with first layer as base
    const firstLayer = visibleLayers[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Upload first layer directly
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.baseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, firstLayer.canvas);

    if (visibleLayers.length === 1) {
      // Just draw the single layer
      gl.uniform1i(this.locations.baseTexture, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.blendTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, firstLayer.canvas);
      gl.uniform1i(this.locations.blendTexture, 1);
      gl.uniform1f(this.locations.opacity, firstLayer.opacity);
      gl.uniform1i(this.locations.blendMode, 0); // Normal blend with itself
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return;
    }

    // Blend remaining layers
    for (let i = 1; i < visibleLayers.length; i++) {
      const layer = visibleLayers[i];

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.blendTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, layer.canvas);

      gl.uniform1i(this.locations.baseTexture, 0);
      gl.uniform1i(this.locations.blendTexture, 1);
      gl.uniform1f(this.locations.opacity, layer.opacity);
      gl.uniform1i(this.locations.blendMode, this.blendModeToInt(layer.blendMode));

      if (i < visibleLayers.length - 1) {
        // Render to framebuffer for next iteration
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTexture, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Swap for next iteration
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.baseTexture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, this.canvas.width, this.canvas.height, 0);
      } else {
        // Final output to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.baseTexture);
    gl.deleteTexture(this.blendTexture);
    gl.deleteTexture(this.outputTexture);
    gl.deleteFramebuffer(this.framebuffer);
  }
}
