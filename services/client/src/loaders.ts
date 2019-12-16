import Axios from 'axios'
import { serialize } from 'cookie'
export type Position = { posx: number, posy: number, posz: number }
export type Rotation = { rotx: number, roty: number, rotz: number }
export type TimeSequence = { min: number, max: number, step: number }
export type CasingShoe = Position & Rotation & { label: string, radius: number }
export type PathSegment = Position & Rotation & { radius: number, length: number, imageRow: number }
export type GeometryData = { pathSegments: Array<PathSegment>, casingShoes: Array<CasingShoe>, time: TimeSequence, centre: Position }
export type WellsAndConnections = { [well: string]: Array<string> }

export async function ensureAuthentication(): Promise<WellsAndConnections> {
  while (true) {
    try {
      const availableWellsAndConnections = await Axios.get('/api/simulations').then(response => response.data)
      // If the above succeeds, it means we are authenticated!
      return availableWellsAndConnections
    } catch {
      const apiKey = prompt('Enter API key')
      document.cookie = serialize('api_key', apiKey)
    }
  }
}

export async function loadWellGeometry (well: string, connection: string, radiusScaling: number): Promise<GeometryData> {
  const response = await Axios.get(`/api/simulations/${well}/${connection}?radius_scaling=${radiusScaling}`)
  return response.data as GeometryData
}

export function createImageUrl ({ well, connection, simulation, colormap, customThresholds, vmin, vmax }) {
  const imageUrl = `/api/simulations/${well}/${connection}/${simulation}.png?cmap=${colormap}` + (
    customThresholds 
      ? `&vmin=${vmin}&vmax=${vmax}` 
      : ''
  )
  return imageUrl
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
