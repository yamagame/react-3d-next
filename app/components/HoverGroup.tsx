'use client'

import React, { useRef, useState } from 'react'
import THREE from 'three'
import { useControls } from 'leva'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { ThreeElements } from '@react-three/fiber'

export function HoverGroup(props: ThreeElements['group']) {
  return <group {...props}>{props.children}</group>
}
