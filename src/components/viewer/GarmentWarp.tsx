import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { warpGarment, gridBodyUrl } from './warpGarment';

/**
 * 옷을 사용자 아바타 모양으로 옮깁니다.
 *
 * 옷은 격자 대표 체형 12구간 위에서 미리 시뮬해 둔 것이라, 그대로 띄우면
 * 어깨는 허공에 뜨고 몸통은 옷을 뚫고 나옵니다. 실측으로 옷 정점 8,075개
 * 중 1,178개(14.6%)가 몸 안에 들어가 있었습니다. 워핑을 거치면 0 이 됩니다.
 *
 * 격자 몸 GLB 하나만 더 받으면 되고 서버는 건드리지 않습니다. body_class 는
 * 히트맵 때문에 이미 받고 있는 ease.json 에 들어 있습니다.
 *
 * 계산은 26ms 이고 옷이나 아바타가 바뀔 때만 돕니다.
 */

interface GarmentWarpProps {
    meshRef: React.RefObject<THREE.Mesh | null>;
    avatarUrl: string;
    /** 옷이 바뀌면 다시 계산해야 해서 받습니다. 로딩에는 쓰지 않습니다. */
    garmentUrl: string;
    bodyClass: string;
    /** 끄면 옷을 원래 좌표로 되돌립니다. 문제가 생기면 이것만 false 로. */
    enabled?: boolean;
}

/** GLB 씬에서 첫 메시의 정점 좌표를 꺼냅니다. */
const positionsOf = (scene: THREE.Object3D): Float32Array | null => {
    let found: Float32Array | null = null;
    scene.traverse((child) => {
        if (found) return;
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
            const attr = mesh.geometry.getAttribute('position');
            if (attr) found = attr.array as Float32Array;
        }
    });
    return found;
};

const GarmentWarp = ({ meshRef, avatarUrl, garmentUrl, bodyClass, enabled = true }: GarmentWarpProps) => {
    const gridUrl = gridBodyUrl(bodyClass);
    // gridUrl 이 없으면 이 컴포넌트를 아예 렌더하지 않으므로 여기선 항상 있습니다.
    const grid = useGLTF(gridUrl as string, true);
    const avatar = useGLTF(avatarUrl, true);

    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const attr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
        if (!attr) return;

        // useGLTF 는 씬을 캐시해서 돌려줍니다. 좌표를 그대로 덮으면 사이즈를
        // 바꿨다 돌아왔을 때 이미 옮긴 옷에 또 옮겨 붙습니다. 원본을 한 번
        // 보관해 두고 항상 거기서 다시 계산합니다.
        const store = mesh.geometry.userData as { originalPositions?: Float32Array };
        if (!store.originalPositions) {
            store.originalPositions = (attr.array as Float32Array).slice();
        }
        const original = store.originalPositions;

        const restore = () => {
            (attr.array as Float32Array).set(original);
            attr.needsUpdate = true;
            mesh.geometry.computeVertexNormals();
        };

        if (!enabled) {
            restore();
            return;
        }

        const gridPos = positionsOf(grid.scene);
        const avatarPos = positionsOf(avatar.scene);
        if (!gridPos || !avatarPos) {
            restore();
            return;
        }

        const result = warpGarment({ garment: original, grid: gridPos, avatar: avatarPos });

        // 정점 수가 안 맞으면 null 입니다. 그때는 옷을 그대로 둡니다 —
        // 워핑을 붙이기 전과 같은 화면이라 더 나빠지지 않습니다.
        if (!result) {
            console.warn('[warp] 격자 몸과 아바타의 정점 수가 다릅니다. 워핑을 건너뜁니다.');
            restore();
            return;
        }

        // 옮긴 거리가 터무니없으면 단위나 대응이 어긋난 것입니다. 그대로
        // 내보내면 옷이 화면 밖으로 날아가는데, 오류는 안 납니다.
        if (result.maxShiftCm > 30) {
            console.warn(`[warp] 이동량이 비정상입니다 (최대 ${result.maxShiftCm.toFixed(1)}cm). 워핑을 건너뜁니다.`);
            restore();
            return;
        }

        (attr.array as Float32Array).set(result.positions);
        attr.needsUpdate = true;
        mesh.geometry.computeVertexNormals();

        return restore;
    }, [meshRef, grid.scene, avatar.scene, garmentUrl, enabled]);

    return null;
};

export default GarmentWarp;
