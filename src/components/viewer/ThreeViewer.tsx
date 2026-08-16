import type { ColorScale } from '@/constants/heatmapColors';
import PerfMonitor from './PerfMonitor';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Stats } from '@react-three/drei';
import * as THREE from 'three';
import GarmentModel from './GarmentModel';
import CameraController from './CameraController';
import AvatarModel from './AvatarModel';
import ViewerLoading from './ViewerLoading';
import ViewerErrorBoundary from './ViewerErrorBoundary';
import HeatmapRenderer from './HeatmapRenderer';

interface ThreeViewerProps {
  avatarUrl?: string;
  garmentUrl?: string;
  preloadUrls?: string[];
  showHeatmap?: boolean;
  vertexEase?: number[];
  colorScale?: ColorScale;
}

const ThreeViewer = ({ avatarUrl = '/models/Duck.glb', garmentUrl ='/models/DamagedHelmet.glb', preloadUrls, showHeatmap = false, vertexEase = [], colorScale,}: ThreeViewerProps) => {
  const garmentMeshRef = useRef<THREE.Mesh>(null);

  return (
    <div className="relative h-full w-full">
      <Suspense fallback={<ViewerLoading className="absolute inset-0"/>}>
        <ViewerErrorBoundary>
          <Canvas camera={{ position: [0, 1, 3], fov: 45}} dpr={[1, 1.5]} gl={{powerPreference: 'high-performance', antialias:true}}>
            <ambientLight intensity={0.6}/>
            <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow/>
            <directionalLight position={[-3, 2, -2]} intensity={0.4}/>
            <Environment preset='studio'/>
            <ContactShadows opacity={0.4} blur={2}/>
            <CameraController/>
            <AvatarModel url={avatarUrl}/>
            <GarmentModel ref={garmentMeshRef} url={garmentUrl} preloadUrls={preloadUrls}/>
            <HeatmapRenderer meshRef={garmentMeshRef} showHeatmap={showHeatmap} vertexEase={vertexEase} colorScale = {colorScale}/>
            {import.meta.env.DEV && <Stats/>}
            {import.meta.env.DEV && <PerfMonitor/>}
          </Canvas>
        </ViewerErrorBoundary>
      </Suspense>
    </div>
  )
}

export default ThreeViewer;