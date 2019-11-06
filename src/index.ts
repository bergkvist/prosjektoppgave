import * as THREE from 'three'
import * as BAS from 'three-bas'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import Stats from 'stats-js'
import * as R from 'ramda'
import geometrydef from './geometrydef'
import { loadPath, createLight, createPipeGeometry, createPipeMesh, loadPipePressure } from './utils'
import { LENGTH_SCALING, RADIUS_SCALING } from './config'
//import { interpolateRdBu as colorScale } from 'd3-scale-chromatic'
import { scaleLinear } from 'd3'

console.log(BAS)

//@ts-ignore
const colorScale = scaleLinear().domain([0, 0.5, 1]).range(['green', 'yellow', 'red'])

const getAnimationData = () => Promise.all([loadPipePressure(), loadPath()]).then(([pressure, path]) => {
  const x = Object.keys(pressure[0]).map(Number)
  const pipeDepths = path.map(segment => segment.md)

  const steps = pressure.map(p => {
    const y = Object.values(p).map(Number)
    return pipeDepths.map(scaleLinear().domain(x).range(y))
  })

  const scales = []
  for (let i = 0; i < steps[0].length; i++) {
    let min = steps[0][i]
    let max = steps[0][i]
    for (let t = 1; t < steps.length; t++) {
      const p = steps[t][i]
      if (p < min && p !== 0) min = p
      else if (p > max) max = p
    }

    const r = 0.5 * (max - min)
    const c = 0.5 * (max + min)
    scales.push(scaleLinear().domain([c - r, c, c + r]).range([1, 0, 1]))
  }

  return { steps, scales }
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
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' })
renderer.gammaFactor = 2.2
renderer.gammaOutput = true
renderer.physicallyCorrectLights = true
const labelRenderer = new CSS2DRenderer()
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.y = -10

scene.add(createLight(20,20,20))
scene.add(createLight(-10,-10,-10))
scene.add(createLight(0, -5, 0))

;(async () => {
  performance.mark('main_start')
  const path = await loadPath()
  performance.mark('path_loaded')
  const pipeGeometry = createPipeGeometry(path, geometrydef)
  { 
    let t = 0
    const geometries = pipeGeometry
      .map(createPipeMesh)
      .map((mesh, index) => {
        const ITEM_SIZE = 1 // measure depth index
        const NORMALIZED = false
        mesh.updateWorldMatrix(true, false)
        //@ts-ignore
        const geometry = new THREE.BufferGeometry().fromGeometry(mesh.geometry)
        geometry.applyMatrix(mesh.matrixWorld)
        const t0 = performance.now()
        const mdIndices = new Uint16Array(geometry.getAttribute('position').count * ITEM_SIZE)
        mdIndices.forEach((v, i) => { mdIndices[i] = index })
        geometry.setAttribute('md', new THREE.Uint16BufferAttribute(mdIndices, ITEM_SIZE, NORMALIZED))
        t += performance.now() - t0
        return geometry
      })
    console.log(t)
    
    //@ts-ignore
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries)
    const material = new BAS.StandardAnimationMaterial({
      vertexParameters: [
        'uniform float x;',
        'attribute float md;'
      ],
      varyingParameters: [
        'varying vec3 vColor;',
      ],
      vertexColor: [
        'vColor = (md == 0.0) ? vec3(1, 0, 0) : vec3(0, 0, 1);',
      ],
      fragmentDiffuse: [
        'diffuseColor.rgb *= vColor;'
      ]
    })
    const mesh = new THREE.Mesh(mergedGeometry, material)
    scene.add(mesh)
  }
  
  {
    // Add labels and casing shoe viz
    const pipeChanges = pipeGeometry.reduce((result, current, i, arr) => {
      if (i === 0) return result
      const previous = arr[i-1]
      if (current.pipeType !== previous.pipeType) {
        const geometry = new THREE.RingGeometry(previous.radius * 3.5, previous.radius * 4.5, 32)
        const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'gray' })
        const mesh = new THREE.Mesh(geometry, material)
  
        mesh.position.x = previous.position.x
        mesh.position.y = previous.position.y - previous.length / 2
        mesh.position.z = previous.position.z
  
        mesh.rotation.setFromRotationMatrix(new THREE.Matrix4()
          .makeRotationFromEuler(new THREE.Euler(previous.rotation.x, previous.rotation.y, previous.rotation.z))
          .multiply(new THREE.Matrix4().makeRotationX(Math.PI/2))
        )
  
        result.meshes.push(mesh)
        result.labels.push(createLabel(`end of ${previous.pipeType}`, mesh.position))
      }
      return result
    }, { meshes: [], labels: [] })
  
    pipeChanges.meshes.map(m => scene.add(m))
    pipeChanges.labels.map(l => scene.add(l))
  }


  const timeDiv = document.createElement('div')
  timeDiv.textContent = 'test'
  timeDiv.style.color = 'white'
  timeDiv.style.backgroundColor = 'black'
  timeDiv.style.position = 'absolute'
  timeDiv.style.top = '200px'
  document.body.appendChild(timeDiv)

  const animationData = await getAnimationData()
  
  init(camera, renderer, labelRenderer, allStats)

  const t = [0, 0, 0, 0, 0, 0, 0, 0]
  let tn = 0
  performance.mark('reached_render_loop')
  performance.measure('time until first render', 'main_start', 'reached_render_loop')
  performance.getEntriesByType('measure').map(x => console.log(x))
  for (let i = 0;; i++) {
    tn = performance.now()
    const timestamp = await new Promise<number>(requestAnimationFrame)
    t[0] += performance.now() - tn

    tn = performance.now()
    const time = Math.round(timestamp / 10) % animationData.steps.length
    t[1] += performance.now() - tn
    /*
    for (const i in pipeMeshes) {
      tn = performance.now()
      //const color = colorScale(animationData.scales[i](animationData.steps[time][i]))
      t[2] += performance.now() - tn

      tn = performance.now()
      //@ts-ignore
      pipeMeshes[i].material.color.set(animationData.color[i][time])
      t[3] += performance.now() - tn
    }*/
    tn = performance.now()
    timeDiv.innerText = `time: ${time/10} s`
    t[4] += performance.now() - tn

    tn = performance.now()
    allStats.forEach(stats => stats.update())
    t[5] += performance.now() - tn

    tn = performance.now()
    renderer.render(scene, camera)
    t[6] += performance.now() - tn

    tn = performance.now()
    labelRenderer.render(scene, camera)
    t[7] += performance.now() - tn
    
    if (i === 1000) {
      const sum = t.reduce((a, b) => a + b, 0)
      console.log(t.map(x => 100 * x / sum))
    }

    //camera.position.z = 40
  }
})()