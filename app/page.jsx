"use client"

import React, { useState, useEffect, useRef, createContext, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/next';

// transformer.js and img manipulations
import { RawImage } from '@huggingface/transformers';
import { cn, cloneCanvas} from "@/lib/utils"

// UI
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { LoaderCircle, Crop, ImageUp, Github, LoaderPinwheel, Fan } from 'lucide-react'


export default function Home() {
  // state
  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("Loading model")
  const [depthCutoff, setDepthCutoff] = useState(100)
  const [depthmap, setDepthmap] = useState(null)

  // web worker, image and mask
  const worker = useRef(null)
  const [imageURL, setImageURL] = useState("/image_square.png")
  const canvasEl = useRef(null)
  const canvasCopy = useRef(null)
  const fileInputEl = useRef(null)

  // Upload new image
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    const dataURL = window.URL.createObjectURL(file)

    setLoading(true)
    setImageURL(dataURL)
  }

  function onWorkerMessage(e) {
    const { type, data } = e.data;

    if (type === 'pong') {
      const device = data

      setStatus("Processing example image")
      setDevice(device)
      worker.current.postMessage({ type: 'depth', data: canvasEl.current.toDataURL() });    

    } else if (type === 'depth_result') {
      const depth = data
      const depthImage = new RawImage(depth.data, depth.width, depth.height, depth.channels)
      const meanValue =  Math.round(depthImage.data.reduce((partialSum, a) => partialSum + a, 0) / depthImage.data.length)

      setStatus("Choose depth:")
      setLoading(false)
      setDepthmap(depthImage)
      setDepthCutoff(meanValue)
    }
  }

  // Depth slider was moved
  useEffect(() => {
    if (depthmap) {
      const origCanvas = canvasCopy.current

      // Clone original image and mask pixels where depth < cutoff
      const canvas = cloneCanvas(origCanvas)
      const ctx = canvas.getContext('2d');
      const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < depthmap.data.length; ++i) {
        pixelData.data[4 * i + 3] = depthmap.data[i] > depthCutoff ? 255 : 0
      } 
      ctx.putImageData(pixelData, 0, 0);

      // Draw masked canvas onto main display canvas
      const outputCanvas = canvasEl.current
      outputCanvas.height = canvas.height
      outputCanvas.width = canvas.width
      const outputCtx = outputCanvas.getContext("2d");
      outputCtx.drawImage(canvas, 0, 0)

    }
  }, [depthCutoff]);

  // Load web worker 
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.current.addEventListener('message', onWorkerMessage)
      worker.current.postMessage({ type: 'ping' });   
    }
  }, [])

  // Load example or new image
  useEffect(() => {
    if (imageURL) {
      const img = new Image();
      img.src = imageURL
      img.onload = function() {
        const canvas = canvasEl.current
        canvas.width = img.naturalWidth, canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)

        canvasCopy.current = cloneCanvas(canvas)   // store orig. canvas 

        if (device) {
          worker.current.postMessage({ type: 'depth', data: canvas.toDataURL() });    
        }
      }
    }
  }, [imageURL]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://github.com/geronimi73/next-depth', '_blank')}
          >
            <Github className="w-4 h-4 mr-2" />
            View on GitHub
          </Button>
        </div>
        <CardHeader>
          <CardTitle>
            <p>Background Removal Demo with <a href="https://github.com/DepthAnything/Depth-Anything-V2">Depth Anything V2</a> and <a href="https://huggingface.co/docs/transformers.js/">🤗 transformers.js</a></p>
            <p className={cn("flex gap-1 items-center", device ? "visible" : "invisible")}>
              <Fan color="#000" className="w-6 h-6 animate-[spin_2.5s_linear_infinite] direction-reverse"/>
              Running on {device}
            </p>              
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4">
                <p className="flex items-center gap-2">
                  { loading && <LoaderCircle className="animate-spin w-6 h-6" /> }
                  {status}
                </p>
              <div className="flex items-center w-40">
                <Slider min={-1} max={255} step={1} value={[depthCutoff]} className={cn("", loading ? "invisible" : "visible")} onValueChange={(cutoff)=>{setDepthCutoff(cutoff[0])}} />
              </div>
              <Button onClick={()=>{fileInputEl.current.click()}} variant="secondary" disabled={loading}><ImageUp/> Change image</Button>
            </div>
            <div className="flex justify-center">
              <canvas ref={canvasEl} width={512} height={512} style={{maxHeight: "500px"}}/>
            </div>
          </div>
        </CardContent>
      </Card>
      <input ref={fileInputEl} hidden="True" accept="image/*" type='file' onInput={handleFileUpload} />
      <Analytics />
    </div>
  );
}
