"use client"

import React, { useRef, useMemo, useState, useEffect, RefObject, createRef } from "react"
import * as THREE from "three"
import { Mesh } from "./mesh"
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber"
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { Sky, Text, CameraControls, useGLTF } from "@react-three/drei"

type GLTFResult = GLTF & {
  nodes: { [index: string]: THREE.Mesh }
  materials: {}
}

type SceneProps = {
  gltf: string
  geometories: { name: string; label?: string }[]
}

export function Scene(props: SceneProps) {
  const { nodes } = useGLTF(props.gltf) as GLTFResult
  const [pointCamera, setPointCamera] = useState("")

  const textRef = useRef<{ [index: string]: RefObject<THREE.Mesh> }>({})

  const cameraControlsRef = useRef<CameraControls>(null)

  useMemo(() => {
    Object.keys(nodes).forEach((name) => {
      textRef.current[name] = createRef<THREE.Mesh>()
    })
  }, [nodes])

  useEffect(() => {
    cameraControlsRef.current?.moveTo(0, 1, 0, false)
    cameraControlsRef.current?.setPosition(40, 90, 40, false)
    cameraControlsRef.current?.colliderMeshes.splice(0)
    cameraControlsRef.current?.colliderMeshes.push(nodes["Plane"])
  }, [nodes])

  const color = useMemo(() => new THREE.Color(), [])
  const fontProps = {
    font: "/NotoSansJP-Bold.ttf",
    fontSize: 2.5,
    letterSpacing: -0.05,
    lineHeight: 1,
    "material-toneMapped": false,
  }

  useFrame(({ camera }) => {
    Object.keys(textRef.current).forEach((key) => {
      const text = textRef.current[key]
      text.current?.quaternion.copy(camera.quaternion)
      if (text.current?.material instanceof THREE.MeshBasicMaterial) {
        text.current.material.color.lerp(color.set("#2027fa"), 0.1)
      }
    })
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
      <CameraControls
        ref={cameraControlsRef}
        // onStart={() => {}}
        // onEnd={() => {}}
        // onChange={(e) => {
        //   const pos = cameraControlsRef.current?.getPosition(new THREE.Vector3())
        //   if (pos && pos.y < 1) {
        //     pos.setY(1)
        //     cameraControlsRef.current?.setPosition(...pos.toArray(), false)
        //   }
        // }}
        enabled={true}
      />
      {Object.keys(nodes)
        .filter((name) => name != "Scene")
        .filter((name) => name != pointCamera)
        .map((name) => {
          if (name.indexOf("camera-point") == 0) {
            // ポイントカメラ
            return (
              <Mesh
                key={name}
                // scale={0.1}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  const center = nodes[name].geometry.boundingBox?.getCenter(new THREE.Vector3())
                  if (center) {
                    const direction = cameraDirection()
                      .multiply(new THREE.Vector3(1, 0, 1))
                      .normalize()
                      .multiplyScalar(0.01)
                    const target = direction.add(center)
                    cameraControlsRef.current?.moveTo(...target.toArray(), true)
                    cameraControlsRef.current?.setPosition(...center.toArray(), true)
                    setPointCamera(name)
                  }
                  e.stopPropagation()
                }}
                geometry={nodes[name].geometry}
              />
            )
          } else if (name.indexOf("building") == 0) {
            // 建物
            const label = props.geometories.find((v) => v.name === name)?.label || name
            const geometory = nodes[name].geometry
            const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
            const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
            return (
              <group key={`${name}-container`}>
                <Mesh
                  key={name}
                  // scale={0.1}
                  position={[0, 0, 0]}
                  rotation={[0, 0, 0]}
                  onClick={(e: ThreeEvent<MouseEvent>) => {
                    if (center) {
                      let cameraPosition = new THREE.Vector3()
                      cameraControlsRef.current?.getPosition(cameraPosition)
                      const values = center.toArray()
                      let apply = false

                      cameraControlsRef.current?.moveTo(...values, true)
                      const direction = cameraDirection()
                      if (direction.length() < 20) {
                        const direction = cameraDirection().normalize().multiplyScalar(-20)
                        cameraPosition = cameraPosition.add(direction)
                        apply = true
                      }

                      if (cameraPosition.y < 0) {
                        cameraPosition.setY(20)
                        apply = true
                      }

                      if (apply) {
                        cameraControlsRef.current?.setPosition(...cameraPosition.toArray(), true)
                      }
                      setPointCamera("")
                    }
                    e.stopPropagation()
                  }}
                  geometry={nodes[name].geometry}
                />
                <Text
                  key={`${name}-text`}
                  ref={textRef.current[name]}
                  position={center?.clone().add(size.multiply(new THREE.Vector3(0, 0.8, 0)))}
                  {...fontProps}
                >
                  {label || name}
                </Text>
              </group>
            )
          } else {
            return (
              <Mesh
                key={name}
                // scale={0.1}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                geometry={nodes[name].geometry}
              />
            )
          }
        })}
    </>
  )
}
