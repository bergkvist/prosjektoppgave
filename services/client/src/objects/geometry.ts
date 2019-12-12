import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { PathSegment } from '../loaders'
import * as THREE from 'three'

function getMatrixWorld (pathSegment: PathSegment, { updateParents = true, updateChildren = false } = {}) {
  const mesh = new THREE.Mesh()
  mesh.position.set(pathSegment.posx, pathSegment.posy, pathSegment.posz)
  mesh.rotation.set(pathSegment.rotx, pathSegment.roty, pathSegment.rotz)
  mesh.updateWorldMatrix(updateParents, updateChildren)
  return mesh.matrixWorld
}

export function createWellPathBufferGeometry(pathSegments: Array<PathSegment>): THREE.BufferGeometry {
  return BufferGeometryUtils.mergeBufferGeometries(
    pathSegments.map(pathSegment => {
      const bufferGeometry = new THREE.CylinderBufferGeometry(pathSegment.radius, pathSegment.radius, pathSegment.length)
      const matrixWorld = getMatrixWorld(pathSegment)
      bufferGeometry.applyMatrix(matrixWorld)
      
      const bufferAttribs = new Float32Array(bufferGeometry.getAttribute('position').count)
      for (let i = 0; i < bufferAttribs.length; i++) bufferAttribs[i] = pathSegment.mdTextureMap
      bufferGeometry.setAttribute('md', new THREE.Float32BufferAttribute(bufferAttribs, 1))
      return bufferGeometry
    })
  )
}