/**
 * 사전 시뮬한 옷을 사용자 아바타 모양으로 옮깁니다.
 *
 * **왜 필요한가.** 옷은 격자 대표 체형 12구간 위에서 미리 시뮬해 두고,
 * 화면에는 사용자의 실제 아바타를 띄웁니다. 두 몸이 다른데 옷은 격자 몸
 * 기준 좌표에 저장돼 있어서, 아바타의 어깨가 낮으면 옷은 그 위 허공에
 * 남고 몸통은 옷 표면을 뚫고 나옵니다.
 *
 * 실측 (아바타 165cm · 격자 H2B0 170cm · 티셔츠 M · 옷 정점 8,075개)
 *
 *     방식                관통    어깨틈    변형률
 *     그대로              1178   2.63cm    0.00%
 *     어깨 맞춤 평행이동    2626   0.77cm       -
 *     균일 확대 1.20배      302   7.37cm    0.00%
 *     법선 팽창 1.5cm        63   4.14cm   25.70%
 *     밀어내기만              0   2.63cm   17.09%
 *     워핑                    0   0.87cm    3.55%
 *
 * 평행이동 계열은 어깨를 잡으면 관통이 늘어납니다. 몸이 부위마다 다른
 * 양으로 움직였기 때문입니다(어깨 4.91cm / 가슴 4.15 / 허리 3.40 /
 * 엉덩이 3.05). 하나의 벡터로는 이걸 담지 못합니다.
 *
 * **어떻게 고치나.** 격자 몸과 아바타는 둘 다 SMPL-X 라 정점이 10,475개로
 * 같고 정점 i 가 두 몸에서 같은 해부학적 지점입니다. 빼면 부위별 이동량이
 * 나오고, 그걸 가까운 옷 정점에 거리 가중으로 전달합니다.
 *
 * 가중치가 거리로 감쇠하므로(SIGMA_CM) 몸에 붙은 부분만 몸을 따라가고 떠
 * 있는 부분은 제자리에 남습니다. 옷이 몸을 따라 줄어들지 않습니다.
 */

/** 옷 정점 하나가 참조할 몸 정점 개수. */
const K = 8;

/**
 * 가중치 감쇠 폭(cm). 이 값이 "옷이 몸을 따라 줄어들지 않는" 이유입니다.
 * 크게 잡으면 멀리 떠 있는 정점까지 몸을 따라가 옷이 수축하고,
 * 작게 잡으면 몸에 닿은 부분마저 안 따라가 파고듭니다.
 */
const SIGMA_CM = 3.0;

/** 이웃 탐색용 격자 한 칸의 크기(cm). SIGMA 보다 커야 후보가 충분히 잡힙니다. */
const CELL_CM = 5.0;

/** 미터로 저장된 메시인지. GLB 는 단위를 강제하지 않아 파일마다 다릅니다. */
const isMeters = (maxY: number) => maxY < 10;

export interface WarpInput {
    /** 옷 정점 좌표 (three.js position 속성의 배열) */
    garment: Float32Array | number[];
    /** 격자 대표 체형 정점 좌표 */
    grid: Float32Array | number[];
    /** 사용자 아바타 정점 좌표 */
    avatar: Float32Array | number[];
}

export interface WarpResult {
    positions: Float32Array;
    /** 옮긴 거리의 평균·최대(cm). 값이 터무니없으면 호출부가 버립니다. */
    meanShiftCm: number;
    maxShiftCm: number;
}

const maxOf = (a: ArrayLike<number>, offset: number) => {
    let m = -Infinity;
    for (let i = offset; i < a.length; i += 3) if (a[i] > m) m = a[i];
    return m;
};

/**
 * 옷 정점을 아바타 모양으로 옮긴 좌표를 돌려줍니다.
 *
 * 격자 몸과 아바타의 정점 수가 다르면 정점 i 가 같은 지점을 가리키지 않아
 * 결과가 조용히 틀어집니다. 그래서 여기서 막고 null 을 돌려줍니다.
 * 호출부는 그때 옷을 그대로 두면 됩니다 — 지금과 같은 화면입니다.
 */
export const warpGarment = ({ garment, grid, avatar }: WarpInput): WarpResult | null => {
    if (grid.length !== avatar.length || grid.length === 0) return null;
    if (garment.length === 0) return null;

    const nBody = grid.length / 3;
    const nGarment = garment.length / 3;

    // --- 단위 맞추기 -------------------------------------------------------
    // 배포된 파일이 아바타는 m, 의류는 cm 로 섞여 있습니다. 어느 쪽이든
    // 돌아가도록 실행 시점에 재서 맞춥니다. 여기를 가정으로 두면 100배
    // 틀어진 결과가 오류 없이 화면에 나갑니다.
    const bodyMeters = isMeters(maxOf(avatar, 1));
    const garmentMeters = isMeters(maxOf(garment, 1));
    const bodyToGarment = bodyMeters === garmentMeters ? 1 : bodyMeters ? 100 : 0.01;
    const cmPerGarmentUnit = garmentMeters ? 100 : 1;

    const sigma = SIGMA_CM / cmPerGarmentUnit;
    const cell = CELL_CM / cmPerGarmentUnit;
    const inv2Sigma2 = 1 / (sigma * sigma);

    // --- 몸 정점을 옷 좌표계로 옮기고 이동량을 구합니다 --------------------
    const bx = new Float32Array(nBody * 3);   // 격자 몸 (옷 좌표계)
    const dp = new Float32Array(nBody * 3);   // 부위별 이동량
    for (let i = 0; i < nBody * 3; i++) {
        bx[i] = grid[i] * bodyToGarment;
        dp[i] = (avatar[i] - grid[i]) * bodyToGarment;
    }

    // --- 격자 해시 ---------------------------------------------------------
    // 정점 8천 개마다 1만 개에서 최근접 8개를 찾습니다. 전수 비교는 8천만
    // 번이라 브라우저에서 초 단위가 걸립니다. 칸으로 나눠 주변만 봅니다.
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < nBody; i++) {
        const x = bx[i * 3], y = bx[i * 3 + 1], z = bx[i * 3 + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const nx = Math.max(1, Math.ceil((maxX - minX) / cell));
    const ny = Math.max(1, Math.ceil((maxY - minY) / cell));
    const nz = Math.max(1, Math.ceil((maxZ - minZ) / cell));
    const cellOf = (x: number, y: number, z: number) => {
        const i = Math.min(nx - 1, Math.max(0, Math.floor((x - minX) / cell)));
        const j = Math.min(ny - 1, Math.max(0, Math.floor((y - minY) / cell)));
        const k = Math.min(nz - 1, Math.max(0, Math.floor((z - minZ) / cell)));
        return { i, j, k };
    };

    const buckets: number[][] = Array.from({ length: nx * ny * nz }, () => []);
    for (let v = 0; v < nBody; v++) {
        const { i, j, k } = cellOf(bx[v * 3], bx[v * 3 + 1], bx[v * 3 + 2]);
        buckets[(i * ny + j) * nz + k].push(v);
    }

    // --- 옷 정점마다 최근접 K 개를 찾아 이동량을 섞습니다 ------------------
    const out = new Float32Array(garment.length);
    const bestD = new Float64Array(K);
    const bestI = new Int32Array(K);
    let sumShift = 0, maxShift = 0;

    for (let g = 0; g < nGarment; g++) {
        const px = garment[g * 3], py = garment[g * 3 + 1], pz = garment[g * 3 + 2];
        const c = cellOf(px, py, pz);

        let found = 0;

        // 반경을 넓혀가며 봅니다. K 개가 찼다고 바로 멈추면 안 됩니다 —
        // 칸 경계 근처에서는 한 칸 더 밖에 진짜 최근접이 있을 수 있습니다.
        // 반경 r 밖의 점은 최소 r*cell 만큼 떨어져 있으므로, K번째 후보가
        // 그보다 가까워졌을 때 비로소 확정입니다.
        for (let r = 1; r <= 8; r++) {
            found = 0;
            bestD.fill(Infinity);
            bestI.fill(-1);
            for (let i = Math.max(0, c.i - r); i <= Math.min(nx - 1, c.i + r); i++) {
                for (let j = Math.max(0, c.j - r); j <= Math.min(ny - 1, c.j + r); j++) {
                    for (let k = Math.max(0, c.k - r); k <= Math.min(nz - 1, c.k + r); k++) {
                        const list = buckets[(i * ny + j) * nz + k];
                        for (let n = 0; n < list.length; n++) {
                            const v = list[n];
                            const dx = bx[v * 3] - px;
                            const dy = bx[v * 3 + 1] - py;
                            const dz = bx[v * 3 + 2] - pz;
                            const d2 = dx * dx + dy * dy + dz * dz;
                            // K 개짜리 삽입 정렬. K 가 8 이라 이게 힙보다 빠릅니다.
                            if (d2 < bestD[K - 1]) {
                                let s = K - 1;
                                while (s > 0 && bestD[s - 1] > d2) {
                                    bestD[s] = bestD[s - 1];
                                    bestI[s] = bestI[s - 1];
                                    s--;
                                }
                                bestD[s] = d2;
                                bestI[s] = v;
                                if (found < K) found++;
                            }
                        }
                    }
                }
            }
            const reach = r * cell;
            if (found >= K && bestD[K - 1] <= reach * reach) break;
        }

        if (found === 0) {                       // 몸에서 아주 먼 정점은 그대로 둡니다
            out[g * 3] = px; out[g * 3 + 1] = py; out[g * 3 + 2] = pz;
            continue;
        }

        let wsum = 0, ax = 0, ay = 0, az = 0;
        for (let s = 0; s < K; s++) {
            const v = bestI[s];
            if (v < 0) continue;
            const w = Math.exp(-bestD[s] * inv2Sigma2);
            wsum += w;
            ax += w * dp[v * 3];
            ay += w * dp[v * 3 + 1];
            az += w * dp[v * 3 + 2];
        }
        if (wsum <= 0) {                         // 지수가 0 으로 죽은 경우
            out[g * 3] = px; out[g * 3 + 1] = py; out[g * 3 + 2] = pz;
            continue;
        }
        ax /= wsum; ay /= wsum; az /= wsum;
        out[g * 3] = px + ax;
        out[g * 3 + 1] = py + ay;
        out[g * 3 + 2] = pz + az;

        const shift = Math.sqrt(ax * ax + ay * ay + az * az) * cmPerGarmentUnit;
        sumShift += shift;
        if (shift > maxShift) maxShift = shift;
    }

    return {
        positions: out,
        meanShiftCm: sumShift / nGarment,
        maxShiftCm: maxShift,
    };
};

/** 격자 대표 체형 GLB 주소. body_class 는 ease.json 이 이미 내려주고 있습니다. */
export const gridBodyUrl = (bodyClass: string): string | null =>
    /^H[0-2]B[0-3]$/.test(bodyClass)
        ? `https://pub-1aa68cdb548b4177a7d828625c6f6bdb.r2.dev/grid/v1/${bodyClass}.glb`
        : null;
