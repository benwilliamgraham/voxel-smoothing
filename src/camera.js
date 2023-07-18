"use strict";

class Camera {
  constructor(aspect) {
    this.position = vec3.create();
    this.rotation = vec3.create();

    const fieldOfView = (45 * Math.PI) / 180;
    const zNear = 0.1;
    const zFar = 100.0;
    this.projectionMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, fieldOfView, aspect, zNear, zFar);
  }

  getCameraMatrix() {
    const cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix, cameraMatrix, this.position);
    mat4.rotate(cameraMatrix, cameraMatrix, this.rotation[0], [1, 0, 0]);
    mat4.rotate(cameraMatrix, cameraMatrix, this.rotation[1], [0, 1, 0]);
    mat4.rotate(cameraMatrix, cameraMatrix, this.rotation[2], [0, 0, 1]);
    mat4.multiply(cameraMatrix, this.projectionMatrix, cameraMatrix);
    return cameraMatrix;
  }
}

export { Camera };
