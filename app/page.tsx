"use client"

import React from "react"
import { Canvas } from "@react-three/fiber"
import { Scene } from "./scene"
import buildings from "./buildings.json"

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
      <div className="nav">
        <h1 className="label" />
        <div />
        <div />
        <a onClick={() => {}}>
          <div className="button">aa</div>
        </a>
        <a onClick={() => {}}>
          <div className="button">aa</div>
        </a>
        <a onClick={() => {}}>
          <div className="button">aa</div>
        </a>
      </div>
      <Canvas camera={{ fov: 55, near: 0.1, far: 1000 }} style={{ borderRadius: 20 }}>
        <Scene {...buildings} />
      </Canvas>
    </div>
  )
}
