import './index.scss'
import { loadImageData, loadSimulation, ensureAuthentication } from './loaders'
import Timeline from './Timeline'
import Canvas3D from './Canvas3D'
import Stats from 'stats.js'
import { createGUIControls } from './GUIControls'
import * as THREE from 'three'
import { createBufferAnimationMaterial, changeMaterialImage, changeMaterialType } from './objects/material'
import { createWellPathBufferGeometry, createCasingShoeBufferGeometry } from './objects/geometry'

const stats = new Stats()
stats.showPanel(1)
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
requestAnimationFrame(tNow => render(0, tNow))
function render(tPrev: number, tNow: number) {
  stats.begin()
  timeline.addTime(tNow - tPrev)
  wellPathMesh.material['uniforms'].time.value = timeline.normalizedTime
  canvas3D.render()
  stats.end()
  requestAnimationFrame(tNext => render(tNow, tNext))
}


// Start the main function after ensuring authentication
ensureAuthentication()
  .then(createGUIControls)
  .then(({ configEmitter }) => 
{
  configEmitter.geometry.subscribe(async geometryConfig => {
    // Could be dangerous to have this await. Changing options quickly can cause a race condition here
    const geometryData = await loadSimulation(geometryConfig.well, geometryConfig.connection, geometryConfig.radiusScaling)
    wellPathMesh.geometry = createWellPathBufferGeometry(geometryData.pathSegments)
    casingShoeMesh.geometry = createCasingShoeBufferGeometry(geometryData.casingShoes)
    canvas3D.setCamera({ ...geometryData.centre, distance: 3000 })
    timeline.setTimeDimensions(geometryData.time)
    canvas3D.replaceLabels(geometryData.casingShoes)
  })

  configEmitter.texture.subscribe(async textureConfig => {
    timeline.setImageUrl('')
    const imageUrl = `/api/simulations/${textureConfig.well}/${textureConfig.connection}/${textureConfig.simulation}.png?cmap=${textureConfig.colormap}` + 
      (textureConfig.customThresholds ? `&vmin=${textureConfig.vmin}&vmax=${textureConfig.vmax}` : '')
    
    // Could be dangerous to have this await. Changing options quickly can cause a race condition here
    const imageData = await loadImageData(imageUrl, { maxSize: 4096 })
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
})