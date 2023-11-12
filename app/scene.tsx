"use client"

import React, { useRef, useMemo, useState, useEffect } from "react"
import * as THREE from "three"
import { Box } from "./box"
import { Canvas, useFrame } from "@react-three/fiber"
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { Sky, Text, CameraControls, useGLTF } from "@react-three/drei"

type BoxT = { x: number; y: number; angle: number }

type GLTFResult = GLTF & {
  nodes: {
    building: THREE.Mesh
  }
  materials: {}
}

export function Scene(props: { boxes: { [index: string]: BoxT } }) {
  const gltfModel = useGLTF("/cube.glb") as GLTF
  const { nodes } = useGLTF("/cube-transformed.glb") as GLTFResult
  // const gltfModel = useGLTF("/sample-building.glb") as GLTF

  const ref = useRef<THREE.Mesh>(null)
  const cameraControlsRef = useRef<CameraControls>(null)
  const color = useMemo(() => new THREE.Color(), [])
  const fontProps = {
    // font: "https://fonts.googleapis.com/css2?family=Crimson+Pro",
    font: "/NotoSansJP-Bold.ttf",
    fontSize: 0.5,
    letterSpacing: -0.05,
    lineHeight: 1,
    "material-toneMapped": false,
  }
  useFrame(({ camera }) => {
    // Make text face the camera
    ref.current?.quaternion.copy(camera.quaternion)
    // Change font color
    if (ref.current?.material instanceof THREE.MeshBasicMaterial) {
      ref.current.material.color.lerp(color.set("#fa2720"), 0.1)
    }
  })
  return (
    <>
      <Sky />
      <ambientLight intensity={0.1} />
      <pointLight position={[-2, 10, 10]} />
      <directionalLight position={[2, 5, -5]} intensity={0.5} />
      {/* {Object.keys(props.boxes).map((key: string) => {
        const box = props.boxes[key]
        return <Box key={key} position={[box.x, 0, box.y]} rotation={[0, box.angle, 0]} />
      })} */}
      <CameraControls
        ref={cameraControlsRef}
        // minDistance={3}
        enabled={true}
        // verticalDragToForward={verticalDragToForward}
        // dollyToCursor={dollyToCursor}
        // infinityDolly={infinityDolly}
      />
      <Box
        size={[2, 5, 3]}
        position={[4, 0, 0]}
        rotation={[0, 0, 0]}
        onClick={() => {
          cameraControlsRef.current?.moveTo(4, 0, 0, true)
          // cameraControlsRef.current?.setPosition(4, 0, 0.1, true)
        }}
      />
      <Box
        scale={0.1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        onClick={() => {
          const center = nodes.building.geometry.boundingBox?.getCenter(new THREE.Vector3())
          if (center) {
            const values = center.multiplyScalar(0.1).toArray()
            console.log(values)
            cameraControlsRef.current?.moveTo(...values, true)
          }
        }}
        // object={gltfModel}
        geometry={nodes.building.geometry}
      />
      <Box
        size={[1, 3, 2]}
        position={[-3, 0, 2]}
        rotation={[0, 0, 0]}
        onClick={() => cameraControlsRef.current?.moveTo(-3, 1.5, 2, true)}
      />
      <Text ref={ref} position={[0, 0, 2]} {...fontProps}>
        {/* 日本語のテスト */}
        Hello
      </Text>
      {/* <mesh scale={0.02} onClick={() => cameraControlsRef.current?.moveTo(0, 0, 0, true)}>
        <primitive object={gltfModel.scene} />
      </mesh> */}
      {/* <Model /> */}
    </>
  )
}
