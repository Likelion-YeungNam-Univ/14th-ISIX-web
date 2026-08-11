import { useGLTF } from "@react-three/drei";

interface GarmentModelProps {
    url : string;
}

const CDN = import.meta.env.VITE_CDN_BASE_URL;

const GarmentModel = ({ url } : GarmentModelProps) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene}/>;
}

export default GarmentModel;