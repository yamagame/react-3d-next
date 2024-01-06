'use client'

import React, { useRef, useMemo, useState, useEffect, RefObject, createRef, useTransition } from 'react'
import { useControls } from 'leva'
import * as THREE from 'three'
import { HoverMesh, Mesh } from './mesh'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Sky, Text, CameraControls, useGLTF, Sphere } from '@react-three/drei'
import { Env } from './environment'

const w11Lat = 35.65812474191075
const w11Long = 139.54082511503555
const auditoriumLat = 35.65563229930534
const auditoriumLong = 139.54433508505537

type GLTFResult = GLTF & {
  nodes: { [index: string]: THREE.Mesh }
  materials: {}
}

type SceneProps = {
  gltf: string
  geometories: { name: string; label?: string }[]
  camera: {
    target: number[]
    position: number[]
    distance: { max: number }
  }
  collider: string // bbox or mesh
  setOnRecognizing: (state: boolean) => void
  setRecognizedText: (text: string) => void
}

type PosAndLatLong = {
  position: THREE.Vector3
  latitude: number
  longitude: number
}

export type SceneHandler = {
  resetCamera: () => void
  selectBuilding: (name: string) => void
  startDetection: () => void
  startRecognition: () => void
  startGeolocation: () => void
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

function groundPlane() {
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
  planeGeometry.rotateX(-Math.PI / 2)
  const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
  return new THREE.Mesh(planeGeometry, planeMaterial)
}

export const Scene = React.forwardRef((props: SceneProps, ref) => {
  const { camera, collider } = props
  const initialcamera = {
    target: { x: camera.target[0], y: camera.target[1], z: camera.target[2] },
    position: { x: camera.position[0], y: camera.position[1], z: camera.position[2] },
  }
  const { nodes } = useGLTF(props.gltf) as GLTFResult
  const [pointCamera, setPointCamera] = useState('')
  const [selectObject, setSelectObject] = useState('')
  const [focusObject, setFocusObject] = useState('')
  const [bbox, setBbox] = useState<{ [index: string]: THREE.Mesh }>({})

  const textRef = useRef<{ [index: string]: RefObject<THREE.Mesh> }>({})
  const [currentPosition, setCurrentPosition] = useState<THREE.Vector3>(new THREE.Vector3()) //現在位置
  const currentPositionCtl = useControls('Geolocation', {
    //Levaを使う場合はこちら
    latitude: { value: 35.656, min: auditoriumLat, max: w11Lat },
    longitude: { value: 139.542, min: w11Long, max: auditoriumLong },
  })

  // nameと一致する建物にフォーカスする
  function focusBuilding(str: string) {
    let name = props.geometories.find((v) => v.label && v.label.indexOf(str) >= 0)?.name || str
    name = Object.keys(nodes).find((key) => key.indexOf(name) >= 0) || name
    if (nodes[name] != null) {
      //その名前の建物が存在する
      const geometory = nodes[name].geometry
      const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
      const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
      if (center) {
        let cameraPosition = new THREE.Vector3()
        cameraControlsRef.current?.getPosition(cameraPosition)
        const values = center.toArray()
        let apply = false

        cameraControlsRef.current?.colliderMeshes.splice(0)
        cameraControlsRef.current?.colliderMeshes.push(groundPlane())

        cameraControlsRef.current?.moveTo(...values, true).then(() => {
          cameraControlsRef.current?.colliderMeshes.splice(0)
          cameraControlsRef.current?.colliderMeshes.push(groundPlane())

          Object.keys(bbox)
            .filter((key) => key != name)
            .forEach((key) => {
              if (nodes[key]) {
                if (collider == 'bbox') {
                  cameraControlsRef.current?.colliderMeshes.push(bbox[key])
                } else {
                  cameraControlsRef.current?.colliderMeshes.push(nodes[key])
                }
              }
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
        setPointCamera('')
        setSelectObject('')
        setFocusObject(name)
        console.log('focus' + name)
        console.log(nodes[name])
      }
    } else {
      console.log('focusBuilding:cannot find ' + name)
    }
  }
  function geo_success(position: GeolocationPosition) {
    //位置情報が更新された際に呼び出される
    console.log(position)
    setCurrentPosition(calcCurrentPosition(position.coords.latitude, position.coords.longitude))
    console.log(calcCurrentPosition(position.coords.latitude, position.coords.longitude))
  }
  function geo_error(error: GeolocationPositionError) {
    console.log('位置情報の取得に失敗しました timestamp: ' + error.message)
  }

  React.useImperativeHandle(ref, () => {
    return {
      resetCamera() {
        setPointCamera('')
        cameraControlsRef.current?.moveTo(initialcamera.target.x, initialcamera.target.y, initialcamera.target.z, true)
        cameraControlsRef.current?.setPosition(
          initialcamera.position.x,
          initialcamera.position.y,
          initialcamera.position.z,
          true
        )
        cameraControlsRef.current?.colliderMeshes.splice(0)
        cameraControlsRef.current?.colliderMeshes.push(groundPlane())
      },
      selectBuilding(name: string) {
        setFocusObject(name)
        console.log('select:' + name)
      },
      startRecognition() {
        //page.tsxから参照
        ;(speechRef.current as any).start()
        props.setOnRecognizing(true)
      },
      startGeolocation() {
        console.log('ここでGeolocationをスタートする!')
        //Geolocation, GPS, 位置情報
        let geo_options = {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
        geolocationRef.current = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options)
      },
    }
  })
  useEffect(() => {
    console.log(`focusObject ${focusObject}`)
  }, [focusObject])

  const cameraControlsRef = useRef<CameraControls>(null)
  const speechRef = useRef()
  const geolocationRef = useRef(0)
  const w11PosRef = useRef<PosAndLatLong>(null!)
  const auditoriumPosRef = useRef<PosAndLatLong>(null!)

  function calcCurrentPosition(latitude: number | null, longitude: number | null) {
    if (latitude == null || longitude == null) {
      console.log('Failed to calc position:Latitude or Longitude is Null')
      return new THREE.Vector3(-1, -1, -1)
    }
    const latLength = auditoriumPosRef.current?.latitude - w11PosRef.current?.latitude
    const longLength = auditoriumPosRef.current?.longitude - w11PosRef.current?.longitude
    const xLength = auditoriumPosRef.current?.position.x - w11PosRef.current?.position.x
    const zLength = auditoriumPosRef.current?.position.z - w11PosRef.current?.position.z
    const w11lat = w11PosRef.current?.latitude
    const w11long = w11PosRef.current?.longitude
    const w11x = w11PosRef.current?.position.x
    const w11z = w11PosRef.current?.position.z
    let position = new THREE.Vector3()
    position.y = (w11PosRef.current?.position.y + auditoriumPosRef.current?.position.y) / 2
    position.z = ((latitude - w11lat) / latLength) * zLength + w11z
    position.x = ((longitude - w11long) / longLength) * xLength + w11x
    return position
  }

  useMemo(() => {
    Object.keys(nodes).forEach((name) => {
      textRef.current[name] = createRef<THREE.Mesh>()
    })
  }, [nodes])

  useEffect(() => {
    cameraControlsRef.current?.moveTo(initialcamera.target.x, initialcamera.target.y, initialcamera.target.z, false)
    cameraControlsRef.current?.setPosition(
      initialcamera.position.x,
      initialcamera.position.y,
      initialcamera.position.z,
      false
    )
    cameraControlsRef.current?.colliderMeshes.splice(0)
    cameraControlsRef.current?.colliderMeshes.push(groundPlane())

    const boxes: { [index: string]: THREE.Mesh } = {}
    // console.log(Object.keys(nodes))
    Object.keys(nodes)
      .filter((key) => key.indexOf('building') == 0)
      .forEach((key) => {
        const box3 = nodes[key].geometry.boundingBox
        if (box3) {
          const vertices = box3ToVert(box3)
          const geometry = new THREE.BufferGeometry()
          geometry.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 1, 1, 4, 5, 2, 7, 3, 2, 6, 7])
          geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
          const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
          const mesh = new THREE.Mesh(geometry, material)
          boxes[key] = mesh
        }
      })
    // boxes['Plane'] = groundPlane()
    setBbox(boxes)

    //音声認識
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const SpeechGrammarList = (window as any).webkitSpeechGrammarList || (window as any).SpeechGrammarList
    const recognizer = new SpeechRecognition() as any
    recognizer.lang = 'ja-JP'
    recognizer.interimResults = true // 認識途中で暫定の結果を返す
    // recognizer.continuous = true
    //辞書登録
    // let dict="#JSGF V1.0; grammar colors; public <color> = ";
    // Object.keys(nodes).forEach((key) => {
    //   dict+=key
    //   dict+="|"
    // })
    // dict += ";"
    // console.log(dict)
    // const speechRecognitionList=new SpeechGrammarList()
    // speechRecognitionList.addFromString(dict, 1);
    // (speechRef.current as any).grammars = speechRecognitionList;
    ;(recognizer as any).onresult = (event: any) => {
      console.log('result', event.results)
      const resultText = event.results[0][0].transcript //音声認識結果
      props.setRecognizedText(resultText)
      focusBuilding(resultText)
    }
    ;(recognizer as any).onend = (event: any) => {
      console.log('end', event)
      props.setOnRecognizing(false)
    }
    speechRef.current = recognizer
  }, [nodes])

  const color = useMemo(() => new THREE.Color(), [])
  const fontProps = {
    font: 'NotoSansJP-Bold.ttf',
    fontSize: 2.5,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false,
  }

  // テキストの向きをカメラに向ける
  useFrame(({ camera }) => {
    Object.keys(textRef.current).forEach((key) => {
      const text = textRef.current[key]
      text.current?.quaternion.copy(camera.quaternion)
      if (text.current?.material instanceof THREE.MeshBasicMaterial) {
        text.current.material.color.lerp(color.set('#2027fa'), 0.1)
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
  const directionalCtl = useControls('Directional Light', {
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
      <CameraControls ref={cameraControlsRef} enabled={true} maxDistance={props.camera.distance.max} />
      <Sphere
        key={'currentPosition'}
        scale={5}
        castShadow
        receiveShadow
        position={
          currentPosition
          //calcCurrentPosition(currentPositionCtl.latitude, currentPositionCtl.longitude)
        } //GPSを使うときは変更
        rotation={[0, 0, 0]}
        material={new THREE.MeshBasicMaterial({ color: 0xff0000 })}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          console.log(currentPosition)
          console.log(e.object.position)
        }}
      />
      {/* {bbox['Plane'] ? <HoverMesh geometry={bbox['Plane'].geometry} /> : null} */}
      {Object.keys(nodes)
        .filter((name) => name != 'Scene')
        .filter((name) => name != pointCamera)
        .map((name) => {
          if (name.indexOf('camera-point') == 0) {
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
                    setSelectObject('')
                    setFocusObject('')

                    cameraControlsRef.current?.colliderMeshes.splice(0)
                    cameraControlsRef.current?.colliderMeshes.push(groundPlane())
                  }
                  e.stopPropagation()
                }}
                geometry={nodes[name].geometry}
                material={nodes[name].material}
              />
            )
          } else if (name.indexOf('building') == 0) {
            // 建物
            const label = props.geometories.find((v) => v.name === name)?.label || name
            const geometory = nodes[name].geometry
            const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
            const size = geometory.boundingBox?.getSize(new THREE.Vector3()) || new THREE.Vector3()
            if (name.indexOf('building_西11号館ボディ') == 0) {
              const pos = center || new THREE.Vector3()
              w11PosRef.current = { position: pos, latitude: 0, longitude: 0 }
              w11PosRef.current.position = center || new THREE.Vector3()
              w11PosRef.current.latitude = w11Lat
              w11PosRef.current.longitude = w11Long
              console.log('set w11')
            } else if (name.indexOf('building_講堂ボディ') == 0) {
              const pos = center || new THREE.Vector3()
              auditoriumPosRef.current = { position: pos, latitude: 0, longitude: 0 }
              auditoriumPosRef.current.latitude = auditoriumLat
              auditoriumPosRef.current.longitude = auditoriumLong
              console.log('set auditorium')
            }
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
                    focusBuilding(name)
                    e.stopPropagation()
                  }}
                  geometry={nodes[name].geometry}
                  // material={nodes[name].material}
                />
                {/* {bbox[name] ? <HoverMesh geometry={bbox[name].geometry} /> : null} */}
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
Scene.displayName = 'Scene'
