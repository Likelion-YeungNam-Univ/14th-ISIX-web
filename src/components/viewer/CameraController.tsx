import { OrbitControls } from "@react-three/drei";

const CameraController = () => {
    return (
        <OrbitControls
        enablePan = { false }
        minDistance={1.5}
        maxDistance={5}
        target={[0, 1, 0]}/>
    )
}

export default CameraController;