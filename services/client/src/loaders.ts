import Axios from 'axios'
export type Position = { posx: number, posy: number, posz: number }
export type Rotation = { rotx: number, roty: number, rotz: number }
export type TimeSequence = { min: number, max: number, step: number }
export type CasingShoe = Position & Rotation & { label: string, radius: number }
export type PipeSegment = Position & Rotation & { radius: number, length: number, imageHeightPortion: number }
export type SimulationData = { pipeSegments: Array<PipeSegment>, casingShoes: Array<CasingShoe>, time: TimeSequence }


export async function loadSimulation (well: string, connection: string): Promise<SimulationData> {
  const response = await Axios.get(`/api/simulations/${well}/${connection}`)
  const data = response.data as SimulationData
  const LENGTH_SCALING = 1 / 100
  const RADIUS_SCALING = 1
  data.pipeSegments = data.pipeSegments.map(segment => ({ 
    ...segment, 
    posx: LENGTH_SCALING * segment.posx,
    posy: LENGTH_SCALING * segment.posy,
    posz: LENGTH_SCALING * segment.posz,
    length: LENGTH_SCALING * segment.length,
    radius: RADIUS_SCALING * segment.radius
  }))
  data.casingShoes = data.casingShoes.map(shoe => ({
    ...shoe,
    posx: LENGTH_SCALING * shoe.posx,
    posy: LENGTH_SCALING * shoe.posy,
    posz: LENGTH_SCALING * shoe.posz,
    radius: RADIUS_SCALING * shoe.radius
  }))
  return data
}

export function loadImageData (imageUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', function() {
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      const context = canvas.getContext('2d')
      context.drawImage(img, 0, 0, this.width, this.height)
      const imageData = context.getImageData(0, 0, this.width, this.height)
      resolve(imageData)
    })
    img.addEventListener('error', reject)
    img.src = imageUrl
  })
}
