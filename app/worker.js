import { env, pipeline, RawImage, Tensor } from '@huggingface/transformers'


class DepthAnythingSingleton {
    static depth_estimator;
    static model = 'onnx-community/depth-anything-v2-small'
    static device = null

    static async getInstance() {
      if (!this.depth_estimator) {
        for (let device of ["webgpu", "wasm"]) {
          try {
            this.depth_estimator = await pipeline('depth-estimation', this.model, { device: device })
            this.device  = device
            console.log("pipeline is ready, device", device)
            break
          }
          catch(e) {  }
        }
    }

    return this.depth_estimator;
  }
}

self.onmessage = async (e) => {
    const depth_estimator = await DepthAnythingSingleton.getInstance();

    console.log("worker received message", e)

    const { imageid, type, data } = e.data;
    if (type === 'ping') {
        self.postMessage({type: 'pong', data: DepthAnythingSingleton.device});
        
    } else if (type === 'depth') {
        const image = await RawImage.read(data);

        const { depth } = await depth_estimator( image );

        self.postMessage({type: 'depth_result', data: depth});

    } else {
        throw new Error(`Unknown message type: ${type}`);
    }
}
