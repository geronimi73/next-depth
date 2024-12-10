import { v4 as uuidv4 } from 'uuid'

import { RawImage } from '@huggingface/transformers';

export default class DepthAnything {
  worker = null

  initWorkerPromise = null
  initWorkerPromiseResolve = null
  depthJobPromise = null
  depthJobPromiseResolve = null

  constructor() {
    this.onWorkerMessage = this.onWorkerMessage.bind(this)
  }

  async initWorker() {
    if (!this.worker) {
      this.worker = new Worker(new URL("/public/webworkers/depth.js", import.meta.url));
      this.worker.postMessage({ type: 'ping' });    
      this.worker.addEventListener('message', this.onWorkerMessage)

      this.initWorkerPromise = new Promise((resolve, reject) => {
        this.initWorkerPromiseResolve = resolve;
      });
    }
    await this.initWorkerPromise
  }

  async startDepth(canvas) {
    await this.initWorker()
    await this.waitUntilReady()

    const dataURL = canvas.toDataURL()

    this.depthJobPromise = new Promise((resolve, reject) => {
      this.depthJobPromiseResolve = resolve;
    });
    this.worker.postMessage({ type: 'depth', data: dataURL });    

    return this.depthJobPromise
  }

  onWorkerMessage(e) {
    const { type, data } = e.data;

    if (type === 'pong') {
      this.initWorkerPromiseResolve()

    } else if (type === 'depth_result') {
      // depth data -> RawImage 
      const depth = data
      const depthImage = new RawImage(depth.data, depth.width, depth.height, depth.channels)

      this.depthJobPromiseResolve(depthImage)
    }
  }

  async waitUntilReady() {
    if (this.initWorkerPromise) {
      await this.initWorkerPromise
    }
    if (this.depthJobPromise) {
      await this.depthJobPromise
    }
  }

}
