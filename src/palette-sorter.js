'use strict';

const crc = require('crc');

const fs = require('fs');
const zlib = require('zlib');

function paletteSorter(inputPath, outputPath, transparentColor) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputPath, (err, file) => {
      !err ? resolve(file) : reject(err);
    });
  }).then((file) => {
    return new Promise((resolve, reject) => {
      const palette = [];
      const idats = [];
      const outputData = {};

      let section = '';
      let offset = 8;
      let info;
      let transparentIndex;

      while (section != 'IEND') {
        const length = file.readUInt32BE(offset);
        offset += pngInfo.chunk.length;
        section = getSection(file.readUInt32BE(offset));
        offset += pngInfo.chunk.length;

        // console.log(section, length);
        if (section == 'IHDR') {
          const width = file.readUInt32BE(offset);
          const height = file.readUInt32BE(offset + 4);
          const bitDepth = file.readUInt8(offset + 8);
          if (bitDepth != 8) {
            reject(Error('未対応のファイルです(データのビット数が8ではない)'));
          }
          info = {width, height, bitDepth};
          // console.log(file.readUInt8(offset + 9));
        }
        if (section == 'PLTE') {
          const color = [];
          for (let i = 0; i < length; i++) {
            color.push(file.readUInt8(offset + i));
            if (color.length == 3) {
              palette.push([].concat(color));
              color.length = 0;
            }
          }
          // sort
          transparentIndex = sortPalette(palette, transparentColor);
          if (transparentIndex === false) {
            // ファイルをそのままコピーして終わる
            fs.writeFile(outputPath, file, (err) => {
              err ? reject(err) : resolve(true);
            });
          }
          info.transparentIndex = transparentIndex;
          // makeBuffer
          const newPlte = [];
          palette.forEach((color) => {
            newPlte.push(color[0]);
            newPlte.push(color[1]);
            newPlte.push(color[2]);
          });
          const plteBuf = Buffer.from(newPlte);
          const plteHeadBuf = file.slice(offset - 8, offset); // lengthは使いまわせる
          const crcBuf = Buffer.alloc(4);
          const plteCrc = crc.crc32(Buffer.concat([plteHeadBuf.slice(4, 8), plteBuf]));
          crcBuf.writeUInt32BE(plteCrc);

          outputData['PLTE'] = Buffer.concat([plteHeadBuf, plteBuf, crcBuf]);
        }
        if (section == 'IDAT') {
          for (let i = 0; i < length; i++) {
            idats.push(file.readUInt8(offset + i));
          }
        }
        offset += length + pngInfo.chunk.length;
        resolve({outputData, idats, info});
      }
    }).then((result) => {
      if (result === true) {
        return;
      }
      const {outputData, idats, info} = result;
      const {width, height, bitDepth, transparentIndex} = info;

      const data = Buffer.from(idats);
      if (!outputData) return;
      // 画像データ変換
      return new Promise((resolve, reject) => {
        zlib.inflate(data, (err, buffer) => {
          if (err) reject(err);
          resolve({outputData, buffer, info});
        });
      });
    }).then((result) => {
      const {outputData, buffer, info} = result;
      const {width, height, bitDepth, transparentIndex} = info;

      const scanLength = bitDepth / 8 * width + 1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < scanLength; x++) {
          if (x == 0) continue;  // 最初は読み飛ばす
          const target = y * scanLength + x;
          if (buffer[target] == 0) {
            buffer[target] = transparentIndex;
          } else if (buffer[target] == transparentIndex) {
            buffer[target] = 0;
          }
        }
      }

      return new Promise((resolve, reject) => {
        zlib.deflate(buffer, (err, sortedBuffer) => {
          if (err) reject(err);
          outputData['IDAT'] = buildChunk('IDAT', sortedBuffer);
          writePngFile(file, outputData, outputPath);
          resolve(true);
        });
      });
    });

  });
}

function buildChunk(type, buffer) {
  const headerBuf = Buffer.alloc(8);
  headerBuf.writeUInt32BE(buffer.length, 0);
  headerBuf.writeUInt32BE(typeInt32[type], 4);
  const crcBuf = Buffer.alloc(4);
  const chunkCrc = crc.crc32(Buffer.concat([headerBuf.slice(4, 8), buffer]));
  crcBuf.writeUInt32BE(chunkCrc);

  return Buffer.concat([headerBuf, buffer, crcBuf]);
}

function writePngFile(baseBuffer, outputData, outputPath) {
  const outputBuffer = Buffer.concat([baseBuffer.slice(0, 33), outputData.PLTE, outputData.IDAT, baseBuffer.slice(baseBuffer.length - 12, baseBuffer.length)]);
  // write file
  fs.writeFile(outputPath, outputBuffer, (err) => {
    if (err) throw err;
  });

}

function getSection(chunk) {
  const hex = chunk.toString(16);
  let str = '';
    for (let i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function sortPalette(palette, transparentColor) {
  // パレット変換
  const transparentIndex = palette.findIndex((color, idx) => {
    if (color[0] == transparentColor[0]
     && color[1] == transparentColor[1]
     && color[2] == transparentColor[2]) {
      return true;
    }
  });

  if (transparentIndex === -1) {
    return false;
  }

  const tmp = palette[0];
  palette[0] = palette[transparentIndex];
  palette[transparentIndex] = tmp;

  return transparentIndex;
}

const pngInfo = {
  signature: 8,
  chunk: {
    length: 4,
    name: 4,
    crc: 4
  },
  baseSize: 45
};

const typeInt32 = {
  'IDAT': 1229209940,
  'PLTE': 1347179589
}

module.exports = paletteSorter;
