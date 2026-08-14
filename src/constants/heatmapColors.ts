//히트맵 색상
export const HEATMAP_COLORS = {
    loose: '#285AC8',
    good : '#289656',
    tight :'#C82828',
} as const;

export const HEATMAP_LEGEND = [
    { level : 'loose', label:'여유', color: HEATMAP_COLORS.loose},
    { level : 'good', label:'보통', color: HEATMAP_COLORS.good},
    { level : 'tight', label:'밀착', color: HEATMAP_COLORS.tight},
] as const;

function hexToRgb01(hex:string):[number, number, number] {
    const r	= parseInt(hex.slice(1,	3),	16)	/ 255;
    const g	= parseInt(hex.slice(3,	5),	16)	/ 255;
    const b	= parseInt(hex.slice(5,	7),	16)	/ 255;
    return	[r,	g, b];
}

function lerpColor(
    a: [number, number, number],
    b: [number, number, number],
    t: number,
): [number, number, number] {
    const clamped = Math.min(1, Math.max(0, t));
    return [
        a[0] + (b[0] - a[0]) * clamped,
        a[1] + (b[1] - a[1]) * clamped,
        a[2] + (b[2] - a[2]) * clamped,
    ];
}

export interface ColorScale {
    low: number;
    high: number;
}

//ease.json에서 못 읽어 올 때의 기본값
export const DEFAULT_COLOR_SCALE : ColorScale = { low: 5.7, high: 18.8};

export function easeToColor(
    ease: number,
    scale: ColorScale = DEFAULT_COLOR_SCALE,
):[number, number, number] {
    const tight = hexToRgb01(HEATMAP_COLORS.tight);
    const good = hexToRgb01(HEATMAP_COLORS.good);
    const loose = hexToRgb01(HEATMAP_COLORS.loose);

    if(ease <= scale.low) return tight;
    if(ease >= scale.high) return loose;

    const mid = (scale.low + scale.high) / 2;

    if(ease <= mid){
        const t = (ease - scale.low) / (mid - scale.low);
        return lerpColor(tight, good, t);
    }

    const t = (ease - mid) / (scale.high - mid);
    return lerpColor(good, loose, t);
}