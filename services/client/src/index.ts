import './index.scss'
import { loadImageData, loadSimulation, ensureAuthentication } from './loaders'
import { createWellPathMesh, createShoeMesh } from './objects/mesh'
import { changeMaterial } from './objects/material'
import Timeline, { seconds } from './Timeline'
import Canvas3D from './Canvas3D'

const timeline = new Timeline(
  document.getElementById('timeline') as HTMLInputElement,
  document.getElementById('timestamp') as HTMLDivElement
)

const canvas3D = new Canvas3D(document.getElementById('canvas-3d') as HTMLCanvasElement)
canvas3D.setCamera({ x: 0, y: 0, z: 0, d: 30 })
canvas3D.addLight(-100, -100, -100)
canvas3D.addLight(100, 100, 100)
canvas3D.addLight(100, -100, 100)

// Start the main function after ensuring authentication
ensureAuthentication().then(main).catch(err => alert(err.message))

async function main(data) {  
  const [, well, connection] = window.location.pathname.split('/')
  if (!well) return window.location.assign(`/Well_2/Connection_4739mMD`)
  if (!(data[well] instanceof Array)) throw Error(`"${well}" is not a valid well. Please select one of: \n${Object.keys(data).join('\n')}`)
  if (!connection) return window.location.assign(`/${well}/${data[well][data[well].length - 1]}`)
  if (!(isInside(connection, data[well]))) throw Error(`"${connection}" is not valid for this well. Please select one of: \n${data[well].join('\n')}`)

  const imageUrl = (well === 'Well_1')
    ? `/api/simulations/${well}/${connection}/pipepressure.png?vmax=15&vmin=-15&cmap=inferno`
    : `/api/simulations/${well}/${connection}/pipepressure.png?vmax=5&vmin=-5&cmap=inferno`
  
  const [ simulationData, imageData ] = await Promise.all([
    loadSimulation(well, connection),
    loadImageData(imageUrl, { maxSize: 4096 /* max DataTexture size */ })
  ])
  timeline.set({
    imageUrl: imageData.objectURL,
    min: seconds(simulationData.time.min),
    max: seconds(simulationData.time.max),
    step: seconds(simulationData.time.step)
  })
  
  const wellPath = createWellPathMesh(simulationData.pathSegments, imageData)
  canvas3D.scene.add(wellPath)
  
  simulationData.casingShoes
    .map(({ label, posx, posy, posz }) => canvas3D.addLabel(label, posx, posy, posz))
  simulationData.casingShoes
    .map(createShoeMesh)
    .map(mesh => canvas3D.scene.add(mesh))


  window.addEventListener('keydown', e => {
    if (e.keyCode === 81) changeMaterial(wellPath, 'basic')
    if (e.keyCode === 87) changeMaterial(wellPath, 'standard')
  })
  
  
  requestAnimationFrame(tNow => render(0, tNow))
  function render(tPrev: number, tNow: number) {
    timeline.addTime(tNow - tPrev)
    wellPath.material['uniforms'].time.value = timeline.normalizedTime
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
function isInside(item: string, arr: Array<string>) {
  for (const el of arr) if (el === item) return true
  return false
}
