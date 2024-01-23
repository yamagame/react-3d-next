'use client'

import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import { SceneContainer, SceneHandler } from './components/SceneContainer'
// import scenedata from './scenes/cubes.json'
import scenedata from './scenes/buildings.json'
// import scenedata from './scenes/uec-all.json'

// import { SceneContainer, SceneHandler } from './scene'
// import scenedata from './scenes/uec-ground.json'
// import scenedata from './scenes/buildings.json'

import { Leva } from 'leva'

type BoxT = { x: number; y: number; angle: number }

function Overlay() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    >
      <a href="https://pmnd.rs/" style={{ position: 'absolute', bottom: 40, left: 90, fontSize: '13px' }}>
        pmnd.rs
        <br />
        dev collective
      </a>
      <div style={{ position: 'absolute', top: 40, left: 40, fontSize: '13px' }}>😄 —</div>
      <div style={{ position: 'absolute', bottom: 40, right: 40, fontSize: '13px' }}>30/10/2022</div>
    </div>
  )
}

export default function Home() {
  const sceneRef = React.useRef<SceneHandler>()
  const [onRecognizing, setOnRecognizing] = useState<boolean>(false)
  const [onUsingGeolocation, setOnUsingGeolocation] = useState<boolean>(false)
  const [recognizedText, setRecognizedText] = useState<string>('')
  return (
    <div className="main-canvas">
      <div className="nav">
        <h1 className="label">{scenedata.title}</h1>
        <div />
        <div />
        <a
          onClick={() => {
            sceneRef.current?.startGeolocation() //位置情報
          }}
        >
          <div className={onUsingGeolocation ? 'button red' : 'button'}>現在位置</div>
        </a>
        <a
          onClick={() => {
            sceneRef.current?.startRecognition() //音声認識スタート
          }}
        >
          <div className={onRecognizing ? 'button red' : 'button'}>音声検索</div>
        </a>
        <a
          onClick={() => {
            sceneRef.current?.resetCamera()
          }}
        >
          <div className="button">初期視点</div>
        </a>
      </div>
      <Leva hidden collapsed />
      <Canvas shadows camera={{ fov: 65, near: 0.1, far: 5000 }} style={{ borderRadius: 10 }}>
        <SceneContainer
          ref={sceneRef}
          {...scenedata}
          setOnRecognizing={setOnRecognizing}
          setRecognizedText={setRecognizedText}
          setOnUsingGeolocation={setOnUsingGeolocation}
        />
        {/* <axesHelper args={[50]} /> */}
      </Canvas>
      <div className={onRecognizing ? 'floatingbox' : 'floatingbox dontdisplay'}>{recognizedText}</div>
      {/* <Overlay /> */}
    </div>
  )
}
