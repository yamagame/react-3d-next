'use client'

import React, { useRef, useMemo, useState, useEffect, RefObject, createRef, useTransition } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { useGLTF } from '@react-three/drei'

export type GLTFResult = GLTF & {
  nodes: { [index: string]: THREE.Mesh }
  materials: { [index: string]: any }
}

export type SceneItem = {
  name: string
  material?: string
  scale?: number[]
  position?: number[]
  rotation?: number[]
  children: SceneItem[]
}

export type SceneProps = {
  gltf: string
  geometories: { name: string; label?: string }[]
  camera: {
    target: number[]
    position: number[]
    distance: { max: number }
  }
  collider: string // bbox or mesh
  scenes: SceneItem[]
  setOnRecognizing: (state: boolean) => void
  setRecognizedText: (text: string) => void
  setOnUsingGeolocation: (state: boolean) => void
}

const find = (scenes: SceneItem[], name: string): SceneItem | null => {
  for (let i = 0; i < scenes.length; i++) {
    const v = scenes[i]
    if (v.name === name) return v
    if (v.children.length > 0) {
      return find(v.children, name)
    }
  }
  return null
}

export const RenderScene = (props: SceneProps, scenes: SceneItem[], gltf: GLTFResult) => {
  return scenes.map((scene) => {
    if (scene.children.length > 0) {
      return (
        <group
          key={scene.name}
          scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
          position={scene.position ? new THREE.Vector3(...scene.position) : [0, 0, 0]}
          rotation={scene.rotation ? new THREE.Euler(...scene.rotation) : [0, 0, 0]}
        >
          {RenderScene(props, scene.children, gltf)}
        </group>
      )
    }
    if (scene.material && gltf.nodes[scene.name]) {
      return (
        <mesh
          name={scene.name}
          key={scene.name}
          castShadow
          receiveShadow
          scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
          position={scene.position ? new THREE.Vector3(...scene.position) : [0, 0, 0]}
          rotation={scene.rotation ? new THREE.Euler(...scene.rotation) : [0, 0, 0]}
          geometry={gltf.nodes[scene.name].geometry}
          material={gltf.materials[scene.material]}
        />
      )
    }
  })
}

export const Scene = React.forwardRef((props: SceneProps, ref) => {
  const { nodes, materials } = useGLTF(props.gltf) as GLTFResult
  return RenderScene(props, props.scenes, { nodes, materials } as GLTFResult)
})
Scene.displayName = 'Scene'
