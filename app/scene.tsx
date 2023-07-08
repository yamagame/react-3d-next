"use client"

import React from "react"
import { Box } from "./box"
import { Sky } from "@react-three/drei"

type BoxT = { x: number; y: number; angle: number }

export function Scene(props: { boxes: { [index: string]: BoxT } }) {
  return (
    <>
      <Sky />
      <ambientLight />
      <pointLight position={[0, 10, 10]} />
      {Object.keys(props.boxes).map((key: string) => {
        const box = props.boxes[key]
        return <Box key={key} position={[box.x, 0, box.y]} rotation={[0, box.angle, 0]} />
      })}
      <Box size={[2, 5, 3]} position={[4, 2.5, 0 - 10]} rotation={[0, 0, 0]} />
      <Box position={[0, 0.5, -2 - 10]} rotation={[0, 0, 0]} />
      <Box size={[1, 3, 2]} position={[-3, 1.5, 2 - 10]} rotation={[0, 0, 0]} />
    </>
  )
}
