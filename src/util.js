export const el = str => document.getElementById(str)

export const save = (bytes, filename, type="application/octet-stream") => {
  let blob = new Blob([bytes], {type})
  let element = document.createElement('a')
  element.href = window.URL.createObjectURL(blob)
  element.download = filename
  element.click()
}