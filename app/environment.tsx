import React from 'react'
import { Environment } from '@react-three/drei'

export function Env() {
  return <Environment files={'venice_sunset_1k.hdr'} background blur={0.65} />
}
