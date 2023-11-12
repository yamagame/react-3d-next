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
    cuboid1: THREE.Mesh
    cuboid2: THREE.Mesh
    cuboid3: THREE.Mesh
    cuboid4: THREE.Mesh
    ["camera-point"]: THREE.Mesh
  }
  materials: {}
}

type NAMES = "cuboid1" | "cuboid2" | "cuboid3" | "cuboid4" | "camera-point"

export function Scene(props: { boxes: { [index: string]: BoxT } }) {
  // const gltfModel = useGLTF("/cube.glb") as GLTF
  const { nodes } = useGLTF("/cuboids-transformed.glb") as GLTFResult
  const [pointCamera, setPointCamera] = useState("")
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

  const cameraDirection = () => {
    const cameraTarget = new THREE.Vector3()
    cameraControlsRef.current?.getTarget(cameraTarget)
    const cameraPosition = new THREE.Vector3()
    cameraControlsRef.current?.getPosition(cameraPosition)
    return cameraTarget.sub(cameraPosition)
  }

  return (
    <>
      <Sky />
      <ambientLight intensity={0.1} />
      <pointLight position={[-2, 10, 10]} />
      <directionalLight position={[2, 5, -5]} intensity={0.5} />
      <CameraControls ref={cameraControlsRef} enabled={true} />
      {(["cuboid1", "cuboid2", "cuboid3", "cuboid4"] as NAMES[]).map((geometory_name) => {
        return (
          <Box
            key={geometory_name}
            // scale={0.1}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            onClick={() => {
              const center = nodes[geometory_name].geometry.boundingBox?.getCenter(
                new THREE.Vector3()
              )
              if (center) {
                const values = center.toArray()
                console.log(values)
                cameraControlsRef.current?.moveTo(...values, true)

                const direction = cameraDirection()
                console.log(direction.length())
                if (direction.length() < 3) {
                  const direction = cameraDirection().normalize().multiplyScalar(-3)
                  const cameraPosition = new THREE.Vector3()
                  cameraControlsRef.current?.getPosition(cameraPosition)
                  cameraControlsRef.current?.setPosition(
                    ...cameraPosition.add(direction).toArray(),
                    true
                  )
                }
                setPointCamera("")
              }
            }}
            geometry={nodes[geometory_name].geometry}
          />
        )
      })}
      {(["camera-point"] as NAMES[])
        .filter((name) => pointCamera !== name)
        .map((geometory_name) => {
          return (
            <Box
              key={geometory_name}
              // scale={0.1}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              onClick={() => {
                const center = nodes[geometory_name].geometry.boundingBox?.getCenter(
                  new THREE.Vector3()
                )
                if (center) {
                  const direction = cameraDirection().normalize().multiplyScalar(-0.01)
                  const target = direction.add(center)
                  cameraControlsRef.current?.moveTo(...center.toArray(), true)
                  cameraControlsRef.current?.setPosition(...target.toArray(), true)
                  setPointCamera(geometory_name)
                }
              }}
              geometry={nodes[geometory_name].geometry}
            />
          )
        })}
      <Text ref={ref} position={[0, 0, 2]} {...fontProps}>
        {/* 日本語のテスト */}
        Hello
      </Text>
    </>
  )
}
