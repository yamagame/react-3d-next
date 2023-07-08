"use client"

import React from "react"
import { Canvas } from "@react-three/fiber"
import { Scene } from "../scene"
import Camera from "./camera"
import { CameraControls, PerspectiveCamera } from "@react-three/drei"

type BoxT = { x: number; y: number; angle: number }

export default function Home() {
  const socketRef = React.useRef<WebSocket>()
  const [boxes, setBoxes] = React.useState<{ [index: string]: BoxT }>({})
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
          lookAt={{ x: 20, y: 4, z: 0 } as THREE.Vector3}
          position={{ x: 0, y: 0, z: 10 } as THREE.Vector3}
        />
        <Scene boxes={boxes} />
        <CameraControls />
        <PerspectiveCamera makeDefault position={[20, 0, 20]} />
      </Canvas>
    </div>
  )
}
