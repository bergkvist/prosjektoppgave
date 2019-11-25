import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import * as THREE from 'three'

export function onresize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer) {
  const updateStyle = false  // We are manually handling CSS, and don't want renderer.setSize() to make our page unresponsive.
  renderer.setSize(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight, updateStyle)
  labelRenderer.setSize(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight)
  camera.aspect = renderer.domElement.offsetWidth / renderer.domElement.offsetHeight
  camera.updateProjectionMatrix()
}

function createLight (x: number, y: number, z: number): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(0xFFFFFF, 1)
  light.position.set(x, y, z)
  return light
}

export function createCamera () {
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000)
  return camera
}

export function createRenderer (canvas: HTMLCanvasElement) {
  const antialias = true
  const logarithmicDepthBuffer = true
  const powerPreference = 'high-performance'
  const renderer = new THREE.WebGLRenderer({ antialias, logarithmicDepthBuffer, powerPreference, canvas })
  
  // This should make sure colors are more accurate
  renderer.gammaFactor = 2.2
  renderer.gammaOutput = true
  renderer.physicallyCorrectLights = true
  return renderer
}

export function createScene () {
  const scene = new THREE.Scene()
  scene.add(createLight(20, 20, 20))
  scene.add(createLight(-10, -10, -10))
  scene.add(createLight(0, -5, 0))
  return scene
}

export function createControls (camera: THREE.Camera, element: HTMLElement) {
  const controls = new OrbitControls(camera, element)
  return controls
}

export async function * animationIterator () {
  let t0 = 0
  while(true) {
    const t = await new Promise<number>(resolve => requestAnimationFrame(timestamp => resolve(timestamp)))
    yield t - t0
    t0 = t
  }
}