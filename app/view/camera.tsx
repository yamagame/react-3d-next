import { useFrame } from "@react-three/fiber"

export default function Camera(props: { lookAt: THREE.Vector3; position: THREE.Vector3 }) {
  useFrame((state) => {
    state.camera.lookAt(props.lookAt.x, props.lookAt.y, props.lookAt.z)
    state.camera.position.x = props.position.x
    state.camera.position.y = props.position.y
    state.camera.position.z = props.position.z
    state.camera.updateProjectionMatrix()
  })
  return <></>
}
