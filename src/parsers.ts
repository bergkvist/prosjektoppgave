import { csv, dsv } from 'd3'
import { tail, head } from 'ramda'
import Axios from 'axios'

export interface Point { x: number, y: number, z: number }
interface RawSegment { 'Md': string, 'Inc': string, 'Azi': string }
export interface PathSegment { md: number, inc: number, azi: number, tvd: number, length: number }
export type Path = Array<PathSegment>
export type PipeSegment = { position: Point, rotation: Point, length: number, radius: number, md: number, tvd: number, pipeType: string }
export type PipeGeometry = Array<PipeSegment>
export interface GeometrySegment { name: string, radius: number, md: number }
export type GeometryDef = Array<GeometrySegment>

async function parsePipePressure() {
  return { mds: require('./data/mds.json') }
}

async function parseWellPath(): Promise<Path> {
  const path = await dsv(';', require('./data/well_path.csv')) as Array<RawSegment>
  const result = tail(
    path.map(segment => ({
      md: Number(segment['Md']),
      tvd: Number(segment['Tvd']),
      inc: Number(segment['Inc']) * Math.PI / 180,
      azi: Number(segment['Azi']) * Math.PI / 180,
    })).map((segment, i, arr) => ((i === 0) ? null : {
      length: arr[i].md - arr[i-1].md,
      ...segment
    }))
  )
  return result
}

async function parseGeometrydef() {
  const response = await Axios.get(require('./data/geometrydef.txt'))
  
  const data = response.data.split('\n')
    .map((line: string) => head(line.split('#'))) // Remove comments
    .map(Number)

  const inchesToMetres = (inches: number) => 0.0254 * inches

  return [
    { name: 'riser',         radius: inchesToMetres(data[1]) / 2, md: data[2]           },
    { name: 'cased section', radius: inchesToMetres(data[3]) / 2, md: data[4]           },
    { name: 'liner',         radius: inchesToMetres(data[5]) / 2, md: data[4] + data[6] },
    { name: 'open hole',     radius: inchesToMetres(data[0]) / 2, md: data[10]          }
  ]
}

export const allDataPromise = Promise.all([
  parseWellPath(),
  parseGeometrydef(),
  parsePipePressure()
])
