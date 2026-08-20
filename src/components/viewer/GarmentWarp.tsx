import { useDeferredValue, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { warpGarment, gridBodyUrl } from './warpGarment';

/**
 * 옷을 사용자 아바타 모양으로 옮깁니다.
 *
 * 옷은 격자 대표 체형 12구간 위에서 미리 시뮬해 둔 것이라, 그대로 띄우면
 * 어깨는 허공에 뜨고 몸통은 옷을 뚫고 나옵니다. 실측으로 바지 정점 13,165개
 * 중 2,129개가 몸 안에 들어가 있었습니다. 워핑을 거치면 20~100개, 침투 2mm
 * 아래로 떨어집니다.
 *
 * 격자 몸 GLB 하나만 더 받으면 되고 서버는 건드리지 않습니다. body_class 는
 * 히트맵 때문에 이미 받고 있는 ease.json 에 들어 있습니다.
 *
 * **옷 씬을 직접 잡습니다.** meshRef 를 받아 쓰면 사이즈를 바꿨을 때 워핑이
 * 빠집니다. GarmentModel 이 useDeferredValue 로 URL 을 한 박자 늦게 반영해서,
 * prop 이 바뀌는 시점에는 ref 가 아직 옛 메시를 가리키고, ref 가 갱신되는
 * 시점에는 이 효과의 의존성이 그대로라 다시 돌지 않기 때문입니다.
 * 같은 URL 로 useGLTF 를 부르면 캐시된 같은 씬이 오므로 추가 요청이 없고,
 * 씬 객체 자체를 의존성에 둘 수 있습니다.
 */

interface GarmentWarpProps {
    /** GarmentModel 에 준 것과 같은 URL. useGLTF 캐시를 타므로 재요청이 없습니다. */
    garmentUrl: string;
    avatarUrl: string;
    bodyClass: string;
    /** 끄면 옷을 원래 좌표로 되돌립니다. 문제가 생기면 이것만 false 로. */
    enabled?: boolean;
}

/** GLB 씬에서 첫 메시를 찾습니다. GarmentModel 과 같은 규칙입니다. */
const firstMeshOf = (root: THREE.Object3D): THREE.Mesh | null => {
    let found: THREE.Mesh | null = null;
    root.traverse((child) => {
        if (!found && child instanceof THREE.Mesh) {
            found = child;
        }
    });
    return found;
};

const GarmentWarp = ({ garmentUrl, avatarUrl, bodyClass, enabled = true }: GarmentWarpProps) => {
    // GarmentModel 과 같은 값을 보도록 맞춥니다. 어긋나면 서로 다른 씬을 잡습니다.
    const deferredUrl = useDeferredValue(garmentUrl);

    const garment = useGLTF(deferredUrl, true);
    const grid = useGLTF(gridBodyUrl(bodyClass) as string, true);
    const avatar = useGLTF(avatarUrl, true);

    useEffect(() => {
        const mesh = firstMeshOf(garment.scene);
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

        const gridPos = firstMeshOf(grid.scene)?.geometry.getAttribute('position')?.array as
            | Float32Array
            | undefined;
        const avatarPos = firstMeshOf(avatar.scene)?.geometry.getAttribute('position')?.array as
            | Float32Array
            | undefined;

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
            console.warn(
                `[warp] 이동량이 비정상입니다 (최대 ${result.maxShiftCm.toFixed(1)}cm). 워핑을 건너뜁니다.`,
            );
            restore();
            return;
        }

        (attr.array as Float32Array).set(result.positions);
        attr.needsUpdate = true;
        mesh.geometry.computeVertexNormals();

        return restore;
    }, [garment.scene, grid.scene, avatar.scene, enabled]);

    return null;
};

export default GarmentWarp;
