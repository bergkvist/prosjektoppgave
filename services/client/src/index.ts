import './index.scss'
import { loadImageData, loadSimulation } from './loaders'
import { createPipeMesh, createShoeMesh } from './objects/mesh'
import { changeMaterial } from './objects/material'
import Timeline, { seconds } from './Timeline'
import Canvas3D from './Canvas3D'

const timeline = new Timeline(
  document.getElementById('timeline') as HTMLInputElement,
  document.getElementById('timestamp') as HTMLDivElement
)

const canvas3D = new Canvas3D(document.getElementById('3d-view') as HTMLCanvasElement)
canvas3D.setCamera({ x: 0, y: -10, z: 0, d: 30 })
canvas3D.addLight(-100, -100, -100)
canvas3D.addLight(100, 100, 100)
canvas3D.addLight(100, -100, 100)
main()


async function main() {
  const well = 'Well_2'
  const connection = 'Connection_4739mMD'
  const imageUrl = `api/simulations/${well}/${connection}/pipepressure.png?vmax=5&vmin=-5&cmap=inferno&dt=${Date.now()}`
  
  const [ simulationData, imageData ] = await Promise.all([
    loadSimulation(well, connection),
    loadImageData(imageUrl)
  ])
  timeline.set({
    imageUrl,
    min: seconds(simulationData.time.min),
    max: seconds(simulationData.time.max),
    step: seconds(simulationData.time.step)
  })
  
  const pipe = createPipeMesh(simulationData.pipeSegments, imageData)
  canvas3D.scene.add(pipe)
  
  simulationData.casingShoes
    .map(({ label, posx, posy, posz }) => canvas3D.addLabel(label, posx, posy, posz))
  simulationData.casingShoes
    .map(createShoeMesh)
    .map(mesh => canvas3D.scene.add(mesh))


  window.addEventListener('keydown', e => {
    if (e.keyCode === 81) changeMaterial(pipe, 'basic')
    if (e.keyCode === 87) changeMaterial(pipe, 'standard')
  })
  
  
  requestAnimationFrame(tNow => render(0, tNow))
  function render(tPrev: number, tNow: number) {
    timeline.addTime(tNow - tPrev)
    pipe.material['uniforms'].time.value = timeline.normalizedTime
    canvas3D.render()
    requestAnimationFrame(tNext => render(tNow, tNext))
  }
}

window.addEventListener('keydown', e => {
  if (e.keyCode === 187 || e.keyCode === 107) {
    // + key (on normal keyboard or numpad)
    timeline.speedup++
    timeline.update()
  }

  else if (e.keyCode === 189 || e.keyCode === 109) {
    // - key (on normal keyboard or numpad)
    timeline.speedup--
    timeline.update()
  }
})

// Key Codes
// Q(81), W(87), A(65), S(83)