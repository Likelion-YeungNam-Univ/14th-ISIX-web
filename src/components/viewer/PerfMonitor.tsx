// src/components/viewer/PerfMonitor.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const FPS_THRESHOLD = 30;
const SAMPLE_INTERVAL_MS = 2000;

const PerfMonitor = () => {
  const frameCount = useRef(0);
  const lastCheckTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current += 1;

    const now = performance.now();
    const elapsed = now - lastCheckTime.current;

    if (elapsed >= SAMPLE_INTERVAL_MS) {
      const fps = Math.round((frameCount.current / elapsed) * 1000);

      if (fps < FPS_THRESHOLD) {
        console.warn(`⚠️ [PerfMonitor] 평균 ${fps}fps — 목표(${FPS_THRESHOLD}fps) 미달`);
      } else {
        console.log(`[PerfMonitor] 평균 ${fps}fps`);
      }

      frameCount.current = 0;
      lastCheckTime.current = now;
    }
  });

  return null;
};

export default PerfMonitor;