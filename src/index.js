import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'stats-js'
import { dsv } from 'd3'
import * as R from 'ramda'

const allStats = [0, 1, 2].map(panel => {
  const stats = new Stats()
  stats.dom.style.cssText = `position:absolute;top:${50*panel}px;left:${0}px;`
  stats.showPanel(panel)
  return stats
})

const camera = new THREE.PerspectiveCamera(70)
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
new OrbitControls(camera)

const addLight = (x, y, z)  => {
  const light = new THREE.DirectionalLight(0xFFFFFF, 1)
  light.position.set(x, y, z)
  scene.add(light)
  return light
}
addLight(20,20,20)
addLight(-10,-10,-10)

async function getPath() {
  const path = await dsv(';', './well_path.csv')
  return R.tail(path.map(segment => ({
    md: Number(segment['Md']) / 100,
    inc: Number(segment['Inc']) * Math.PI / 180,
    azi: Number(segment['Azi']) * Math.PI / 180
  })).map((segment, i, arr) => ((i === 0) ? null : {
    length: arr[i].md - arr[i-1].md,
    ...segment
  })))
}

;(async () => {
  const pipes = await getPath()
  
  console.log(pipes)/*
  const pipes = [
    { inc: 0,               azi: 0, length: 4   },
    { inc: 1 * Math.PI / 8, azi: 0, length: 0.5 },
    { inc: 1 * Math.PI / 4, azi: 0, length: 0.5 },
    { inc: 3 * Math.PI / 8, azi: 0, length: 0.5 },
    { inc: 1 * Math.PI / 2, azi: 0, length: 2   },
    { inc: 3 * Math.PI / 8, azi: 0, length: 0.5 },
    { inc: 1 * Math.PI / 4, azi: 0, length: 4   }
  ]*/

  const meshes = [...createWaterBox(10), ...createCylinderMeshes(pipes)]

  function createCylinderMeshes (pipes) {
    const vs = pipes.map(pipe => new THREE.Vector3(0, -pipe.length / 2, 0)
      .applyEuler(new THREE.Euler(0, pipe.azi, pipe.inc)))

    const ps = vs.reduce((ps, _, i) => {
      if (i === 0) {
        ps[i] = vs[i]
        return ps
      }
    
      ps[i] = ps[i].add(ps[i-1]).add(vs[i-1]).add(vs[i])
      return ps
    
    }, vs.map(() => new THREE.Vector3(0, 0, 0)))

    
    return ps.map((p, i) => createCylinderMesh({ 
      px: p.x, 
      py: p.y, 
      pz: p.z,
      ry: pipes[i].azi,
      rz: pipes[i].inc,
      radius: pipes[i].radius, 
      height: pipes[i].length
    }))
  }

  function createCylinderMesh ({ radius = 0.1, height = 1, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0 }) {
    const RADIUS_SEGMENTS = 20
    const HEIGHT_SEGMENTS = 5
    const geometry = new THREE.CylinderGeometry(radius, radius, height, RADIUS_SEGMENTS, HEIGHT_SEGMENTS)
    const material = new THREE.MeshNormalMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(px, py, pz)
    mesh.rotation.set(rx, ry, rz)
    return mesh
  }

  function createWaterBox (height) {
    const geometry = new THREE.BoxGeometry(10, height, 10)
    return [THREE.FrontSide, THREE.BackSide].map(side => {
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color('blue'),
        opacity: 0.5,
        transparent: true,
        side
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.y = -height/2 - 0.001
      return mesh
    })
  }

  function onresize ({ camera, renderer }) {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  function init() {
    camera.position.z = 10
    document.body.appendChild(renderer.domElement)
    allStats.forEach(stats => document.body.appendChild(stats.dom))
    meshes.forEach(mesh => scene.add(mesh))
    onresize({ renderer, camera })
    window.addEventListener('resize', () => onresize({ camera, renderer }))
  }

  const animationIterator = async function * () { 
    for (;;) {
      const timestamp = await new Promise(resolve => requestAnimationFrame(resolve))
      allStats.forEach(stats => stats.update())
      renderer.render(scene, camera)
      yield timestamp
    }
  }

  const animate = async () => {
    for await (const _timestamp of animationIterator()) {

    }
  }
  init()
  animate()

})()