var Ul=Object.defineProperty;var Fl=(r,t,e)=>t in r?Ul(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var h=(r,t,e)=>Fl(r,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();class Ci{constructor(){h(this,"listeners",new Map)}on(t,e){return this.listeners.has(t)||this.listeners.set(t,new Set),this.listeners.get(t).add(e),()=>this.off(t,e)}once(t,e){const n=i=>{this.off(t,n),e(i)};return this.on(t,n)}off(t,e){var n;(n=this.listeners.get(t))==null||n.delete(e)}emit(t,e){const n=this.listeners.get(t);if(n)for(const i of n)i(e)}clearAllListeners(){this.listeners.clear()}clearListeners(t){this.listeners.delete(t)}listenerCount(t){var e;return((e=this.listeners.get(t))==null?void 0:e.size)??0}}class Fi extends Ci{constructor(e,n,i){super();h(this,"canvas");h(this,"sketch",null);h(this,"effects",[]);h(this,"_opacity",1);h(this,"_blendMode","normal");h(this,"_visible",!0);h(this,"ctx2d",null);h(this,"effectTempCanvas",null);this.id=e,this.width=n,this.height=i,this.canvas=new OffscreenCanvas(n,i)}get opacity(){return this._opacity}set opacity(e){this._opacity!==e&&(this._opacity=e,this.emit("property:change",{property:"opacity",value:e}))}get blendMode(){return this._blendMode}set blendMode(e){this._blendMode!==e&&(this._blendMode=e,this.emit("property:change",{property:"blendMode",value:e}))}get visible(){return this._visible}set visible(e){this._visible!==e&&(this._visible=e,this.emit("property:change",{property:"visible",value:e}))}async loadSketch(e){if(this.sketch){const s=this.sketch.id;this.sketch.dispose(),this.emit("sketch:unload",{sketchId:s})}this.sketch=e;const n=Math.min(window.devicePixelRatio||1,2),i=document.createElement("canvas");i.width=this.width*n,i.height=this.height*n,await e.init(i),this._visibleCanvas=i,this.emit("sketch:load",{sketch:e})}unloadSketch(){if(this.sketch){const n=this.sketch.id;this.sketch.dispose(),this.sketch=null,this.emit("sketch:unload",{sketchId:n})}const e=this._visibleCanvas;e&&(e.remove(),this._visibleCanvas=void 0)}async addEffect(e,n){await e.init();const i=n!==void 0?n:this.effects.length;this.effects.splice(i,0,e),this.emit("effect:add",{effect:e,index:i})}removeEffect(e){const n=this.effects.findIndex(i=>i.id===e);n!==-1&&(this.effects[n].dispose(),this.effects.splice(n,1),this.emit("effect:remove",{effectId:e,index:n}))}getEffect(e){return this.effects.find(n=>n.id===e)}moveEffect(e,n){if(e<0||e>=this.effects.length||n<0||n>=this.effects.length)return;const[i]=this.effects.splice(e,1);this.effects.splice(n,0,i),this.emit("effects:reorder",{effects:this.effects})}render(e,n){if(!this.sketch||!this._visible)return;this.sketch.render(e,n);const i=this._visibleCanvas;i&&(this.ctx2d||(this.ctx2d=this.canvas.getContext("2d")),this.ctx2d&&(this.ctx2d.imageSmoothingEnabled=!0,this.ctx2d.imageSmoothingQuality="high",this.ctx2d.clearRect(0,0,this.width,this.height),this.ctx2d.drawImage(i,0,0,i.width,i.height,0,0,this.width,this.height))),this.applyEffects(e,n)}applyEffects(e,n){const i=this.effects.filter(a=>a.enabled);if(i.length===0)return;(!this.effectTempCanvas||this.effectTempCanvas.width!==this.width||this.effectTempCanvas.height!==this.height)&&(this.effectTempCanvas=new OffscreenCanvas(this.width,this.height));let s=this.canvas,o=this.effectTempCanvas;for(let a=0;a<i.length;a++){const l=i[a];o.getContext("2d").clearRect(0,0,this.width,this.height),l.apply(s,o,e,n),[s,o]=[o,s]}if(s!==this.canvas){const a=this.canvas.getContext("2d");a.clearRect(0,0,this.width,this.height),a.drawImage(s,0,0)}}resize(e,n){this.canvas.width=e,this.canvas.height=n,this.ctx2d=null}dispose(){this.unloadSketch();for(const e of this.effects)e.dispose();this.effects=[],this.effectTempCanvas=null,this.clearAllListeners()}}const Nl=`#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`,Ol=`#version 300 es
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
`;class Bl{constructor(t){h(this,"gl");h(this,"program");h(this,"vao");h(this,"baseTexture");h(this,"blendTexture");h(this,"framebuffer");h(this,"outputTexture");h(this,"locations");this.canvas=t;const e=t.getContext("webgl2",{premultipliedAlpha:!1});if(!e)throw new Error("WebGL2 not supported");this.gl=e,this.program=this.createProgram(Nl,Ol),this.locations={baseTexture:e.getUniformLocation(this.program,"u_baseTexture"),blendTexture:e.getUniformLocation(this.program,"u_blendTexture"),opacity:e.getUniformLocation(this.program,"u_opacity"),blendMode:e.getUniformLocation(this.program,"u_blendMode")},this.vao=this.createQuadVAO(),this.baseTexture=this.createTexture(),this.blendTexture=this.createTexture(),this.outputTexture=this.createTexture(),this.framebuffer=e.createFramebuffer()}createProgram(t,e){const n=this.gl,i=n.createShader(n.VERTEX_SHADER);if(n.shaderSource(i,t),n.compileShader(i),!n.getShaderParameter(i,n.COMPILE_STATUS))throw new Error("Vertex shader error: "+n.getShaderInfoLog(i));const s=n.createShader(n.FRAGMENT_SHADER);if(n.shaderSource(s,e),n.compileShader(s),!n.getShaderParameter(s,n.COMPILE_STATUS))throw new Error("Fragment shader error: "+n.getShaderInfoLog(s));const o=n.createProgram();if(n.attachShader(o,i),n.attachShader(o,s),n.linkProgram(o),!n.getProgramParameter(o,n.LINK_STATUS))throw new Error("Program link error: "+n.getProgramInfoLog(o));return n.deleteShader(i),n.deleteShader(s),o}createQuadVAO(){const t=this.gl,e=t.createVertexArray();t.bindVertexArray(e);const n=new Float32Array([-1,-1,1,-1,-1,1,1,1]),i=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,n,t.STATIC_DRAW);const s=t.getAttribLocation(this.program,"a_position");t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,0,0);const o=new Float32Array([0,0,1,0,0,1,1,1]),a=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,a),t.bufferData(t.ARRAY_BUFFER,o,t.STATIC_DRAW);const l=t.getAttribLocation(this.program,"a_texCoord");return t.enableVertexAttribArray(l),t.vertexAttribPointer(l,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),e}createTexture(){const t=this.gl,e=t.createTexture();return t.bindTexture(t.TEXTURE_2D,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),e}blendModeToInt(t){switch(t){case"normal":return 0;case"additive":return 1;case"multiply":return 2;case"screen":return 3;case"overlay":return 4;default:return 0}}composite(t){const e=this.gl,n=t.filter(s=>s.visible&&s.sketch);if(n.length===0){e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT);return}e.useProgram(this.program),e.bindVertexArray(this.vao);const i=n[0];if(e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,this.canvas.width,this.canvas.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.baseTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i.canvas),n.length===1){e.uniform1i(this.locations.baseTexture,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.blendTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i.canvas),e.uniform1i(this.locations.blendTexture,1),e.uniform1f(this.locations.opacity,i.opacity),e.uniform1i(this.locations.blendMode,0),e.drawArrays(e.TRIANGLE_STRIP,0,4);return}for(let s=1;s<n.length;s++){const o=n[s];e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.blendTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o.canvas),e.uniform1i(this.locations.baseTexture,0),e.uniform1i(this.locations.blendTexture,1),e.uniform1f(this.locations.opacity,o.opacity),e.uniform1i(this.locations.blendMode,this.blendModeToInt(o.blendMode)),s<n.length-1?(e.bindFramebuffer(e.FRAMEBUFFER,this.framebuffer),e.bindTexture(e.TEXTURE_2D,this.outputTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.canvas.width,this.canvas.height,0,e.RGBA,e.UNSIGNED_BYTE,null),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,this.outputTexture,0),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.bindFramebuffer(e.FRAMEBUFFER,null),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.baseTexture),e.copyTexImage2D(e.TEXTURE_2D,0,e.RGBA,0,0,this.canvas.width,this.canvas.height,0)):(e.bindFramebuffer(e.FRAMEBUFFER,null),e.drawArrays(e.TRIANGLE_STRIP,0,4))}}resize(t,e){this.canvas.width=t,this.canvas.height=e}dispose(){const t=this.gl;t.deleteProgram(this.program),t.deleteVertexArray(this.vao),t.deleteTexture(this.baseTexture),t.deleteTexture(this.blendTexture),t.deleteTexture(this.outputTexture),t.deleteFramebuffer(this.framebuffer)}}class zl{constructor(t){h(this,"animationId",null);h(this,"lastTime",0);h(this,"callback");h(this,"running",!1);h(this,"uiCallbacks",new Set);h(this,"tick",()=>{if(!this.running)return;const t=performance.now(),e=(t-this.lastTime)/1e3;this.lastTime=t,this.callback(t/1e3,e);for(const n of this.uiCallbacks)n();this.animationId=requestAnimationFrame(this.tick)});this.callback=t}start(){this.running||(this.running=!0,this.lastTime=performance.now(),this.tick())}stop(){this.running=!1,this.animationId!==null&&(cancelAnimationFrame(this.animationId),this.animationId=null)}isRunning(){return this.running}registerUIUpdate(t){return this.uiCallbacks.add(t),()=>this.uiCallbacks.delete(t)}}function Lo(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function Do(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Vl=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,kl=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform vec3 u_color1;
uniform vec3 u_color2;

void main() {
  vec2 uv = v_uv * u_scale;
  float t = u_time * u_speed;

  float v = 0.0;
  v += sin((uv.x + t) * 3.14159);
  v += sin((uv.y + t) * 3.14159);
  v += sin((uv.x + uv.y + t) * 3.14159);
  v += sin(sqrt(uv.x * uv.x + uv.y * uv.y + 1.0) + t);

  v = v * 0.5;

  vec3 color = mix(u_color1, u_color2, sin(v * 3.14159) * 0.5 + 0.5);
  fragColor = vec4(color, 1.0);
}
`;class Hl{constructor(){h(this,"id","plasma");h(this,"name","Plasma");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:1,min:.1,max:5},{name:"scale",type:"float",label:"Scale",defaultValue:4,min:1,max:20},{name:"color1",type:"color",label:"Color 1",defaultValue:"#1a4dcc"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#e63380"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",1);h(this,"scale",4);h(this,"color1",[.1,.3,.8]);h(this,"color2",[.9,.2,.5])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Vl),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,kl),e.compileShader(i),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),scale:e.getUniformLocation(this.program,"u_scale"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.scale,this.scale),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="scale"&&typeof e=="number"?this.scale=e:t==="color1"&&typeof e=="string"?this.color1=Lo(e):t==="color2"&&typeof e=="string"&&(this.color2=Lo(e))}getControl(t){if(t==="speed")return this.speed;if(t==="scale")return this.scale;if(t==="color1")return Do(...this.color1);if(t==="color2")return Do(...this.color2)}}const Gl={id:"plasma",name:"Plasma",type:"shader",create:()=>new Hl},Wl=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,Xl=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_speed;
uniform float u_saturation;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float hue = fract(v_uv.x + v_uv.y * 0.5 + u_time * u_speed * 0.1);
  vec3 color = hsv2rgb(vec3(hue, u_saturation, 0.9));
  fragColor = vec4(color, 1.0);
}
`;class ql{constructor(){h(this,"id","gradient");h(this,"name","Rainbow Gradient");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:1,min:0,max:5},{name:"saturation",type:"float",label:"Saturation",defaultValue:.8,min:0,max:1}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",1);h(this,"saturation",.8)}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Wl),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,Xl),e.compileShader(i),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),saturation:e.getUniformLocation(this.program,"u_saturation")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.saturation,this.saturation),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="saturation"&&typeof e=="number"&&(this.saturation=e)}getControl(t){if(t==="speed")return this.speed;if(t==="saturation")return this.saturation}}const Yl={id:"gradient",name:"Rainbow Gradient",type:"shader",create:()=>new ql};function Po(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function Io(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const $l=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,Zl=`#version 300 es
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
`;class Kl{constructor(){h(this,"id","clouds");h(this,"name","Clouds");h(this,"type","shader");h(this,"controls",[{name:"coverage",type:"float",label:"Coverage",defaultValue:.5,min:0,max:1},{name:"softness",type:"float",label:"Softness",defaultValue:.3,min:.01,max:1},{name:"speed",type:"float",label:"Speed",defaultValue:.3,min:0,max:2},{name:"scale",type:"float",label:"Scale",defaultValue:3,min:.5,max:10},{name:"layers",type:"float",label:"Detail",defaultValue:.5,min:0,max:1},{name:"brightness",type:"float",label:"Brightness",defaultValue:1,min:.5,max:1.5},{name:"skyColor",type:"color",label:"Sky",defaultValue:"#4a90d9"},{name:"cloudColor",type:"color",label:"Clouds",defaultValue:"#ffffff"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"coverage",.5);h(this,"softness",.3);h(this,"speed",.3);h(this,"scale",3);h(this,"layers",.5);h(this,"brightness",1);h(this,"skyColor",[.29,.56,.85]);h(this,"cloudColor",[1,1,1])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,$l),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,Zl),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),coverage:e.getUniformLocation(this.program,"u_coverage"),softness:e.getUniformLocation(this.program,"u_softness"),speed:e.getUniformLocation(this.program,"u_speed"),scale:e.getUniformLocation(this.program,"u_scale"),layers:e.getUniformLocation(this.program,"u_layers"),brightness:e.getUniformLocation(this.program,"u_brightness"),skyColor:e.getUniformLocation(this.program,"u_skyColor"),cloudColor:e.getUniformLocation(this.program,"u_cloudColor"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.coverage,this.coverage),e.uniform1f(this.uniforms.softness,this.softness),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.scale,this.scale),e.uniform1f(this.uniforms.layers,this.layers),e.uniform1f(this.uniforms.brightness,this.brightness),e.uniform3fv(this.uniforms.skyColor,this.skyColor),e.uniform3fv(this.uniforms.cloudColor,this.cloudColor),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="coverage"&&typeof e=="number"?this.coverage=e:t==="softness"&&typeof e=="number"?this.softness=e:t==="speed"&&typeof e=="number"?this.speed=e:t==="scale"&&typeof e=="number"?this.scale=e:t==="layers"&&typeof e=="number"?this.layers=e:t==="brightness"&&typeof e=="number"?this.brightness=e:t==="skyColor"&&typeof e=="string"?this.skyColor=Po(e):t==="cloudColor"&&typeof e=="string"&&(this.cloudColor=Po(e))}getControl(t){if(t==="coverage")return this.coverage;if(t==="softness")return this.softness;if(t==="speed")return this.speed;if(t==="scale")return this.scale;if(t==="layers")return this.layers;if(t==="brightness")return this.brightness;if(t==="skyColor")return Io(...this.skyColor);if(t==="cloudColor")return Io(...this.cloudColor)}}const jl={id:"clouds",name:"Clouds",type:"shader",create:()=>new Kl};/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const co="170",Jl=0,Uo=1,Ql=2,Ya=1,ec=2,Jt=3,_n=0,yt=1,Qt=2,mn=0,ti=1,Fo=2,No=3,Oo=4,tc=5,Rn=100,nc=101,ic=102,rc=103,sc=104,oc=200,ac=201,lc=202,cc=203,Ss=204,bs=205,uc=206,hc=207,dc=208,fc=209,pc=210,mc=211,gc=212,_c=213,vc=214,Ms=0,Es=1,Ts=2,si=3,As=4,Cs=5,ws=6,Rs=7,uo=0,xc=1,yc=2,gn=0,Sc=1,bc=2,Mc=3,Ec=4,Tc=5,Ac=6,Cc=7,$a=300,oi=301,ai=302,Ls=303,Ds=304,br=306,Ps=1e3,Dn=1001,Is=1002,Ot=1003,wc=1004,Ni=1005,Vt=1006,Cr=1007,Pn=1008,rn=1009,Za=1010,Ka=1011,Ti=1012,ho=1013,Fn=1014,en=1015,wi=1016,fo=1017,po=1018,li=1020,ja=35902,Ja=1021,Qa=1022,Nt=1023,el=1024,tl=1025,ni=1026,ci=1027,nl=1028,mo=1029,il=1030,go=1031,_o=1033,lr=33776,cr=33777,ur=33778,hr=33779,Us=35840,Fs=35841,Ns=35842,Os=35843,Bs=36196,zs=37492,Vs=37496,ks=37808,Hs=37809,Gs=37810,Ws=37811,Xs=37812,qs=37813,Ys=37814,$s=37815,Zs=37816,Ks=37817,js=37818,Js=37819,Qs=37820,eo=37821,dr=36492,to=36494,no=36495,rl=36283,io=36284,ro=36285,so=36286,Rc=3200,Lc=3201,sl=0,Dc=1,pn="",wt="srgb",hi="srgb-linear",Mr="linear",$e="srgb",zn=7680,Bo=519,Pc=512,Ic=513,Uc=514,ol=515,Fc=516,Nc=517,Oc=518,Bc=519,zo=35044,Vo="300 es",tn=2e3,vr=2001;class di{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let s=0,o=i.length;s<o;s++)i[s].call(this,t);t.target=null}}}const ft=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],wr=Math.PI/180,oo=180/Math.PI;function Ri(){const r=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ft[r&255]+ft[r>>8&255]+ft[r>>16&255]+ft[r>>24&255]+"-"+ft[t&255]+ft[t>>8&255]+"-"+ft[t>>16&15|64]+ft[t>>24&255]+"-"+ft[e&63|128]+ft[e>>8&255]+"-"+ft[e>>16&255]+ft[e>>24&255]+ft[n&255]+ft[n>>8&255]+ft[n>>16&255]+ft[n>>24&255]).toLowerCase()}function xt(r,t,e){return Math.max(t,Math.min(e,r))}function zc(r,t){return(r%t+t)%t}function Rr(r,t,e){return(1-e)*r+e*t}function _i(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function vt(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}class qe{constructor(t=0,e=0){qe.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(xt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*n-o*i+t.x,this.y=s*i+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Le{constructor(t,e,n,i,s,o,a,l,c){Le.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,l,c)}set(t,e,n,i,s,o,a,l,c){const u=this.elements;return u[0]=t,u[1]=i,u[2]=a,u[3]=e,u[4]=s,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],f=n[7],p=n[2],g=n[5],v=n[8],y=i[0],m=i[3],d=i[6],A=i[1],T=i[4],E=i[7],z=i[2],P=i[5],C=i[8];return s[0]=o*y+a*A+l*z,s[3]=o*m+a*T+l*P,s[6]=o*d+a*E+l*C,s[1]=c*y+u*A+f*z,s[4]=c*m+u*T+f*P,s[7]=c*d+u*E+f*C,s[2]=p*y+g*A+v*z,s[5]=p*m+g*T+v*P,s[8]=p*d+g*E+v*C,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-n*s*u+n*a*l+i*s*c-i*o*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],f=u*o-a*c,p=a*l-u*s,g=c*s-o*l,v=e*f+n*p+i*g;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/v;return t[0]=f*y,t[1]=(i*c-u*n)*y,t[2]=(a*n-i*o)*y,t[3]=p*y,t[4]=(u*e-i*l)*y,t[5]=(i*s-a*e)*y,t[6]=g*y,t[7]=(n*l-c*e)*y,t[8]=(o*e-n*s)*y,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-i*c,i*l,-i*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Lr.makeScale(t,e)),this}rotate(t){return this.premultiply(Lr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Lr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Lr=new Le;function al(r){for(let t=r.length-1;t>=0;--t)if(r[t]>=65535)return!0;return!1}function xr(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Vc(){const r=xr("canvas");return r.style.display="block",r}const ko={};function Mi(r){r in ko||(ko[r]=!0,console.warn(r))}function kc(r,t,e){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(t,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}function Hc(r){const t=r.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Gc(r){const t=r.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const ke={enabled:!0,workingColorSpace:hi,spaces:{},convert:function(r,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===$e&&(r.r=nn(r.r),r.g=nn(r.g),r.b=nn(r.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(r.applyMatrix3(this.spaces[t].toXYZ),r.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===$e&&(r.r=ii(r.r),r.g=ii(r.g),r.b=ii(r.b))),r},fromWorkingColorSpace:function(r,t){return this.convert(r,this.workingColorSpace,t)},toWorkingColorSpace:function(r,t){return this.convert(r,t,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===pn?Mr:this.spaces[r].transfer},getLuminanceCoefficients:function(r,t=this.workingColorSpace){return r.fromArray(this.spaces[t].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,t,e){return r.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}};function nn(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function ii(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}const Ho=[.64,.33,.3,.6,.15,.06],Go=[.2126,.7152,.0722],Wo=[.3127,.329],Xo=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),qo=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ke.define({[hi]:{primaries:Ho,whitePoint:Wo,transfer:Mr,toXYZ:Xo,fromXYZ:qo,luminanceCoefficients:Go,workingColorSpaceConfig:{unpackColorSpace:wt},outputColorSpaceConfig:{drawingBufferColorSpace:wt}},[wt]:{primaries:Ho,whitePoint:Wo,transfer:$e,toXYZ:Xo,fromXYZ:qo,luminanceCoefficients:Go,outputColorSpaceConfig:{drawingBufferColorSpace:wt}}});let Vn;class Wc{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Vn===void 0&&(Vn=xr("canvas")),Vn.width=t.width,Vn.height=t.height;const n=Vn.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Vn}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=xr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let o=0;o<s.length;o++)s[o]=nn(s[o]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(nn(e[n]/255)*255):e[n]=nn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Xc=0;class ll{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Xc++}),this.uuid=Ri(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?s.push(Dr(i[o].image)):s.push(Dr(i[o]))}else s=Dr(i);n.url=s}return e||(t.images[this.uuid]=n),n}}function Dr(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Wc.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let qc=0;class St extends di{constructor(t=St.DEFAULT_IMAGE,e=St.DEFAULT_MAPPING,n=Dn,i=Dn,s=Vt,o=Pn,a=Nt,l=rn,c=St.DEFAULT_ANISOTROPY,u=pn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:qc++}),this.uuid=Ri(),this.name="",this.source=new ll(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new qe(0,0),this.repeat=new qe(1,1),this.center=new qe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==$a)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ps:t.x=t.x-Math.floor(t.x);break;case Dn:t.x=t.x<0?0:1;break;case Is:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ps:t.y=t.y-Math.floor(t.y);break;case Dn:t.y=t.y<0?0:1;break;case Is:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}St.DEFAULT_IMAGE=null;St.DEFAULT_MAPPING=$a;St.DEFAULT_ANISOTROPY=1;class st{constructor(t=0,e=0,n=0,i=1){st.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*i+o[12]*s,this.y=o[1]*e+o[5]*n+o[9]*i+o[13]*s,this.z=o[2]*e+o[6]*n+o[10]*i+o[14]*s,this.w=o[3]*e+o[7]*n+o[11]*i+o[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s;const l=t.elements,c=l[0],u=l[4],f=l[8],p=l[1],g=l[5],v=l[9],y=l[2],m=l[6],d=l[10];if(Math.abs(u-p)<.01&&Math.abs(f-y)<.01&&Math.abs(v-m)<.01){if(Math.abs(u+p)<.1&&Math.abs(f+y)<.1&&Math.abs(v+m)<.1&&Math.abs(c+g+d-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const T=(c+1)/2,E=(g+1)/2,z=(d+1)/2,P=(u+p)/4,C=(f+y)/4,U=(v+m)/4;return T>E&&T>z?T<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(T),i=P/n,s=C/n):E>z?E<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(E),n=P/i,s=U/i):z<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(z),n=C/s,i=U/s),this.set(n,i,s,e),this}let A=Math.sqrt((m-v)*(m-v)+(f-y)*(f-y)+(p-u)*(p-u));return Math.abs(A)<.001&&(A=1),this.x=(m-v)/A,this.y=(f-y)/A,this.z=(p-u)/A,this.w=Math.acos((c+g+d-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Yc extends di{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new st(0,0,t,e),this.scissorTest=!1,this.viewport=new st(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Vt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new St(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new ll(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Nn extends Yc{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class cl extends St{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ot,this.minFilter=Ot,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class $c extends St{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ot,this.minFilter=Ot,this.wrapR=Dn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Li{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,o,a){let l=n[i+0],c=n[i+1],u=n[i+2],f=n[i+3];const p=s[o+0],g=s[o+1],v=s[o+2],y=s[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f;return}if(a===1){t[e+0]=p,t[e+1]=g,t[e+2]=v,t[e+3]=y;return}if(f!==y||l!==p||c!==g||u!==v){let m=1-a;const d=l*p+c*g+u*v+f*y,A=d>=0?1:-1,T=1-d*d;if(T>Number.EPSILON){const z=Math.sqrt(T),P=Math.atan2(z,d*A);m=Math.sin(m*P)/z,a=Math.sin(a*P)/z}const E=a*A;if(l=l*m+p*E,c=c*m+g*E,u=u*m+v*E,f=f*m+y*E,m===1-a){const z=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=z,c*=z,u*=z,f*=z}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,i,s,o){const a=n[i],l=n[i+1],c=n[i+2],u=n[i+3],f=s[o],p=s[o+1],g=s[o+2],v=s[o+3];return t[e]=a*v+u*f+l*g-c*p,t[e+1]=l*v+u*p+c*f-a*g,t[e+2]=c*v+u*g+a*p-l*f,t[e+3]=u*v-a*f-l*p-c*g,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,s=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(i/2),f=a(s/2),p=l(n/2),g=l(i/2),v=l(s/2);switch(o){case"XYZ":this._x=p*u*f+c*g*v,this._y=c*g*f-p*u*v,this._z=c*u*v+p*g*f,this._w=c*u*f-p*g*v;break;case"YXZ":this._x=p*u*f+c*g*v,this._y=c*g*f-p*u*v,this._z=c*u*v-p*g*f,this._w=c*u*f+p*g*v;break;case"ZXY":this._x=p*u*f-c*g*v,this._y=c*g*f+p*u*v,this._z=c*u*v+p*g*f,this._w=c*u*f-p*g*v;break;case"ZYX":this._x=p*u*f-c*g*v,this._y=c*g*f+p*u*v,this._z=c*u*v-p*g*f,this._w=c*u*f+p*g*v;break;case"YZX":this._x=p*u*f+c*g*v,this._y=c*g*f+p*u*v,this._z=c*u*v-p*g*f,this._w=c*u*f-p*g*v;break;case"XZY":this._x=p*u*f-c*g*v,this._y=c*g*f-p*u*v,this._z=c*u*v+p*g*f,this._w=c*u*f+p*g*v;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],s=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],f=e[10],p=n+a+f;if(p>0){const g=.5/Math.sqrt(p+1);this._w=.25/g,this._x=(u-l)*g,this._y=(s-c)*g,this._z=(o-i)*g}else if(n>a&&n>f){const g=2*Math.sqrt(1+n-a-f);this._w=(u-l)/g,this._x=.25*g,this._y=(i+o)/g,this._z=(s+c)/g}else if(a>f){const g=2*Math.sqrt(1+a-n-f);this._w=(s-c)/g,this._x=(i+o)/g,this._y=.25*g,this._z=(l+u)/g}else{const g=2*Math.sqrt(1+f-n-a);this._w=(o-i)/g,this._x=(s+c)/g,this._y=(l+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(xt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,s=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+o*a+i*c-s*l,this._y=i*u+o*l+s*a-n*c,this._z=s*u+o*c+n*l-i*a,this._w=o*u-n*a-i*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,s=this._z,o=this._w;let a=o*t._w+n*t._x+i*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=i,this._z=s,this;const l=1-a*a;if(l<=Number.EPSILON){const g=1-e;return this._w=g*o+e*this._w,this._x=g*n+e*this._x,this._y=g*i+e*this._y,this._z=g*s+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),f=Math.sin((1-e)*u)/c,p=Math.sin(e*u)/c;return this._w=o*f+this._w*p,this._x=n*f+this._x*p,this._y=i*f+this._y*p,this._z=s*f+this._z*p,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class B{constructor(t=0,e=0,n=0){B.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Yo.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Yo.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=t.elements,o=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*o,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*o,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,s=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*i-a*n),u=2*(a*e-s*i),f=2*(s*n-o*e);return this.x=e+l*c+o*f-a*u,this.y=n+l*u+a*c-s*f,this.z=i+l*f+s*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,s=t.z,o=e.x,a=e.y,l=e.z;return this.x=i*l-s*a,this.y=s*o-n*l,this.z=n*a-i*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Pr.copy(this).projectOnVector(t),this.sub(Pr)}reflect(t){return this.sub(Pr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(xt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Pr=new B,Yo=new Li;class Di{constructor(t=new B(1/0,1/0,1/0),e=new B(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Pt.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Pt.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Pt.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Pt):Pt.fromBufferAttribute(s,o),Pt.applyMatrix4(t.matrixWorld),this.expandByPoint(Pt);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Oi.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Oi.copy(n.boundingBox)),Oi.applyMatrix4(t.matrixWorld),this.union(Oi)}const i=t.children;for(let s=0,o=i.length;s<o;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Pt),Pt.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(vi),Bi.subVectors(this.max,vi),kn.subVectors(t.a,vi),Hn.subVectors(t.b,vi),Gn.subVectors(t.c,vi),ln.subVectors(Hn,kn),cn.subVectors(Gn,Hn),Sn.subVectors(kn,Gn);let e=[0,-ln.z,ln.y,0,-cn.z,cn.y,0,-Sn.z,Sn.y,ln.z,0,-ln.x,cn.z,0,-cn.x,Sn.z,0,-Sn.x,-ln.y,ln.x,0,-cn.y,cn.x,0,-Sn.y,Sn.x,0];return!Ir(e,kn,Hn,Gn,Bi)||(e=[1,0,0,0,1,0,0,0,1],!Ir(e,kn,Hn,Gn,Bi))?!1:(zi.crossVectors(ln,cn),e=[zi.x,zi.y,zi.z],Ir(e,kn,Hn,Gn,Bi))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Pt).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Pt).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Yt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Yt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Yt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Yt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Yt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Yt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Yt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Yt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Yt),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Yt=[new B,new B,new B,new B,new B,new B,new B,new B],Pt=new B,Oi=new Di,kn=new B,Hn=new B,Gn=new B,ln=new B,cn=new B,Sn=new B,vi=new B,Bi=new B,zi=new B,bn=new B;function Ir(r,t,e,n,i){for(let s=0,o=r.length-3;s<=o;s+=3){bn.fromArray(r,s);const a=i.x*Math.abs(bn.x)+i.y*Math.abs(bn.y)+i.z*Math.abs(bn.z),l=t.dot(bn),c=e.dot(bn),u=n.dot(bn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const Zc=new Di,xi=new B,Ur=new B;class vo{constructor(t=new B,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Zc.setFromPoints(t).getCenter(n);let i=0;for(let s=0,o=t.length;s<o;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;xi.subVectors(t,this.center);const e=xi.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(xi,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ur.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(xi.copy(t.center).add(Ur)),this.expandByPoint(xi.copy(t.center).sub(Ur))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const $t=new B,Fr=new B,Vi=new B,un=new B,Nr=new B,ki=new B,Or=new B;class Kc{constructor(t=new B,e=new B(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,$t)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=$t.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):($t.copy(this.origin).addScaledVector(this.direction,e),$t.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Fr.copy(t).add(e).multiplyScalar(.5),Vi.copy(e).sub(t).normalize(),un.copy(this.origin).sub(Fr);const s=t.distanceTo(e)*.5,o=-this.direction.dot(Vi),a=un.dot(this.direction),l=-un.dot(Vi),c=un.lengthSq(),u=Math.abs(1-o*o);let f,p,g,v;if(u>0)if(f=o*l-a,p=o*a-l,v=s*u,f>=0)if(p>=-v)if(p<=v){const y=1/u;f*=y,p*=y,g=f*(f+o*p+2*a)+p*(o*f+p+2*l)+c}else p=s,f=Math.max(0,-(o*p+a)),g=-f*f+p*(p+2*l)+c;else p=-s,f=Math.max(0,-(o*p+a)),g=-f*f+p*(p+2*l)+c;else p<=-v?(f=Math.max(0,-(-o*s+a)),p=f>0?-s:Math.min(Math.max(-s,-l),s),g=-f*f+p*(p+2*l)+c):p<=v?(f=0,p=Math.min(Math.max(-s,-l),s),g=p*(p+2*l)+c):(f=Math.max(0,-(o*s+a)),p=f>0?s:Math.min(Math.max(-s,-l),s),g=-f*f+p*(p+2*l)+c);else p=o>0?-s:s,f=Math.max(0,-(o*p+a)),g=-f*f+p*(p+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),i&&i.copy(Fr).addScaledVector(Vi,p),g}intersectSphere(t,e){$t.subVectors(t.center,this.origin);const n=$t.dot(this.direction),i=$t.dot($t)-n*n,s=t.radius*t.radius;if(i>s)return null;const o=Math.sqrt(s-i),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,p=this.origin;return c>=0?(n=(t.min.x-p.x)*c,i=(t.max.x-p.x)*c):(n=(t.max.x-p.x)*c,i=(t.min.x-p.x)*c),u>=0?(s=(t.min.y-p.y)*u,o=(t.max.y-p.y)*u):(s=(t.max.y-p.y)*u,o=(t.min.y-p.y)*u),n>o||s>i||((s>n||isNaN(n))&&(n=s),(o<i||isNaN(i))&&(i=o),f>=0?(a=(t.min.z-p.z)*f,l=(t.max.z-p.z)*f):(a=(t.max.z-p.z)*f,l=(t.min.z-p.z)*f),n>l||a>i)||((a>n||n!==n)&&(n=a),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,$t)!==null}intersectTriangle(t,e,n,i,s){Nr.subVectors(e,t),ki.subVectors(n,t),Or.crossVectors(Nr,ki);let o=this.direction.dot(Or),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;un.subVectors(this.origin,t);const l=a*this.direction.dot(ki.crossVectors(un,ki));if(l<0)return null;const c=a*this.direction.dot(Nr.cross(un));if(c<0||l+c>o)return null;const u=-a*un.dot(Or);return u<0?null:this.at(u/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ot{constructor(t,e,n,i,s,o,a,l,c,u,f,p,g,v,y,m){ot.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,o,a,l,c,u,f,p,g,v,y,m)}set(t,e,n,i,s,o,a,l,c,u,f,p,g,v,y,m){const d=this.elements;return d[0]=t,d[4]=e,d[8]=n,d[12]=i,d[1]=s,d[5]=o,d[9]=a,d[13]=l,d[2]=c,d[6]=u,d[10]=f,d[14]=p,d[3]=g,d[7]=v,d[11]=y,d[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ot().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/Wn.setFromMatrixColumn(t,0).length(),s=1/Wn.setFromMatrixColumn(t,1).length(),o=1/Wn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,s=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(i),c=Math.sin(i),u=Math.cos(s),f=Math.sin(s);if(t.order==="XYZ"){const p=o*u,g=o*f,v=a*u,y=a*f;e[0]=l*u,e[4]=-l*f,e[8]=c,e[1]=g+v*c,e[5]=p-y*c,e[9]=-a*l,e[2]=y-p*c,e[6]=v+g*c,e[10]=o*l}else if(t.order==="YXZ"){const p=l*u,g=l*f,v=c*u,y=c*f;e[0]=p+y*a,e[4]=v*a-g,e[8]=o*c,e[1]=o*f,e[5]=o*u,e[9]=-a,e[2]=g*a-v,e[6]=y+p*a,e[10]=o*l}else if(t.order==="ZXY"){const p=l*u,g=l*f,v=c*u,y=c*f;e[0]=p-y*a,e[4]=-o*f,e[8]=v+g*a,e[1]=g+v*a,e[5]=o*u,e[9]=y-p*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){const p=o*u,g=o*f,v=a*u,y=a*f;e[0]=l*u,e[4]=v*c-g,e[8]=p*c+y,e[1]=l*f,e[5]=y*c+p,e[9]=g*c-v,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){const p=o*l,g=o*c,v=a*l,y=a*c;e[0]=l*u,e[4]=y-p*f,e[8]=v*f+g,e[1]=f,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=g*f+v,e[10]=p-y*f}else if(t.order==="XZY"){const p=o*l,g=o*c,v=a*l,y=a*c;e[0]=l*u,e[4]=-f,e[8]=c*u,e[1]=p*f+y,e[5]=o*u,e[9]=g*f-v,e[2]=v*f-g,e[6]=a*u,e[10]=y*f+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(jc,t,Jc)}lookAt(t,e,n){const i=this.elements;return Mt.subVectors(t,e),Mt.lengthSq()===0&&(Mt.z=1),Mt.normalize(),hn.crossVectors(n,Mt),hn.lengthSq()===0&&(Math.abs(n.z)===1?Mt.x+=1e-4:Mt.z+=1e-4,Mt.normalize(),hn.crossVectors(n,Mt)),hn.normalize(),Hi.crossVectors(Mt,hn),i[0]=hn.x,i[4]=Hi.x,i[8]=Mt.x,i[1]=hn.y,i[5]=Hi.y,i[9]=Mt.y,i[2]=hn.z,i[6]=Hi.z,i[10]=Mt.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],f=n[5],p=n[9],g=n[13],v=n[2],y=n[6],m=n[10],d=n[14],A=n[3],T=n[7],E=n[11],z=n[15],P=i[0],C=i[4],U=i[8],b=i[12],S=i[1],w=i[5],W=i[9],V=i[13],Z=i[2],K=i[6],q=i[10],J=i[14],H=i[3],re=i[7],ue=i[11],ye=i[15];return s[0]=o*P+a*S+l*Z+c*H,s[4]=o*C+a*w+l*K+c*re,s[8]=o*U+a*W+l*q+c*ue,s[12]=o*b+a*V+l*J+c*ye,s[1]=u*P+f*S+p*Z+g*H,s[5]=u*C+f*w+p*K+g*re,s[9]=u*U+f*W+p*q+g*ue,s[13]=u*b+f*V+p*J+g*ye,s[2]=v*P+y*S+m*Z+d*H,s[6]=v*C+y*w+m*K+d*re,s[10]=v*U+y*W+m*q+d*ue,s[14]=v*b+y*V+m*J+d*ye,s[3]=A*P+T*S+E*Z+z*H,s[7]=A*C+T*w+E*K+z*re,s[11]=A*U+T*W+E*q+z*ue,s[15]=A*b+T*V+E*J+z*ye,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],f=t[6],p=t[10],g=t[14],v=t[3],y=t[7],m=t[11],d=t[15];return v*(+s*l*f-i*c*f-s*a*p+n*c*p+i*a*g-n*l*g)+y*(+e*l*g-e*c*p+s*o*p-i*o*g+i*c*u-s*l*u)+m*(+e*c*f-e*a*g-s*o*f+n*o*g+s*a*u-n*c*u)+d*(-i*a*u-e*l*f+e*a*p+i*o*f-n*o*p+n*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],f=t[9],p=t[10],g=t[11],v=t[12],y=t[13],m=t[14],d=t[15],A=f*m*c-y*p*c+y*l*g-a*m*g-f*l*d+a*p*d,T=v*p*c-u*m*c-v*l*g+o*m*g+u*l*d-o*p*d,E=u*y*c-v*f*c+v*a*g-o*y*g-u*a*d+o*f*d,z=v*f*l-u*y*l-v*a*p+o*y*p+u*a*m-o*f*m,P=e*A+n*T+i*E+s*z;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const C=1/P;return t[0]=A*C,t[1]=(y*p*s-f*m*s-y*i*g+n*m*g+f*i*d-n*p*d)*C,t[2]=(a*m*s-y*l*s+y*i*c-n*m*c-a*i*d+n*l*d)*C,t[3]=(f*l*s-a*p*s-f*i*c+n*p*c+a*i*g-n*l*g)*C,t[4]=T*C,t[5]=(u*m*s-v*p*s+v*i*g-e*m*g-u*i*d+e*p*d)*C,t[6]=(v*l*s-o*m*s-v*i*c+e*m*c+o*i*d-e*l*d)*C,t[7]=(o*p*s-u*l*s+u*i*c-e*p*c-o*i*g+e*l*g)*C,t[8]=E*C,t[9]=(v*f*s-u*y*s-v*n*g+e*y*g+u*n*d-e*f*d)*C,t[10]=(o*y*s-v*a*s+v*n*c-e*y*c-o*n*d+e*a*d)*C,t[11]=(u*a*s-o*f*s-u*n*c+e*f*c+o*n*g-e*a*g)*C,t[12]=z*C,t[13]=(u*y*i-v*f*i+v*n*p-e*y*p-u*n*m+e*f*m)*C,t[14]=(v*a*i-o*y*i-v*n*l+e*y*l+o*n*m-e*a*m)*C,t[15]=(o*f*i-u*a*i+u*n*l-e*f*l-o*n*p+e*a*p)*C,this}scale(t){const e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),s=1-n,o=t.x,a=t.y,l=t.z,c=s*o,u=s*a;return this.set(c*o+n,c*a-i*l,c*l+i*a,0,c*a+i*l,u*a+n,u*l-i*o,0,c*l-i*a,u*l+i*o,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,o){return this.set(1,n,s,0,t,1,o,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,s=e._x,o=e._y,a=e._z,l=e._w,c=s+s,u=o+o,f=a+a,p=s*c,g=s*u,v=s*f,y=o*u,m=o*f,d=a*f,A=l*c,T=l*u,E=l*f,z=n.x,P=n.y,C=n.z;return i[0]=(1-(y+d))*z,i[1]=(g+E)*z,i[2]=(v-T)*z,i[3]=0,i[4]=(g-E)*P,i[5]=(1-(p+d))*P,i[6]=(m+A)*P,i[7]=0,i[8]=(v+T)*C,i[9]=(m-A)*C,i[10]=(1-(p+y))*C,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let s=Wn.set(i[0],i[1],i[2]).length();const o=Wn.set(i[4],i[5],i[6]).length(),a=Wn.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),t.x=i[12],t.y=i[13],t.z=i[14],It.copy(this);const c=1/s,u=1/o,f=1/a;return It.elements[0]*=c,It.elements[1]*=c,It.elements[2]*=c,It.elements[4]*=u,It.elements[5]*=u,It.elements[6]*=u,It.elements[8]*=f,It.elements[9]*=f,It.elements[10]*=f,e.setFromRotationMatrix(It),n.x=s,n.y=o,n.z=a,this}makePerspective(t,e,n,i,s,o,a=tn){const l=this.elements,c=2*s/(e-t),u=2*s/(n-i),f=(e+t)/(e-t),p=(n+i)/(n-i);let g,v;if(a===tn)g=-(o+s)/(o-s),v=-2*o*s/(o-s);else if(a===vr)g=-o/(o-s),v=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=u,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,s,o,a=tn){const l=this.elements,c=1/(e-t),u=1/(n-i),f=1/(o-s),p=(e+t)*c,g=(n+i)*u;let v,y;if(a===tn)v=(o+s)*f,y=-2*f;else if(a===vr)v=s*f,y=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-p,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-g,l[2]=0,l[6]=0,l[10]=y,l[14]=-v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Wn=new B,It=new ot,jc=new B(0,0,0),Jc=new B(1,1,1),hn=new B,Hi=new B,Mt=new B,$o=new ot,Zo=new Li;class Wt{constructor(t=0,e=0,n=0,i=Wt.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,s=i[0],o=i[4],a=i[8],l=i[1],c=i[5],u=i[9],f=i[2],p=i[6],g=i[10];switch(e){case"XYZ":this._y=Math.asin(xt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(p,c),this._z=0);break;case"YXZ":this._x=Math.asin(-xt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,g),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(xt(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-f,g),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-xt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(p,g),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(xt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(a,g));break;case"XZY":this._z=Math.asin(-xt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,g),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return $o.makeRotationFromQuaternion(t),this.setFromRotationMatrix($o,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Zo.setFromEuler(this),this.setFromQuaternion(Zo,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Wt.DEFAULT_ORDER="XYZ";class ul{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Qc=0;const Ko=new B,Xn=new Li,Zt=new ot,Gi=new B,yi=new B,eu=new B,tu=new Li,jo=new B(1,0,0),Jo=new B(0,1,0),Qo=new B(0,0,1),ea={type:"added"},nu={type:"removed"},qn={type:"childadded",child:null},Br={type:"childremoved",child:null};class mt extends di{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Qc++}),this.uuid=Ri(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=mt.DEFAULT_UP.clone();const t=new B,e=new Wt,n=new Li,i=new B(1,1,1);function s(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ot},normalMatrix:{value:new Le}}),this.matrix=new ot,this.matrixWorld=new ot,this.matrixAutoUpdate=mt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ul,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Xn.setFromAxisAngle(t,e),this.quaternion.multiply(Xn),this}rotateOnWorldAxis(t,e){return Xn.setFromAxisAngle(t,e),this.quaternion.premultiply(Xn),this}rotateX(t){return this.rotateOnAxis(jo,t)}rotateY(t){return this.rotateOnAxis(Jo,t)}rotateZ(t){return this.rotateOnAxis(Qo,t)}translateOnAxis(t,e){return Ko.copy(t).applyQuaternion(this.quaternion),this.position.add(Ko.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(jo,t)}translateY(t){return this.translateOnAxis(Jo,t)}translateZ(t){return this.translateOnAxis(Qo,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Zt.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Gi.copy(t):Gi.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),yi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zt.lookAt(yi,Gi,this.up):Zt.lookAt(Gi,yi,this.up),this.quaternion.setFromRotationMatrix(Zt),i&&(Zt.extractRotation(i.matrixWorld),Xn.setFromRotationMatrix(Zt),this.quaternion.premultiply(Xn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ea),qn.child=t,this.dispatchEvent(qn),qn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(nu),Br.child=t,this.dispatchEvent(Br),Br.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Zt.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Zt.multiply(t.parent.matrixWorld)),t.applyMatrix4(Zt),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ea),qn.child=t,this.dispatchEvent(qn),qn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yi,t,eu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yi,tu,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let s=0,o=i.length;s<o;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const f=l[c];s(t.shapes,f)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(t.materials,this.material[l]));i.material=a}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];i.animations.push(s(t.animations,l))}}if(e){const a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),f=o(t.shapes),p=o(t.skeletons),g=o(t.animations),v=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),p.length>0&&(n.skeletons=p),g.length>0&&(n.animations=g),v.length>0&&(n.nodes=v)}return n.object=i,n;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}mt.DEFAULT_UP=new B(0,1,0);mt.DEFAULT_MATRIX_AUTO_UPDATE=!0;mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ut=new B,Kt=new B,zr=new B,jt=new B,Yn=new B,$n=new B,ta=new B,Vr=new B,kr=new B,Hr=new B,Gr=new st,Wr=new st,Xr=new st;class Ft{constructor(t=new B,e=new B,n=new B){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),Ut.subVectors(t,e),i.cross(Ut);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){Ut.subVectors(i,e),Kt.subVectors(n,e),zr.subVectors(t,e);const o=Ut.dot(Ut),a=Ut.dot(Kt),l=Ut.dot(zr),c=Kt.dot(Kt),u=Kt.dot(zr),f=o*c-a*a;if(f===0)return s.set(0,0,0),null;const p=1/f,g=(c*l-a*u)*p,v=(o*u-a*l)*p;return s.set(1-g-v,v,g)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,jt)===null?!1:jt.x>=0&&jt.y>=0&&jt.x+jt.y<=1}static getInterpolation(t,e,n,i,s,o,a,l){return this.getBarycoord(t,e,n,i,jt)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,jt.x),l.addScaledVector(o,jt.y),l.addScaledVector(a,jt.z),l)}static getInterpolatedAttribute(t,e,n,i,s,o){return Gr.setScalar(0),Wr.setScalar(0),Xr.setScalar(0),Gr.fromBufferAttribute(t,e),Wr.fromBufferAttribute(t,n),Xr.fromBufferAttribute(t,i),o.setScalar(0),o.addScaledVector(Gr,s.x),o.addScaledVector(Wr,s.y),o.addScaledVector(Xr,s.z),o}static isFrontFacing(t,e,n,i){return Ut.subVectors(n,e),Kt.subVectors(t,e),Ut.cross(Kt).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ut.subVectors(this.c,this.b),Kt.subVectors(this.a,this.b),Ut.cross(Kt).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ft.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ft.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return Ft.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return Ft.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ft.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,s=this.c;let o,a;Yn.subVectors(i,n),$n.subVectors(s,n),Vr.subVectors(t,n);const l=Yn.dot(Vr),c=$n.dot(Vr);if(l<=0&&c<=0)return e.copy(n);kr.subVectors(t,i);const u=Yn.dot(kr),f=$n.dot(kr);if(u>=0&&f<=u)return e.copy(i);const p=l*f-u*c;if(p<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(n).addScaledVector(Yn,o);Hr.subVectors(t,s);const g=Yn.dot(Hr),v=$n.dot(Hr);if(v>=0&&g<=v)return e.copy(s);const y=g*c-l*v;if(y<=0&&c>=0&&v<=0)return a=c/(c-v),e.copy(n).addScaledVector($n,a);const m=u*v-g*f;if(m<=0&&f-u>=0&&g-v>=0)return ta.subVectors(s,i),a=(f-u)/(f-u+(g-v)),e.copy(i).addScaledVector(ta,a);const d=1/(m+y+p);return o=y*d,a=p*d,e.copy(n).addScaledVector(Yn,o).addScaledVector($n,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const hl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},dn={h:0,s:0,l:0},Wi={h:0,s:0,l:0};function qr(r,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?r+(t-r)*6*e:e<1/2?t:e<2/3?r+(t-r)*6*(2/3-e):r}class Ge{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=wt){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ke.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=ke.workingColorSpace){return this.r=t,this.g=e,this.b=n,ke.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=ke.workingColorSpace){if(t=zc(t,1),e=xt(e,0,1),n=xt(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,o=2*n-s;this.r=qr(o,s,t+1/3),this.g=qr(o,s,t),this.b=qr(o,s,t-1/3)}return ke.toWorkingColorSpace(this,i),this}setStyle(t,e=wt){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=i[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=wt){const n=hl[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=nn(t.r),this.g=nn(t.g),this.b=nn(t.b),this}copyLinearToSRGB(t){return this.r=ii(t.r),this.g=ii(t.g),this.b=ii(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=wt){return ke.fromWorkingColorSpace(pt.copy(this),t),Math.round(xt(pt.r*255,0,255))*65536+Math.round(xt(pt.g*255,0,255))*256+Math.round(xt(pt.b*255,0,255))}getHexString(t=wt){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ke.workingColorSpace){ke.fromWorkingColorSpace(pt.copy(this),e);const n=pt.r,i=pt.g,s=pt.b,o=Math.max(n,i,s),a=Math.min(n,i,s);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const f=o-a;switch(c=u<=.5?f/(o+a):f/(2-o-a),o){case n:l=(i-s)/f+(i<s?6:0);break;case i:l=(s-n)/f+2;break;case s:l=(n-i)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=ke.workingColorSpace){return ke.fromWorkingColorSpace(pt.copy(this),e),t.r=pt.r,t.g=pt.g,t.b=pt.b,t}getStyle(t=wt){ke.fromWorkingColorSpace(pt.copy(this),t);const e=pt.r,n=pt.g,i=pt.b;return t!==wt?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(dn),this.setHSL(dn.h+t,dn.s+e,dn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(dn),t.getHSL(Wi);const n=Rr(dn.h,Wi.h,e),i=Rr(dn.s,Wi.s,e),s=Rr(dn.l,Wi.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const pt=new Ge;Ge.NAMES=hl;let iu=0;class Pi extends di{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:iu++}),this.uuid=Ri(),this.name="",this.blending=ti,this.side=_n,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ss,this.blendDst=bs,this.blendEquation=Rn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ge(0,0,0),this.blendAlpha=0,this.depthFunc=si,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Bo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=zn,this.stencilZFail=zn,this.stencilZPass=zn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ti&&(n.blending=this.blending),this.side!==_n&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ss&&(n.blendSrc=this.blendSrc),this.blendDst!==bs&&(n.blendDst=this.blendDst),this.blendEquation!==Rn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==si&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Bo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==zn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==zn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==zn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(e){const s=i(t.textures),o=i(t.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class dl extends Pi{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Ge(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.combine=uo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const lt=new B,Xi=new qe;class Gt{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=zo,this.updateRanges=[],this.gpuType=en,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Xi.fromBufferAttribute(this,e),Xi.applyMatrix3(t),this.setXY(e,Xi.x,Xi.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)lt.fromBufferAttribute(this,e),lt.applyMatrix3(t),this.setXYZ(e,lt.x,lt.y,lt.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)lt.fromBufferAttribute(this,e),lt.applyMatrix4(t),this.setXYZ(e,lt.x,lt.y,lt.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)lt.fromBufferAttribute(this,e),lt.applyNormalMatrix(t),this.setXYZ(e,lt.x,lt.y,lt.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)lt.fromBufferAttribute(this,e),lt.transformDirection(t),this.setXYZ(e,lt.x,lt.y,lt.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=_i(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=vt(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=_i(e,this.array)),e}setX(t,e){return this.normalized&&(e=vt(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=_i(e,this.array)),e}setY(t,e){return this.normalized&&(e=vt(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=_i(e,this.array)),e}setZ(t,e){return this.normalized&&(e=vt(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=_i(e,this.array)),e}setW(t,e){return this.normalized&&(e=vt(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=vt(e,this.array),n=vt(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=vt(e,this.array),n=vt(n,this.array),i=vt(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=vt(e,this.array),n=vt(n,this.array),i=vt(i,this.array),s=vt(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==zo&&(t.usage=this.usage),t}}class fl extends Gt{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class pl extends Gt{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class In extends Gt{constructor(t,e,n){super(new Float32Array(t),e,n)}}let ru=0;const Ct=new ot,Yr=new mt,Zn=new B,Et=new Di,Si=new Di,ht=new B;class On extends di{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ru++}),this.uuid=Ri(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(al(t)?pl:fl)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Le().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return Ct.makeRotationFromQuaternion(t),this.applyMatrix4(Ct),this}rotateX(t){return Ct.makeRotationX(t),this.applyMatrix4(Ct),this}rotateY(t){return Ct.makeRotationY(t),this.applyMatrix4(Ct),this}rotateZ(t){return Ct.makeRotationZ(t),this.applyMatrix4(Ct),this}translate(t,e,n){return Ct.makeTranslation(t,e,n),this.applyMatrix4(Ct),this}scale(t,e,n){return Ct.makeScale(t,e,n),this.applyMatrix4(Ct),this}lookAt(t){return Yr.lookAt(t),Yr.updateMatrix(),this.applyMatrix4(Yr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Zn).negate(),this.translate(Zn.x,Zn.y,Zn.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let i=0,s=t.length;i<s;i++){const o=t[i];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new In(n,3))}else{for(let n=0,i=e.count;n<i;n++){const s=t[n];e.setXYZ(n,s.x,s.y,s.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Di);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new B(-1/0,-1/0,-1/0),new B(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const s=e[n];Et.setFromBufferAttribute(s),this.morphTargetsRelative?(ht.addVectors(this.boundingBox.min,Et.min),this.boundingBox.expandByPoint(ht),ht.addVectors(this.boundingBox.max,Et.max),this.boundingBox.expandByPoint(ht)):(this.boundingBox.expandByPoint(Et.min),this.boundingBox.expandByPoint(Et.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new vo);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new B,1/0);return}if(t){const n=this.boundingSphere.center;if(Et.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];Si.setFromBufferAttribute(a),this.morphTargetsRelative?(ht.addVectors(Et.min,Si.min),Et.expandByPoint(ht),ht.addVectors(Et.max,Si.max),Et.expandByPoint(ht)):(Et.expandByPoint(Si.min),Et.expandByPoint(Si.max))}Et.getCenter(n);let i=0;for(let s=0,o=t.count;s<o;s++)ht.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(ht));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)ht.fromBufferAttribute(a,c),l&&(Zn.fromBufferAttribute(t,c),ht.add(Zn)),i=Math.max(i,n.distanceToSquared(ht))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Gt(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let U=0;U<n.count;U++)a[U]=new B,l[U]=new B;const c=new B,u=new B,f=new B,p=new qe,g=new qe,v=new qe,y=new B,m=new B;function d(U,b,S){c.fromBufferAttribute(n,U),u.fromBufferAttribute(n,b),f.fromBufferAttribute(n,S),p.fromBufferAttribute(s,U),g.fromBufferAttribute(s,b),v.fromBufferAttribute(s,S),u.sub(c),f.sub(c),g.sub(p),v.sub(p);const w=1/(g.x*v.y-v.x*g.y);isFinite(w)&&(y.copy(u).multiplyScalar(v.y).addScaledVector(f,-g.y).multiplyScalar(w),m.copy(f).multiplyScalar(g.x).addScaledVector(u,-v.x).multiplyScalar(w),a[U].add(y),a[b].add(y),a[S].add(y),l[U].add(m),l[b].add(m),l[S].add(m))}let A=this.groups;A.length===0&&(A=[{start:0,count:t.count}]);for(let U=0,b=A.length;U<b;++U){const S=A[U],w=S.start,W=S.count;for(let V=w,Z=w+W;V<Z;V+=3)d(t.getX(V+0),t.getX(V+1),t.getX(V+2))}const T=new B,E=new B,z=new B,P=new B;function C(U){z.fromBufferAttribute(i,U),P.copy(z);const b=a[U];T.copy(b),T.sub(z.multiplyScalar(z.dot(b))).normalize(),E.crossVectors(P,b);const w=E.dot(l[U])<0?-1:1;o.setXYZW(U,T.x,T.y,T.z,w)}for(let U=0,b=A.length;U<b;++U){const S=A[U],w=S.start,W=S.count;for(let V=w,Z=w+W;V<Z;V+=3)C(t.getX(V+0)),C(t.getX(V+1)),C(t.getX(V+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Gt(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let p=0,g=n.count;p<g;p++)n.setXYZ(p,0,0,0);const i=new B,s=new B,o=new B,a=new B,l=new B,c=new B,u=new B,f=new B;if(t)for(let p=0,g=t.count;p<g;p+=3){const v=t.getX(p+0),y=t.getX(p+1),m=t.getX(p+2);i.fromBufferAttribute(e,v),s.fromBufferAttribute(e,y),o.fromBufferAttribute(e,m),u.subVectors(o,s),f.subVectors(i,s),u.cross(f),a.fromBufferAttribute(n,v),l.fromBufferAttribute(n,y),c.fromBufferAttribute(n,m),a.add(u),l.add(u),c.add(u),n.setXYZ(v,a.x,a.y,a.z),n.setXYZ(y,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let p=0,g=e.count;p<g;p+=3)i.fromBufferAttribute(e,p+0),s.fromBufferAttribute(e,p+1),o.fromBufferAttribute(e,p+2),u.subVectors(o,s),f.subVectors(i,s),u.cross(f),n.setXYZ(p+0,u.x,u.y,u.z),n.setXYZ(p+1,u.x,u.y,u.z),n.setXYZ(p+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)ht.fromBufferAttribute(t,e),ht.normalize(),t.setXYZ(e,ht.x,ht.y,ht.z)}toNonIndexed(){function t(a,l){const c=a.array,u=a.itemSize,f=a.normalized,p=new c.constructor(l.length*u);let g=0,v=0;for(let y=0,m=l.length;y<m;y++){a.isInterleavedBufferAttribute?g=l[y]*a.data.stride+a.offset:g=l[y]*u;for(let d=0;d<u;d++)p[v++]=c[g++]}return new Gt(p,u,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new On,n=this.index.array,i=this.attributes;for(const a in i){const l=i[a],c=t(l,n);e.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let u=0,f=c.length;u<f;u++){const p=c[u],g=t(p,n);l.push(g)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let f=0,p=c.length;f<p;f++){const g=c[f];u.push(g.toJSON(t.data))}u.length>0&&(i[l]=u,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const c in i){const u=i[c];this.setAttribute(c,u.clone(e))}const s=t.morphAttributes;for(const c in s){const u=[],f=s[c];for(let p=0,g=f.length;p<g;p++)u.push(f[p].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let c=0,u=o.length;c<u;c++){const f=o[c];this.addGroup(f.start,f.count,f.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const na=new ot,Mn=new Kc,qi=new vo,ia=new B,Yi=new B,$i=new B,Zi=new B,$r=new B,Ki=new B,ra=new B,ji=new B;class kt extends mt{constructor(t=new On,e=new dl){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const a=this.morphTargetInfluences;if(s&&a){Ki.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=a[l],f=s[l];u!==0&&($r.fromBufferAttribute(f,t),o?Ki.addScaledVector($r,u):Ki.addScaledVector($r.sub(e),u))}e.add(Ki)}return e}raycast(t,e){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),qi.copy(n.boundingSphere),qi.applyMatrix4(s),Mn.copy(t.ray).recast(t.near),!(qi.containsPoint(Mn.origin)===!1&&(Mn.intersectSphere(qi,ia)===null||Mn.origin.distanceToSquared(ia)>(t.far-t.near)**2))&&(na.copy(s).invert(),Mn.copy(t.ray).applyMatrix4(na),!(n.boundingBox!==null&&Mn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Mn)))}_computeIntersections(t,e,n){let i;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,p=s.groups,g=s.drawRange;if(a!==null)if(Array.isArray(o))for(let v=0,y=p.length;v<y;v++){const m=p[v],d=o[m.materialIndex],A=Math.max(m.start,g.start),T=Math.min(a.count,Math.min(m.start+m.count,g.start+g.count));for(let E=A,z=T;E<z;E+=3){const P=a.getX(E),C=a.getX(E+1),U=a.getX(E+2);i=Ji(this,d,t,n,c,u,f,P,C,U),i&&(i.faceIndex=Math.floor(E/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const v=Math.max(0,g.start),y=Math.min(a.count,g.start+g.count);for(let m=v,d=y;m<d;m+=3){const A=a.getX(m),T=a.getX(m+1),E=a.getX(m+2);i=Ji(this,o,t,n,c,u,f,A,T,E),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(o))for(let v=0,y=p.length;v<y;v++){const m=p[v],d=o[m.materialIndex],A=Math.max(m.start,g.start),T=Math.min(l.count,Math.min(m.start+m.count,g.start+g.count));for(let E=A,z=T;E<z;E+=3){const P=E,C=E+1,U=E+2;i=Ji(this,d,t,n,c,u,f,P,C,U),i&&(i.faceIndex=Math.floor(E/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const v=Math.max(0,g.start),y=Math.min(l.count,g.start+g.count);for(let m=v,d=y;m<d;m+=3){const A=m,T=m+1,E=m+2;i=Ji(this,o,t,n,c,u,f,A,T,E),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}}}function su(r,t,e,n,i,s,o,a){let l;if(t.side===yt?l=n.intersectTriangle(o,s,i,!0,a):l=n.intersectTriangle(i,s,o,t.side===_n,a),l===null)return null;ji.copy(a),ji.applyMatrix4(r.matrixWorld);const c=e.ray.origin.distanceTo(ji);return c<e.near||c>e.far?null:{distance:c,point:ji.clone(),object:r}}function Ji(r,t,e,n,i,s,o,a,l,c){r.getVertexPosition(a,Yi),r.getVertexPosition(l,$i),r.getVertexPosition(c,Zi);const u=su(r,t,e,n,Yi,$i,Zi,ra);if(u){const f=new B;Ft.getBarycoord(ra,Yi,$i,Zi,f),i&&(u.uv=Ft.getInterpolatedAttribute(i,a,l,c,f,new qe)),s&&(u.uv1=Ft.getInterpolatedAttribute(s,a,l,c,f,new qe)),o&&(u.normal=Ft.getInterpolatedAttribute(o,a,l,c,f,new B),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const p={a,b:l,c,normal:new B,materialIndex:0};Ft.getNormal(Yi,$i,Zi,p.normal),u.face=p,u.barycoord=f}return u}class fi extends On{constructor(t=1,e=1,n=1,i=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:o};const a=this;i=Math.floor(i),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],u=[],f=[];let p=0,g=0;v("z","y","x",-1,-1,n,e,t,o,s,0),v("z","y","x",1,-1,n,e,-t,o,s,1),v("x","z","y",1,1,t,n,e,i,o,2),v("x","z","y",1,-1,t,n,-e,i,o,3),v("x","y","z",1,-1,t,e,n,i,s,4),v("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new In(c,3)),this.setAttribute("normal",new In(u,3)),this.setAttribute("uv",new In(f,2));function v(y,m,d,A,T,E,z,P,C,U,b){const S=E/C,w=z/U,W=E/2,V=z/2,Z=P/2,K=C+1,q=U+1;let J=0,H=0;const re=new B;for(let ue=0;ue<q;ue++){const ye=ue*w-V;for(let Ue=0;Ue<K;Ue++){const Ze=Ue*S-W;re[y]=Ze*A,re[m]=ye*T,re[d]=Z,c.push(re.x,re.y,re.z),re[y]=0,re[m]=0,re[d]=P>0?1:-1,u.push(re.x,re.y,re.z),f.push(Ue/C),f.push(1-ue/U),J+=1}}for(let ue=0;ue<U;ue++)for(let ye=0;ye<C;ye++){const Ue=p+ye+K*ue,Ze=p+ye+K*(ue+1),X=p+(ye+1)+K*(ue+1),te=p+(ye+1)+K*ue;l.push(Ue,Ze,te),l.push(Ze,X,te),H+=6}a.addGroup(g,H,b),g+=H,p+=J}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new fi(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ui(r){const t={};for(const e in r){t[e]={};for(const n in r[e]){const i=r[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function gt(r){const t={};for(let e=0;e<r.length;e++){const n=ui(r[e]);for(const i in n)t[i]=n[i]}return t}function ou(r){const t=[];for(let e=0;e<r.length;e++)t.push(r[e].clone());return t}function ml(r){const t=r.getRenderTarget();return t===null?r.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ke.workingColorSpace}const au={clone:ui,merge:gt};var lu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,cu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class vn extends Pi{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=lu,this.fragmentShader=cu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ui(t.uniforms),this.uniformsGroups=ou(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?e.uniforms[i]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[i]={type:"m4",value:o.toArray()}:e.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class gl extends mt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ot,this.projectionMatrix=new ot,this.projectionMatrixInverse=new ot,this.coordinateSystem=tn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const fn=new B,sa=new qe,oa=new qe;class Rt extends gl{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=oo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(wr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return oo*2*Math.atan(Math.tan(wr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){fn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(fn.x,fn.y).multiplyScalar(-t/fn.z),fn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(fn.x,fn.y).multiplyScalar(-t/fn.z)}getViewSize(t,e){return this.getViewBounds(t,sa,oa),e.subVectors(oa,sa)}setViewOffset(t,e,n,i,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(wr*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,s=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*i/l,e-=o.offsetY*n/c,i*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Kn=-90,jn=1;class uu extends mt{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new Rt(Kn,jn,t,e);i.layers=this.layers,this.add(i);const s=new Rt(Kn,jn,t,e);s.layers=this.layers,this.add(s);const o=new Rt(Kn,jn,t,e);o.layers=this.layers,this.add(o);const a=new Rt(Kn,jn,t,e);a.layers=this.layers,this.add(a);const l=new Rt(Kn,jn,t,e);l.layers=this.layers,this.add(l);const c=new Rt(Kn,jn,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,s,o,a,l]=e;for(const c of e)this.remove(c);if(t===tn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===vr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,u]=this.children,f=t.getRenderTarget(),p=t.getActiveCubeFace(),g=t.getActiveMipmapLevel(),v=t.xr.enabled;t.xr.enabled=!1;const y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,s),t.setRenderTarget(n,1,i),t.render(e,o),t.setRenderTarget(n,2,i),t.render(e,a),t.setRenderTarget(n,3,i),t.render(e,l),t.setRenderTarget(n,4,i),t.render(e,c),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,i),t.render(e,u),t.setRenderTarget(f,p,g),t.xr.enabled=v,n.texture.needsPMREMUpdate=!0}}class _l extends St{constructor(t,e,n,i,s,o,a,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:oi,super(t,e,n,i,s,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class hu extends Nn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new _l(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Vt}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new fi(5,5,5),s=new vn({name:"CubemapFromEquirect",uniforms:ui(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:yt,blending:mn});s.uniforms.tEquirect.value=e;const o=new kt(i,s),a=e.minFilter;return e.minFilter===Pn&&(e.minFilter=Vt),new uu(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,i){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,i);t.setRenderTarget(s)}}const Zr=new B,du=new B,fu=new Le;class Cn{constructor(t=new B(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=Zr.subVectors(n,e).cross(du.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Zr),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||fu.getNormalMatrix(t),i=this.coplanarPoint(Zr).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const En=new vo,Qi=new B;class xo{constructor(t=new Cn,e=new Cn,n=new Cn,i=new Cn,s=new Cn,o=new Cn){this.planes=[t,e,n,i,s,o]}set(t,e,n,i,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(i),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=tn){const n=this.planes,i=t.elements,s=i[0],o=i[1],a=i[2],l=i[3],c=i[4],u=i[5],f=i[6],p=i[7],g=i[8],v=i[9],y=i[10],m=i[11],d=i[12],A=i[13],T=i[14],E=i[15];if(n[0].setComponents(l-s,p-c,m-g,E-d).normalize(),n[1].setComponents(l+s,p+c,m+g,E+d).normalize(),n[2].setComponents(l+o,p+u,m+v,E+A).normalize(),n[3].setComponents(l-o,p-u,m-v,E-A).normalize(),n[4].setComponents(l-a,p-f,m-y,E-T).normalize(),e===tn)n[5].setComponents(l+a,p+f,m+y,E+T).normalize();else if(e===vr)n[5].setComponents(a,f,y,T).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),En.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),En.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(En)}intersectsSprite(t){return En.center.set(0,0,0),En.radius=.7071067811865476,En.applyMatrix4(t.matrixWorld),this.intersectsSphere(En)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(Qi.x=i.normal.x>0?t.max.x:t.min.x,Qi.y=i.normal.y>0?t.max.y:t.min.y,Qi.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(Qi)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function vl(){let r=null,t=!1,e=null,n=null;function i(s,o){e(s,o),n=r.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=r.requestAnimationFrame(i),t=!0)},stop:function(){r.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){r=s}}}function pu(r){const t=new WeakMap;function e(a,l){const c=a.array,u=a.usage,f=c.byteLength,p=r.createBuffer();r.bindBuffer(l,p),r.bufferData(l,c,u),a.onUploadCallback();let g;if(c instanceof Float32Array)g=r.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?g=r.HALF_FLOAT:g=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)g=r.SHORT;else if(c instanceof Uint32Array)g=r.UNSIGNED_INT;else if(c instanceof Int32Array)g=r.INT;else if(c instanceof Int8Array)g=r.BYTE;else if(c instanceof Uint8Array)g=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)g=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:p,type:g,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:f}}function n(a,l,c){const u=l.array,f=l.updateRanges;if(r.bindBuffer(c,a),f.length===0)r.bufferSubData(c,0,u);else{f.sort((g,v)=>g.start-v.start);let p=0;for(let g=1;g<f.length;g++){const v=f[p],y=f[g];y.start<=v.start+v.count+1?v.count=Math.max(v.count,y.start+y.count-v.start):(++p,f[p]=y)}f.length=p+1;for(let g=0,v=f.length;g<v;g++){const y=f[g];r.bufferSubData(c,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(r.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:i,remove:s,update:o}}class Er extends On{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const s=t/2,o=e/2,a=Math.floor(n),l=Math.floor(i),c=a+1,u=l+1,f=t/a,p=e/l,g=[],v=[],y=[],m=[];for(let d=0;d<u;d++){const A=d*p-o;for(let T=0;T<c;T++){const E=T*f-s;v.push(E,-A,0),y.push(0,0,1),m.push(T/a),m.push(1-d/l)}}for(let d=0;d<l;d++)for(let A=0;A<a;A++){const T=A+c*d,E=A+c*(d+1),z=A+1+c*(d+1),P=A+1+c*d;g.push(T,E,P),g.push(E,z,P)}this.setIndex(g),this.setAttribute("position",new In(v,3)),this.setAttribute("normal",new In(y,3)),this.setAttribute("uv",new In(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Er(t.width,t.height,t.widthSegments,t.heightSegments)}}var mu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,gu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,_u=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,vu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,xu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,yu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Su=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,bu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Mu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Eu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Tu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Au=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Cu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,wu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ru=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Lu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Du=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Pu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Iu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Uu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Fu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Nu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Ou=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Bu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,zu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Vu=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ku=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Hu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Gu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Wu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Xu="gl_FragColor = linearToOutputTexel( gl_FragColor );",qu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Yu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,$u=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Zu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ku=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,ju=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ju=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Qu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,eh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,th=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,nh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ih=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,rh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,sh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,oh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,ah=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,lh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ch=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,uh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,hh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,dh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,fh=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ph=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,mh=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,gh=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,_h=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,vh=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xh=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,yh=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Sh=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,bh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Mh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Eh=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Th=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ah=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ch=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,wh=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Rh=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Lh=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Dh=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ph=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Ih=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Uh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Fh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Nh=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Oh=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Bh=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,zh=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Vh=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,kh=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Hh=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Gh=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Wh=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Xh=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,qh=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Yh=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,$h=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Zh=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Kh=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,jh=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Jh=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Qh=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,ed=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,td=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,nd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,id=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,rd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,sd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,od=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,ad=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,ld=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,cd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,ud=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,hd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,dd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,fd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const pd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,md=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,gd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_d=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,vd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xd=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Sd=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,bd=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Md=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Ed=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Td=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ad=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Cd=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,wd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Rd=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ld=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Dd=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Pd=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Id=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ud=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Fd=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Nd=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Od=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bd=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,zd=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vd=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,kd=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Hd=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Gd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Wd=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Xd=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,qd=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Yd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Pe={alphahash_fragment:mu,alphahash_pars_fragment:gu,alphamap_fragment:_u,alphamap_pars_fragment:vu,alphatest_fragment:xu,alphatest_pars_fragment:yu,aomap_fragment:Su,aomap_pars_fragment:bu,batching_pars_vertex:Mu,batching_vertex:Eu,begin_vertex:Tu,beginnormal_vertex:Au,bsdfs:Cu,iridescence_fragment:wu,bumpmap_pars_fragment:Ru,clipping_planes_fragment:Lu,clipping_planes_pars_fragment:Du,clipping_planes_pars_vertex:Pu,clipping_planes_vertex:Iu,color_fragment:Uu,color_pars_fragment:Fu,color_pars_vertex:Nu,color_vertex:Ou,common:Bu,cube_uv_reflection_fragment:zu,defaultnormal_vertex:Vu,displacementmap_pars_vertex:ku,displacementmap_vertex:Hu,emissivemap_fragment:Gu,emissivemap_pars_fragment:Wu,colorspace_fragment:Xu,colorspace_pars_fragment:qu,envmap_fragment:Yu,envmap_common_pars_fragment:$u,envmap_pars_fragment:Zu,envmap_pars_vertex:Ku,envmap_physical_pars_fragment:ah,envmap_vertex:ju,fog_vertex:Ju,fog_pars_vertex:Qu,fog_fragment:eh,fog_pars_fragment:th,gradientmap_pars_fragment:nh,lightmap_pars_fragment:ih,lights_lambert_fragment:rh,lights_lambert_pars_fragment:sh,lights_pars_begin:oh,lights_toon_fragment:lh,lights_toon_pars_fragment:ch,lights_phong_fragment:uh,lights_phong_pars_fragment:hh,lights_physical_fragment:dh,lights_physical_pars_fragment:fh,lights_fragment_begin:ph,lights_fragment_maps:mh,lights_fragment_end:gh,logdepthbuf_fragment:_h,logdepthbuf_pars_fragment:vh,logdepthbuf_pars_vertex:xh,logdepthbuf_vertex:yh,map_fragment:Sh,map_pars_fragment:bh,map_particle_fragment:Mh,map_particle_pars_fragment:Eh,metalnessmap_fragment:Th,metalnessmap_pars_fragment:Ah,morphinstance_vertex:Ch,morphcolor_vertex:wh,morphnormal_vertex:Rh,morphtarget_pars_vertex:Lh,morphtarget_vertex:Dh,normal_fragment_begin:Ph,normal_fragment_maps:Ih,normal_pars_fragment:Uh,normal_pars_vertex:Fh,normal_vertex:Nh,normalmap_pars_fragment:Oh,clearcoat_normal_fragment_begin:Bh,clearcoat_normal_fragment_maps:zh,clearcoat_pars_fragment:Vh,iridescence_pars_fragment:kh,opaque_fragment:Hh,packing:Gh,premultiplied_alpha_fragment:Wh,project_vertex:Xh,dithering_fragment:qh,dithering_pars_fragment:Yh,roughnessmap_fragment:$h,roughnessmap_pars_fragment:Zh,shadowmap_pars_fragment:Kh,shadowmap_pars_vertex:jh,shadowmap_vertex:Jh,shadowmask_pars_fragment:Qh,skinbase_vertex:ed,skinning_pars_vertex:td,skinning_vertex:nd,skinnormal_vertex:id,specularmap_fragment:rd,specularmap_pars_fragment:sd,tonemapping_fragment:od,tonemapping_pars_fragment:ad,transmission_fragment:ld,transmission_pars_fragment:cd,uv_pars_fragment:ud,uv_pars_vertex:hd,uv_vertex:dd,worldpos_vertex:fd,background_vert:pd,background_frag:md,backgroundCube_vert:gd,backgroundCube_frag:_d,cube_vert:vd,cube_frag:xd,depth_vert:yd,depth_frag:Sd,distanceRGBA_vert:bd,distanceRGBA_frag:Md,equirect_vert:Ed,equirect_frag:Td,linedashed_vert:Ad,linedashed_frag:Cd,meshbasic_vert:wd,meshbasic_frag:Rd,meshlambert_vert:Ld,meshlambert_frag:Dd,meshmatcap_vert:Pd,meshmatcap_frag:Id,meshnormal_vert:Ud,meshnormal_frag:Fd,meshphong_vert:Nd,meshphong_frag:Od,meshphysical_vert:Bd,meshphysical_frag:zd,meshtoon_vert:Vd,meshtoon_frag:kd,points_vert:Hd,points_frag:Gd,shadow_vert:Wd,shadow_frag:Xd,sprite_vert:qd,sprite_frag:Yd},ne={common:{diffuse:{value:new Ge(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new qe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ge(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ge(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new Ge(16777215)},opacity:{value:1},center:{value:new qe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},zt={basic:{uniforms:gt([ne.common,ne.specularmap,ne.envmap,ne.aomap,ne.lightmap,ne.fog]),vertexShader:Pe.meshbasic_vert,fragmentShader:Pe.meshbasic_frag},lambert:{uniforms:gt([ne.common,ne.specularmap,ne.envmap,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.fog,ne.lights,{emissive:{value:new Ge(0)}}]),vertexShader:Pe.meshlambert_vert,fragmentShader:Pe.meshlambert_frag},phong:{uniforms:gt([ne.common,ne.specularmap,ne.envmap,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.fog,ne.lights,{emissive:{value:new Ge(0)},specular:{value:new Ge(1118481)},shininess:{value:30}}]),vertexShader:Pe.meshphong_vert,fragmentShader:Pe.meshphong_frag},standard:{uniforms:gt([ne.common,ne.envmap,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.roughnessmap,ne.metalnessmap,ne.fog,ne.lights,{emissive:{value:new Ge(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Pe.meshphysical_vert,fragmentShader:Pe.meshphysical_frag},toon:{uniforms:gt([ne.common,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.gradientmap,ne.fog,ne.lights,{emissive:{value:new Ge(0)}}]),vertexShader:Pe.meshtoon_vert,fragmentShader:Pe.meshtoon_frag},matcap:{uniforms:gt([ne.common,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.fog,{matcap:{value:null}}]),vertexShader:Pe.meshmatcap_vert,fragmentShader:Pe.meshmatcap_frag},points:{uniforms:gt([ne.points,ne.fog]),vertexShader:Pe.points_vert,fragmentShader:Pe.points_frag},dashed:{uniforms:gt([ne.common,ne.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Pe.linedashed_vert,fragmentShader:Pe.linedashed_frag},depth:{uniforms:gt([ne.common,ne.displacementmap]),vertexShader:Pe.depth_vert,fragmentShader:Pe.depth_frag},normal:{uniforms:gt([ne.common,ne.bumpmap,ne.normalmap,ne.displacementmap,{opacity:{value:1}}]),vertexShader:Pe.meshnormal_vert,fragmentShader:Pe.meshnormal_frag},sprite:{uniforms:gt([ne.sprite,ne.fog]),vertexShader:Pe.sprite_vert,fragmentShader:Pe.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Pe.background_vert,fragmentShader:Pe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Pe.backgroundCube_vert,fragmentShader:Pe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Pe.cube_vert,fragmentShader:Pe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Pe.equirect_vert,fragmentShader:Pe.equirect_frag},distanceRGBA:{uniforms:gt([ne.common,ne.displacementmap,{referencePosition:{value:new B},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Pe.distanceRGBA_vert,fragmentShader:Pe.distanceRGBA_frag},shadow:{uniforms:gt([ne.lights,ne.fog,{color:{value:new Ge(0)},opacity:{value:1}}]),vertexShader:Pe.shadow_vert,fragmentShader:Pe.shadow_frag}};zt.physical={uniforms:gt([zt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new qe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new Ge(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new qe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new Ge(0)},specularColor:{value:new Ge(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new qe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Pe.meshphysical_vert,fragmentShader:Pe.meshphysical_frag};const er={r:0,b:0,g:0},Tn=new Wt,$d=new ot;function Zd(r,t,e,n,i,s,o){const a=new Ge(0);let l=s===!0?0:1,c,u,f=null,p=0,g=null;function v(A){let T=A.isScene===!0?A.background:null;return T&&T.isTexture&&(T=(A.backgroundBlurriness>0?e:t).get(T)),T}function y(A){let T=!1;const E=v(A);E===null?d(a,l):E&&E.isColor&&(d(E,1),T=!0);const z=r.xr.getEnvironmentBlendMode();z==="additive"?n.buffers.color.setClear(0,0,0,1,o):z==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(r.autoClear||T)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function m(A,T){const E=v(T);E&&(E.isCubeTexture||E.mapping===br)?(u===void 0&&(u=new kt(new fi(1,1,1),new vn({name:"BackgroundCubeMaterial",uniforms:ui(zt.backgroundCube.uniforms),vertexShader:zt.backgroundCube.vertexShader,fragmentShader:zt.backgroundCube.fragmentShader,side:yt,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(z,P,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),Tn.copy(T.backgroundRotation),Tn.x*=-1,Tn.y*=-1,Tn.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(Tn.y*=-1,Tn.z*=-1),u.material.uniforms.envMap.value=E,u.material.uniforms.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4($d.makeRotationFromEuler(Tn)),u.material.toneMapped=ke.getTransfer(E.colorSpace)!==$e,(f!==E||p!==E.version||g!==r.toneMapping)&&(u.material.needsUpdate=!0,f=E,p=E.version,g=r.toneMapping),u.layers.enableAll(),A.unshift(u,u.geometry,u.material,0,0,null)):E&&E.isTexture&&(c===void 0&&(c=new kt(new Er(2,2),new vn({name:"BackgroundMaterial",uniforms:ui(zt.background.uniforms),vertexShader:zt.background.vertexShader,fragmentShader:zt.background.fragmentShader,side:_n,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=E,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.toneMapped=ke.getTransfer(E.colorSpace)!==$e,E.matrixAutoUpdate===!0&&E.updateMatrix(),c.material.uniforms.uvTransform.value.copy(E.matrix),(f!==E||p!==E.version||g!==r.toneMapping)&&(c.material.needsUpdate=!0,f=E,p=E.version,g=r.toneMapping),c.layers.enableAll(),A.unshift(c,c.geometry,c.material,0,0,null))}function d(A,T){A.getRGB(er,ml(r)),n.buffers.color.setClear(er.r,er.g,er.b,T,o)}return{getClearColor:function(){return a},setClearColor:function(A,T=1){a.set(A),l=T,d(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(A){l=A,d(a,l)},render:y,addToRenderList:m}}function Kd(r,t){const e=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=p(null);let s=i,o=!1;function a(S,w,W,V,Z){let K=!1;const q=f(V,W,w);s!==q&&(s=q,c(s.object)),K=g(S,V,W,Z),K&&v(S,V,W,Z),Z!==null&&t.update(Z,r.ELEMENT_ARRAY_BUFFER),(K||o)&&(o=!1,E(S,w,W,V),Z!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(Z).buffer))}function l(){return r.createVertexArray()}function c(S){return r.bindVertexArray(S)}function u(S){return r.deleteVertexArray(S)}function f(S,w,W){const V=W.wireframe===!0;let Z=n[S.id];Z===void 0&&(Z={},n[S.id]=Z);let K=Z[w.id];K===void 0&&(K={},Z[w.id]=K);let q=K[V];return q===void 0&&(q=p(l()),K[V]=q),q}function p(S){const w=[],W=[],V=[];for(let Z=0;Z<e;Z++)w[Z]=0,W[Z]=0,V[Z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:w,enabledAttributes:W,attributeDivisors:V,object:S,attributes:{},index:null}}function g(S,w,W,V){const Z=s.attributes,K=w.attributes;let q=0;const J=W.getAttributes();for(const H in J)if(J[H].location>=0){const ue=Z[H];let ye=K[H];if(ye===void 0&&(H==="instanceMatrix"&&S.instanceMatrix&&(ye=S.instanceMatrix),H==="instanceColor"&&S.instanceColor&&(ye=S.instanceColor)),ue===void 0||ue.attribute!==ye||ye&&ue.data!==ye.data)return!0;q++}return s.attributesNum!==q||s.index!==V}function v(S,w,W,V){const Z={},K=w.attributes;let q=0;const J=W.getAttributes();for(const H in J)if(J[H].location>=0){let ue=K[H];ue===void 0&&(H==="instanceMatrix"&&S.instanceMatrix&&(ue=S.instanceMatrix),H==="instanceColor"&&S.instanceColor&&(ue=S.instanceColor));const ye={};ye.attribute=ue,ue&&ue.data&&(ye.data=ue.data),Z[H]=ye,q++}s.attributes=Z,s.attributesNum=q,s.index=V}function y(){const S=s.newAttributes;for(let w=0,W=S.length;w<W;w++)S[w]=0}function m(S){d(S,0)}function d(S,w){const W=s.newAttributes,V=s.enabledAttributes,Z=s.attributeDivisors;W[S]=1,V[S]===0&&(r.enableVertexAttribArray(S),V[S]=1),Z[S]!==w&&(r.vertexAttribDivisor(S,w),Z[S]=w)}function A(){const S=s.newAttributes,w=s.enabledAttributes;for(let W=0,V=w.length;W<V;W++)w[W]!==S[W]&&(r.disableVertexAttribArray(W),w[W]=0)}function T(S,w,W,V,Z,K,q){q===!0?r.vertexAttribIPointer(S,w,W,Z,K):r.vertexAttribPointer(S,w,W,V,Z,K)}function E(S,w,W,V){y();const Z=V.attributes,K=W.getAttributes(),q=w.defaultAttributeValues;for(const J in K){const H=K[J];if(H.location>=0){let re=Z[J];if(re===void 0&&(J==="instanceMatrix"&&S.instanceMatrix&&(re=S.instanceMatrix),J==="instanceColor"&&S.instanceColor&&(re=S.instanceColor)),re!==void 0){const ue=re.normalized,ye=re.itemSize,Ue=t.get(re);if(Ue===void 0)continue;const Ze=Ue.buffer,X=Ue.type,te=Ue.bytesPerElement,_e=X===r.INT||X===r.UNSIGNED_INT||re.gpuType===ho;if(re.isInterleavedBufferAttribute){const se=re.data,Ee=se.stride,Ce=re.offset;if(se.isInstancedInterleavedBuffer){for(let Fe=0;Fe<H.locationSize;Fe++)d(H.location+Fe,se.meshPerAttribute);S.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let Fe=0;Fe<H.locationSize;Fe++)m(H.location+Fe);r.bindBuffer(r.ARRAY_BUFFER,Ze);for(let Fe=0;Fe<H.locationSize;Fe++)T(H.location+Fe,ye/H.locationSize,X,ue,Ee*te,(Ce+ye/H.locationSize*Fe)*te,_e)}else{if(re.isInstancedBufferAttribute){for(let se=0;se<H.locationSize;se++)d(H.location+se,re.meshPerAttribute);S.isInstancedMesh!==!0&&V._maxInstanceCount===void 0&&(V._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let se=0;se<H.locationSize;se++)m(H.location+se);r.bindBuffer(r.ARRAY_BUFFER,Ze);for(let se=0;se<H.locationSize;se++)T(H.location+se,ye/H.locationSize,X,ue,ye*te,ye/H.locationSize*se*te,_e)}}else if(q!==void 0){const ue=q[J];if(ue!==void 0)switch(ue.length){case 2:r.vertexAttrib2fv(H.location,ue);break;case 3:r.vertexAttrib3fv(H.location,ue);break;case 4:r.vertexAttrib4fv(H.location,ue);break;default:r.vertexAttrib1fv(H.location,ue)}}}}A()}function z(){U();for(const S in n){const w=n[S];for(const W in w){const V=w[W];for(const Z in V)u(V[Z].object),delete V[Z];delete w[W]}delete n[S]}}function P(S){if(n[S.id]===void 0)return;const w=n[S.id];for(const W in w){const V=w[W];for(const Z in V)u(V[Z].object),delete V[Z];delete w[W]}delete n[S.id]}function C(S){for(const w in n){const W=n[w];if(W[S.id]===void 0)continue;const V=W[S.id];for(const Z in V)u(V[Z].object),delete V[Z];delete W[S.id]}}function U(){b(),o=!0,s!==i&&(s=i,c(s.object))}function b(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:a,reset:U,resetDefaultState:b,dispose:z,releaseStatesOfGeometry:P,releaseStatesOfProgram:C,initAttributes:y,enableAttribute:m,disableUnusedAttributes:A}}function jd(r,t,e){let n;function i(c){n=c}function s(c,u){r.drawArrays(n,c,u),e.update(u,n,1)}function o(c,u,f){f!==0&&(r.drawArraysInstanced(n,c,u,f),e.update(u,n,f))}function a(c,u,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,f);let g=0;for(let v=0;v<f;v++)g+=u[v];e.update(g,n,1)}function l(c,u,f,p){if(f===0)return;const g=t.get("WEBGL_multi_draw");if(g===null)for(let v=0;v<c.length;v++)o(c[v],u[v],p[v]);else{g.multiDrawArraysInstancedWEBGL(n,c,0,u,0,p,0,f);let v=0;for(let y=0;y<f;y++)v+=u[y]*p[y];e.update(v,n,1)}}this.setMode=i,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function Jd(r,t,e,n){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const C=t.get("EXT_texture_filter_anisotropic");i=r.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(C){return!(C!==Nt&&n.convert(C)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){const U=C===wi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(C!==rn&&n.convert(C)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==en&&!U)}function l(C){if(C==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const f=e.logarithmicDepthBuffer===!0,p=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),g=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),v=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=r.getParameter(r.MAX_TEXTURE_SIZE),m=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),d=r.getParameter(r.MAX_VERTEX_ATTRIBS),A=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),T=r.getParameter(r.MAX_VARYING_VECTORS),E=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),z=v>0,P=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:f,reverseDepthBuffer:p,maxTextures:g,maxVertexTextures:v,maxTextureSize:y,maxCubemapSize:m,maxAttributes:d,maxVertexUniforms:A,maxVaryings:T,maxFragmentUniforms:E,vertexTextures:z,maxSamples:P}}function Qd(r){const t=this;let e=null,n=0,i=!1,s=!1;const o=new Cn,a=new Le,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,p){const g=f.length!==0||p||n!==0||i;return i=p,n=f.length,g},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,p){e=u(f,p,0)},this.setState=function(f,p,g){const v=f.clippingPlanes,y=f.clipIntersection,m=f.clipShadows,d=r.get(f);if(!i||v===null||v.length===0||s&&!m)s?u(null):c();else{const A=s?0:n,T=A*4;let E=d.clippingState||null;l.value=E,E=u(v,p,T,g);for(let z=0;z!==T;++z)E[z]=e[z];d.clippingState=E,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=A}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(f,p,g,v){const y=f!==null?f.length:0;let m=null;if(y!==0){if(m=l.value,v!==!0||m===null){const d=g+y*4,A=p.matrixWorldInverse;a.getNormalMatrix(A),(m===null||m.length<d)&&(m=new Float32Array(d));for(let T=0,E=g;T!==y;++T,E+=4)o.copy(f[T]).applyMatrix4(A,a),o.normal.toArray(m,E),m[E+3]=o.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,m}}function ef(r){let t=new WeakMap;function e(o,a){return a===Ls?o.mapping=oi:a===Ds&&(o.mapping=ai),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===Ls||a===Ds)if(t.has(o)){const l=t.get(o).texture;return e(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new hu(l.height);return c.fromEquirectangularTexture(r,o),t.set(o,c),o.addEventListener("dispose",i),e(c.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}class xl extends gl{constructor(t=-1,e=1,n=1,i=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-t,o=n+t,a=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Qn=4,aa=[.125,.215,.35,.446,.526,.582],Ln=20,Kr=new xl,la=new Ge;let jr=null,Jr=0,Qr=0,es=!1;const wn=(1+Math.sqrt(5))/2,Jn=1/wn,ca=[new B(-wn,Jn,0),new B(wn,Jn,0),new B(-Jn,0,wn),new B(Jn,0,wn),new B(0,wn,-Jn),new B(0,wn,Jn),new B(-1,1,-1),new B(1,1,-1),new B(-1,1,1),new B(1,1,1)];class ua{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){jr=this._renderer.getRenderTarget(),Jr=this._renderer.getActiveCubeFace(),Qr=this._renderer.getActiveMipmapLevel(),es=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,n,i,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=fa(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=da(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(jr,Jr,Qr),this._renderer.xr.enabled=es,t.scissorTest=!1,tr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===oi||t.mapping===ai?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),jr=this._renderer.getRenderTarget(),Jr=this._renderer.getActiveCubeFace(),Qr=this._renderer.getActiveMipmapLevel(),es=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Vt,minFilter:Vt,generateMipmaps:!1,type:wi,format:Nt,colorSpace:hi,depthBuffer:!1},i=ha(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ha(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=tf(s)),this._blurMaterial=nf(s,t,e)}return i}_compileMaterial(t){const e=new kt(this._lodPlanes[0],t);this._renderer.compile(e,Kr)}_sceneToCubeUV(t,e,n,i){const a=new Rt(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,p=u.toneMapping;u.getClearColor(la),u.toneMapping=gn,u.autoClear=!1;const g=new dl({name:"PMREM.Background",side:yt,depthWrite:!1,depthTest:!1}),v=new kt(new fi,g);let y=!1;const m=t.background;m?m.isColor&&(g.color.copy(m),t.background=null,y=!0):(g.color.copy(la),y=!0);for(let d=0;d<6;d++){const A=d%3;A===0?(a.up.set(0,l[d],0),a.lookAt(c[d],0,0)):A===1?(a.up.set(0,0,l[d]),a.lookAt(0,c[d],0)):(a.up.set(0,l[d],0),a.lookAt(0,0,c[d]));const T=this._cubeSize;tr(i,A*T,d>2?T:0,T,T),u.setRenderTarget(i),y&&u.render(v,a),u.render(t,a)}v.geometry.dispose(),v.material.dispose(),u.toneMapping=p,u.autoClear=f,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===oi||t.mapping===ai;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=fa()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=da());const s=i?this._cubemapMaterial:this._equirectMaterial,o=new kt(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const l=this._cubeSize;tr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Kr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let s=1;s<i;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=ca[(i-s-1)%ca.length];this._blur(t,s-1,s,o,a)}e.autoClear=n}_blur(t,e,n,i,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,i,"latitudinal",s),this._halfBlur(o,t,n,n,i,"longitudinal",s)}_halfBlur(t,e,n,i,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,f=new kt(this._lodPlanes[i],c),p=c.uniforms,g=this._sizeLods[n]-1,v=isFinite(s)?Math.PI/(2*g):2*Math.PI/(2*Ln-1),y=s/v,m=isFinite(s)?1+Math.floor(u*y):Ln;m>Ln&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ln}`);const d=[];let A=0;for(let C=0;C<Ln;++C){const U=C/y,b=Math.exp(-U*U/2);d.push(b),C===0?A+=b:C<m&&(A+=2*b)}for(let C=0;C<d.length;C++)d[C]=d[C]/A;p.envMap.value=t.texture,p.samples.value=m,p.weights.value=d,p.latitudinal.value=o==="latitudinal",a&&(p.poleAxis.value=a);const{_lodMax:T}=this;p.dTheta.value=v,p.mipInt.value=T-n;const E=this._sizeLods[i],z=3*E*(i>T-Qn?i-T+Qn:0),P=4*(this._cubeSize-E);tr(e,z,P,3*E,2*E),l.setRenderTarget(e),l.render(f,Kr)}}function tf(r){const t=[],e=[],n=[];let i=r;const s=r-Qn+1+aa.length;for(let o=0;o<s;o++){const a=Math.pow(2,i);e.push(a);let l=1/a;o>r-Qn?l=aa[o-r+Qn-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),u=-c,f=1+c,p=[u,u,f,u,f,f,u,u,f,f,u,f],g=6,v=6,y=3,m=2,d=1,A=new Float32Array(y*v*g),T=new Float32Array(m*v*g),E=new Float32Array(d*v*g);for(let P=0;P<g;P++){const C=P%3*2/3-1,U=P>2?0:-1,b=[C,U,0,C+2/3,U,0,C+2/3,U+1,0,C,U,0,C+2/3,U+1,0,C,U+1,0];A.set(b,y*v*P),T.set(p,m*v*P);const S=[P,P,P,P,P,P];E.set(S,d*v*P)}const z=new On;z.setAttribute("position",new Gt(A,y)),z.setAttribute("uv",new Gt(T,m)),z.setAttribute("faceIndex",new Gt(E,d)),t.push(z),i>Qn&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function ha(r,t,e){const n=new Nn(r,t,e);return n.texture.mapping=br,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function tr(r,t,e,n,i){r.viewport.set(t,e,n,i),r.scissor.set(t,e,n,i)}function nf(r,t,e){const n=new Float32Array(Ln),i=new B(0,1,0);return new vn({name:"SphericalGaussianBlur",defines:{n:Ln,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:yo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:mn,depthTest:!1,depthWrite:!1})}function da(){return new vn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:yo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:mn,depthTest:!1,depthWrite:!1})}function fa(){return new vn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:yo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:mn,depthTest:!1,depthWrite:!1})}function yo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function rf(r){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===Ls||l===Ds,u=l===oi||l===ai;if(c||u){let f=t.get(a);const p=f!==void 0?f.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==p)return e===null&&(e=new ua(r)),f=c?e.fromEquirectangular(a,f):e.fromCubemap(a,f),f.texture.pmremVersion=a.pmremVersion,t.set(a,f),f.texture;if(f!==void 0)return f.texture;{const g=a.image;return c&&g&&g.height>0||u&&g&&i(g)?(e===null&&(e=new ua(r)),f=c?e.fromEquirectangular(a):e.fromCubemap(a),f.texture.pmremVersion=a.pmremVersion,t.set(a,f),a.addEventListener("dispose",s),f.texture):null}}}return a}function i(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function s(a){const l=a.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function sf(r){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Mi("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function of(r,t,e,n){const i={},s=new WeakMap;function o(f){const p=f.target;p.index!==null&&t.remove(p.index);for(const v in p.attributes)t.remove(p.attributes[v]);for(const v in p.morphAttributes){const y=p.morphAttributes[v];for(let m=0,d=y.length;m<d;m++)t.remove(y[m])}p.removeEventListener("dispose",o),delete i[p.id];const g=s.get(p);g&&(t.remove(g),s.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,e.memory.geometries--}function a(f,p){return i[p.id]===!0||(p.addEventListener("dispose",o),i[p.id]=!0,e.memory.geometries++),p}function l(f){const p=f.attributes;for(const v in p)t.update(p[v],r.ARRAY_BUFFER);const g=f.morphAttributes;for(const v in g){const y=g[v];for(let m=0,d=y.length;m<d;m++)t.update(y[m],r.ARRAY_BUFFER)}}function c(f){const p=[],g=f.index,v=f.attributes.position;let y=0;if(g!==null){const A=g.array;y=g.version;for(let T=0,E=A.length;T<E;T+=3){const z=A[T+0],P=A[T+1],C=A[T+2];p.push(z,P,P,C,C,z)}}else if(v!==void 0){const A=v.array;y=v.version;for(let T=0,E=A.length/3-1;T<E;T+=3){const z=T+0,P=T+1,C=T+2;p.push(z,P,P,C,C,z)}}else return;const m=new(al(p)?pl:fl)(p,1);m.version=y;const d=s.get(f);d&&t.remove(d),s.set(f,m)}function u(f){const p=s.get(f);if(p){const g=f.index;g!==null&&p.version<g.version&&c(f)}else c(f);return s.get(f)}return{get:a,update:l,getWireframeAttribute:u}}function af(r,t,e){let n;function i(p){n=p}let s,o;function a(p){s=p.type,o=p.bytesPerElement}function l(p,g){r.drawElements(n,g,s,p*o),e.update(g,n,1)}function c(p,g,v){v!==0&&(r.drawElementsInstanced(n,g,s,p*o,v),e.update(g,n,v))}function u(p,g,v){if(v===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,g,0,s,p,0,v);let m=0;for(let d=0;d<v;d++)m+=g[d];e.update(m,n,1)}function f(p,g,v,y){if(v===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let d=0;d<p.length;d++)c(p[d]/o,g[d],y[d]);else{m.multiDrawElementsInstancedWEBGL(n,g,0,s,p,0,y,0,v);let d=0;for(let A=0;A<v;A++)d+=g[A]*y[A];e.update(d,n,1)}}this.setMode=i,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=f}function lf(r){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(e.calls++,o){case r.TRIANGLES:e.triangles+=a*(s/3);break;case r.LINES:e.lines+=a*(s/2);break;case r.LINE_STRIP:e.lines+=a*(s-1);break;case r.LINE_LOOP:e.lines+=a*s;break;case r.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function cf(r,t,e){const n=new WeakMap,i=new st;function s(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,f=u!==void 0?u.length:0;let p=n.get(a);if(p===void 0||p.count!==f){let S=function(){U.dispose(),n.delete(a),a.removeEventListener("dispose",S)};var g=S;p!==void 0&&p.texture.dispose();const v=a.morphAttributes.position!==void 0,y=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,d=a.morphAttributes.position||[],A=a.morphAttributes.normal||[],T=a.morphAttributes.color||[];let E=0;v===!0&&(E=1),y===!0&&(E=2),m===!0&&(E=3);let z=a.attributes.position.count*E,P=1;z>t.maxTextureSize&&(P=Math.ceil(z/t.maxTextureSize),z=t.maxTextureSize);const C=new Float32Array(z*P*4*f),U=new cl(C,z,P,f);U.type=en,U.needsUpdate=!0;const b=E*4;for(let w=0;w<f;w++){const W=d[w],V=A[w],Z=T[w],K=z*P*4*w;for(let q=0;q<W.count;q++){const J=q*b;v===!0&&(i.fromBufferAttribute(W,q),C[K+J+0]=i.x,C[K+J+1]=i.y,C[K+J+2]=i.z,C[K+J+3]=0),y===!0&&(i.fromBufferAttribute(V,q),C[K+J+4]=i.x,C[K+J+5]=i.y,C[K+J+6]=i.z,C[K+J+7]=0),m===!0&&(i.fromBufferAttribute(Z,q),C[K+J+8]=i.x,C[K+J+9]=i.y,C[K+J+10]=i.z,C[K+J+11]=Z.itemSize===4?i.w:1)}}p={count:f,texture:U,size:new qe(z,P)},n.set(a,p),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",o.morphTexture,e);else{let v=0;for(let m=0;m<c.length;m++)v+=c[m];const y=a.morphTargetsRelative?1:1-v;l.getUniforms().setValue(r,"morphTargetBaseInfluence",y),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",p.texture,e),l.getUniforms().setValue(r,"morphTargetsTextureSize",p.size)}return{update:s}}function uf(r,t,e,n){let i=new WeakMap;function s(l){const c=n.render.frame,u=l.geometry,f=t.get(l,u);if(i.get(f)!==c&&(t.update(f),i.set(f,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),i.get(l)!==c&&(e.update(l.instanceMatrix,r.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,r.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){const p=l.skeleton;i.get(p)!==c&&(p.update(),i.set(p,c))}return f}function o(){i=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:o}}class yl extends St{constructor(t,e,n,i,s,o,a,l,c,u=ni){if(u!==ni&&u!==ci)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===ni&&(n=Fn),n===void 0&&u===ci&&(n=li),super(null,i,s,o,a,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:Ot,this.minFilter=l!==void 0?l:Ot,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Sl=new St,pa=new yl(1,1),bl=new cl,Ml=new $c,El=new _l,ma=[],ga=[],_a=new Float32Array(16),va=new Float32Array(9),xa=new Float32Array(4);function pi(r,t,e){const n=r[0];if(n<=0||n>0)return r;const i=t*e;let s=ma[i];if(s===void 0&&(s=new Float32Array(i),ma[i]=s),t!==0){n.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,r[o].toArray(s,a)}return s}function ct(r,t){if(r.length!==t.length)return!1;for(let e=0,n=r.length;e<n;e++)if(r[e]!==t[e])return!1;return!0}function ut(r,t){for(let e=0,n=t.length;e<n;e++)r[e]=t[e]}function Tr(r,t){let e=ga[t];e===void 0&&(e=new Int32Array(t),ga[t]=e);for(let n=0;n!==t;++n)e[n]=r.allocateTextureUnit();return e}function hf(r,t){const e=this.cache;e[0]!==t&&(r.uniform1f(this.addr,t),e[0]=t)}function df(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ct(e,t))return;r.uniform2fv(this.addr,t),ut(e,t)}}function ff(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(r.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ct(e,t))return;r.uniform3fv(this.addr,t),ut(e,t)}}function pf(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ct(e,t))return;r.uniform4fv(this.addr,t),ut(e,t)}}function mf(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(ct(e,t))return;r.uniformMatrix2fv(this.addr,!1,t),ut(e,t)}else{if(ct(e,n))return;xa.set(n),r.uniformMatrix2fv(this.addr,!1,xa),ut(e,n)}}function gf(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(ct(e,t))return;r.uniformMatrix3fv(this.addr,!1,t),ut(e,t)}else{if(ct(e,n))return;va.set(n),r.uniformMatrix3fv(this.addr,!1,va),ut(e,n)}}function _f(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(ct(e,t))return;r.uniformMatrix4fv(this.addr,!1,t),ut(e,t)}else{if(ct(e,n))return;_a.set(n),r.uniformMatrix4fv(this.addr,!1,_a),ut(e,n)}}function vf(r,t){const e=this.cache;e[0]!==t&&(r.uniform1i(this.addr,t),e[0]=t)}function xf(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ct(e,t))return;r.uniform2iv(this.addr,t),ut(e,t)}}function yf(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ct(e,t))return;r.uniform3iv(this.addr,t),ut(e,t)}}function Sf(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ct(e,t))return;r.uniform4iv(this.addr,t),ut(e,t)}}function bf(r,t){const e=this.cache;e[0]!==t&&(r.uniform1ui(this.addr,t),e[0]=t)}function Mf(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ct(e,t))return;r.uniform2uiv(this.addr,t),ut(e,t)}}function Ef(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ct(e,t))return;r.uniform3uiv(this.addr,t),ut(e,t)}}function Tf(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ct(e,t))return;r.uniform4uiv(this.addr,t),ut(e,t)}}function Af(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?(pa.compareFunction=ol,s=pa):s=Sl,e.setTexture2D(t||s,i)}function Cf(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||Ml,i)}function wf(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||El,i)}function Rf(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||bl,i)}function Lf(r){switch(r){case 5126:return hf;case 35664:return df;case 35665:return ff;case 35666:return pf;case 35674:return mf;case 35675:return gf;case 35676:return _f;case 5124:case 35670:return vf;case 35667:case 35671:return xf;case 35668:case 35672:return yf;case 35669:case 35673:return Sf;case 5125:return bf;case 36294:return Mf;case 36295:return Ef;case 36296:return Tf;case 35678:case 36198:case 36298:case 36306:case 35682:return Af;case 35679:case 36299:case 36307:return Cf;case 35680:case 36300:case 36308:case 36293:return wf;case 36289:case 36303:case 36311:case 36292:return Rf}}function Df(r,t){r.uniform1fv(this.addr,t)}function Pf(r,t){const e=pi(t,this.size,2);r.uniform2fv(this.addr,e)}function If(r,t){const e=pi(t,this.size,3);r.uniform3fv(this.addr,e)}function Uf(r,t){const e=pi(t,this.size,4);r.uniform4fv(this.addr,e)}function Ff(r,t){const e=pi(t,this.size,4);r.uniformMatrix2fv(this.addr,!1,e)}function Nf(r,t){const e=pi(t,this.size,9);r.uniformMatrix3fv(this.addr,!1,e)}function Of(r,t){const e=pi(t,this.size,16);r.uniformMatrix4fv(this.addr,!1,e)}function Bf(r,t){r.uniform1iv(this.addr,t)}function zf(r,t){r.uniform2iv(this.addr,t)}function Vf(r,t){r.uniform3iv(this.addr,t)}function kf(r,t){r.uniform4iv(this.addr,t)}function Hf(r,t){r.uniform1uiv(this.addr,t)}function Gf(r,t){r.uniform2uiv(this.addr,t)}function Wf(r,t){r.uniform3uiv(this.addr,t)}function Xf(r,t){r.uniform4uiv(this.addr,t)}function qf(r,t,e){const n=this.cache,i=t.length,s=Tr(e,i);ct(n,s)||(r.uniform1iv(this.addr,s),ut(n,s));for(let o=0;o!==i;++o)e.setTexture2D(t[o]||Sl,s[o])}function Yf(r,t,e){const n=this.cache,i=t.length,s=Tr(e,i);ct(n,s)||(r.uniform1iv(this.addr,s),ut(n,s));for(let o=0;o!==i;++o)e.setTexture3D(t[o]||Ml,s[o])}function $f(r,t,e){const n=this.cache,i=t.length,s=Tr(e,i);ct(n,s)||(r.uniform1iv(this.addr,s),ut(n,s));for(let o=0;o!==i;++o)e.setTextureCube(t[o]||El,s[o])}function Zf(r,t,e){const n=this.cache,i=t.length,s=Tr(e,i);ct(n,s)||(r.uniform1iv(this.addr,s),ut(n,s));for(let o=0;o!==i;++o)e.setTexture2DArray(t[o]||bl,s[o])}function Kf(r){switch(r){case 5126:return Df;case 35664:return Pf;case 35665:return If;case 35666:return Uf;case 35674:return Ff;case 35675:return Nf;case 35676:return Of;case 5124:case 35670:return Bf;case 35667:case 35671:return zf;case 35668:case 35672:return Vf;case 35669:case 35673:return kf;case 5125:return Hf;case 36294:return Gf;case 36295:return Wf;case 36296:return Xf;case 35678:case 36198:case 36298:case 36306:case 35682:return qf;case 35679:case 36299:case 36307:return Yf;case 35680:case 36300:case 36308:case 36293:return $f;case 36289:case 36303:case 36311:case 36292:return Zf}}class jf{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Lf(e.type)}}class Jf{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Kf(e.type)}}class Qf{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let s=0,o=i.length;s!==o;++s){const a=i[s];a.setValue(t,e[a.id],n)}}}const ts=/(\w+)(\])?(\[|\.)?/g;function ya(r,t){r.seq.push(t),r.map[t.id]=t}function ep(r,t,e){const n=r.name,i=n.length;for(ts.lastIndex=0;;){const s=ts.exec(n),o=ts.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===i){ya(e,c===void 0?new jf(a,r,t):new Jf(a,r,t));break}else{let f=e.map[a];f===void 0&&(f=new Qf(a),ya(e,f)),e=f}}}class fr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const s=t.getActiveUniform(e,i),o=t.getUniformLocation(e,s.name);ep(s,o,this)}}setValue(t,e,n,i){const s=this.map[e];s!==void 0&&s.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let s=0,o=e.length;s!==o;++s){const a=e[s],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,s=t.length;i!==s;++i){const o=t[i];o.id in e&&n.push(o)}return n}}function Sa(r,t,e){const n=r.createShader(t);return r.shaderSource(n,e),r.compileShader(n),n}const tp=37297;let np=0;function ip(r,t){const e=r.split(`
`),n=[],i=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=i;o<s;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const ba=new Le;function rp(r){ke._getMatrix(ba,ke.workingColorSpace,r);const t=`mat3( ${ba.elements.map(e=>e.toFixed(4))} )`;switch(ke.getTransfer(r)){case Mr:return[t,"LinearTransferOETF"];case $e:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",r),[t,"LinearTransferOETF"]}}function Ma(r,t,e){const n=r.getShaderParameter(t,r.COMPILE_STATUS),i=r.getShaderInfoLog(t).trim();if(n&&i==="")return"";const s=/ERROR: 0:(\d+)/.exec(i);if(s){const o=parseInt(s[1]);return e.toUpperCase()+`

`+i+`

`+ip(r.getShaderSource(t),o)}else return i}function sp(r,t){const e=rp(t);return[`vec4 ${r}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function op(r,t){let e;switch(t){case Sc:e="Linear";break;case bc:e="Reinhard";break;case Mc:e="Cineon";break;case Ec:e="ACESFilmic";break;case Ac:e="AgX";break;case Cc:e="Neutral";break;case Tc:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+r+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const nr=new B;function ap(){ke.getLuminanceCoefficients(nr);const r=nr.x.toFixed(4),t=nr.y.toFixed(4),e=nr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function lp(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ei).join(`
`)}function cp(r){const t=[];for(const e in r){const n=r[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function up(r,t){const e={},n=r.getProgramParameter(t,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=r.getActiveAttrib(t,i),o=s.name;let a=1;s.type===r.FLOAT_MAT2&&(a=2),s.type===r.FLOAT_MAT3&&(a=3),s.type===r.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:r.getAttribLocation(t,o),locationSize:a}}return e}function Ei(r){return r!==""}function Ea(r,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ta(r,t){return r.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const hp=/^[ \t]*#include +<([\w\d./]+)>/gm;function ao(r){return r.replace(hp,fp)}const dp=new Map;function fp(r,t){let e=Pe[t];if(e===void 0){const n=dp.get(t);if(n!==void 0)e=Pe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ao(e)}const pp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Aa(r){return r.replace(pp,mp)}function mp(r,t,e,n){let i="";for(let s=parseInt(t);s<parseInt(e);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function Ca(r){let t=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?t+=`
#define HIGH_PRECISION`:r.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function gp(r){let t="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===Ya?t="SHADOWMAP_TYPE_PCF":r.shadowMapType===ec?t="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===Jt&&(t="SHADOWMAP_TYPE_VSM"),t}function _p(r){let t="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case oi:case ai:t="ENVMAP_TYPE_CUBE";break;case br:t="ENVMAP_TYPE_CUBE_UV";break}return t}function vp(r){let t="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case ai:t="ENVMAP_MODE_REFRACTION";break}return t}function xp(r){let t="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case uo:t="ENVMAP_BLENDING_MULTIPLY";break;case xc:t="ENVMAP_BLENDING_MIX";break;case yc:t="ENVMAP_BLENDING_ADD";break}return t}function yp(r){const t=r.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Sp(r,t,e,n){const i=r.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const l=gp(e),c=_p(e),u=vp(e),f=xp(e),p=yp(e),g=lp(e),v=cp(s),y=i.createProgram();let m,d,A=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v].filter(Ei).join(`
`),m.length>0&&(m+=`
`),d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v].filter(Ei).join(`
`),d.length>0&&(d+=`
`)):(m=[Ca(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ei).join(`
`),d=[Ca(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,v,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==gn?"#define TONE_MAPPING":"",e.toneMapping!==gn?Pe.tonemapping_pars_fragment:"",e.toneMapping!==gn?op("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Pe.colorspace_pars_fragment,sp("linearToOutputTexel",e.outputColorSpace),ap(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ei).join(`
`)),o=ao(o),o=Ea(o,e),o=Ta(o,e),a=ao(a),a=Ea(a,e),a=Ta(a,e),o=Aa(o),a=Aa(a),e.isRawShaderMaterial!==!0&&(A=`#version 300 es
`,m=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,d=["#define varying in",e.glslVersion===Vo?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Vo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);const T=A+m+o,E=A+d+a,z=Sa(i,i.VERTEX_SHADER,T),P=Sa(i,i.FRAGMENT_SHADER,E);i.attachShader(y,z),i.attachShader(y,P),e.index0AttributeName!==void 0?i.bindAttribLocation(y,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(y,0,"position"),i.linkProgram(y);function C(w){if(r.debug.checkShaderErrors){const W=i.getProgramInfoLog(y).trim(),V=i.getShaderInfoLog(z).trim(),Z=i.getShaderInfoLog(P).trim();let K=!0,q=!0;if(i.getProgramParameter(y,i.LINK_STATUS)===!1)if(K=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,y,z,P);else{const J=Ma(i,z,"vertex"),H=Ma(i,P,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(y,i.VALIDATE_STATUS)+`

Material Name: `+w.name+`
Material Type: `+w.type+`

Program Info Log: `+W+`
`+J+`
`+H)}else W!==""?console.warn("THREE.WebGLProgram: Program Info Log:",W):(V===""||Z==="")&&(q=!1);q&&(w.diagnostics={runnable:K,programLog:W,vertexShader:{log:V,prefix:m},fragmentShader:{log:Z,prefix:d}})}i.deleteShader(z),i.deleteShader(P),U=new fr(i,y),b=up(i,y)}let U;this.getUniforms=function(){return U===void 0&&C(this),U};let b;this.getAttributes=function(){return b===void 0&&C(this),b};let S=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=i.getProgramParameter(y,tp)),S},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=np++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=z,this.fragmentShader=P,this}let bp=0;class Mp{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new Ep(t),e.set(t,n)),n}}class Ep{constructor(t){this.id=bp++,this.code=t,this.usedTimes=0}}function Tp(r,t,e,n,i,s,o){const a=new ul,l=new Mp,c=new Set,u=[],f=i.logarithmicDepthBuffer,p=i.vertexTextures;let g=i.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function y(b){return c.add(b),b===0?"uv":`uv${b}`}function m(b,S,w,W,V){const Z=W.fog,K=V.geometry,q=b.isMeshStandardMaterial?W.environment:null,J=(b.isMeshStandardMaterial?e:t).get(b.envMap||q),H=J&&J.mapping===br?J.image.height:null,re=v[b.type];b.precision!==null&&(g=i.getMaxPrecision(b.precision),g!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",g,"instead."));const ue=K.morphAttributes.position||K.morphAttributes.normal||K.morphAttributes.color,ye=ue!==void 0?ue.length:0;let Ue=0;K.morphAttributes.position!==void 0&&(Ue=1),K.morphAttributes.normal!==void 0&&(Ue=2),K.morphAttributes.color!==void 0&&(Ue=3);let Ze,X,te,_e;if(re){const Ye=zt[re];Ze=Ye.vertexShader,X=Ye.fragmentShader}else Ze=b.vertexShader,X=b.fragmentShader,l.update(b),te=l.getVertexShaderID(b),_e=l.getFragmentShaderID(b);const se=r.getRenderTarget(),Ee=r.state.buffers.depth.getReversed(),Ce=V.isInstancedMesh===!0,Fe=V.isBatchedMesh===!0,nt=!!b.map,ze=!!b.matcap,at=!!J,I=!!b.aoMap,Tt=!!b.lightMap,Ne=!!b.bumpMap,Oe=!!b.normalMap,be=!!b.displacementMap,Je=!!b.emissiveMap,Se=!!b.metalnessMap,M=!!b.roughnessMap,_=b.anisotropy>0,F=b.clearcoat>0,Y=b.dispersion>0,j=b.iridescence>0,G=b.sheen>0,ve=b.transmission>0,oe=_&&!!b.anisotropyMap,he=F&&!!b.clearcoatMap,Ve=F&&!!b.clearcoatNormalMap,Q=F&&!!b.clearcoatRoughnessMap,de=j&&!!b.iridescenceMap,Me=j&&!!b.iridescenceThicknessMap,Te=G&&!!b.sheenColorMap,fe=G&&!!b.sheenRoughnessMap,Be=!!b.specularMap,De=!!b.specularColorMap,Ke=!!b.specularIntensityMap,R=ve&&!!b.transmissionMap,ie=ve&&!!b.thicknessMap,k=!!b.gradientMap,$=!!b.alphaMap,ce=b.alphaTest>0,ae=!!b.alphaHash,we=!!b.extensions;let rt=gn;b.toneMapped&&(se===null||se.isXRRenderTarget===!0)&&(rt=r.toneMapping);const dt={shaderID:re,shaderType:b.type,shaderName:b.name,vertexShader:Ze,fragmentShader:X,defines:b.defines,customVertexShaderID:te,customFragmentShaderID:_e,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:g,batching:Fe,batchingColor:Fe&&V._colorsTexture!==null,instancing:Ce,instancingColor:Ce&&V.instanceColor!==null,instancingMorph:Ce&&V.morphTexture!==null,supportsVertexTextures:p,outputColorSpace:se===null?r.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:hi,alphaToCoverage:!!b.alphaToCoverage,map:nt,matcap:ze,envMap:at,envMapMode:at&&J.mapping,envMapCubeUVHeight:H,aoMap:I,lightMap:Tt,bumpMap:Ne,normalMap:Oe,displacementMap:p&&be,emissiveMap:Je,normalMapObjectSpace:Oe&&b.normalMapType===Dc,normalMapTangentSpace:Oe&&b.normalMapType===sl,metalnessMap:Se,roughnessMap:M,anisotropy:_,anisotropyMap:oe,clearcoat:F,clearcoatMap:he,clearcoatNormalMap:Ve,clearcoatRoughnessMap:Q,dispersion:Y,iridescence:j,iridescenceMap:de,iridescenceThicknessMap:Me,sheen:G,sheenColorMap:Te,sheenRoughnessMap:fe,specularMap:Be,specularColorMap:De,specularIntensityMap:Ke,transmission:ve,transmissionMap:R,thicknessMap:ie,gradientMap:k,opaque:b.transparent===!1&&b.blending===ti&&b.alphaToCoverage===!1,alphaMap:$,alphaTest:ce,alphaHash:ae,combine:b.combine,mapUv:nt&&y(b.map.channel),aoMapUv:I&&y(b.aoMap.channel),lightMapUv:Tt&&y(b.lightMap.channel),bumpMapUv:Ne&&y(b.bumpMap.channel),normalMapUv:Oe&&y(b.normalMap.channel),displacementMapUv:be&&y(b.displacementMap.channel),emissiveMapUv:Je&&y(b.emissiveMap.channel),metalnessMapUv:Se&&y(b.metalnessMap.channel),roughnessMapUv:M&&y(b.roughnessMap.channel),anisotropyMapUv:oe&&y(b.anisotropyMap.channel),clearcoatMapUv:he&&y(b.clearcoatMap.channel),clearcoatNormalMapUv:Ve&&y(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Q&&y(b.clearcoatRoughnessMap.channel),iridescenceMapUv:de&&y(b.iridescenceMap.channel),iridescenceThicknessMapUv:Me&&y(b.iridescenceThicknessMap.channel),sheenColorMapUv:Te&&y(b.sheenColorMap.channel),sheenRoughnessMapUv:fe&&y(b.sheenRoughnessMap.channel),specularMapUv:Be&&y(b.specularMap.channel),specularColorMapUv:De&&y(b.specularColorMap.channel),specularIntensityMapUv:Ke&&y(b.specularIntensityMap.channel),transmissionMapUv:R&&y(b.transmissionMap.channel),thicknessMapUv:ie&&y(b.thicknessMap.channel),alphaMapUv:$&&y(b.alphaMap.channel),vertexTangents:!!K.attributes.tangent&&(Oe||_),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!K.attributes.color&&K.attributes.color.itemSize===4,pointsUvs:V.isPoints===!0&&!!K.attributes.uv&&(nt||$),fog:!!Z,useFog:b.fog===!0,fogExp2:!!Z&&Z.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:f,reverseDepthBuffer:Ee,skinning:V.isSkinnedMesh===!0,morphTargets:K.morphAttributes.position!==void 0,morphNormals:K.morphAttributes.normal!==void 0,morphColors:K.morphAttributes.color!==void 0,morphTargetsCount:ye,morphTextureStride:Ue,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:b.dithering,shadowMapEnabled:r.shadowMap.enabled&&w.length>0,shadowMapType:r.shadowMap.type,toneMapping:rt,decodeVideoTexture:nt&&b.map.isVideoTexture===!0&&ke.getTransfer(b.map.colorSpace)===$e,decodeVideoTextureEmissive:Je&&b.emissiveMap.isVideoTexture===!0&&ke.getTransfer(b.emissiveMap.colorSpace)===$e,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===Qt,flipSided:b.side===yt,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:we&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(we&&b.extensions.multiDraw===!0||Fe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return dt.vertexUv1s=c.has(1),dt.vertexUv2s=c.has(2),dt.vertexUv3s=c.has(3),c.clear(),dt}function d(b){const S=[];if(b.shaderID?S.push(b.shaderID):(S.push(b.customVertexShaderID),S.push(b.customFragmentShaderID)),b.defines!==void 0)for(const w in b.defines)S.push(w),S.push(b.defines[w]);return b.isRawShaderMaterial===!1&&(A(S,b),T(S,b),S.push(r.outputColorSpace)),S.push(b.customProgramCacheKey),S.join()}function A(b,S){b.push(S.precision),b.push(S.outputColorSpace),b.push(S.envMapMode),b.push(S.envMapCubeUVHeight),b.push(S.mapUv),b.push(S.alphaMapUv),b.push(S.lightMapUv),b.push(S.aoMapUv),b.push(S.bumpMapUv),b.push(S.normalMapUv),b.push(S.displacementMapUv),b.push(S.emissiveMapUv),b.push(S.metalnessMapUv),b.push(S.roughnessMapUv),b.push(S.anisotropyMapUv),b.push(S.clearcoatMapUv),b.push(S.clearcoatNormalMapUv),b.push(S.clearcoatRoughnessMapUv),b.push(S.iridescenceMapUv),b.push(S.iridescenceThicknessMapUv),b.push(S.sheenColorMapUv),b.push(S.sheenRoughnessMapUv),b.push(S.specularMapUv),b.push(S.specularColorMapUv),b.push(S.specularIntensityMapUv),b.push(S.transmissionMapUv),b.push(S.thicknessMapUv),b.push(S.combine),b.push(S.fogExp2),b.push(S.sizeAttenuation),b.push(S.morphTargetsCount),b.push(S.morphAttributeCount),b.push(S.numDirLights),b.push(S.numPointLights),b.push(S.numSpotLights),b.push(S.numSpotLightMaps),b.push(S.numHemiLights),b.push(S.numRectAreaLights),b.push(S.numDirLightShadows),b.push(S.numPointLightShadows),b.push(S.numSpotLightShadows),b.push(S.numSpotLightShadowsWithMaps),b.push(S.numLightProbes),b.push(S.shadowMapType),b.push(S.toneMapping),b.push(S.numClippingPlanes),b.push(S.numClipIntersection),b.push(S.depthPacking)}function T(b,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),b.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reverseDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),b.push(a.mask)}function E(b){const S=v[b.type];let w;if(S){const W=zt[S];w=au.clone(W.uniforms)}else w=b.uniforms;return w}function z(b,S){let w;for(let W=0,V=u.length;W<V;W++){const Z=u[W];if(Z.cacheKey===S){w=Z,++w.usedTimes;break}}return w===void 0&&(w=new Sp(r,S,b,s),u.push(w)),w}function P(b){if(--b.usedTimes===0){const S=u.indexOf(b);u[S]=u[u.length-1],u.pop(),b.destroy()}}function C(b){l.remove(b)}function U(){l.dispose()}return{getParameters:m,getProgramCacheKey:d,getUniforms:E,acquireProgram:z,releaseProgram:P,releaseShaderCache:C,programs:u,dispose:U}}function Ap(){let r=new WeakMap;function t(o){return r.has(o)}function e(o){let a=r.get(o);return a===void 0&&(a={},r.set(o,a)),a}function n(o){r.delete(o)}function i(o,a,l){r.get(o)[a]=l}function s(){r=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:s}}function Cp(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.material.id!==t.material.id?r.material.id-t.material.id:r.z!==t.z?r.z-t.z:r.id-t.id}function wa(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.z!==t.z?t.z-r.z:r.id-t.id}function Ra(){const r=[];let t=0;const e=[],n=[],i=[];function s(){t=0,e.length=0,n.length=0,i.length=0}function o(f,p,g,v,y,m){let d=r[t];return d===void 0?(d={id:f.id,object:f,geometry:p,material:g,groupOrder:v,renderOrder:f.renderOrder,z:y,group:m},r[t]=d):(d.id=f.id,d.object=f,d.geometry=p,d.material=g,d.groupOrder=v,d.renderOrder=f.renderOrder,d.z=y,d.group=m),t++,d}function a(f,p,g,v,y,m){const d=o(f,p,g,v,y,m);g.transmission>0?n.push(d):g.transparent===!0?i.push(d):e.push(d)}function l(f,p,g,v,y,m){const d=o(f,p,g,v,y,m);g.transmission>0?n.unshift(d):g.transparent===!0?i.unshift(d):e.unshift(d)}function c(f,p){e.length>1&&e.sort(f||Cp),n.length>1&&n.sort(p||wa),i.length>1&&i.sort(p||wa)}function u(){for(let f=t,p=r.length;f<p;f++){const g=r[f];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:i,init:s,push:a,unshift:l,finish:u,sort:c}}function wp(){let r=new WeakMap;function t(n,i){const s=r.get(n);let o;return s===void 0?(o=new Ra,r.set(n,[o])):i>=s.length?(o=new Ra,s.push(o)):o=s[i],o}function e(){r=new WeakMap}return{get:t,dispose:e}}function Rp(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new B,color:new Ge};break;case"SpotLight":e={position:new B,direction:new B,color:new Ge,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new B,color:new Ge,distance:0,decay:0};break;case"HemisphereLight":e={direction:new B,skyColor:new Ge,groundColor:new Ge};break;case"RectAreaLight":e={color:new Ge,position:new B,halfWidth:new B,halfHeight:new B};break}return r[t.id]=e,e}}}function Lp(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[t.id]=e,e}}}let Dp=0;function Pp(r,t){return(t.castShadow?2:0)-(r.castShadow?2:0)+(t.map?1:0)-(r.map?1:0)}function Ip(r){const t=new Rp,e=Lp(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new B);const i=new B,s=new ot,o=new ot;function a(c){let u=0,f=0,p=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let g=0,v=0,y=0,m=0,d=0,A=0,T=0,E=0,z=0,P=0,C=0;c.sort(Pp);for(let b=0,S=c.length;b<S;b++){const w=c[b],W=w.color,V=w.intensity,Z=w.distance,K=w.shadow&&w.shadow.map?w.shadow.map.texture:null;if(w.isAmbientLight)u+=W.r*V,f+=W.g*V,p+=W.b*V;else if(w.isLightProbe){for(let q=0;q<9;q++)n.probe[q].addScaledVector(w.sh.coefficients[q],V);C++}else if(w.isDirectionalLight){const q=t.get(w);if(q.color.copy(w.color).multiplyScalar(w.intensity),w.castShadow){const J=w.shadow,H=e.get(w);H.shadowIntensity=J.intensity,H.shadowBias=J.bias,H.shadowNormalBias=J.normalBias,H.shadowRadius=J.radius,H.shadowMapSize=J.mapSize,n.directionalShadow[g]=H,n.directionalShadowMap[g]=K,n.directionalShadowMatrix[g]=w.shadow.matrix,A++}n.directional[g]=q,g++}else if(w.isSpotLight){const q=t.get(w);q.position.setFromMatrixPosition(w.matrixWorld),q.color.copy(W).multiplyScalar(V),q.distance=Z,q.coneCos=Math.cos(w.angle),q.penumbraCos=Math.cos(w.angle*(1-w.penumbra)),q.decay=w.decay,n.spot[y]=q;const J=w.shadow;if(w.map&&(n.spotLightMap[z]=w.map,z++,J.updateMatrices(w),w.castShadow&&P++),n.spotLightMatrix[y]=J.matrix,w.castShadow){const H=e.get(w);H.shadowIntensity=J.intensity,H.shadowBias=J.bias,H.shadowNormalBias=J.normalBias,H.shadowRadius=J.radius,H.shadowMapSize=J.mapSize,n.spotShadow[y]=H,n.spotShadowMap[y]=K,E++}y++}else if(w.isRectAreaLight){const q=t.get(w);q.color.copy(W).multiplyScalar(V),q.halfWidth.set(w.width*.5,0,0),q.halfHeight.set(0,w.height*.5,0),n.rectArea[m]=q,m++}else if(w.isPointLight){const q=t.get(w);if(q.color.copy(w.color).multiplyScalar(w.intensity),q.distance=w.distance,q.decay=w.decay,w.castShadow){const J=w.shadow,H=e.get(w);H.shadowIntensity=J.intensity,H.shadowBias=J.bias,H.shadowNormalBias=J.normalBias,H.shadowRadius=J.radius,H.shadowMapSize=J.mapSize,H.shadowCameraNear=J.camera.near,H.shadowCameraFar=J.camera.far,n.pointShadow[v]=H,n.pointShadowMap[v]=K,n.pointShadowMatrix[v]=w.shadow.matrix,T++}n.point[v]=q,v++}else if(w.isHemisphereLight){const q=t.get(w);q.skyColor.copy(w.color).multiplyScalar(V),q.groundColor.copy(w.groundColor).multiplyScalar(V),n.hemi[d]=q,d++}}m>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ne.LTC_FLOAT_1,n.rectAreaLTC2=ne.LTC_FLOAT_2):(n.rectAreaLTC1=ne.LTC_HALF_1,n.rectAreaLTC2=ne.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=p;const U=n.hash;(U.directionalLength!==g||U.pointLength!==v||U.spotLength!==y||U.rectAreaLength!==m||U.hemiLength!==d||U.numDirectionalShadows!==A||U.numPointShadows!==T||U.numSpotShadows!==E||U.numSpotMaps!==z||U.numLightProbes!==C)&&(n.directional.length=g,n.spot.length=y,n.rectArea.length=m,n.point.length=v,n.hemi.length=d,n.directionalShadow.length=A,n.directionalShadowMap.length=A,n.pointShadow.length=T,n.pointShadowMap.length=T,n.spotShadow.length=E,n.spotShadowMap.length=E,n.directionalShadowMatrix.length=A,n.pointShadowMatrix.length=T,n.spotLightMatrix.length=E+z-P,n.spotLightMap.length=z,n.numSpotLightShadowsWithMaps=P,n.numLightProbes=C,U.directionalLength=g,U.pointLength=v,U.spotLength=y,U.rectAreaLength=m,U.hemiLength=d,U.numDirectionalShadows=A,U.numPointShadows=T,U.numSpotShadows=E,U.numSpotMaps=z,U.numLightProbes=C,n.version=Dp++)}function l(c,u){let f=0,p=0,g=0,v=0,y=0;const m=u.matrixWorldInverse;for(let d=0,A=c.length;d<A;d++){const T=c[d];if(T.isDirectionalLight){const E=n.directional[f];E.direction.setFromMatrixPosition(T.matrixWorld),i.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(i),E.direction.transformDirection(m),f++}else if(T.isSpotLight){const E=n.spot[g];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(m),E.direction.setFromMatrixPosition(T.matrixWorld),i.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(i),E.direction.transformDirection(m),g++}else if(T.isRectAreaLight){const E=n.rectArea[v];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(m),o.identity(),s.copy(T.matrixWorld),s.premultiply(m),o.extractRotation(s),E.halfWidth.set(T.width*.5,0,0),E.halfHeight.set(0,T.height*.5,0),E.halfWidth.applyMatrix4(o),E.halfHeight.applyMatrix4(o),v++}else if(T.isPointLight){const E=n.point[p];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(m),p++}else if(T.isHemisphereLight){const E=n.hemi[y];E.direction.setFromMatrixPosition(T.matrixWorld),E.direction.transformDirection(m),y++}}}return{setup:a,setupView:l,state:n}}function La(r){const t=new Ip(r),e=[],n=[];function i(u){c.camera=u,e.length=0,n.length=0}function s(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function Up(r){let t=new WeakMap;function e(i,s=0){const o=t.get(i);let a;return o===void 0?(a=new La(r),t.set(i,[a])):s>=o.length?(a=new La(r),o.push(a)):a=o[s],a}function n(){t=new WeakMap}return{get:e,dispose:n}}class Fp extends Pi{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Rc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Np extends Pi{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Op=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Bp=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function zp(r,t,e){let n=new xo;const i=new qe,s=new qe,o=new st,a=new Fp({depthPacking:Lc}),l=new Np,c={},u=e.maxTextureSize,f={[_n]:yt,[yt]:_n,[Qt]:Qt},p=new vn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new qe},radius:{value:4}},vertexShader:Op,fragmentShader:Bp}),g=p.clone();g.defines.HORIZONTAL_PASS=1;const v=new On;v.setAttribute("position",new Gt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const y=new kt(v,p),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ya;let d=this.type;this.render=function(P,C,U){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||P.length===0)return;const b=r.getRenderTarget(),S=r.getActiveCubeFace(),w=r.getActiveMipmapLevel(),W=r.state;W.setBlending(mn),W.buffers.color.setClear(1,1,1,1),W.buffers.depth.setTest(!0),W.setScissorTest(!1);const V=d!==Jt&&this.type===Jt,Z=d===Jt&&this.type!==Jt;for(let K=0,q=P.length;K<q;K++){const J=P[K],H=J.shadow;if(H===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;i.copy(H.mapSize);const re=H.getFrameExtents();if(i.multiply(re),s.copy(H.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(s.x=Math.floor(u/re.x),i.x=s.x*re.x,H.mapSize.x=s.x),i.y>u&&(s.y=Math.floor(u/re.y),i.y=s.y*re.y,H.mapSize.y=s.y)),H.map===null||V===!0||Z===!0){const ye=this.type!==Jt?{minFilter:Ot,magFilter:Ot}:{};H.map!==null&&H.map.dispose(),H.map=new Nn(i.x,i.y,ye),H.map.texture.name=J.name+".shadowMap",H.camera.updateProjectionMatrix()}r.setRenderTarget(H.map),r.clear();const ue=H.getViewportCount();for(let ye=0;ye<ue;ye++){const Ue=H.getViewport(ye);o.set(s.x*Ue.x,s.y*Ue.y,s.x*Ue.z,s.y*Ue.w),W.viewport(o),H.updateMatrices(J,ye),n=H.getFrustum(),E(C,U,H.camera,J,this.type)}H.isPointLightShadow!==!0&&this.type===Jt&&A(H,U),H.needsUpdate=!1}d=this.type,m.needsUpdate=!1,r.setRenderTarget(b,S,w)};function A(P,C){const U=t.update(y);p.defines.VSM_SAMPLES!==P.blurSamples&&(p.defines.VSM_SAMPLES=P.blurSamples,g.defines.VSM_SAMPLES=P.blurSamples,p.needsUpdate=!0,g.needsUpdate=!0),P.mapPass===null&&(P.mapPass=new Nn(i.x,i.y)),p.uniforms.shadow_pass.value=P.map.texture,p.uniforms.resolution.value=P.mapSize,p.uniforms.radius.value=P.radius,r.setRenderTarget(P.mapPass),r.clear(),r.renderBufferDirect(C,null,U,p,y,null),g.uniforms.shadow_pass.value=P.mapPass.texture,g.uniforms.resolution.value=P.mapSize,g.uniforms.radius.value=P.radius,r.setRenderTarget(P.map),r.clear(),r.renderBufferDirect(C,null,U,g,y,null)}function T(P,C,U,b){let S=null;const w=U.isPointLight===!0?P.customDistanceMaterial:P.customDepthMaterial;if(w!==void 0)S=w;else if(S=U.isPointLight===!0?l:a,r.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){const W=S.uuid,V=C.uuid;let Z=c[W];Z===void 0&&(Z={},c[W]=Z);let K=Z[V];K===void 0&&(K=S.clone(),Z[V]=K,C.addEventListener("dispose",z)),S=K}if(S.visible=C.visible,S.wireframe=C.wireframe,b===Jt?S.side=C.shadowSide!==null?C.shadowSide:C.side:S.side=C.shadowSide!==null?C.shadowSide:f[C.side],S.alphaMap=C.alphaMap,S.alphaTest=C.alphaTest,S.map=C.map,S.clipShadows=C.clipShadows,S.clippingPlanes=C.clippingPlanes,S.clipIntersection=C.clipIntersection,S.displacementMap=C.displacementMap,S.displacementScale=C.displacementScale,S.displacementBias=C.displacementBias,S.wireframeLinewidth=C.wireframeLinewidth,S.linewidth=C.linewidth,U.isPointLight===!0&&S.isMeshDistanceMaterial===!0){const W=r.properties.get(S);W.light=U}return S}function E(P,C,U,b,S){if(P.visible===!1)return;if(P.layers.test(C.layers)&&(P.isMesh||P.isLine||P.isPoints)&&(P.castShadow||P.receiveShadow&&S===Jt)&&(!P.frustumCulled||n.intersectsObject(P))){P.modelViewMatrix.multiplyMatrices(U.matrixWorldInverse,P.matrixWorld);const V=t.update(P),Z=P.material;if(Array.isArray(Z)){const K=V.groups;for(let q=0,J=K.length;q<J;q++){const H=K[q],re=Z[H.materialIndex];if(re&&re.visible){const ue=T(P,re,b,S);P.onBeforeShadow(r,P,C,U,V,ue,H),r.renderBufferDirect(U,null,V,ue,P,H),P.onAfterShadow(r,P,C,U,V,ue,H)}}}else if(Z.visible){const K=T(P,Z,b,S);P.onBeforeShadow(r,P,C,U,V,K,null),r.renderBufferDirect(U,null,V,K,P,null),P.onAfterShadow(r,P,C,U,V,K,null)}}const W=P.children;for(let V=0,Z=W.length;V<Z;V++)E(W[V],C,U,b,S)}function z(P){P.target.removeEventListener("dispose",z);for(const U in c){const b=c[U],S=P.target.uuid;S in b&&(b[S].dispose(),delete b[S])}}}const Vp={[Ms]:Es,[Ts]:ws,[As]:Rs,[si]:Cs,[Es]:Ms,[ws]:Ts,[Rs]:As,[Cs]:si};function kp(r,t){function e(){let R=!1;const ie=new st;let k=null;const $=new st(0,0,0,0);return{setMask:function(ce){k!==ce&&!R&&(r.colorMask(ce,ce,ce,ce),k=ce)},setLocked:function(ce){R=ce},setClear:function(ce,ae,we,rt,dt){dt===!0&&(ce*=rt,ae*=rt,we*=rt),ie.set(ce,ae,we,rt),$.equals(ie)===!1&&(r.clearColor(ce,ae,we,rt),$.copy(ie))},reset:function(){R=!1,k=null,$.set(-1,0,0,0)}}}function n(){let R=!1,ie=!1,k=null,$=null,ce=null;return{setReversed:function(ae){if(ie!==ae){const we=t.get("EXT_clip_control");ie?we.clipControlEXT(we.LOWER_LEFT_EXT,we.ZERO_TO_ONE_EXT):we.clipControlEXT(we.LOWER_LEFT_EXT,we.NEGATIVE_ONE_TO_ONE_EXT);const rt=ce;ce=null,this.setClear(rt)}ie=ae},getReversed:function(){return ie},setTest:function(ae){ae?se(r.DEPTH_TEST):Ee(r.DEPTH_TEST)},setMask:function(ae){k!==ae&&!R&&(r.depthMask(ae),k=ae)},setFunc:function(ae){if(ie&&(ae=Vp[ae]),$!==ae){switch(ae){case Ms:r.depthFunc(r.NEVER);break;case Es:r.depthFunc(r.ALWAYS);break;case Ts:r.depthFunc(r.LESS);break;case si:r.depthFunc(r.LEQUAL);break;case As:r.depthFunc(r.EQUAL);break;case Cs:r.depthFunc(r.GEQUAL);break;case ws:r.depthFunc(r.GREATER);break;case Rs:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}$=ae}},setLocked:function(ae){R=ae},setClear:function(ae){ce!==ae&&(ie&&(ae=1-ae),r.clearDepth(ae),ce=ae)},reset:function(){R=!1,k=null,$=null,ce=null,ie=!1}}}function i(){let R=!1,ie=null,k=null,$=null,ce=null,ae=null,we=null,rt=null,dt=null;return{setTest:function(Ye){R||(Ye?se(r.STENCIL_TEST):Ee(r.STENCIL_TEST))},setMask:function(Ye){ie!==Ye&&!R&&(r.stencilMask(Ye),ie=Ye)},setFunc:function(Ye,Lt,Xt){(k!==Ye||$!==Lt||ce!==Xt)&&(r.stencilFunc(Ye,Lt,Xt),k=Ye,$=Lt,ce=Xt)},setOp:function(Ye,Lt,Xt){(ae!==Ye||we!==Lt||rt!==Xt)&&(r.stencilOp(Ye,Lt,Xt),ae=Ye,we=Lt,rt=Xt)},setLocked:function(Ye){R=Ye},setClear:function(Ye){dt!==Ye&&(r.clearStencil(Ye),dt=Ye)},reset:function(){R=!1,ie=null,k=null,$=null,ce=null,ae=null,we=null,rt=null,dt=null}}}const s=new e,o=new n,a=new i,l=new WeakMap,c=new WeakMap;let u={},f={},p=new WeakMap,g=[],v=null,y=!1,m=null,d=null,A=null,T=null,E=null,z=null,P=null,C=new Ge(0,0,0),U=0,b=!1,S=null,w=null,W=null,V=null,Z=null;const K=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let q=!1,J=0;const H=r.getParameter(r.VERSION);H.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(H)[1]),q=J>=1):H.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(H)[1]),q=J>=2);let re=null,ue={};const ye=r.getParameter(r.SCISSOR_BOX),Ue=r.getParameter(r.VIEWPORT),Ze=new st().fromArray(ye),X=new st().fromArray(Ue);function te(R,ie,k,$){const ce=new Uint8Array(4),ae=r.createTexture();r.bindTexture(R,ae),r.texParameteri(R,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(R,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let we=0;we<k;we++)R===r.TEXTURE_3D||R===r.TEXTURE_2D_ARRAY?r.texImage3D(ie,0,r.RGBA,1,1,$,0,r.RGBA,r.UNSIGNED_BYTE,ce):r.texImage2D(ie+we,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,ce);return ae}const _e={};_e[r.TEXTURE_2D]=te(r.TEXTURE_2D,r.TEXTURE_2D,1),_e[r.TEXTURE_CUBE_MAP]=te(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),_e[r.TEXTURE_2D_ARRAY]=te(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),_e[r.TEXTURE_3D]=te(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),se(r.DEPTH_TEST),o.setFunc(si),Ne(!1),Oe(Uo),se(r.CULL_FACE),I(mn);function se(R){u[R]!==!0&&(r.enable(R),u[R]=!0)}function Ee(R){u[R]!==!1&&(r.disable(R),u[R]=!1)}function Ce(R,ie){return f[R]!==ie?(r.bindFramebuffer(R,ie),f[R]=ie,R===r.DRAW_FRAMEBUFFER&&(f[r.FRAMEBUFFER]=ie),R===r.FRAMEBUFFER&&(f[r.DRAW_FRAMEBUFFER]=ie),!0):!1}function Fe(R,ie){let k=g,$=!1;if(R){k=p.get(ie),k===void 0&&(k=[],p.set(ie,k));const ce=R.textures;if(k.length!==ce.length||k[0]!==r.COLOR_ATTACHMENT0){for(let ae=0,we=ce.length;ae<we;ae++)k[ae]=r.COLOR_ATTACHMENT0+ae;k.length=ce.length,$=!0}}else k[0]!==r.BACK&&(k[0]=r.BACK,$=!0);$&&r.drawBuffers(k)}function nt(R){return v!==R?(r.useProgram(R),v=R,!0):!1}const ze={[Rn]:r.FUNC_ADD,[nc]:r.FUNC_SUBTRACT,[ic]:r.FUNC_REVERSE_SUBTRACT};ze[rc]=r.MIN,ze[sc]=r.MAX;const at={[oc]:r.ZERO,[ac]:r.ONE,[lc]:r.SRC_COLOR,[Ss]:r.SRC_ALPHA,[pc]:r.SRC_ALPHA_SATURATE,[dc]:r.DST_COLOR,[uc]:r.DST_ALPHA,[cc]:r.ONE_MINUS_SRC_COLOR,[bs]:r.ONE_MINUS_SRC_ALPHA,[fc]:r.ONE_MINUS_DST_COLOR,[hc]:r.ONE_MINUS_DST_ALPHA,[mc]:r.CONSTANT_COLOR,[gc]:r.ONE_MINUS_CONSTANT_COLOR,[_c]:r.CONSTANT_ALPHA,[vc]:r.ONE_MINUS_CONSTANT_ALPHA};function I(R,ie,k,$,ce,ae,we,rt,dt,Ye){if(R===mn){y===!0&&(Ee(r.BLEND),y=!1);return}if(y===!1&&(se(r.BLEND),y=!0),R!==tc){if(R!==m||Ye!==b){if((d!==Rn||E!==Rn)&&(r.blendEquation(r.FUNC_ADD),d=Rn,E=Rn),Ye)switch(R){case ti:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Fo:r.blendFunc(r.ONE,r.ONE);break;case No:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case Oo:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}else switch(R){case ti:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Fo:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case No:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case Oo:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}A=null,T=null,z=null,P=null,C.set(0,0,0),U=0,m=R,b=Ye}return}ce=ce||ie,ae=ae||k,we=we||$,(ie!==d||ce!==E)&&(r.blendEquationSeparate(ze[ie],ze[ce]),d=ie,E=ce),(k!==A||$!==T||ae!==z||we!==P)&&(r.blendFuncSeparate(at[k],at[$],at[ae],at[we]),A=k,T=$,z=ae,P=we),(rt.equals(C)===!1||dt!==U)&&(r.blendColor(rt.r,rt.g,rt.b,dt),C.copy(rt),U=dt),m=R,b=!1}function Tt(R,ie){R.side===Qt?Ee(r.CULL_FACE):se(r.CULL_FACE);let k=R.side===yt;ie&&(k=!k),Ne(k),R.blending===ti&&R.transparent===!1?I(mn):I(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.blendColor,R.blendAlpha,R.premultipliedAlpha),o.setFunc(R.depthFunc),o.setTest(R.depthTest),o.setMask(R.depthWrite),s.setMask(R.colorWrite);const $=R.stencilWrite;a.setTest($),$&&(a.setMask(R.stencilWriteMask),a.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),a.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),Je(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===!0?se(r.SAMPLE_ALPHA_TO_COVERAGE):Ee(r.SAMPLE_ALPHA_TO_COVERAGE)}function Ne(R){S!==R&&(R?r.frontFace(r.CW):r.frontFace(r.CCW),S=R)}function Oe(R){R!==Jl?(se(r.CULL_FACE),R!==w&&(R===Uo?r.cullFace(r.BACK):R===Ql?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):Ee(r.CULL_FACE),w=R}function be(R){R!==W&&(q&&r.lineWidth(R),W=R)}function Je(R,ie,k){R?(se(r.POLYGON_OFFSET_FILL),(V!==ie||Z!==k)&&(r.polygonOffset(ie,k),V=ie,Z=k)):Ee(r.POLYGON_OFFSET_FILL)}function Se(R){R?se(r.SCISSOR_TEST):Ee(r.SCISSOR_TEST)}function M(R){R===void 0&&(R=r.TEXTURE0+K-1),re!==R&&(r.activeTexture(R),re=R)}function _(R,ie,k){k===void 0&&(re===null?k=r.TEXTURE0+K-1:k=re);let $=ue[k];$===void 0&&($={type:void 0,texture:void 0},ue[k]=$),($.type!==R||$.texture!==ie)&&(re!==k&&(r.activeTexture(k),re=k),r.bindTexture(R,ie||_e[R]),$.type=R,$.texture=ie)}function F(){const R=ue[re];R!==void 0&&R.type!==void 0&&(r.bindTexture(R.type,null),R.type=void 0,R.texture=void 0)}function Y(){try{r.compressedTexImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function j(){try{r.compressedTexImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function G(){try{r.texSubImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ve(){try{r.texSubImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function oe(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function he(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Ve(){try{r.texStorage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Q(){try{r.texStorage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function de(){try{r.texImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Me(){try{r.texImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Te(R){Ze.equals(R)===!1&&(r.scissor(R.x,R.y,R.z,R.w),Ze.copy(R))}function fe(R){X.equals(R)===!1&&(r.viewport(R.x,R.y,R.z,R.w),X.copy(R))}function Be(R,ie){let k=c.get(ie);k===void 0&&(k=new WeakMap,c.set(ie,k));let $=k.get(R);$===void 0&&($=r.getUniformBlockIndex(ie,R.name),k.set(R,$))}function De(R,ie){const $=c.get(ie).get(R);l.get(ie)!==$&&(r.uniformBlockBinding(ie,$,R.__bindingPointIndex),l.set(ie,$))}function Ke(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),o.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),u={},re=null,ue={},f={},p=new WeakMap,g=[],v=null,y=!1,m=null,d=null,A=null,T=null,E=null,z=null,P=null,C=new Ge(0,0,0),U=0,b=!1,S=null,w=null,W=null,V=null,Z=null,Ze.set(0,0,r.canvas.width,r.canvas.height),X.set(0,0,r.canvas.width,r.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:se,disable:Ee,bindFramebuffer:Ce,drawBuffers:Fe,useProgram:nt,setBlending:I,setMaterial:Tt,setFlipSided:Ne,setCullFace:Oe,setLineWidth:be,setPolygonOffset:Je,setScissorTest:Se,activeTexture:M,bindTexture:_,unbindTexture:F,compressedTexImage2D:Y,compressedTexImage3D:j,texImage2D:de,texImage3D:Me,updateUBOMapping:Be,uniformBlockBinding:De,texStorage2D:Ve,texStorage3D:Q,texSubImage2D:G,texSubImage3D:ve,compressedTexSubImage2D:oe,compressedTexSubImage3D:he,scissor:Te,viewport:fe,reset:Ke}}function Da(r,t,e,n){const i=Hp(n);switch(e){case Ja:return r*t;case el:return r*t;case tl:return r*t*2;case nl:return r*t/i.components*i.byteLength;case mo:return r*t/i.components*i.byteLength;case il:return r*t*2/i.components*i.byteLength;case go:return r*t*2/i.components*i.byteLength;case Qa:return r*t*3/i.components*i.byteLength;case Nt:return r*t*4/i.components*i.byteLength;case _o:return r*t*4/i.components*i.byteLength;case lr:case cr:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case ur:case hr:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Fs:case Os:return Math.max(r,16)*Math.max(t,8)/4;case Us:case Ns:return Math.max(r,8)*Math.max(t,8)/2;case Bs:case zs:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case Vs:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case ks:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Hs:return Math.floor((r+4)/5)*Math.floor((t+3)/4)*16;case Gs:return Math.floor((r+4)/5)*Math.floor((t+4)/5)*16;case Ws:return Math.floor((r+5)/6)*Math.floor((t+4)/5)*16;case Xs:return Math.floor((r+5)/6)*Math.floor((t+5)/6)*16;case qs:return Math.floor((r+7)/8)*Math.floor((t+4)/5)*16;case Ys:return Math.floor((r+7)/8)*Math.floor((t+5)/6)*16;case $s:return Math.floor((r+7)/8)*Math.floor((t+7)/8)*16;case Zs:return Math.floor((r+9)/10)*Math.floor((t+4)/5)*16;case Ks:return Math.floor((r+9)/10)*Math.floor((t+5)/6)*16;case js:return Math.floor((r+9)/10)*Math.floor((t+7)/8)*16;case Js:return Math.floor((r+9)/10)*Math.floor((t+9)/10)*16;case Qs:return Math.floor((r+11)/12)*Math.floor((t+9)/10)*16;case eo:return Math.floor((r+11)/12)*Math.floor((t+11)/12)*16;case dr:case to:case no:return Math.ceil(r/4)*Math.ceil(t/4)*16;case rl:case io:return Math.ceil(r/4)*Math.ceil(t/4)*8;case ro:case so:return Math.ceil(r/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Hp(r){switch(r){case rn:case Za:return{byteLength:1,components:1};case Ti:case Ka:case wi:return{byteLength:2,components:1};case fo:case po:return{byteLength:2,components:4};case Fn:case ho:case en:return{byteLength:4,components:1};case ja:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}function Gp(r,t,e,n,i,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new qe,u=new WeakMap;let f;const p=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(M,_){return g?new OffscreenCanvas(M,_):xr("canvas")}function y(M,_,F){let Y=1;const j=Se(M);if((j.width>F||j.height>F)&&(Y=F/Math.max(j.width,j.height)),Y<1)if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&M instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&M instanceof ImageBitmap||typeof VideoFrame<"u"&&M instanceof VideoFrame){const G=Math.floor(Y*j.width),ve=Math.floor(Y*j.height);f===void 0&&(f=v(G,ve));const oe=_?v(G,ve):f;return oe.width=G,oe.height=ve,oe.getContext("2d").drawImage(M,0,0,G,ve),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+G+"x"+ve+")."),oe}else return"data"in M&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),M;return M}function m(M){return M.generateMipmaps}function d(M){r.generateMipmap(M)}function A(M){return M.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:M.isWebGL3DRenderTarget?r.TEXTURE_3D:M.isWebGLArrayRenderTarget||M.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function T(M,_,F,Y,j=!1){if(M!==null){if(r[M]!==void 0)return r[M];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+M+"'")}let G=_;if(_===r.RED&&(F===r.FLOAT&&(G=r.R32F),F===r.HALF_FLOAT&&(G=r.R16F),F===r.UNSIGNED_BYTE&&(G=r.R8)),_===r.RED_INTEGER&&(F===r.UNSIGNED_BYTE&&(G=r.R8UI),F===r.UNSIGNED_SHORT&&(G=r.R16UI),F===r.UNSIGNED_INT&&(G=r.R32UI),F===r.BYTE&&(G=r.R8I),F===r.SHORT&&(G=r.R16I),F===r.INT&&(G=r.R32I)),_===r.RG&&(F===r.FLOAT&&(G=r.RG32F),F===r.HALF_FLOAT&&(G=r.RG16F),F===r.UNSIGNED_BYTE&&(G=r.RG8)),_===r.RG_INTEGER&&(F===r.UNSIGNED_BYTE&&(G=r.RG8UI),F===r.UNSIGNED_SHORT&&(G=r.RG16UI),F===r.UNSIGNED_INT&&(G=r.RG32UI),F===r.BYTE&&(G=r.RG8I),F===r.SHORT&&(G=r.RG16I),F===r.INT&&(G=r.RG32I)),_===r.RGB_INTEGER&&(F===r.UNSIGNED_BYTE&&(G=r.RGB8UI),F===r.UNSIGNED_SHORT&&(G=r.RGB16UI),F===r.UNSIGNED_INT&&(G=r.RGB32UI),F===r.BYTE&&(G=r.RGB8I),F===r.SHORT&&(G=r.RGB16I),F===r.INT&&(G=r.RGB32I)),_===r.RGBA_INTEGER&&(F===r.UNSIGNED_BYTE&&(G=r.RGBA8UI),F===r.UNSIGNED_SHORT&&(G=r.RGBA16UI),F===r.UNSIGNED_INT&&(G=r.RGBA32UI),F===r.BYTE&&(G=r.RGBA8I),F===r.SHORT&&(G=r.RGBA16I),F===r.INT&&(G=r.RGBA32I)),_===r.RGB&&F===r.UNSIGNED_INT_5_9_9_9_REV&&(G=r.RGB9_E5),_===r.RGBA){const ve=j?Mr:ke.getTransfer(Y);F===r.FLOAT&&(G=r.RGBA32F),F===r.HALF_FLOAT&&(G=r.RGBA16F),F===r.UNSIGNED_BYTE&&(G=ve===$e?r.SRGB8_ALPHA8:r.RGBA8),F===r.UNSIGNED_SHORT_4_4_4_4&&(G=r.RGBA4),F===r.UNSIGNED_SHORT_5_5_5_1&&(G=r.RGB5_A1)}return(G===r.R16F||G===r.R32F||G===r.RG16F||G===r.RG32F||G===r.RGBA16F||G===r.RGBA32F)&&t.get("EXT_color_buffer_float"),G}function E(M,_){let F;return M?_===null||_===Fn||_===li?F=r.DEPTH24_STENCIL8:_===en?F=r.DEPTH32F_STENCIL8:_===Ti&&(F=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Fn||_===li?F=r.DEPTH_COMPONENT24:_===en?F=r.DEPTH_COMPONENT32F:_===Ti&&(F=r.DEPTH_COMPONENT16),F}function z(M,_){return m(M)===!0||M.isFramebufferTexture&&M.minFilter!==Ot&&M.minFilter!==Vt?Math.log2(Math.max(_.width,_.height))+1:M.mipmaps!==void 0&&M.mipmaps.length>0?M.mipmaps.length:M.isCompressedTexture&&Array.isArray(M.image)?_.mipmaps.length:1}function P(M){const _=M.target;_.removeEventListener("dispose",P),U(_),_.isVideoTexture&&u.delete(_)}function C(M){const _=M.target;_.removeEventListener("dispose",C),S(_)}function U(M){const _=n.get(M);if(_.__webglInit===void 0)return;const F=M.source,Y=p.get(F);if(Y){const j=Y[_.__cacheKey];j.usedTimes--,j.usedTimes===0&&b(M),Object.keys(Y).length===0&&p.delete(F)}n.remove(M)}function b(M){const _=n.get(M);r.deleteTexture(_.__webglTexture);const F=M.source,Y=p.get(F);delete Y[_.__cacheKey],o.memory.textures--}function S(M){const _=n.get(M);if(M.depthTexture&&(M.depthTexture.dispose(),n.remove(M.depthTexture)),M.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(_.__webglFramebuffer[Y]))for(let j=0;j<_.__webglFramebuffer[Y].length;j++)r.deleteFramebuffer(_.__webglFramebuffer[Y][j]);else r.deleteFramebuffer(_.__webglFramebuffer[Y]);_.__webglDepthbuffer&&r.deleteRenderbuffer(_.__webglDepthbuffer[Y])}else{if(Array.isArray(_.__webglFramebuffer))for(let Y=0;Y<_.__webglFramebuffer.length;Y++)r.deleteFramebuffer(_.__webglFramebuffer[Y]);else r.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&r.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&r.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let Y=0;Y<_.__webglColorRenderbuffer.length;Y++)_.__webglColorRenderbuffer[Y]&&r.deleteRenderbuffer(_.__webglColorRenderbuffer[Y]);_.__webglDepthRenderbuffer&&r.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const F=M.textures;for(let Y=0,j=F.length;Y<j;Y++){const G=n.get(F[Y]);G.__webglTexture&&(r.deleteTexture(G.__webglTexture),o.memory.textures--),n.remove(F[Y])}n.remove(M)}let w=0;function W(){w=0}function V(){const M=w;return M>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+M+" texture units while this GPU supports only "+i.maxTextures),w+=1,M}function Z(M){const _=[];return _.push(M.wrapS),_.push(M.wrapT),_.push(M.wrapR||0),_.push(M.magFilter),_.push(M.minFilter),_.push(M.anisotropy),_.push(M.internalFormat),_.push(M.format),_.push(M.type),_.push(M.generateMipmaps),_.push(M.premultiplyAlpha),_.push(M.flipY),_.push(M.unpackAlignment),_.push(M.colorSpace),_.join()}function K(M,_){const F=n.get(M);if(M.isVideoTexture&&be(M),M.isRenderTargetTexture===!1&&M.version>0&&F.__version!==M.version){const Y=M.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{X(F,M,_);return}}e.bindTexture(r.TEXTURE_2D,F.__webglTexture,r.TEXTURE0+_)}function q(M,_){const F=n.get(M);if(M.version>0&&F.__version!==M.version){X(F,M,_);return}e.bindTexture(r.TEXTURE_2D_ARRAY,F.__webglTexture,r.TEXTURE0+_)}function J(M,_){const F=n.get(M);if(M.version>0&&F.__version!==M.version){X(F,M,_);return}e.bindTexture(r.TEXTURE_3D,F.__webglTexture,r.TEXTURE0+_)}function H(M,_){const F=n.get(M);if(M.version>0&&F.__version!==M.version){te(F,M,_);return}e.bindTexture(r.TEXTURE_CUBE_MAP,F.__webglTexture,r.TEXTURE0+_)}const re={[Ps]:r.REPEAT,[Dn]:r.CLAMP_TO_EDGE,[Is]:r.MIRRORED_REPEAT},ue={[Ot]:r.NEAREST,[wc]:r.NEAREST_MIPMAP_NEAREST,[Ni]:r.NEAREST_MIPMAP_LINEAR,[Vt]:r.LINEAR,[Cr]:r.LINEAR_MIPMAP_NEAREST,[Pn]:r.LINEAR_MIPMAP_LINEAR},ye={[Pc]:r.NEVER,[Bc]:r.ALWAYS,[Ic]:r.LESS,[ol]:r.LEQUAL,[Uc]:r.EQUAL,[Oc]:r.GEQUAL,[Fc]:r.GREATER,[Nc]:r.NOTEQUAL};function Ue(M,_){if(_.type===en&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Vt||_.magFilter===Cr||_.magFilter===Ni||_.magFilter===Pn||_.minFilter===Vt||_.minFilter===Cr||_.minFilter===Ni||_.minFilter===Pn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(M,r.TEXTURE_WRAP_S,re[_.wrapS]),r.texParameteri(M,r.TEXTURE_WRAP_T,re[_.wrapT]),(M===r.TEXTURE_3D||M===r.TEXTURE_2D_ARRAY)&&r.texParameteri(M,r.TEXTURE_WRAP_R,re[_.wrapR]),r.texParameteri(M,r.TEXTURE_MAG_FILTER,ue[_.magFilter]),r.texParameteri(M,r.TEXTURE_MIN_FILTER,ue[_.minFilter]),_.compareFunction&&(r.texParameteri(M,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(M,r.TEXTURE_COMPARE_FUNC,ye[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Ot||_.minFilter!==Ni&&_.minFilter!==Pn||_.type===en&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){const F=t.get("EXT_texture_filter_anisotropic");r.texParameterf(M,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,i.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Ze(M,_){let F=!1;M.__webglInit===void 0&&(M.__webglInit=!0,_.addEventListener("dispose",P));const Y=_.source;let j=p.get(Y);j===void 0&&(j={},p.set(Y,j));const G=Z(_);if(G!==M.__cacheKey){j[G]===void 0&&(j[G]={texture:r.createTexture(),usedTimes:0},o.memory.textures++,F=!0),j[G].usedTimes++;const ve=j[M.__cacheKey];ve!==void 0&&(j[M.__cacheKey].usedTimes--,ve.usedTimes===0&&b(_)),M.__cacheKey=G,M.__webglTexture=j[G].texture}return F}function X(M,_,F){let Y=r.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(Y=r.TEXTURE_2D_ARRAY),_.isData3DTexture&&(Y=r.TEXTURE_3D);const j=Ze(M,_),G=_.source;e.bindTexture(Y,M.__webglTexture,r.TEXTURE0+F);const ve=n.get(G);if(G.version!==ve.__version||j===!0){e.activeTexture(r.TEXTURE0+F);const oe=ke.getPrimaries(ke.workingColorSpace),he=_.colorSpace===pn?null:ke.getPrimaries(_.colorSpace),Ve=_.colorSpace===pn||oe===he?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,_.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,_.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ve);let Q=y(_.image,!1,i.maxTextureSize);Q=Je(_,Q);const de=s.convert(_.format,_.colorSpace),Me=s.convert(_.type);let Te=T(_.internalFormat,de,Me,_.colorSpace,_.isVideoTexture);Ue(Y,_);let fe;const Be=_.mipmaps,De=_.isVideoTexture!==!0,Ke=ve.__version===void 0||j===!0,R=G.dataReady,ie=z(_,Q);if(_.isDepthTexture)Te=E(_.format===ci,_.type),Ke&&(De?e.texStorage2D(r.TEXTURE_2D,1,Te,Q.width,Q.height):e.texImage2D(r.TEXTURE_2D,0,Te,Q.width,Q.height,0,de,Me,null));else if(_.isDataTexture)if(Be.length>0){De&&Ke&&e.texStorage2D(r.TEXTURE_2D,ie,Te,Be[0].width,Be[0].height);for(let k=0,$=Be.length;k<$;k++)fe=Be[k],De?R&&e.texSubImage2D(r.TEXTURE_2D,k,0,0,fe.width,fe.height,de,Me,fe.data):e.texImage2D(r.TEXTURE_2D,k,Te,fe.width,fe.height,0,de,Me,fe.data);_.generateMipmaps=!1}else De?(Ke&&e.texStorage2D(r.TEXTURE_2D,ie,Te,Q.width,Q.height),R&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,Q.width,Q.height,de,Me,Q.data)):e.texImage2D(r.TEXTURE_2D,0,Te,Q.width,Q.height,0,de,Me,Q.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){De&&Ke&&e.texStorage3D(r.TEXTURE_2D_ARRAY,ie,Te,Be[0].width,Be[0].height,Q.depth);for(let k=0,$=Be.length;k<$;k++)if(fe=Be[k],_.format!==Nt)if(de!==null)if(De){if(R)if(_.layerUpdates.size>0){const ce=Da(fe.width,fe.height,_.format,_.type);for(const ae of _.layerUpdates){const we=fe.data.subarray(ae*ce/fe.data.BYTES_PER_ELEMENT,(ae+1)*ce/fe.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,k,0,0,ae,fe.width,fe.height,1,de,we)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,k,0,0,0,fe.width,fe.height,Q.depth,de,fe.data)}else e.compressedTexImage3D(r.TEXTURE_2D_ARRAY,k,Te,fe.width,fe.height,Q.depth,0,fe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else De?R&&e.texSubImage3D(r.TEXTURE_2D_ARRAY,k,0,0,0,fe.width,fe.height,Q.depth,de,Me,fe.data):e.texImage3D(r.TEXTURE_2D_ARRAY,k,Te,fe.width,fe.height,Q.depth,0,de,Me,fe.data)}else{De&&Ke&&e.texStorage2D(r.TEXTURE_2D,ie,Te,Be[0].width,Be[0].height);for(let k=0,$=Be.length;k<$;k++)fe=Be[k],_.format!==Nt?de!==null?De?R&&e.compressedTexSubImage2D(r.TEXTURE_2D,k,0,0,fe.width,fe.height,de,fe.data):e.compressedTexImage2D(r.TEXTURE_2D,k,Te,fe.width,fe.height,0,fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):De?R&&e.texSubImage2D(r.TEXTURE_2D,k,0,0,fe.width,fe.height,de,Me,fe.data):e.texImage2D(r.TEXTURE_2D,k,Te,fe.width,fe.height,0,de,Me,fe.data)}else if(_.isDataArrayTexture)if(De){if(Ke&&e.texStorage3D(r.TEXTURE_2D_ARRAY,ie,Te,Q.width,Q.height,Q.depth),R)if(_.layerUpdates.size>0){const k=Da(Q.width,Q.height,_.format,_.type);for(const $ of _.layerUpdates){const ce=Q.data.subarray($*k/Q.data.BYTES_PER_ELEMENT,($+1)*k/Q.data.BYTES_PER_ELEMENT);e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,$,Q.width,Q.height,1,de,Me,ce)}_.clearLayerUpdates()}else e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,de,Me,Q.data)}else e.texImage3D(r.TEXTURE_2D_ARRAY,0,Te,Q.width,Q.height,Q.depth,0,de,Me,Q.data);else if(_.isData3DTexture)De?(Ke&&e.texStorage3D(r.TEXTURE_3D,ie,Te,Q.width,Q.height,Q.depth),R&&e.texSubImage3D(r.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,de,Me,Q.data)):e.texImage3D(r.TEXTURE_3D,0,Te,Q.width,Q.height,Q.depth,0,de,Me,Q.data);else if(_.isFramebufferTexture){if(Ke)if(De)e.texStorage2D(r.TEXTURE_2D,ie,Te,Q.width,Q.height);else{let k=Q.width,$=Q.height;for(let ce=0;ce<ie;ce++)e.texImage2D(r.TEXTURE_2D,ce,Te,k,$,0,de,Me,null),k>>=1,$>>=1}}else if(Be.length>0){if(De&&Ke){const k=Se(Be[0]);e.texStorage2D(r.TEXTURE_2D,ie,Te,k.width,k.height)}for(let k=0,$=Be.length;k<$;k++)fe=Be[k],De?R&&e.texSubImage2D(r.TEXTURE_2D,k,0,0,de,Me,fe):e.texImage2D(r.TEXTURE_2D,k,Te,de,Me,fe);_.generateMipmaps=!1}else if(De){if(Ke){const k=Se(Q);e.texStorage2D(r.TEXTURE_2D,ie,Te,k.width,k.height)}R&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,de,Me,Q)}else e.texImage2D(r.TEXTURE_2D,0,Te,de,Me,Q);m(_)&&d(Y),ve.__version=G.version,_.onUpdate&&_.onUpdate(_)}M.__version=_.version}function te(M,_,F){if(_.image.length!==6)return;const Y=Ze(M,_),j=_.source;e.bindTexture(r.TEXTURE_CUBE_MAP,M.__webglTexture,r.TEXTURE0+F);const G=n.get(j);if(j.version!==G.__version||Y===!0){e.activeTexture(r.TEXTURE0+F);const ve=ke.getPrimaries(ke.workingColorSpace),oe=_.colorSpace===pn?null:ke.getPrimaries(_.colorSpace),he=_.colorSpace===pn||ve===oe?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,_.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,_.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);const Ve=_.isCompressedTexture||_.image[0].isCompressedTexture,Q=_.image[0]&&_.image[0].isDataTexture,de=[];for(let $=0;$<6;$++)!Ve&&!Q?de[$]=y(_.image[$],!0,i.maxCubemapSize):de[$]=Q?_.image[$].image:_.image[$],de[$]=Je(_,de[$]);const Me=de[0],Te=s.convert(_.format,_.colorSpace),fe=s.convert(_.type),Be=T(_.internalFormat,Te,fe,_.colorSpace),De=_.isVideoTexture!==!0,Ke=G.__version===void 0||Y===!0,R=j.dataReady;let ie=z(_,Me);Ue(r.TEXTURE_CUBE_MAP,_);let k;if(Ve){De&&Ke&&e.texStorage2D(r.TEXTURE_CUBE_MAP,ie,Be,Me.width,Me.height);for(let $=0;$<6;$++){k=de[$].mipmaps;for(let ce=0;ce<k.length;ce++){const ae=k[ce];_.format!==Nt?Te!==null?De?R&&e.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,0,0,ae.width,ae.height,Te,ae.data):e.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,Be,ae.width,ae.height,0,ae.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):De?R&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,0,0,ae.width,ae.height,Te,fe,ae.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,Be,ae.width,ae.height,0,Te,fe,ae.data)}}}else{if(k=_.mipmaps,De&&Ke){k.length>0&&ie++;const $=Se(de[0]);e.texStorage2D(r.TEXTURE_CUBE_MAP,ie,Be,$.width,$.height)}for(let $=0;$<6;$++)if(Q){De?R&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,de[$].width,de[$].height,Te,fe,de[$].data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Be,de[$].width,de[$].height,0,Te,fe,de[$].data);for(let ce=0;ce<k.length;ce++){const we=k[ce].image[$].image;De?R&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,0,0,we.width,we.height,Te,fe,we.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,Be,we.width,we.height,0,Te,fe,we.data)}}else{De?R&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,Te,fe,de[$]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Be,Te,fe,de[$]);for(let ce=0;ce<k.length;ce++){const ae=k[ce];De?R&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,0,0,Te,fe,ae.image[$]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,Be,Te,fe,ae.image[$])}}}m(_)&&d(r.TEXTURE_CUBE_MAP),G.__version=j.version,_.onUpdate&&_.onUpdate(_)}M.__version=_.version}function _e(M,_,F,Y,j,G){const ve=s.convert(F.format,F.colorSpace),oe=s.convert(F.type),he=T(F.internalFormat,ve,oe,F.colorSpace),Ve=n.get(_),Q=n.get(F);if(Q.__renderTarget=_,!Ve.__hasExternalTextures){const de=Math.max(1,_.width>>G),Me=Math.max(1,_.height>>G);j===r.TEXTURE_3D||j===r.TEXTURE_2D_ARRAY?e.texImage3D(j,G,he,de,Me,_.depth,0,ve,oe,null):e.texImage2D(j,G,he,de,Me,0,ve,oe,null)}e.bindFramebuffer(r.FRAMEBUFFER,M),Oe(_)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Y,j,Q.__webglTexture,0,Ne(_)):(j===r.TEXTURE_2D||j>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,Y,j,Q.__webglTexture,G),e.bindFramebuffer(r.FRAMEBUFFER,null)}function se(M,_,F){if(r.bindRenderbuffer(r.RENDERBUFFER,M),_.depthBuffer){const Y=_.depthTexture,j=Y&&Y.isDepthTexture?Y.type:null,G=E(_.stencilBuffer,j),ve=_.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,oe=Ne(_);Oe(_)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,oe,G,_.width,_.height):F?r.renderbufferStorageMultisample(r.RENDERBUFFER,oe,G,_.width,_.height):r.renderbufferStorage(r.RENDERBUFFER,G,_.width,_.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,ve,r.RENDERBUFFER,M)}else{const Y=_.textures;for(let j=0;j<Y.length;j++){const G=Y[j],ve=s.convert(G.format,G.colorSpace),oe=s.convert(G.type),he=T(G.internalFormat,ve,oe,G.colorSpace),Ve=Ne(_);F&&Oe(_)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Ve,he,_.width,_.height):Oe(_)?a.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Ve,he,_.width,_.height):r.renderbufferStorage(r.RENDERBUFFER,he,_.width,_.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Ee(M,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(r.FRAMEBUFFER,M),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Y=n.get(_.depthTexture);Y.__renderTarget=_,(!Y.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),K(_.depthTexture,0);const j=Y.__webglTexture,G=Ne(_);if(_.depthTexture.format===ni)Oe(_)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,j,0,G):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,j,0);else if(_.depthTexture.format===ci)Oe(_)?a.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,j,0,G):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function Ce(M){const _=n.get(M),F=M.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==M.depthTexture){const Y=M.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),Y){const j=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,Y.removeEventListener("dispose",j)};Y.addEventListener("dispose",j),_.__depthDisposeCallback=j}_.__boundDepthTexture=Y}if(M.depthTexture&&!_.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");Ee(_.__webglFramebuffer,M)}else if(F){_.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(e.bindFramebuffer(r.FRAMEBUFFER,_.__webglFramebuffer[Y]),_.__webglDepthbuffer[Y]===void 0)_.__webglDepthbuffer[Y]=r.createRenderbuffer(),se(_.__webglDepthbuffer[Y],M,!1);else{const j=M.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,G=_.__webglDepthbuffer[Y];r.bindRenderbuffer(r.RENDERBUFFER,G),r.framebufferRenderbuffer(r.FRAMEBUFFER,j,r.RENDERBUFFER,G)}}else if(e.bindFramebuffer(r.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=r.createRenderbuffer(),se(_.__webglDepthbuffer,M,!1);else{const Y=M.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,j=_.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,j),r.framebufferRenderbuffer(r.FRAMEBUFFER,Y,r.RENDERBUFFER,j)}e.bindFramebuffer(r.FRAMEBUFFER,null)}function Fe(M,_,F){const Y=n.get(M);_!==void 0&&_e(Y.__webglFramebuffer,M,M.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),F!==void 0&&Ce(M)}function nt(M){const _=M.texture,F=n.get(M),Y=n.get(_);M.addEventListener("dispose",C);const j=M.textures,G=M.isWebGLCubeRenderTarget===!0,ve=j.length>1;if(ve||(Y.__webglTexture===void 0&&(Y.__webglTexture=r.createTexture()),Y.__version=_.version,o.memory.textures++),G){F.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(_.mipmaps&&_.mipmaps.length>0){F.__webglFramebuffer[oe]=[];for(let he=0;he<_.mipmaps.length;he++)F.__webglFramebuffer[oe][he]=r.createFramebuffer()}else F.__webglFramebuffer[oe]=r.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){F.__webglFramebuffer=[];for(let oe=0;oe<_.mipmaps.length;oe++)F.__webglFramebuffer[oe]=r.createFramebuffer()}else F.__webglFramebuffer=r.createFramebuffer();if(ve)for(let oe=0,he=j.length;oe<he;oe++){const Ve=n.get(j[oe]);Ve.__webglTexture===void 0&&(Ve.__webglTexture=r.createTexture(),o.memory.textures++)}if(M.samples>0&&Oe(M)===!1){F.__webglMultisampledFramebuffer=r.createFramebuffer(),F.__webglColorRenderbuffer=[],e.bindFramebuffer(r.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let oe=0;oe<j.length;oe++){const he=j[oe];F.__webglColorRenderbuffer[oe]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,F.__webglColorRenderbuffer[oe]);const Ve=s.convert(he.format,he.colorSpace),Q=s.convert(he.type),de=T(he.internalFormat,Ve,Q,he.colorSpace,M.isXRRenderTarget===!0),Me=Ne(M);r.renderbufferStorageMultisample(r.RENDERBUFFER,Me,de,M.width,M.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+oe,r.RENDERBUFFER,F.__webglColorRenderbuffer[oe])}r.bindRenderbuffer(r.RENDERBUFFER,null),M.depthBuffer&&(F.__webglDepthRenderbuffer=r.createRenderbuffer(),se(F.__webglDepthRenderbuffer,M,!0)),e.bindFramebuffer(r.FRAMEBUFFER,null)}}if(G){e.bindTexture(r.TEXTURE_CUBE_MAP,Y.__webglTexture),Ue(r.TEXTURE_CUBE_MAP,_);for(let oe=0;oe<6;oe++)if(_.mipmaps&&_.mipmaps.length>0)for(let he=0;he<_.mipmaps.length;he++)_e(F.__webglFramebuffer[oe][he],M,_,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+oe,he);else _e(F.__webglFramebuffer[oe],M,_,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);m(_)&&d(r.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(ve){for(let oe=0,he=j.length;oe<he;oe++){const Ve=j[oe],Q=n.get(Ve);e.bindTexture(r.TEXTURE_2D,Q.__webglTexture),Ue(r.TEXTURE_2D,Ve),_e(F.__webglFramebuffer,M,Ve,r.COLOR_ATTACHMENT0+oe,r.TEXTURE_2D,0),m(Ve)&&d(r.TEXTURE_2D)}e.unbindTexture()}else{let oe=r.TEXTURE_2D;if((M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)&&(oe=M.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture(oe,Y.__webglTexture),Ue(oe,_),_.mipmaps&&_.mipmaps.length>0)for(let he=0;he<_.mipmaps.length;he++)_e(F.__webglFramebuffer[he],M,_,r.COLOR_ATTACHMENT0,oe,he);else _e(F.__webglFramebuffer,M,_,r.COLOR_ATTACHMENT0,oe,0);m(_)&&d(oe),e.unbindTexture()}M.depthBuffer&&Ce(M)}function ze(M){const _=M.textures;for(let F=0,Y=_.length;F<Y;F++){const j=_[F];if(m(j)){const G=A(M),ve=n.get(j).__webglTexture;e.bindTexture(G,ve),d(G),e.unbindTexture()}}}const at=[],I=[];function Tt(M){if(M.samples>0){if(Oe(M)===!1){const _=M.textures,F=M.width,Y=M.height;let j=r.COLOR_BUFFER_BIT;const G=M.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ve=n.get(M),oe=_.length>1;if(oe)for(let he=0;he<_.length;he++)e.bindFramebuffer(r.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+he,r.RENDERBUFFER,null),e.bindFramebuffer(r.FRAMEBUFFER,ve.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+he,r.TEXTURE_2D,null,0);e.bindFramebuffer(r.READ_FRAMEBUFFER,ve.__webglMultisampledFramebuffer),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,ve.__webglFramebuffer);for(let he=0;he<_.length;he++){if(M.resolveDepthBuffer&&(M.depthBuffer&&(j|=r.DEPTH_BUFFER_BIT),M.stencilBuffer&&M.resolveStencilBuffer&&(j|=r.STENCIL_BUFFER_BIT)),oe){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,ve.__webglColorRenderbuffer[he]);const Ve=n.get(_[he]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,Ve,0)}r.blitFramebuffer(0,0,F,Y,0,0,F,Y,j,r.NEAREST),l===!0&&(at.length=0,I.length=0,at.push(r.COLOR_ATTACHMENT0+he),M.depthBuffer&&M.resolveDepthBuffer===!1&&(at.push(G),I.push(G),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,I)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,at))}if(e.bindFramebuffer(r.READ_FRAMEBUFFER,null),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),oe)for(let he=0;he<_.length;he++){e.bindFramebuffer(r.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+he,r.RENDERBUFFER,ve.__webglColorRenderbuffer[he]);const Ve=n.get(_[he]).__webglTexture;e.bindFramebuffer(r.FRAMEBUFFER,ve.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+he,r.TEXTURE_2D,Ve,0)}e.bindFramebuffer(r.DRAW_FRAMEBUFFER,ve.__webglMultisampledFramebuffer)}else if(M.depthBuffer&&M.resolveDepthBuffer===!1&&l){const _=M.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[_])}}}function Ne(M){return Math.min(i.maxSamples,M.samples)}function Oe(M){const _=n.get(M);return M.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function be(M){const _=o.render.frame;u.get(M)!==_&&(u.set(M,_),M.update())}function Je(M,_){const F=M.colorSpace,Y=M.format,j=M.type;return M.isCompressedTexture===!0||M.isVideoTexture===!0||F!==hi&&F!==pn&&(ke.getTransfer(F)===$e?(Y!==Nt||j!==rn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),_}function Se(M){return typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement?(c.width=M.naturalWidth||M.width,c.height=M.naturalHeight||M.height):typeof VideoFrame<"u"&&M instanceof VideoFrame?(c.width=M.displayWidth,c.height=M.displayHeight):(c.width=M.width,c.height=M.height),c}this.allocateTextureUnit=V,this.resetTextureUnits=W,this.setTexture2D=K,this.setTexture2DArray=q,this.setTexture3D=J,this.setTextureCube=H,this.rebindTextures=Fe,this.setupRenderTarget=nt,this.updateRenderTargetMipmap=ze,this.updateMultisampleRenderTarget=Tt,this.setupDepthRenderbuffer=Ce,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=Oe}function Wp(r,t){function e(n,i=pn){let s;const o=ke.getTransfer(i);if(n===rn)return r.UNSIGNED_BYTE;if(n===fo)return r.UNSIGNED_SHORT_4_4_4_4;if(n===po)return r.UNSIGNED_SHORT_5_5_5_1;if(n===ja)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===Za)return r.BYTE;if(n===Ka)return r.SHORT;if(n===Ti)return r.UNSIGNED_SHORT;if(n===ho)return r.INT;if(n===Fn)return r.UNSIGNED_INT;if(n===en)return r.FLOAT;if(n===wi)return r.HALF_FLOAT;if(n===Ja)return r.ALPHA;if(n===Qa)return r.RGB;if(n===Nt)return r.RGBA;if(n===el)return r.LUMINANCE;if(n===tl)return r.LUMINANCE_ALPHA;if(n===ni)return r.DEPTH_COMPONENT;if(n===ci)return r.DEPTH_STENCIL;if(n===nl)return r.RED;if(n===mo)return r.RED_INTEGER;if(n===il)return r.RG;if(n===go)return r.RG_INTEGER;if(n===_o)return r.RGBA_INTEGER;if(n===lr||n===cr||n===ur||n===hr)if(o===$e)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===lr)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===cr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ur)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===hr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===lr)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===cr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ur)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===hr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Us||n===Fs||n===Ns||n===Os)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Us)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Fs)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ns)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Os)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Bs||n===zs||n===Vs)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Bs||n===zs)return o===$e?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Vs)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===ks||n===Hs||n===Gs||n===Ws||n===Xs||n===qs||n===Ys||n===$s||n===Zs||n===Ks||n===js||n===Js||n===Qs||n===eo)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===ks)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Hs)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Gs)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ws)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Xs)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===qs)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ys)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===$s)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Zs)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ks)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===js)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Js)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Qs)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===eo)return o===$e?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===dr||n===to||n===no)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===dr)return o===$e?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===to)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===no)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===rl||n===io||n===ro||n===so)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===dr)return s.COMPRESSED_RED_RGTC1_EXT;if(n===io)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ro)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===so)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===li?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:e}}class Xp extends Rt{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class ir extends mt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const qp={type:"move"};class ns{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ir,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ir,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new B,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new B),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ir,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new B,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new B),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(const y of t.hand.values()){const m=e.getJointPose(y,n),d=this._getHandJoint(c,y);m!==null&&(d.matrix.fromArray(m.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=m.radius),d.visible=m!==null}const u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],p=u.position.distanceTo(f.position),g=.02,v=.005;c.inputState.pinching&&p>g+v?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&p<=g-v&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(qp)))}return a!==null&&(a.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new ir;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Yp=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,$p=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Zp{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new St,s=t.properties.get(i);s.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new vn({vertexShader:Yp,fragmentShader:$p,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new kt(new Er(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Kp extends di{constructor(t,e){super();const n=this;let i=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,f=null,p=null,g=null,v=null;const y=new Zp,m=e.getContextAttributes();let d=null,A=null;const T=[],E=[],z=new qe;let P=null;const C=new Rt;C.viewport=new st;const U=new Rt;U.viewport=new st;const b=[C,U],S=new Xp;let w=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let te=T[X];return te===void 0&&(te=new ns,T[X]=te),te.getTargetRaySpace()},this.getControllerGrip=function(X){let te=T[X];return te===void 0&&(te=new ns,T[X]=te),te.getGripSpace()},this.getHand=function(X){let te=T[X];return te===void 0&&(te=new ns,T[X]=te),te.getHandSpace()};function V(X){const te=E.indexOf(X.inputSource);if(te===-1)return;const _e=T[te];_e!==void 0&&(_e.update(X.inputSource,X.frame,c||o),_e.dispatchEvent({type:X.type,data:X.inputSource}))}function Z(){i.removeEventListener("select",V),i.removeEventListener("selectstart",V),i.removeEventListener("selectend",V),i.removeEventListener("squeeze",V),i.removeEventListener("squeezestart",V),i.removeEventListener("squeezeend",V),i.removeEventListener("end",Z),i.removeEventListener("inputsourceschange",K);for(let X=0;X<T.length;X++){const te=E[X];te!==null&&(E[X]=null,T[X].disconnect(te))}w=null,W=null,y.reset(),t.setRenderTarget(d),g=null,p=null,f=null,i=null,A=null,Ze.stop(),n.isPresenting=!1,t.setPixelRatio(P),t.setSize(z.width,z.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){s=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(X){c=X},this.getBaseLayer=function(){return p!==null?p:g},this.getBinding=function(){return f},this.getFrame=function(){return v},this.getSession=function(){return i},this.setSession=async function(X){if(i=X,i!==null){if(d=t.getRenderTarget(),i.addEventListener("select",V),i.addEventListener("selectstart",V),i.addEventListener("selectend",V),i.addEventListener("squeeze",V),i.addEventListener("squeezestart",V),i.addEventListener("squeezeend",V),i.addEventListener("end",Z),i.addEventListener("inputsourceschange",K),m.xrCompatible!==!0&&await e.makeXRCompatible(),P=t.getPixelRatio(),t.getSize(z),i.renderState.layers===void 0){const te={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};g=new XRWebGLLayer(i,e,te),i.updateRenderState({baseLayer:g}),t.setPixelRatio(1),t.setSize(g.framebufferWidth,g.framebufferHeight,!1),A=new Nn(g.framebufferWidth,g.framebufferHeight,{format:Nt,type:rn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let te=null,_e=null,se=null;m.depth&&(se=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,te=m.stencil?ci:ni,_e=m.stencil?li:Fn);const Ee={colorFormat:e.RGBA8,depthFormat:se,scaleFactor:s};f=new XRWebGLBinding(i,e),p=f.createProjectionLayer(Ee),i.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),A=new Nn(p.textureWidth,p.textureHeight,{format:Nt,type:rn,depthTexture:new yl(p.textureWidth,p.textureHeight,_e,void 0,void 0,void 0,void 0,void 0,void 0,te),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1})}A.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await i.requestReferenceSpace(a),Ze.setContext(i),Ze.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return y.getDepthTexture()};function K(X){for(let te=0;te<X.removed.length;te++){const _e=X.removed[te],se=E.indexOf(_e);se>=0&&(E[se]=null,T[se].disconnect(_e))}for(let te=0;te<X.added.length;te++){const _e=X.added[te];let se=E.indexOf(_e);if(se===-1){for(let Ce=0;Ce<T.length;Ce++)if(Ce>=E.length){E.push(_e),se=Ce;break}else if(E[Ce]===null){E[Ce]=_e,se=Ce;break}if(se===-1)break}const Ee=T[se];Ee&&Ee.connect(_e)}}const q=new B,J=new B;function H(X,te,_e){q.setFromMatrixPosition(te.matrixWorld),J.setFromMatrixPosition(_e.matrixWorld);const se=q.distanceTo(J),Ee=te.projectionMatrix.elements,Ce=_e.projectionMatrix.elements,Fe=Ee[14]/(Ee[10]-1),nt=Ee[14]/(Ee[10]+1),ze=(Ee[9]+1)/Ee[5],at=(Ee[9]-1)/Ee[5],I=(Ee[8]-1)/Ee[0],Tt=(Ce[8]+1)/Ce[0],Ne=Fe*I,Oe=Fe*Tt,be=se/(-I+Tt),Je=be*-I;if(te.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(Je),X.translateZ(be),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),Ee[10]===-1)X.projectionMatrix.copy(te.projectionMatrix),X.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{const Se=Fe+be,M=nt+be,_=Ne-Je,F=Oe+(se-Je),Y=ze*nt/M*Se,j=at*nt/M*Se;X.projectionMatrix.makePerspective(_,F,Y,j,Se,M),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function re(X,te){te===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(te.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(i===null)return;let te=X.near,_e=X.far;y.texture!==null&&(y.depthNear>0&&(te=y.depthNear),y.depthFar>0&&(_e=y.depthFar)),S.near=U.near=C.near=te,S.far=U.far=C.far=_e,(w!==S.near||W!==S.far)&&(i.updateRenderState({depthNear:S.near,depthFar:S.far}),w=S.near,W=S.far),C.layers.mask=X.layers.mask|2,U.layers.mask=X.layers.mask|4,S.layers.mask=C.layers.mask|U.layers.mask;const se=X.parent,Ee=S.cameras;re(S,se);for(let Ce=0;Ce<Ee.length;Ce++)re(Ee[Ce],se);Ee.length===2?H(S,C,U):S.projectionMatrix.copy(C.projectionMatrix),ue(X,S,se)};function ue(X,te,_e){_e===null?X.matrix.copy(te.matrixWorld):(X.matrix.copy(_e.matrixWorld),X.matrix.invert(),X.matrix.multiply(te.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(te.projectionMatrix),X.projectionMatrixInverse.copy(te.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=oo*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(p===null&&g===null))return l},this.setFoveation=function(X){l=X,p!==null&&(p.fixedFoveation=X),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=X)},this.hasDepthSensing=function(){return y.texture!==null},this.getDepthSensingMesh=function(){return y.getMesh(S)};let ye=null;function Ue(X,te){if(u=te.getViewerPose(c||o),v=te,u!==null){const _e=u.views;g!==null&&(t.setRenderTargetFramebuffer(A,g.framebuffer),t.setRenderTarget(A));let se=!1;_e.length!==S.cameras.length&&(S.cameras.length=0,se=!0);for(let Ce=0;Ce<_e.length;Ce++){const Fe=_e[Ce];let nt=null;if(g!==null)nt=g.getViewport(Fe);else{const at=f.getViewSubImage(p,Fe);nt=at.viewport,Ce===0&&(t.setRenderTargetTextures(A,at.colorTexture,p.ignoreDepthValues?void 0:at.depthStencilTexture),t.setRenderTarget(A))}let ze=b[Ce];ze===void 0&&(ze=new Rt,ze.layers.enable(Ce),ze.viewport=new st,b[Ce]=ze),ze.matrix.fromArray(Fe.transform.matrix),ze.matrix.decompose(ze.position,ze.quaternion,ze.scale),ze.projectionMatrix.fromArray(Fe.projectionMatrix),ze.projectionMatrixInverse.copy(ze.projectionMatrix).invert(),ze.viewport.set(nt.x,nt.y,nt.width,nt.height),Ce===0&&(S.matrix.copy(ze.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),se===!0&&S.cameras.push(ze)}const Ee=i.enabledFeatures;if(Ee&&Ee.includes("depth-sensing")){const Ce=f.getDepthInformation(_e[0]);Ce&&Ce.isValid&&Ce.texture&&y.init(t,Ce,i.renderState)}}for(let _e=0;_e<T.length;_e++){const se=E[_e],Ee=T[_e];se!==null&&Ee!==void 0&&Ee.update(se,te,c||o)}ye&&ye(X,te),te.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:te}),v=null}const Ze=new vl;Ze.setAnimationLoop(Ue),this.setAnimationLoop=function(X){ye=X},this.dispose=function(){}}}const An=new Wt,jp=new ot;function Jp(r,t){function e(m,d){m.matrixAutoUpdate===!0&&m.updateMatrix(),d.value.copy(m.matrix)}function n(m,d){d.color.getRGB(m.fogColor.value,ml(r)),d.isFog?(m.fogNear.value=d.near,m.fogFar.value=d.far):d.isFogExp2&&(m.fogDensity.value=d.density)}function i(m,d,A,T,E){d.isMeshBasicMaterial||d.isMeshLambertMaterial?s(m,d):d.isMeshToonMaterial?(s(m,d),f(m,d)):d.isMeshPhongMaterial?(s(m,d),u(m,d)):d.isMeshStandardMaterial?(s(m,d),p(m,d),d.isMeshPhysicalMaterial&&g(m,d,E)):d.isMeshMatcapMaterial?(s(m,d),v(m,d)):d.isMeshDepthMaterial?s(m,d):d.isMeshDistanceMaterial?(s(m,d),y(m,d)):d.isMeshNormalMaterial?s(m,d):d.isLineBasicMaterial?(o(m,d),d.isLineDashedMaterial&&a(m,d)):d.isPointsMaterial?l(m,d,A,T):d.isSpriteMaterial?c(m,d):d.isShadowMaterial?(m.color.value.copy(d.color),m.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function s(m,d){m.opacity.value=d.opacity,d.color&&m.diffuse.value.copy(d.color),d.emissive&&m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(m.map.value=d.map,e(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.bumpMap&&(m.bumpMap.value=d.bumpMap,e(d.bumpMap,m.bumpMapTransform),m.bumpScale.value=d.bumpScale,d.side===yt&&(m.bumpScale.value*=-1)),d.normalMap&&(m.normalMap.value=d.normalMap,e(d.normalMap,m.normalMapTransform),m.normalScale.value.copy(d.normalScale),d.side===yt&&m.normalScale.value.negate()),d.displacementMap&&(m.displacementMap.value=d.displacementMap,e(d.displacementMap,m.displacementMapTransform),m.displacementScale.value=d.displacementScale,m.displacementBias.value=d.displacementBias),d.emissiveMap&&(m.emissiveMap.value=d.emissiveMap,e(d.emissiveMap,m.emissiveMapTransform)),d.specularMap&&(m.specularMap.value=d.specularMap,e(d.specularMap,m.specularMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);const A=t.get(d),T=A.envMap,E=A.envMapRotation;T&&(m.envMap.value=T,An.copy(E),An.x*=-1,An.y*=-1,An.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(An.y*=-1,An.z*=-1),m.envMapRotation.value.setFromMatrix4(jp.makeRotationFromEuler(An)),m.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=d.reflectivity,m.ior.value=d.ior,m.refractionRatio.value=d.refractionRatio),d.lightMap&&(m.lightMap.value=d.lightMap,m.lightMapIntensity.value=d.lightMapIntensity,e(d.lightMap,m.lightMapTransform)),d.aoMap&&(m.aoMap.value=d.aoMap,m.aoMapIntensity.value=d.aoMapIntensity,e(d.aoMap,m.aoMapTransform))}function o(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,d.map&&(m.map.value=d.map,e(d.map,m.mapTransform))}function a(m,d){m.dashSize.value=d.dashSize,m.totalSize.value=d.dashSize+d.gapSize,m.scale.value=d.scale}function l(m,d,A,T){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.size.value=d.size*A,m.scale.value=T*.5,d.map&&(m.map.value=d.map,e(d.map,m.uvTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function c(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.rotation.value=d.rotation,d.map&&(m.map.value=d.map,e(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function u(m,d){m.specular.value.copy(d.specular),m.shininess.value=Math.max(d.shininess,1e-4)}function f(m,d){d.gradientMap&&(m.gradientMap.value=d.gradientMap)}function p(m,d){m.metalness.value=d.metalness,d.metalnessMap&&(m.metalnessMap.value=d.metalnessMap,e(d.metalnessMap,m.metalnessMapTransform)),m.roughness.value=d.roughness,d.roughnessMap&&(m.roughnessMap.value=d.roughnessMap,e(d.roughnessMap,m.roughnessMapTransform)),d.envMap&&(m.envMapIntensity.value=d.envMapIntensity)}function g(m,d,A){m.ior.value=d.ior,d.sheen>0&&(m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),m.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(m.sheenColorMap.value=d.sheenColorMap,e(d.sheenColorMap,m.sheenColorMapTransform)),d.sheenRoughnessMap&&(m.sheenRoughnessMap.value=d.sheenRoughnessMap,e(d.sheenRoughnessMap,m.sheenRoughnessMapTransform))),d.clearcoat>0&&(m.clearcoat.value=d.clearcoat,m.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(m.clearcoatMap.value=d.clearcoatMap,e(d.clearcoatMap,m.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,e(d.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(m.clearcoatNormalMap.value=d.clearcoatNormalMap,e(d.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===yt&&m.clearcoatNormalScale.value.negate())),d.dispersion>0&&(m.dispersion.value=d.dispersion),d.iridescence>0&&(m.iridescence.value=d.iridescence,m.iridescenceIOR.value=d.iridescenceIOR,m.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(m.iridescenceMap.value=d.iridescenceMap,e(d.iridescenceMap,m.iridescenceMapTransform)),d.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=d.iridescenceThicknessMap,e(d.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),d.transmission>0&&(m.transmission.value=d.transmission,m.transmissionSamplerMap.value=A.texture,m.transmissionSamplerSize.value.set(A.width,A.height),d.transmissionMap&&(m.transmissionMap.value=d.transmissionMap,e(d.transmissionMap,m.transmissionMapTransform)),m.thickness.value=d.thickness,d.thicknessMap&&(m.thicknessMap.value=d.thicknessMap,e(d.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=d.attenuationDistance,m.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(m.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(m.anisotropyMap.value=d.anisotropyMap,e(d.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=d.specularIntensity,m.specularColor.value.copy(d.specularColor),d.specularColorMap&&(m.specularColorMap.value=d.specularColorMap,e(d.specularColorMap,m.specularColorMapTransform)),d.specularIntensityMap&&(m.specularIntensityMap.value=d.specularIntensityMap,e(d.specularIntensityMap,m.specularIntensityMapTransform))}function v(m,d){d.matcap&&(m.matcap.value=d.matcap)}function y(m,d){const A=t.get(d).light;m.referencePosition.value.setFromMatrixPosition(A.matrixWorld),m.nearDistance.value=A.shadow.camera.near,m.farDistance.value=A.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Qp(r,t,e,n){let i={},s={},o=[];const a=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(A,T){const E=T.program;n.uniformBlockBinding(A,E)}function c(A,T){let E=i[A.id];E===void 0&&(v(A),E=u(A),i[A.id]=E,A.addEventListener("dispose",m));const z=T.program;n.updateUBOMapping(A,z);const P=t.render.frame;s[A.id]!==P&&(p(A),s[A.id]=P)}function u(A){const T=f();A.__bindingPointIndex=T;const E=r.createBuffer(),z=A.__size,P=A.usage;return r.bindBuffer(r.UNIFORM_BUFFER,E),r.bufferData(r.UNIFORM_BUFFER,z,P),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,T,E),E}function f(){for(let A=0;A<a;A++)if(o.indexOf(A)===-1)return o.push(A),A;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(A){const T=i[A.id],E=A.uniforms,z=A.__cache;r.bindBuffer(r.UNIFORM_BUFFER,T);for(let P=0,C=E.length;P<C;P++){const U=Array.isArray(E[P])?E[P]:[E[P]];for(let b=0,S=U.length;b<S;b++){const w=U[b];if(g(w,P,b,z)===!0){const W=w.__offset,V=Array.isArray(w.value)?w.value:[w.value];let Z=0;for(let K=0;K<V.length;K++){const q=V[K],J=y(q);typeof q=="number"||typeof q=="boolean"?(w.__data[0]=q,r.bufferSubData(r.UNIFORM_BUFFER,W+Z,w.__data)):q.isMatrix3?(w.__data[0]=q.elements[0],w.__data[1]=q.elements[1],w.__data[2]=q.elements[2],w.__data[3]=0,w.__data[4]=q.elements[3],w.__data[5]=q.elements[4],w.__data[6]=q.elements[5],w.__data[7]=0,w.__data[8]=q.elements[6],w.__data[9]=q.elements[7],w.__data[10]=q.elements[8],w.__data[11]=0):(q.toArray(w.__data,Z),Z+=J.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,W,w.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function g(A,T,E,z){const P=A.value,C=T+"_"+E;if(z[C]===void 0)return typeof P=="number"||typeof P=="boolean"?z[C]=P:z[C]=P.clone(),!0;{const U=z[C];if(typeof P=="number"||typeof P=="boolean"){if(U!==P)return z[C]=P,!0}else if(U.equals(P)===!1)return U.copy(P),!0}return!1}function v(A){const T=A.uniforms;let E=0;const z=16;for(let C=0,U=T.length;C<U;C++){const b=Array.isArray(T[C])?T[C]:[T[C]];for(let S=0,w=b.length;S<w;S++){const W=b[S],V=Array.isArray(W.value)?W.value:[W.value];for(let Z=0,K=V.length;Z<K;Z++){const q=V[Z],J=y(q),H=E%z,re=H%J.boundary,ue=H+re;E+=re,ue!==0&&z-ue<J.storage&&(E+=z-ue),W.__data=new Float32Array(J.storage/Float32Array.BYTES_PER_ELEMENT),W.__offset=E,E+=J.storage}}}const P=E%z;return P>0&&(E+=z-P),A.__size=E,A.__cache={},this}function y(A){const T={boundary:0,storage:0};return typeof A=="number"||typeof A=="boolean"?(T.boundary=4,T.storage=4):A.isVector2?(T.boundary=8,T.storage=8):A.isVector3||A.isColor?(T.boundary=16,T.storage=12):A.isVector4?(T.boundary=16,T.storage=16):A.isMatrix3?(T.boundary=48,T.storage=48):A.isMatrix4?(T.boundary=64,T.storage=64):A.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",A),T}function m(A){const T=A.target;T.removeEventListener("dispose",m);const E=o.indexOf(T.__bindingPointIndex);o.splice(E,1),r.deleteBuffer(i[T.id]),delete i[T.id],delete s[T.id]}function d(){for(const A in i)r.deleteBuffer(i[A]);o=[],i={},s={}}return{bind:l,update:c,dispose:d}}class em{constructor(t={}){const{canvas:e=Vc(),context:n=null,depth:i=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reverseDepthBuffer:p=!1}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=o;const v=new Uint32Array(4),y=new Int32Array(4);let m=null,d=null;const A=[],T=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=wt,this.toneMapping=gn,this.toneMappingExposure=1;const E=this;let z=!1,P=0,C=0,U=null,b=-1,S=null;const w=new st,W=new st;let V=null;const Z=new Ge(0);let K=0,q=e.width,J=e.height,H=1,re=null,ue=null;const ye=new st(0,0,q,J),Ue=new st(0,0,q,J);let Ze=!1;const X=new xo;let te=!1,_e=!1;const se=new ot,Ee=new ot,Ce=new B,Fe=new st,nt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ze=!1;function at(){return U===null?H:1}let I=n;function Tt(x,L){return e.getContext(x,L)}try{const x={alpha:!0,depth:i,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${co}`),e.addEventListener("webglcontextlost",$,!1),e.addEventListener("webglcontextrestored",ce,!1),e.addEventListener("webglcontextcreationerror",ae,!1),I===null){const L="webgl2";if(I=Tt(L,x),I===null)throw Tt(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(x){throw console.error("THREE.WebGLRenderer: "+x.message),x}let Ne,Oe,be,Je,Se,M,_,F,Y,j,G,ve,oe,he,Ve,Q,de,Me,Te,fe,Be,De,Ke,R;function ie(){Ne=new sf(I),Ne.init(),De=new Wp(I,Ne),Oe=new Jd(I,Ne,t,De),be=new kp(I,Ne),Oe.reverseDepthBuffer&&p&&be.buffers.depth.setReversed(!0),Je=new lf(I),Se=new Ap,M=new Gp(I,Ne,be,Se,Oe,De,Je),_=new ef(E),F=new rf(E),Y=new pu(I),Ke=new Kd(I,Y),j=new of(I,Y,Je,Ke),G=new uf(I,j,Y,Je),Te=new cf(I,Oe,M),Q=new Qd(Se),ve=new Tp(E,_,F,Ne,Oe,Ke,Q),oe=new Jp(E,Se),he=new wp,Ve=new Up(Ne),Me=new Zd(E,_,F,be,G,g,l),de=new zp(E,G,Oe),R=new Qp(I,Je,Oe,be),fe=new jd(I,Ne,Je),Be=new af(I,Ne,Je),Je.programs=ve.programs,E.capabilities=Oe,E.extensions=Ne,E.properties=Se,E.renderLists=he,E.shadowMap=de,E.state=be,E.info=Je}ie();const k=new Kp(E,I);this.xr=k,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const x=Ne.get("WEBGL_lose_context");x&&x.loseContext()},this.forceContextRestore=function(){const x=Ne.get("WEBGL_lose_context");x&&x.restoreContext()},this.getPixelRatio=function(){return H},this.setPixelRatio=function(x){x!==void 0&&(H=x,this.setSize(q,J,!1))},this.getSize=function(x){return x.set(q,J)},this.setSize=function(x,L,N=!0){if(k.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}q=x,J=L,e.width=Math.floor(x*H),e.height=Math.floor(L*H),N===!0&&(e.style.width=x+"px",e.style.height=L+"px"),this.setViewport(0,0,x,L)},this.getDrawingBufferSize=function(x){return x.set(q*H,J*H).floor()},this.setDrawingBufferSize=function(x,L,N){q=x,J=L,H=N,e.width=Math.floor(x*N),e.height=Math.floor(L*N),this.setViewport(0,0,x,L)},this.getCurrentViewport=function(x){return x.copy(w)},this.getViewport=function(x){return x.copy(ye)},this.setViewport=function(x,L,N,O){x.isVector4?ye.set(x.x,x.y,x.z,x.w):ye.set(x,L,N,O),be.viewport(w.copy(ye).multiplyScalar(H).round())},this.getScissor=function(x){return x.copy(Ue)},this.setScissor=function(x,L,N,O){x.isVector4?Ue.set(x.x,x.y,x.z,x.w):Ue.set(x,L,N,O),be.scissor(W.copy(Ue).multiplyScalar(H).round())},this.getScissorTest=function(){return Ze},this.setScissorTest=function(x){be.setScissorTest(Ze=x)},this.setOpaqueSort=function(x){re=x},this.setTransparentSort=function(x){ue=x},this.getClearColor=function(x){return x.copy(Me.getClearColor())},this.setClearColor=function(){Me.setClearColor.apply(Me,arguments)},this.getClearAlpha=function(){return Me.getClearAlpha()},this.setClearAlpha=function(){Me.setClearAlpha.apply(Me,arguments)},this.clear=function(x=!0,L=!0,N=!0){let O=0;if(x){let D=!1;if(U!==null){const ee=U.texture.format;D=ee===_o||ee===go||ee===mo}if(D){const ee=U.texture.type,le=ee===rn||ee===Fn||ee===Ti||ee===li||ee===fo||ee===po,pe=Me.getClearColor(),me=Me.getClearAlpha(),Ae=pe.r,Re=pe.g,ge=pe.b;le?(v[0]=Ae,v[1]=Re,v[2]=ge,v[3]=me,I.clearBufferuiv(I.COLOR,0,v)):(y[0]=Ae,y[1]=Re,y[2]=ge,y[3]=me,I.clearBufferiv(I.COLOR,0,y))}else O|=I.COLOR_BUFFER_BIT}L&&(O|=I.DEPTH_BUFFER_BIT),N&&(O|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(O)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",$,!1),e.removeEventListener("webglcontextrestored",ce,!1),e.removeEventListener("webglcontextcreationerror",ae,!1),he.dispose(),Ve.dispose(),Se.dispose(),_.dispose(),F.dispose(),G.dispose(),Ke.dispose(),R.dispose(),ve.dispose(),k.dispose(),k.removeEventListener("sessionstart",bo),k.removeEventListener("sessionend",Mo),yn.stop()};function $(x){x.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),z=!0}function ce(){console.log("THREE.WebGLRenderer: Context Restored."),z=!1;const x=Je.autoReset,L=de.enabled,N=de.autoUpdate,O=de.needsUpdate,D=de.type;ie(),Je.autoReset=x,de.enabled=L,de.autoUpdate=N,de.needsUpdate=O,de.type=D}function ae(x){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",x.statusMessage)}function we(x){const L=x.target;L.removeEventListener("dispose",we),rt(L)}function rt(x){dt(x),Se.remove(x)}function dt(x){const L=Se.get(x).programs;L!==void 0&&(L.forEach(function(N){ve.releaseProgram(N)}),x.isShaderMaterial&&ve.releaseShaderCache(x))}this.renderBufferDirect=function(x,L,N,O,D,ee){L===null&&(L=nt);const le=D.isMesh&&D.matrixWorld.determinant()<0,pe=Dl(x,L,N,O,D);be.setMaterial(O,le);let me=N.index,Ae=1;if(O.wireframe===!0){if(me=j.getWireframeAttribute(N),me===void 0)return;Ae=2}const Re=N.drawRange,ge=N.attributes.position;let He=Re.start*Ae,je=(Re.start+Re.count)*Ae;ee!==null&&(He=Math.max(He,ee.start*Ae),je=Math.min(je,(ee.start+ee.count)*Ae)),me!==null?(He=Math.max(He,0),je=Math.min(je,me.count)):ge!=null&&(He=Math.max(He,0),je=Math.min(je,ge.count));const Qe=je-He;if(Qe<0||Qe===1/0)return;Ke.setup(D,O,pe,N,me);let _t,We=fe;if(me!==null&&(_t=Y.get(me),We=Be,We.setIndex(_t)),D.isMesh)O.wireframe===!0?(be.setLineWidth(O.wireframeLinewidth*at()),We.setMode(I.LINES)):We.setMode(I.TRIANGLES);else if(D.isLine){let xe=O.linewidth;xe===void 0&&(xe=1),be.setLineWidth(xe*at()),D.isLineSegments?We.setMode(I.LINES):D.isLineLoop?We.setMode(I.LINE_LOOP):We.setMode(I.LINE_STRIP)}else D.isPoints?We.setMode(I.POINTS):D.isSprite&&We.setMode(I.TRIANGLES);if(D.isBatchedMesh)if(D._multiDrawInstances!==null)We.renderMultiDrawInstances(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount,D._multiDrawInstances);else if(Ne.get("WEBGL_multi_draw"))We.renderMultiDraw(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount);else{const xe=D._multiDrawStarts,qt=D._multiDrawCounts,Xe=D._multiDrawCount,Dt=me?Y.get(me).bytesPerElement:1,Bn=Se.get(O).currentProgram.getUniforms();for(let bt=0;bt<Xe;bt++)Bn.setValue(I,"_gl_DrawID",bt),We.render(xe[bt]/Dt,qt[bt])}else if(D.isInstancedMesh)We.renderInstances(He,Qe,D.count);else if(N.isInstancedBufferGeometry){const xe=N._maxInstanceCount!==void 0?N._maxInstanceCount:1/0,qt=Math.min(N.instanceCount,xe);We.renderInstances(He,Qe,qt)}else We.render(He,Qe)};function Ye(x,L,N){x.transparent===!0&&x.side===Qt&&x.forceSinglePass===!1?(x.side=yt,x.needsUpdate=!0,Ui(x,L,N),x.side=_n,x.needsUpdate=!0,Ui(x,L,N),x.side=Qt):Ui(x,L,N)}this.compile=function(x,L,N=null){N===null&&(N=x),d=Ve.get(N),d.init(L),T.push(d),N.traverseVisible(function(D){D.isLight&&D.layers.test(L.layers)&&(d.pushLight(D),D.castShadow&&d.pushShadow(D))}),x!==N&&x.traverseVisible(function(D){D.isLight&&D.layers.test(L.layers)&&(d.pushLight(D),D.castShadow&&d.pushShadow(D))}),d.setupLights();const O=new Set;return x.traverse(function(D){if(!(D.isMesh||D.isPoints||D.isLine||D.isSprite))return;const ee=D.material;if(ee)if(Array.isArray(ee))for(let le=0;le<ee.length;le++){const pe=ee[le];Ye(pe,N,D),O.add(pe)}else Ye(ee,N,D),O.add(ee)}),T.pop(),d=null,O},this.compileAsync=function(x,L,N=null){const O=this.compile(x,L,N);return new Promise(D=>{function ee(){if(O.forEach(function(le){Se.get(le).currentProgram.isReady()&&O.delete(le)}),O.size===0){D(x);return}setTimeout(ee,10)}Ne.get("KHR_parallel_shader_compile")!==null?ee():setTimeout(ee,10)})};let Lt=null;function Xt(x){Lt&&Lt(x)}function bo(){yn.stop()}function Mo(){yn.start()}const yn=new vl;yn.setAnimationLoop(Xt),typeof self<"u"&&yn.setContext(self),this.setAnimationLoop=function(x){Lt=x,k.setAnimationLoop(x),x===null?yn.stop():yn.start()},k.addEventListener("sessionstart",bo),k.addEventListener("sessionend",Mo),this.render=function(x,L){if(L!==void 0&&L.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(z===!0)return;if(x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),k.enabled===!0&&k.isPresenting===!0&&(k.cameraAutoUpdate===!0&&k.updateCamera(L),L=k.getCamera()),x.isScene===!0&&x.onBeforeRender(E,x,L,U),d=Ve.get(x,T.length),d.init(L),T.push(d),Ee.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),X.setFromProjectionMatrix(Ee),_e=this.localClippingEnabled,te=Q.init(this.clippingPlanes,_e),m=he.get(x,A.length),m.init(),A.push(m),k.enabled===!0&&k.isPresenting===!0){const ee=E.xr.getDepthSensingMesh();ee!==null&&Ar(ee,L,-1/0,E.sortObjects)}Ar(x,L,0,E.sortObjects),m.finish(),E.sortObjects===!0&&m.sort(re,ue),ze=k.enabled===!1||k.isPresenting===!1||k.hasDepthSensing()===!1,ze&&Me.addToRenderList(m,x),this.info.render.frame++,te===!0&&Q.beginShadows();const N=d.state.shadowsArray;de.render(N,x,L),te===!0&&Q.endShadows(),this.info.autoReset===!0&&this.info.reset();const O=m.opaque,D=m.transmissive;if(d.setupLights(),L.isArrayCamera){const ee=L.cameras;if(D.length>0)for(let le=0,pe=ee.length;le<pe;le++){const me=ee[le];To(O,D,x,me)}ze&&Me.render(x);for(let le=0,pe=ee.length;le<pe;le++){const me=ee[le];Eo(m,x,me,me.viewport)}}else D.length>0&&To(O,D,x,L),ze&&Me.render(x),Eo(m,x,L);U!==null&&(M.updateMultisampleRenderTarget(U),M.updateRenderTargetMipmap(U)),x.isScene===!0&&x.onAfterRender(E,x,L),Ke.resetDefaultState(),b=-1,S=null,T.pop(),T.length>0?(d=T[T.length-1],te===!0&&Q.setGlobalState(E.clippingPlanes,d.state.camera)):d=null,A.pop(),A.length>0?m=A[A.length-1]:m=null};function Ar(x,L,N,O){if(x.visible===!1)return;if(x.layers.test(L.layers)){if(x.isGroup)N=x.renderOrder;else if(x.isLOD)x.autoUpdate===!0&&x.update(L);else if(x.isLight)d.pushLight(x),x.castShadow&&d.pushShadow(x);else if(x.isSprite){if(!x.frustumCulled||X.intersectsSprite(x)){O&&Fe.setFromMatrixPosition(x.matrixWorld).applyMatrix4(Ee);const le=G.update(x),pe=x.material;pe.visible&&m.push(x,le,pe,N,Fe.z,null)}}else if((x.isMesh||x.isLine||x.isPoints)&&(!x.frustumCulled||X.intersectsObject(x))){const le=G.update(x),pe=x.material;if(O&&(x.boundingSphere!==void 0?(x.boundingSphere===null&&x.computeBoundingSphere(),Fe.copy(x.boundingSphere.center)):(le.boundingSphere===null&&le.computeBoundingSphere(),Fe.copy(le.boundingSphere.center)),Fe.applyMatrix4(x.matrixWorld).applyMatrix4(Ee)),Array.isArray(pe)){const me=le.groups;for(let Ae=0,Re=me.length;Ae<Re;Ae++){const ge=me[Ae],He=pe[ge.materialIndex];He&&He.visible&&m.push(x,le,He,N,Fe.z,ge)}}else pe.visible&&m.push(x,le,pe,N,Fe.z,null)}}const ee=x.children;for(let le=0,pe=ee.length;le<pe;le++)Ar(ee[le],L,N,O)}function Eo(x,L,N,O){const D=x.opaque,ee=x.transmissive,le=x.transparent;d.setupLightsView(N),te===!0&&Q.setGlobalState(E.clippingPlanes,N),O&&be.viewport(w.copy(O)),D.length>0&&Ii(D,L,N),ee.length>0&&Ii(ee,L,N),le.length>0&&Ii(le,L,N),be.buffers.depth.setTest(!0),be.buffers.depth.setMask(!0),be.buffers.color.setMask(!0),be.setPolygonOffset(!1)}function To(x,L,N,O){if((N.isScene===!0?N.overrideMaterial:null)!==null)return;d.state.transmissionRenderTarget[O.id]===void 0&&(d.state.transmissionRenderTarget[O.id]=new Nn(1,1,{generateMipmaps:!0,type:Ne.has("EXT_color_buffer_half_float")||Ne.has("EXT_color_buffer_float")?wi:rn,minFilter:Pn,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ke.workingColorSpace}));const ee=d.state.transmissionRenderTarget[O.id],le=O.viewport||w;ee.setSize(le.z,le.w);const pe=E.getRenderTarget();E.setRenderTarget(ee),E.getClearColor(Z),K=E.getClearAlpha(),K<1&&E.setClearColor(16777215,.5),E.clear(),ze&&Me.render(N);const me=E.toneMapping;E.toneMapping=gn;const Ae=O.viewport;if(O.viewport!==void 0&&(O.viewport=void 0),d.setupLightsView(O),te===!0&&Q.setGlobalState(E.clippingPlanes,O),Ii(x,N,O),M.updateMultisampleRenderTarget(ee),M.updateRenderTargetMipmap(ee),Ne.has("WEBGL_multisampled_render_to_texture")===!1){let Re=!1;for(let ge=0,He=L.length;ge<He;ge++){const je=L[ge],Qe=je.object,_t=je.geometry,We=je.material,xe=je.group;if(We.side===Qt&&Qe.layers.test(O.layers)){const qt=We.side;We.side=yt,We.needsUpdate=!0,Ao(Qe,N,O,_t,We,xe),We.side=qt,We.needsUpdate=!0,Re=!0}}Re===!0&&(M.updateMultisampleRenderTarget(ee),M.updateRenderTargetMipmap(ee))}E.setRenderTarget(pe),E.setClearColor(Z,K),Ae!==void 0&&(O.viewport=Ae),E.toneMapping=me}function Ii(x,L,N){const O=L.isScene===!0?L.overrideMaterial:null;for(let D=0,ee=x.length;D<ee;D++){const le=x[D],pe=le.object,me=le.geometry,Ae=O===null?le.material:O,Re=le.group;pe.layers.test(N.layers)&&Ao(pe,L,N,me,Ae,Re)}}function Ao(x,L,N,O,D,ee){x.onBeforeRender(E,L,N,O,D,ee),x.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,x.matrixWorld),x.normalMatrix.getNormalMatrix(x.modelViewMatrix),D.onBeforeRender(E,L,N,O,x,ee),D.transparent===!0&&D.side===Qt&&D.forceSinglePass===!1?(D.side=yt,D.needsUpdate=!0,E.renderBufferDirect(N,L,O,D,x,ee),D.side=_n,D.needsUpdate=!0,E.renderBufferDirect(N,L,O,D,x,ee),D.side=Qt):E.renderBufferDirect(N,L,O,D,x,ee),x.onAfterRender(E,L,N,O,D,ee)}function Ui(x,L,N){L.isScene!==!0&&(L=nt);const O=Se.get(x),D=d.state.lights,ee=d.state.shadowsArray,le=D.state.version,pe=ve.getParameters(x,D.state,ee,L,N),me=ve.getProgramCacheKey(pe);let Ae=O.programs;O.environment=x.isMeshStandardMaterial?L.environment:null,O.fog=L.fog,O.envMap=(x.isMeshStandardMaterial?F:_).get(x.envMap||O.environment),O.envMapRotation=O.environment!==null&&x.envMap===null?L.environmentRotation:x.envMapRotation,Ae===void 0&&(x.addEventListener("dispose",we),Ae=new Map,O.programs=Ae);let Re=Ae.get(me);if(Re!==void 0){if(O.currentProgram===Re&&O.lightsStateVersion===le)return wo(x,pe),Re}else pe.uniforms=ve.getUniforms(x),x.onBeforeCompile(pe,E),Re=ve.acquireProgram(pe,me),Ae.set(me,Re),O.uniforms=pe.uniforms;const ge=O.uniforms;return(!x.isShaderMaterial&&!x.isRawShaderMaterial||x.clipping===!0)&&(ge.clippingPlanes=Q.uniform),wo(x,pe),O.needsLights=Il(x),O.lightsStateVersion=le,O.needsLights&&(ge.ambientLightColor.value=D.state.ambient,ge.lightProbe.value=D.state.probe,ge.directionalLights.value=D.state.directional,ge.directionalLightShadows.value=D.state.directionalShadow,ge.spotLights.value=D.state.spot,ge.spotLightShadows.value=D.state.spotShadow,ge.rectAreaLights.value=D.state.rectArea,ge.ltc_1.value=D.state.rectAreaLTC1,ge.ltc_2.value=D.state.rectAreaLTC2,ge.pointLights.value=D.state.point,ge.pointLightShadows.value=D.state.pointShadow,ge.hemisphereLights.value=D.state.hemi,ge.directionalShadowMap.value=D.state.directionalShadowMap,ge.directionalShadowMatrix.value=D.state.directionalShadowMatrix,ge.spotShadowMap.value=D.state.spotShadowMap,ge.spotLightMatrix.value=D.state.spotLightMatrix,ge.spotLightMap.value=D.state.spotLightMap,ge.pointShadowMap.value=D.state.pointShadowMap,ge.pointShadowMatrix.value=D.state.pointShadowMatrix),O.currentProgram=Re,O.uniformsList=null,Re}function Co(x){if(x.uniformsList===null){const L=x.currentProgram.getUniforms();x.uniformsList=fr.seqWithValue(L.seq,x.uniforms)}return x.uniformsList}function wo(x,L){const N=Se.get(x);N.outputColorSpace=L.outputColorSpace,N.batching=L.batching,N.batchingColor=L.batchingColor,N.instancing=L.instancing,N.instancingColor=L.instancingColor,N.instancingMorph=L.instancingMorph,N.skinning=L.skinning,N.morphTargets=L.morphTargets,N.morphNormals=L.morphNormals,N.morphColors=L.morphColors,N.morphTargetsCount=L.morphTargetsCount,N.numClippingPlanes=L.numClippingPlanes,N.numIntersection=L.numClipIntersection,N.vertexAlphas=L.vertexAlphas,N.vertexTangents=L.vertexTangents,N.toneMapping=L.toneMapping}function Dl(x,L,N,O,D){L.isScene!==!0&&(L=nt),M.resetTextureUnits();const ee=L.fog,le=O.isMeshStandardMaterial?L.environment:null,pe=U===null?E.outputColorSpace:U.isXRRenderTarget===!0?U.texture.colorSpace:hi,me=(O.isMeshStandardMaterial?F:_).get(O.envMap||le),Ae=O.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,Re=!!N.attributes.tangent&&(!!O.normalMap||O.anisotropy>0),ge=!!N.morphAttributes.position,He=!!N.morphAttributes.normal,je=!!N.morphAttributes.color;let Qe=gn;O.toneMapped&&(U===null||U.isXRRenderTarget===!0)&&(Qe=E.toneMapping);const _t=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,We=_t!==void 0?_t.length:0,xe=Se.get(O),qt=d.state.lights;if(te===!0&&(_e===!0||x!==S)){const At=x===S&&O.id===b;Q.setState(O,x,At)}let Xe=!1;O.version===xe.__version?(xe.needsLights&&xe.lightsStateVersion!==qt.state.version||xe.outputColorSpace!==pe||D.isBatchedMesh&&xe.batching===!1||!D.isBatchedMesh&&xe.batching===!0||D.isBatchedMesh&&xe.batchingColor===!0&&D.colorTexture===null||D.isBatchedMesh&&xe.batchingColor===!1&&D.colorTexture!==null||D.isInstancedMesh&&xe.instancing===!1||!D.isInstancedMesh&&xe.instancing===!0||D.isSkinnedMesh&&xe.skinning===!1||!D.isSkinnedMesh&&xe.skinning===!0||D.isInstancedMesh&&xe.instancingColor===!0&&D.instanceColor===null||D.isInstancedMesh&&xe.instancingColor===!1&&D.instanceColor!==null||D.isInstancedMesh&&xe.instancingMorph===!0&&D.morphTexture===null||D.isInstancedMesh&&xe.instancingMorph===!1&&D.morphTexture!==null||xe.envMap!==me||O.fog===!0&&xe.fog!==ee||xe.numClippingPlanes!==void 0&&(xe.numClippingPlanes!==Q.numPlanes||xe.numIntersection!==Q.numIntersection)||xe.vertexAlphas!==Ae||xe.vertexTangents!==Re||xe.morphTargets!==ge||xe.morphNormals!==He||xe.morphColors!==je||xe.toneMapping!==Qe||xe.morphTargetsCount!==We)&&(Xe=!0):(Xe=!0,xe.__version=O.version);let Dt=xe.currentProgram;Xe===!0&&(Dt=Ui(O,L,D));let Bn=!1,bt=!1,mi=!1;const et=Dt.getUniforms(),Bt=xe.uniforms;if(be.useProgram(Dt.program)&&(Bn=!0,bt=!0,mi=!0),O.id!==b&&(b=O.id,bt=!0),Bn||S!==x){be.buffers.depth.getReversed()?(se.copy(x.projectionMatrix),Hc(se),Gc(se),et.setValue(I,"projectionMatrix",se)):et.setValue(I,"projectionMatrix",x.projectionMatrix),et.setValue(I,"viewMatrix",x.matrixWorldInverse);const on=et.map.cameraPosition;on!==void 0&&on.setValue(I,Ce.setFromMatrixPosition(x.matrixWorld)),Oe.logarithmicDepthBuffer&&et.setValue(I,"logDepthBufFC",2/(Math.log(x.far+1)/Math.LN2)),(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial)&&et.setValue(I,"isOrthographic",x.isOrthographicCamera===!0),S!==x&&(S=x,bt=!0,mi=!0)}if(D.isSkinnedMesh){et.setOptional(I,D,"bindMatrix"),et.setOptional(I,D,"bindMatrixInverse");const At=D.skeleton;At&&(At.boneTexture===null&&At.computeBoneTexture(),et.setValue(I,"boneTexture",At.boneTexture,M))}D.isBatchedMesh&&(et.setOptional(I,D,"batchingTexture"),et.setValue(I,"batchingTexture",D._matricesTexture,M),et.setOptional(I,D,"batchingIdTexture"),et.setValue(I,"batchingIdTexture",D._indirectTexture,M),et.setOptional(I,D,"batchingColorTexture"),D._colorsTexture!==null&&et.setValue(I,"batchingColorTexture",D._colorsTexture,M));const gi=N.morphAttributes;if((gi.position!==void 0||gi.normal!==void 0||gi.color!==void 0)&&Te.update(D,N,Dt),(bt||xe.receiveShadow!==D.receiveShadow)&&(xe.receiveShadow=D.receiveShadow,et.setValue(I,"receiveShadow",D.receiveShadow)),O.isMeshGouraudMaterial&&O.envMap!==null&&(Bt.envMap.value=me,Bt.flipEnvMap.value=me.isCubeTexture&&me.isRenderTargetTexture===!1?-1:1),O.isMeshStandardMaterial&&O.envMap===null&&L.environment!==null&&(Bt.envMapIntensity.value=L.environmentIntensity),bt&&(et.setValue(I,"toneMappingExposure",E.toneMappingExposure),xe.needsLights&&Pl(Bt,mi),ee&&O.fog===!0&&oe.refreshFogUniforms(Bt,ee),oe.refreshMaterialUniforms(Bt,O,H,J,d.state.transmissionRenderTarget[x.id]),fr.upload(I,Co(xe),Bt,M)),O.isShaderMaterial&&O.uniformsNeedUpdate===!0&&(fr.upload(I,Co(xe),Bt,M),O.uniformsNeedUpdate=!1),O.isSpriteMaterial&&et.setValue(I,"center",D.center),et.setValue(I,"modelViewMatrix",D.modelViewMatrix),et.setValue(I,"normalMatrix",D.normalMatrix),et.setValue(I,"modelMatrix",D.matrixWorld),O.isShaderMaterial||O.isRawShaderMaterial){const At=O.uniformsGroups;for(let on=0,an=At.length;on<an;on++){const Ro=At[on];R.update(Ro,Dt),R.bind(Ro,Dt)}}return Dt}function Pl(x,L){x.ambientLightColor.needsUpdate=L,x.lightProbe.needsUpdate=L,x.directionalLights.needsUpdate=L,x.directionalLightShadows.needsUpdate=L,x.pointLights.needsUpdate=L,x.pointLightShadows.needsUpdate=L,x.spotLights.needsUpdate=L,x.spotLightShadows.needsUpdate=L,x.rectAreaLights.needsUpdate=L,x.hemisphereLights.needsUpdate=L}function Il(x){return x.isMeshLambertMaterial||x.isMeshToonMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isShadowMaterial||x.isShaderMaterial&&x.lights===!0}this.getActiveCubeFace=function(){return P},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return U},this.setRenderTargetTextures=function(x,L,N){Se.get(x.texture).__webglTexture=L,Se.get(x.depthTexture).__webglTexture=N;const O=Se.get(x);O.__hasExternalTextures=!0,O.__autoAllocateDepthBuffer=N===void 0,O.__autoAllocateDepthBuffer||Ne.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),O.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(x,L){const N=Se.get(x);N.__webglFramebuffer=L,N.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(x,L=0,N=0){U=x,P=L,C=N;let O=!0,D=null,ee=!1,le=!1;if(x){const me=Se.get(x);if(me.__useDefaultFramebuffer!==void 0)be.bindFramebuffer(I.FRAMEBUFFER,null),O=!1;else if(me.__webglFramebuffer===void 0)M.setupRenderTarget(x);else if(me.__hasExternalTextures)M.rebindTextures(x,Se.get(x.texture).__webglTexture,Se.get(x.depthTexture).__webglTexture);else if(x.depthBuffer){const ge=x.depthTexture;if(me.__boundDepthTexture!==ge){if(ge!==null&&Se.has(ge)&&(x.width!==ge.image.width||x.height!==ge.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");M.setupDepthRenderbuffer(x)}}const Ae=x.texture;(Ae.isData3DTexture||Ae.isDataArrayTexture||Ae.isCompressedArrayTexture)&&(le=!0);const Re=Se.get(x).__webglFramebuffer;x.isWebGLCubeRenderTarget?(Array.isArray(Re[L])?D=Re[L][N]:D=Re[L],ee=!0):x.samples>0&&M.useMultisampledRTT(x)===!1?D=Se.get(x).__webglMultisampledFramebuffer:Array.isArray(Re)?D=Re[N]:D=Re,w.copy(x.viewport),W.copy(x.scissor),V=x.scissorTest}else w.copy(ye).multiplyScalar(H).floor(),W.copy(Ue).multiplyScalar(H).floor(),V=Ze;if(be.bindFramebuffer(I.FRAMEBUFFER,D)&&O&&be.drawBuffers(x,D),be.viewport(w),be.scissor(W),be.setScissorTest(V),ee){const me=Se.get(x.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+L,me.__webglTexture,N)}else if(le){const me=Se.get(x.texture),Ae=L||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,me.__webglTexture,N||0,Ae)}b=-1},this.readRenderTargetPixels=function(x,L,N,O,D,ee,le){if(!(x&&x.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pe=Se.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&le!==void 0&&(pe=pe[le]),pe){be.bindFramebuffer(I.FRAMEBUFFER,pe);try{const me=x.texture,Ae=me.format,Re=me.type;if(!Oe.textureFormatReadable(Ae)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Oe.textureTypeReadable(Re)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=x.width-O&&N>=0&&N<=x.height-D&&I.readPixels(L,N,O,D,De.convert(Ae),De.convert(Re),ee)}finally{const me=U!==null?Se.get(U).__webglFramebuffer:null;be.bindFramebuffer(I.FRAMEBUFFER,me)}}},this.readRenderTargetPixelsAsync=async function(x,L,N,O,D,ee,le){if(!(x&&x.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let pe=Se.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&le!==void 0&&(pe=pe[le]),pe){const me=x.texture,Ae=me.format,Re=me.type;if(!Oe.textureFormatReadable(Ae))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Oe.textureTypeReadable(Re))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(L>=0&&L<=x.width-O&&N>=0&&N<=x.height-D){be.bindFramebuffer(I.FRAMEBUFFER,pe);const ge=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,ge),I.bufferData(I.PIXEL_PACK_BUFFER,ee.byteLength,I.STREAM_READ),I.readPixels(L,N,O,D,De.convert(Ae),De.convert(Re),0);const He=U!==null?Se.get(U).__webglFramebuffer:null;be.bindFramebuffer(I.FRAMEBUFFER,He);const je=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await kc(I,je,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,ge),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,ee),I.deleteBuffer(ge),I.deleteSync(je),ee}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(x,L=null,N=0){x.isTexture!==!0&&(Mi("WebGLRenderer: copyFramebufferToTexture function signature has changed."),L=arguments[0]||null,x=arguments[1]);const O=Math.pow(2,-N),D=Math.floor(x.image.width*O),ee=Math.floor(x.image.height*O),le=L!==null?L.x:0,pe=L!==null?L.y:0;M.setTexture2D(x,0),I.copyTexSubImage2D(I.TEXTURE_2D,N,0,0,le,pe,D,ee),be.unbindTexture()},this.copyTextureToTexture=function(x,L,N=null,O=null,D=0){x.isTexture!==!0&&(Mi("WebGLRenderer: copyTextureToTexture function signature has changed."),O=arguments[0]||null,x=arguments[1],L=arguments[2],D=arguments[3]||0,N=null);let ee,le,pe,me,Ae,Re,ge,He,je;const Qe=x.isCompressedTexture?x.mipmaps[D]:x.image;N!==null?(ee=N.max.x-N.min.x,le=N.max.y-N.min.y,pe=N.isBox3?N.max.z-N.min.z:1,me=N.min.x,Ae=N.min.y,Re=N.isBox3?N.min.z:0):(ee=Qe.width,le=Qe.height,pe=Qe.depth||1,me=0,Ae=0,Re=0),O!==null?(ge=O.x,He=O.y,je=O.z):(ge=0,He=0,je=0);const _t=De.convert(L.format),We=De.convert(L.type);let xe;L.isData3DTexture?(M.setTexture3D(L,0),xe=I.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(M.setTexture2DArray(L,0),xe=I.TEXTURE_2D_ARRAY):(M.setTexture2D(L,0),xe=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,L.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,L.unpackAlignment);const qt=I.getParameter(I.UNPACK_ROW_LENGTH),Xe=I.getParameter(I.UNPACK_IMAGE_HEIGHT),Dt=I.getParameter(I.UNPACK_SKIP_PIXELS),Bn=I.getParameter(I.UNPACK_SKIP_ROWS),bt=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,Qe.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Qe.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,me),I.pixelStorei(I.UNPACK_SKIP_ROWS,Ae),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Re);const mi=x.isDataArrayTexture||x.isData3DTexture,et=L.isDataArrayTexture||L.isData3DTexture;if(x.isRenderTargetTexture||x.isDepthTexture){const Bt=Se.get(x),gi=Se.get(L),At=Se.get(Bt.__renderTarget),on=Se.get(gi.__renderTarget);be.bindFramebuffer(I.READ_FRAMEBUFFER,At.__webglFramebuffer),be.bindFramebuffer(I.DRAW_FRAMEBUFFER,on.__webglFramebuffer);for(let an=0;an<pe;an++)mi&&I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Se.get(x).__webglTexture,D,Re+an),x.isDepthTexture?(et&&I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,Se.get(L).__webglTexture,D,je+an),I.blitFramebuffer(me,Ae,ee,le,ge,He,ee,le,I.DEPTH_BUFFER_BIT,I.NEAREST)):et?I.copyTexSubImage3D(xe,D,ge,He,je+an,me,Ae,ee,le):I.copyTexSubImage2D(xe,D,ge,He,je+an,me,Ae,ee,le);be.bindFramebuffer(I.READ_FRAMEBUFFER,null),be.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else et?x.isDataTexture||x.isData3DTexture?I.texSubImage3D(xe,D,ge,He,je,ee,le,pe,_t,We,Qe.data):L.isCompressedArrayTexture?I.compressedTexSubImage3D(xe,D,ge,He,je,ee,le,pe,_t,Qe.data):I.texSubImage3D(xe,D,ge,He,je,ee,le,pe,_t,We,Qe):x.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,D,ge,He,ee,le,_t,We,Qe.data):x.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,D,ge,He,Qe.width,Qe.height,_t,Qe.data):I.texSubImage2D(I.TEXTURE_2D,D,ge,He,ee,le,_t,We,Qe);I.pixelStorei(I.UNPACK_ROW_LENGTH,qt),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Xe),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Dt),I.pixelStorei(I.UNPACK_SKIP_ROWS,Bn),I.pixelStorei(I.UNPACK_SKIP_IMAGES,bt),D===0&&L.generateMipmaps&&I.generateMipmap(xe),be.unbindTexture()},this.copyTextureToTexture3D=function(x,L,N=null,O=null,D=0){return x.isTexture!==!0&&(Mi("WebGLRenderer: copyTextureToTexture3D function signature has changed."),N=arguments[0]||null,O=arguments[1]||null,x=arguments[2],L=arguments[3],D=arguments[4]||0),Mi('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(x,L,N,O,D)},this.initRenderTarget=function(x){Se.get(x).__webglFramebuffer===void 0&&M.setupRenderTarget(x)},this.initTexture=function(x){x.isCubeTexture?M.setTextureCube(x,0):x.isData3DTexture?M.setTexture3D(x,0):x.isDataArrayTexture||x.isCompressedArrayTexture?M.setTexture2DArray(x,0):M.setTexture2D(x,0),be.unbindTexture()},this.resetState=function(){P=0,C=0,U=null,be.reset(),Ke.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return tn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=ke._getDrawingBufferColorSpace(t),e.unpackColorSpace=ke._getUnpackColorSpace()}}class tm extends mt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wt,this.environmentIntensity=1,this.environmentRotation=new Wt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class nm extends Pi{static get type(){return"MeshPhongMaterial"}constructor(t){super(),this.isMeshPhongMaterial=!0,this.color=new Ge(16777215),this.specular=new Ge(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ge(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=sl,this.normalScale=new qe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wt,this.combine=uo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.specular.copy(t.specular),this.shininess=t.shininess,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Tl extends mt{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ge(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}const is=new ot,Pa=new B,Ia=new B;class im{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new qe(512,512),this.map=null,this.mapPass=null,this.matrix=new ot,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new xo,this._frameExtents=new qe(1,1),this._viewportCount=1,this._viewports=[new st(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Pa.setFromMatrixPosition(t.matrixWorld),e.position.copy(Pa),Ia.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Ia),e.updateMatrixWorld(),is.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(is),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(is)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class rm extends im{constructor(){super(new xl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class sm extends Tl{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(mt.DEFAULT_UP),this.updateMatrix(),this.target=new mt,this.shadow=new rm}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class om extends Tl{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:co}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=co);class am{constructor(){h(this,"id","cubes");h(this,"name","Rotating Cubes");h(this,"type","sketch");h(this,"controls",[{name:"rotationSpeed",type:"float",label:"Rotation Speed",defaultValue:1,min:.1,max:5},{name:"cubeCount",type:"integer",label:"Cube Count",defaultValue:5,min:1,max:20},{name:"cubeSize",type:"float",label:"Cube Size",defaultValue:1,min:.2,max:3},{name:"randomize",type:"trigger",label:"Randomize Colors"}]);h(this,"canvas");h(this,"renderer");h(this,"scene");h(this,"camera");h(this,"cubes",[]);h(this,"rotationSpeed",1);h(this,"cubeCount",5);h(this,"cubeSize",1);h(this,"shouldRandomize",!1);h(this,"colors",[16739179,5164484,4569041,9883316,16771751])}async init(t){this.canvas=t,this.renderer=new em({canvas:t,alpha:!0,antialias:!0,preserveDrawingBuffer:!0}),this.renderer.setSize(t.width,t.height),this.renderer.setClearColor(0,0),this.scene=new tm,this.camera=new Rt(75,t.width/t.height,.1,1e3),this.camera.position.z=10;const e=new om(4210752);this.scene.add(e);const n=new sm(16777215,1);n.position.set(5,5,5),this.scene.add(n),this.createCubes()}createCubes(){for(const e of this.cubes)this.scene.remove(e),e.geometry.dispose(),e.material.dispose();this.cubes=[];const t=new fi(this.cubeSize,this.cubeSize,this.cubeSize);for(let e=0;e<this.cubeCount;e++){const n=new nm({color:this.colors[e%this.colors.length],shininess:100}),i=new kt(t,n),s=e/this.cubeCount*Math.PI*2,o=3;i.position.x=Math.cos(s)*o,i.position.y=Math.sin(s)*o,i.position.z=Math.sin(s*2)*2,this.scene.add(i),this.cubes.push(i)}}randomizeColors(){this.colors=this.colors.map(()=>Math.floor(Math.random()*16777215));for(let t=0;t<this.cubes.length;t++)this.cubes[t].material.color.setHex(this.colors[t%this.colors.length])}render(t){this.shouldRandomize&&(this.randomizeColors(),this.shouldRandomize=!1),(this.renderer.domElement.width!==this.canvas.width||this.renderer.domElement.height!==this.canvas.height)&&(this.renderer.setSize(this.canvas.width,this.canvas.height),this.camera.aspect=this.canvas.width/this.canvas.height,this.camera.updateProjectionMatrix());for(let e=0;e<this.cubes.length;e++){const n=this.cubes[e];n.rotation.x=t*this.rotationSpeed+e*.5,n.rotation.y=t*this.rotationSpeed*.7+e*.3;const i=e/this.cubes.length*Math.PI*2+t*.3*this.rotationSpeed,s=3;n.position.x=Math.cos(i)*s,n.position.y=Math.sin(i)*s,n.position.z=Math.sin(i*2+t*.5)*2}this.renderer.render(this.scene,this.camera)}dispose(){for(const t of this.cubes)t.geometry.dispose(),t.material.dispose();this.renderer.dispose()}setControl(t,e){if(t==="rotationSpeed"&&typeof e=="number")this.rotationSpeed=e;else if(t==="cubeCount"&&typeof e=="number"){const n=Math.floor(e);n!==this.cubeCount&&(this.cubeCount=n,this.createCubes())}else t==="cubeSize"&&typeof e=="number"?e!==this.cubeSize&&(this.cubeSize=e,this.createCubes()):t==="randomize"&&e===!0&&(this.shouldRandomize=!0)}getControl(t){if(t==="rotationSpeed")return this.rotationSpeed;if(t==="cubeCount")return this.cubeCount;if(t==="cubeSize")return this.cubeSize;if(t==="randomize")return!1}}const lm={id:"cubes",name:"Rotating Cubes",type:"sketch",create:()=>new am};function Ua(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function Fa(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const cm=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,um=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_speed;
uniform float u_gridX;
uniform float u_gridY;
uniform float u_ringCount;
uniform float u_ringWidth;
uniform float u_pulseStrength;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_resolution;

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Create grid
  vec2 gridSize = vec2(u_gridX, u_gridY);
  vec2 cellUv = fract(uv * gridSize) - 0.5;
  vec2 cellId = floor(uv * gridSize);

  // Distance from center of each cell
  float dist = length(cellUv) * 2.0;

  // Phase offset per cell for variety
  float phaseOffset = (cellId.x + cellId.y * 3.14159) * 0.5;

  // Create expanding rings
  float rings = fract(dist * u_ringCount - t + phaseOffset);

  // Sharp ring edges with width control
  float ring = smoothstep(0.0, u_ringWidth, rings) * smoothstep(u_ringWidth * 2.0, u_ringWidth, rings);

  // Pulse effect - rings get brighter as they expand
  float pulse = 1.0 - dist * u_pulseStrength;
  pulse = clamp(pulse, 0.2, 1.0);

  // Fade at cell edges
  float edge = 1.0 - smoothstep(0.4, 0.5, max(abs(cellUv.x), abs(cellUv.y)));

  ring *= edge * pulse;

  vec3 color = mix(u_color1, u_color2, ring);

  fragColor = vec4(color, 1.0);
}
`;class hm{constructor(){h(this,"id","concentricCircles");h(this,"name","Concentric Circles");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:.5,min:0,max:3},{name:"gridX",type:"integer",label:"Grid X",defaultValue:4,min:1,max:12},{name:"gridY",type:"integer",label:"Grid Y",defaultValue:4,min:1,max:12},{name:"ringCount",type:"float",label:"Ring Count",defaultValue:5,min:1,max:15},{name:"ringWidth",type:"float",label:"Ring Width",defaultValue:.15,min:.02,max:.4},{name:"pulseStrength",type:"float",label:"Pulse",defaultValue:.5,min:0,max:1},{name:"color1",type:"color",label:"Background",defaultValue:"#0a0a1a"},{name:"color2",type:"color",label:"Rings",defaultValue:"#00ffaa"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",.5);h(this,"gridX",4);h(this,"gridY",4);h(this,"ringCount",5);h(this,"ringWidth",.15);h(this,"pulseStrength",.5);h(this,"color1",[.04,.04,.1]);h(this,"color2",[0,1,.67]);h(this,"accumulatedTime",0);h(this,"lastRenderTime",0)}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,cm),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,um),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),gridX:e.getUniformLocation(this.program,"u_gridX"),gridY:e.getUniformLocation(this.program,"u_gridY"),ringCount:e.getUniformLocation(this.program,"u_ringCount"),ringWidth:e.getUniformLocation(this.program,"u_ringWidth"),pulseStrength:e.getUniformLocation(this.program,"u_pulseStrength"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao);const n=t-this.lastRenderTime;this.accumulatedTime+=n*this.speed,this.lastRenderTime=t,e.uniform1f(this.uniforms.time,this.accumulatedTime),e.uniform1f(this.uniforms.speed,1),e.uniform1f(this.uniforms.gridX,this.gridX),e.uniform1f(this.uniforms.gridY,this.gridY),e.uniform1f(this.uniforms.ringCount,this.ringCount),e.uniform1f(this.uniforms.ringWidth,this.ringWidth),e.uniform1f(this.uniforms.pulseStrength,this.pulseStrength),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="gridX"&&typeof e=="number"?this.gridX=e:t==="gridY"&&typeof e=="number"?this.gridY=e:t==="ringCount"&&typeof e=="number"?this.ringCount=e:t==="ringWidth"&&typeof e=="number"?this.ringWidth=e:t==="pulseStrength"&&typeof e=="number"?this.pulseStrength=e:t==="color1"&&typeof e=="string"?this.color1=Ua(e):t==="color2"&&typeof e=="string"&&(this.color2=Ua(e))}getControl(t){if(t==="speed")return this.speed;if(t==="gridX")return this.gridX;if(t==="gridY")return this.gridY;if(t==="ringCount")return this.ringCount;if(t==="ringWidth")return this.ringWidth;if(t==="pulseStrength")return this.pulseStrength;if(t==="color1")return Fa(...this.color1);if(t==="color2")return Fa(...this.color2)}}const dm={id:"concentricCircles",name:"Concentric Circles",type:"shader",create:()=>new hm};function rs(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function ss(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const fm=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,pm=`#version 300 es
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
`;class mm{constructor(){h(this,"id","fireBlob");h(this,"name","Fire Blob");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:1,min:.1,max:3},{name:"scale",type:"float",label:"Scale",defaultValue:3,min:1,max:8},{name:"intensity",type:"float",label:"Intensity",defaultValue:1.5,min:.5,max:3},{name:"spread",type:"float",label:"Spread",defaultValue:.6,min:.2,max:1.5},{name:"turbulence",type:"float",label:"Turbulence",defaultValue:1,min:0,max:3},{name:"colorInner",type:"color",label:"Inner",defaultValue:"#ffffcc"},{name:"colorMid",type:"color",label:"Middle",defaultValue:"#ff6600"},{name:"colorOuter",type:"color",label:"Outer",defaultValue:"#cc0000"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",1);h(this,"scale",3);h(this,"intensity",1.5);h(this,"spread",.6);h(this,"turbulence",1);h(this,"colorInner",[1,1,.8]);h(this,"colorMid",[1,.4,0]);h(this,"colorOuter",[.8,0,0]);h(this,"accumulatedTime",0);h(this,"lastRenderTime",0)}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,fm),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,pm),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),scale:e.getUniformLocation(this.program,"u_scale"),intensity:e.getUniformLocation(this.program,"u_intensity"),spread:e.getUniformLocation(this.program,"u_spread"),turbulence:e.getUniformLocation(this.program,"u_turbulence"),colorInner:e.getUniformLocation(this.program,"u_colorInner"),colorMid:e.getUniformLocation(this.program,"u_colorMid"),colorOuter:e.getUniformLocation(this.program,"u_colorOuter"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao);const n=t-this.lastRenderTime;this.accumulatedTime+=n*this.speed,this.lastRenderTime=t,e.uniform1f(this.uniforms.time,this.accumulatedTime),e.uniform1f(this.uniforms.speed,1),e.uniform1f(this.uniforms.scale,this.scale),e.uniform1f(this.uniforms.intensity,this.intensity),e.uniform1f(this.uniforms.spread,this.spread),e.uniform1f(this.uniforms.turbulence,this.turbulence),e.uniform3fv(this.uniforms.colorInner,this.colorInner),e.uniform3fv(this.uniforms.colorMid,this.colorMid),e.uniform3fv(this.uniforms.colorOuter,this.colorOuter),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="scale"&&typeof e=="number"?this.scale=e:t==="intensity"&&typeof e=="number"?this.intensity=e:t==="spread"&&typeof e=="number"?this.spread=e:t==="turbulence"&&typeof e=="number"?this.turbulence=e:t==="colorInner"&&typeof e=="string"?this.colorInner=rs(e):t==="colorMid"&&typeof e=="string"?this.colorMid=rs(e):t==="colorOuter"&&typeof e=="string"&&(this.colorOuter=rs(e))}getControl(t){if(t==="speed")return this.speed;if(t==="scale")return this.scale;if(t==="intensity")return this.intensity;if(t==="spread")return this.spread;if(t==="turbulence")return this.turbulence;if(t==="colorInner")return ss(...this.colorInner);if(t==="colorMid")return ss(...this.colorMid);if(t==="colorOuter")return ss(...this.colorOuter)}}const gm={id:"fireBlob",name:"Fire Blob",type:"shader",create:()=>new mm};function Na(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function Oa(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const _m=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,vm=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform float u_octaves;
uniform float u_persistence;
uniform float u_lacunarity;
uniform float u_contrast;
uniform int u_mode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_resolution;

// Classic Perlin noise implementation
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  int octaves = int(u_octaves);

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    amplitude *= u_persistence;
    frequency *= u_lacunarity;
  }

  return value;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;
  vec3 pos = vec3(uv * u_scale, t * 0.5);

  float noise = fbm(pos);

  // Normalize to 0-1 range (noise is roughly -1 to 1)
  noise = noise * 0.5 + 0.5;

  // Apply contrast
  noise = pow(noise, u_contrast);

  vec3 color;

  if (u_mode == 0) {
    // Smooth gradient
    color = mix(u_color1, u_color2, noise);
  } else if (u_mode == 1) {
    // Ridged - creates mountain-like ridges
    float ridged = 1.0 - abs(noise * 2.0 - 1.0);
    ridged = pow(ridged, 2.0);
    color = mix(u_color1, u_color2, ridged);
  } else if (u_mode == 2) {
    // Stepped - creates contour lines
    float stepped = floor(noise * 8.0) / 8.0;
    color = mix(u_color1, u_color2, stepped);
  } else {
    // Turbulent - absolute value creates sharp features
    float turb = abs(fbm(pos * 2.0));
    color = mix(u_color1, u_color2, turb);
  }

  fragColor = vec4(color, 1.0);
}
`;class xm{constructor(){h(this,"id","perlinNoise");h(this,"name","Perlin Noise");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:.3,min:0,max:2},{name:"scale",type:"float",label:"Scale",defaultValue:3,min:.5,max:10},{name:"octaves",type:"integer",label:"Octaves",defaultValue:5,min:1,max:8},{name:"persistence",type:"float",label:"Persistence",defaultValue:.5,min:.1,max:.9},{name:"lacunarity",type:"float",label:"Lacunarity",defaultValue:2,min:1.5,max:3},{name:"contrast",type:"float",label:"Contrast",defaultValue:1,min:.5,max:3},{name:"mode",type:"integer",label:"Mode",defaultValue:0,min:0,max:3},{name:"color1",type:"color",label:"Color 1",defaultValue:"#1a1a2e"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#eaf6ff"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",.3);h(this,"scale",3);h(this,"octaves",5);h(this,"persistence",.5);h(this,"lacunarity",2);h(this,"contrast",1);h(this,"mode",0);h(this,"color1",[.1,.1,.18]);h(this,"color2",[.92,.96,1])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,_m),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,vm),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),scale:e.getUniformLocation(this.program,"u_scale"),octaves:e.getUniformLocation(this.program,"u_octaves"),persistence:e.getUniformLocation(this.program,"u_persistence"),lacunarity:e.getUniformLocation(this.program,"u_lacunarity"),contrast:e.getUniformLocation(this.program,"u_contrast"),mode:e.getUniformLocation(this.program,"u_mode"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.scale,this.scale),e.uniform1f(this.uniforms.octaves,this.octaves),e.uniform1f(this.uniforms.persistence,this.persistence),e.uniform1f(this.uniforms.lacunarity,this.lacunarity),e.uniform1f(this.uniforms.contrast,this.contrast),e.uniform1i(this.uniforms.mode,this.mode),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="scale"&&typeof e=="number"?this.scale=e:t==="octaves"&&typeof e=="number"?this.octaves=e:t==="persistence"&&typeof e=="number"?this.persistence=e:t==="lacunarity"&&typeof e=="number"?this.lacunarity=e:t==="contrast"&&typeof e=="number"?this.contrast=e:t==="mode"&&typeof e=="number"?this.mode=e:t==="color1"&&typeof e=="string"?this.color1=Na(e):t==="color2"&&typeof e=="string"&&(this.color2=Na(e))}getControl(t){if(t==="speed")return this.speed;if(t==="scale")return this.scale;if(t==="octaves")return this.octaves;if(t==="persistence")return this.persistence;if(t==="lacunarity")return this.lacunarity;if(t==="contrast")return this.contrast;if(t==="mode")return this.mode;if(t==="color1")return Oa(...this.color1);if(t==="color2")return Oa(...this.color2)}}const ym={id:"perlinNoise",name:"Perlin Noise",type:"shader",create:()=>new xm};function os(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function as(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Sm=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,bm=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform float u_edgeWidth;
uniform float u_jitter;
uniform int u_mode;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_edgeColor;
uniform vec2 u_resolution;

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;
  vec2 pos = uv * u_scale;

  // Cell coordinates
  vec2 cellId = floor(pos);
  vec2 cellUv = fract(pos);

  float minDist = 10.0;
  float secondMinDist = 10.0;
  vec2 closestCell = vec2(0.0);

  // Check 3x3 neighborhood
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 neighborCell = cellId + neighbor;

      // Random point in neighbor cell with animation
      vec2 randomOffset = hash2(neighborCell);
      vec2 animatedOffset = sin(t + 6.2831 * randomOffset) * 0.5 + 0.5;
      vec2 point = neighbor + mix(vec2(0.5), animatedOffset, u_jitter);

      // Distance to point
      float dist = length(cellUv - point);

      // Track closest and second closest
      if (dist < minDist) {
        secondMinDist = minDist;
        minDist = dist;
        closestCell = neighborCell;
      } else if (dist < secondMinDist) {
        secondMinDist = dist;
      }
    }
  }

  vec3 color;

  if (u_mode == 0) {
    // Distance field - gradient from center
    float value = minDist;
    color = mix(u_color1, u_color2, value);

    // Add edges
    float edge = smoothstep(0.0, u_edgeWidth, secondMinDist - minDist);
    color = mix(u_edgeColor, color, edge);

  } else if (u_mode == 1) {
    // Cell colors based on ID
    vec3 cellColor = vec3(hash2(closestCell), fract(closestCell.x * 0.1 + closestCell.y * 0.2 + t * 0.1));
    color = mix(u_color1, u_color2, cellColor.x);

    // Add edges
    float edge = smoothstep(0.0, u_edgeWidth, secondMinDist - minDist);
    color = mix(u_edgeColor, color, edge);

  } else if (u_mode == 2) {
    // Edges only (like cell membrane)
    float edge = 1.0 - smoothstep(0.0, u_edgeWidth, secondMinDist - minDist);
    color = mix(u_color1, u_edgeColor, edge);

  } else {
    // Cracked - dark cracks with noise
    float edge = smoothstep(0.0, u_edgeWidth * 0.5, secondMinDist - minDist);
    float noise = fract(sin(dot(closestCell, vec2(12.9898, 78.233))) * 43758.5453);
    color = mix(u_color1, u_color2, noise * 0.3 + 0.7);
    color = mix(u_edgeColor, color, edge);
  }

  fragColor = vec4(color, 1.0);
}
`;class Mm{constructor(){h(this,"id","voronoi");h(this,"name","Voronoi");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:.3,min:0,max:2},{name:"scale",type:"float",label:"Scale",defaultValue:6,min:2,max:20},{name:"edgeWidth",type:"float",label:"Edge Width",defaultValue:.05,min:.01,max:.3},{name:"jitter",type:"float",label:"Jitter",defaultValue:.4,min:0,max:1},{name:"mode",type:"integer",label:"Mode",defaultValue:0,min:0,max:3},{name:"color1",type:"color",label:"Color 1",defaultValue:"#1a1a2e"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#4a9eff"},{name:"edgeColor",type:"color",label:"Edge",defaultValue:"#ffffff"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",.3);h(this,"scale",6);h(this,"edgeWidth",.05);h(this,"jitter",.4);h(this,"mode",0);h(this,"color1",[.1,.1,.18]);h(this,"color2",[.29,.62,1]);h(this,"edgeColor",[1,1,1])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Sm),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,bm),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),scale:e.getUniformLocation(this.program,"u_scale"),edgeWidth:e.getUniformLocation(this.program,"u_edgeWidth"),jitter:e.getUniformLocation(this.program,"u_jitter"),mode:e.getUniformLocation(this.program,"u_mode"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),edgeColor:e.getUniformLocation(this.program,"u_edgeColor"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.scale,this.scale),e.uniform1f(this.uniforms.edgeWidth,this.edgeWidth),e.uniform1f(this.uniforms.jitter,this.jitter),e.uniform1i(this.uniforms.mode,this.mode),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform3fv(this.uniforms.edgeColor,this.edgeColor),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="scale"&&typeof e=="number"?this.scale=e:t==="edgeWidth"&&typeof e=="number"?this.edgeWidth=e:t==="jitter"&&typeof e=="number"?this.jitter=e:t==="mode"&&typeof e=="number"?this.mode=e:t==="color1"&&typeof e=="string"?this.color1=os(e):t==="color2"&&typeof e=="string"?this.color2=os(e):t==="edgeColor"&&typeof e=="string"&&(this.edgeColor=os(e))}getControl(t){if(t==="speed")return this.speed;if(t==="scale")return this.scale;if(t==="edgeWidth")return this.edgeWidth;if(t==="jitter")return this.jitter;if(t==="mode")return this.mode;if(t==="color1")return as(...this.color1);if(t==="color2")return as(...this.color2);if(t==="edgeColor")return as(...this.edgeColor)}}const Em={id:"voronoi",name:"Voronoi",type:"shader",create:()=>new Mm};function ls(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function cs(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Tm=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,Am=`#version 300 es
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
`;class Cm{constructor(){h(this,"id","kaleidoscope");h(this,"name","Kaleidoscope");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:.5,min:0,max:2},{name:"segments",type:"integer",label:"Segments",defaultValue:6,min:3,max:16},{name:"zoom",type:"float",label:"Zoom",defaultValue:3,min:1,max:10},{name:"rotation",type:"float",label:"Rotation",defaultValue:.2,min:-1,max:1},{name:"complexity",type:"float",label:"Complexity",defaultValue:3,min:1,max:8},{name:"color1",type:"color",label:"Color 1",defaultValue:"#ff3366"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#33ccff"},{name:"color3",type:"color",label:"Color 3",defaultValue:"#ffcc00"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",.5);h(this,"segments",6);h(this,"zoom",3);h(this,"rotation",.2);h(this,"complexity",3);h(this,"color1",[1,.2,.4]);h(this,"color2",[.2,.8,1]);h(this,"color3",[1,.8,0])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Tm),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,Am),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),segments:e.getUniformLocation(this.program,"u_segments"),zoom:e.getUniformLocation(this.program,"u_zoom"),rotation:e.getUniformLocation(this.program,"u_rotation"),complexity:e.getUniformLocation(this.program,"u_complexity"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),color3:e.getUniformLocation(this.program,"u_color3"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.segments,this.segments),e.uniform1f(this.uniforms.zoom,this.zoom),e.uniform1f(this.uniforms.rotation,this.rotation),e.uniform1f(this.uniforms.complexity,this.complexity),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform3fv(this.uniforms.color3,this.color3),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="segments"&&typeof e=="number"?this.segments=e:t==="zoom"&&typeof e=="number"?this.zoom=e:t==="rotation"&&typeof e=="number"?this.rotation=e:t==="complexity"&&typeof e=="number"?this.complexity=e:t==="color1"&&typeof e=="string"?this.color1=ls(e):t==="color2"&&typeof e=="string"?this.color2=ls(e):t==="color3"&&typeof e=="string"&&(this.color3=ls(e))}getControl(t){if(t==="speed")return this.speed;if(t==="segments")return this.segments;if(t==="zoom")return this.zoom;if(t==="rotation")return this.rotation;if(t==="complexity")return this.complexity;if(t==="color1")return cs(...this.color1);if(t==="color2")return cs(...this.color2);if(t==="color3")return cs(...this.color3)}}const wm={id:"kaleidoscope",name:"Kaleidoscope",type:"shader",create:()=>new Cm};function Ba(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function za(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Rm=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,Lm=`#version 300 es
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
`;class Dm{constructor(){h(this,"id","tunnel");h(this,"name","Tunnel");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:.5,min:0,max:2},{name:"twist",type:"float",label:"Twist",defaultValue:1,min:0,max:5},{name:"depth",type:"float",label:"Depth",defaultValue:1,min:.2,max:3},{name:"ringCount",type:"float",label:"Rings",defaultValue:10,min:2,max:30,step:1},{name:"wobble",type:"float",label:"Wobble",defaultValue:.3,min:0,max:2},{name:"pattern",type:"integer",label:"Pattern",defaultValue:0,min:0,max:4},{name:"color1",type:"color",label:"Color 1",defaultValue:"#000033"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#00ffff"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",.5);h(this,"twist",1);h(this,"depth",1);h(this,"ringCount",10);h(this,"wobble",.3);h(this,"pattern",0);h(this,"color1",[0,0,.2]);h(this,"color2",[0,1,1])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Rm),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,Lm),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),twist:e.getUniformLocation(this.program,"u_twist"),depth:e.getUniformLocation(this.program,"u_depth"),ringCount:e.getUniformLocation(this.program,"u_ringCount"),wobble:e.getUniformLocation(this.program,"u_wobble"),pattern:e.getUniformLocation(this.program,"u_pattern"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.twist,this.twist),e.uniform1f(this.uniforms.depth,this.depth),e.uniform1f(this.uniforms.ringCount,this.ringCount),e.uniform1f(this.uniforms.wobble,this.wobble),e.uniform1i(this.uniforms.pattern,this.pattern),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="twist"&&typeof e=="number"?this.twist=e:t==="depth"&&typeof e=="number"?this.depth=e:t==="ringCount"&&typeof e=="number"?this.ringCount=e:t==="wobble"&&typeof e=="number"?this.wobble=e:t==="pattern"&&typeof e=="number"?this.pattern=e:t==="color1"&&typeof e=="string"?this.color1=Ba(e):t==="color2"&&typeof e=="string"&&(this.color2=Ba(e))}getControl(t){if(t==="speed")return this.speed;if(t==="twist")return this.twist;if(t==="depth")return this.depth;if(t==="ringCount")return this.ringCount;if(t==="wobble")return this.wobble;if(t==="pattern")return this.pattern;if(t==="color1")return za(...this.color1);if(t==="color2")return za(...this.color2)}}const Pm={id:"tunnel",name:"Tunnel",type:"shader",create:()=>new Dm};function us(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function hs(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Im=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,Um=`#version 300 es
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
`;class Fm{constructor(){h(this,"id","waveform");h(this,"name","Waveform");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Speed",defaultValue:1,min:0,max:3},{name:"waves",type:"integer",label:"Waves",defaultValue:5,min:1,max:8},{name:"amplitude",type:"float",label:"Amplitude",defaultValue:1,min:.1,max:3},{name:"frequency",type:"float",label:"Frequency",defaultValue:4,min:1,max:15},{name:"thickness",type:"float",label:"Thickness",defaultValue:.01,min:.002,max:.05},{name:"glow",type:"float",label:"Glow",defaultValue:.5,min:0,max:2},{name:"mode",type:"integer",label:"Mode",defaultValue:0,min:0,max:3},{name:"color1",type:"color",label:"Color 1",defaultValue:"#ff0066"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#00ccff"},{name:"bgColor",type:"color",label:"Background",defaultValue:"#0a0a14"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",1);h(this,"waves",5);h(this,"amplitude",1);h(this,"frequency",4);h(this,"thickness",.01);h(this,"glow",.5);h(this,"mode",0);h(this,"color1",[1,0,.4]);h(this,"color2",[0,.8,1]);h(this,"bgColor",[.04,.04,.08])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Im),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,Um),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),waves:e.getUniformLocation(this.program,"u_waves"),amplitude:e.getUniformLocation(this.program,"u_amplitude"),frequency:e.getUniformLocation(this.program,"u_frequency"),thickness:e.getUniformLocation(this.program,"u_thickness"),glow:e.getUniformLocation(this.program,"u_glow"),mode:e.getUniformLocation(this.program,"u_mode"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),bgColor:e.getUniformLocation(this.program,"u_bgColor"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.waves,this.waves),e.uniform1f(this.uniforms.amplitude,this.amplitude),e.uniform1f(this.uniforms.frequency,this.frequency),e.uniform1f(this.uniforms.thickness,this.thickness),e.uniform1f(this.uniforms.glow,this.glow),e.uniform1i(this.uniforms.mode,this.mode),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform3fv(this.uniforms.bgColor,this.bgColor),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="waves"&&typeof e=="number"?this.waves=e:t==="amplitude"&&typeof e=="number"?this.amplitude=e:t==="frequency"&&typeof e=="number"?this.frequency=e:t==="thickness"&&typeof e=="number"?this.thickness=e:t==="glow"&&typeof e=="number"?this.glow=e:t==="mode"&&typeof e=="number"?this.mode=e:t==="color1"&&typeof e=="string"?this.color1=us(e):t==="color2"&&typeof e=="string"?this.color2=us(e):t==="bgColor"&&typeof e=="string"&&(this.bgColor=us(e))}getControl(t){if(t==="speed")return this.speed;if(t==="waves")return this.waves;if(t==="amplitude")return this.amplitude;if(t==="frequency")return this.frequency;if(t==="thickness")return this.thickness;if(t==="glow")return this.glow;if(t==="mode")return this.mode;if(t==="color1")return hs(...this.color1);if(t==="color2")return hs(...this.color2);if(t==="bgColor")return hs(...this.bgColor)}}const Nm={id:"waveform",name:"Waveform",type:"shader",create:()=>new Fm};function ds(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function fs(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Om=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,Bm=`#version 300 es
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
`;class zm{constructor(){h(this,"id","fractalZoom");h(this,"name","Fractal Zoom");h(this,"type","shader");h(this,"controls",[{name:"speed",type:"float",label:"Zoom Speed",defaultValue:.3,min:0,max:2},{name:"zoom",type:"float",label:"Base Zoom",defaultValue:1,min:.1,max:5},{name:"iterations",type:"float",label:"Iterations",defaultValue:100,min:20,max:200,step:10},{name:"colorCycles",type:"float",label:"Color Cycles",defaultValue:3,min:1,max:10},{name:"fractalType",type:"integer",label:"Type (0=Mandelbrot, 1=Julia, 2=BurningShip)",defaultValue:0,min:0,max:2},{name:"centerX",type:"float",label:"Center X",defaultValue:-.745,min:-2,max:2},{name:"centerY",type:"float",label:"Center Y",defaultValue:.186,min:-2,max:2},{name:"color1",type:"color",label:"Color 1",defaultValue:"#0a0a20"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#ff6600"},{name:"color3",type:"color",label:"Color 3",defaultValue:"#00ffff"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"speed",.3);h(this,"zoom",1);h(this,"iterations",100);h(this,"colorCycles",3);h(this,"fractalType",0);h(this,"centerX",-.745);h(this,"centerY",.186);h(this,"color1",[.04,.04,.13]);h(this,"color2",[1,.4,0]);h(this,"color3",[0,1,1])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Om),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,Bm),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),speed:e.getUniformLocation(this.program,"u_speed"),zoom:e.getUniformLocation(this.program,"u_zoom"),iterations:e.getUniformLocation(this.program,"u_iterations"),colorCycles:e.getUniformLocation(this.program,"u_colorCycles"),fractalType:e.getUniformLocation(this.program,"u_fractalType"),center:e.getUniformLocation(this.program,"u_center"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),color3:e.getUniformLocation(this.program,"u_color3"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.speed,this.speed),e.uniform1f(this.uniforms.zoom,this.zoom),e.uniform1f(this.uniforms.iterations,this.iterations),e.uniform1f(this.uniforms.colorCycles,this.colorCycles),e.uniform1i(this.uniforms.fractalType,this.fractalType),e.uniform2f(this.uniforms.center,this.centerX,this.centerY),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform3fv(this.uniforms.color3,this.color3),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="speed"&&typeof e=="number"?this.speed=e:t==="zoom"&&typeof e=="number"?this.zoom=e:t==="iterations"&&typeof e=="number"?this.iterations=e:t==="colorCycles"&&typeof e=="number"?this.colorCycles=e:t==="fractalType"&&typeof e=="number"?this.fractalType=e:t==="centerX"&&typeof e=="number"?this.centerX=e:t==="centerY"&&typeof e=="number"?this.centerY=e:t==="color1"&&typeof e=="string"?this.color1=ds(e):t==="color2"&&typeof e=="string"?this.color2=ds(e):t==="color3"&&typeof e=="string"&&(this.color3=ds(e))}getControl(t){if(t==="speed")return this.speed;if(t==="zoom")return this.zoom;if(t==="iterations")return this.iterations;if(t==="colorCycles")return this.colorCycles;if(t==="fractalType")return this.fractalType;if(t==="centerX")return this.centerX;if(t==="centerY")return this.centerY;if(t==="color1")return fs(...this.color1);if(t==="color2")return fs(...this.color2);if(t==="color3")return fs(...this.color3)}}const Vm={id:"fractalZoom",name:"Fractal Zoom",type:"shader",create:()=>new zm};function ps(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function ms(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const km=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,Hm=`#version 300 es
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
`;class Gm{constructor(){h(this,"id","concentricArcs");h(this,"name","Concentric Arcs");h(this,"type","shader");h(this,"controls",[{name:"rotationSpeed",type:"float",label:"Rotation Speed",defaultValue:.5,min:0,max:3},{name:"zoomSpeed",type:"float",label:"Zoom Speed",defaultValue:.3,min:0,max:2},{name:"zoom",type:"float",label:"Base Zoom",defaultValue:1,min:.2,max:5},{name:"arcCount",type:"float",label:"Arc Rings",defaultValue:8,min:2,max:20,step:1},{name:"arcWidth",type:"float",label:"Arc Width",defaultValue:.7,min:.1,max:.95},{name:"gapRatio",type:"float",label:"Ring Gap",defaultValue:.2,min:0,max:.5},{name:"alternateDirection",type:"float",label:"Alternate Dir",defaultValue:1,min:0,max:1,step:1},{name:"color1",type:"color",label:"Color 1",defaultValue:"#ff3366"},{name:"color2",type:"color",label:"Color 2",defaultValue:"#3366ff"},{name:"bgColor",type:"color",label:"Background",defaultValue:"#0a0a0a"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"rotationSpeed",.5);h(this,"zoomSpeed",.3);h(this,"zoom",1);h(this,"arcCount",8);h(this,"arcWidth",.7);h(this,"gapRatio",.2);h(this,"alternateDirection",1);h(this,"color1",[1,.2,.4]);h(this,"color2",[.2,.4,1]);h(this,"bgColor",[.04,.04,.04]);h(this,"accumulatedRotation",0);h(this,"accumulatedZoom",0);h(this,"lastRenderTime",0)}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,km),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,Hm),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),rotationTime:e.getUniformLocation(this.program,"u_rotationTime"),zoomTime:e.getUniformLocation(this.program,"u_zoomTime"),zoom:e.getUniformLocation(this.program,"u_zoom"),arcCount:e.getUniformLocation(this.program,"u_arcCount"),arcWidth:e.getUniformLocation(this.program,"u_arcWidth"),gapRatio:e.getUniformLocation(this.program,"u_gapRatio"),alternateDirection:e.getUniformLocation(this.program,"u_alternateDirection"),color1:e.getUniformLocation(this.program,"u_color1"),color2:e.getUniformLocation(this.program,"u_color2"),bgColor:e.getUniformLocation(this.program,"u_bgColor"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao);const n=t-this.lastRenderTime;this.accumulatedRotation+=n*this.rotationSpeed,this.accumulatedZoom+=n*this.zoomSpeed,this.lastRenderTime=t,e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.rotationTime,this.accumulatedRotation),e.uniform1f(this.uniforms.zoomTime,this.accumulatedZoom),e.uniform1f(this.uniforms.zoom,this.zoom),e.uniform1f(this.uniforms.arcCount,this.arcCount),e.uniform1f(this.uniforms.arcWidth,this.arcWidth),e.uniform1f(this.uniforms.gapRatio,this.gapRatio),e.uniform1f(this.uniforms.alternateDirection,this.alternateDirection),e.uniform3fv(this.uniforms.color1,this.color1),e.uniform3fv(this.uniforms.color2,this.color2),e.uniform3fv(this.uniforms.bgColor,this.bgColor),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="rotationSpeed"&&typeof e=="number"?this.rotationSpeed=e:t==="zoomSpeed"&&typeof e=="number"?this.zoomSpeed=e:t==="zoom"&&typeof e=="number"?this.zoom=e:t==="arcCount"&&typeof e=="number"?this.arcCount=e:t==="arcWidth"&&typeof e=="number"?this.arcWidth=e:t==="gapRatio"&&typeof e=="number"?this.gapRatio=e:t==="alternateDirection"&&typeof e=="number"?this.alternateDirection=e:t==="color1"&&typeof e=="string"?this.color1=ps(e):t==="color2"&&typeof e=="string"?this.color2=ps(e):t==="bgColor"&&typeof e=="string"&&(this.bgColor=ps(e))}getControl(t){if(t==="rotationSpeed")return this.rotationSpeed;if(t==="zoomSpeed")return this.zoomSpeed;if(t==="zoom")return this.zoom;if(t==="arcCount")return this.arcCount;if(t==="arcWidth")return this.arcWidth;if(t==="gapRatio")return this.gapRatio;if(t==="alternateDirection")return this.alternateDirection;if(t==="color1")return ms(...this.color1);if(t==="color2")return ms(...this.color2);if(t==="bgColor")return ms(...this.bgColor)}}const Wm={id:"concentricArcs",name:"Concentric Arcs",type:"shader",create:()=>new Gm};function gs(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]}function _s(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Xm=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`,qm=`#version 300 es
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
`;class Ym{constructor(){h(this,"id","simpleShape");h(this,"name","Simple Shape");h(this,"type","shader");h(this,"controls",[{name:"shape",type:"integer",label:"Shape (0=Circle, 1=Square, 2=Triangle)",defaultValue:0,min:0,max:2},{name:"filled",type:"integer",label:"Filled (0=No, 1=Yes)",defaultValue:1,min:0,max:1},{name:"rotationSpeed",type:"float",label:"Rotation Speed",defaultValue:.3,min:0,max:3},{name:"size",type:"float",label:"Size",defaultValue:.8,min:.1,max:1.5},{name:"strokeWidth",type:"float",label:"Stroke Width",defaultValue:3,min:.5,max:10},{name:"fillColor",type:"color",label:"Fill Color",defaultValue:"#3366ff"},{name:"strokeColor",type:"color",label:"Stroke Color",defaultValue:"#ffffff"},{name:"bgColor",type:"color",label:"Background",defaultValue:"#0a0a0a"}]);h(this,"canvas");h(this,"gl");h(this,"program");h(this,"vao");h(this,"uniforms");h(this,"shape",0);h(this,"filled",1);h(this,"rotationSpeed",.3);h(this,"size",.8);h(this,"strokeWidth",3);h(this,"fillColor",[.2,.4,1]);h(this,"strokeColor",[1,1,1]);h(this,"bgColor",[.04,.04,.04])}async init(t){this.canvas=t;const e=t.getContext("webgl2",{preserveDrawingBuffer:!0});if(!e)throw new Error("WebGL2 not supported");this.gl=e;const n=e.createShader(e.VERTEX_SHADER);e.shaderSource(n,Xm),e.compileShader(n);const i=e.createShader(e.FRAGMENT_SHADER);e.shaderSource(i,qm),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)||console.error("Fragment shader error:",e.getShaderInfoLog(i)),this.program=e.createProgram(),e.attachShader(this.program,n),e.attachShader(this.program,i),e.linkProgram(this.program),e.deleteShader(n),e.deleteShader(i),this.uniforms={time:e.getUniformLocation(this.program,"u_time"),rotationSpeed:e.getUniformLocation(this.program,"u_rotationSpeed"),size:e.getUniformLocation(this.program,"u_size"),strokeWidth:e.getUniformLocation(this.program,"u_strokeWidth"),shape:e.getUniformLocation(this.program,"u_shape"),filled:e.getUniformLocation(this.program,"u_filled"),fillColor:e.getUniformLocation(this.program,"u_fillColor"),strokeColor:e.getUniformLocation(this.program,"u_strokeColor"),bgColor:e.getUniformLocation(this.program,"u_bgColor"),resolution:e.getUniformLocation(this.program,"u_resolution")},this.vao=e.createVertexArray(),e.bindVertexArray(this.vao);const s=new Float32Array([-1,-1,1,-1,-1,1,1,1]),o=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,s,e.STATIC_DRAW);const a=e.getAttribLocation(this.program,"a_position");e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0),e.bindVertexArray(null)}render(t){const e=this.gl;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.program),e.bindVertexArray(this.vao),e.uniform1f(this.uniforms.time,t),e.uniform1f(this.uniforms.rotationSpeed,this.rotationSpeed),e.uniform1f(this.uniforms.size,this.size),e.uniform1f(this.uniforms.strokeWidth,this.strokeWidth),e.uniform1i(this.uniforms.shape,this.shape),e.uniform1i(this.uniforms.filled,this.filled),e.uniform3fv(this.uniforms.fillColor,this.fillColor),e.uniform3fv(this.uniforms.strokeColor,this.strokeColor),e.uniform3fv(this.uniforms.bgColor,this.bgColor),e.uniform2f(this.uniforms.resolution,this.canvas.width,this.canvas.height),e.drawArrays(e.TRIANGLE_STRIP,0,4)}dispose(){this.gl.deleteProgram(this.program),this.gl.deleteVertexArray(this.vao)}setControl(t,e){t==="shape"&&typeof e=="number"?this.shape=e:t==="filled"&&typeof e=="number"?this.filled=e:t==="rotationSpeed"&&typeof e=="number"?this.rotationSpeed=e:t==="size"&&typeof e=="number"?this.size=e:t==="strokeWidth"&&typeof e=="number"?this.strokeWidth=e:t==="fillColor"&&typeof e=="string"?this.fillColor=gs(e):t==="strokeColor"&&typeof e=="string"?this.strokeColor=gs(e):t==="bgColor"&&typeof e=="string"&&(this.bgColor=gs(e))}getControl(t){if(t==="shape")return this.shape;if(t==="filled")return this.filled;if(t==="rotationSpeed")return this.rotationSpeed;if(t==="size")return this.size;if(t==="strokeWidth")return this.strokeWidth;if(t==="fillColor")return _s(...this.fillColor);if(t==="strokeColor")return _s(...this.strokeColor);if(t==="bgColor")return _s(...this.bgColor)}}const $m={id:"simpleShape",name:"Simple Shape",type:"shader",create:()=>new Ym},vs=[Gl,Yl,jl,lm,dm,gm,ym,Em,wm,Pm,Nm,Vm,Wm,$m],Zm=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = a_position * 0.5 + 0.5;
}
`;class xn{constructor(){h(this,"enabled",!0);h(this,"canvas",null);h(this,"gl",null);h(this,"program",null);h(this,"vao",null);h(this,"texture",null);h(this,"uniforms",{})}async init(){this.canvas=new OffscreenCanvas(1,1);const t=this.canvas.getContext("webgl2",{preserveDrawingBuffer:!0});if(!t)throw new Error("WebGL2 not supported");this.gl=t;const e=t.createShader(t.VERTEX_SHADER);t.shaderSource(e,Zm),t.compileShader(e),t.getShaderParameter(e,t.COMPILE_STATUS)||console.error("Vertex shader error:",t.getShaderInfoLog(e));const n=t.createShader(t.FRAGMENT_SHADER);t.shaderSource(n,this.getFragmentShader()),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS)||console.error("Fragment shader error:",t.getShaderInfoLog(n)),this.program=t.createProgram(),t.attachShader(this.program,e),t.attachShader(this.program,n),t.linkProgram(this.program),t.getProgramParameter(this.program,t.LINK_STATUS)||console.error("Program link error:",t.getProgramInfoLog(this.program)),t.deleteShader(e),t.deleteShader(n),this.uniforms={texture:t.getUniformLocation(this.program,"u_texture"),resolution:t.getUniformLocation(this.program,"u_resolution"),time:t.getUniformLocation(this.program,"u_time")};for(const a of this.getUniformNames())this.uniforms[a]=t.getUniformLocation(this.program,`u_${a}`);this.vao=t.createVertexArray(),t.bindVertexArray(this.vao);const i=new Float32Array([-1,-1,1,-1,-1,1,1,1]),s=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,s),t.bufferData(t.ARRAY_BUFFER,i,t.STATIC_DRAW);const o=t.getAttribLocation(this.program,"a_position");t.enableVertexAttribArray(o),t.vertexAttribPointer(o,2,t.FLOAT,!1,0,0),t.bindVertexArray(null),this.texture=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.texture),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR)}apply(t,e,n,i){if(!this.enabled||!this.gl||!this.program||!this.vao||!this.texture||!this.canvas){e.getContext("2d").drawImage(t,0,0);return}const s=this.gl;(this.canvas.width!==t.width||this.canvas.height!==t.height)&&(this.canvas.width=t.width,this.canvas.height=t.height),s.viewport(0,0,t.width,t.height),s.bindTexture(s.TEXTURE_2D,this.texture),s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,t),s.useProgram(this.program),s.bindVertexArray(this.vao),s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,this.texture),s.uniform1i(this.uniforms.texture,0),s.uniform2f(this.uniforms.resolution,t.width,t.height),s.uniform1f(this.uniforms.time,n),this.setUniforms(s),s.drawArrays(s.TRIANGLE_STRIP,0,4),e.getContext("2d").drawImage(this.canvas,0,0)}dispose(){this.gl&&(this.program&&this.gl.deleteProgram(this.program),this.vao&&this.gl.deleteVertexArray(this.vao),this.texture&&this.gl.deleteTexture(this.texture)),this.gl=null,this.program=null,this.vao=null,this.texture=null,this.canvas=null}}const Km=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_strength;
uniform float u_samples;
uniform vec2 u_center;

void main() {
  vec2 uv = v_uv;
  vec2 center = u_center;

  vec2 dir = uv - center;
  float dist = length(dir);

  vec4 color = vec4(0.0);
  float total = 0.0;

  int sampleCount = int(u_samples);

  for (int i = 0; i < 32; i++) {
    if (i >= sampleCount) break;

    float t = float(i) / float(sampleCount - 1);
    float scale = 1.0 - u_strength * t * dist;

    vec2 sampleUv = center + dir * scale;
    color += texture(u_texture, sampleUv);
    total += 1.0;
  }

  fragColor = color / total;
}
`;class jm extends xn{constructor(){super(...arguments);h(this,"id","zoomBlur");h(this,"name","Zoom Blur");h(this,"controls",[{name:"strength",type:"float",label:"Strength",defaultValue:.3,min:0,max:1,step:.01},{name:"samples",type:"integer",label:"Samples",defaultValue:16,min:4,max:32},{name:"centerX",type:"float",label:"Center X",defaultValue:.5,min:0,max:1,step:.01},{name:"centerY",type:"float",label:"Center Y",defaultValue:.5,min:0,max:1,step:.01}]);h(this,"strength",.3);h(this,"samples",16);h(this,"centerX",.5);h(this,"centerY",.5)}getFragmentShader(){return Km}getUniformNames(){return["strength","samples","center"]}setUniforms(e){e.uniform1f(this.uniforms.strength,this.strength),e.uniform1f(this.uniforms.samples,this.samples),e.uniform2f(this.uniforms.center,this.centerX,this.centerY)}setControl(e,n){e==="strength"&&typeof n=="number"?this.strength=n:e==="samples"&&typeof n=="number"?this.samples=n:e==="centerX"&&typeof n=="number"?this.centerX=n:e==="centerY"&&typeof n=="number"&&(this.centerY=n)}getControl(e){if(e==="strength")return this.strength;if(e==="samples")return this.samples;if(e==="centerX")return this.centerX;if(e==="centerY")return this.centerY}}const Jm={id:"zoomBlur",name:"Zoom Blur",create:()=>new jm},Qm=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_strength;
uniform float u_scale;
uniform float u_speed;

// Simplex noise
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

void main() {
  vec2 uv = v_uv;
  float t = u_time * u_speed;

  // Generate noise-based displacement
  vec2 noiseCoord = uv * u_scale;

  float noiseX = snoise(noiseCoord + vec2(t, 0.0));
  float noiseY = snoise(noiseCoord + vec2(0.0, t) + vec2(100.0));

  vec2 displacement = vec2(noiseX, noiseY) * u_strength * 0.1;

  vec2 sampleUv = uv + displacement;

  // Clamp to avoid sampling outside texture
  sampleUv = clamp(sampleUv, 0.0, 1.0);

  fragColor = texture(u_texture, sampleUv);
}
`;class eg extends xn{constructor(){super(...arguments);h(this,"id","wobble");h(this,"name","Wobble");h(this,"controls",[{name:"strength",type:"float",label:"Strength",defaultValue:.3,min:0,max:2,step:.01},{name:"scale",type:"float",label:"Scale",defaultValue:5,min:1,max:20,step:.1},{name:"speed",type:"float",label:"Speed",defaultValue:1,min:0,max:5,step:.01}]);h(this,"strength",.3);h(this,"scale",5);h(this,"speed",1)}getFragmentShader(){return Qm}getUniformNames(){return["strength","scale","speed"]}setUniforms(e){e.uniform1f(this.uniforms.strength,this.strength),e.uniform1f(this.uniforms.scale,this.scale),e.uniform1f(this.uniforms.speed,this.speed)}setControl(e,n){e==="strength"&&typeof n=="number"?this.strength=n:e==="scale"&&typeof n=="number"?this.scale=n:e==="speed"&&typeof n=="number"&&(this.speed=n)}getControl(e){if(e==="strength")return this.strength;if(e==="scale")return this.scale;if(e==="speed")return this.speed}}const tg={id:"wobble",name:"Wobble",create:()=>new eg};function ng(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[1,1,1]}function ig(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const rg=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_hueShift;
uniform vec3 u_tint;
uniform float u_tintAmount;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 texColor = texture(u_texture, v_uv);
  vec3 color = texColor.rgb;

  // Convert to HSV for hue/saturation adjustments
  vec3 hsv = rgb2hsv(color);

  // Hue shift
  hsv.x = fract(hsv.x + u_hueShift);

  // Saturation
  hsv.y *= u_saturation;

  // Convert back to RGB
  color = hsv2rgb(hsv);

  // Brightness
  color *= u_brightness;

  // Contrast
  color = (color - 0.5) * u_contrast + 0.5;

  // Tint
  color = mix(color, color * u_tint, u_tintAmount);

  // Clamp
  color = clamp(color, 0.0, 1.0);

  fragColor = vec4(color, texColor.a);
}
`;class sg extends xn{constructor(){super(...arguments);h(this,"id","colorAdjust");h(this,"name","Color Adjust");h(this,"controls",[{name:"saturation",type:"float",label:"Saturation",defaultValue:1,min:0,max:2,step:.01},{name:"brightness",type:"float",label:"Brightness",defaultValue:1,min:0,max:2,step:.01},{name:"contrast",type:"float",label:"Contrast",defaultValue:1,min:.5,max:2,step:.01},{name:"hueShift",type:"float",label:"Hue Shift",defaultValue:0,min:0,max:1,step:.01},{name:"tint",type:"color",label:"Tint",defaultValue:"#ffffff"},{name:"tintAmount",type:"float",label:"Tint Amount",defaultValue:0,min:0,max:1,step:.01}]);h(this,"saturation",1);h(this,"brightness",1);h(this,"contrast",1);h(this,"hueShift",0);h(this,"tint",[1,1,1]);h(this,"tintAmount",0)}getFragmentShader(){return rg}getUniformNames(){return["saturation","brightness","contrast","hueShift","tint","tintAmount"]}setUniforms(e){e.uniform1f(this.uniforms.saturation,this.saturation),e.uniform1f(this.uniforms.brightness,this.brightness),e.uniform1f(this.uniforms.contrast,this.contrast),e.uniform1f(this.uniforms.hueShift,this.hueShift),e.uniform3fv(this.uniforms.tint,this.tint),e.uniform1f(this.uniforms.tintAmount,this.tintAmount)}setControl(e,n){e==="saturation"&&typeof n=="number"?this.saturation=n:e==="brightness"&&typeof n=="number"?this.brightness=n:e==="contrast"&&typeof n=="number"?this.contrast=n:e==="hueShift"&&typeof n=="number"?this.hueShift=n:e==="tint"&&typeof n=="string"?this.tint=ng(n):e==="tintAmount"&&typeof n=="number"&&(this.tintAmount=n)}getControl(e){if(e==="saturation")return this.saturation;if(e==="brightness")return this.brightness;if(e==="contrast")return this.contrast;if(e==="hueShift")return this.hueShift;if(e==="tint")return ig(...this.tint);if(e==="tintAmount")return this.tintAmount}}const og={id:"colorAdjust",name:"Color Adjust",create:()=>new sg},ag=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
uniform int u_samples;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 original = texture(u_texture, v_uv);

  // Blur for bloom (kawase-style blur approximation)
  vec4 bloom = vec4(0.0);
  float total = 0.0;

  for (int x = -4; x <= 4; x++) {
    for (int y = -4; y <= 4; y++) {
      if (abs(x) + abs(y) > u_samples) continue;

      vec2 offset = vec2(float(x), float(y)) * texelSize * u_radius;
      vec4 sample_color = texture(u_texture, v_uv + offset);

      // Extract bright parts
      float brightness = dot(sample_color.rgb, vec3(0.2126, 0.7152, 0.0722));
      float contribution = max(brightness - u_threshold, 0.0);

      // Weight by distance
      float weight = 1.0 / (1.0 + float(abs(x) + abs(y)));

      bloom += sample_color * contribution * weight;
      total += weight * contribution;
    }
  }

  if (total > 0.0) {
    bloom /= total;
  }

  // Combine original with bloom
  vec3 result = original.rgb + bloom.rgb * u_intensity;

  fragColor = vec4(result, original.a);
}
`;class lg extends xn{constructor(){super(...arguments);h(this,"id","bloom");h(this,"name","Bloom");h(this,"controls",[{name:"threshold",type:"float",label:"Threshold",defaultValue:.5,min:0,max:1,step:.01},{name:"intensity",type:"float",label:"Intensity",defaultValue:.5,min:0,max:2,step:.01},{name:"radius",type:"float",label:"Radius",defaultValue:3,min:1,max:10,step:.1},{name:"samples",type:"integer",label:"Quality",defaultValue:4,min:2,max:8}]);h(this,"threshold",.5);h(this,"intensity",.5);h(this,"radius",3);h(this,"samples",4)}getFragmentShader(){return ag}getUniformNames(){return["threshold","intensity","radius","samples"]}setUniforms(e){e.uniform1f(this.uniforms.threshold,this.threshold),e.uniform1f(this.uniforms.intensity,this.intensity),e.uniform1f(this.uniforms.radius,this.radius),e.uniform1i(this.uniforms.samples,this.samples)}setControl(e,n){e==="threshold"&&typeof n=="number"?this.threshold=n:e==="intensity"&&typeof n=="number"?this.intensity=n:e==="radius"&&typeof n=="number"?this.radius=n:e==="samples"&&typeof n=="number"&&(this.samples=n)}getControl(e){if(e==="threshold")return this.threshold;if(e==="intensity")return this.intensity;if(e==="radius")return this.radius;if(e==="samples")return this.samples}}const cg={id:"bloom",name:"Bloom",create:()=>new lg},ug=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_strength;
uniform float u_radial;
uniform vec2 u_direction;

void main() {
  vec2 uv = v_uv;
  vec2 center = vec2(0.5);

  // Calculate offset direction
  vec2 dir;
  if (u_radial > 0.5) {
    // Radial aberration - offset based on distance from center
    dir = normalize(uv - center) * length(uv - center);
  } else {
    // Directional aberration
    dir = u_direction;
  }

  vec2 offset = dir * u_strength * 0.02;

  // Sample RGB channels with offset
  float r = texture(u_texture, uv + offset).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv - offset).b;
  float a = texture(u_texture, uv).a;

  fragColor = vec4(r, g, b, a);
}
`;class hg extends xn{constructor(){super(...arguments);h(this,"id","chromaticAberration");h(this,"name","Chromatic Aberration");h(this,"controls",[{name:"strength",type:"float",label:"Strength",defaultValue:.5,min:0,max:3,step:.01},{name:"radial",type:"float",label:"Radial",defaultValue:1,min:0,max:1,step:1},{name:"directionX",type:"float",label:"Direction X",defaultValue:1,min:-1,max:1,step:.01},{name:"directionY",type:"float",label:"Direction Y",defaultValue:0,min:-1,max:1,step:.01}]);h(this,"strength",.5);h(this,"radial",1);h(this,"directionX",1);h(this,"directionY",0)}getFragmentShader(){return ug}getUniformNames(){return["strength","radial","direction"]}setUniforms(e){e.uniform1f(this.uniforms.strength,this.strength),e.uniform1f(this.uniforms.radial,this.radial),e.uniform2f(this.uniforms.direction,this.directionX,this.directionY)}setControl(e,n){e==="strength"&&typeof n=="number"?this.strength=n:e==="radial"&&typeof n=="number"?this.radial=n:e==="directionX"&&typeof n=="number"?this.directionX=n:e==="directionY"&&typeof n=="number"&&(this.directionY=n)}getControl(e){if(e==="strength")return this.strength;if(e==="radial")return this.radial;if(e==="directionX")return this.directionX;if(e==="directionY")return this.directionY}}const dg={id:"chromaticAberration",name:"Chromatic Aberration",create:()=>new hg},fg=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixelSize;

void main() {
  vec2 uv = v_uv;

  // Calculate pixel grid
  float pixels = u_resolution.x / u_pixelSize;
  float aspect = u_resolution.x / u_resolution.y;

  vec2 pixelUv;
  pixelUv.x = floor(uv.x * pixels) / pixels;
  pixelUv.y = floor(uv.y * pixels * aspect) / (pixels * aspect);

  // Center the sample in the pixel
  pixelUv += 0.5 / vec2(pixels, pixels * aspect);

  fragColor = texture(u_texture, pixelUv);
}
`;class pg extends xn{constructor(){super(...arguments);h(this,"id","pixelate");h(this,"name","Pixelate");h(this,"controls",[{name:"pixelSize",type:"float",label:"Pixel Size",defaultValue:8,min:1,max:64,step:.5}]);h(this,"pixelSize",8)}getFragmentShader(){return fg}getUniformNames(){return["pixelSize"]}setUniforms(e){e.uniform1f(this.uniforms.pixelSize,this.pixelSize)}setControl(e,n){e==="pixelSize"&&typeof n=="number"&&(this.pixelSize=n)}getControl(e){if(e==="pixelSize")return this.pixelSize}}const mg={id:"pixelate",name:"Pixelate",create:()=>new pg},gg=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform int u_mode;
uniform float u_offset;

void main() {
  vec2 uv = v_uv;

  if (u_mode == 0) {
    // Horizontal mirror (left to right)
    if (uv.x > 0.5 + u_offset * 0.5) {
      uv.x = 1.0 - uv.x + u_offset;
    }
  } else if (u_mode == 1) {
    // Horizontal mirror (right to left)
    if (uv.x < 0.5 - u_offset * 0.5) {
      uv.x = 1.0 - uv.x - u_offset;
    }
  } else if (u_mode == 2) {
    // Vertical mirror (top to bottom)
    if (uv.y > 0.5 + u_offset * 0.5) {
      uv.y = 1.0 - uv.y + u_offset;
    }
  } else if (u_mode == 3) {
    // Vertical mirror (bottom to top)
    if (uv.y < 0.5 - u_offset * 0.5) {
      uv.y = 1.0 - uv.y - u_offset;
    }
  } else {
    // Quad mirror
    if (uv.x > 0.5) uv.x = 1.0 - uv.x;
    if (uv.y > 0.5) uv.y = 1.0 - uv.y;
  }

  fragColor = texture(u_texture, clamp(uv, 0.0, 1.0));
}
`;class _g extends xn{constructor(){super(...arguments);h(this,"id","mirror");h(this,"name","Mirror");h(this,"controls",[{name:"mode",type:"integer",label:"Mode",defaultValue:0,min:0,max:4},{name:"offset",type:"float",label:"Offset",defaultValue:0,min:-.5,max:.5,step:.01}]);h(this,"mode",0);h(this,"offset",0)}getFragmentShader(){return gg}getUniformNames(){return["mode","offset"]}setUniforms(e){e.uniform1i(this.uniforms.mode,this.mode),e.uniform1f(this.uniforms.offset,this.offset)}setControl(e,n){e==="mode"&&typeof n=="number"?this.mode=n:e==="offset"&&typeof n=="number"&&(this.offset=n)}getControl(e){if(e==="mode")return this.mode;if(e==="offset")return this.offset}}const vg={id:"mirror",name:"Mirror",create:()=>new _g};function xg(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[1,1,1]}function yg(r,t,e){const n=i=>Math.round(i*255).toString(16).padStart(2,"0");return`#${n(r)}${n(t)}${n(e)}`}const Sg=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_threshold;
uniform float u_intensity;
uniform float u_mixOriginal;
uniform vec3 u_glowColor;

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 original = texture(u_texture, v_uv);

  // Sobel edge detection
  float tl = luminance(texture(u_texture, v_uv + vec2(-1, -1) * texelSize).rgb);
  float t  = luminance(texture(u_texture, v_uv + vec2( 0, -1) * texelSize).rgb);
  float tr = luminance(texture(u_texture, v_uv + vec2( 1, -1) * texelSize).rgb);
  float l  = luminance(texture(u_texture, v_uv + vec2(-1,  0) * texelSize).rgb);
  float r  = luminance(texture(u_texture, v_uv + vec2( 1,  0) * texelSize).rgb);
  float bl = luminance(texture(u_texture, v_uv + vec2(-1,  1) * texelSize).rgb);
  float b  = luminance(texture(u_texture, v_uv + vec2( 0,  1) * texelSize).rgb);
  float br = luminance(texture(u_texture, v_uv + vec2( 1,  1) * texelSize).rgb);

  float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

  float edge = sqrt(gx*gx + gy*gy);

  // Apply threshold
  edge = smoothstep(u_threshold, u_threshold + 0.1, edge);

  // Glow color
  vec3 glow = u_glowColor * edge * u_intensity;

  // Mix with original
  vec3 result = mix(glow, original.rgb + glow, u_mixOriginal);

  fragColor = vec4(result, original.a);
}
`;class bg extends xn{constructor(){super(...arguments);h(this,"id","edgeGlow");h(this,"name","Edge Glow");h(this,"controls",[{name:"threshold",type:"float",label:"Threshold",defaultValue:.1,min:0,max:.5,step:.01},{name:"intensity",type:"float",label:"Intensity",defaultValue:1.5,min:0,max:5,step:.01},{name:"mixOriginal",type:"float",label:"Mix Original",defaultValue:.5,min:0,max:1,step:.01},{name:"glowColor",type:"color",label:"Glow Color",defaultValue:"#00ffff"}]);h(this,"threshold",.1);h(this,"intensity",1.5);h(this,"mixOriginal",.5);h(this,"glowColor",[0,1,1])}getFragmentShader(){return Sg}getUniformNames(){return["threshold","intensity","mixOriginal","glowColor"]}setUniforms(e){e.uniform1f(this.uniforms.threshold,this.threshold),e.uniform1f(this.uniforms.intensity,this.intensity),e.uniform1f(this.uniforms.mixOriginal,this.mixOriginal),e.uniform3fv(this.uniforms.glowColor,this.glowColor)}setControl(e,n){e==="threshold"&&typeof n=="number"?this.threshold=n:e==="intensity"&&typeof n=="number"?this.intensity=n:e==="mixOriginal"&&typeof n=="number"?this.mixOriginal=n:e==="glowColor"&&typeof n=="string"&&(this.glowColor=xg(n))}getControl(e){if(e==="threshold")return this.threshold;if(e==="intensity")return this.intensity;if(e==="mixOriginal")return this.mixOriginal;if(e==="glowColor")return yg(...this.glowColor)}}const Mg={id:"edgeGlow",name:"Edge Glow",create:()=>new bg};class Eg{constructor(){h(this,"id","feedback");h(this,"name","Feedback");h(this,"enabled",!0);h(this,"controls",[{name:"decay",type:"float",label:"Decay",defaultValue:.9,min:0,max:.99,step:.01},{name:"zoom",type:"float",label:"Zoom",defaultValue:1,min:.95,max:1.05,step:.001},{name:"rotation",type:"float",label:"Rotation",defaultValue:0,min:-.05,max:.05,step:.001},{name:"offsetX",type:"float",label:"Offset X",defaultValue:0,min:-.05,max:.05,step:.001},{name:"offsetY",type:"float",label:"Offset Y",defaultValue:0,min:-.05,max:.05,step:.001}]);h(this,"decay",.9);h(this,"zoom",1);h(this,"rotation",0);h(this,"offsetX",0);h(this,"offsetY",0);h(this,"feedbackCanvas",null);h(this,"feedbackCtx",null)}async init(){}apply(t,e,n,i){if(!this.enabled){e.getContext("2d").drawImage(t,0,0);return}const s=t.width,o=t.height;(!this.feedbackCanvas||this.feedbackCanvas.width!==s||this.feedbackCanvas.height!==o)&&(this.feedbackCanvas=new OffscreenCanvas(s,o),this.feedbackCtx=this.feedbackCanvas.getContext("2d"),this.feedbackCtx.clearRect(0,0,s,o));const a=e.getContext("2d"),l=this.feedbackCtx;a.clearRect(0,0,s,o),a.save(),a.globalAlpha=this.decay,a.translate(s/2+this.offsetX*s,o/2+this.offsetY*o),a.rotate(this.rotation),a.scale(this.zoom,this.zoom),a.translate(-s/2,-o/2),a.drawImage(this.feedbackCanvas,0,0),a.restore(),a.globalAlpha=1,a.drawImage(t,0,0),l.clearRect(0,0,s,o),l.drawImage(e,0,0)}dispose(){this.feedbackCanvas=null,this.feedbackCtx=null}setControl(t,e){t==="decay"&&typeof e=="number"?this.decay=e:t==="zoom"&&typeof e=="number"?this.zoom=e:t==="rotation"&&typeof e=="number"?this.rotation=e:t==="offsetX"&&typeof e=="number"?this.offsetX=e:t==="offsetY"&&typeof e=="number"&&(this.offsetY=e)}getControl(t){if(t==="decay")return this.decay;if(t==="zoom")return this.zoom;if(t==="rotation")return this.rotation;if(t==="offsetX")return this.offsetX;if(t==="offsetY")return this.offsetY}}const Tg={id:"feedback",name:"Feedback",create:()=>new Eg},Al=[Jm,tg,og,cg,dg,mg,vg,Mg,Tg],Ag={type:"lfo",waveform:"sine",frequency:1,phase:0,amplitude:1,offset:.5};class Cg{constructor(t,e){h(this,"type","lfo");h(this,"name");h(this,"config");h(this,"currentValue",.5);h(this,"internalPhase",0);this.id=t,this.config={...Ag,...e},this.name=`LFO ${t.split("-")[1]}`,this.internalPhase=this.config.phase}async init(){}update(t,e){this.internalPhase+=this.config.frequency*e,this.internalPhase%=1;let n;const i=this.internalPhase*Math.PI*2;switch(this.config.waveform){case"sine":n=Math.sin(i);break;case"sawtooth":n=2*this.internalPhase-1;break;case"square":n=this.internalPhase<.5?1:-1;break;case"triangle":n=1-4*Math.abs(this.internalPhase-.5);break;default:n=0}this.currentValue=Math.max(0,Math.min(1,this.config.offset+n*this.config.amplitude*.5))}getValue(){return this.currentValue}getConfig(){return{...this.config}}setConfig(t){const{type:e,...n}=t;this.config={...this.config,...n}}dispose(){}}const wg={type:"microphone",attack:.2,release:.85,gain:1,noiseFloor:.01};class Rg{constructor(t,e){h(this,"type","microphone");h(this,"name");h(this,"config");h(this,"currentValue",0);h(this,"smoothedValue",0);h(this,"audioContext",null);h(this,"analyser",null);h(this,"mediaStream",null);h(this,"dataArray",null);this.id=t,this.config={...wg,...e},this.name=`Mic ${t.split("-")[1]}`}async init(){try{this.mediaStream=await navigator.mediaDevices.getUserMedia({audio:!0}),this.audioContext=new AudioContext;const t=this.audioContext.createMediaStreamSource(this.mediaStream);this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=256,this.analyser.smoothingTimeConstant=.3,t.connect(this.analyser),this.dataArray=new Uint8Array(this.analyser.frequencyBinCount)}catch(t){throw console.error("Failed to initialize microphone:",t),t}}update(t,e){if(!this.analyser||!this.dataArray){this.currentValue=0;return}this.analyser.getByteFrequencyData(this.dataArray);let n=0;for(let a=0;a<this.dataArray.length;a++){const l=this.dataArray[a]/255;n+=l*l}let s=Math.sqrt(n/this.dataArray.length)*this.config.gain;s<this.config.noiseFloor&&(s=0),s=Math.min(1,s);const o=s>this.smoothedValue?this.config.attack:this.config.release;this.smoothedValue=this.smoothedValue*o+s*(1-o),this.currentValue=this.smoothedValue}getValue(){return this.currentValue}getConfig(){return{...this.config}}setConfig(t){const{type:e,...n}=t;this.config={...this.config,...n}}dispose(){this.mediaStream&&(this.mediaStream.getTracks().forEach(t=>t.stop()),this.mediaStream=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null),this.analyser=null,this.dataArray=null}}const Lg={type:"beat",sensitivity:1,decay:.2,minInterval:100};class Dg{constructor(t,e){h(this,"type","beat");h(this,"name");h(this,"config");h(this,"currentValue",0);h(this,"audioContext",null);h(this,"analyser",null);h(this,"mediaStream",null);h(this,"dataArray",null);h(this,"energyHistory",[]);h(this,"lastBeatTime",0);h(this,"beatPulse",0);this.id=t,this.config={...Lg,...e},this.name=`Beat ${t.split("-")[1]}`}async init(){try{this.mediaStream=await navigator.mediaDevices.getUserMedia({audio:!0}),this.audioContext=new AudioContext;const t=this.audioContext.createMediaStreamSource(this.mediaStream);this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=1024,t.connect(this.analyser),this.dataArray=new Uint8Array(this.analyser.frequencyBinCount),this.energyHistory=new Array(43).fill(0)}catch(t){throw console.error("Failed to initialize beat detection:",t),t}}update(t,e){if(!this.analyser||!this.dataArray){this.currentValue=0;return}this.analyser.getByteFrequencyData(this.dataArray);let n=0;const i=Math.min(10,this.dataArray.length);for(let l=0;l<i;l++)n+=this.dataArray[l]/255;n/=i,this.energyHistory.push(n),this.energyHistory.length>43&&this.energyHistory.shift();const o=this.energyHistory.reduce((l,c)=>l+c,0)/this.energyHistory.length*(1.2+(1-this.config.sensitivity)*.8),a=t*1e3-this.lastBeatTime;n>o&&a>this.config.minInterval&&(this.beatPulse=1,this.lastBeatTime=t*1e3),this.beatPulse=Math.max(0,this.beatPulse-e/this.config.decay),this.currentValue=this.beatPulse}getValue(){return this.currentValue}getConfig(){return{...this.config}}setConfig(t){const{type:e,...n}=t;this.config={...this.config,...n}}dispose(){this.mediaStream&&(this.mediaStream.getTracks().forEach(t=>t.stop()),this.mediaStream=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null),this.analyser=null,this.dataArray=null}}const Pg={type:"midi",mode:"cc",channel:0,noteOrCC:-1,velocityMode:!0};class Ig{constructor(t,e){h(this,"type","midi");h(this,"name");h(this,"config");h(this,"currentValue",0);h(this,"_isListening",!1);h(this,"_isLearned",!1);h(this,"onLearnCallback",null);h(this,"midiAccess",null);h(this,"activeNotes",new Map);h(this,"handleMIDIMessage",t=>{var a,l;if(!t.data||t.data.length<2)return;const[e,n,i]=t.data,s=e>>4,o=(e&15)+1;if(this._isListening){if(s===11){this.config.mode="cc",this.config.channel=o,this.config.noteOrCC=n,this._isListening=!1,this._isLearned=!0,this.name=`CC ${n} (Ch ${o})`,this.currentValue=i/127,(a=this.onLearnCallback)==null||a.call(this);return}if(s===9&&i>0){this.config.mode="note",this.config.channel=o,this.config.noteOrCC=n,this._isListening=!1,this._isLearned=!0,this.name=`Note ${this.noteToName(n)} (Ch ${o})`,this.currentValue=this.config.velocityMode?i/127:1,this.activeNotes.set(n,i),(l=this.onLearnCallback)==null||l.call(this);return}return}this._isLearned&&(this.config.channel!==0&&o!==this.config.channel||(this.config.mode==="note"?s===9&&i>0?n===this.config.noteOrCC&&(this.activeNotes.set(n,i),this.currentValue=this.config.velocityMode?i/127:1):(s===8||s===9&&i===0)&&n===this.config.noteOrCC&&(this.activeNotes.delete(n),this.activeNotes.size===0&&(this.currentValue=0)):this.config.mode==="cc"&&s===11&&n===this.config.noteOrCC&&(this.currentValue=i/127)))});this.id=t,this.config={...Pg,...e},this.name=`MIDI ${t.split("-")[1]}`}async init(){if(!navigator.requestMIDIAccess){console.warn("Web MIDI API not supported");return}try{this.midiAccess=await navigator.requestMIDIAccess();for(const t of this.midiAccess.inputs.values())t.onmidimessage=this.handleMIDIMessage;this.midiAccess.onstatechange=t=>{const e=t.port;e&&e.type==="input"&&e.state==="connected"&&(e.onmidimessage=this.handleMIDIMessage)}}catch(t){console.error("Failed to initialize MIDI:",t)}}noteToName(t){const e=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],n=Math.floor(t/12)-1;return`${e[t%12]}${n}`}startListening(t){this._isListening=!0,this.onLearnCallback=t||null}stopListening(){this._isListening=!1,this.onLearnCallback=null}isListening(){return this._isListening}isLearned(){return this._isLearned}clearLearning(){this._isLearned=!1,this.config.noteOrCC=-1,this.currentValue=0,this.activeNotes.clear(),this.name=`MIDI ${this.id.split("-")[1]}`}setLearned(t){this._isLearned=t}update(t,e){}getValue(){return this.currentValue}getConfig(){return{...this.config}}setConfig(t){const{type:e,...n}=t;this.config={...this.config,...n},this.currentValue=0,this.activeNotes.clear()}dispose(){if(this.midiAccess){for(const t of this.midiAccess.inputs.values())t.onmidimessage=null;this.midiAccess=null}this.activeNotes.clear(),this._isListening=!1,this.onLearnCallback=null}}const Ug={type:"gamepad",gamepadIndex:-1,inputType:"axis",inputIndex:-1,invert:!1,deadzone:.1},Va=.5;class Fg{constructor(t,e){h(this,"type","gamepad");h(this,"name");h(this,"config");h(this,"currentValue",0);h(this,"_isListening",!1);h(this,"_isLearned",!1);h(this,"onLearnCallback",null);this.id=t,this.config={...Ug,...e},this.name=`Gamepad ${t.split("-")[1]}`}async init(){}update(t,e){var s,o;const n=navigator.getGamepads();if(this._isListening){for(let a=0;a<n.length;a++){const l=n[a];if(l){for(let c=0;c<l.axes.length;c++){const u=l.axes[c];if(Math.abs(u)>Va){this.config.gamepadIndex=a,this.config.inputType="axis",this.config.inputIndex=c,this._isListening=!1,this._isLearned=!0,this.name=`Axis ${c} (Gamepad ${a+1})`,this.currentValue=this.normalizeAxis(u),(s=this.onLearnCallback)==null||s.call(this);return}}for(let c=0;c<l.buttons.length;c++){const u=l.buttons[c];if(u.pressed||u.value>Va){this.config.gamepadIndex=a,this.config.inputType="button",this.config.inputIndex=c,this._isListening=!1,this._isLearned=!0,this.name=`Button ${c} (Gamepad ${a+1})`,this.currentValue=u.value,(o=this.onLearnCallback)==null||o.call(this);return}}}}return}if(!this._isLearned)return;const i=n[this.config.gamepadIndex];if(i)if(this.config.inputType==="axis"){const a=i.axes[this.config.inputIndex]??0;this.currentValue=this.normalizeAxis(a)}else{const a=i.buttons[this.config.inputIndex];a&&(this.currentValue=this.config.invert?1-a.value:a.value)}}normalizeAxis(t){if(Math.abs(t)<this.config.deadzone)return this.config.invert?1:0;const e=Math.sign(t),n=(Math.abs(t)-this.config.deadzone)/(1-this.config.deadzone);let s=(e*n+1)/2;return this.config.invert&&(s=1-s),s}startListening(t){this._isListening=!0,this.onLearnCallback=t||null}stopListening(){this._isListening=!1,this.onLearnCallback=null}isListening(){return this._isListening}isLearned(){return this._isLearned}clearLearning(){this._isLearned=!1,this.config.gamepadIndex=-1,this.config.inputIndex=-1,this.currentValue=0,this.name=`Gamepad ${this.id.split("-")[1]}`}setLearned(t){if(this._isLearned=t,t&&this.config.gamepadIndex>=0&&this.config.inputIndex>=0){const e=this.config.inputType==="axis"?"Axis":"Button";this.name=`${e} ${this.config.inputIndex} (Gamepad ${this.config.gamepadIndex+1})`}}getValue(){return this.currentValue}getConfig(){return{...this.config}}setConfig(t){const{type:e,...n}=t;this.config={...this.config,...n}}dispose(){this._isListening=!1,this.onLearnCallback=null}}class Ng extends Ci{constructor(){super();h(this,"signals",new Map);h(this,"bindings",[]);h(this,"nextId",new Map);this.nextId.set("lfo",1),this.nextId.set("microphone",1),this.nextId.set("beat",1),this.nextId.set("midi",1),this.nextId.set("gamepad",1)}async createSignal(e,n,i){let s;if(n){s=n;const a=n.match(/-(\d+)$/);if(a){const l=parseInt(a[1],10),c=this.nextId.get(e)||1;l>=c&&this.nextId.set(e,l+1)}}else{const a=this.nextId.get(e)||1;s=`${e}-${a}`,this.nextId.set(e,a+1)}let o;switch(e){case"lfo":o=new Cg(s,i);break;case"microphone":o=new Rg(s,i);break;case"beat":o=new Dg(s,i);break;case"midi":o=new Ig(s,i);break;case"gamepad":o=new Fg(s,i);break;default:throw new Error(`Unknown signal type: ${e}`)}return await o.init(),this.signals.set(s,o),this.emit("signal:add",{signal:o}),this.emit("change",void 0),o}removeSignal(e){const n=this.signals.get(e);if(n){n.dispose(),this.signals.delete(e);const i=this.bindings.filter(s=>s.signalId===e);this.bindings=this.bindings.filter(s=>s.signalId!==e);for(const s of i)this.emit("binding:remove",{layerId:s.layerId,controlName:s.controlName});this.emit("signal:remove",{signalId:e}),this.emit("change",void 0)}}getSignal(e){return this.signals.get(e)}getAllSignals(){return Array.from(this.signals.values())}notifyConfigChange(e){this.emit("signal:config",{signal:e}),this.emit("change",void 0)}bind(e,n){this.unbind(e.layerId,e.controlName,e.effectId);const i={layerId:e.layerId,controlName:e.controlName,signalId:n,effectId:e.effectId};this.bindings.push(i),this.emit("binding:add",{binding:i}),this.emit("change",void 0)}unbind(e,n,i){const s=this.bindings.findIndex(o=>o.layerId===e&&o.controlName===n&&o.effectId===i);s!==-1&&(this.bindings.splice(s,1),this.emit("binding:remove",{layerId:e,controlName:n,effectId:i}),this.emit("change",void 0))}getBinding(e,n,i){return this.bindings.find(s=>s.layerId===e&&s.controlName===n&&s.effectId===i)}getBindingsForSignal(e){return this.bindings.filter(n=>n.signalId===e)}getBindingsForLayer(e){return this.bindings.filter(n=>n.layerId===e)}getBindingsForEffect(e,n){return this.bindings.filter(i=>i.layerId===e&&i.effectId===n)}getAllBindings(){return[...this.bindings]}update(e,n){for(const i of this.signals.values())i.update(e,n)}getMappedValue(e,n,i,s,o){const a=this.getBinding(e,n,o);if(!a)return;const l=this.signals.get(a.signalId);if(!l)return;const c=l.getValue();return i+c*(s-i)}subscribe(e){return this.on("change",e)}dispose(){for(const e of this.signals.values())e.dispose();this.signals.clear(),this.bindings=[],this.clearAllListeners()}}const Ie=new Ng,Cl=2,pr={version:Cl,signals:[],bindings:[],layers:[],layout:null},xs="cast-app-state",Og=1e3;class Bg{constructor(){h(this,"saveTimeout",null);h(this,"pendingState",null);h(this,"listeners",new Set)}load(){try{const t=localStorage.getItem(xs);if(!t)return pr;const e=JSON.parse(t);return this.migrate(e)}catch(t){return console.error("Failed to load persisted state:",t),pr}}save(t){this.pendingState={...t,version:Cl},this.saveTimeout&&clearTimeout(this.saveTimeout),this.saveTimeout=setTimeout(()=>{this.flush()},Og)}flush(){if(this.pendingState){try{localStorage.setItem(xs,JSON.stringify(this.pendingState)),this.notifyListeners()}catch(t){console.error("Failed to save state:",t)}this.pendingState=null}this.saveTimeout&&(clearTimeout(this.saveTimeout),this.saveTimeout=null)}clear(){localStorage.removeItem(xs),this.pendingState=null,this.saveTimeout&&(clearTimeout(this.saveTimeout),this.saveTimeout=null),this.notifyListeners()}subscribe(t){return this.listeners.add(t),()=>this.listeners.delete(t)}notifyListeners(){for(const t of this.listeners)t()}migrate(t){let e=t;return e.version||(e={...pr,...e,version:0}),e.version<1&&(e={version:1,signals:e.signals||[],bindings:e.bindings||[],layers:[],layout:e.layout||null}),e.version<2&&(e={...e,version:2,layers:e.layers||[]}),e}}const rr=new Bg;class zg{constructor(){h(this,"simpleLayout",null);h(this,"treeLayout",null);h(this,"initialized",!1);h(this,"layers",[]);h(this,"savedLayers",[]);h(this,"layerEventCleanup",new Map)}async initialize(){if(this.initialized)return;const t=rr.load();await this.hydrateSignals(t.signals),this.hydrateBindings(t.bindings),this.simpleLayout=t.simpleLayout||null,this.treeLayout=t.treeLayout||null,this.savedLayers=t.layers||[],this.initialized=!0,Ie.subscribe(()=>this.saveState())}getSimpleLayout(){return this.simpleLayout}saveSimpleLayout(t){this.simpleLayout=t,this.saveState()}getTreeLayout(){return this.treeLayout}saveTreeLayout(t){this.treeLayout=t,this.saveState()}getSavedLayers(){return this.savedLayers}registerLayers(t){this.unregisterLayers(),this.layers=t;for(const e of t){const n=this.subscribeToLayerChanges(e);this.layerEventCleanup.set(e.id,n)}}registerLayer(t){if(!this.layers.includes(t)){this.layers.push(t);const e=this.subscribeToLayerChanges(t);this.layerEventCleanup.set(t.id,e)}}unregisterLayer(t){const e=this.layerEventCleanup.get(t);e&&(e(),this.layerEventCleanup.delete(t)),this.layers=this.layers.filter(n=>n.id!==t)}unregisterLayers(){for(const t of this.layerEventCleanup.values())t();this.layerEventCleanup.clear(),this.layers=[]}subscribeToLayerChanges(t){const e=[];return e.push(t.on("property:change",()=>this.saveState())),e.push(t.on("sketch:load",()=>this.saveState())),e.push(t.on("sketch:unload",()=>this.saveState())),e.push(t.on("effect:add",()=>this.saveState())),e.push(t.on("effect:remove",()=>this.saveState())),e.push(t.on("effects:reorder",()=>this.saveState())),()=>{for(const n of e)n()}}saveState(){const t=this.serializeState();rr.save(t)}flush(){this.saveState(),rr.flush()}clear(){rr.clear(),this.simpleLayout=null}serializeState(){return{version:pr.version,signals:this.serializeSignals(),bindings:this.serializeBindings(),layers:this.serializeLayers(),layout:null,simpleLayout:this.simpleLayout,treeLayout:this.treeLayout}}serializeSignals(){return Ie.getAllSignals().map(t=>{const e={id:t.id,type:t.type,name:t.name,config:t.getConfig()};return(t.type==="midi"||t.type==="gamepad")&&(e.isLearned=t.isLearned()),e})}serializeBindings(){return Ie.getAllBindings().map(t=>({layerId:t.layerId,controlName:t.controlName,signalId:t.signalId,effectId:t.effectId}))}serializeLayers(){return this.layers.map(t=>{var i;const e={};if(t.sketch)for(const s of t.sketch.controls){const o=t.sketch.getControl(s.name);o!==void 0&&(e[s.name]=o)}const n=t.effects.map(s=>{const o={};for(const l of s.controls){const c=s.getControl(l.name);c!==void 0&&(o[l.name]=c)}return{factoryId:s.id.replace(/-\d+$/,""),instanceId:s.id,enabled:s.enabled,controls:o}});return{id:t.id,sketchId:((i=t.sketch)==null?void 0:i.id.replace(/-\d+$/,""))||null,sketchControls:e,effects:n,opacity:t.opacity,blendMode:t.blendMode,visible:t.visible}})}async hydrateSignals(t){for(const e of t)try{const n=await Ie.createSignal(e.type,e.id,e.config);n&&(n.name=e.name,(n.type==="midi"||n.type==="gamepad")&&e.isLearned&&n.setLearned(!0))}catch(n){console.error(`Failed to restore signal ${e.id}:`,n)}}hydrateBindings(t){for(const e of t)Ie.bind({layerId:e.layerId,controlName:e.controlName,min:0,max:1,effectId:e.effectId},e.signalId)}}const it=new zg;class sn{constructor(){h(this,"element");h(this,"mounted",!1);h(this,"cleanupFns",[]);h(this,"elementCreated",!1)}ensureElement(){this.elementCreated||(this.element=this.createElement(),this.elementCreated=!0)}mount(t){this.mounted||(this.ensureElement(),t.appendChild(this.element),this.mounted=!0,this.onMount())}unmount(){this.mounted&&(this.onUnmount(),this.element.remove(),this.mounted=!1)}dispose(){this.mounted&&this.unmount(),this.onDispose();for(const t of this.cleanupFns)t();this.cleanupFns=[]}getElement(){return this.ensureElement(),this.element}isMounted(){return this.mounted}onMount(){}onUnmount(){}onDispose(){}listen(t,e,n,i){t.addEventListener(e,n,i);const s=()=>t.removeEventListener(e,n,i);return this.cleanupFns.push(s),s}listenWindow(t,e,n){window.addEventListener(t,e,n);const i=()=>window.removeEventListener(t,e,n);return this.cleanupFns.push(i),i}subscribe(t,e,n){const i=t.on(e,n);return this.cleanupFns.push(i),i}onCleanup(t){this.cleanupFns.push(t)}query(t){return this.element.querySelector(t)}queryRequired(t){const e=this.element.querySelector(t);if(!e)throw new Error(`Required element not found: ${t}`);return e}queryAll(t){return this.element.querySelectorAll(t)}}class Vg extends Ci{constructor(){super(...arguments);h(this,"dragData",null);h(this,"ghostElement",null);h(this,"isDragging",!1)}startDrag(e,n,i){if(this.isDragging)return;this.isDragging=!0,this.dragData=e,this.createGhost(e.tabTitle,n,i);const s=a=>{this.updateGhostPosition(a.clientX,a.clientY),this.emit("drag:move",{x:a.clientX,y:a.clientY})},o=a=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",o),this.endDrag(a.clientX,a.clientY)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",o),this.emit("drag:start",e),document.body.classList.add("panel-dragging")}endDrag(e,n){this.isDragging&&(this.removeGhost(),this.isDragging=!1,this.dragData=null,document.body.classList.remove("panel-dragging"),this.emit("drag:end",void 0))}drop(e,n){this.dragData&&this.emit("drop",{data:{...this.dragData},targetPanelId:e,zone:n})}getDragData(){return this.dragData}isDragActive(){return this.isDragging}createGhost(e,n,i){this.ghostElement=document.createElement("div"),this.ghostElement.className="drag-ghost",this.ghostElement.textContent=e,this.ghostElement.style.cssText=`
      position: fixed;
      left: ${n}px;
      top: ${i}px;
      padding: 8px 16px;
      background: #333;
      border: 1px solid #666;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
    `,document.body.appendChild(this.ghostElement)}updateGhostPosition(e,n){this.ghostElement&&(this.ghostElement.style.left=`${e}px`,this.ghostElement.style.top=`${n}px`)}removeGhost(){this.ghostElement&&(this.ghostElement.remove(),this.ghostElement=null)}}const tt=new Vg,kg=5;class Hg extends Ci{constructor(e){super();h(this,"id");h(this,"element");h(this,"titleBar");h(this,"contentArea");h(this,"dropZonesContainer",null);h(this,"tabs",[]);h(this,"activeTabId",null);h(this,"mountedContent",null);h(this,"contentFactory",null);h(this,"valueProvider",null);h(this,"activeDropZone",null);h(this,"cleanupFns",[]);h(this,"animationFrameId",null);h(this,"tabDropIndicator",null);h(this,"tabDropIndex",-1);this.id=e.id,this.tabs=e.tabs||[],this.activeTabId=e.activeTabId||(this.tabs.length>0?this.tabs[0].id:null),this.element=this.createElement(),this.titleBar=this.element.querySelector(".panel-title-bar"),this.setupDragManager()}createElement(){var i,s;const e=document.createElement("div");e.className="panel",e.dataset.panelId=this.id;const n=document.createElement("div");if(n.className="panel-title-bar",this.tabs.length>1)n.classList.add("has-tabs"),this.renderTabsIntoTitleBar(n);else{const o=((i=this.tabs[0])==null?void 0:i.id)||this.id,a=((s=this.tabs[0])==null?void 0:s.title)||this.id,l=document.createElement("div");l.className="panel-title-fill",l.dataset.tabId=o,n.appendChild(l);const c=document.createElement("span");c.className="panel-title-text",c.textContent=a,n.appendChild(c)}return this.tabDropIndicator=document.createElement("div"),this.tabDropIndicator.className="tab-drop-indicator",n.appendChild(this.tabDropIndicator),e.appendChild(n),this.contentArea=document.createElement("div"),this.contentArea.className="panel-content",e.appendChild(this.contentArea),this.dropZonesContainer=document.createElement("div"),this.dropZonesContainer.className="panel-drop-zones",this.dropZonesContainer.innerHTML=`
      <div class="drop-zone drop-zone-left" data-zone="left"></div>
      <div class="drop-zone drop-zone-right" data-zone="right"></div>
      <div class="drop-zone drop-zone-top" data-zone="top"></div>
      <div class="drop-zone drop-zone-bottom" data-zone="bottom"></div>
      <div class="drop-zone drop-zone-center" data-zone="center"></div>
    `,e.appendChild(this.dropZonesContainer),e}renderTabsIntoTitleBar(e){for(const n of this.tabs){const i=document.createElement("button");i.className="panel-tab",i.dataset.tabId=n.id;const s=document.createElement("div");s.className="panel-tab-fill",i.appendChild(s);const o=document.createElement("span");o.className="panel-tab-text",o.textContent=n.title,i.appendChild(o),n.id===this.activeTabId&&i.classList.add("active"),i.addEventListener("click",a=>{a.defaultPrevented||this.setActiveTab(n.id)}),e.appendChild(i)}}setupDragManager(){this.setupTitleBarDrag(),this.setupDropZones(),this.setupTitleBarDrop(),this.setupContextMenu();const e=tt.on("drag:start",()=>{const i=tt.getDragData();i&&i.sourcePanelId!==this.id&&this.element.classList.add("drag-active")});this.cleanupFns.push(e);const n=tt.on("drag:end",()=>{this.element.classList.remove("drag-active"),this.clearActiveDropZone(),this.hideTabDropIndicator()});this.cleanupFns.push(n)}setupTitleBarDrag(){let e=!1,n=0,i=0,s=!1,o=null,a=null;const l=f=>{var v,y;const p=f.target,g=p.closest(".panel-tab");if(g)o=g.dataset.tabId||null,a=g.textContent;else if(p.closest(".panel-title-bar"))o=((v=this.tabs[0])==null?void 0:v.id)||this.id,a=((y=this.tabs[0])==null?void 0:y.title)||this.id;else return;e=!0,s=!1,n=f.clientX,i=f.clientY,f.preventDefault()},c=f=>{if(!e)return;const p=f.clientX-n,g=f.clientY-i,v=Math.sqrt(p*p+g*g);!s&&v>kg&&(s=!0,tt.startDrag({tabId:o,tabTitle:a,sourcePanelId:this.id},f.clientX,f.clientY))},u=()=>{e=!1,o=null,a=null};this.titleBar.addEventListener("mousedown",l),window.addEventListener("mousemove",c),window.addEventListener("mouseup",u),this.cleanupFns.push(()=>{this.titleBar.removeEventListener("mousedown",l),window.removeEventListener("mousemove",c),window.removeEventListener("mouseup",u)})}setupDropZones(){if(!this.dropZonesContainer)return;this.dropZonesContainer.querySelectorAll(".drop-zone").forEach(n=>{n.addEventListener("mouseenter",()=>{if(tt.isDragActive()){const i=n.dataset.zone;this.setActiveDropZone(i)}}),n.addEventListener("mouseleave",()=>{tt.isDragActive()&&this.clearActiveDropZone()}),n.addEventListener("mouseup",()=>{tt.isDragActive()&&this.activeDropZone&&(tt.drop(this.id,this.activeDropZone),this.emit("drop",{zone:this.activeDropZone}))})})}setupTitleBarDrop(){this.titleBar.addEventListener("mousemove",e=>{if(!tt.isDragActive())return;const n=tt.getDragData();if((n==null?void 0:n.sourcePanelId)===this.id&&this.tabs.length<=1)return;const i=this.calculateTabDropIndex(e.clientX);this.showTabDropIndicator(i)}),this.titleBar.addEventListener("mouseleave",()=>{this.hideTabDropIndicator()}),this.titleBar.addEventListener("mouseup",()=>{tt.isDragActive()&&this.tabDropIndex>=0&&(this.emit("tab:drop",{index:this.tabDropIndex}),tt.drop(this.id,"center"),this.hideTabDropIndicator())})}setupContextMenu(){const e=n=>{var a,l;n.preventDefault();const s=n.target.closest(".panel-tab");let o;s?o=s.dataset.tabId||((a=this.tabs[0])==null?void 0:a.id)||this.id:o=((l=this.tabs[0])==null?void 0:l.id)||this.id,this.showContextMenu(n.clientX,n.clientY,o)};this.titleBar.addEventListener("contextmenu",e),this.cleanupFns.push(()=>{this.titleBar.removeEventListener("contextmenu",e)})}showContextMenu(e,n,i){const s=document.querySelector(".panel-context-menu");s==null||s.remove();const o=document.createElement("div");o.className="panel-context-menu",o.style.left=`${e}px`,o.style.top=`${n}px`;const a=document.createElement("button");a.className="context-menu-item",a.textContent="Close",a.addEventListener("click",()=>{this.emit("tab:close",{tabId:i}),o.remove()}),o.appendChild(a),document.body.appendChild(o);const l=c=>{o.contains(c.target)||(o.remove(),document.removeEventListener("mousedown",l))};setTimeout(()=>{document.addEventListener("mousedown",l)},0)}calculateTabDropIndex(e){const n=this.titleBar.querySelectorAll(".panel-tab");if(n.length===0)return 0;for(let i=0;i<n.length;i++){const o=n[i].getBoundingClientRect(),a=o.left+o.width/2;if(e<a)return i}return n.length}showTabDropIndicator(e){if(!this.tabDropIndicator)return;this.tabDropIndex=e,this.tabDropIndicator.classList.add("visible");const n=this.titleBar.querySelectorAll(".panel-tab");if(n.length===0)this.tabDropIndicator.style.left="0px";else if(e>=n.length){const s=n[n.length-1].getBoundingClientRect(),o=this.titleBar.getBoundingClientRect();this.tabDropIndicator.style.left=`${s.right-o.left}px`}else{const s=n[e].getBoundingClientRect(),o=this.titleBar.getBoundingClientRect();this.tabDropIndicator.style.left=`${s.left-o.left}px`}}hideTabDropIndicator(){this.tabDropIndicator&&(this.tabDropIndex=-1,this.tabDropIndicator.classList.remove("visible"))}setActiveDropZone(e){if(this.clearActiveDropZone(),this.activeDropZone=e,this.dropZonesContainer){const n=this.dropZonesContainer.querySelector(`[data-zone="${e}"]`);n==null||n.classList.add("active")}}clearActiveDropZone(){this.activeDropZone=null,this.dropZonesContainer&&this.dropZonesContainer.querySelectorAll(".drop-zone").forEach(e=>{e.classList.remove("active")})}setTabs(e,n){var i,s,o;if(this.tabs=e,this.activeTabId=n||((i=e[0])==null?void 0:i.id)||null,this.titleBar.innerHTML="",this.titleBar.classList.remove("has-tabs"),e.length>1)this.titleBar.classList.add("has-tabs"),this.renderTabsIntoTitleBar(this.titleBar);else{const a=((s=e[0])==null?void 0:s.id)||this.id,l=((o=e[0])==null?void 0:o.title)||this.id,c=document.createElement("div");c.className="panel-title-fill",c.dataset.tabId=a,this.titleBar.appendChild(c);const u=document.createElement("span");u.className="panel-title-text",u.textContent=l,this.titleBar.appendChild(u)}this.tabDropIndicator=document.createElement("div"),this.tabDropIndicator.className="tab-drop-indicator",this.titleBar.appendChild(this.tabDropIndicator),this.contentFactory&&this.activeTabId&&this.mountContent(this.activeTabId)}setContentFactory(e){this.contentFactory=e,this.activeTabId&&this.mountContent(this.activeTabId)}setValueProvider(e){this.valueProvider=e,this.startValueUpdates()}startValueUpdates(){if(this.animationFrameId!==null)return;const e=()=>{this.updateTabValues(),this.animationFrameId=requestAnimationFrame(e)};this.animationFrameId=requestAnimationFrame(e)}stopValueUpdates(){this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}updateTabValues(){if(!this.valueProvider)return;this.titleBar.querySelectorAll(".panel-tab-fill").forEach(i=>{const s=i.parentElement,o=s==null?void 0:s.dataset.tabId;if(o){const a=this.valueProvider(o);a!==null?i.style.width=`${a*100}%`:i.style.width="0%"}});const n=this.titleBar.querySelector(".panel-title-fill");if(n){const i=n.dataset.tabId;if(i){const s=this.valueProvider(i);s!==null?n.style.width=`${s*100}%`:n.style.width="0%"}}}setContent(e){this.unmountContent(),this.mountedContent=e,e.mount(this.contentArea)}setActiveTab(e){e!==this.activeTabId&&this.tabs.find(n=>n.id===e)&&(this.activeTabId=e,this.titleBar.querySelectorAll(".panel-tab").forEach(n=>{n.classList.toggle("active",n.getAttribute("data-tab-id")===e)}),this.mountContent(e),this.emit("tab:change",{tabId:e}))}mountContent(e){this.unmountContent(),this.contentFactory&&(this.mountedContent=this.contentFactory(e),this.mountedContent.mount(this.contentArea))}unmountContent(){this.mountedContent&&(this.mountedContent.dispose(),this.mountedContent=null)}getActiveTabId(){return this.activeTabId}getTabs(){return[...this.tabs]}getElement(){return this.element}mount(e){e.appendChild(this.element)}dispose(){this.stopValueUpdates(),this.unmountContent();for(const e of this.cleanupFns)e();this.cleanupFns=[],this.element.remove(),this.clearAllListeners()}}class Gg extends sn{constructor(e){super();h(this,"orientation");h(this,"onResize");h(this,"onDropCallback");h(this,"isDragging",!1);h(this,"startPos",0);h(this,"isDropTarget",!1);h(this,"dragCleanupFns",[]);this.orientation=e.orientation,this.onResize=e.onResize,this.onDropCallback=e.onDrop}createElement(){const e=document.createElement("div");return e.className=`divider divider-${this.orientation}`,e}onMount(){this.listen(this.element,"mousedown",this.handleMouseDown.bind(this)),this.setupDropTarget()}setupDropTarget(){const e=tt.on("drag:start",()=>{this.element.classList.add("drop-enabled")});this.dragCleanupFns.push(e);const n=tt.on("drag:end",()=>{this.element.classList.remove("drop-enabled","drop-hover"),this.isDropTarget=!1});this.dragCleanupFns.push(n),this.listen(this.element,"mouseenter",()=>{tt.isDragActive()&&(this.isDropTarget=!0,this.element.classList.add("drop-hover"))}),this.listen(this.element,"mouseleave",()=>{this.isDropTarget=!1,this.element.classList.remove("drop-hover")}),this.listen(this.element,"mouseup",()=>{tt.isDragActive()&&this.isDropTarget&&this.onDropCallback&&this.onDropCallback()})}onDispose(){for(const e of this.dragCleanupFns)e();this.dragCleanupFns=[]}handleMouseDown(e){e.preventDefault(),this.isDragging=!0,this.startPos=this.orientation==="vertical"?e.clientX:e.clientY,this.element.classList.add("dragging"),document.body.style.cursor=this.orientation==="vertical"?"col-resize":"row-resize";const n=s=>{if(!this.isDragging)return;const o=this.orientation==="vertical"?s.clientX:s.clientY,a=o-this.startPos;this.startPos=o,this.onResize(a)},i=()=>{this.isDragging=!1,this.element.classList.remove("dragging"),document.body.style.cursor="",window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",i)};window.addEventListener("mousemove",n),window.addEventListener("mouseup",i)}}let Wg=1;function wl(){return`node-${Wg++}`}function Un(r,t){var e;return{type:"panel",id:wl(),tabs:r,activeTabId:t||((e=r[0])==null?void 0:e.id)||""}}function ri(r,t,e,n=.5){return{type:"split",id:wl(),direction:r,ratio:n,first:t,second:e}}function yr(r,t){return r.type==="panel"?r.id===t?r:null:yr(r.first,t)||yr(r.second,t)}function Ht(r,t){return r.type==="panel"?r.tabs.some(e=>e.id===t)?r:null:Ht(r.first,t)||Ht(r.second,t)}function sr(r,t){var n;const e=Ht(r,t);return!e||(e.tabs=e.tabs.filter(i=>i.id!==t),e.activeTabId===t&&(e.activeTabId=((n=e.tabs[0])==null?void 0:n.id)||""),e.tabs.length>0)?r:lo(r,e.id)}function lo(r,t){if(r.type==="panel"&&r.id===t)return null;if(r.type==="panel")return r;if(r.first.id===t)return r.second;if(r.second.id===t)return r.first;const e=lo(r.first,t),n=lo(r.second,t);if(e!==r.first){if(e===null)return n;r.first=e}if(n!==r.second){if(n===null)return e;r.second=n}return r}function ka(r,t,e,n){if(n==="center"){const s=yr(r,t);return s&&(s.tabs.push(e),s.activeTabId=e.id),r}const i=Un([e],e.id);return Sr(r,t,i,n)}function Xg(r,t,e,n){const i=yr(r,t);if(i){const s=Math.max(0,Math.min(n,i.tabs.length));i.tabs.splice(s,0,e),i.activeTabId=e.id}return r}function Sr(r,t,e,n){const i=n==="left"||n==="right"?"horizontal":"vertical",s=n==="left"||n==="top";if(r.type==="panel"&&r.id===t)return ri(i,s?e:r,s?r:e,.5);if(r.type==="panel")return r;if(r.first.type==="panel"&&r.first.id===t){const o=ri(i,s?e:r.first,s?r.first:e,.5);return r.first=o,r}if(r.second.type==="panel"&&r.second.id===t){const o=ri(i,s?e:r.second,s?r.second:e,.5);return r.second=o,r}return r.first.type==="split"&&(r.first=Sr(r.first,t,e,n)),r.second.type==="split"&&(r.second=Sr(r.second,t,e,n)),r}function Ai(r){return r.type==="panel"?[r]:[...Ai(r.first),...Ai(r.second)]}function qg(r,t,e,n="bottom"){var a;let i=e;if(!i){const l=Ai(r);i=(a=l[l.length-1])==null?void 0:a.id}if(!i){const l=Un([t],t.id);return{layout:l,panelId:l.id}}const s=Un([t],t.id);return{layout:Sr(r,i,s,n),panelId:s.id}}function ei(r){return r.type==="panel"?{...r,tabs:r.tabs.map(t=>({...t}))}:{...r,first:ei(r.first),second:ei(r.second)}}function Rl(){return ri("horizontal",Un([{id:"output",title:"Output"}],"output"),ri("vertical",Un([{id:"layer-1",title:"Layer 1"}],"layer-1"),Un([{id:"library",title:"Library"}],"library"),.5),.6)}const Ha=100;class Yg extends Ci{constructor(e,n){super();h(this,"container");h(this,"rootElement");h(this,"layout");h(this,"panels",new Map);h(this,"dividers",[]);h(this,"contentFactories",new Map);h(this,"valueProvider",null);h(this,"cleanupFns",[]);this.container=e,this.layout=n?ei(n):Rl(),this.rootElement=document.createElement("div"),this.rootElement.className="window-manager",this.container.appendChild(this.rootElement),this.render(),this.setupDragDropHandling()}setupDragDropHandling(){const e=tt.on("drop",({data:n,targetPanelId:i,zone:s})=>{this.handleDrop(n.tabId,n.sourcePanelId,i,s)});this.cleanupFns.push(e)}handleTabDrop(e,n){const i=tt.getDragData();if(!i||i.createSignalType||i.createLayer)return;const{tabId:s}=i,o=Ht(this.layout,s);if(!o)return;const a=o.tabs.find(c=>c.id===s);if(!a)return;if(o.id===e){const c=o.tabs.findIndex(u=>u.id===s);if(c===n||c===n-1)return}const l=sr(this.layout,s);l&&(this.layout=l,this.layout=Xg(this.layout,e,a,n),this.render(),this.emitLayoutChange())}handleDrop(e,n,i,s){const o=tt.getDragData();if(o!=null&&o.createSignalType||o!=null&&o.createLayer)return;const a=Ht(this.layout,e);if(!a)return;const l=a.tabs.find(u=>u.id===e);if(!l||n===i&&s==="center")return;const c=sr(this.layout,e);c&&(this.layout=c,this.layout=ka(this.layout,i,l,s),this.render(),this.emitLayoutChange())}render(){this.cleanup();const e=this.renderNode(this.layout);this.rootElement.appendChild(e)}renderNode(e){return e.type==="panel"?this.renderPanelNode(e):this.renderSplitNode(e)}renderPanelNode(e){const n=document.createElement("div");n.className="panel-container",n.dataset.nodeId=e.id;const i=new Hg({id:e.id,tabs:e.tabs,activeTabId:e.activeTabId});return i.setContentFactory(s=>{const o=this.contentFactories.get(s);return o?o():new Ga(s)}),this.valueProvider&&i.setValueProvider(this.valueProvider),i.on("tab:change",({tabId:s})=>{e.activeTabId=s,this.emitLayoutChange()}),i.on("tab:drop",({index:s})=>{this.handleTabDrop(e.id,s)}),i.on("tab:close",({tabId:s})=>{this.removePanel(s)}),i.mount(n),this.panels.set(e.id,i),n}renderSplitNode(e){const n=document.createElement("div");n.className=`split-container split-${e.direction}`,n.dataset.nodeId=e.id;const i=this.renderNode(e.first);i.classList.add("split-first");const s=document.createElement("div");s.className=`split-divider split-divider-${e.direction}`;const o=new Gg({orientation:e.direction==="horizontal"?"vertical":"horizontal",onResize:l=>this.handleDividerResize(e,n,l),onDrop:()=>this.handleDividerDrop(e)});o.mount(s),this.dividers.push(o);const a=this.renderNode(e.second);return a.classList.add("split-second"),n.appendChild(i),n.appendChild(s),n.appendChild(a),this.applySplitRatio(n,e),n}applySplitRatio(e,n){const i=e.querySelector(":scope > .split-first"),s=e.querySelector(":scope > .split-second");if(!i||!s)return;const o=n.ratio*100;n.direction==="horizontal"?(i.style.width=`calc(${o}% - 3px)`,s.style.width=`calc(${100-o}% - 3px)`,i.style.height="100%",s.style.height="100%"):(i.style.height=`calc(${o}% - 3px)`,s.style.height=`calc(${100-o}% - 3px)`,i.style.width="100%",s.style.width="100%")}handleDividerDrop(e){const n=tt.getDragData();if(!n)return;const{tabId:i,tabTitle:s}=n;if(!Ht(this.layout,i))return;const a=sr(this.layout,i);if(!a)return;this.layout=a;const l=Un([{id:i,title:s}],i);this.insertPanelAtDivider(e,l),tt.endDrag(),this.render(),this.emitLayoutChange()}insertPanelAtDivider(e,n){const i=ri(e.direction,n,e.second,.5);e.second=i,e.ratio=e.ratio*.67}handleDividerResize(e,n,i){const o=e.direction==="horizontal"?n.clientWidth:n.clientHeight,a=(1-e.ratio)*o,l=i/o,c=Math.max(.1,Math.min(.9,e.ratio+l)),u=c*o,f=(1-c)*o;u<Ha||f<Ha||(this.compensateNestedSplits(e.second,e.direction,a,f),e.ratio=c,this.applyAllRatios(e,n),this.emitLayoutChange())}compensateNestedSplits(e,n,i,s){if(e.type!=="split"||e.direction!==n)return;const a=e.ratio*i/s;if(a>.05&&a<.95){const l=e.ratio;e.ratio=a;const c=(1-l)*i,u=(1-a)*s;this.compensateNestedSplits(e.second,n,c,u)}}applyAllRatios(e,n){if(this.applySplitRatio(n,e),e.first.type==="split"){const i=n.querySelector(":scope > .split-first > .split-container");i&&this.applyAllRatios(e.first,i)}if(e.second.type==="split"){const i=n.querySelector(":scope > .split-second > .split-container");i&&this.applyAllRatios(e.second,i)}}cleanup(){for(const e of this.panels.values())e.dispose();this.panels.clear();for(const e of this.dividers)e.dispose();this.dividers=[],this.rootElement.innerHTML=""}emitLayoutChange(){this.emit("layout:change",ei(this.layout))}registerContent(e,n){this.contentFactories.set(e,n);const i=Ht(this.layout,e);if(i){const s=this.panels.get(i.id);s&&s.getActiveTabId()===e&&s.setContentFactory(o=>{const a=this.contentFactories.get(o);return a?a():new Ga(o)})}}setValueProvider(e){this.valueProvider=e;for(const n of this.panels.values())n.setValueProvider(e)}getPanel(e){return this.panels.get(e)}getLayout(){return ei(this.layout)}setLayout(e){this.layout=ei(e),this.render()}addPanel(e,n,i="bottom"){const s=qg(this.layout,e,n,i);return this.layout=s.layout,this.render(),this.emitLayoutChange(),s.panelId}removePanel(e){const n=sr(this.layout,e);n&&(this.layout=n,this.render(),this.emitLayoutChange())}addPanelAtTarget(e,n,i){this.layout=ka(this.layout,n,e,i),this.render(),this.emitLayoutChange()}dispose(){this.cleanup();for(const e of this.cleanupFns)e();this.cleanupFns=[],this.rootElement.remove(),this.clearAllListeners()}}class Ga extends sn{constructor(e){super();h(this,"label");this.label=e}createElement(){const e=document.createElement("div");return e.className="panel-placeholder",e.innerHTML=`
      <div class="placeholder-text">
        <span>No content registered for: ${this.label}</span>
      </div>
    `,e}}class $g extends sn{constructor(e){super();h(this,"canvas");h(this,"resizeObserver",null);h(this,"onCanvasReady");h(this,"onCanvasResize");this.onCanvasReady=e.onCanvasReady,this.onCanvasResize=e.onCanvasResize}createElement(){const e=document.createElement("div");return e.className="main-output",this.canvas=document.createElement("canvas"),e.appendChild(this.canvas),e}onMount(){this.onCanvasReady(this.canvas);const e=window.devicePixelRatio||1;this.resizeObserver=new ResizeObserver(n=>{var i;for(const s of n){const{width:o,height:a}=s.contentRect,l=Math.floor(o*e),c=Math.floor(a*e);this.canvas.width=l,this.canvas.height=c,(i=this.onCanvasResize)==null||i.call(this,l,c)}}),this.resizeObserver.observe(this.element)}onUnmount(){var e;(e=this.resizeObserver)==null||e.disconnect(),this.resizeObserver=null}getCanvas(){return this.canvas}getDimensions(){return{width:this.canvas.width,height:this.canvas.height}}}class mr extends sn{constructor(e){super();h(this,"trackEl");h(this,"fillEl");h(this,"labelEl");h(this,"valueEl");h(this,"label");h(this,"value");h(this,"min");h(this,"max");h(this,"step");h(this,"decimals");h(this,"onChange");h(this,"onContextMenuHandler");h(this,"isDragging",!1);h(this,"isBound",!1);h(this,"boundSignalName");this.label=e.label,this.value=e.value,this.min=e.min,this.max=e.max,this.step=e.step??.01,this.decimals=e.decimals??2,this.onChange=e.onChange,this.onContextMenuHandler=e.onContextMenu,this.ensureElement(),this.updateDisplay()}createElement(){const e=document.createElement("div");return e.className="slider",e.innerHTML=`
      <div class="slider-fill"></div>
      <div class="slider-label"></div>
      <div class="slider-value"></div>
    `,this.trackEl=e,this.fillEl=e.querySelector(".slider-fill"),this.labelEl=e.querySelector(".slider-label"),this.valueEl=e.querySelector(".slider-value"),e}onMount(){this.listen(this.element,"mousedown",this.handleMouseDown.bind(this)),this.listen(this.element,"contextmenu",this.handleContextMenu.bind(this))}handleMouseDown(e){if(e.button!==0||this.isBound)return;e.preventDefault(),this.isDragging=!0,this.element.classList.add("dragging"),this.updateFromMouse(e.clientX);const n=s=>{this.isDragging&&this.updateFromMouse(s.clientX)},i=()=>{this.isDragging=!1,this.element.classList.remove("dragging"),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",i)};window.addEventListener("mousemove",n),window.addEventListener("mouseup",i)}handleContextMenu(e){var n;e.preventDefault(),(n=this.onContextMenuHandler)==null||n.call(this,e)}updateFromMouse(e){const n=this.trackEl.getBoundingClientRect(),i=Math.max(0,Math.min(1,(e-n.left)/n.width));let s=this.min+i*(this.max-this.min);s=Math.round(s/this.step)*this.step,s=Math.max(this.min,Math.min(this.max,s)),s!==this.value&&(this.value=s,this.updateDisplay(),this.onChange(s))}updateDisplay(){const e=(this.value-this.min)/(this.max-this.min)*100;this.fillEl.style.width=`${e}%`;const n=Number.isInteger(this.step)&&this.step>=1?this.value.toFixed(0):this.value.toFixed(this.decimals);this.valueEl.textContent=n,this.isBound&&this.boundSignalName?this.labelEl.innerHTML=`${this.label}<span class="slider-binding-indicator" title="Bound to ${this.boundSignalName}"> ~ ${this.boundSignalName}</span>`:this.labelEl.textContent=this.label}setValue(e){this.value=Math.max(this.min,Math.min(this.max,e)),this.updateDisplay()}getValue(){return this.value}setBound(e,n){this.isBound=e,this.boundSignalName=n,this.element.classList.toggle("bound",e),this.updateDisplay()}getIsBound(){return this.isBound}setConfig(e){e.min!==void 0&&(this.min=e.min),e.max!==void 0&&(this.max=e.max),e.step!==void 0&&(this.step=e.step),e.decimals!==void 0&&(this.decimals=e.decimals),this.updateDisplay()}}class Zg extends sn{constructor(e){super();h(this,"target");h(this,"position");h(this,"onCloseCallback");h(this,"clickOutsideHandler",null);h(this,"keyHandler",null);this.target=e.target,this.position=e.position,this.onCloseCallback=e.onClose}createElement(){const e=document.createElement("div");return e.className="control-context-menu",e.style.cssText=`
      position: fixed;
      left: ${this.position.x}px;
      top: ${this.position.y}px;
      z-index: 10000;
    `,this.renderContent(e),e}renderContent(e){const n=Ie.getAllSignals(),i=Ie.getBinding(this.target.layerId,this.target.controlName);let s="";if(i){const o=Ie.getSignal(i.signalId);s+=`
        <div class="menu-item unbind" data-action="unbind">
          Unbind from ${(o==null?void 0:o.name)??"Unknown"}
        </div>
        <div class="menu-divider"></div>
      `}if(n.length>0){s+='<div class="menu-label">Bind to:</div>';for(const o of n){const a=(i==null?void 0:i.signalId)===o.id;s+=`
          <div class="menu-item ${a?"active":""}" data-action="bind" data-signal-id="${o.id}">
            <span class="signal-badge type-${o.type}">
              ${o.type.charAt(0).toUpperCase()}
            </span>
            ${o.name}
          </div>
        `}}else s+='<div class="menu-empty">No signals available. Create one in the Signals panel.</div>';e.innerHTML=s}onMount(){this.listen(this.element,"click",this.handleClick.bind(this)),setTimeout(()=>{this.clickOutsideHandler=e=>{this.element.contains(e.target)||this.close()},document.addEventListener("mousedown",this.clickOutsideHandler)},0),this.keyHandler=e=>{e.key==="Escape"&&this.close()},document.addEventListener("keydown",this.keyHandler),this.adjustPosition()}onUnmount(){this.clickOutsideHandler&&document.removeEventListener("mousedown",this.clickOutsideHandler),this.keyHandler&&document.removeEventListener("keydown",this.keyHandler)}handleClick(e){const n=e.target.closest("[data-action]");if(!n)return;const i=n.dataset.action;if(i==="unbind")Ie.unbind(this.target.layerId,this.target.controlName),this.close();else if(i==="bind"){const s=n.dataset.signalId;s&&(Ie.bind(this.target,s),this.close())}}adjustPosition(){const e=this.element.getBoundingClientRect(),n=window.innerWidth,i=window.innerHeight;let{x:s,y:o}=this.position;s+e.width>n-10&&(s=n-e.width-10),o+e.height>i-10&&(o=i-e.height-10),s=Math.max(10,s),o=Math.max(10,o),this.element.style.left=`${s}px`,this.element.style.top=`${o}px`}close(){this.onCloseCallback()}}function Kg(r){let t=!1;const e=()=>{t||(t=!0,n.dispose())},n=new Zg({...r,onClose:()=>{r.onClose(),e()}});return n.mount(document.body),e}const jg=["normal","additive","multiply","screen","overlay"];class ys extends sn{constructor(e){super();h(this,"layer");h(this,"renderLoop");h(this,"onDropCallback");h(this,"previewCanvas");h(this,"previewCtx");h(this,"emptyLabel");h(this,"visibilityCheckbox");h(this,"blendSelect");h(this,"opacitySlider");h(this,"sketchControlsContainer");h(this,"effectsContainer");h(this,"controlSliders",new Map);h(this,"effectSliders",new Map);h(this,"isDragOver",!1);h(this,"canvasSize",{width:320,height:180});this.layer=e.layer,this.renderLoop=e.renderLoop,this.onDropCallback=e.onDrop}createElement(){const e=document.createElement("div");e.className="layer-panel",e.innerHTML=`
      <div class="layer-preview">
        <canvas class="layer-preview-canvas"></canvas>
        <span class="layer-preview-empty">Drop sketch here</span>
      </div>
      <div class="layer-controls">
        <div class="layer-controls-row">
          <label class="layer-visibility">
            <input type="checkbox" checked>
          </label>
          <div class="blend-select">
            <select></select>
          </div>
          <div class="opacity-slider-container"></div>
        </div>
      </div>
      <div class="sketch-controls"></div>
      <div class="effects-section">
        <div class="effects-header">
          <span class="effects-title">Effects</span>
          <button class="add-effect-btn" title="Add Effect">+</button>
        </div>
        <div class="effects-list"></div>
      </div>
    `,this.previewCanvas=e.querySelector(".layer-preview-canvas"),this.previewCtx=this.previewCanvas.getContext("2d"),this.emptyLabel=e.querySelector(".layer-preview-empty"),this.previewCanvas.width=this.canvasSize.width,this.previewCanvas.height=this.canvasSize.height,this.visibilityCheckbox=e.querySelector('input[type="checkbox"]'),this.blendSelect=e.querySelector("select"),this.sketchControlsContainer=e.querySelector(".sketch-controls"),this.effectsContainer=e.querySelector(".effects-list");for(const i of jg){const s=document.createElement("option");s.value=i,s.textContent=i.charAt(0).toUpperCase()+i.slice(1),this.blendSelect.appendChild(s)}this.visibilityCheckbox.checked=this.layer.visible,this.blendSelect.value=this.layer.blendMode;const n=e.querySelector(".opacity-slider-container");return this.opacitySlider=new mr({label:"Opacity",value:this.layer.opacity,min:0,max:1,step:.01,decimals:2,onChange:i=>{this.layer.opacity=i}}),this.opacitySlider.mount(n),this.previewCanvas.style.aspectRatio=`${this.layer.width} / ${this.layer.height}`,e}onMount(){this.listen(this.visibilityCheckbox,"change",()=>{this.layer.visible=this.visibilityCheckbox.checked}),this.listen(this.blendSelect,"change",()=>{this.layer.blendMode=this.blendSelect.value});const e=this.element.querySelector(".add-effect-btn");this.listen(e,"click",s=>{this.showAddEffectMenu(s)});const n=this.element.querySelector(".layer-preview");this.listen(n,"dragover",this.handleDragOver.bind(this)),this.listen(n,"dragleave",this.handleDragLeave.bind(this)),this.listen(n,"drop",this.handleDrop.bind(this)),this.subscribe(this.layer,"property:change",s=>{const o=s;this.handlePropertyChange(o.property,o.value)}),this.subscribe(this.layer,"sketch:load",()=>{this.rebuildSketchControls(),this.updateEmptyState()}),this.subscribe(this.layer,"sketch:unload",()=>{this.clearSketchControls(),this.updateEmptyState()}),this.subscribe(this.layer,"effect:add",()=>{this.rebuildEffectsUI()}),this.subscribe(this.layer,"effect:remove",()=>{this.rebuildEffectsUI()}),this.subscribe(this.layer,"effects:reorder",()=>{this.rebuildEffectsUI()}),this.subscribe(Ie,"binding:add",s=>{const{binding:o}=s;o.layerId===this.layer.id&&(o.effectId?this.updateEffectControlBinding(o.effectId,o.controlName):this.updateControlBinding(o.controlName))}),this.subscribe(Ie,"binding:remove",s=>{const{layerId:o,controlName:a,effectId:l}=s;o===this.layer.id&&(l?this.updateEffectControlBinding(l,a):this.updateControlBinding(a))});const i=this.renderLoop.registerUIUpdate(()=>{this.updatePreview(),this.updateBoundControls()});this.onCleanup(i),this.setupCanvasResizeObserver(),this.layer.sketch&&this.rebuildSketchControls(),this.updateEmptyState(),this.rebuildEffectsUI()}setupCanvasResizeObserver(){const e=window.devicePixelRatio||1,n=this.previewCanvas.parentElement,i=new ResizeObserver(s=>{for(const o of s){const{width:a,height:l}=o.contentRect;if(a<=0||l<=0||a>4096||l>4096)return;this.canvasSize={width:Math.floor(a*e),height:Math.floor(l*e)},this.previewCanvas.width=this.canvasSize.width,this.previewCanvas.height=this.canvasSize.height}});i.observe(n),this.onCleanup(()=>i.disconnect())}updatePreview(){const e=this.previewCtx;e.imageSmoothingEnabled=!0,e.imageSmoothingQuality="high",this.layer.sketch&&this.layer.canvas?(e.clearRect(0,0,this.previewCanvas.width,this.previewCanvas.height),e.drawImage(this.layer.canvas,0,0,this.layer.canvas.width,this.layer.canvas.height,0,0,this.previewCanvas.width,this.previewCanvas.height)):(e.fillStyle="#1a1a1a",e.fillRect(0,0,this.previewCanvas.width,this.previewCanvas.height))}updateBoundControls(){if(this.layer.sketch){for(const e of this.layer.sketch.controls)if((e.type==="float"||e.type==="integer")&&Ie.getBinding(this.layer.id,e.name)){const i=Ie.getMappedValue(this.layer.id,e.name,e.min,e.max);if(i!==void 0){const s=this.controlSliders.get(e.name);s&&s.setValue(i)}}}for(const e of this.layer.effects){const n=this.effectSliders.get(e.id);if(n){for(const i of e.controls)if((i.type==="float"||i.type==="integer")&&Ie.getBinding(this.layer.id,i.name,e.id)){const o=Ie.getMappedValue(this.layer.id,i.name,i.min,i.max,e.id);if(o!==void 0){const a=n.get(i.name);a&&a.setValue(o)}}}}}handlePropertyChange(e,n){switch(e){case"opacity":this.opacitySlider.setValue(n);break;case"blendMode":this.blendSelect.value=n;break;case"visible":this.visibilityCheckbox.checked=n;break}}handleDragOver(e){e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="copy");const n=this.element.querySelector(".layer-preview");this.isDragOver||(this.isDragOver=!0,n.classList.add("drag-over"))}handleDragLeave(){this.isDragOver=!1,this.element.querySelector(".layer-preview").classList.remove("drag-over")}handleDrop(e){var s;e.preventDefault(),this.isDragOver=!1,this.element.querySelector(".layer-preview").classList.remove("drag-over");const i=(s=e.dataTransfer)==null?void 0:s.getData("application/x-sketch-id");i&&this.onDropCallback&&this.onDropCallback(i)}updateEmptyState(){this.emptyLabel.style.display=this.layer.sketch?"none":"block"}rebuildSketchControls(){if(this.clearSketchControls(),!this.layer.sketch)return;const e=this.layer.sketch,n=document.createElement("div");n.className="sketch-controls-header",n.innerHTML=`
      <span class="sketch-controls-toggle">▼</span>
      <span class="sketch-controls-name">${e.name}</span>
    `,this.sketchControlsContainer.appendChild(n);const i=document.createElement("div");i.className="sketch-controls-body",this.sketchControlsContainer.appendChild(i),n.addEventListener("click",()=>{const s=this.sketchControlsContainer.classList.toggle("collapsed"),o=n.querySelector(".sketch-controls-toggle");o.textContent=s?"▶":"▼"});for(const s of e.controls)this.createControl(s,i)}createControl(e,n){var o,a;const i=Ie.getBinding(this.layer.id,e.name),s=i?Ie.getSignal(i.signalId):null;switch(e.type){case"float":case"integer":{const l=new mr({label:e.label,value:((o=this.layer.sketch)==null?void 0:o.getControl(e.name))??e.defaultValue,min:e.min,max:e.max,step:e.type==="integer"?1:e.step??.01,decimals:e.type==="integer"?0:2,onChange:c=>{var u;(u=this.layer.sketch)==null||u.setControl(e.name,c),it.saveState()},onContextMenu:c=>{this.showControlContextMenu(c,{layerId:this.layer.id,controlName:e.name,min:e.min,max:e.max})}});l.setBound(!!s,s==null?void 0:s.name),l.mount(n),this.controlSliders.set(e.name,l);break}case"color":{const l=document.createElement("div");l.className="sketch-control color-control",l.innerHTML=`
          <label>${e.label}</label>
          <input type="color" value="${((a=this.layer.sketch)==null?void 0:a.getControl(e.name))??e.defaultValue}">
        `;const c=l.querySelector("input");c.addEventListener("change",()=>{var u;(u=this.layer.sketch)==null||u.setControl(e.name,c.value),it.saveState()}),n.appendChild(l);break}case"trigger":{const l=document.createElement("button");l.className="trigger-button",l.textContent=e.label,l.addEventListener("mousedown",()=>{var c;(c=this.layer.sketch)==null||c.setControl(e.name,!0)}),n.appendChild(l);break}}}showControlContextMenu(e,n){Kg({target:n,position:{x:e.clientX,y:e.clientY},onClose:()=>{}})}updateControlBinding(e){const n=this.controlSliders.get(e);if(!n)return;const i=Ie.getBinding(this.layer.id,e),s=i?Ie.getSignal(i.signalId):null;n.setBound(!!s,s==null?void 0:s.name)}clearSketchControls(){for(const e of this.controlSliders.values())e.dispose();this.controlSliders.clear(),this.sketchControlsContainer.innerHTML=""}showAddEffectMenu(e){const n=Al.map(c=>({label:c.name,action:async()=>{const u=c.create();await this.layer.addEffect(u)}})),i=document.createElement("div");i.className="effect-menu",i.style.cssText=`
      position: fixed;
      background: #2a2a2a;
      border: 1px solid #444;
      z-index: 10000;
      min-width: 150px;
      max-height: 300px;
      overflow-y: auto;
    `;for(const c of n){const u=document.createElement("div");u.className="effect-menu-item",u.textContent=c.label,u.style.cssText=`
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        color: #ccc;
      `,u.addEventListener("mouseenter",()=>{u.style.background="#3a3a3a"}),u.addEventListener("mouseleave",()=>{u.style.background="transparent"}),u.addEventListener("click",()=>{c.action(),i.remove()}),i.appendChild(u)}document.body.appendChild(i);const s=i.getBoundingClientRect();let o=e.clientX,a=e.clientY;o+s.width>window.innerWidth&&(o=window.innerWidth-s.width-8),a+s.height>window.innerHeight&&(a=window.innerHeight-s.height-8),o=Math.max(8,o),a=Math.max(8,a),i.style.left=`${o}px`,i.style.top=`${a}px`;const l=c=>{i.contains(c.target)||(i.remove(),document.removeEventListener("click",l))};setTimeout(()=>document.addEventListener("click",l),0)}rebuildEffectsUI(){this.clearEffectsUI(),this.layer.effects.forEach((e,n)=>{this.createEffectUI(e,n)})}createEffectUI(e,n){const i=document.createElement("div");i.className="effect-item",i.dataset.effectId=e.id,i.dataset.effectIndex=String(n),i.draggable=!0;const s=document.createElement("div");s.className="effect-header",s.innerHTML=`
      <span class="effect-drag-handle" title="Drag to reorder">⋮⋮</span>
      <span class="effect-toggle">▼</span>
      <span class="effect-name">${e.name}</span>
      <label class="effect-enable" title="Enable/Disable">
        <input type="checkbox" ${e.enabled?"checked":""}>
      </label>
      <button class="effect-remove" title="Remove Effect">×</button>
    `,i.appendChild(s),i.addEventListener("dragstart",f=>{i.classList.add("dragging"),f.dataTransfer.effectAllowed="move",f.dataTransfer.setData("text/plain",String(n))}),i.addEventListener("dragend",()=>{i.classList.remove("dragging"),this.effectsContainer.querySelectorAll(".drag-over-above, .drag-over-below").forEach(f=>{f.classList.remove("drag-over-above","drag-over-below")})}),i.addEventListener("dragover",f=>{f.preventDefault();const p=this.effectsContainer.querySelector(".dragging");if(!p||p===i)return;const g=i.getBoundingClientRect(),v=g.top+g.height/2;i.classList.remove("drag-over-above","drag-over-below"),f.clientY<v?i.classList.add("drag-over-above"):i.classList.add("drag-over-below")}),i.addEventListener("dragleave",()=>{i.classList.remove("drag-over-above","drag-over-below")}),i.addEventListener("drop",f=>{f.preventDefault(),i.classList.remove("drag-over-above","drag-over-below");const p=parseInt(f.dataTransfer.getData("text/plain"),10),g=parseInt(i.dataset.effectIndex,10);if(p===g)return;const v=i.getBoundingClientRect(),y=v.top+v.height/2;let m=g;f.clientY>=y&&p<g||f.clientY<y&&p>g||f.clientY>=y&&(m=g+1),p<m&&m--,this.layer.moveEffect(p,m)});const o=document.createElement("div");o.className="effect-controls-body",i.appendChild(o);const a=s.querySelector(".effect-toggle");s.addEventListener("click",f=>{if(f.target.closest(".effect-enable, .effect-remove"))return;const p=i.classList.toggle("collapsed");a.textContent=p?"▶":"▼"});const l=s.querySelector(".effect-enable input");l.addEventListener("change",()=>{e.enabled=l.checked,it.saveState()}),s.querySelector(".effect-remove").addEventListener("click",f=>{f.stopPropagation(),this.layer.removeEffect(e.id)});const u=new Map;this.effectSliders.set(e.id,u);for(const f of e.controls){const p=Ie.getBinding(this.layer.id,f.name,e.id),g=p?Ie.getSignal(p.signalId):null;switch(f.type){case"float":case"integer":{const v=new mr({label:f.label,value:e.getControl(f.name)??f.defaultValue,min:f.min,max:f.max,step:f.type==="integer"?1:f.step??.01,decimals:f.type==="integer"?0:2,onChange:y=>{e.setControl(f.name,y),it.saveState()},onContextMenu:y=>{this.showControlContextMenu(y,{layerId:this.layer.id,controlName:f.name,min:f.min,max:f.max,effectId:e.id})}});v.setBound(!!g,g==null?void 0:g.name),v.mount(o),u.set(f.name,v);break}case"color":{const v=document.createElement("div");v.className="sketch-control color-control",v.innerHTML=`
            <label>${f.label}</label>
            <input type="color" value="${e.getControl(f.name)??f.defaultValue}">
          `;const y=v.querySelector("input");y.addEventListener("change",()=>{e.setControl(f.name,y.value),it.saveState()}),o.appendChild(v);break}}}this.effectsContainer.appendChild(i)}updateEffectControlBinding(e,n){const i=this.effectSliders.get(e);if(!i)return;const s=i.get(n);if(!s)return;const o=Ie.getBinding(this.layer.id,n,e),a=o?Ie.getSignal(o.signalId):null;s.setBound(!!a,a==null?void 0:a.name)}clearEffectsUI(){for(const e of this.effectSliders.values())for(const n of e.values())n.dispose();this.effectSliders.clear(),this.effectsContainer.innerHTML=""}onDispose(){this.opacitySlider.dispose(),this.clearSketchControls(),this.clearEffectsUI()}}const gr=80,_r=45;let bi=null;function Jg(){return bi||(bi=document.createElement("canvas"),bi.width=gr,bi.height=_r),bi}function Wa(r){const t=r.getContext("webgl2")||r.getContext("webgl");if(t){const e=t.getExtension("WEBGL_lose_context");e&&e.loseContext()}}async function Qg(r){const t=document.createElement("canvas");t.width=gr,t.height=_r;try{const e=r.create();await e.init(t),e.render(.5,.016);const n=t.toDataURL("image/png");return e.dispose(),Wa(t),n}catch(e){console.error(`Failed to generate thumbnail for ${r.id}:`,e),Wa(t);const n=Jg(),i=n.getContext("2d");return i&&(i.fillStyle="#333",i.fillRect(0,0,gr,_r),i.fillStyle="#666",i.font="10px sans-serif",i.textAlign="center",i.fillText("Error",gr/2,_r/2+3)),n.toDataURL("image/png")}}async function e_(r){const t=new Map;for(const e of r){const n=await Qg(e);t.set(e.id,n),await new Promise(i=>setTimeout(i,10))}return t}class t_ extends sn{constructor(e){super();h(this,"sketches");h(this,"onSelectSketch");h(this,"filter","all");h(this,"thumbnails",new Map);h(this,"loading",!0);h(this,"filterButtons");h(this,"listContainer");this.sketches=e.sketches,this.onSelectSketch=e.onSelectSketch}createElement(){const e=document.createElement("div");return e.className="library",e.innerHTML=`
      <div class="library-header">
        <span class="library-title">Library</span>
        <div class="library-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="video">Video</button>
          <button class="filter-btn" data-filter="shader">Shader</button>
          <button class="filter-btn" data-filter="sketch">Sketch</button>
        </div>
      </div>
      <div class="library-list">
        <div class="library-loading">Loading thumbnails...</div>
      </div>
    `,this.filterButtons=e.querySelectorAll(".filter-btn"),this.listContainer=e.querySelector(".library-list"),e}onMount(){for(const e of this.filterButtons)this.listen(e,"click",()=>{this.setFilter(e.dataset.filter)});this.loadThumbnails()}async loadThumbnails(){this.loading=!0,this.renderList();try{this.thumbnails=await e_(this.sketches)}catch(e){console.error("Failed to generate thumbnails:",e)}this.loading=!1,this.renderList()}setFilter(e){this.filter=e;for(const n of this.filterButtons)n.classList.toggle("active",n.dataset.filter===e);this.renderList()}renderList(){if(this.listContainer.innerHTML="",this.loading){this.listContainer.innerHTML='<div class="library-loading">Loading thumbnails...</div>';return}const e=this.sketches.filter(n=>this.filter==="all"||n.type===this.filter);if(e.length===0){this.listContainer.innerHTML='<div class="library-empty">No sketches available</div>';return}for(const n of e){const i=this.createLibraryItem(n);this.listContainer.appendChild(i)}}createLibraryItem(e){const n=document.createElement("div");n.className="library-item",n.draggable=!0;const i=this.thumbnails.get(e.id);return n.innerHTML=`
      <div class="library-item-thumbnail">
        ${i?`<img src="${i}" alt="${e.name}">`:'<div class="library-item-placeholder"></div>'}
      </div>
    `,n.addEventListener("dragstart",s=>{if(s.dataTransfer.setData("application/x-sketch-id",e.id),s.dataTransfer.effectAllowed="copy",i){const o=new Image;o.src=i,s.dataTransfer.setDragImage(o,40,22)}}),n.addEventListener("click",()=>{this.onSelectSketch(e)}),n}setSketches(e){this.sketches=e,this.loadThumbnails()}}const Xa=5,qa=[{type:"lfo",icon:"~",label:"LFO"},{type:"microphone",icon:"🎤",label:"Microphone"},{type:"beat",icon:"♪",label:"Beat Detector"},{type:"midi",icon:"⎆",label:"MIDI"},{type:"gamepad",icon:"⎈",label:"Gamepad"}];class n_ extends sn{constructor(e){super();h(this,"onAddSignal");h(this,"onAddLayer");h(this,"menuOpen",!1);h(this,"menuElement",null);this.onAddSignal=e.onAddSignal,this.onAddLayer=e.onAddLayer}createElement(){const e=document.createElement("div");e.className="add-menu-container";const n=document.createElement("button");return n.className="add-menu-button",n.innerHTML="+",n.title="Add signal or layer",e.appendChild(n),this.menuElement=document.createElement("div"),this.menuElement.className="add-menu-dropdown",this.menuElement.innerHTML=this.renderMenuContent(),e.appendChild(this.menuElement),e}renderMenuContent(){return`
      <div class="add-menu-section">
        <div class="add-menu-section-title">Signals</div>
        ${qa.map(n=>`
      <button class="add-menu-item" data-signal-type="${n.type}">
        <span class="add-menu-item-icon">${n.icon}</span>
        <span class="add-menu-item-label">${n.label}</span>
      </button>
    `).join("")}
      </div>
      <div class="add-menu-divider"></div>
      <div class="add-menu-section">
        <button class="add-menu-item" data-action="add-layer">
          <span class="add-menu-item-icon">▢</span>
          <span class="add-menu-item-label">New Layer</span>
        </button>
      </div>
    `}onMount(){const e=this.element.querySelector(".add-menu-button");this.listen(e,"click",n=>{n.stopPropagation(),this.toggleMenu()}),this.setupSignalDrag(),this.setupLayerDrag(),this.listen(document,"click",n=>{this.menuOpen&&!this.element.contains(n.target)&&this.closeMenu()}),this.listen(document,"keydown",n=>{this.menuOpen&&n.key==="Escape"&&this.closeMenu()})}setupSignalDrag(){this.menuElement.querySelectorAll("[data-signal-type]").forEach(n=>{var v;const i=n,s=i.dataset.signalType,o=((v=qa.find(y=>y.type===s))==null?void 0:v.label)||s;let a=!1,l=0,c=0,u=!1;const f=y=>{a=!0,u=!1,l=y.clientX,c=y.clientY,y.preventDefault()},p=y=>{if(!a)return;const m=y.clientX-l,d=y.clientY-c,A=Math.sqrt(m*m+d*d);!u&&A>Xa&&(u=!0,this.closeMenu(),tt.startDrag({tabId:`new-${s}`,tabTitle:o,sourcePanelId:"",createSignalType:s},y.clientX,y.clientY))},g=()=>{a&&!u&&(this.onAddSignal(s),this.closeMenu()),a=!1};i.addEventListener("mousedown",f),window.addEventListener("mousemove",p),window.addEventListener("mouseup",g),this.onCleanup(()=>{i.removeEventListener("mousedown",f),window.removeEventListener("mousemove",p),window.removeEventListener("mouseup",g)})})}setupLayerDrag(){const e=this.menuElement.querySelector('[data-action="add-layer"]');if(!e)return;let n=!1,i=0,s=0,o=!1;const a=u=>{n=!0,o=!1,i=u.clientX,s=u.clientY,u.preventDefault()},l=u=>{if(!n)return;const f=u.clientX-i,p=u.clientY-s,g=Math.sqrt(f*f+p*p);!o&&g>Xa&&(o=!0,this.closeMenu(),tt.startDrag({tabId:"new-layer",tabTitle:"New Layer",sourcePanelId:"",createLayer:!0},u.clientX,u.clientY))},c=()=>{n&&!o&&(this.onAddLayer(),this.closeMenu()),n=!1};e.addEventListener("mousedown",a),window.addEventListener("mousemove",l),window.addEventListener("mouseup",c),this.onCleanup(()=>{e.removeEventListener("mousedown",a),window.removeEventListener("mousemove",l),window.removeEventListener("mouseup",c)})}toggleMenu(){this.menuOpen?this.closeMenu():this.openMenu()}openMenu(){this.menuOpen=!0,this.element.classList.add("open")}closeMenu(){this.menuOpen=!1,this.element.classList.remove("open")}}class i_ extends sn{constructor(e){super();h(this,"signalId");h(this,"renderLoop");h(this,"signal");h(this,"configSliders",[]);h(this,"valueFill");h(this,"bindingCountEl");h(this,"configContainer");this.signalId=e.signalId,this.renderLoop=e.renderLoop,this.signal=Ie.getSignal(this.signalId)}createElement(){const e=document.createElement("div");if(e.className="signal-pane",!this.signal)return e.innerHTML='<div class="signal-pane-error">Signal not found</div>',e;const n=Ie.getBindingsForSignal(this.signalId).length;return e.innerHTML=`
      <div class="signal-pane-header">
        <div class="signal-pane-value-bar">
          <div class="signal-pane-value-fill"></div>
        </div>
        <span class="signal-pane-binding-count" style="${n>0?"":"display:none"}">${n} bound</span>
      </div>
      <div class="signal-pane-config"></div>
    `,this.valueFill=e.querySelector(".signal-pane-value-fill"),this.bindingCountEl=e.querySelector(".signal-pane-binding-count"),this.configContainer=e.querySelector(".signal-pane-config"),e}onMount(){if(!this.signal)return;const e=this.renderLoop.registerUIUpdate(()=>{this.updateValueDisplay()});this.onCleanup(e),this.buildConfig()}updateValueDisplay(){if(!this.signal)return;const e=this.signal.getValue();this.valueFill.style.width=`${e*100}%`;const n=Ie.getBindingsForSignal(this.signalId).length;this.bindingCountEl.textContent=`${n} bound`,this.bindingCountEl.style.display=n>0?"":"none"}buildConfig(){if(this.signal)switch(this.clearConfig(),this.signal.type){case"lfo":this.buildLFOConfig();break;case"microphone":this.buildMicrophoneConfig();break;case"beat":this.buildBeatConfig();break;case"midi":this.buildMIDIConfig();break;case"gamepad":this.buildGamepadConfig();break}}onConfigChange(e){this.signal&&(this.signal.setConfig(e),it.saveState())}buildLFOConfig(){if(!this.signal)return;const e=this.signal.getConfig(),n=document.createElement("div");n.className="config-row",n.innerHTML=`
      <label>Waveform</label>
      <select>
        <option value="sine" ${e.waveform==="sine"?"selected":""}>Sine</option>
        <option value="sawtooth" ${e.waveform==="sawtooth"?"selected":""}>Sawtooth</option>
        <option value="square" ${e.waveform==="square"?"selected":""}>Square</option>
        <option value="triangle" ${e.waveform==="triangle"?"selected":""}>Triangle</option>
      </select>
    `;const i=n.querySelector("select");i.addEventListener("change",()=>{this.onConfigChange({waveform:i.value})}),this.configContainer.appendChild(n),this.addConfigSlider("Frequency",e.frequency,.01,10,.01,s=>{this.onConfigChange({frequency:s})}),this.addConfigSlider("Amplitude",e.amplitude,0,1,.01,s=>{this.onConfigChange({amplitude:s})}),this.addConfigSlider("Offset",e.offset,0,1,.01,s=>{this.onConfigChange({offset:s})})}buildMicrophoneConfig(){if(!this.signal)return;const e=this.signal.getConfig();this.addConfigSlider("Attack",e.attack,0,.99,.01,n=>{this.onConfigChange({attack:n})}),this.addConfigSlider("Release",e.release,0,.99,.01,n=>{this.onConfigChange({release:n})}),this.addConfigSlider("Gain",e.gain,.1,5,.1,n=>{this.onConfigChange({gain:n})},1),this.addConfigSlider("Noise Floor",e.noiseFloor,0,.2,.01,n=>{this.onConfigChange({noiseFloor:n})})}buildBeatConfig(){if(!this.signal)return;const e=this.signal.getConfig();this.addConfigSlider("Sensitivity",e.sensitivity,.1,2,.1,n=>{this.onConfigChange({sensitivity:n})},1),this.addConfigSlider("Decay",e.decay,.05,1,.01,n=>{this.onConfigChange({decay:n})}),this.addConfigSlider("Min Interval",e.minInterval,50,500,10,n=>{this.onConfigChange({minInterval:n})},0)}buildMIDIConfig(){if(!this.signal)return;const e=this.signal,n=this.signal.getConfig(),i=e.isListening(),s=e.isLearned();if(this.configContainer.innerHTML="",i){const l=document.createElement("div");l.className="midi-learn-container",l.innerHTML=`
        <div class="midi-learn-message">Move a knob, fader, or press a key...</div>
        <button class="midi-cancel-btn">Cancel</button>
      `,l.querySelector(".midi-cancel-btn").addEventListener("click",()=>{e.stopListening(),this.buildMIDIConfig()}),this.configContainer.appendChild(l);return}if(!s){const l=document.createElement("div");l.className="midi-learn-container",l.innerHTML=`
        <button class="midi-learn-btn">Learn MIDI</button>
        <div class="midi-learn-hint">Click to detect CC or Note</div>
      `,l.querySelector(".midi-learn-btn").addEventListener("click",()=>{e.startListening(()=>{it.saveState(),this.buildMIDIConfig()}),this.buildMIDIConfig()}),this.configContainer.appendChild(l);return}const o=document.createElement("div");if(o.className="midi-learned-info",o.innerHTML=`
      <span class="midi-learned-label">${n.mode==="cc"?"CC":"Note"} ${n.noteOrCC}</span>
      <span class="midi-learned-channel">Channel ${n.channel}</span>
    `,this.configContainer.appendChild(o),n.mode==="note"){const l=document.createElement("div");l.className="config-row checkbox",l.innerHTML=`
        <label>
          <input type="checkbox" ${n.velocityMode?"checked":""}>
          Use Velocity
        </label>
      `,l.querySelector("input").addEventListener("change",c=>{this.onConfigChange({velocityMode:c.target.checked})}),this.configContainer.appendChild(l)}const a=document.createElement("button");a.className="midi-relearn-btn",a.textContent="Re-learn",a.addEventListener("click",()=>{e.clearLearning(),e.startListening(()=>{it.saveState(),this.buildMIDIConfig()}),this.buildMIDIConfig()}),this.configContainer.appendChild(a)}buildGamepadConfig(){if(!this.signal)return;const e=this.signal,n=this.signal.getConfig(),i=e.isListening(),s=e.isLearned();if(this.configContainer.innerHTML="",i){const l=document.createElement("div");l.className="gamepad-learn-container",l.innerHTML=`
        <div class="gamepad-learn-message">Move an axis or press a button...</div>
        <button class="gamepad-cancel-btn">Cancel</button>
      `,l.querySelector(".gamepad-cancel-btn").addEventListener("click",()=>{e.stopListening(),this.buildGamepadConfig()}),this.configContainer.appendChild(l);return}if(!s){const l=document.createElement("div");l.className="gamepad-learn-container",l.innerHTML=`
        <button class="gamepad-learn-btn">Learn Gamepad</button>
        <div class="gamepad-learn-hint">Click then move an axis or press a button</div>
      `,l.querySelector(".gamepad-learn-btn").addEventListener("click",()=>{e.startListening(()=>{it.saveState(),this.buildGamepadConfig()}),this.buildGamepadConfig()}),this.configContainer.appendChild(l);return}const o=document.createElement("div");if(o.className="gamepad-learned-info",o.innerHTML=`
      <span class="gamepad-learned-label">${n.inputType==="axis"?"Axis":"Button"} ${n.inputIndex}</span>
      <span class="gamepad-learned-device">Gamepad ${n.gamepadIndex+1}</span>
    `,this.configContainer.appendChild(o),n.inputType==="axis"){this.addConfigSlider("Deadzone",n.deadzone,0,.5,.01,c=>{this.onConfigChange({deadzone:c})});const l=document.createElement("div");l.className="config-row checkbox",l.innerHTML=`
        <label>
          <input type="checkbox" ${n.invert?"checked":""}>
          Invert
        </label>
      `,l.querySelector("input").addEventListener("change",c=>{this.onConfigChange({invert:c.target.checked})}),this.configContainer.appendChild(l)}const a=document.createElement("button");a.className="gamepad-relearn-btn",a.textContent="Re-learn",a.addEventListener("click",()=>{e.clearLearning(),e.startListening(()=>{it.saveState(),this.buildGamepadConfig()}),this.buildGamepadConfig()}),this.configContainer.appendChild(a)}addConfigSlider(e,n,i,s,o,a,l=2){const c=new mr({label:e,value:n,min:i,max:s,step:o,decimals:l,onChange:a});c.mount(this.configContainer),this.configSliders.push(c)}clearConfig(){for(const e of this.configSliders)e.dispose();this.configSliders=[],this.configContainer.innerHTML=""}onDispose(){this.clearConfig()}}const or=1280,ar=720;class r_{constructor(t){h(this,"container");h(this,"compositor",null);h(this,"renderLoop",null);h(this,"windowManager",null);h(this,"addMenu",null);h(this,"layers");h(this,"cleanupFns",[]);this.container=t,this.layers=[]}async start(){this.container.innerHTML='<div class="app-loading">Loading...</div>',await it.initialize(),await this.initializeLayers(),it.registerLayers(this.layers),this.container.innerHTML="";const e=it.getTreeLayout()||Rl();this.windowManager=new Yg(this.container,e),this.windowManager.on("layout:change",n=>{it.saveTreeLayout(n)}),this.registerPanelContent(),this.windowManager.setValueProvider(n=>{const i=Ie.getSignal(n);return i?i.getValue():null}),this.setupSignalHandlers(),this.registerExistingSignals(),this.addMenu=new n_({onAddSignal:n=>this.createSignal(n),onAddLayer:()=>this.addLayer()}),this.addMenu.mount(document.body)}registerPanelContent(){if(this.windowManager){this.windowManager.registerContent("output",()=>new $g({onCanvasReady:t=>this.initCompositor(t),onCanvasResize:(t,e)=>{var n;(n=this.compositor)==null||n.resize(t,e)}}));for(const t of this.layers){const e=t.id;this.windowManager.registerContent(e,()=>new ys({layer:t,renderLoop:this.renderLoop,onDrop:n=>this.loadSketchToLayer(e,n)}))}this.windowManager.registerContent("library",()=>new t_({sketches:vs,onSelectSketch:t=>{this.loadSketchToLayer("layer-1",t.id)}}))}}async initializeLayers(){const t=it.getSavedLayers();if(t.length===0){this.layers=[new Fi("layer-1",or,ar)];return}for(const e of t){const n=new Fi(e.id,or,ar);if(n.opacity=e.opacity,n.blendMode=e.blendMode,n.visible=e.visible,e.sketchId){const i=vs.find(s=>s.id===e.sketchId);if(i){const s=i.create();await n.loadSketch(s);for(const[o,a]of Object.entries(e.sketchControls))s.setControl(o,a)}}for(const i of e.effects){const s=Al.find(o=>o.id===i.factoryId);if(s){const o=s.create();o.id=i.instanceId,await n.addEffect(o),o.enabled=i.enabled;for(const[a,l]of Object.entries(i.controls))o.setControl(a,l)}}this.layers.push(n)}}setupSignalHandlers(){const t=Ie.on("signal:remove",i=>{var o;const{signalId:s}=i;(o=this.windowManager)==null||o.removePanel(s)});this.cleanupFns.push(t);const e=this.windowManager.on("layout:change",i=>{const s=Ie.getAllSignals();for(const o of s)Ht(i,o.id)||Ie.removeSignal(o.id)});this.cleanupFns.push(e);const n=tt.on("drop",({data:i,targetPanelId:s,zone:o})=>{i.createSignalType?this.handleSignalDrop(i.createSignalType,s,o):i.createLayer&&this.handleLayerDrop(s,o)});this.cleanupFns.push(n)}async handleSignalDrop(t,e,n){var i;try{const s=await Ie.createSignal(t);this.registerSignalContent(s.id,s.name),(i=this.windowManager)==null||i.addPanelAtTarget({id:s.id,title:s.name},e,n),it.saveState()}catch(s){console.error(`Failed to create ${t} signal:`,s)}}handleLayerDrop(t,e){var a,l;const n=this.layers.map(c=>c.id);let i=this.layers.length+1;for(;n.includes(`layer-${i}`);)i++;const s=`layer-${i}`,o=new Fi(s,or,ar);this.layers.push(o),it.registerLayer(o),(a=this.windowManager)==null||a.registerContent(s,()=>new ys({layer:o,renderLoop:this.renderLoop,onDrop:c=>this.loadSketchToLayer(s,c)})),(l=this.windowManager)==null||l.addPanelAtTarget({id:s,title:`Layer ${i}`},t,e),it.saveState()}registerExistingSignals(){const t=Ie.getAllSignals();for(const e of t)this.registerSignalContent(e.id,e.name)}async createSignal(t){var e,n;try{const i=await Ie.createSignal(t);this.registerSignalContent(i.id,i.name);const s=(e=this.windowManager)==null?void 0:e.getLayout(),o=s?Ht(s,"library"):null,a=s?Ai(s):[],l=o||a[a.length-1];(n=this.windowManager)==null||n.addPanel({id:i.id,title:i.name},l==null?void 0:l.id,"right"),it.saveState()}catch(i){console.error(`Failed to create ${t} signal:`,i)}}addLayer(){var c,u,f;const t=this.layers.map(p=>p.id);let e=this.layers.length+1;for(;t.includes(`layer-${e}`);)e++;const n=`layer-${e}`,i=new Fi(n,or,ar);this.layers.push(i),it.registerLayer(i),(c=this.windowManager)==null||c.registerContent(n,()=>new ys({layer:i,renderLoop:this.renderLoop,onDrop:p=>this.loadSketchToLayer(n,p)}));const s=(u=this.windowManager)==null?void 0:u.getLayout(),o=s?Ht(s,"layer-1"):null,a=s?Ai(s):[],l=o||a[0];(f=this.windowManager)==null||f.addPanel({id:n,title:`Layer ${e}`},l==null?void 0:l.id,"bottom"),it.saveState()}registerSignalContent(t,e){var n;(n=this.windowManager)==null||n.registerContent(t,()=>new i_({signalId:t,renderLoop:this.renderLoop}))}initCompositor(t){this.renderLoop&&(this.renderLoop.stop(),this.renderLoop=null),this.compositor&&(this.compositor.dispose(),this.compositor=null),this.compositor=new Bl(t),this.renderLoop=new zl((e,n)=>{Ie.update(e,n);for(const i of this.layers){if(i.sketch){for(const s of i.sketch.controls)if(s.type==="float"||s.type==="integer"){const o=Ie.getMappedValue(i.id,s.name,s.min,s.max);o!==void 0&&i.sketch.setControl(s.name,o)}}for(const s of i.effects)for(const o of s.controls)if(o.type==="float"||o.type==="integer"){const a=Ie.getMappedValue(i.id,o.name,o.min,o.max,s.id);a!==void 0&&s.setControl(o.name,a)}}for(const i of this.layers)i.render(e,n);this.compositor.composite(this.layers)}),this.renderLoop.start()}async loadSketchToLayer(t,e){const n=this.layers.find(s=>s.id===t),i=vs.find(s=>s.id===e);if(n&&i){const s=i.create();await n.loadSketch(s)}}dispose(){it.flush();for(const t of this.cleanupFns)t();this.cleanupFns=[],this.renderLoop&&(this.renderLoop.stop(),this.renderLoop=null),this.compositor&&(this.compositor.dispose(),this.compositor=null),this.windowManager&&(this.windowManager.dispose(),this.windowManager=null),this.addMenu&&(this.addMenu.dispose(),this.addMenu=null);for(const t of this.layers)t.dispose();Ie.dispose()}}window.location.search.includes("reset")&&(it.clear(),window.location.href=window.location.pathname);const So=document.getElementById("root");if(!So)throw new Error("Root element not found");const Ll=new r_(So);Ll.start().catch(r=>{console.error("Failed to start app:",r),So.innerHTML=`<div class="app-error">Failed to start: ${r.message}</div>`});window.addEventListener("beforeunload",()=>{Ll.dispose()});
