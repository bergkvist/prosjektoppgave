import * as BAS from 'three-bas'

export function createMaterial (type: 'standard' | 'basic' = 'standard', { time = { value: 0 }, dataTexture = { value: null } } = {}) {
  const Material = (type === 'basic')
    ? BAS.BasicAnimationMaterial
    : BAS.StandardAnimationMaterial

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
      '  : vec3(0.01, 0.01, 0.01);' // Missing simulation data is gray
    ],
    fragmentDiffuse: [
      'diffuseColor.rgb *= vColor;'
    ],
  })
}