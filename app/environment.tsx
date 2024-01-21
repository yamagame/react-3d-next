import React, { useState, useTransition } from 'react'
import { useControls } from 'leva'
import { Environment } from '@react-three/drei'

enum PresetType {
  sunset,
  dawn,
  night,
  warehouse,
  forest,
  apartment,
  studio,
  city,
  park,
  lobby,
}

const options = Object.keys(PresetType).filter((v) => {
  return isNaN(+v)
})

export function Env() {
  // const [preset, setPreset] = useState('white.png')
  // const [inTransition, startTransition] = useTransition()
  // const { blur } = useControls({
  //   blur: { value: 0.65, min: 0, max: 1 },
  //   preset: {
  //     value: preset,
  //     options,
  //     onChange: (value) => startTransition(() => setPreset(value)),
  //   },
  // })
  return <Environment files={'venice_sunset_1k.hdr'} background blur={0.65} />
}
