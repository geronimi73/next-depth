

export function maskImageCanvas(imageCanvas, maskCanvas) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext("2d");
  canvas.height = imageCanvas.height
  canvas.width = imageCanvas.width

  context.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, 0, 0, canvas.width, canvas.height)
  context.globalCompositeOperation = "source-in";
  context.drawImage(imageCanvas, 0, 0, imageCanvas.width, imageCanvas.height, 0, 0, canvas.width, canvas.height)

  return canvas
}

export function resizeCanvas(canvasOrig, size) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')
  canvas.height = size.h
  canvas.width = size.w

  ctx.drawImage(canvasOrig, 0, 0, canvasOrig.width, canvasOrig.height, 0, 0, canvas.width, canvas.height)

  return canvas
}

// input: 2x Canvas, output: One new Canvas, resize source 
export function mergeMasks(sourceMask, targetMask) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')
  canvas.height = targetMask.height
  canvas.width = targetMask.width

  ctx.drawImage(targetMask, 0, 0)
  ctx.drawImage(sourceMask, 0, 0, sourceMask.width, sourceMask.height, 0, 0, targetMask.width, targetMask.height)

  return canvas
}

// input: source and target {w, h}, output: {x,y,w,h} to fit source nicely into target preserving aspect
export function resizeAndPadBox(sourceDim, targetDim) {
  if (sourceDim.h == sourceDim.w) {
    return { x: 0, y: 0, w: targetDim.w, h: targetDim.h }

  } else if (sourceDim.h > sourceDim.w) {
    // portrait => resize and pad left
    const newW = sourceDim.w / sourceDim.h * targetDim.w
    const padLeft = Math.floor((targetDim.w - newW) / 2)

    return { x: padLeft, y: 0, w: newW, h: targetDim.h }

  } else if (sourceDim.h < sourceDim.w) {
    // landscape => resize and pad top
    const newH = sourceDim.h / sourceDim.w * targetDim.h
    const padTop = Math.floor((targetDim.h - newH) / 2)

    return { x: 0, y: padTop, w: targetDim.w, h: newH }
  } 
}

// input: onnx Tensor [B=1, Masks, W, H], output: Canvas [W, H, 4]
export function sliceTensorMask(maskTensor, maskIdx) {
  const [bs, noMasks, width, height] = maskTensor.dims
  const stride = width * height
  const start = stride * maskIdx, end = start + stride
  const maskData = maskTensor.cpuData.slice(start, end);
  const C = 4 // 4 output channels, RGBA
  const imageData = new Uint8ClampedArray(stride * C)

  for (let srcIdx = 0; srcIdx < maskData.length; srcIdx++) {
    const trgIdx = srcIdx * C
    const maskedPx = maskData[srcIdx] > 0
    imageData[trgIdx] = maskedPx > 0 ? 255 : 0
    imageData[trgIdx + 1] = 0
    imageData[trgIdx + 2] = 0
    // imageData[trgIdx + 3] = maskedPx > 0 ? 150 : 0 // alpha
    imageData[trgIdx + 3] = maskedPx > 0 ? 255 : 0 // alpha
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')
  canvas.height = height
  canvas.width = width
  ctx.putImageData(new ImageData(imageData, width, height), 0, 0);

  return canvas
}

// inspired by: https://onnxruntime.ai/docs/tutorials/web/classify-images-nextjs-github-template.html
export function canvasToFloat32Array(canvas) {
  const imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
  const shape = [1, 3, canvas.width, canvas.height]

  const [redArray, greenArray, blueArray] = [ [], [], [] ]

  for (let i = 0; i < imageData.length; i += 4) {
    redArray.push(imageData[i]);
    greenArray.push(imageData[i + 1]);
    blueArray.push(imageData[i + 2]);
    // skip data[i + 3] to filter out the alpha channel
  }

  const transposedData = redArray.concat(greenArray).concat(blueArray);

  let i, l = transposedData.length; 
  const float32Array = new Float32Array(shape[1] * shape[2] * shape[3]);
  for (i = 0; i < l; i++) {
    float32Array[i] = transposedData[i] / 255.0; // convert to float
  }

  return {float32Array, shape}
}



