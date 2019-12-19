/**
 * Author: Tobias Bergkvist
 * Purpose: Abstract away everything related to the timeline at the bottom of the screen.
 */

import RangeTouch from 'rangetouch'  // This is used to make the range input work better on touch devices

export default class Timeline {
  inputElement: HTMLInputElement = null
  timestampElement: HTMLDivElement = null
  min: number = 0
  max: number = 100
  step: number = 0.1
  time: number = this.min
  normalizedTime: number = 0
  speedup: number = 3
  paused: boolean = false
  imageUrl: string = ''

  constructor(inputElement: HTMLInputElement, timestampElement: HTMLDivElement) {
    new RangeTouch(inputElement, { addCSS: false, thumbWidth: 15, watch: false })
    this.inputElement = inputElement
    this.timestampElement = timestampElement
    this.update()
    
    this.inputElement.oninput = () => {
      this.time = this.inputElement.valueAsNumber
      this.update()
    }
    // IE11 Doesn't support oninput for some reason, so for this we will instead use onchange (which works poorly in other browsers)
    this.inputElement.onchange = this.inputElement.oninput  // Could this cause problems with performance?

    this.timestampElement.onmousedown = () => this.setPlayer({ paused: !this.paused })
  }

  update() {
    this.timestampElement.innerHTML = `${this.time.toFixed(1)} s <br /><div style="color:gray; font-size:10px">(${this.speedup.toFixed(0)}x)</div>`
    this.inputElement.value = String(this.time)
    this.inputElement.min = String(this.min)
    this.inputElement.max = String(this.max)
    this.inputElement.step = String(this.step)
    this.normalizedTime = (this.time - this.min) / (this.max - this.min)
  }
  
  setTimeDimensions({ min = this.min, max = this.max, step = this.step } = {}) {
    this.min = min
    this.max = max
    this.step = step
    this.time = min
    this.update()
  }

  setImageUrl(imageUrl: string) {
    this.inputElement.style.backgroundImage = `url(${imageUrl})`
    this.update()
  }

  setPlayer({ paused }: { paused: boolean }) {
    this.paused = paused
    if (this.paused) {
      this.timestampElement.style.backgroundColor = 'maroon'
    } else {
      this.timestampElement.style.backgroundColor = '#111111'
    }
  }

  addTime(dt: number) {
    if (this.paused) return
    this.time = this.min + (this.time - this.min + this.speedup * dt / 1000) % (this.max - this.min)
    this.update()
  }
}
