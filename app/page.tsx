"use client"

import React from "react"
import { Canvas } from "@react-three/fiber"
import { Box } from "./box"

export default function Home() {
  const socketRef = React.useRef<WebSocket>()
  React.useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:9001/socket")
    socketRef.current.onmessage = function (msg) {
      console.log(JSON.parse(msg.data))
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
        <Box position={[-1, 0, -1]} />
        <Box position={[-1, 0, 1]} />
        <Box position={[1, 0, -1]} />
        <Box position={[1, 0, 1]} />
      </Canvas>
    </div>
  )
}
