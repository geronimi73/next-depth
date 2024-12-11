# Background removal with Depth Anything V2
This is a Next.js application that performs depth estimation using [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2). All the processing is done on the client side.

Visit [depth2.vercel.app](https://depth2.vercel.app/) for a Demo

https://github.com/user-attachments/assets/834e7f6c-fc74-46ee-89e7-b4ade751d545

# Features
* Depth estimation using [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2)
* Uses the amazing [transformers.js](https://huggingface.co/docs/transformers.js/) for model inference
* webgpu accelerated if GPU available and supported by browser, cpu if not
* Model storage using [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) ([not working](https://bugs.webkit.org/show_bug.cgi?id=231706) in Safari)
* Tested on macOS with Edge (webgpu, cpu), Chrome (webgpu, cpu), Firefox (cpu only), Safari (cpu only) 

# Installation
Clone the repository:

```
git clone https://github.com/geronimi73/next-depth
cd next-depth
npm install
npm run dev
```

Open your browser and visit http://localhost:3000 

# Usage
1. Upload an image or use the default image
2. Use slider to select depth cutoff
3. Download outupt image 
4. Star this repo and [transformer.js](https://github.com/huggingface/transformers.js)

# Acknowledgements
* [Depth Anything V2](https://github.com/DepthAnything/Depth-Anything-V2)
* [transformer.js](https://github.com/huggingface/transformers.js)
* [Shadcn/ui components](https://ui.shadcn.com/)
