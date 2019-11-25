import RangeTouch from 'rangetouch'

export const seconds = (s: number) => 1000 * s

export default class Timeline {
    inputElement: HTMLInputElement = null
    timestampElement: HTMLDivElement = null
    min: number = 0
    max: number = seconds(100)
    step: number = seconds(0.1)
    time: number = 0
    normalizedTime: number = 0
    speedup: number = 3
    paused: boolean = false

    constructor(inputElement: HTMLInputElement, timestampElement: HTMLDivElement) {
      new RangeTouch(inputElement, { addCSS: false, thumbWidth: 15, watch: false })
      this.inputElement = inputElement
      this.timestampElement = timestampElement
      //this.set()
      this.update()

      this.inputElement.oninput = () => {
        this.time = Number(this.inputElement.value)
        this.update()
      }

      this.timestampElement.onmousedown = this.timestampElement.ontouchstart = () => {
        this.paused = !this.paused
        if (this.paused) {
          this.timestampElement.style.backgroundColor = 'maroon'
        } else {
          this.timestampElement.style.backgroundColor = '#111111'
        }
      }
    }

    update() {
      this.timestampElement.innerHTML = `${(this.time / 1000).toFixed(1)} s <br /><div style="color:gray; font-size:10px">(${this.speedup}x)</div>`
      this.inputElement.value = String(this.time)
      this.inputElement.min = String(this.min)
      this.inputElement.max = String(this.max)
      this.inputElement.step = String(this.step)
      this.normalizedTime = (this.time - this.min) / (this.max - this.min)
    }
    
    set({ imageUrl = require('./data/viridis.png'), min = 0, max = seconds(100), step = seconds(0.1) } = {}) {
      this.inputElement.style.backgroundImage = `url(${imageUrl})`
      this.min = min
      this.max = max
      this.step = step
      this.time = min
      this.update()
    }

    addTime(dt: number) {
      if (this.paused) return
      this.time = this.min + (this.time - this.min + this.speedup * dt) % (this.max - this.min)
      this.update()
    }
  }
  