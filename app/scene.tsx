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
  selectBuilding: (name: string) => void
  startDetection: () => void
}

function box3ToVert(box3: THREE.Box3) {
  return new Float32Array([
    box3.min.x,
    box3.min.y,
    box3.min.z,

    box3.min.x,
    box3.max.y,
    box3.min.z,

    box3.max.x,
    box3.max.y,
    box3.min.z,

    box3.max.x,
    box3.min.y,
    box3.min.z,

    box3.min.x,
    box3.min.y,
    box3.max.z,

    box3.min.x,
    box3.max.y,
    box3.max.z,

    box3.max.x,
    box3.max.y,
    box3.max.z,

    box3.max.x,
    box3.min.y,
    box3.max.z,
  ])
}


export const Scene = React.forwardRef((props: SceneProps, ref) => {
  const { nodes } = useGLTF(props.gltf) as GLTFResult
  const [pointCamera, setPointCamera] = useState("")
  const [selectObject, setSelectObject] = useState("")
  const [focusObject, setFocusObject] = useState("")
  const [bbox, setBbox] = useState<{ [index: string]: THREE.Mesh }>({})

  const textRef = useRef<{ [index: string]: RefObject<THREE.Mesh> }>({})

  function focusBuilding(str :string){//nameと一致する建物にフォーカスする．建物のonClockからコピペ
    const name=props.geometories.find((v) => v.label == str)?.name || str; //
    const label = props.geometories.find((v) => v.name === name)?.label || name
    if(nodes[name]!=null){//その名前の建物が存在する
      const geometory = nodes[name].geometry
      const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
      const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
      if(center){
        let cameraPosition = new THREE.Vector3()
        cameraControlsRef.current?.getPosition(cameraPosition)
        const values = center.toArray()
        let apply = false

        cameraControlsRef.current?.colliderMeshes.splice(0)
        cameraControlsRef.current?.colliderMeshes.push(nodes["Plane"])

        cameraControlsRef.current?.moveTo(...values, true).then(() => {
          cameraControlsRef.current?.colliderMeshes.splice(0)
          cameraControlsRef.current?.colliderMeshes.push(nodes["Plane"])
          Object.keys(bbox)
            .filter((key) => key != name)
            .forEach((key) => {
              cameraControlsRef.current?.colliderMeshes.push(bbox[key])
            })
        })
        const direction = cameraDirection()
        if (direction.length() < 20) {
          const direction = cameraDirection().normalize().multiplyScalar(-20)
          cameraPosition = cameraPosition.add(direction)
          apply = true
        } else if (direction.length() > 60) {
          const cameraTarget = new THREE.Vector3()
          cameraControlsRef.current?.getTarget(cameraTarget)
          const direction = cameraDirection().normalize().multiplyScalar(-40)
          cameraPosition = cameraTarget.add(direction)
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
        setSelectObject("")
        setFocusObject(name)
        console.log("focus"+name)
      }
    }else{
      console.log("focusBuilding:cannot find "+name)
    }
  }

  React.useImperativeHandle(ref, () => {
    return {
      resetCamera() {
        setPointCamera("")

        cameraControlsRef.current?.moveTo(0, 1, 0, true)
        cameraControlsRef.current?.setPosition(90, 40, 90, true)

        cameraControlsRef.current?.colliderMeshes.splice(0)
        cameraControlsRef.current?.colliderMeshes.push(nodes["Plane"])
      },
      selectBuilding(name: string) {
        setFocusObject(name)
        console.log("select:"+name)
      },
      startRecognition(){//page.tsxから参照
        speechRef.current?.start()
      }
    }
  })

  useEffect(() => {
    console.log(`focusObject ${focusObject}`)
  }, [focusObject])

  const cameraControlsRef = useRef<CameraControls>(null)
  const speechRef = useRef(null)

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

    const boxes: { [index: string]: THREE.Mesh } = {}
    Object.keys(nodes)
      .filter((key) => key.indexOf("building") == 0)
      .forEach((key) => {
        const box3 = nodes[key].geometry.boundingBox
        if (box3) {
          const vertices = box3ToVert(box3)
          const geometry = new THREE.BufferGeometry()
          geometry.setIndex([
            0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 1, 1, 4, 5, 2, 7, 3, 2, 6, 7,
          ])
          geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
          const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
          const mesh = new THREE.Mesh(geometry, material)
          boxes[key] = mesh
        }
      })
    setBbox(boxes)

    //音声認識
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    speechRef.current = new SpeechRecognition();
    console.log(speechRef)
    speechRef.current.onresult = (event) => {
      const resultText = event.results[0][0].transcript//音声認識結果
      //setFocusObject(resultText)
      //focusBuilding("building2007")
      focusBuilding(resultText)
      console.log(resultText)
    }
  }, [nodes])

  const color = useMemo(() => new THREE.Color(), [])
  const fontProps = {
    font: "NotoSansJP-Bold.ttf",
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
    normalBias: { value: 200, min: 0, max: 200 },
    castShadow: true,
  })

  return (
    <>
      <Env />
      <Sky />
      <directionalLight
        visible={directionalCtl.visible}
        // intensity={0.5}
        position={[directionalCtl.position.x, directionalCtl.position.y, directionalCtl.position.z]}
        castShadow={directionalCtl.castShadow}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-camera-near={0.5}
        shadow-camera-far={5000}
        shadow-bias={-directionalCtl.bias / 100000.0}
        shadow-normalBias={directionalCtl.normalBias / 200.0}
        shadow-mapSize={[2048, 2048]}
        // shadow-blurSamples={2}
      />
      <CameraControls ref={cameraControlsRef} enabled={true} maxDistance={300} />
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
                    setSelectObject("")
                    setFocusObject("")

                    cameraControlsRef.current?.colliderMeshes.splice(0)
                    cameraControlsRef.current?.colliderMeshes.push(nodes["Plane"])
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
                  selected={selectObject === name}
                  focused={focusObject === name}
                  onClick={(e: ThreeEvent<MouseEvent>) => {
                    if (e.delta > 1) {
                      e.stopPropagation()
                      return
                    }
                    focusBuilding(name)//以下の内容を(ほぼ)そのままコピーした関数
                    // if (center) {
                    //   let cameraPosition = new THREE.Vector3()
                    //   cameraControlsRef.current?.getPosition(cameraPosition)
                    //   const values = center.toArray()
                    //   let apply = false

                    //   cameraControlsRef.current?.colliderMeshes.splice(0)
                    //   cameraControlsRef.current?.colliderMeshes.push(nodes["Plane"])

                    //   cameraControlsRef.current?.moveTo(...values, true).then(() => {
                    //     cameraControlsRef.current?.colliderMeshes.splice(0)
                    //     cameraControlsRef.current?.colliderMeshes.push(nodes["Plane"])
                    //     Object.keys(bbox)
                    //       .filter((key) => key != name)
                    //       .forEach((key) => {
                    //         cameraControlsRef.current?.colliderMeshes.push(bbox[key])
                    //       })
                    //   })
                    //   const direction = cameraDirection()
                    //   if (direction.length() < 20) {
                    //     const direction = cameraDirection().normalize().multiplyScalar(-20)
                    //     cameraPosition = cameraPosition.add(direction)
                    //     apply = true
                    //   } else if (direction.length() > 60) {
                    //     const cameraTarget = new THREE.Vector3()
                    //     cameraControlsRef.current?.getTarget(cameraTarget)
                    //     const direction = cameraDirection().normalize().multiplyScalar(-40)
                    //     cameraPosition = cameraTarget.add(direction)
                    //     apply = true
                    //   }

                    //   if (cameraPosition.y < 0) {
                    //     cameraPosition.setY(20)
                    //     apply = true
                    //   }

                    //   if (apply) {
                    //     cameraControlsRef.current?.setPosition(...cameraPosition.toArray(), true)
                    //   }
                    //   setPointCamera("")
                    //   setSelectObject("")
                    //   setFocusObject(name)
                    // }
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
      {/* {Object.keys(bbox).map((key) => {
        const box = bbox[key]
        return (
          <Mesh
            key={`bbox-${key}`}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            geometry={box.geometry}
            // material={nodes[name].material}
          />
        )
      })} */}
    </>
  )
})
Scene.displayName = "Scene"
