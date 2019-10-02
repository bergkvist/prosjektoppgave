import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats-js'
import { dsv } from 'd3'
import * as R from 'ramda'
import geometrydef from './geometrydef'

const LENGTH_SCALING = 1 / 100
const RADIUS_SCALING = 1
// TODO: end piece is WRONG! Need to add the two final parts of geometrydef manually?
// TODO: Make sea bottom only visible from below. Make ground top only visible from above.
// TODO: Consider lowering sea level slighly to prevent flickering
// TODO: Actually use geometrydef.txt

const allStats = [0, 1, 2].map(panel => {
  const stats = new Stats()
  stats.dom.style.cssText = `position:absolute;top:${50*panel}px;left:${0}px;`
  stats.showPanel(panel)
  return stats
})

const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000)
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
const controls = new OrbitControls(camera)

controls.target.y = -10

const addLight = (x, y, z)  => {
  const light = new THREE.DirectionalLight(0xFFFFFF, 1)
  light.position.set(x, y, z)
  scene.add(light)
  return light
}
addLight(20,20,20)
addLight(-10,-10,-10)
addLight(0, -5, 0)

async function getPath() {
  const path = await dsv(';', './well_path.csv')
  return R.tail(path.map(segment => ({
    md: Number(segment['Md']),
    inc: Number(segment['Inc']) * Math.PI / 180,
    azi: Number(segment['Azi']) * Math.PI / 180
  })).map((segment, i, arr) => ((i === 0) ? null : {
    length: arr[i].md - arr[i-1].md,
    ...segment
  })))
}

;(async () => {
  const pipes = await getPath()
  createCylinderMeshes(pipes)

  function getBoundingBox (points) {
    const boundingBox = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } }
    for (const p of points) {
      if (p.x > boundingBox.max.x) boundingBox.max.x = p.x
      else if (p.x < boundingBox.min.x) boundingBox.min.x = p.x

      if (p.y > boundingBox.max.y) boundingBox.max.y = p.y
      else if (p.y < boundingBox.min.y) boundingBox.min.y = p.y

      if (p.z > boundingBox.max.z) boundingBox.max.z = p.z
      else if (p.z < boundingBox.min.z) boundingBox.min.z = p.z
    }
    return boundingBox
  }

  function createBox (boundingBox, color) {
    const dx = (boundingBox.max.x - boundingBox.min.x)
    const dy = (boundingBox.max.y - boundingBox.min.y)
    const dz = (boundingBox.max.z - boundingBox.min.z)
    const x =  (boundingBox.max.x + boundingBox.min.x) / 2
    const y =  (boundingBox.max.y + boundingBox.min.y) / 2
    const z =  (boundingBox.max.z + boundingBox.min.z) / 2
    const geometry = new THREE.BoxGeometry(dx, dy, dz)
    return [THREE.FrontSide, THREE.BackSide].map(side => {
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        opacity: 0.5,
        transparent: true,
        side
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, z)
      scene.add(mesh)
      return mesh
    })
  }

  function createCylinderMeshes (pipes) {
    const vectors = pipes.map(pipe => new THREE.Vector3(0, -pipe.length / 2 * LENGTH_SCALING, 0)
      .applyEuler(new THREE.Euler(0, pipe.azi, pipe.inc)))

    const positions = vectors.reduce((positions, _, i) => {
      if (i === 0) {
        positions[i] = vectors[i]
        return positions
      }
    
      positions[i] = positions[i].add(positions[i-1]).add(vectors[i-1]).add(vectors[i])
      return positions
    
    }, vectors.map(() => new THREE.Vector3(0, 0, 0)))
    
    const waterbbox = getBoundingBox(positions)
    const groundbbox = R.clone(waterbbox)
    waterbbox.min.y = -geometrydef[0].md * LENGTH_SCALING
    groundbbox.max.y = -geometrydef[0].md * LENGTH_SCALING

    createBox(waterbbox, 'blue')
    createBox(groundbbox, 'gray')

    const radiuses = pipes.map(pipe => {
      for (const casing of geometrydef)
        if (pipe.md <= casing.md)
          return casing.diameter / 2
    })
    
    return positions.map((p, i) => createCylinderMesh({ 
      px: p.x, 
      py: p.y, 
      pz: p.z,
      ry: pipes[i].azi,
      rz: pipes[i].inc,
      radius: radiuses[i] * RADIUS_SCALING,
      height: pipes[i].length * LENGTH_SCALING
    }))
  }

  function createCylinderMesh ({ radius = 0.1, height = 1, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0 }) {
    const RADIUS_SEGMENTS = 20
    const HEIGHT_SEGMENTS = 5
    const geometry = new THREE.CylinderGeometry(radius, radius, height, RADIUS_SEGMENTS, HEIGHT_SEGMENTS)
    const material = new THREE.MeshNormalMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(px, py, pz)
    mesh.rotation.set(rx, ry, rz)
    scene.add(mesh)
    return mesh
  }

  function onresize ({ camera, renderer }) {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  function init() {
    camera.position.z = 10
    document.body.appendChild(renderer.domElement)
    allStats.forEach(stats => document.body.appendChild(stats.dom))
    onresize({ renderer, camera })
    window.addEventListener('resize', () => onresize({ camera, renderer }))
  }

  const animationIterator = async function * () { 
    for (;;) {
      const timestamp = await new Promise(resolve => requestAnimationFrame(resolve))
      allStats.forEach(stats => stats.update())
      renderer.render(scene, camera)
      yield timestamp
    }
  }

  const animate = async () => {
    for await (const _timestamp of animationIterator()) {

    }
  }
  init()
  animate()

})()