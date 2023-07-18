"use strict";

class Volume {
  constructor(dimensions) {
    this.dimensions = dimensions;
    this.data = new Uint32Array(dimensions[0] * dimensions[1] * dimensions[2]);
  }

  get(x, y, z) {
    return this.data[
      z * this.dimensions[0] * this.dimensions[1] + y * this.dimensions[0] + x
    ];
  }

  set(x, y, z, rgba) {
    this.data[
      z * this.dimensions[0] * this.dimensions[1] + y * this.dimensions[0] + x
    ] = rgba;
  }

  scaleAndOffsetPositions(positionData) {
    const scale = 1 / Math.max(...this.dimensions);
    for (let i = 0; i < positionData.length; i++) {
      positionData[i] *= scale;
      positionData[i] -= 0.5;
    }
    return positionData;
  }

  generateMesh() {
    // TODO: Get faster algorithm
    const positionData = [];
    const colorData = [];
    for (let x = 0; x < this.dimensions[0]; x++) {
      for (let y = 0; y < this.dimensions[1]; y++) {
        for (let z = 0; z < this.dimensions[2]; z++) {
          const rgba = this.get(x, y, z);
          if (rgba === 0) {
            continue;
          }

          const normalAndPositions = [
            // x-
            {
              normal: [-1, 0, 0],
              positions: [
                [x, y, z],
                [x, y + 1, z],
                [x, y + 1, z + 1],
                [x, y, z + 1],
              ],
            },
            {
              // x+
              normal: [1, 0, 0],
              positions: [
                [x + 1, y, z],
                [x + 1, y + 1, z],
                [x + 1, y + 1, z + 1],
                [x + 1, y, z + 1],
              ],
            },
            {
              // y-
              normal: [0, -1, 0],
              positions: [
                [x, y, z],
                [x + 1, y, z],
                [x + 1, y, z + 1],
                [x, y, z + 1],
              ],
            },
            {
              // y+
              normal: [0, 1, 0],
              positions: [
                [x, y + 1, z],
                [x + 1, y + 1, z],
                [x + 1, y + 1, z + 1],
                [x, y + 1, z + 1],
              ],
            },
            {
              // z-
              normal: [0, 0, -1],
              positions: [
                [x, y, z],
                [x + 1, y, z],
                [x + 1, y + 1, z],
                [x, y + 1, z],
              ],
            },
            {
              // z+
              normal: [0, 0, 1],
              positions: [
                [x, y, z + 1],
                [x + 1, y, z + 1],
                [x + 1, y + 1, z + 1],
                [x, y + 1, z + 1],
              ],
            },
          ];
          for (const normalAndPosition of normalAndPositions) {
            const { normal, positions } = normalAndPosition;
            const dx = x + normal[0];
            const dy = y + normal[1];
            const dz = z + normal[2];

            if (
              dx < 0 ||
              dx >= this.dimensions[0] ||
              dy < 0 ||
              dy >= this.dimensions[1] ||
              dz < 0 ||
              dz >= this.dimensions[2] ||
              this.get(dx, dy, dz) === 0
            ) {
              positionData.push.apply(positionData, positions[0]);
              positionData.push.apply(positionData, positions[1]);
              positionData.push.apply(positionData, positions[2]);
              positionData.push.apply(positionData, positions[0]);
              positionData.push.apply(positionData, positions[2]);
              positionData.push.apply(positionData, positions[3]);

              for (let i = 0; i < 6; i++) {
                colorData.push(rgba);
              }
            }
          }
        }
      }
    }

    return {
      positionData: new Float32Array(
        this.scaleAndOffsetPositions(positionData)
      ),
      colorData: new Uint32Array(colorData),
    };
  }
}

export { Volume };
