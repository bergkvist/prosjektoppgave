import { PipeSegment, CasingShoe } from '../loaders'
import { createBufferAnimationMaterial } from './material'
import { createPipeBufferGeometry } from './geometry'
import * as THREE from 'three'

export function createPipeMesh(pipeSegments: Array<PipeSegment>, imageData: ImageData) {
  const geometry = createPipeBufferGeometry(pipeSegments)
  const material = createBufferAnimationMaterial('basic', imageData)
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

export function createShoeMesh(casingShoe: CasingShoe) {
  const geometry = new THREE.RingGeometry(casingShoe.radius * 3.5, casingShoe.radius * 4.5, 32)
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'gray' })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(casingShoe.posx, casingShoe.posy, casingShoe.posz)
  mesh.rotation.set(casingShoe.rotx, casingShoe.roty, casingShoe.rotz)
  return mesh
}