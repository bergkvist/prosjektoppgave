import * as THREE from 'three'
import * as BAS from 'three-bas'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import * as R from 'ramda'
import geometrydef from './geometrydef'
import { loadPath, createLight, createPipeGeometry, createPipeMesh, loadPipePressure, loadTexture } from './utils'
import { LENGTH_SCALING, RADIUS_SCALING } from './config'
import Timeline from './Timeline'
//import { interpolateRdBu as colorScale } from 'd3-scale-chromatic'
import { scaleLinear } from 'd3'

/** This makes the timeline more touch friendly */
import RangeTouch from 'rangetouch'
new RangeTouch('#timeline', { addCSS: false, thumbWidth: 15, watch: false })

const timeline = new Timeline(
  document.getElementById('timeline') as HTMLInputElement,
  document.getElementById('timestamp') as HTMLDivElement
)
timeline.setImage(require('./data/inferno.png'))
const canvas = document.getElementById('3d-view')

const getAnimationData = () => Promise.all([loadPipePressure(), loadPath(), loadTexture(require('./data/inferno.png'))]).then(([pressure, path, texture]) => {
  const normalizedRange = length => R.range(0, length).map(scaleLinear().domain([0, length-1]).range([0, 1]))
  const pressureKeys = Object.keys(R.head(pressure))
  const pressureDepths = R.tail(pressureKeys).map(Number)
  const geometryDepths = path.map(x => x.md)
  const t0 = R.head(pressureKeys)
  const ts = Object.values(pressure).map(x => Number(x[t0])).filter(x => !isNaN(x))
  /**
   * These might end up outside the range [0, 1], but this is fine,
   * since webgl will interpolate to the closest "pixel".
   */
  const mdAccessors = geometryDepths.map(
    scaleLinear()
      .domain(pressureDepths.map(Number))
      .range(normalizedRange(pressureDepths.length))
  )

  return { mdAccessors, texture, ts, path }
})

function createLabel(text, position) {
  const casingShoeDiv = document.createElement('div')
  casingShoeDiv.className = 'label'
  casingShoeDiv.textContent = text
  casingShoeDiv.style.marginTop = '-1em'
  casingShoeDiv.style.color = 'white'
  casingShoeDiv.style.backgroundColor = 'black'
  const casingShoeLabel = new CSS2DObject(casingShoeDiv)
  casingShoeLabel.position.set(position.x, position.y, position.z)
  return casingShoeLabel
}

function onresize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer) {
  const updateStyle = false
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, updateStyle)
  labelRenderer.setSize(canvas.offsetWidth, canvas.offsetHeight)
  camera.aspect = canvas.offsetWidth / canvas.offsetHeight
  camera.updateProjectionMatrix()
}

const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 10000)
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance', canvas: document.getElementById('3d-view') as HTMLCanvasElement })
const labelRenderer = new CSS2DRenderer()
const controls = new OrbitControls(camera, labelRenderer.domElement)

// This should make sure colors are more accurate
renderer.gammaFactor = 2.2
renderer.gammaOutput = true
renderer.physicallyCorrectLights = true

// This makes the app more mobile friendly (since the default touch gestures are prevented)
window.addEventListener("touchstart",  e => e.preventDefault(), { capture: true, passive: false })
window.addEventListener("touchmove",   e => e.preventDefault(), { capture: true, passive: false })
window.addEventListener("touchend",    e => e.preventDefault(), { capture: true, passive: false })
window.addEventListener("touchcancel", e => e.preventDefault(), { capture: true, passive: false })
window.addEventListener('resize', () => onresize(camera, renderer, labelRenderer), { passive: true })

camera.position.set(10, -10, 25)
controls.target.set(10, -10, 0)
controls.target.y = -10
onresize(camera, renderer, labelRenderer)
document.body.appendChild(labelRenderer.domElement)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0'

scene.add(createLight(20, 20, 20))
scene.add(createLight(-10, -10, -10))
scene.add(createLight(0, -5, 0))

  ; (async () => {
    const animationData = await getAnimationData()
    const pipeGeometry = createPipeGeometry(animationData.path, geometrydef)

    const geometries = pipeGeometry
      .map(createPipeMesh)
      .map((mesh, index) => {
        const ITEM_SIZE = 1 // measure depth index
        mesh.updateWorldMatrix(true, false)
        //@ts-ignore
        const geometry = new THREE.BufferGeometry().fromGeometry(mesh.geometry)
        geometry.applyMatrix(mesh.matrixWorld)
        const mdIndices = new Float32Array(geometry.getAttribute('position').count * ITEM_SIZE)
        geometry.setAttribute('md', new THREE.Float32BufferAttribute(mdIndices.map(() => animationData.mdAccessors[index]), ITEM_SIZE))
        return geometry
      })

    //@ts-ignore
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries)
    const material = 
    //new BAS.BasicAnimationMaterial({
    new BAS.StandardAnimationMaterial({
      uniforms: {
        time: { value: 3.0 },
        x: { value: animationData.texture }
      },
      vertexParameters: [
        'uniform highp float time;',
        'uniform sampler2D x;',
        'attribute highp float md;',
      ],
      varyingParameters: [
        'varying vec3 vColor;',
      ],
      vertexColor: [
        'vColor = texture2D(x, vec2(time, md)).xyz;'
      ],
      fragmentDiffuse: [
        'diffuseColor.rgb *= vColor;'
      ],
    })
    material.uniforms.map.value = animationData.texture
    const mesh = new THREE.Mesh(mergedGeometry, material)

    scene.add(mesh)

    {
      // Add labels and casing shoe viz
      const pipeChanges = pipeGeometry.reduce((result, current, i, arr) => {
        if (i === 0) return result
        const previous = arr[i - 1]
        if (current.pipeType !== previous.pipeType) {
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

      pipeChanges.meshes.map(m => scene.add(m))
      pipeChanges.labels.map(l => scene.add(l))
    }
    
    let prevTimestamp = 0
    for (let i = 0; ; i++) {
      const timestamp = await new Promise<number>(requestAnimationFrame)
      timeline.updateTime(timestamp - prevTimestamp)
      prevTimestamp = timestamp
      
      //@ts-ignore
      mesh.material.uniforms.time.value = timeline.normalizedTime
      renderer.render(scene, camera)
      labelRenderer.render(scene, camera)
    }
  })()