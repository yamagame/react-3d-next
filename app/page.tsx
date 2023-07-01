"use client"

import React from "react"
import { Canvas } from "@react-three/fiber"
import { Box } from "./box"

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
      <Canvas camera={{ fov: 35, near: 0.1, far: 1000, position: [10, 10, 10] }}>
        <ambientLight />
        <pointLight position={[0, 10, 10]} />
        {Object.keys(boxes).map((key: string) => {
          const box = boxes[key]
          return <Box key={key} position={[box.x, 0, box.y]} rotation={[0, box.angle, 0]}/>
        })}
      </Canvas>
    </div>
  )
}
