//히트맵 색상

export const HEATMAP_COLORS = {
    loose: '#2E86C1',
    good : '#27AE60',
    tight :'#D68910',
    impossible : '#C0392B'
} as const;

export const HEATMAP_LEGEND = [
    { level : 'loose', lable:'헐렁', range: '+8cm 이상', color: HEATMAP_COLORS.loose},
    { level : 'good', lable:'적정', range: '+2~8cm', color: HEATMAP_COLORS.good},
    { level : 'tight', lable:'타이트', range: '0~2cm', color: HEATMAP_COLORS.tight},
    { level : 'impossible', lable:'불가', range: '0cm 미만', color: HEATMAP_COLORS.impossible},
] as const;

function hexToRgb01(hex:string):[number, number, number] {
    const r	= parseInt(hex.slice(1,	3),	16)	/ 255;
    const g	= parseInt(hex.slice(3,	5),	16)	/ 255;
    const b	= parseInt(hex.slice(5,	7),	16)	/ 255;
    return	[r,	g,	b];
}

export function easeToColor(ease:number):[number, number, number] {
    if(ease>=8) return hexToRgb01(HEATMAP_COLORS.loose);
    if(ease>=2) return hexToRgb01(HEATMAP_COLORS.good);
    if(ease>=0) return hexToRgb01(HEATMAP_COLORS.tight);
    return hexToRgb01(HEATMAP_COLORS.impossible);
}