"use strict";

// Setup canvas
const width = 960;
const height = 600;

const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
document.body.appendChild(canvas);

const gl = canvas.getContext("webgl2");
if (!gl) {
  throw new Error("WebGL2 not supported");
}

function render() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

requestAnimationFrame(render);
