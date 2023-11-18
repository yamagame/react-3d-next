"use client"

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  RefObject,
  createRef,
  useTransition,
} from "react"
import { useControls } from "leva"
import * as THREE from "three"
import { HoverMesh, Mesh } from "./mesh"
import { useFrame, ThreeEvent } from "@react-three/fiber"
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { Sky, Text, CameraControls, useGLTF } from "@react-three/drei"
import { Env } from "./environment"

type GLTFResult = GLTF & {
  nodes: { [index: string]: THREE.Mesh }
  materials: {}
}

type SceneProps = {
  gltf: string
  geometories: { name: string; label?: string }[]
}

export type SceneHandler = {
  resetCamera: () => void
}

export const Scene = React.forwardRef((props: SceneProps, ref) => {
  const { nodes } = useGLTF(props.gltf) as GLTFResult
  const [pointCamera, setPointCamera] = useState("")

  const textRef = useRef<{ [index: string]: RefObject<THREE.Mesh> }>({})

  React.useImperativeHandle(ref, () => {
    return {
      resetCamera() {
        cameraControlsRef.current?.moveTo(0, 1, 0, true)
        cameraControlsRef.current?.setPosition(90, 40, 90, true)
      },
    }
  })

  const cameraControlsRef = useRef<CameraControls>(null)

  useMemo(() => {
    Object.keys(nodes).forEach((name) => {
      textRef.current[name] = createRef<THREE.Mesh>()
    })
  }, [nodes])

  useEffect(() => {
    cameraControlsRef.current?.moveTo(0, 1, 0, false)
    cameraControlsRef.current?.setPosition(90, 40, 90, false)
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

  // テキストの向きをカメラに向ける
  useFrame(({ camera }) => {
    Object.keys(textRef.current).forEach((key) => {
      const text = textRef.current[key]
      text.current?.quaternion.copy(camera.quaternion)
      if (text.current?.material instanceof THREE.MeshBasicMaterial) {
        text.current.material.color.lerp(color.set("#2027fa"), 0.1)
      }
    })
  })

  // 視線方向のベクトルを計算
  const cameraDirection = () => {
    const cameraTarget = new THREE.Vector3()
    cameraControlsRef.current?.getTarget(cameraTarget)
    const cameraPosition = new THREE.Vector3()
    cameraControlsRef.current?.getPosition(cameraPosition)
    return cameraTarget.sub(cameraPosition)
  }

  // 並行光源の向きのコントローラ
  const directionalCtl = useControls("Directional Light", {
    visible: true,
    position: {
      x: 100.0,
      y: 100.0,
      z: -100.0,
    },
    bias: { value: 0, min: 0, max: 200 },
    castShadow: true,
  })

  return (
    <>
      <Env />
      <Sky />
      <directionalLight
        visible={directionalCtl.visible}
        position={[directionalCtl.position.x, directionalCtl.position.y, directionalCtl.position.z]}
        castShadow={directionalCtl.castShadow}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-camera-near={0.5}
        shadow-camera-far={5000}
        shadow-bias={-directionalCtl.bias / 100000.0}
        shadow-mapSize={[1024, 1024]}
      />
      <CameraControls ref={cameraControlsRef} enabled={true} />
      {Object.keys(nodes)
        .filter((name) => name != "Scene")
        .filter((name) => name != pointCamera)
        .map((name) => {
          if (name.indexOf("camera-point") == 0) {
            // ポイントカメラ
            return (
              <HoverMesh
                key={name}
                // scale={0.1}
                castShadow
                receiveShadow
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
                material={nodes[name].material}
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
                <HoverMesh
                  key={name}
                  // scale={0.1}
                  castShadow
                  receiveShadow
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
                  // material={nodes[name].material}
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
                castShadow
                receiveShadow
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                geometry={nodes[name].geometry}
                // material={nodes[name].material}
              />
            )
          }
        })}
      {/* <AccumulativeShadows
        temporal
        frames={10}
        color="purple"
        colorBlend={0.5}
        opacity={1}
        scale={100}
        alphaTest={0.85}
      >
        <RandomizedLight
          amount={8}
          radius={50}
          ambient={0.5}
          position={[150, 130, 20]}
          bias={0.01}
        />
      </AccumulativeShadows> */}
      {/* <OrbitControls
        autoRotate
        autoRotateSpeed={1}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.1}
        maxPolarAngle={Math.PI / 2.1}
      /> */}
    </>
  )
})
Scene.displayName = "Scene"
