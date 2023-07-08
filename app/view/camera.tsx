import { useFrame } from "@react-three/fiber"

export default function Camera() {
  useFrame((state) => {
    state.camera.lookAt(20, 2, 1)
    state.camera.position.x = 0
    state.camera.position.y = 0
    state.camera.position.z = 10
    state.camera.updateProjectionMatrix()
  })
  return <></>
}
