import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import Stats from 'stats-js'
import * as R from 'ramda'
import geometrydef from './geometrydef'
import { getBoundingBox, createTerrainMeshes, loadPath, createLight, pathToPoints, createPipeGeometry, createPipeMesh } from './utils'
import { LENGTH_SCALING, RADIUS_SCALING } from './config'
console.log(geometrydef)

function onresize (camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer) {
  renderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

function init(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer, allStats: Array<Stats>) {
  camera.position.z = 10
  onresize(camera, renderer, labelRenderer)
  window.addEventListener('resize', () => onresize(camera, renderer, labelRenderer))
  document.body.appendChild(renderer.domElement)
  document.body.appendChild(labelRenderer.domElement)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  for (const stats of allStats) {
    document.body.appendChild(stats.dom)
  }
}

const allStats = [0, 1, 2].map(panel => {
  const stats = new Stats()
  stats.dom.style.cssText = `position:absolute;top:${50*panel}px;left:${0}px;`
  stats.showPanel(panel)
  return stats
})

const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000)
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
const labelRenderer = new CSS2DRenderer()
const controls = new OrbitControls(camera)
controls.target.y = -10

scene.add(createLight(20,20,20))
scene.add(createLight(-10,-10,-10))
scene.add(createLight(0, -5, 0))

;(async () => {
  const path = await loadPath()
  const pipeMeshes = createPipeGeometry(path, geometrydef)
    .map(createPipeMesh)
  
  pipeMeshes.map(mesh => scene.add(mesh))

  
  const casingShoeDiv = document.createElement('div')
  casingShoeDiv.className = 'label'
  casingShoeDiv.textContent = 'casing shoe'
  casingShoeDiv.style.marginTop = '-1em'
  casingShoeDiv.style.color = 'white'
  casingShoeDiv.style.backgroundColor = 'black'
  const casingShoeLabel = new CSS2DObject(casingShoeDiv)
  casingShoeLabel.position.set(0, 0, 0)
  pipeMeshes[0].add(casingShoeLabel)
  

  const points = pathToPoints(path)
  const waterbbox = getBoundingBox(points)
  const groundbbox = R.clone(waterbbox)
  waterbbox.min.y = -geometrydef[0].md * LENGTH_SCALING
  groundbbox.max.y = -geometrydef[0].md * LENGTH_SCALING

  createTerrainMeshes(waterbbox, 'blue').map(mesh => scene.add(mesh))
  createTerrainMeshes(groundbbox, 'gray').map(mesh => scene.add(mesh))

  const animationIterator = async function * () { 
    for (;;) {
      const timestamp = await new Promise(resolve => requestAnimationFrame(resolve))
      allStats.forEach(stats => stats.update())
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
      yield timestamp
    }
  }

  const animate = async () => {
    for await (const _timestamp of animationIterator()) {
      // Consider making animationIterator return dt instead of timestamp.
      // Animate pressure propagation
    }
  }
  init(camera, renderer, labelRenderer, allStats)
  animate()

})()