import * as THREE from 'three'
import { dsv, csv } from 'd3'
import * as R from 'ramda'
import { LENGTH_SCALING, RADIUS_SCALING } from './config'
import { GeometryDef } from './geometrydef'

export interface Point { x: number, y: number, z: number }
export interface BoundingBox { min: Point, max: Point }
interface RawSegment { 'Md': string, 'Inc': string, 'Azi': string }
export interface PathSegment { md: number, inc: number, azi: number, tvd: number, length: number }
export type Path = Array<PathSegment>
export type PipeSegment = { position: Point, rotation: Point, length: number, radius: number, md: number, tvd: number, pipeType: string }
export type PipeGeometry = Array<PipeSegment>

export async function loadPipePressure() {
  const x = await csv(require('./data/pipepressure.csv'))
  console.log('loaded pipe pressure...')
  return x
}

export async function loadPath(): Promise<Path> {
  const path = await dsv(';', require('./data/well_path.csv')) as Array<RawSegment>
  return R.tail(path.map(segment => ({
    md: Number(segment['Md']),
    tvd: Number(segment['Tvd']),
    inc: Number(segment['Inc']) * Math.PI / 180,
    azi: Number(segment['Azi']) * Math.PI / 180,
  })).map((segment, i, arr) => ((i === 0) ? null : {
    length: arr[i].md - arr[i-1].md,
    ...segment
  })))
}

export function getBoundingBox (points: Array<Point>): BoundingBox {
  const bbox: BoundingBox = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } }
  for (const p of points) {
    for (const c of ['x', 'y', 'z']) {
      if (p[c] > bbox.max[c]) bbox.max[c] = p[c]
      else if (p[c] < bbox.min[c]) bbox.min[c] = p[c]
    }
  }
  return bbox
}

export function createTerrainMeshes (bbox: BoundingBox, color: string): Array<THREE.Mesh> {
  const dx = (bbox.max.x - bbox.min.x)
  const dy = (bbox.max.y - bbox.min.y)
  const dz = (bbox.max.z - bbox.min.z)
  const x =  (bbox.max.x + bbox.min.x) / 2
  const y =  (bbox.max.y + bbox.min.y) / 2
  const z =  (bbox.max.z + bbox.min.z) / 2
  
  const geometry = new THREE.BoxGeometry(dx, dy, dz)
  return [THREE.FrontSide, THREE.BackSide].map(side => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      opacity: 0.2,
      transparent: true,
      side
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    return mesh
  })
}

export function createLight (x: number, y: number, z: number): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0xFFFFFF, 1)
  light.position.set(x, y, z)
  return light
}

export function createPipeMesh (pipeSegment: PipeSegment): THREE.Mesh {
  const { position, rotation, length, radius } = pipeSegment
  const RADIUS_SEGMENTS = 20
  const HEIGHT_SEGMENTS = 5
  const geometry = new THREE.CylinderGeometry(radius, radius, length, RADIUS_SEGMENTS, HEIGHT_SEGMENTS)
  const mesh = new THREE.Mesh(geometry, new THREE.Material())
  mesh.position.set(position.x, position.y, position.z)
  mesh.rotation.set(rotation.x, rotation.y, rotation.z)
  return mesh
}

export function createPipeGeometry(path: Path, geometrydef: GeometryDef): PipeGeometry {
  const points = pathToPoints(path)
  const data = path.map(pathSegment => {
    for (const geometrySegment of geometrydef) {
      if (pathSegment.md <= geometrySegment.md)
        return { radius: geometrySegment.diameter / 2, name: geometrySegment.name }
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
  }))
}

export function pathToPoints(pipes: Path): Array<Point> {
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