import { useDeferredValue, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three';

interface AvatarModelProps {
    url: string;
}

// 옷이 흰색이라 아바타까지 흰색이면 경계가 안 보입니다.
// 배경(#080808)과 옷(흰색) 사이에 오도록 중간 회색을 씁니다.
const AVATAR_COLOR = '#8e8e93';

const AvatarModel = ({ url }: AvatarModelProps) => {
    const deferredUrl = useDeferredValue(url);
    const { scene } = useGLTF(deferredUrl, true);

    useEffect(() => {
        scene.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh){
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.color.set(AVATAR_COLOR);
                material.roughness = 0.85;
                material.metalness = 0.1;
            }
        })
    }, [scene])

    return <primitive object={scene}/>
}

export default AvatarModel;