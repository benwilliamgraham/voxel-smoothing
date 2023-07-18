"use strict";

// Setup canvas
const canvas = document.createElement("canvas");
canvas.width = 960;
canvas.height = 600;
document.body.appendChild(canvas);

// Shaders
class ShaderInfo {
  constructor(gl, program, attributes, uniforms) {
    this.program = program;
    this.attribLocations = {};
    this.uniformLocations = {};

    for (const attribute of attributes) {
      this.attribLocations[attribute] = gl.getAttribLocation(
        this.program,
        attribute
      );
      if (this.attribLocations[attribute] === -1) {
        throw new Error(`Attribute ${attribute} not found`);
      }
    }

    for (const uniform of uniforms) {
      this.uniformLocations[uniform] = gl.getUniformLocation(
        this.program,
        uniform
      );
      if (this.uniformLocations[uniform] === null) {
        throw new Error(`Uniform ${uniform} not found`);
      }
    }
  }

  static createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Error linking program" + gl.getProgramInfoLog(program));
    }
    return program;
  }

  static async compileShader(gl, type, filename) {
    const source = await fetch(filename).then((res) => res.text());
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(
        `Error compiling ${filename}: ` + gl.getShaderInfoLog(shader)
      );
    }
    return shader;
  }
}

// Buffers
class Buffer {
  static createBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }
}

// Main function
async function main() {
  // Setup WebGL
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("WebGL2 not supported");
  }

  // Compile shaders
  const vertexShader = await ShaderInfo.compileShader(
    gl,
    gl.VERTEX_SHADER,
    "src/shaders/vertex.glsl"
  );
  const fragmentShader = await ShaderInfo.compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    "src/shaders/fragment.glsl"
  );
  const program = ShaderInfo.createProgram(gl, vertexShader, fragmentShader);
  const shaderInfo = new ShaderInfo(
    gl,
    program,
    ["aPosition"],
    ["uCameraMatrix"]
  );

  // Create buffers
  const buffer = Buffer.createBuffer(
    gl,
    new Float32Array([1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0])
  );

  function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = (45 * Math.PI) / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix, cameraMatrix, [0.0, 0.0, -6.0]);
    mat4.rotate(cameraMatrix, cameraMatrix, 0.0, [0, 0, 1]);
    mat4.rotate(cameraMatrix, cameraMatrix, 0.0, [0, 1, 0]);
    mat4.multiply(cameraMatrix, projectionMatrix, cameraMatrix);

    gl.useProgram(shaderInfo.program);
    gl.uniformMatrix4fv(
      shaderInfo.uniformLocations.uCameraMatrix,
      false,
      cameraMatrix
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(shaderInfo.attribLocations.aPosition);
    gl.vertexAttribPointer(
      shaderInfo.attribLocations.aPosition,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  requestAnimationFrame(render);
}

main();
