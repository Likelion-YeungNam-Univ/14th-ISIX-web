// ThreeViewer.tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import GarmentModel from './GarmentModel';
import CameraController from './CameraController';
import AvatarModel from './AvatarModel';
import ViewerLoading from './ViewerLoading';
import ViewerErrorBoundary from './ViewerErrorBoundary';

interface ThreeViewerProps {
  avatarUrl?: string;
  garmentUrl?: string;
}

const ThreeViewer = ({ avatarUrl = '/models/Duck.glb', garmentUrl ='/models/DamagedHelmet.glb' }: ThreeViewerProps) => {
  return (
    <div className="relative h-full w-full">
      <Suspense fallback={<ViewerLoading className="absolute inset-0"/>}>
        <ViewerErrorBoundary>
          <Canvas camera={{ position: [0, 1, 3], fov: 45}}>
            <ambientLight intensity={0.6}/>
            <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow/>
            <directionalLight position={[-3, 2, -2]} intensity={0.4}/>
            <Environment preset='studio'/>
            <ContactShadows opacity={0.4} blur={2}/>
            <CameraController/>
            <AvatarModel key={avatarUrl} url={avatarUrl}/>
            <GarmentModel key={garmentUrl} url={garmentUrl}/>
          </Canvas>
        </ViewerErrorBoundary>
      </Suspense>
    </div>
  )
}

export default ThreeViewer;