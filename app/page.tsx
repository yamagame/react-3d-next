"use client"

import React from "react"
import * as THREE from "three"
import { Canvas } from "@react-three/fiber"
import { Scene, SceneHandler } from "./scene"
import buildings from "./buildings.json"
import { Leva } from "leva"

type BoxT = { x: number; y: number; angle: number }

function Overlay() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    >
      <a
        href="https://pmnd.rs/"
        style={{ position: "absolute", bottom: 40, left: 90, fontSize: "13px" }}
      >
        pmnd.rs
        <br />
        dev collective
      </a>
      <div style={{ position: "absolute", top: 40, left: 40, fontSize: "13px" }}>😄 —</div>
      <div style={{ position: "absolute", bottom: 40, right: 40, fontSize: "13px" }}>
        30/10/2022
      </div>
    </div>
  )
}

export default function Home() {
  const sceneRef = React.useRef<SceneHandler>()
  return (
    <div className="main-canvas">
      <div className="nav">
        <h1 className="label" />
        <div />
        <div />
        <div />
        <div />
        <a
          onClick={() => {
            sceneRef.current?.resetCamera()
          }}
        >
          <div className="button">ALL</div>
        </a>
      </div>
      <Leva collapsed />
      <Canvas
        shadows
        camera={{ fov: 55, near: 0.1, far: 5000 }}
        style={{ borderRadius: 10 }}
        // onCreated={({ gl }) => {
        //   // gl.shadowMap.enabled = true
        //   gl.shadowMap.type = THREE.PCFSoftShadowMap
        //   // gl.setPixelRatio(window.devicePixelRatio || 2)
        // }}
      >
        <Scene ref={sceneRef} {...buildings} />
        <axesHelper args={[50]} />
      </Canvas>
      {/* <Overlay /> */}
    </div>
  )
}
