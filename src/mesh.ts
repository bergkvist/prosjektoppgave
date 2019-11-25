import { allDataPromise, PipeSegment, PipeGeometry, GeometryDef, Path, Point } from './parsers'
import { LENGTH_SCALING, RADIUS_SCALING, RADIUS_SEGMENTS, LENGTH_SEGMENTS } from './config'
import { createMaterial } from './material'
import { createLabel } from './labels'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import * as THREE from 'three'
import { scaleLinear } from 'd3'
import * as R from 'ramda'

function createPipeMesh (pipeSegment: PipeSegment): THREE.Mesh {
  const { position, rotation, length, radius } = pipeSegment
  const geometry = new THREE.CylinderGeometry(radius, radius, length, RADIUS_SEGMENTS, LENGTH_SEGMENTS)
  const mesh = new THREE.Mesh(geometry, new THREE.Material())
  mesh.position.set(position.x, position.y, position.z)
  mesh.rotation.set(rotation.x, rotation.y, rotation.z)
  return mesh
}
  
function createPipeGeometry (path: Path, geometrydef: GeometryDef): PipeGeometry {
  const points = pathToPoints(path)
  const data = path.map(pathSegment => {
    for (const geometrySegment of geometrydef) {
      if (pathSegment.md <= geometrySegment.md) return geometrySegment
    }
    return { name: '', radius: 0 }
  })
  return points.map((position, i) => ({
    position,
    rotation: { x: 0, y: path[i].azi, z: path[i].inc },
    radius: data[i].radius * RADIUS_SCALING,
    length: path[i].length * LENGTH_SCALING,
    md: path[i].md,
    tvd: path[i].tvd,
    pipeType: data[i].name,
  })).filter(_ => _.radius > 0)
}

function pathToPoints (pipes: Path): Array<Point> {
  const vectors = pipes.map(pipe => new THREE.Vector3(0, -pipe.length / 2 * LENGTH_SCALING, 0)
    .applyEuler(new THREE.Euler(0, pipe.azi, pipe.inc)))

  return vectors.reduce((positions, _, i) => {
    if (i === 0) {
      positions[i] = vectors[i]
      return positions
    }

    positions[i] = positions[i].add(positions[i-1]).add(vectors[i-1]).add(vectors[i])
    return positions

  }, vectors.map(() => new THREE.Vector3(0, 0, 0)))
}

function interpolatedMeasureDepths (path: Path, pipePressure: any) {
  const normalizedRange = length => R.range(0, length).map(scaleLinear().domain([0, length-1]).range([0, 1]))
  return path
    .map(_ => _.md)
    .map(scaleLinear()
      .domain(pipePressure.mds)
      .range(normalizedRange(pipePressure.mds.length))
    )
}

export async function createMeshes () {
  const [ wellPath, geometryDef, pipePressure ] = await allDataPromise
  console.table(geometryDef)
  const mds = interpolatedMeasureDepths(wellPath, pipePressure)
  const pipeGeometry = createPipeGeometry(wellPath, geometryDef)
  const geometries = pipeGeometry
    .map(createPipeMesh)
    .map((mesh, meshIndex) => {
      const ITEM_SIZE = 1 // measure depth index
      const updateParents = true
      const updateChildren = false
      mesh.updateWorldMatrix(updateParents, updateChildren)
      //@ts-ignore
      const geometry = new THREE.BufferGeometry().fromGeometry(mesh.geometry)
      geometry.applyMatrix(mesh.matrixWorld)
      const mdIndices = new Float32Array(geometry.getAttribute('position').count * ITEM_SIZE)
      geometry.setAttribute('md', new THREE.Float32BufferAttribute(mdIndices.map(() => mds[meshIndex]), ITEM_SIZE))
      return geometry
    })

    // A "shoe" is the end of a specific type of pipe.
    // Examples: end of riser, end of cased section, end of liner, end of open hole
    const shoes = pipeGeometry.reduce((result, current, i, arr) => {
      if (i === 0) return result
      const previous = arr[i - 1]
      if (current.pipeType !== previous.pipeType || i === arr.length - 1) {
        const geometry = new THREE.RingGeometry(previous.radius * 3.5, previous.radius * 4.5, 32)
        const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'gray' })
        const mesh = new THREE.Mesh(geometry, material)

        mesh.position.x = previous.position.x
        mesh.position.y = previous.position.y - previous.length / 2
        mesh.position.z = previous.position.z

        mesh.rotation.setFromRotationMatrix(new THREE.Matrix4()
          .makeRotationFromEuler(new THREE.Euler(previous.rotation.x, previous.rotation.y, previous.rotation.z))
          .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
        )

        result.meshes.push(mesh)
        result.labels.push(createLabel(`end of ${previous.pipeType}`, mesh.position))
      }
      return result
    }, { meshes: [], labels: [] })

  const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries)
  const pipe = new THREE.Mesh(mergedGeometry, createMaterial('standard'))
  return { pipe, shoes }
}