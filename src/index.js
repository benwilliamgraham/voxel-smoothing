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

// Model list
const modelNames = [
  "castle",
  "chr_knight",
  "chr_sword",
  "doom",
  "menger",
  "monu1",
  "monu9",
  "monu10",
  "nature",
  "room",
  "shelf",
  "teapot",
  "3x3x3",
  "8x8x8",
];

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
    ["aPosition", "aColor", "aNormal"],
    ["uCameraMatrix"]
  );

  // Create buffers
  let bufferInfo;

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

  // Add model selection
  let volume;

  function uploadVolume() {
    const { positionData, colorData, normalData } = volume.generateMesh(
      smoothingPasses,
      smoothingStrength
    );
    bufferInfo = new BufferInfo(gl, positionData, colorData, normalData);
    requestAnimationFrame(render);
  }

  async function loadModel(modelName) {
    volume = await Volume.load(`assets/${modelName}.vox`);
    uploadVolume();
  }

  const modelSelect = document.createElement("select");
  modelSelect.addEventListener("change", async (e) => {
    const modelName = e.target.value;
    await loadModel(modelName);
  });

  for (const modelName of modelNames) {
    const option = document.createElement("option");
    option.value = modelName;
    option.innerText = modelName;
    modelSelect.appendChild(option);

    if (modelName === modelNames[0]) {
      option.selected = true;
    }
  }

  const modelSelectDiv = document.createElement("div");
  modelSelectDiv.appendChild(document.createTextNode("Model: "));
  modelSelectDiv.appendChild(modelSelect);
  document.body.appendChild(modelSelectDiv);

  // Add smoothing slider
  let smoothingPasses = 0;

  const smoothingSlider = document.createElement("input");
  smoothingSlider.type = "range";
  smoothingSlider.min = 0;
  smoothingSlider.max = 10;
  smoothingSlider.value = smoothingPasses;

  const smoothingSliderValue = document.createElement("span");
  smoothingSliderValue.innerText = smoothingPasses;

  smoothingSlider.addEventListener("input", (e) => {
    smoothingPasses = parseInt(e.target.value);
    smoothingSliderValue.innerText = smoothingPasses;
    uploadVolume();
  });

  const smoothingSliderDiv = document.createElement("div");
  smoothingSliderDiv.appendChild(document.createTextNode("Smoothing passes: "));
  smoothingSliderDiv.appendChild(smoothingSlider);
  smoothingSliderDiv.appendChild(smoothingSliderValue);
  document.body.appendChild(smoothingSliderDiv);

  // Add smoothing strength slider
  let smoothingStrength = 0.5;

  const smoothingStrengthSlider = document.createElement("input");
  smoothingStrengthSlider.type = "range";
  smoothingStrengthSlider.min = 0;
  smoothingStrengthSlider.max = 1;
  smoothingStrengthSlider.step = 0.01;
  smoothingStrengthSlider.value = smoothingStrength;

  const smoothingStrengthSliderValue = document.createElement("span");
  smoothingStrengthSliderValue.innerText = smoothingStrength;

  smoothingStrengthSlider.addEventListener("input", (e) => {
    smoothingStrength = parseFloat(e.target.value);
    smoothingStrengthSliderValue.innerText = smoothingStrength;
    uploadVolume();
  });

  const smoothingStrengthSliderDiv = document.createElement("div");
  smoothingStrengthSliderDiv.appendChild(
    document.createTextNode("Smoothing strength: ")
  );
  smoothingStrengthSliderDiv.appendChild(smoothingStrengthSlider);
  smoothingStrengthSliderDiv.appendChild(smoothingStrengthSliderValue);
  document.body.appendChild(smoothingStrengthSliderDiv);

  // Load initial model
  loadModel(modelNames[0]);
}

main();
