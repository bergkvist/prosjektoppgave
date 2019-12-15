import * as dat from 'dat.gui'
import { BehaviorSubject as SubscribableConfig } from 'rxjs'

function updateOptions (target: dat.GUIController, list: Array<string>) {
  // https://stackoverflow.com/questions/18260307/dat-gui-update-the-dropdown-list-values-for-a-controller
  // https://github.com/dataarts/dat.gui/issues/162
  target.domElement.children[0].innerHTML = list
    .map((v, i) => `<option ${(i === list.length - 1) ? 'selected' : ''} value='${v}'>${v}</option>`)
    .reduce((a, b) => a + b, '')
}

export function createGUIControls (availableSimulations) {
  const wells = Object.keys(availableSimulations)

  const options = {
    geometry: {
      well: wells,
      connection: availableSimulations[wells[wells.length - 1]],
      radiusScaling: { min: 1, max: 1000 }
    },
    texture: {
      simulation: [ 'pipepressure', 'annuluspressure', 'pipestress' ],
      colormap: [ 'inferno', 'viridis', 'coolwarm', 'twilight', 'plasma', 'jet' ]
    },
    presentation: {
      timelineSpeedup: { min: 1, max: 15 }
    }
  }

  const data = {
    geometry: {
      well: options.geometry.well[options.geometry.well.length - 1],
      connection: options.geometry.connection[options.geometry.connection.length - 1],
      radiusScaling: 300
    },
    texture: {
      simulation: options.texture.simulation[0],
      colormap: options.texture.colormap[0],
      customThresholds: false,
      vmin: -10,
      vmax: 10,
    },
    presentation: {
      reflectiveSurface: true,
      showCasingShoes: true,
      timelineSpeedup: 3
    }
  }

  const datGui = new dat.GUI()
  const folder = {
    geometry: datGui.addFolder('Geometry'),
    texture: datGui.addFolder('Texture'),
    presentation: datGui.addFolder('Presentation')
  }

  const controller = {
    geometry: {
      well: folder.geometry.add(data.geometry, 'well', options.geometry.well),
      connection: folder.geometry.add(data.geometry, 'connection', options.geometry.connection),
      radiusScaling: folder.geometry.add(data.geometry, 'radiusScaling', options.geometry.radiusScaling.min, options.geometry.radiusScaling.max)
    },
    texture: {
      simulation: folder.texture.add(data.texture, 'simulation', options.texture.simulation),
      colormap: folder.texture.add(data.texture, 'colormap', options.texture.colormap),
      customThresholds: folder.texture.add(data.texture, 'customThresholds'),
      vmax: (data.texture.customThresholds) ? folder.texture.add(data.texture, 'vmax') : null,
      vmin: (data.texture.customThresholds) ? folder.texture.add(data.texture, 'vmin') : null, 
    },
    presentation: {
      reflectiveSurface: folder.presentation.add(data.presentation, 'reflectiveSurface'),
      showCasingShoes: folder.presentation.add(data.presentation, 'showCasingShoes'),
      timelineSpeedup: folder.presentation.add(data.presentation, 'timelineSpeedup', options.presentation.timelineSpeedup.min, options.presentation.timelineSpeedup.max),
    }
  }

  const configEmitter = {
    geometry: new SubscribableConfig(data.geometry),
    texture: new SubscribableConfig({ ...data.geometry, ...data.texture }),
    reflectiveSurface: new SubscribableConfig(data.presentation.reflectiveSurface),
    showCasingShoes: new SubscribableConfig(data.presentation.showCasingShoes),
    timelineSpeedup: new SubscribableConfig(data.presentation.timelineSpeedup)
  }

  const newConfig = {
    geometry: () => {
      configEmitter.geometry.next(data.geometry)
      configEmitter.texture.next({ ...data.texture, ...data.geometry })
    },
    texture: () => {
      configEmitter.texture.next({ ...data.texture, ...data.geometry })
    },
    reflectiveSurface: () => {
      configEmitter.reflectiveSurface.next(data.presentation.reflectiveSurface)
    },
    showCasingShoes: () => {
      configEmitter.showCasingShoes.next(data.presentation.showCasingShoes)
    },
    timelineSpeedup: () => {
      configEmitter.timelineSpeedup.next(data.presentation.timelineSpeedup)
    }
  }
  controller.geometry.connection.onFinishChange(newConfig.geometry)
  controller.geometry.radiusScaling.onFinishChange(newConfig.geometry)
  controller.texture.simulation.onFinishChange(newConfig.texture)
  controller.texture.colormap.onFinishChange(newConfig.texture)
  controller.presentation.reflectiveSurface.onFinishChange(newConfig.reflectiveSurface)
  controller.presentation.showCasingShoes.onFinishChange(newConfig.showCasingShoes)
  controller.presentation.timelineSpeedup.onChange(newConfig.timelineSpeedup)

  controller.geometry.well.onFinishChange(newWell => {
    data.geometry.connection = availableSimulations[newWell][availableSimulations[newWell].length - 1]
    updateOptions(controller.geometry.connection, availableSimulations[newWell])
    newConfig.geometry()
  })
  
  controller.texture.customThresholds.onFinishChange(customThresholds => {
    if (customThresholds) {
      if (controller.texture.vmax !== null || controller.texture.vmax !== null) throw Error('Wat')
      controller.texture.vmax = folder.texture.add(data.texture, 'vmax')
      controller.texture.vmin = folder.texture.add(data.texture, 'vmin')
      controller.texture.vmax.onFinishChange(newConfig.texture)
      controller.texture.vmin.onFinishChange(newConfig.texture)
    } else {
      folder.texture.remove(controller.texture.vmax)
      folder.texture.remove(controller.texture.vmin)
      controller.texture.vmin = null
      controller.texture.vmax = null
    }
    newConfig.texture()
  })
  
  return { configEmitter }
}
