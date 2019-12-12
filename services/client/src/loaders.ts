import Axios from 'axios'
import { serialize } from 'cookie'
export type Position = { posx: number, posy: number, posz: number }
export type Rotation = { rotx: number, roty: number, rotz: number }
export type TimeSequence = { min: number, max: number, step: number }
export type CasingShoe = Position & Rotation & { label: string, radius: number }
export type PathSegment = Position & Rotation & { radius: number, length: number, mdTextureMap: number }
export type SimulationData = { pathSegments: Array<PathSegment>, casingShoes: Array<CasingShoe>, time: TimeSequence }

export async function ensureAuthentication() {
  while (true) {
    try {
      const data = await Axios.get('/api/simulations').then(response => response.data)
      // If the above succeeds, it means we are authenticated!
      return data
    } catch {
      const apiKey = prompt('Enter API key')
      document.cookie = serialize('api_key', apiKey)
    }
  }
}

export async function loadSimulation (well: string, connection: string): Promise<SimulationData> {
  const response = await Axios.get(`/api/simulations/${well}/${connection}`)
  return response.data as SimulationData
}

export function loadImageData (imageUrl: string, { maxSize = 4096 } = {}): Promise<ImageData & { objectURL: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', function() {
      const canvas = document.createElement('canvas')
      // 4096 is the maximum texture size for iPhone/iPad
      const width = Math.min(maxSize, this.width)
      const height = Math.min(maxSize, this.height)
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      context.drawImage(img, 0, 0, width, height)
      const imageData = context.getImageData(0, 0, width, height)
      try {
        canvas.toBlob(blob => {
          const objectURL = (window.URL || window.webkitURL).createObjectURL(blob)
          resolve({ objectURL, width, height, data: imageData.data })
        })
      } catch { // IE/Edge doesn't support canvas.toBlob()
        resolve({ objectURL: imageUrl, width, height, data: imageData.data })
      }
    })
    img.addEventListener('error', reject)
    img.src = imageUrl
  })
}
