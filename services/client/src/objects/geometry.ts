import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { PathSegment, Position, Rotation, CasingShoe } from '../loaders'
import * as THREE from 'three'

function getMatrixWorld (posRot: Position & Rotation, { updateParents = true, updateChildren = false } = {}) {
  const mesh = new THREE.Mesh()
  mesh.position.set(posRot.posx, posRot.posy, posRot.posz)
  mesh.rotation.set(posRot.rotx, posRot.roty, posRot.rotz)
  mesh.updateWorldMatrix(updateParents, updateChildren)
  return mesh.matrixWorld
}

export function createWellPathBufferGeometry(pathSegments: Array<PathSegment>): THREE.BufferGeometry {
  return BufferGeometryUtils.mergeBufferGeometries(
    pathSegments.map(pathSegment => {
      const bufferGeometry = new THREE.CylinderBufferGeometry(pathSegment.radius, pathSegment.radius, pathSegment.length, 20)
      const matrixWorld = getMatrixWorld(pathSegment)
      bufferGeometry.applyMatrix(matrixWorld)

      const bufferAttribs = new Float32Array(bufferGeometry.getAttribute('position').count)
      for (let i = 0; i < bufferAttribs.length; i++) bufferAttribs[i] = pathSegment.imageRow
      bufferGeometry.setAttribute('imageRow', new THREE.Float32BufferAttribute(bufferAttribs, 1))
      return bufferGeometry
    })
  )
}

export function createCasingShoeBufferGeometry(casingShoes: Array<CasingShoe>): THREE.BufferGeometry {
  return BufferGeometryUtils.mergeBufferGeometries(
    casingShoes.map(casingShoe => {
      const bufferGeometry = new THREE.RingBufferGeometry(casingShoe.radius * 3.5, casingShoe.radius * 4.5, 20)
      const matrixWorld = getMatrixWorld(casingShoe)
      bufferGeometry.applyMatrix(matrixWorld)
      return bufferGeometry
    })
  )
}