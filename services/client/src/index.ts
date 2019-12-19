/**
 * Author: Tobias Bergkvist
 * Purpose: Connect all of the components of the application together, and run the render loop.
 */

import * as THREE from 'three'
import Stats from 'stats.js'
import './index.scss'
import Timeline from './Timeline'
import Canvas3D from './Canvas3D'
import { createGUIControls } from './GUIControls'
import { loadImageData, loadWellGeometry, ensureAuthentication, createImageUrl } from './loaders'
import { createBufferAnimationMaterial, changeMaterialImage, changeMaterialType } from './material'
import { createWellPathBufferGeometry, createCasingShoeBufferGeometry } from './geometry'

// fps/ms counter in the corner
const stats = new Stats()
stats.showPanel(0)
stats.dom.visibility = 'hidden'
document.body.appendChild(stats.dom)

const canvasElement = document.getElementById('canvas-3d') as HTMLCanvasElement
const timelineElement = document.getElementById('timeline') as HTMLInputElement
const timestampElement = document.getElementById('timestamp') as HTMLDivElement

const timeline = new Timeline(timelineElement, timestampElement)
const canvas3D = new Canvas3D(canvasElement)

const wellPathMesh = new THREE.Mesh(new THREE.Geometry(), createBufferAnimationMaterial())
const casingShoeMesh = new THREE.Mesh(new THREE.Geometry(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'gray' }))

canvas3D.scene.add(wellPathMesh)
canvas3D.scene.add(casingShoeMesh)
canvas3D.addLight({ posx: -100, posy: -100, posz: -100 })
canvas3D.addLight({ posx:  100, posy:  100, posz:  100 })
canvas3D.addLight({ posx:  100, posy: -100, posz:  100 })


// Main rendering loop
requestAnimationFrame(tNow => render(0, tNow))
function render(tPrev: number, tNow: number) {
  stats.begin()
  timeline.addTime(tNow - tPrev)
  wellPathMesh.material['uniforms'].imageColumn.value = timeline.normalizedTime
  canvas3D.render()
  stats.end()
  requestAnimationFrame(tNext => render(tNow, tNext))
}


// Ensure that you have access to the API before allowing you to configure anything
ensureAuthentication()
  .then(createGUIControls)
  .then(configEmitter =>
  // Whenever the user makes config changes using the GUI, the configEmitters will broadcast events
{
  configEmitter.geometry.subscribe(async geometryConfig => {
    // Could be dangerous to have this await. Changing options quickly will cause a race condition
    const geometryData = await loadWellGeometry(geometryConfig.well, geometryConfig.connection, geometryConfig.radiusScaling)
    wellPathMesh.geometry = createWellPathBufferGeometry(geometryData.pathSegments)
    casingShoeMesh.geometry = createCasingShoeBufferGeometry(geometryData.casingShoes)
    canvas3D.setCamera({ ...geometryData.centre, distance: 3000 })
    timeline.setTimeDimensions(geometryData.time)
    canvas3D.replaceLabels(geometryData.casingShoes)
  })

  configEmitter.image.subscribe(async imageConfig => {
    // Clear the background image of the timeline while waiting for a new image.
    timeline.setImageUrl('')
    // Same problem with race conditions here. Ideally, there should be some way of cancelling if a new event is emitted.
    // Cancelling might be possible/the easiest to acheive using generator functions.
    const imageData = await loadImageData(createImageUrl(imageConfig), { maxSize: 4096 })
    timeline.setImageUrl(imageData.objectURL)
    changeMaterialImage(wellPathMesh, imageData)
  })
  
  configEmitter.timelineSpeedup.subscribe(timelineSpeedup => {
    timeline.speedup = timelineSpeedup
    timeline.update()
  })

  configEmitter.reflectiveSurface.subscribe(reflectiveSurface => {
    if (reflectiveSurface) changeMaterialType(wellPathMesh, 'standard')
    else changeMaterialType(wellPathMesh, 'basic')
  })

  configEmitter.showCasingShoes.subscribe(showCasingShoes => {
    canvas3D.setLabelVisibility({ visible: showCasingShoes })
    casingShoeMesh.visible = showCasingShoes
  })

  configEmitter.showFps.subscribe(showFps => {
    stats.dom.style.visibility = showFps ? 'visible' : 'hidden'
  })
})