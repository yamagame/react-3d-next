'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useControls } from 'leva'
import * as THREE from 'three'
import { Mesh } from './Mesh'
import { ThreeEvent } from '@react-three/fiber'
import { Sky, CameraControls, useGLTF, Sphere } from '@react-three/drei'
import { Env } from '../environment'
import { SceneItem, Scene, GLTFResult, Camera, Geometory } from './Scene'
import { Ocean } from './Ocean'
import { GeoLocation, GeoPosition } from '../classes/location'
import { useTimeout } from '../hook/timeout'
import { BuildingNames } from '../classes/building'

const w11Lat = 35.65812474191075
const w11Long = 139.54082511503555
const auditoriumLat = 35.65563229930534
const auditoriumLong = 139.54433508505537

const SHOW_BOUNDING_BOX = false
const ENABLE_CAMERA_COLLIDER = true

type BBox = { [index: string]: THREE.Mesh }

export type SceneContainerProps = {
  gltf: string
  title: string
  url?: string
  geometories: Geometory[]
  camera: Camera
  collider: string // bbox or mesh
  scenes: SceneItem[]
  hidden?: string[]

  geolocation?: {
    pos1: { name: string; latitude: number; longitude: number }
    pos2: { name: string; latitude: number; longitude: number }
  }
  setOnRecognizing: (state: boolean) => void
  setRecognizedText: (text: string) => void
  setOnUsingGeolocation: (state: boolean) => void
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

function TransformVector(name: string, scenes: SceneItem[]): THREE.Vector3 | null {
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    if (scene.name == name) {
      const pos = scene.position || [0, 0, 0]
      return new THREE.Vector3(...pos)
    }
    const vector = TransformVector(name, scene.children)
    if (vector) {
      if (scene.position) {
        const scale = scene.scale || [1, 1, 1]
        vector.add(new THREE.Vector3(...scene.position)).multiply(new THREE.Vector3(...scale))
      }
      return vector
    }
  }
  return null
}

const makeInitialCamera = (camera: Camera) => {
  return {
    target: { x: camera.target[0], y: camera.target[1], z: camera.target[2] },
    position: { x: camera.position[0], y: camera.position[1], z: camera.position[2] },
  }
}

const resetCameraCollider = (cameraControls: CameraControls | null) => {
  cameraControls?.colliderMeshes.splice(0)
  cameraControls?.colliderMeshes.push(groundPlane())
}

const findBuilding = (geometories: Geometory[], resultText: string) => {
  const names = new BuildingNames()
  geometories.forEach((v) => {
    if (v.label) {
      const label = v.label
      names.push(label, v.label, v.bbox || v.name)
      if (v.names) {
        v.names.forEach((name) => {
          names.push(label, name, v.bbox || v.name)
        })
      }
    }
  })
  return names.find(resultText)
}

export const SceneContainer = React.forwardRef((props: SceneContainerProps, ref) => {
  const { camera, collider, geometories } = props
  const [initialcamera, setInitialCamera] = useState(makeInitialCamera(camera))
  const { nodes, materials } = useGLTF(props.gltf) as GLTFResult
  const [pointCamera, setPointCamera] = useState('')
  const [selectObject, setSelectObject] = useState('')
  const [focusObject, setFocusObject] = useState('')
  const [bbox, setBbox] = useState<BBox>({})
  const [open, setOpen] = useState(false)
  const cameraControlsRef = useRef<CameraControls>(null)
  const speechRef = useRef()
  const focusBuildingTimer = useTimeout()
  const speechTextClearTimer = useTimeout()
  const buildingNameTimer = useTimeout()
  const resultNameRef = useRef('')

  const currentPositionRef = useRef<GeoLocation>(new GeoLocation())
  const [currentPosition, setCurrentPosition] = useState<THREE.Vector3>(new THREE.Vector3()) //現在位置
  const currentPositionCtl = useControls('Geolocation', {
    //Levaを使う場合はこちら
    latitude: { value: 35.656, min: auditoriumLat, max: w11Lat },
    longitude: { value: 139.542, min: w11Long, max: auditoriumLong },
  })

  useEffect(() => {
    setInitialCamera(makeInitialCamera(camera))
  }, [camera])

  // nameと一致する建物にフォーカスする
  const focusBuilding = useCallback(
    (name: string, bbox: BBox) => {
      // let name = geometories.find((v) => v.label && v.label.indexOf(str) >= 0)?.name || str
      // name = Object.keys(nodes).find((key) => key.indexOf(name) >= 0) || name
      if (nodes[name] != null) {
        //その名前の建物が存在する
        const geometory = nodes[name].geometry
        const position = TransformVector(name, props.scenes) || new THREE.Vector3(0, 0, 0)
        const center = geometory.boundingBox?.getCenter(new THREE.Vector3()).add(position)
        if (center) {
          let cameraPosition = new THREE.Vector3()
          cameraControlsRef.current?.getPosition(cameraPosition)
          const values = center.toArray()
          let apply = false

          resetCameraCollider(cameraControlsRef.current)
          cameraControlsRef.current?.moveTo(...values, true).then(() => {
            resetCameraCollider(cameraControlsRef.current)

            if (ENABLE_CAMERA_COLLIDER) {
              const self_geo = geometories.find((v) => v.bbox == name)
              Object.keys(bbox)
                .filter((key) => key != name && !(props.hidden && props.hidden.indexOf(key) >= 0))
                .forEach((key) => {
                  if (nodes[key]) {
                    if (collider == 'bbox') {
                      cameraControlsRef.current?.colliderMeshes.push(bbox[key])
                    } else {
                      const geo = geometories.find((v) => v.name == key)
                      let nodename = key
                      if (geo && geo.bbox) {
                        nodename = geo.bbox
                      }
                      if (
                        nodename != name &&
                        !(self_geo?.collider?.ignore && self_geo.collider.ignore.indexOf(nodename) >= 0)
                      ) {
                        cameraControlsRef.current?.colliderMeshes.push(nodes[nodename])
                      }
                    }
                  }
                })
            }
          })

          const minlength = 120
          const minscaler = -120

          const maxlength = 60
          const maxscaler = -60

          const minheight = 50
          const defheight = 50

          const cameraTarget = new THREE.Vector3()
          const length = center.sub(cameraPosition).length()
          cameraControlsRef.current?.getTarget(cameraTarget)
          if (length < minlength) {
            const direction = cameraDirection().normalize().multiplyScalar(minscaler)
            cameraPosition = cameraTarget.add(direction)
            apply = true
          } else if (length > maxlength) {
            const direction = cameraDirection().normalize().multiplyScalar(maxscaler)
            cameraPosition = cameraTarget.add(direction)
            apply = true
          }

          if (cameraPosition.y < minheight) {
            cameraPosition.setY(defheight)
            apply = true
          }

          if (apply) {
            cameraControlsRef.current?.setPosition(...cameraPosition.toArray(), true)
          }

          setPointCamera('')
          setSelectObject('')
          setFocusObject(name)
        }
      } else {
        console.log('focusBuilding:cannot find ' + name)
      }
    },
    [collider, nodes, geometories, props.scenes, props.hidden]
  )

  const focusPointCamera = useCallback((name: string, center: THREE.Vector3) => {
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
    resetCameraCollider(cameraControlsRef.current)
  }, [])

  function geo_success(position: GeolocationPosition) {
    //位置情報が更新された際に呼び出される
    console.log(position)
    console.log(currentPositionRef.current.calcCurrentPosition())
    if (
      Number.isNaN(currentPositionRef.current.calcCurrentPosition().x) ||
      Number.isNaN(currentPositionRef.current.calcCurrentPosition().z)
    ) {
      console.log('位置情報計算に失敗：おそらくこのマップは位置情報に対応していません')
    } else {
      currentPositionRef.current.setLocation(position.coords.latitude, position.coords.longitude)
      setCurrentPosition(currentPositionRef.current.calcCurrentPosition())
    }
  }
  function geo_error(error: GeolocationPositionError) {
    console.log('位置情報の取得に失敗しました ' + error.message)
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
        resetCameraCollider(cameraControlsRef.current)
      },
      selectBuilding(name: string) {
        setFocusObject(name)
      },
      startRecognition() {
        ;(speechRef.current as any).start()
        props.setOnRecognizing(true)
      },
      startGeolocation() {
        console.log('ここでGeolocationをスタートorストップする!')
        //Geolocation, GPS, 位置情報
        if (currentPositionRef.current.id == null || currentPositionRef.current.id == 0) {
          //位置情報未起動
          let geo_options = {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0,
          }
          currentPositionRef.current.id = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options)
          props.setOnUsingGeolocation(true)
        } else {
          //停止
          navigator.geolocation.clearWatch(currentPositionRef.current.id)
          currentPositionRef.current.id = 0
          props.setOnUsingGeolocation(false)
        }
      },
    }
  })

  //GeoLocation
  useEffect(() => {
    let pos1: GeoPosition = { pos: new THREE.Vector3(), lonlat: { latitude: 0, longitude: 9 } }
    let pos2: GeoPosition = { pos: new THREE.Vector3(), lonlat: { latitude: 0, longitude: 9 } }
    Object.keys(nodes).map((name) => {
      if (!props.geolocation) return
      if (name.indexOf(props.geolocation.pos1.name) == 0) {
        const geometory = nodes[name].geometry
        const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
        pos1.pos = center || new THREE.Vector3()
        pos1.lonlat.latitude = props.geolocation.pos1.latitude
        pos1.lonlat.longitude = props.geolocation.pos1.longitude
        currentPositionRef.current.pos1 = pos1
      } else if (name.indexOf(props.geolocation.pos2.name) == 0) {
        const geometory = nodes[name].geometry
        const center = geometory.boundingBox?.getCenter(new THREE.Vector3())
        pos2.pos = center || new THREE.Vector3()
        pos2.lonlat.latitude = props.geolocation.pos2.latitude
        pos2.lonlat.longitude = props.geolocation.pos2.longitude
        currentPositionRef.current.pos2 = pos2
      }
    })
    setCurrentPosition(currentPositionRef.current.calcCurrentPosition())
  }, [nodes, props.geolocation, currentPositionRef])

  useEffect(() => {
    cameraControlsRef.current?.moveTo(initialcamera.target.x, initialcamera.target.y, initialcamera.target.z, false)
    cameraControlsRef.current?.setPosition(
      initialcamera.position.x,
      initialcamera.position.y,
      initialcamera.position.z,
      false
    )
    resetCameraCollider(cameraControlsRef.current)
  }, [initialcamera])

  useEffect(() => {
    // コリジョンボックス作成
    const boxes: { [index: string]: THREE.Mesh } = {}
    Object.keys(nodes)
      .filter((key) => geometories.some((n) => n.name == key))
      .forEach((key) => {
        const geo = geometories.find((n) => n.name == key)
        if (geo?.bbox) {
          boxes[key] = nodes[geo.bbox]
        } else {
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
        }
      })
    setBbox(boxes)
    // 地図表示
    setOpen(true)
  }, [nodes, initialcamera, geometories, focusBuilding, props])

  const clearSpeechText = useCallback(() => {
    props.setOnRecognizing(false)
    props.setRecognizedText('')
  }, [props])

  useEffect(() => {
    //音声認識
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognizer = new SpeechRecognition() as any
    recognizer.lang = 'ja-JP'
    recognizer.interimResults = true // 認識途中で暫定の結果を返す

    recognizer.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript //音声認識結果
      const name = findBuilding(geometories, resultText)
      if (name) {
        if (name?.label) {
          if (resultNameRef.current === name.label) return
          resultNameRef.current = name.label
        }
        focusBuildingTimer.set(() => {
          focusBuilding(name.bbox, bbox)
          buildingNameTimer.set(() => props.setRecognizedText(resultNameRef.current), 100)
          recognizer.stop()
          props.setOnRecognizing(false)
        }, 500)
        speechTextClearTimer.set(() => {
          clearSpeechText()
          resultNameRef.current = ''
          recognizer.stop()
          props.setOnRecognizing(false)
        }, 2000)
      }
      buildingNameTimer.set(() => props.setRecognizedText(resultNameRef.current || resultText), 100)
    }

    recognizer.onend = (event: any) => {
      speechTextClearTimer.set(() => {
        clearSpeechText()
        resultNameRef.current = ''
        recognizer.stop()
        props.setOnRecognizing(false)
      }, 2000)
    }

    speechRef.current = recognizer
  }, [
    bbox,
    geometories,
    props,
    focusBuilding,
    clearSpeechText,
    speechTextClearTimer,
    focusBuildingTimer,
    buildingNameTimer,
  ])

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
      x: 30.0,
      y: 100.0,
      z: 30.0,
    },
    bias: { value: 0, min: 0, max: 200 },
    normalBias: { value: 200, min: 0, max: 200 },
    castShadow: true,
  })

  return (
    <>
      <Env />
      <Sky distance={450000} />
      {open ? (
        <group position={[0, -10, 0]}>
          <Ocean />
        </group>
      ) : null}
      <ambientLight color="#8080FF" intensity={1.0} />
      <directionalLight
        visible={directionalCtl.visible}
        // intensity={0.5}
        color="white"
        intensity={1.0}
        position={[directionalCtl.position.x, directionalCtl.position.y, directionalCtl.position.z]}
        castShadow={directionalCtl.castShadow}
        shadow-camera-left={-400}
        shadow-camera-right={340}
        shadow-camera-top={300}
        shadow-camera-bottom={-400}
        shadow-camera-near={0.5}
        shadow-camera-far={5000}
        shadow-bias={-directionalCtl.bias / 100000.0}
        shadow-normalBias={directionalCtl.normalBias / 200.0}
        shadow-mapSize={[2048, 2048]}
        // shadow-blurSamples={2}
      />
      <CameraControls
        ref={cameraControlsRef}
        minDistance={20}
        maxPolarAngle={pointCamera != '' ? Math.PI : (Math.PI * 85) / 180}
        enabled={true}
        maxDistance={props.camera.distance.max}
      />
      {/* -------------------------- 現在位置の表示 -------------------------- */}
      <Sphere
        key={'currentPosition'}
        scale={currentPositionRef.current.scale}
        castShadow
        receiveShadow
        position={currentPosition}
        rotation={[0, 0, 0]}
        material={new THREE.MeshBasicMaterial({ color: 0xff0000 })}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          console.log(currentPosition)
          console.log(e.object.position)
        }}
        visible={currentPositionRef.current.id == 0 ? false : true}
      />
      {/* -------------------------- シーンの描画 -------------------------- */}
      {open ? (
        <Scene
          {...props}
          gltfResult={{ nodes, materials } as GLTFResult}
          selectObject={selectObject}
          focusObject={focusObject}
          pointCamera={pointCamera}
          focusBuilding={(name) => {
            focusBuilding(name, bbox)
          }}
          focusPointCamera={(name, center) => focusPointCamera(name, center)}
        />
      ) : null}
      {/* -------------------------- バウンディングボックスの表示 -------------------------- */}
      {SHOW_BOUNDING_BOX
        ? Object.keys(bbox)
            .filter((key) => !(props.hidden && props.hidden.indexOf(key) >= 0))
            .map((key) => {
              const box = bbox[key]
              if (box && box.geometry) {
                return (
                  <Mesh
                    key={`bbox-${key}`}
                    position={[0, 0, 0]}
                    rotation={[0, 0, 0]}
                    geometry={box.geometry}
                    // material={nodes[name].material}
                  />
                )
              }
              return null
            })
        : null}
      {/* -------------------------- gltfjsxのモデル表示 -------------------------- */}
      {/* <Model ref={modelRef} position={[-100, 0, 0]} /> */}
    </>
  )
})
SceneContainer.displayName = 'SceneContainer'
