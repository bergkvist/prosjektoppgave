import * as dat from 'dat.gui'
import { BehaviorSubject as SubscribableConfig } from 'rxjs'

type GeometryInfo = { well: string, connection: string, radiusScaling: number }
type TextureInfo = { simulation: string, cmap: string, customThresholds: boolean, vmin: number, vmax: number }

function updateOptions (target: dat.GUIController, list: Array<string>) {
  // https://stackoverflow.com/questions/18260307/dat-gui-update-the-dropdown-list-values-for-a-controller
  // https://github.com/dataarts/dat.gui/issues/162
  target.domElement.children[0].innerHTML = list
    .map((v, i) => `<option ${(i === list.length - 1) ? 'selected' : ''} value='${v}'>${v}</option>`)
    .reduce((a, b) => a + b, '')
}

export function createGUIControls (availableSimulations) {
  const wells = Object.keys(availableSimulations)
  const initialWell = wells[wells.length - 1]
  const initialConnectionOptions = availableSimulations[initialWell]
  const initialConnection = initialConnectionOptions[initialConnectionOptions.length - 1]
  const textureSimulationOptions = [ 'pipepressure', 'annuluspressure', 'pipestress' ]
  const textureCmapOptions = [ 'inferno', 'viridis' ]

  const geometry: GeometryInfo = {
    well: initialWell,
    connection: initialConnection,
    radiusScaling: 100
  }

  const texture: TextureInfo = {
    simulation: textureSimulationOptions[0],
    cmap: textureCmapOptions[0],
    customThresholds: false,
    vmin: -10,
    vmax: 10,
  }

  const material = { useLightModel: false }
  const timeline = { speedup: 3 }

  const config = {
    geometry: new SubscribableConfig(geometry),
    texture: new SubscribableConfig({ ...geometry, ...texture }),
    material: new SubscribableConfig(material),
    timeline: new SubscribableConfig(timeline)
  }

  const datGui = new dat.GUI()
  const geometryFolder = datGui.addFolder('Geometry')
  const geometryControllers = {
    well: geometryFolder.add(geometry, 'well', wells),
    connection: geometryFolder.add(geometry, 'connection', availableSimulations[geometry.well]),
    radiusScaling: geometryFolder.add(geometry, 'radiusScaling', 1, 1000)
  }
  
  const textureFolder = datGui.addFolder('Texture')
  const textureControllers = [
    textureFolder.add(texture, 'simulation', textureSimulationOptions),
    textureFolder.add(texture, 'cmap', textureCmapOptions),
    textureFolder.add(texture, 'customThresholds'),
    textureFolder.add(texture, 'vmin', -10, 10),
    textureFolder.add(texture, 'vmax', -10, 10)
  ]
  geometryControllers.well.onFinishChange(newWell => {
    geometry.connection = availableSimulations[newWell][availableSimulations[newWell].length - 1]
    updateOptions(geometryControllers.connection, availableSimulations[newWell])
    config.geometry.next(geometry)
  })
  
  const materialFolder = datGui.addFolder('Material')
  materialFolder.add(material, 'useLightModel').onFinishChange(() => {
    config.material.next(material)
  })
  
  const timelineFolder = datGui.addFolder('Timeline')
  timelineFolder.add(timeline, 'speedup', 1, 15).onChange(() => {
    config.timeline.next(timeline)
  })

  geometryControllers.radiusScaling.onFinishChange(() => {
    config.geometry.next(geometry)
    config.texture.next({ ...geometry, ...texture })
  })
  geometryControllers.connection.onFinishChange(() => {
    config.geometry.next(geometry)
    config.texture.next({ ...geometry, ...texture })
  })

  textureControllers.forEach(controller => controller.onFinishChange(() => {
    const causesNoChange = !texture.customThresholds && (controller.property === 'vmin' || controller.property === 'vmax')
    if (causesNoChange) return
    config.texture.next({ ...geometry, ...texture })
  }))

  return { config }
}
