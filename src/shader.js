"use strict";

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

export { ShaderInfo };
