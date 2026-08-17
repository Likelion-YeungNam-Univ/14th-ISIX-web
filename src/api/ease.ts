export interface EaseColorScale {
    unit : string;
    tight : { max:number };
    ok : { min:number; max: number };
    loose : { min: number };
}

export interface EaseJson {
    garment_id : string;
    size : string;
    body_class : string;
    parts: Record<string, number | null>;
    vertex_ease: number[];
    color_scale?: EaseColorScale;
}

export const fetchEaseData = async (
    easeUrl: string,
): Promise<EaseJson> => {
    const response = await fetch(easeUrl);

    if(!response.ok) {
        throw new Error(`ease.json 조회 실패 : ${response.status}`);
    }

    return response.json();
};