import { forwardRef, useDeferredValue, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from 'three';

interface GarmentModelProps {
    url : string; 
    preloadUrls?: string[];
}

const GarmentModel = forwardRef<THREE.Mesh, GarmentModelProps> (
    ({url, preloadUrls}, ref)=> {
        const deferredUrl = useDeferredValue(url);
        const { scene } = useGLTF(deferredUrl, true);

        useEffect(()=>{
            preloadUrls?.forEach((u)=> useGLTF.preload(u, true));
        }, [preloadUrls]);

        // 히트맵 렌더러가 접근할 수 있도록 실제 메시를 ref로 노출
        useEffect(()=>{
            scene.traverse((child) =>{
            const mesh = child as THREE.Mesh;
            if(mesh.isMesh && ref && typeof ref !== 'function'){
                ref.current = mesh;
            }
        });
    }, [scene, ref]);
    
    return <primitive object={scene}/>;
    }
)

GarmentModel.displayName = 'GarmentModel';

export default GarmentModel;