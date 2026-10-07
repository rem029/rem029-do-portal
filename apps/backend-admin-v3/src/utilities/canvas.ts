/**
 * Trims whitespace (transparent pixels) from a canvas.
 * Returns a new canvas with the trimmed content.
 *
 * This is a stable replacement for react-signature-canvas's getTrimmedCanvas()
 * which has broken dependencies in some alpha versions.
 */
export function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const width = canvas.width
  const height = canvas.height
  const pixels = ctx.getImageData(0, 0, width, height)
  const l = pixels.data.length
  const bound = {
    top: null as number | null,
    left: null as number | null,
    right: null as number | null,
    bottom: null as number | null,
  }
  let x: number, y: number

  // Iterate over all pixels to find the dimensions of the content
  for (let i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      x = (i / 4) % width
      y = Math.floor(i / 4 / width)

      if (bound.top === null) {
        bound.top = y
      }

      if (bound.left === null) {
        bound.left = x
      } else if (x < bound.left) {
        bound.left = x
      }

      if (bound.right === null) {
        bound.right = x
      } else if (bound.right < x) {
        bound.right = x
      }

      if (bound.bottom === null) {
        bound.bottom = y
      } else if (bound.bottom < y) {
        bound.bottom = y
      }
    }
  }

  // If no content was found, return null
  if (bound.top === null || bound.left === null || bound.right === null || bound.bottom === null) {
    return null
  }

  const trimHeight = bound.bottom - bound.top + 1
  const trimWidth = bound.right - bound.left + 1
  const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight)

  const copy = document.createElement('canvas')
  copy.width = trimWidth
  copy.height = trimHeight
  const copyCtx = copy.getContext('2d')

  if (copyCtx) {
    copyCtx.putImageData(trimmed, 0, 0)
    return copy
  }

  return null
}
