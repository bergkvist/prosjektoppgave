import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

export function createLabel (text, position) {
  const casingShoeDiv = document.createElement('div')
  casingShoeDiv.className = 'label'
  casingShoeDiv.textContent = text
  casingShoeDiv.style.marginTop = '-1em'
  casingShoeDiv.style.color = 'white'
  casingShoeDiv.style.backgroundColor = 'rgba(0,0,0,0.6)'
  casingShoeDiv.style.fontFamily = 'sans serif'
  casingShoeDiv.style.fontSize = '16px'
  const casingShoeLabel = new CSS2DObject(casingShoeDiv)
  casingShoeLabel.position.set(position.x, position.y, position.z)
  return casingShoeLabel
}

export function createLabelRenderer () {
  const labelRenderer = new CSS2DRenderer()
  document.body.appendChild(labelRenderer.domElement)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  return labelRenderer
}