import { useGLTF } from "@react-three/drei";

interface GarmentModelProps {
    url : string;
}

const GarmentModel = ({ url } : GarmentModelProps) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene}/>;
}

export default GarmentModel;