'use client'

import React, { useRef, useState } from 'react'
import THREE from 'three'
import { useControls } from 'leva'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { ThreeElements, useFrame } from '@react-three/fiber'

export function PointCamera(
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
  useFrame(({ clock }) => {
    const a = clock.getElapsedTime()
    // ref.current.rotation.x = a * speed[0]
    ref.current.rotation.y = a * 1
    // ref.current.rotation.z = a * 0.05
  })
  const [hovered, hover] = useState(false)
  const { roughness, metalness } = useControls({
    roughness: { value: 0.5, min: 0, max: 1 },
    metalness: { value: 0.5, min: 0, max: 1 },
  })
  const uselocalmatarial = hovered || props.hover
  return (
    <mesh
      {...props}
      ref={ref}
      onPointerOver={(e) => {
        hover(true)
        e.stopPropagation()
      }}
      onPointerOut={(e) => {
        hover(false)
        e.stopPropagation()
      }}
      material={props.material}
    >
      {!props.geometry && <boxGeometry args={props.size || [1, 1, 1]} />}
      {uselocalmatarial || !props.material ? (
        <meshStandardMaterial
          metalness={metalness}
          roughness={roughness}
          color={props.selected ? 'hotpink' : hovered || props.hover ? 'pink' : 'white'}
        />
      ) : null}
    </mesh>
  )
}
