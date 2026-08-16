import { useDeferredValue, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three';

interface AvatarModelProps {
    url: string;
}

const AvatarModel = ({ url }: AvatarModelProps) => {
    const deferredUrl = useDeferredValue(url);
    const { scene } = useGLTF(deferredUrl, true);

    useEffect(() => {
        scene.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh){
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.roughness = 0.85;
                material.metalness = 0.1;
            }
        })
    }, [scene])

    return <primitive object={scene}/>
}

export default AvatarModel;