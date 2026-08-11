import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds } from '@react-three/drei';

import AvatarModel from './AvatarModel';
import ViewerLoading from './ViewerLoading';
import ViewerErrorBoundary from './ViewerErrorBoundary';

interface ThreeViewerProps {
  avatarUrl?: string;
}

const ThreeViewer = ({
  avatarUrl = '/models/Duck.glb',
}: ThreeViewerProps) => {
  return (
    <div className="relative h-full w-full">
      <Suspense
        fallback={
          <ViewerLoading className="absolute inset-0" />
        }
      >
        <ViewerErrorBoundary>
          <Canvas
            camera={{
              position: [0, 0, 3],
              fov: 45,
            }}
          >
            <Bounds
              fit
              clip
              observe
              margin={1.2}
            >
              <AvatarModel
                key={avatarUrl}
                url={avatarUrl}
              />
            </Bounds>
          </Canvas>
        </ViewerErrorBoundary>
      </Suspense>
    </div>
  );
};

export default ThreeViewer;