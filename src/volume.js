"use strict";

class Volume {
  constructor(dimensions) {
    this.dimensions = dimensions;
    this.data = new Uint32Array(dimensions[0] * dimensions[1] * dimensions[2]);
    this.data.fill(0);
  }

  static async load(filename) {
    const byteArray = new Uint8Array(
      await (await fetch(filename)).arrayBuffer()
    );

    function parseUint32(byteArray) {
      return new DataView(byteArray.buffer).getUint32(0, true);
    }

    function parseChunk(byteArray) {
      const id = new TextDecoder().decode(byteArray.slice(0, 4));
      const contentNumBytes = parseUint32(byteArray.slice(4, 8));
      const childrenNumBytes = parseUint32(byteArray.slice(8, 12));
      const content = byteArray.slice(12, contentNumBytes + 12);
      const children = {};
      let childBytesOffset = 0;
      while (childBytesOffset < childrenNumBytes) {
        const child = parseChunk(
          byteArray.slice(12 + contentNumBytes + childBytesOffset)
        );
        childBytesOffset += child.content.length + 12;
        children[child.id] = child;
      }
      return { id, content, children };
    }

    // Verify that the file is a valid vox file
    const magic = new TextDecoder().decode(byteArray.slice(0, 4));
    if (magic !== "VOX ") {
      throw new Error(`Invalid VOX file ${name}, expected VOX, found ${magic}`);
    }

    const mainChunk = parseChunk(byteArray.slice(8));
    if (mainChunk.id !== "MAIN") {
      throw new Error(`Invalid VOX file, expected MAIN, found ${mainChunk.id}`);
    }

    // Determine size
    const sizeChunk = mainChunk.children["SIZE"];
    if (!sizeChunk) {
      fatalError("Invalid VOX file, expected SIZE chunk");
    }
    const dimensions = [
      parseUint32(sizeChunk.content.slice(0, 4)),
      parseUint32(sizeChunk.content.slice(8, 12)),
      parseUint32(sizeChunk.content.slice(4, 8)),
    ];

    // Determine color palette
    const colorsChunk = mainChunk.children["RGBA"];
    if (!colorsChunk) {
      throw new Error(`Invalid VOX file, expected RGBA chunk`);
    }
    const palette = new Uint32Array(
      colorsChunk.content.buffer,
      colorsChunk.content.byteOffset,
      colorsChunk.content.byteLength / 4
    );

    // Create volume
    const volume = new Volume(dimensions);

    // Determine voxel data
    const xyziChunk = mainChunk.children["XYZI"];
    if (!xyziChunk) {
      throw new Error(`Invalid VOX file, expected XYZI chunk`);
    }
    const xyzi = xyziChunk.content;
    for (let i = 4; i < xyzi.length; i += 4) {
      const x = xyzi[i];
      const y = xyzi[i + 1];
      const z = xyzi[i + 2];
      const colorIndex = xyzi[i + 3];
      volume.set(x, z, y, palette[colorIndex - 1]);
      console.log(x, y, z, colorIndex, palette[colorIndex - 1].toString(16));
    }

    return volume;
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
    for (let i = 0; i < positionData.length; i += 3) {
      positionData[i] -= this.dimensions[0] / 2;
      positionData[i + 1] -= this.dimensions[1] / 2;
      positionData[i + 2] -= this.dimensions[2] / 2;
    }
    for (let i = 0; i < positionData.length; i++) {
      positionData[i] *= scale;
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
