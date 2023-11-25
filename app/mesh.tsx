"use client"

import React, { useRef, useState } from "react"
import THREE from "three"
import { useControls } from "leva"
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { ThreeElements } from "@react-three/fiber"
// import { Center } from "@react-three/drei"

export function HoverMesh(
  props: ThreeElements["mesh"] & {
    size?: typeof THREE.BoxGeometry.arguments
    object?: GLTF
    geometry?: any
    selected?: boolean
    focused?: boolean
  }
) {
  const ref = useRef<THREE.Mesh>(null!)
  const { roughness, metalness } = useControls({
    roughness: { value: 0.5, min: 0, max: 1 },
    metalness: { value: 0.5, min: 0, max: 1 },
  })
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
    >
      {!props.geometry && <boxGeometry args={props.size || [1, 1, 1]} />}
      {/* <meshStandardMaterial color={hovered ? "hotpink" : "orange"} /> */}
      {/* <meshStandardMaterial envMapIntensity={0.25} /> */}
      <meshStandardMaterial
        metalness={metalness}
        roughness={roughness}
        color={props.selected ? "hotpink" : hovered ? "pink" : "white"}
      />
      {/* <shadowMaterial attach="material" color="#000" transparent={false} fog /> */}
    </mesh>
  )
}

export function Mesh(
  props: ThreeElements["mesh"] & {
    size?: typeof THREE.BoxGeometry.arguments
    object?: GLTF
    geometry?: any
  }
) {
  const ref = useRef<THREE.Mesh>(null!)
  // const { roughness, metalness } = useControls({
  //   roughness: { value: 0.5, min: 0, max: 1 },
  //   metalness: { value: 0.5, min: 0, max: 1 },
  // })
  // const [hovered, hover] = useState(false)
  return (
    <mesh
      {...props}
      ref={ref}
      // onPointerOver={(e) => {
      //   hover(true)
      //   e.stopPropagation()
      // }}
      // onPointerOut={(e) => {
      //   hover(false)
      //   e.stopPropagation()
      // }}
    >
      {!props.geometry && <boxGeometry args={props.size || [1, 1, 1]} />}
      {/* <meshStandardMaterial color={hovered ? "hotpink" : "orange"} /> */}
      {/* <meshStandardMaterial envMapIntensity={0.25} /> */}
      <meshStandardMaterial />
      {/* <meshStandardMaterial metalness={metalness} roughness={roughness} color={"white"} /> */}
    </mesh>
  )
}
