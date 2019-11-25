performance.mark('index.ts')
import { createDataTexture } from './texture'
import { createLabelRenderer } from './labels'
import { createMeshes } from './mesh'
import { createCamera, createControls, createRenderer, createScene, onresize, animationIterator } from './utils'
import Timeline, { seconds } from './timeline'
import { createMaterial } from './material'
performance.mark('index.ts (2)')

const timeline = new Timeline(
  document.getElementById('timeline') as HTMLInputElement,
  document.getElementById('timestamp') as HTMLDivElement
)

const renderer = createRenderer(document.getElementById('3d-view') as HTMLCanvasElement)
const labelRenderer = createLabelRenderer()
const camera = createCamera()
const controls = createControls(camera, labelRenderer.domElement)
const scene = createScene()

// For some reason, it is very important that camera position is set AFTER OrbitControls have been created.
camera.position.set(10, -10, 25)
controls.target.set(10, -10, 0)

onresize(camera, renderer, labelRenderer)
window.addEventListener('resize', () => onresize(camera, renderer, labelRenderer))

; (async () => {
  performance.mark('starting')
  const { pipe, shoes } = await createMeshes()
  performance.mark('initialized')
  scene.add(pipe)
  shoes.labels.map(label => scene.add(label))
  shoes.meshes.map(marker => scene.add(marker))

  window.addEventListener('keydown', e => {
    // Q: Change to standard material
    if (e.keyCode === 81) {
      pipe.material = createMaterial('standard', pipe.material['uniforms'])
    }

    // W: Change to basic material
    else if (e.keyCode === 87) {
      pipe.material = createMaterial('basic', pipe.material['uniforms'])
    }
  })

  const imageUrl = require('./data/inferno.png')
  const min = seconds(0)
  const max = seconds(278.2)
  const step = seconds(0.1)
  timeline.set({ imageUrl, min, max, step })
  pipe.material['uniforms'].dataTexture.value = await createDataTexture(imageUrl)
  performance.mark('starting')
  console.table(performance.getEntriesByType('mark'))
  for await (const dt of animationIterator()) {
    timeline.addTime(dt)
    pipe.material['uniforms'].time.value = timeline.normalizedTime
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }
})()