import { PathSegment, CasingShoe } from '../loaders'
import { createBufferAnimationMaterial } from './material'
import { createWellPathBufferGeometry } from './geometry'
import * as THREE from 'three'

export function createWellPathMesh(pathSegments: Array<PathSegment>, imageData: ImageData) {
  const geometry = createWellPathBufferGeometry(pathSegments)
  const material = createBufferAnimationMaterial('standard', imageData)
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