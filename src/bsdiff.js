import { loadBsdiff, loadBspatch } from 'bsdiff-wasm'


const bsdiffRaw = await loadBsdiff({locateFile: file => `/${file}`})
const bspatchRaw = await loadBspatch({locateFile: file => `/${file}`})

export const bsdiff = async (one, two) => {
  bsdiffRaw.FS.writeFile('one.bin', one)
  bsdiffRaw.FS.writeFile('two.bin', two)
  bsdiffRaw.callMain(['one.bin', 'two.bin', 'patch.bsdiff'])
  return bsdiffRaw.FS.readFile('patch.bsdiff')
}

export const bspatch = async (one, patch) => {
  bspatchRaw.FS.writeFile('one.bin', one)
  bspatchRaw.FS.writeFile('patch.bsdiff', patch)
  bspatchRaw.callMain(['one.bin', 'two.bin', 'patch.bsdiff'])
  return bspatchRaw.FS.readFile('two.bin')
}