import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import * as THREE from 'three'

type CameraSetpoint = { x: number, y: number, z: number, d: number }

export default class Canvas3D {
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  labelRenderer: CSS2DRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true })
    this.labelRenderer = new CSS2DRenderer()
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000)
    this.controls = new OrbitControls(this.camera, this.labelRenderer.domElement)
  
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0'
    document.body.appendChild(this.labelRenderer.domElement)
    window.addEventListener('resize', () => this.onresize())
    this.onresize()
  }

  onresize() {
    const updateStyle = false  // We are manually handling CSS, and don't want renderer.setSize() to make our page unresponsive.
    this.renderer.setSize(this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight, updateStyle)
    this.labelRenderer.setSize(this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight)
    this.camera.aspect = this.renderer.domElement.offsetWidth / this.renderer.domElement.offsetHeight
    this.camera.updateProjectionMatrix()
  }

  addLight(x: number, y: number, z: number) {
    const light = new THREE.DirectionalLight(0xFFFFFF, 1)
    light.position.set(x, y, z)
    this.scene.add(light)
  }

  addLabel(text: string, x: number, y: number, z: number) {
    const labelDiv = document.createElement('div')
    labelDiv.className = 'label'
    labelDiv.textContent = text
    labelDiv.style.marginTop = '-1em'
    labelDiv.style.color = 'white'
    labelDiv.style.backgroundColor = 'rgba(0,0,0,0.6)'
    labelDiv.style.fontFamily = 'sans serif'
    labelDiv.style.fontSize = '16px'
    const label = new CSS2DObject(labelDiv)
    label.position.set(x, y, z)
    this.scene.add(label)
  }

  setCamera({ x, y, z, d }: CameraSetpoint) {
    this.camera.position.set(x, y, z + d)
    this.controls.target.set(x, y, z)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
  }
}