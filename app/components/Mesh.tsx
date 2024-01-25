'use client'

import { useControls } from 'leva'
import React, { useRef, useState } from 'react'
import THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { ThreeElements } from '@react-three/fiber'

export function Mesh(
  props: ThreeElements['mesh'] & {
    size?: typeof THREE.BoxGeometry.arguments
    object?: GLTF
    geometry?: any
    hover?: boolean
  }
) {
  const { hover } = props
  const ref = useRef<THREE.Mesh>(null!)
  const uselocalmatarial = hover
  return (
    <mesh {...props} ref={ref}>
      {!props.geometry && <boxGeometry args={props.size || [1, 1, 1]} />}
      {uselocalmatarial || !props.material ? (
        // <meshPhongMaterial color={hover ? 'pink' : 'white'} />
        <meshStandardMaterial metalness={0.5} roughness={0.5} color={hover ? 'pink' : 'white'} />
      ) : null}
    </mesh>
  )
}
