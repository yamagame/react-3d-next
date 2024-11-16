'use client'

import React, { useState, useCallback, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

import { SceneContainer, SceneHandler } from './components/SceneContainer'
// import scenedata from './scenes/cubes.json'
// import scenedata from './scenes/buildings.json'
import scenedata from './scenes/uec-all.json'

// import { SceneContainer, SceneHandler } from './scene'
// import scenedata from './scenes/uec-ground.json'
// import scenedata from './scenes/buildings.json'

import { Leva } from 'leva'

type BoxT = { x: number; y: number; angle: number }

export default function Home() {
  const sceneRef = React.useRef<SceneHandler>()
  const [recognizing, setRecognizing] = useState<boolean>(false)
  const [usingGeolocation, setUsingGeolocation] = useState<boolean>(false)
  const [recognizedText, setRecognizedText] = useState<string>('')

  const setOnRecognizing = useCallback((f: boolean) => {
    setRecognizing(f)
  }, [])

  const setOnGeolocation = useCallback((f: boolean) => {
    setUsingGeolocation(f)
  }, [])

  return (
    <div className="main-canvas">
      <div className="nav">
        {/* <a className="back" href={scenedata.url}></a> */}
        <h1 className="label">{scenedata.title}</h1>
        <div />
        {/* <div /> */}
        <a
          onClick={() => {
            sceneRef.current?.startGeolocation() //位置情報
          }}
        >
          <div className={usingGeolocation ? 'button red' : 'button'}>現在位置</div>
        </a>
        <a
          onClick={() => {
            if (recognizing) {
              sceneRef.current?.stopRecognition() //音声認識ストップ
            } else {
              sceneRef.current?.startRecognition() //音声認識スタート
            }
          }}
        >
          <div className={recognizing ? 'button red' : 'button'}>音声検索</div>
        </a>
        <a
          onClick={() => {
            sceneRef.current?.resetCamera()
          }}
        >
          <div className="button">初期視点</div>
        </a>
      </div>
      <h1 className="label2">{scenedata.title}</h1>
      <Leva hidden collapsed />
      <Suspense fallback={<div className="loading">Now Loading...</div>}>
        <Canvas shadows camera={{ fov: 65, near: 0.1, far: 5000 }} style={{ borderRadius: 10 }}>
          <SceneContainer
            ref={sceneRef}
            {...scenedata}
            setOnRecognizing={setOnRecognizing}
            setRecognizedText={setRecognizedText}
            setOnUsingGeolocation={setOnGeolocation}
          />
          {/* <axesHelper args={[50]} /> */}
        </Canvas>
      </Suspense>
      <div className={recognizing ? 'floatingbox' : 'floatingbox dontdisplay'}>{recognizedText}</div>
    </div>
  )
}
