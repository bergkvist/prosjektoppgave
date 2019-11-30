import * as BAS from 'three-bas'

type MaterialType = 'basic' | 'standard'

export function createMaterial (materialType: MaterialType, { time = { value: 0 }, dataTexture = { value: null } } = {}) {
  const Material = {
    'basic': BAS.BasicAnimationMaterial,
    'standard': BAS.StandardAnimationMaterial
  }[materialType]

  return new Material({
    uniforms: {
      time,
      dataTexture
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
      '  ? texture2D(dataTexture, vec2(time, md)).xyz',
      '  : vec3(0.3, 0.3, 0.3);' // Missing simulation data is gray
    ],
    fragmentDiffuse: [
      'diffuseColor.rgb *= vColor;'
    ],
  })
}