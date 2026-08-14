import { useEffect } from "react";
import * as THREE from 'three';
import { easeToColor, DEFAULT_COLOR_SCALE, type ColorScale } from "@/constants/heatmapColors";

interface HeatmapRendererProps {
    meshRef : React.RefObject<THREE.Mesh>;
    showHeatmap: boolean;
    vertexEase: number[];
    colorScale?: ColorScale;
}

const HeatmapRenderer = ({meshRef, showHeatmap, vertexEase, colorScale = DEFAULT_COLOR_SCALE,}: HeatmapRendererProps) => {
    useEffect(()=> {
        const mesh = meshRef.current;
        if(!mesh) return;

        const material = mesh.material as THREE.MeshStandardMaterial;

        if(showHeatmap && vertexEase.length > 0){
            const colors = new Float32Array(vertexEase.length * 3);
            vertexEase.forEach((ease, i)=>{
                const [r, g, b] = easeToColor(ease, colorScale);
                colors[i * 3] = r;
                colors[i * 3 + 1] = g;
                colors[i * 3 + 2] = b;
            });
            mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            material.vertexColors = true;
        } else {
            material.vertexColors = false;
        }
        material.needsUpdate = true;
    }, [showHeatmap, vertexEase, meshRef, colorScale]);
    return null;
}

export default HeatmapRenderer;