export default class Timeline {
    input: HTMLInputElement = null

    constructor(input: HTMLInputElement) {
      this.input = input
      this.input.value = '0'
      this.input.step = '0.1'
      this.input.min = '0'
      this.input.max = '278.2'
  
      this.onresize()
      this.setImage()
    }
  
    onresize() {
      const width = window.innerWidth * 0.85
      const height = window.innerHeight * 0.05
      this.input.width = width
      this.input.height = height
      this.input.style.backgroundSize = `${width}px ${height}px`
    }
  
    setImage(url: string = require('./data/viridis.png')) {
      this.input.style.backgroundImage = `url(${url})`
    }

    getNormalizedTime() {
        return (Number(this.input.value) - Number(this.input.min)) / (Number(this.input.max) - Number(this.input.min))
    }
  }
  