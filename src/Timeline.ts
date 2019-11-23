export default class Timeline {
    inputElement: HTMLInputElement = null
    timestampElement: HTMLDivElement = null
    min: number = 0
    max: number = 278200
    time: number = 0
    normalizedTime: number = 0
    speedup: number = 3
    paused: boolean = false

    constructor(inputElement: HTMLInputElement, timestampElement: HTMLDivElement) {
      this.inputElement = inputElement
      this.timestampElement = timestampElement
      this.time = this.min
      this.inputElement.step = '100'
      this.setImage()
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
      this.normalizedTime = (this.time - this.min) / (this.max - this.min)
    }
  
    setImage(url: string = require('./data/viridis.png')) {
      this.inputElement.style.backgroundImage = `url(${url})`
    }

    updateTime(dt: number) {
      if (this.paused) return
      this.time = this.min + (this.time - this.min + this.speedup * dt) % (this.max - this.min)
      this.update()
    }
  }
  