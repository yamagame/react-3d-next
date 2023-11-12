"use client"

import React from "react"
import { Canvas } from "@react-three/fiber"
import { Scene } from "../scene"
import Camera from "./camera"
import { CameraControls, PerspectiveCamera } from "@react-three/drei"

type BoxT = { x: number; y: number; angle: number }
type Vector3 = { x: number; y: number; z: number }
type CameraT = { position: Vector3; lookAt: Vector3 }

export default function Home() {
  const socketRef = React.useRef<WebSocket>()
  const [boxes, setBoxes] = React.useState<{ [index: string]: BoxT }>({})
  const [camera, setCamera] = React.useState<CameraT>({
    position: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
  })

  React.useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:9001/socket")
    socketRef.current.onmessage = function (msg) {
      const payload = JSON.parse(msg.data)
      const { id, x, y, angle } = payload
      setBoxes((boxes) => {
        const b = { ...boxes }
        b[id] = { x, y, angle }
        return b
      })
      if (id == 10) {
        setCamera({
          position: { x: x, y: 0, z: y },
          lookAt: {
            x: x + Math.sin((angle * Math.PI * 2) / 360),
            y: 0,
            z: y + Math.cos((angle * Math.PI * 2) / 360),
          },
        })
      }
      console.log(payload, id, x, y, angle)
    }
    socketRef.current.onopen = function () {
      console.log("Connected")
    }
    socketRef.current.onclose = function () {
      console.log("closed")
    }
    return () => {
      if (socketRef.current == null) {
        return
      }
      socketRef.current.close()
    }
  }, [])
  return (
    <div className="main-canvas">
      <Canvas>
        <Camera
          lookAt={camera.lookAt as THREE.Vector3}
          position={camera.position as THREE.Vector3}
        />
        <Scene boxes={boxes} />
        {/* <CameraControls /> */}
        <PerspectiveCamera makeDefault />
      </Canvas>
    </div>
  )
}
