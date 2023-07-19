"use strict";

import { BufferInfo } from "./buffer.js";
import { Camera } from "./camera.js";
import { ShaderInfo } from "./shader.js";
import { Volume } from "./volume.js";

// Setup canvas
const canvas = document.createElement("canvas");
canvas.width = 960;
canvas.height = 600;
document.body.appendChild(canvas);

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

  // Load default volume
  const volume = await Volume.load("assets/teapot.vox");

  const { positionData, colorData } = volume.generateMesh();

  // Create buffers
  const bufferInfo = new BufferInfo(gl, positionData, colorData);

  // Create camera
  const camera = new Camera(gl.canvas.clientWidth / gl.canvas.clientHeight);
  camera.position = [0.0, 0.0, -3.0];

  // Render
  function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderInfo.program);
    gl.uniformMatrix4fv(
      shaderInfo.uniformLocations.uCameraMatrix,
      false,
      camera.getCameraMatrix()
    );

    bufferInfo.bind(gl, shaderInfo);

    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numVertices);
  }

  requestAnimationFrame(render);

  // Handle mouse events
  let lastX = 0;
  let lastY = 0;
  let dragging = false;

  canvas.addEventListener("mousedown", (e) => {
    lastX = e.offsetX;
    lastY = e.offsetY;
    dragging = true;
  });

  canvas.addEventListener("mouseup", () => {
    dragging = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!dragging) {
      return;
    }

    const xDelta = e.offsetX - lastX;
    const yDelta = e.offsetY - lastY;

    camera.rotation[0] += yDelta * 0.01;
    camera.rotation[1] += xDelta * 0.01;

    lastX = e.offsetX;
    lastY = e.offsetY;

    requestAnimationFrame(render);
  });

  // Handle scroll events
  canvas.addEventListener("wheel", (e) => {
    camera.position[2] -= e.deltaY * 0.01;
    camera.position[2] = Math.min(camera.position[2], -0.001);
    requestAnimationFrame(render);
  });
}

main();
