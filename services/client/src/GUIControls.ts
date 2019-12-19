/**
 * Author: Tobias Bergkvist
 * Purpose: Abstract away the config menu, and make it emit events based on what needs to happen.
 */

import * as dat from 'dat.gui'
import { BehaviorSubject as SubscribableConfig } from 'rxjs'
import { WellsAndConnections } from './loaders'


export function createGUIControls (availableWellsAndConnections: WellsAndConnections) {
  const wells = Object.keys(availableWellsAndConnections)

  const options = {
    geometry: {
      well: wells,
      connection: availableWellsAndConnections[wells[wells.length - 1]],
      radiusScaling: { min: 1, max: 1000 }
    },
    image: {
      simulation: [ 'pipepressure', 'annuluspressure', 'pipestress' ],
      colormap: [ 'turbo', 'inferno', 'viridis', 'coolwarm', 'twilight', 'plasma' ]
    },
    presentation: {
      timelineSpeedup: { min: 1, max: 15 }
    }
  }

  const data = {
    geometry: {
      well: 'Well_2',//options.geometry.well[options.geometry.well.length - 1],
      connection: 'Connection_3316mMD',//options.geometry.connection[options.geometry.connection.length - 1],
      radiusScaling: 300
    },
    image: {
      simulation: options.image.simulation[0],
      colormap: options.image.colormap[0],
      customThresholds: false,
      vmin: -10,
      vmax: 10,
    },
    presentation: {
      reflectiveSurface: true,
      showCasingShoes: true,
      showFps: false,
      timelineSpeedup: 3
    }
  }

  const datGui = new dat.GUI()
  const folder = {
    geometry: datGui.addFolder('Geometry'),
    image: datGui.addFolder('Image'),
    presentation: datGui.addFolder('Presentation')
  }

  const controller = {
    geometry: {
      well: folder.geometry.add(data.geometry, 'well', options.geometry.well),
      connection: folder.geometry.add(data.geometry, 'connection', options.geometry.connection),
      radiusScaling: folder.geometry.add(data.geometry, 'radiusScaling', 
        options.geometry.radiusScaling.min, 
        options.geometry.radiusScaling.max
      )
    },
    image: {
      simulation: folder.image.add(data.image, 'simulation', options.image.simulation),
      colormap: folder.image.add(data.image, 'colormap', options.image.colormap),
      customThresholds: folder.image.add(data.image, 'customThresholds'),
      vmax: (data.image.customThresholds) ? folder.image.add(data.image, 'vmax') : null,
      vmin: (data.image.customThresholds) ? folder.image.add(data.image, 'vmin') : null, 
    },
    presentation: {
      reflectiveSurface: folder.presentation.add(data.presentation, 'reflectiveSurface'),
      showCasingShoes: folder.presentation.add(data.presentation, 'showCasingShoes'),
      showFps: folder.presentation.add(data.presentation, 'showFps'),
      timelineSpeedup: folder.presentation.add(data.presentation, 'timelineSpeedup', 
        options.presentation.timelineSpeedup.min, 
        options.presentation.timelineSpeedup.max
      ),
    }
  }

  const configEmitter = {
    geometry: new SubscribableConfig(data.geometry),
    image: new SubscribableConfig({ ...data.geometry, ...data.image }),
    reflectiveSurface: new SubscribableConfig(data.presentation.reflectiveSurface),
    showCasingShoes: new SubscribableConfig(data.presentation.showCasingShoes),
    showFps: new SubscribableConfig(data.presentation.showFps),
    timelineSpeedup: new SubscribableConfig(data.presentation.timelineSpeedup)
  }

  const newConfig = {
    geometry: () => {
      configEmitter.geometry.next(data.geometry)
      configEmitter.image.next({ ...data.image, ...data.geometry })
    },
    image: () => {
      configEmitter.image.next({ ...data.image, ...data.geometry })
    },
    reflectiveSurface: () => {
      configEmitter.reflectiveSurface.next(data.presentation.reflectiveSurface)
    },
    showCasingShoes: () => {
      configEmitter.showCasingShoes.next(data.presentation.showCasingShoes)
    },
    showFps: () => {
      configEmitter.showFps.next(data.presentation.showFps)
    },
    timelineSpeedup: () => {
      configEmitter.timelineSpeedup.next(data.presentation.timelineSpeedup)
    }
  }
  controller.geometry.connection.onFinishChange(newConfig.geometry)
  controller.geometry.radiusScaling.onFinishChange(newConfig.geometry)
  controller.image.simulation.onFinishChange(newConfig.image)
  controller.image.colormap.onFinishChange(newConfig.image)
  controller.presentation.reflectiveSurface.onFinishChange(newConfig.reflectiveSurface)
  controller.presentation.showCasingShoes.onFinishChange(newConfig.showCasingShoes)
  controller.presentation.timelineSpeedup.onChange(newConfig.timelineSpeedup)
  controller.presentation.showFps.onChange(newConfig.showFps)

  controller.geometry.well.onFinishChange(newWell => {
    data.geometry.connection = availableWellsAndConnections[newWell][availableWellsAndConnections[newWell].length - 1]
    updateOptions(controller.geometry.connection, availableWellsAndConnections[newWell])
    newConfig.geometry()
  })
  
  controller.image.customThresholds.onFinishChange(customThresholds => {
    if (customThresholds) {
      if (controller.image.vmax !== null || controller.image.vmax !== null) throw Error('Wat')
      controller.image.vmax = folder.image.add(data.image, 'vmax')
      controller.image.vmin = folder.image.add(data.image, 'vmin')
      controller.image.vmax.onFinishChange(newConfig.image)
      controller.image.vmin.onFinishChange(newConfig.image)
    } else {
      folder.image.remove(controller.image.vmax)
      folder.image.remove(controller.image.vmin)
      controller.image.vmin = null
      controller.image.vmax = null
    }
    newConfig.image()
  })
  
  return configEmitter
}


function updateOptions (target: dat.GUIController, list: Array<string>) {
  // https://stackoverflow.com/questions/18260307/dat-gui-update-the-dropdown-list-values-for-a-controller
  // https://github.com/dataarts/dat.gui/issues/162
  target.domElement.children[0].innerHTML = list
    .map((v, i) => `<option ${(i === list.length - 1) ? 'selected' : ''} value='${v}'>${v}</option>`)
    .reduce((a, b) => a + b, '')
}