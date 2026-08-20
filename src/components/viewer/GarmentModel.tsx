import {
  forwardRef,
  useDeferredValue,
  useEffect,
} from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface GarmentModelProps {
  url: string;
  preloadUrls?: string[];
}

const GarmentModel = forwardRef<
  THREE.Mesh,
  GarmentModelProps
>(({ url, preloadUrls }, ref) => {
  const deferredUrl = useDeferredValue(url);

  const { scene } = useGLTF(
    deferredUrl,
    true,
  );

  useEffect(() => {
    preloadUrls?.forEach((preloadUrl) => {
      useGLTF.preload(
        preloadUrl,
        true,
      );
    });
  }, [preloadUrls]);

  useEffect(() => {
    let firstMesh: THREE.Mesh | null =
      null;

    scene.traverse((child) => {
      if (
        !firstMesh &&
        child instanceof THREE.Mesh
      ) {
        firstMesh = child;
      }
    });

    if (
      ref &&
      typeof ref !== 'function'
    ) {
      ref.current = firstMesh;
    }
  }, [scene, ref]);

  return (
    <primitive
      object={scene}
      scale={0.01}
    />
  );
});

GarmentModel.displayName =
  'GarmentModel';

export default GarmentModel;