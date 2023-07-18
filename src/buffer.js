"use strict";

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

export { BufferInfo };
