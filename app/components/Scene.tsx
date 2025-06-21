'use client'

import React, { useRef, useMemo, useState, RefObject, createRef, MutableRefObject } from 'react'
import * as THREE from 'three'
import { HoverMesh } from './HoverMesh'
import { PointCamera } from './PointCamera'
import { Mesh } from './Mesh'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Text, useGLTF } from '@react-three/drei'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { useTimeout, TimerHook } from '../hook/timeout'

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
  names?: string[]
  collider?: {
    ignore?: string[]
  }
}

export type SceneProps = {
  gltfResult: GLTFResult
  geometories: Geometory[]
  camera: Camera
  collider: string // 'bbox' | 'model'
  selectObject: string
  focusObject: string
  scenes: SceneItem[]
  hidden?: string[]
  pointCamera: string
  focusBuilding: (name: string) => void
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

const fontProps = {
  font: "Mplus2-Black.ttf",
  fontSize: 2.7,
  letterSpacing: 0.05,
  lineHeight: 1,
  outlineWidth: 0.2,
  outlineColor: 'white',
  'material-toneMapped': true,
  depthOffset: -3000,
}

export const RenderScene = (
  props: SceneProps & {
    scenes: SceneItem[]
    gltfResult: GLTFResult
    textRef: MutableRefObject<TextRef>
    geo: Geometory | null
    hover: boolean
    hoverTimerRef: TimerHook
  }
) => {
  const { scenes, gltfResult, textRef, geo, hover } = props
  const [hoverObject, setHoverObject] = useState('')
  return scenes.map((scene) => {
    if (props.hidden && props.hidden.indexOf(scene.name) >= 0) return null
    if (props.geometories.some((v) => v.bbox === scene.name)) {
      const name = scene.name
      const label = props.geometories.find((v) => v.bbox === name)?.label
      if (gltfResult.nodes[name]) {
        const geometory = gltfResult.nodes[name].geometry
        const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
        const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
        return (
          <group key={`${name}-container`}>
            {label ? (
              <Text
                key={`${name}-text`}
                ref={textRef.current[name]}
                position={center
                  ?.clone()
                  .add(size.multiply(new THREE.Vector3(0, 0.5, 0)))
                  .add(new THREE.Vector3(0, 5, 0))}
                scale={2}
                color={props.focusObject === name ? '#ff0055' : '#0e63b8'}
                {...fontProps}
              >
                {label}
              </Text>
            ) : null}
          </group>
        )
      } else {
        console.log(`not found ${name}`)
        return null
      }
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
      if (local_geo) {
        return (
          <group
            key={name}
            name={name}
            scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
            position={new THREE.Vector3(...position)}
            rotation={new THREE.Euler(...rotation)}
            onPointerOver={(e) => {
              if (cgeo && local_geo && local_geo.name) {
                const name = local_geo.name
                props.hoverTimerRef.set(() => {
                  setHoverObject(name)
                }, 1)
                e.stopPropagation()
              }
            }}
            onPointerOut={(e) => {
              props.hoverTimerRef.set(() => {
                setHoverObject('')
              }, 3)
              e.stopPropagation()
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (local_geo && local_geo.bbox) {
                if (e.delta > 3) {
                  e.stopPropagation()
                  return
                }
                props.focusBuilding(local_geo.bbox)
                e.stopPropagation()
              }
            }}
          >
            <RenderScene
              {...props}
              scenes={scene.children}
              gltfResult={gltfResult}
              textRef={textRef}
              geo={local_geo}
              hover={hoverObject == local_geo?.name || hover}
              hoverTimerRef={props.hoverTimerRef}
            />
          </group>
        )
      }
      return (
        <group
          key={name}
          name={name}
          scale={scene.scale ? new THREE.Vector3(...scene.scale) : [1, 1, 1]}
          position={new THREE.Vector3(...position)}
          rotation={new THREE.Euler(...rotation)}
        >
          <RenderScene
            {...props}
            scenes={scene.children}
            gltfResult={gltfResult}
            textRef={textRef}
            geo={local_geo}
            hover={hover}
            hoverTimerRef={props.hoverTimerRef}
          />
        </group>
      )
    }
    if (scene.name.indexOf('point-camera') >= 0) {
      const name = scene.name
      if (name === props.pointCamera) {
        return null
      }
      // ポイントカメラ
      return (
        <PointCamera
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
          geometry={gltfResult.nodes[name].geometry}
          material={scene.material ? gltfResult.materials[scene.material] : null}
        />
      )
    } else if (gltfResult.nodes[scene.name]) {
      const name = scene.name
      const geometory = gltfResult.nodes[name].geometry
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
              hover={hover}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                if (e.delta > 3) {
                  e.stopPropagation()
                  return
                }
                props.focusBuilding(focusName)
                e.stopPropagation()
              }}
              geometry={gltfResult.nodes[scene.name].geometry}
              material={scene.material ? gltfResult.materials[scene.material] : null}
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
              geometry={gltfResult.nodes[scene.name].geometry}
              material={scene.material ? gltfResult.materials[scene.material] : null}
              hover={hover}
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
  const textRef = useRef<TextRef>({})
  const color = useMemo(() => new THREE.Color(), [])
  const hoverTimerRef = useTimeout()

  useMemo(() => {
    textRef.current = {}
    const buils: { [index: string]: string } = {}
    props.geometories.forEach((geo) => {
      if (geo.bbox) {
        buils[geo.bbox] = geo.name
      } else {
        buils[geo.name] = geo.name
      }
    })
    Object.keys(props.gltfResult?.nodes)
      .filter((name) => buils[name])
      .forEach((name) => {
        textRef.current[name] = createRef<THREE.Mesh>()
      })
  }, [props])

  // テキストの向きをカメラに向ける
  useFrame(({ camera }) => {
    Object.keys(textRef.current).forEach((key) => {
      const text = textRef.current[key]
      const distance = camera.position.distanceTo(text.current?.position || new THREE.Vector3())
      let scale = 2.0
      let distance_sqrt = Math.sqrt(distance)
      if (distance_sqrt < 12) scale = (2.0 * distance_sqrt) / 12 // 定数 12 は適当に決定
      text.current?.scale.setScalar(scale)
      text.current?.quaternion.copy(camera.quaternion)
      if (text.current?.material instanceof THREE.MeshBasicMaterial) {
        text.current.material.color.lerp(color.set('white'), 1.0)
      }
    })
  })

  return (
    <RenderScene
      {...props}
      scenes={props.scenes}
      textRef={textRef}
      geo={null}
      hover={false}
      hoverTimerRef={hoverTimerRef}
    />
  )
})
Scene.displayName = 'Scene'
