import * as THREE from 'three'
import pixels from 'image-pixels'

export async function createDataTexture(imageUrl = require('./data/inferno.png')) {
  const image = await pixels(imageUrl)
  const { width, height } = image
  const data = new Uint8Array(image.data)
  const texture: THREE.DataTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
  return texture
}