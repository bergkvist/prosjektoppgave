import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats-js'

const allStats = [0, 1, 2].map(panel => {
  const stats = new Stats()
  stats.dom.style.cssText = `position:absolute;top:${50*panel}px;left:${0}px;`
  stats.showPanel(panel)
  return stats
})

const camera = new THREE.PerspectiveCamera(70)
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
new OrbitControls(camera)

const pipes = [
  { angle: 0,           length: 2 },
  { angle: Math.PI / 4, length: 3 },
  { angle: Math.PI / 2, length: 4 },
  { angle: Math.PI / 4, length: 5 }
]

const meshes = createCylinderMeshes(pipes)

function createCylinderMeshes (pipes) {
  const vs = pipes.map(pipe => new THREE.Vector3(0, -pipe.length / 2, 0)
    .applyEuler(new THREE.Euler(0, 0, pipe.angle)))

  const ps = vs.reduce((ps, _, i) => {
    if (i === 0) {
      ps[i] = vs[i]
      return ps
    }
  
    ps[i] = ps[i].add(ps[i-1]).add(vs[i-1]).add(vs[i])
    return ps
  
  }, vs.map(() => new THREE.Vector3(0, 0, 0)))

  return ps.map((p, i) => createCylinderMesh({ 
    px: p.x, 
    py: p.y, 
    pz: p.z, 
    rz: pipes[i].angle, 
    radius: pipes[i].radius, 
    height: pipes[i].length
  }))
}

function createCylinderMesh ({ radius = 0.5, height = 1, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0 }) {
  const RADIUS_SEGMENTS = 20
  const HEIGHT_SEGMENTS = 5
  const geometry = new THREE.CylinderGeometry(radius, radius, height, RADIUS_SEGMENTS, HEIGHT_SEGMENTS)
  const material = new THREE.MeshNormalMaterial({ wireframe: true })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(px, py, pz)
  mesh.rotation.set(rx, ry, rz)
  return mesh
}

function onresize ({ camera, renderer }) {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

function init() {
  camera.position.z = 3
  document.body.appendChild(renderer.domElement)
  allStats.forEach(stats => document.body.appendChild(stats.dom))
  meshes.forEach(mesh => scene.add(mesh))
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