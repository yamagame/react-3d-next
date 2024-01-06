'use client'

import React, { useRef, useState } from 'react'
import THREE from 'three'
import { useControls } from 'leva'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { ThreeElements } from '@react-three/fiber'

export function HoverMesh(
  props: ThreeElements['mesh'] & {
    size?: typeof THREE.BoxGeometry.arguments
    object?: GLTF
    geometry?: any
    selected?: boolean
    focused?: boolean
  }
) {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, hover] = useState(false)
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
    </mesh>
  )
}