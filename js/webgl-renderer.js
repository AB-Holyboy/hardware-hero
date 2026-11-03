export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    const gl = this.gl;
    if (!gl) throw new Error('WebGL context not found');

    // Enable blending for PNG transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.program = this.createShaderProgram();
    this.attribs = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      texCoord: gl.getAttribLocation(this.program, 'a_texCoord')
    };
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      transform: gl.getUniformLocation(this.program, 'u_transform'),
      texture: gl.getUniformLocation(this.program, 'u_texture'),
      color: gl.getUniformLocation(this.program, 'u_color')
    };

    const vertices = new Float32Array([
      -0.5, -0.5,  0.0, 1.0,
       0.5, -0.5,  1.0, 1.0,
       0.5,  0.5,  1.0, 0.0,
      -0.5, -0.5,  0.0, 1.0,
       0.5,  0.5,  1.0, 0.0,
      -0.5,  0.5,  0.0, 0.0
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.whiteTexture = this.createSolidTexture(1, 1, [255, 255, 255, 255]);
    this.textureCache = new Map(); // Prevents GPU memory leaks
  }

  createShaderProgram() {
    const gl = this.gl;
    // Added u_color uniform for tinting
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform vec2 u_resolution;
      uniform mat3 u_transform;
      varying vec2 v_texCoord;
      void main() {
        vec3 pos = u_transform * vec3(a_position, 1.0);
        vec2 zeroToOne = pos.xy / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec4 u_color;
      varying vec2 v_texCoord;
      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord) * u_color;
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(vs));

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(fs));

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    return prog;
  }

  loadTexture(src) {
    if (this.textureCache.has(src)) return this.textureCache.get(src);

    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

    // Set params NOW so placeholder is valid
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };
    img.onerror = () => console.warn('Missing sprite:', src);
    img.src = src;

    this.textureCache.set(src, texture);
    return texture;
  }

  createSolidTexture(w, h, color) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(color));
    return tex;
  }

  // Added color parameter (r, g, b, a)
  drawSprite(texture, x, y, w, h, rotation = 0, color = [1, 1, 1, 1]) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform4fv(this.uniforms.color, color);

    const c = Math.cos(rotation);
    const s = Math.sin(rotation);

    // Corrected rotation matrix (removed inverted sign)
    const m = [
      w * c,  w * s,  0,
      -h * s, h * c,  0,
      x,      y,      1
    ];

    gl.uniformMatrix3fv(this.uniforms.transform, false, m);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(this.attribs.position);
    gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.attribs.texCoord);
    gl.vertexAttribPointer(this.attribs.texCoord, 2, gl.FLOAT, false, 16, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture || this.whiteTexture);
    gl.uniform1i(this.uniforms.texture, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  clear() {
    // Clear to transparent so CSS background gradient shows through
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
}