import * as BAS from 'three-bas'
import { DataTexture, RGBAFormat, Mesh, Uniform, Vector3 } from 'three'

type MaterialType = 'basic' | 'standard'

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

function createMaterialConfig () {
  return {
    uniforms: {
      time: { value: 0 },
      dataTexture: { value: null },
      hasTexture: { value: false },
      defaultColor: new Uniform(new Vector3(0.3, 0.3, 0.3)) // Missing simulation data is gray
    },
    vertexParameters: [
      'uniform highp float time;',
      'uniform sampler2D dataTexture;',
      'uniform bool hasTexture;',
      'uniform vec3 defaultColor;',
      'attribute highp float md;',
    ],
    varyingParameters: [
      'varying vec3 vColor;',
    ],
    vertexColor: [
      'vColor = (md >= 0.0 && md <= 1.0 && hasTexture)',
      '  ? texture2D(dataTexture, vec2(time, md)).xyz //vec3(md, time, 0.0)',
      '  : defaultColor;'
    ],
    fragmentDiffuse: [
      'diffuseColor.rgb *= vColor;'
    ],
  }
}

function createMaterialClass(materialType: MaterialType) {
  if (materialType === 'standard') return BAS.StandardAnimationMaterial
  if (materialType === 'basic') return BAS.BasicAnimationMaterial
}

export function createBufferAnimationMaterial (materialType: MaterialType = 'basic') {
  const materialConfig = createMaterialConfig()
  const Material = createMaterialClass(materialType)
  const material = new Material(materialConfig)
  return material
}

export function changeMaterialType (mesh: Mesh, materialType: MaterialType) {
  if (!mesh.material['uniforms']) throw Error('Invalid mesh (does not have uniforms)')
  const newMaterial = createBufferAnimationMaterial(materialType)
  newMaterial['uniforms'].dataTexture = mesh.material['uniforms'].dataTexture
  newMaterial['uniforms'].time = mesh.material['uniforms'].time
  newMaterial['uniforms'].hasTexture = mesh.material['uniforms'].hasTexture
  newMaterial['uniforms'].defaultColor = mesh.material['uniforms'].defaultColor
  mesh.material = newMaterial
}

export function changeMaterialImage (mesh: Mesh, imageData: ImageData) {
  mesh.material['uniforms'].dataTexture.value = createDataTexture(imageData)
  mesh.material['uniforms'].hasTexture.value = true
}