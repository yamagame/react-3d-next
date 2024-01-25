import * as THREE from 'three'
import React, { useRef, useMemo, Ref, MutableRefObject } from 'react'
import { Water } from 'three-stdlib'
import { extend, useThree, useLoader, useFrame, Object3DNode } from '@react-three/fiber'

extend({ Water })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      water: Object3DNode<Water, typeof Water>
    }
  }
}

export function Ocean() {
  const ref = useRef<Water>(null)
  const gl = useThree((state) => state.gl)
  const waterNormals = useLoader(THREE.TextureLoader, 'waternormals.jpeg')
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping
  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000), [])
  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
      // format: gl.encoding,
    }),
    [waterNormals]
  )
  useFrame((state, delta) => (ref.current?.material ? (ref.current.material.uniforms.time.value += delta) : null))
  return <water ref={ref} args={[geom, config]} rotation-x={-Math.PI / 2} />
}
