import { loadBsdiff, loadBspatch } from 'bsdiff-wasm'


let bsdiffRaw, bspatchRaw

export const bsdiff = async (one, two) => {
  bsdiffRaw ||= await loadBsdiff()
  bsdiffRaw.FS.writeFile('one.bin', one)
  bsdiffRaw.FS.writeFile('two.bin', two)
  bsdiffRaw.callMain(['one.bin', 'two.bin', 'patch.bsdiff'])
  return bsdiffRaw.FS.readFile('patch.bsdiff')
}

export const bspatch = async (one, patch) => {
  bspatchRaw ||= await loadBspatch()
  bspatchRaw.FS.writeFile('one.bin', one)
  bspatchRaw.FS.writeFile('patch.bsdiff', patch)
  bspatchRaw.callMain(['one.bin', 'two.bin', 'patch.bsdiff'])
  return bspatchRaw.FS.readFile('two.bin')
}