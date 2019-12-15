import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import * as THREE from 'three'
import { Position } from './loaders'

type CameraSetpoint = Position & { distance: number }
type Label = Position & { label: string }

export default class Canvas3D {
  dynamicStyleheet = document.createElement('style')
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  labelRenderer = new CSS2DRenderer()
  labelGroup = new THREE.Group()
  scene = new THREE.Scene()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true })
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100000)
    this.controls = new OrbitControls(this.camera, this.labelRenderer.domElement)
    this.scene.add(this.labelGroup)
  
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0'
    document.body.appendChild(this.labelRenderer.domElement)
    document.head.appendChild(this.dynamicStyleheet)
    this.dynamicStyleheet.type = 'text/css'
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

  addLight({ posx, posy, posz }: Position) {
    const light = new THREE.DirectionalLight(0xFFFFFF, 1)
    light.position.set(posx, posy, posz)
    this.scene.add(light)
  }

  replaceLabels(labels: Array<Label>): void {
    for (let i = this.labelGroup.children.length - 1; i >= 0; i--) {
      this.labelGroup.remove(this.labelGroup.children[i])
    }

    for (const label of labels) {
      const labelDiv = document.createElement('div')
      labelDiv.className = 'label'
      labelDiv.textContent = label.label
      const labelObject = new CSS2DObject(labelDiv)
      labelObject.position.set(label.posx, label.posy, label.posz)
      this.labelGroup.add(labelObject)
    }
  }

  setLabelVisibility({ visible }: { visible: boolean }) {
    if (visible) {
      this.dynamicStyleheet.innerHTML = '.label { visibility: visible; }'
    } else {
      this.dynamicStyleheet.innerHTML = '.label { visibility: hidden; }'
    }    
  }

  setCamera({ posx, posy, posz, distance }: CameraSetpoint) {
    this.controls.target.set(posx, posy, posz)
    this.controls.update()
    this.camera.position.set(posx, posy, posz + distance)
    this.controls.update()
  }

  render() {
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
  }
}