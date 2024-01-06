import { GLTFStructureLoader } from 'gltfjsx/dist/index.js'
// const { GLTFStructureLoader } = require('gltfjsx')
import fs from 'fs/promises'

async function main() {
  const filename = process.argv[2]
  const loader = new GLTFStructureLoader()
  const data = await fs.readFile(filename)
  // const data = await fs.readFile('./public/cubes-transformed.glb')
  const scene = await new Promise((res) => loader.parse(data, '', res))
  const parse = (children) => {
    const result = [];
    [...children].forEach(v => {
      const r = {}
      if (v.name) {
        r.name = v.name
      }
      if (v.scale) {
        r.scale = [v.scale.x, v.scale.y, v.scale.z]
      }
      if (v.position) {
        r.position = [v.position.x, v.position.y, v.position.z]
      }
      if (v.rotation) {
        r.rotation = [v.rotation.x, v.rotation.y, v.rotation.z]
      }
      if (v.material?.name) {
        r.material = v.material.name
        // result.push({ name: v.name, scale: v.scale, position: v.position, material: v.material?.name })
      }
      if (v.children) {
        r.children = parse(v.children)
      }
      result.push(r)
    })
    return result
  }
  const result = parse(scene.scenes)
  // console.log(scene.scenes[0].children)
  // console.log(scene.scenes[0].children.map(v => ({ name: v.name, scale: v.scale, position: v.position, material: v.material.name })))
  console.log(JSON.stringify({ scenes: result }, null, "  "))
}

main().then()
