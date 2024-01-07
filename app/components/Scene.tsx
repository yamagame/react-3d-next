'use client'

import React, { useRef, useMemo, RefObject, createRef, MutableRefObject } from 'react'
import * as THREE from 'three'
import { HoverMesh } from './HoverMesh'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Text, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

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

type TextRef = { [index: string]: RefObject<THREE.Mesh> }

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

export const RenderScene = (
  props: SceneProps,
  scenes: SceneItem[],
  gltf: GLTFResult,
  textRef: MutableRefObject<TextRef>
) => {
  const fontProps = {
    font: 'NotoSansJP-Bold.ttf',
    fontSize: 2.5,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false,
  }
  return scenes.map((scene) => {
    if (scene.name === 'hi-building') return null
    if (scene.children.length > 0) {
      return (
        <group
          key={scene.name}
          scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
          position={scene.position ? new THREE.Vector3(...scene.position) : [0, 0, 0]}
          rotation={scene.rotation ? new THREE.Euler(...scene.rotation) : [0, 0, 0]}
        >
          {RenderScene(props, scene.children, gltf, textRef)}
        </group>
      )
    }
    if (scene.material && gltf.nodes[scene.name]) {
      const name = scene.name
      const label = props.geometories.find((v) => v.name === name)?.label
      const geometory = gltf.nodes[name].geometry
      const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
      const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
      return (
        <group key={`${name}-container`}>
          {label ? (
            <HoverMesh
              name={scene.name}
              key={scene.name}
              castShadow
              receiveShadow
              scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
              position={scene.position ? new THREE.Vector3(...scene.position) : [0, 0, 0]}
              rotation={scene.rotation ? new THREE.Euler(...scene.rotation) : [0, 0, 0]}
              geometry={gltf.nodes[scene.name].geometry}
              // material={gltf.materials[scene.material]}
            />
          ) : (
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
          )}
          {label ? (
            <Text
              key={`${name}-text`}
              ref={textRef.current[name]}
              position={center?.clone().add(size.multiply(new THREE.Vector3(0, 0.8, 0)))}
              {...fontProps}
            >
              {label}
            </Text>
          ) : null}
        </group>
      )
    }
  })
}

export const Scene = React.forwardRef((props: SceneProps, ref) => {
  const { nodes, materials } = useGLTF(props.gltf) as GLTFResult
  const textRef = useRef<TextRef>({})
  const color = useMemo(() => new THREE.Color(), [])

  useMemo(() => {
    Object.keys(nodes).forEach((name) => {
      textRef.current[name] = createRef<THREE.Mesh>()
    })
  }, [nodes])

  // テキストの向きをカメラに向ける
  useFrame(({ camera }) => {
    Object.keys(textRef.current).forEach((key) => {
      const text = textRef.current[key]
      text.current?.quaternion.copy(camera.quaternion)
      if (text.current?.material instanceof THREE.MeshBasicMaterial) {
        text.current.material.color.lerp(color.set('#2027fa'), 0.1)
      }
    })
  })

  return RenderScene(props, props.scenes, { nodes, materials } as GLTFResult, textRef)
})
Scene.displayName = 'Scene'
