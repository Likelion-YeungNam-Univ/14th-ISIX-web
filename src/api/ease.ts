export interface EaseJson {
    garment_id : string;
    size : string;
    body_class : string;
    parts: Record<string, number>;
    vertex_ease: number[];
    color_scale?: [number,number]; // 실제 필드명 확인 필요
}

export const fetchEaseData = async (
    easeUrl: string,
): Promise<EaseJson> => {
    const response = await fetch(easeUrl);

    if(!response.ok) {
        throw new Error('ease.json 조회 실패 : $[response.status]');
    }

    return response.json();
};