'use client'

import React, { useRef, useMemo, RefObject, createRef, MutableRefObject } from 'react'
import * as THREE from 'three'
import { HoverMesh } from './HoverMesh'
import { Mesh } from './Mesh'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Text, useGLTF } from '@react-three/drei'
import { useFrame, ThreeEvent } from '@react-three/fiber'

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

export type Camera = {
  target: number[]
  position: number[]
  distance: { max: number }
  'point-cameras'?: { name: string }[]
}

export type Geometory = {
  name: string
  bbox?: string
  bname?: string
  label?: string
}

export type SceneProps = {
  gltf: string
  geometories: Geometory[]
  camera: Camera
  collider: string // bbox or mesh
  selectObject: string
  focusObject: string
  scenes: SceneItem[]
  hidden?: string[]
  pointCamera: string
  focusBuilding: (name: string) => void
  setOnRecognizing: (state: boolean) => void
  setRecognizedText: (text: string) => void
  setOnUsingGeolocation: (state: boolean) => void
  focusPointCamera: (name: string, center: THREE.Vector3) => void
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
  textRef: MutableRefObject<TextRef>,
  geo: Geometory | null
) => {
  const fontProps = {
    font: 'NotoSansJP-Bold.ttf',
    fontSize: 2.5,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false,
  }
  return scenes.map((scene) => {
    if (props.hidden && props.hidden.indexOf(scene.name) >= 0) return null
    if (props.geometories.some((v) => v.bbox === scene.name)) {
      const name = scene.name
      const label = props.geometories.find((v) => v.bbox === name)?.label
      const geometory = gltf.nodes[name].geometry
      const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
      const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
      return (
        <group key={`${name}-container`}>
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
    if (scene.children.length > 0) {
      const name = scene.name
      const position = scene.position ? scene.position : [0, 0, 0]
      const rotation = scene.rotation ? scene.rotation : [0, 0, 0]
      const cgeo = props.geometories.find((v) => v.name === name)
      let local_geo = geo ? { ...geo } : null
      if (cgeo) {
        local_geo = { ...cgeo }
      }
      return (
        <group
          key={name}
          scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
          position={new THREE.Vector3(...position)}
          rotation={new THREE.Euler(...rotation)}
          onPointerOver={(e) => {
            // console.log('over', geo)
            e.stopPropagation()
          }}
          onPointerOut={(e) => {
            // console.log('out', geo)
            e.stopPropagation()
          }}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (local_geo && local_geo.bbox) {
              if (e.delta > 1) {
                e.stopPropagation()
                return
              }
              props.focusBuilding(local_geo.bbox)
              e.stopPropagation()
            }
          }}
        >
          {RenderScene(props, scene.children, gltf, textRef, local_geo)}
        </group>
      )
    }
    if (props.camera['point-cameras']?.find((v) => v.name === scene.name)) {
      const name = scene.name
      if (name === props.pointCamera) {
        return null
      }
      // ポイントカメラ
      return (
        <HoverMesh
          key={name}
          // scale={0.1}
          castShadow
          receiveShadow
          scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
          position={scene.position ? new THREE.Vector3(...scene.position) : [0, 0, 0]}
          rotation={scene.rotation ? new THREE.Euler(...scene.rotation) : [0, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            // const center = gltf.nodes[name].geometry.boundingBox?.getCenter(new THREE.Vector3())
            const center = scene.position || [0, 0, 0]
            if (center) {
              props.focusPointCamera(name, new THREE.Vector3(...center))
            }
            e.stopPropagation()
          }}
          geometry={gltf.nodes[name].geometry}
          material={scene.material ? gltf.materials[scene.material] : null}
        />
      )
    } else if (gltf.nodes[scene.name]) {
      const name = scene.name
      const geometory = gltf.nodes[name].geometry
      const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
      const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
      const cgeo = props.geometories.find((v) => v.name === name)
      let local_geo = geo ? { ...geo } : null
      let label = null
      if (cgeo) {
        local_geo = cgeo
        if (!local_geo.bbox) {
          label = cgeo.label
        }
      }
      const focusName = local_geo?.bbox || local_geo?.name
      return (
        <group key={`${name}-container`}>
          {cgeo && focusName ? (
            <HoverMesh
              name={name}
              key={name}
              castShadow
              receiveShadow
              scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
              position={scene.position ? new THREE.Vector3(...scene.position) : [0, 0, 0]}
              rotation={scene.rotation ? new THREE.Euler(...scene.rotation) : [0, 0, 0]}
              selected={props.selectObject === name}
              focused={props.focusObject === name}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                if (e.delta > 1) {
                  e.stopPropagation()
                  return
                }
                props.focusBuilding(focusName)
                e.stopPropagation()
              }}
              geometry={gltf.nodes[scene.name].geometry}
              material={scene.material ? gltf.materials[scene.material] : null}
            />
          ) : (
            <Mesh
              name={name}
              key={name}
              castShadow
              receiveShadow
              scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
              position={scene.position ? new THREE.Vector3(...scene.position) : [0, 0, 0]}
              rotation={scene.rotation ? new THREE.Euler(...scene.rotation) : [0, 0, 0]}
              geometry={gltf.nodes[scene.name].geometry}
              material={scene.material ? gltf.materials[scene.material] : null}
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

  return RenderScene(props, props.scenes, { nodes, materials } as GLTFResult, textRef, null)
})
Scene.displayName = 'Scene'
