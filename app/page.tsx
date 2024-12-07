'use client'

import React, { useState, useCallback, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

import { SceneContainer, SceneHandler } from './components/SceneContainer'
// import scenedata from './scenes/cubes.json'
// import scenedata from './scenes/buildings.json'
import scenedata from './scenes/uec-all.json'
import modelInfo from './model-info.json'

// import { SceneContainer, SceneHandler } from './scene'
// import scenedata from './scenes/uec-ground.json'
// import scenedata from './scenes/buildings.json'

import { Leva } from 'leva'
import Image from 'next/image'

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
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          fontSize: '10px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '4px',
          borderRadius: '10px',
        }}
      >
        {/* ver.yyMMdd */}
        {'ver.' +
          modelInfo.version +
          '/' +
          new Date().getFullYear().toString().slice(-2) +
          (new Date().getMonth() + 1) +
          new Date().getDate()}
      </div>
    </div>
  )
}

const urlPrefix = process.env.BRANCH_NAME ? '/' + process.env.BRANCH_NAME : ''

export default function Home() {
  const sceneRef = React.useRef<SceneHandler>()
  const [recognizing, setRecognizing] = useState<boolean>(false)
  const [useRecognition, setUseRecognition] = useState<boolean>(false)
  const [usingGeolocation, setUsingGeolocation] = useState<boolean>(false)
  const [recognizedText, setRecognizedText] = useState<string>('')

  const setOnRecognizing = useCallback((f: boolean) => {
    setRecognizing(f)
  }, [])

  const setOnGeolocation = useCallback((f: boolean) => {
    setUsingGeolocation(f)
  }, [])

  React.useEffect(() => {
    if ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) {
      setUseRecognition(true)
    }
  }, [])

  return (
    <div className="main-canvas">
      <div className="nav">
        <a href={urlPrefix + '/'} target="_blank" rel="noopener noreferrer" className="button">
          <Image
            src={urlPrefix + '/external-link.svg'}
            alt="新しいタブで開く"
            width={24}
            height={24}
            className="external-link"
          />
        </a>
        {/* <a className="back" href={scenedata.url}></a> */}
        <h1 className="label">{scenedata.title}</h1>
        {/* <div /> */}
        {/* <div /> */}
        <a
          onClick={() => {
            sceneRef.current?.startGeolocation() //位置情報
          }}
        >
          <div className={usingGeolocation ? 'button red' : 'button'}>現在位置</div>
        </a>
        {useRecognition ? (
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
        ) : null}
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
      <Overlay />
    </div>
  )
}
