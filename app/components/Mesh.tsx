'use client'

import React, { useRef, useState } from 'react'
import THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { ThreeElements } from '@react-three/fiber'

export function Mesh(
  props: ThreeElements['mesh'] & {
    size?: typeof THREE.BoxGeometry.arguments
    object?: GLTF
    geometry?: any
  }
) {
  const ref = useRef<THREE.Mesh>(null!)
  return (
    <mesh {...props} ref={ref}>
      {!props.geometry && <boxGeometry args={props.size || [1, 1, 1]} />}
      {props.material ? null : <meshStandardMaterial />}
    </mesh>
  )
}
