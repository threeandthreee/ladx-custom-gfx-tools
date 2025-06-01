import { Image } from 'image-js'


const spriteWidth = 8
const spriteHeight = 16
const pixelMap = [ // reversed for...reasons
  0xff800080, // 0 -> purple
  0xff808080, // 1 -> grey
  0xff000000, // 2 -> black
  0xffffffff  // 3 -> white
]

export const pngToGb = async (buffer) => {
  let image = await Image.load(buffer)
  let cols = image.width / spriteWidth
  let rows = image.height / spriteHeight
  if(cols != Math.floor(cols) || rows != Math.floor(rows))
    throw new Error("Invalid image size for 8x16 sprites")
  let result = []
  let dv = new DataView(image.data.buffer, image.data.byteOffset)
  for (let row=0; row<rows; row++){
    for (let col=0; col<cols; col++){
      for (let y=0; y<spriteHeight; y++){
        let hi = 0
        let lo = 0
        for (let x=0; x<spriteWidth; x++){
          let start = 4 * ((col*spriteWidth+x) + image.width*(row*spriteHeight+y))
          let color = dv.getUint32(start, true)
          let val = pixelMap.indexOf(color)
          if(val < 0)
            val = 0
          if(val & 2)
            hi |= 0x80 >> x
          if(val & 1)
            lo |= 0x80 >> x
        }
        result.push(hi, lo)
      }
    }
  }
  return new Uint8Array(result)
}

export const gbToPng = async (arr) => {
  let width = 256
  let cols = width / spriteWidth
  let rows = arr.length / 2 / spriteHeight / cols
  let height = rows * spriteHeight
  if(rows != Math.floor(rows))
    throw new Error("Invalid buffer size for 8x16 sprites")
  let result = []
  for (let y=0; y<height; y++) {
    for (let col=0; col<cols; col++) {
      let row = Math.floor(y / spriteHeight)
      let index = 2 * (spriteHeight * (row * (cols-1) + col) + y)
      let hi = arr[index]
      let lo = arr[index+1]
      for (let x=spriteWidth-1; x>=0; x--) {
        let mask = 1 << x
        let val = 2 * ((hi & mask) >> x) + ((lo & mask) >> x)
        let color = pixelMap[val]
        result.push(color)
      }
    }
  }
  let data = new Uint8Array(new Uint32Array(result).buffer)
  let image = new Image(width, height, data, { kind: 'RGBA' })
  return new Uint8Array(await image.toBuffer('image/png'))
}

export const remapPalette = (buffer, remap) => {
  const result = new Uint8Array(buffer.byteLength);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < view.length; i += 16) {
    for (let row = 0; row < 8; row++) {
      const lo = view[i + row * 2];
      const hi = view[i + row * 2 + 1];
      let newLo = 0, newHi = 0;

      for (let bit = 0; bit < 8; bit++) {
        const lBit = (lo >> (7 - bit)) & 1;
        const hBit = (hi >> (7 - bit)) & 1;
        const val = (hBit << 1) | lBit;

        const newVal = remap[val];
        newLo |= (newVal & 1) << (7 - bit);
        newHi |= ((newVal >> 1) & 1) << (7 - bit);
      }

      result[i + row * 2] = newLo;
      result[i + row * 2 + 1] = newHi;
    }
  }

  return result;
}
