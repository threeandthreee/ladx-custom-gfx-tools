import './style.css'
import { bsdiff, bspatch } from './bsdiff.js'
import { pngToGb, gbToPng, remapPalette } from './imgConv.js'
import { el, save } from './util.js'


const TEMPLATE_START = 0xb0000
const TEMPLATE_END = TEMPLATE_START + 0x28000

let rom = {}
let hack = {}
let sheet = {}

const readFile = async target => {
  let obj = {}
  let file = target.files[0]
  if (!file) return obj
  let temp = file.name.split('.')
  obj.type = temp.pop()
  obj.name = temp.join('.')
  obj.bytes = new Uint8Array(await file.arrayBuffer())
  return obj
}

const getTemplate = obj => obj.bytes.slice(TEMPLATE_START, TEMPLATE_END)

const getSheetBytes = () =>
  sheet.type == 'bdiff' ? bspatch(getTemplate(rom), sheet.bytes) : sheet.bytes

const patchRom = async (obj, randoTweaks=false) => {
  let patched = new Uint8Array(obj.bytes)
  patched.set(await getSheetBytes(), TEMPLATE_START)

  if (randoTweaks) {
    let rooster = patched.slice(TEMPLATE_START + 0x19D00, TEMPLATE_START + 0x19D00 +64)
    let remappedRooster = remapPalette(rooster, [0, 3, 2, 1])
    patched.set(remappedRooster, TEMPLATE_START + 0x900)
  }

  let headerChecksum = 0
  for (let i=0x0134; i<=0x014C; i++)
    headerChecksum = (headerChecksum - patched[i] - 1) & 0xFF
  patched[0x014D] = headerChecksum

  let globalChecksum = 0
  for (let i=0; i<patched.length; i++)
    if (i!==0x14E && i!== 0x14F)
      globalChecksum = (globalChecksum + patched[i]) & 0xFFFF
  patched[0x014E] = (globalChecksum >> 8) & 0xFF
  patched[0x014F] = globalChecksum & 0xFF

  return patched
}


const init = async () => {
  rom = await readFile(el('rom'))
  hack = await readFile(el('hack'))
  sheet = await readFile(el('sheet'))
  updateButtons()
}

const updateButtons = () => {
  let rl = el('rom').files.length
  let hl = el('hack').files.length
  let sl = el('sheet').files.length
  let st = sheet.type
  let buttonStatus = {
    "generateTemplate": rl,
    "patchRom": rl && sl,
    "patchHack": hl && sl && ( st != 'bdiff' || rl),
    "convertPng": sl && ( st == 'bin' || (rl && st == 'bdiff')),
    "convertBin": sl && ( st == 'png' || (rl && st == 'bdiff')),
    "convertBdiff": rl && sl && st != 'bdiff'
  }
  Object.entries(buttonStatus).forEach(([id, enabled]) => {
    if(enabled)
      el(id).removeAttribute('disabled')
    else
      el(id).setAttribute('disabled', '')
  })
}

el('rom').addEventListener('input', async event => {
  rom = await readFile(event.target)
  updateButtons()
})

el('hack').addEventListener('input', async event => {
  hack = await readFile(event.target)
  updateButtons()
})

el('sheet').addEventListener('input', async event => {
  sheet = await readFile(event.target)
  updateButtons()
  if (sheet.type == 'png')
    sheet.bytes = await pngToGb(sheet.bytes)
})

el('generateTemplate').addEventListener('click', async () => {
  console.log(rom)
  save(await gbToPng(getTemplate(rom)), 'ladx_gfx_template.png', 'image/png')
})

el('patchRom').addEventListener('click', async () => {
  save(await patchRom(rom), `${rom.name}.${sheet.name}.gbc`)
})

el('patchHack').addEventListener('click', async () => {
  save(await patchRom(hack, true), `${hack.name}.${sheet.name}.gbc`)
})

el('convertPng').addEventListener('click', async () => {
  save(await gbToPng(await getSheetBytes()), `${sheet.name}.png`, 'image/png')
})

el('convertBin').addEventListener('click', async () => {
  save(await getSheetBytes(), `${sheet.name}.bin`)
})

el('convertBdiff').addEventListener('click', async () => {
  save(await bsdiff(getTemplate(rom), sheet.bytes), `${sheet.name}.bdiff`)
})

init()
