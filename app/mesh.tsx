"use client"

import React, { useRef, useState } from "react"
import THREE from "three"
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { ThreeElements } from "@react-three/fiber"

export function Mesh(
  props: ThreeElements["mesh"] & {
    size?: typeof THREE.BoxGeometry.arguments
    object?: GLTF
    geometry?: any
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
      }}
      onPointerOut={(e) => {
        hover(false)
      }}
    >
      {!props.geometry && <boxGeometry args={props.size || [1, 1, 1]} />}
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  )
}
