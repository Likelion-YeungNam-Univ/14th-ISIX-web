import type { ColorScale } from '@/constants/heatmapColors';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Stats,
} from '@react-three/drei';
import * as THREE from 'three';

import AvatarModel from './AvatarModel';
import CameraController from './CameraController';
import GarmentModel from './GarmentModel';
import GarmentWarp from './GarmentWarp';
import HeatmapRenderer from './HeatmapRenderer';
import PerfMonitor from './PerfMonitor';
import ViewerErrorBoundary from './ViewerErrorBoundary';
import ViewerLoading from './ViewerLoading';
import { gridBodyUrl } from './warpGarment';

interface ThreeViewerProps {
  avatarUrl?: string;
  garmentUrl?: string;
  preloadUrls?: string[];
  showHeatmap?: boolean;
  vertexEase?: number[];
  colorScale?: ColorScale;
  /**
   * 옷이 시뮬된 격자 체형 구간("H1B2").
   * ease.json 의 body_class 를 그대로 주면
   * 옷을 아바타 모양으로 옮깁니다.
   * 없으면 지금과 같은 화면입니다.
   */
  bodyClass?: string;
}

const ThreeViewer = ({
  avatarUrl,
  garmentUrl,
  preloadUrls,
  showHeatmap = false,
  vertexEase = [],
  colorScale,
  bodyClass,
}: ThreeViewerProps) => {
  const garmentMeshRef =
    useRef<THREE.Mesh>(null);

  // 격자 몸을 받을 수 있을 때만 워핑합니다.
  const canWarp = Boolean(
    avatarUrl &&
      garmentUrl &&
      bodyClass &&
      gridBodyUrl(bodyClass),
  );

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
              position: [0, 1, 3],
              fov: 45,
            }}
            dpr={[1, 1.5]}
            gl={{
              powerPreference:
                'high-performance',
              antialias: true,
            }}
          >
            <ambientLight intensity={0.6} />

            <directionalLight
              position={[3, 5, 2]}
              intensity={1.2}
              castShadow
            />

            <directionalLight
              position={[-3, 2, -2]}
              intensity={0.4}
            />

            <Environment preset="studio" />

            <ContactShadows
              opacity={0.4}
              blur={2}
            />

            <CameraController />

            {avatarUrl && (
              <AvatarModel
                url={avatarUrl}
              />
            )}

            {garmentUrl && (
              <>
                <GarmentModel
                  ref={garmentMeshRef}
                  url={garmentUrl}
                  preloadUrls={
                    preloadUrls
                  }
                />

                {canWarp && (
                  <GarmentWarp
                    garmentUrl={
                      garmentUrl
                    }
                    avatarUrl={
                      avatarUrl as string
                    }
                    bodyClass={
                      bodyClass as string
                    }
                  />
                )}

                <HeatmapRenderer
                  meshRef={
                    garmentMeshRef
                  }
                  showHeatmap={
                    showHeatmap
                  }
                  vertexEase={
                    vertexEase
                  }
                  colorScale={
                    colorScale
                  }
                />
              </>
            )}

            {import.meta.env.DEV && (
              <Stats />
            )}

            {import.meta.env.DEV && (
              <PerfMonitor />
            )}
          </Canvas>
        </ViewerErrorBoundary>
      </Suspense>
    </div>
  );
};

export default ThreeViewer;