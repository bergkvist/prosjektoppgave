import * as BAS from 'three-bas'
import { DataTexture, RGBAFormat, Mesh } from 'three'

function createDataTexture (imageData: ImageData): DataTexture {
  if (imageData.data.length !== 4 * imageData.width * imageData.height) {
    console.log(imageData)
    throw Error(`createDataTexture: image data (${imageData.data.length / 4}) does not match width * height (${imageData.width * imageData.height})`)
  }
  return new DataTexture(
    new Uint8Array(imageData.data), 
    imageData.width, 
    imageData.height,
    RGBAFormat
  )
}

function createMaterialConfig (dataTexture: DataTexture, time: number) {
  return {
    uniforms: {
      time: { value: time },
      dataTexture: { value: dataTexture },
    },
    vertexParameters: [
      'uniform highp float time;',
      'uniform sampler2D dataTexture;',
      'attribute highp float md;',
    ],
    varyingParameters: [
      'varying vec3 vColor;',
    ],
    vertexColor: [
      'vColor = (md >= 0.0 && md <= 1.0)',
      '  ? texture2D(dataTexture, vec2(time, md)).xyz //vec3(md, time, 0.0)',
      '  : vec3(0.3, 0.3, 0.3);' // Missing simulation data is gray
    ],
    fragmentDiffuse: [
      'diffuseColor.rgb *= vColor;'
    ],
  }
}

type MaterialType = 'basic' | 'standard'
function _createBufferAnimationMaterial(materialType: MaterialType, config) {
  if (materialType === 'basic') {
    return new BAS.BasicAnimationMaterial(config)
  }

  if (materialType === 'standard') {
    return new BAS.StandardAnimationMaterial(config)
  }

  throw Error(`Invalid materialType: ${materialType}`)
}

export function createBufferAnimationMaterial (materialType: MaterialType, imageData: ImageData, time: number = 0) {
  const dataTexture = createDataTexture(imageData)
  const config = createMaterialConfig(dataTexture, time)
  return _createBufferAnimationMaterial(materialType, config)
}

export function changeMaterial (wellPath: Mesh, materialType: MaterialType) {
  if (!wellPath.material['uniforms']) throw Error('Invalid mesh (does not have uniforms)')
  const config = createMaterialConfig(
    wellPath.material['uniforms'].dataTexture.value,
    wellPath.material['uniforms'].time.value
  )
  wellPath.material = _createBufferAnimationMaterial(materialType, config)
}