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

const timeline = new Timeline(
  document.getElementById('timeline') as HTMLInputElement,
  document.getElementById('timestamp') as HTMLDivElement
)

const canvas3D = new Canvas3D(document.getElementById('canvas-3d') as HTMLCanvasElement)
const wellPathMesh = new THREE.Mesh(new THREE.Geometry(), createBufferAnimationMaterial())
const casingShoeMesh = new THREE.Mesh(new THREE.Geometry(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 'gray' }))
canvas3D.scene.add(wellPathMesh)
canvas3D.scene.add(casingShoeMesh)
canvas3D.addLight({ posx: -100, posy: -100, posz: -100 })
canvas3D.addLight({ posx:  100, posy:  100, posz:  100 })
canvas3D.addLight({ posx:  100, posy: -100, posz:  100 })


// Start the main function after ensuring authentication
ensureAuthentication().then(main)

async function main (data) {
  const gui = createGUIControls(data)

  gui.config.texture.subscribe(async textureConfig => {
    timeline.setImageUrl('')
    const imageUrl = `/api/simulations/${textureConfig.well}/${textureConfig.connection}/${textureConfig.simulation}.png?cmap=${textureConfig.cmap}` + 
      (textureConfig.customThresholds ? `&vmin=${textureConfig.vmin}&vmax=${textureConfig.vmax}` : '')
    
    const imageData = await loadImageData(imageUrl, { maxSize: 4096 })
    timeline.setImageUrl(imageData.objectURL)
    changeMaterialImage(wellPathMesh, imageData)
  })

  gui.config.geometry.subscribe(async geometryConfig => {
    const geometryData = await loadSimulation(geometryConfig.well, geometryConfig.connection, geometryConfig.radiusScaling)
    wellPathMesh.geometry = createWellPathBufferGeometry(geometryData.pathSegments)
    casingShoeMesh.geometry = createCasingShoeBufferGeometry(geometryData.casingShoes)
    console.log(geometryData.centre)
    canvas3D.setCamera({ ...geometryData.centre, distance: 3000 })
    timeline.setTimeDimensions(geometryData.time)
    canvas3D.replaceLabels(geometryData.casingShoes)
  })
  
  gui.config.timeline.subscribe(async timelineConfig => {
    timeline.speedup = timelineConfig.speedup
    timeline.update()
  })
  
  gui.config.material.subscribe(async materialConfig => {
    if (materialConfig.useLightModel) changeMaterialType(wellPathMesh, 'standard')
    else changeMaterialType(wellPathMesh, 'basic')
  })

  requestAnimationFrame(tNow => render(0, tNow))
  function render(tPrev: number, tNow: number) {
    stats.begin()
    timeline.addTime(tNow - tPrev)
    if (wellPathMesh.material['uniforms']) wellPathMesh.material['uniforms'].time.value = timeline.normalizedTime
    canvas3D.render()
    stats.end()
    requestAnimationFrame(tNext => render(tNow, tNext))
  }
}

// Prevent default behaviour on mobile devices when trying to zoom.
window.addEventListener("touchmove", e => e.preventDefault(), { capture: true, passive: false })