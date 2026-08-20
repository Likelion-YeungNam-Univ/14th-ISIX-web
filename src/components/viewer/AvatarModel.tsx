import { useDeferredValue, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three';

interface AvatarModelProps {
    url: string;
}

// 옷이 흰색이라 아바타까지 흰색이면 경계가 안 보입니다.
// 배경(#080808)과 옷(흰색) 사이에 오도록 회색을 씁니다.
//
// 화면에 보이는 밝기보다 훨씬 어두운 값을 넣어야 합니다. ThreeViewer 의
// 조명(ambient 0.6 + directional 1.2/0.4 + Environment 'studio')이 밝기를
// 두 배 넘게 밀어올린 뒤 ACES 톤매핑이 밝은 쪽을 흰색으로 몰아붙입니다.
// 처음 넣었던 #8e8e93 은 화면에서 #e5 쯤으로, 사실상 흰색으로 나왔습니다.
const AVATAR_COLOR = '#5a5a60';

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