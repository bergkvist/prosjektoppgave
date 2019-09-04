const d3 = require('d3')

const c1 = '#F4F3EE'
const c2 = '#231C07'

const xKey = 'Time (s)'
const yKey = 'Bottom hole pressure (bar)'

const getDomain = (data, key) => {
  const values = data.map(({ [key]: value }) => Number(value))
  return [d3.min(values), d3.max(values)]
}

function plot (data) {
  const margins = { top: 40, right: 40, bottom: 40, left: 40 }
  const width = window.innerWidth - margins.left - margins.right
  const height = window.innerHeight - margins.top - margins.bottom

  const svg = d3.select('#visualization').append('svg')
    .attr('width', width + margins.left + margins.right)
    .attr('height', height + margins.top + margins.bottom)

  const x = d3.scaleLinear()
    .domain(getDomain(data, xKey))
    .range([margins.left, width + margins.left])

  const y = d3.scaleLinear()
    .domain(getDomain(data, yKey))
    .range([height + margins.top, margins.top])

  svg.append('g')
    .attr('transform', `translate(${0},${height + margins.top})`)
    .call(d3.axisBottom(x))

  svg.append('g').attr('transform', `translate(${margins.left},${0})`)
    .call(d3.axisLeft(y))

  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(d => x(d[xKey]))
      .y(d => y(d[yKey]))
    )
}

;(async () => {
  d3.select('body')
    .style('overflow', 'hidden')
    .style('background-color', c1)

  d3.select('body')
    .append('p')
    .text('Loading ./trends.csv')
    .style('text-align', 'center')
    .style('line-height', window.innerHeight + 'px')
    .style('color', c2)

  const trends = await d3.csv('./trends.csv')

  d3.select('p').remove()

  console.log(trends)
  plot(trends)
})()
