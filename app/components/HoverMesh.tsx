'use client'

import React, { useRef, useState } from 'react'
import THREE from 'three'
import { useControls } from 'leva'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { ThreeElements } from '@react-three/fiber'
import { useTimeout } from '../hook/timeout'

export function HoverMesh(
  props: ThreeElements['mesh'] & {
    size?: typeof THREE.BoxGeometry.arguments
    object?: GLTF
    geometry?: any
    selected?: boolean
    focused?: boolean
    hover?: boolean
  }
) {
  const ref = useRef<THREE.Mesh>(null!)
  const hoverArrayRef = useRef<boolean[]>([])
  const [hovered, hover] = useState(false)
  const hoverTimer = useTimeout()
  const uselocalmatarial = hovered || props.hover

  return (
    <mesh
      {...props}
      ref={ref}
      onPointerOver={(e) => {
        hoverArrayRef.current.push(true)
        hoverTimer.set(() => {
          if (hoverArrayRef.current.length) {
            hover(hoverArrayRef.current[hoverArrayRef.current.length - 1])
          }
        }, 10)
        e.stopPropagation()
      }}
      onPointerOut={(e) => {
        hoverArrayRef.current.push(false)
        hoverTimer.set(() => {
          if (hoverArrayRef.current.length) {
            hover(hoverArrayRef.current[hoverArrayRef.current.length - 1])
          }
        }, 10)
        e.stopPropagation()
      }}
      material={props.material}
    >
      {!props.geometry && <boxGeometry args={props.size || [1, 1, 1]} />}
      {uselocalmatarial || !props.material ? (
        <meshStandardMaterial
          metalness={0.5}
          roughness={0.5}
          color={props.selected ? 'hotpink' : hovered || props.hover ? 'pink' : 'white'}
        />
      ) : null}
    </mesh>
  )
}
