import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function cloneCanvas(canvas) {
  const cloneCanvas = document.createElement('canvas');
  const cloneCtx = cloneCanvas.getContext('2d');
  cloneCanvas.height = canvas.height
  cloneCanvas.width = canvas.width

  cloneCtx.drawImage(canvas, 0, 0)

  return cloneCanvas
}