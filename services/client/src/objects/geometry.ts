import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { PipeSegment } from '../loaders'
import * as THREE from 'three'

function getMatrixWorld (pipeSegment: PipeSegment, { updateParents = true, updateChildren = false } = {}) {
  const mesh = new THREE.Mesh()
  mesh.position.set(pipeSegment.posx, pipeSegment.posy, pipeSegment.posz)
  mesh.rotation.set(pipeSegment.rotx, pipeSegment.roty, pipeSegment.rotz)
  mesh.updateWorldMatrix(updateParents, updateChildren)
  return mesh.matrixWorld
}

export function createPipeBufferGeometry(pipeSegments: Array<PipeSegment>): THREE.BufferGeometry {
  return BufferGeometryUtils.mergeBufferGeometries(
    pipeSegments.map(pipeSegment => {
      const bufferGeometry = new THREE.CylinderBufferGeometry(pipeSegment.radius, pipeSegment.radius, pipeSegment.length)
      const matrixWorld = getMatrixWorld(pipeSegment)
      bufferGeometry.applyMatrix(matrixWorld)
      
      const bufferAttribs = new Float32Array(bufferGeometry.getAttribute('position').count)
      for (let i = 0; i < bufferAttribs.length; i++) bufferAttribs[i] = pipeSegment.imageHeightPortion
      bufferGeometry.setAttribute('md', new THREE.Float32BufferAttribute(bufferAttribs, 1))
      return bufferGeometry
    })
  )
}