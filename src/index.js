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
class BufferInfo {
  constructor(gl, positionData, colorData) {
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
  }

  bind(gl, shaderInfo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(shaderInfo.attribLocations.aPosition);
    gl.vertexAttribPointer(
      shaderInfo.attribLocations.aPosition,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.enableVertexAttribArray(shaderInfo.attribLocations.aColor);
    gl.vertexAttribPointer(
      shaderInfo.attribLocations.aColor,
      4,
      gl.FLOAT,
      false,
      0,
      0
    );
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
    ["aPosition", "aColor"],
    ["uCameraMatrix"]
  );

  // Create buffers
  const bufferInfo = new BufferInfo(
    gl,
    new Float32Array([
      1.0,
      1.0,
      0.0, // 0
      -1.0,
      1.0,
      0.0, // 1
      1.0,
      -1.0,
      0.0, // 2
    ]),
    new Float32Array([
      1.0,
      1.0,
      1.0,
      1.0, // white
      1.0,
      0.0,
      0.0,
      1.0, // red
      0.0,
      1.0,
      0.0,
      1.0, // green
    ])
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

    bufferInfo.bind(gl, shaderInfo);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  requestAnimationFrame(render);
}

main();
