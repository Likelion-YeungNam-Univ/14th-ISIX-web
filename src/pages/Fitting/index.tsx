import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getFittingResult } from '@/api/fitting';
import { getGarments } from '@/api/garment';

import type { FittingResult } from '@/types/fitting';
import type { Garment, GarmentSize } from '@/types/garment';

import ThreeViewer from '@/components/viewer/ThreeViewer';
import { fetchEaseData } from '@/api/ease';
import type { ColorScale } from '@/constants/heatmapColors';

import {
  FIT_COLORS,
  type FitVerdict,
} from '@/constants/fit';

interface FittingPageState {
  jobId: string;
  avatarId: number;
  glbUrl: string | null;
  measurements: Record<string, number> | null;
  height?: number;
  weight?: number;
}

const bodyPartLabelMap: Record<string, string> = {
  shoulder_width: '어깨너비',
  chest_circ: '가슴둘레',
  waist_circ: '허리둘레',
  hip_circ: '엉덩이둘레',
  neck_circ: '목둘레',
  arm_circ: '팔둘레',
  thigh_circ: '허벅지둘레',
  back_length: '등길이',
  sleeve_length: '팔길이',
  inseam: '안쪽 다리길이',
  total_length: '전체 길이',
  front_width: '앞너비',
};

const normalizeVerdict = (verdict: string): FitVerdict | null => {
  switch (verdict) {
    case 'loose':
    case '여유 있음':
      return 'loose';

    case 'good':
    case '적정':
      return 'good';

    case 'tight':
    case '꽉 낌':
      return 'tight';

    default:
      return null;
  }
};

const getVerdictColor = (verdict: string) => {
  const normalizedVerdict = normalizeVerdict(verdict);

  return normalizedVerdict
    ? FIT_COLORS[normalizedVerdict]
    : '#8C8880';
};

const Fitting = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pageState = location.state as FittingPageState | null;

  const avatarId = pageState?.avatarId;
  const glbUrl = pageState?.glbUrl;

  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedGarmentId, setSelectedGarmentId] = useState<
    string | null
  >(null);

  const [fittingResult, setFittingResult] =
    useState<FittingResult | null>(null);

  const [selectedSize, setSelectedSize] =
    useState<GarmentSize | null>(null);

  const [isGarmentsLoading, setIsGarmentsLoading] =
    useState(false);

  const [isFittingLoading, setIsFittingLoading] =
    useState(false);

  const [garmentsError, setGarmentsError] = useState('');
  const [fittingError, setFittingError] = useState('');

  const [garmentsRetryKey, setGarmentsRetryKey] = useState(0);
  const [fittingRetryKey, setFittingRetryKey] = useState(0);

  const [vertexEase, setVertexEase] = useState<number[]>([]);
  const [colorScale, setColorScale] = useState<ColorScale | undefined>(undefined);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const selectedGarment = useMemo(
    () =>
      garments.find(
        (garment) => garment.garmentId === selectedGarmentId,
      ) ?? null,
    [garments, selectedGarmentId],
  );

  const selectedSizeDetail =
    fittingResult && selectedSize
      ? fittingResult.sizes[selectedSize]
      : null;

  useEffect(() => {
    if (!avatarId) {
      return;
    }

    let isCancelled = false;

    const loadGarments = async () => {
      setIsGarmentsLoading(true);
      setGarmentsError('');

      try {
        const garmentList = await getGarments();

        if (isCancelled) {
          return;
        }

        setGarments(garmentList);

        if (garmentList.length > 0) {
          setSelectedGarmentId(garmentList[0].garmentId);
        }
      } catch (error) {
        console.error('의류 목록 조회 실패:', error);

        if (!isCancelled) {
          setGarmentsError(
            '의류 목록을 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsGarmentsLoading(false);
        }
      }
    };

    void loadGarments();

    return () => {
      isCancelled = true;
    };
  }, [avatarId, garmentsRetryKey]);

  useEffect(() => {
    if (!avatarId || selectedGarmentId === null) {
      return;
    }

    let isCancelled = false;

    const loadFittingResult = async () => {
      setIsFittingLoading(true);
      setFittingError('');
      setFittingResult(null);
      setSelectedSize(null);

      try {
        const result = await getFittingResult(
          avatarId,
          selectedGarmentId,
        );

        if (isCancelled) {
          return;
        }

        setFittingResult(result);
        setSelectedSize(result.recommendedSize);
      } catch (error) {
        console.error('피팅 결과 조회 실패:', error);

        if (!isCancelled) {
          setFittingError(
            '피팅 결과를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsFittingLoading(false);
        }
      }
    };

    void loadFittingResult();

    return () => {
      isCancelled = true;
    };
  }, [avatarId, selectedGarmentId, fittingRetryKey]);

  useEffect(()=>{
    const easeUrl =selectedSizeDetail?.easeUrl;

    if(!easeUrl) {
      setVertexEase([]);
      setColorScale(undefined);
      return;
    }

    let isCancelled = false;

    const loadEaseData = async () => {
      try {
        const easeData = await fetchEaseData(easeUrl);

        if(isCancelled) return;

        setVertexEase(easeData.vertex_ease);

        if(easeData.color_scale) {
          setColorScale({
            low: easeData.color_scale[0],
            high: easeData.color_scale[1],
          });
        }
      } catch(error){
        console.error('ease.json 조회 실패:', error);

        if(!isCancelled){
          setVertexEase([]);
          setColorScale(undefined);
        }
      }
    };

    void loadEaseData();

    return () => {
      isCancelled = true;
    };
  }, [selectedSizeDetail?.easeUrl]);

  if (!avatarId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold text-text">
            아바타 정보가 없습니다
          </h1>

          <p className="mt-4 text-text-sub">
            아바타를 먼저 생성한 뒤 피팅룸을 이용해 주세요.
          </p>

          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-bg"
          >
            아바타 생성하기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <section className="mx-auto w-full max-w-6xl">
        <p className="text-sm font-medium text-gold">
          3D FITTING ROOM
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-text">
          가상 피팅룸
        </h1>

        <p className="mt-3 text-text-sub">
          의류와 사이즈를 선택하고 피팅 결과를 확인합니다.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-text">
              아바타
            </h2>

            <button type="button" onClick={()=> setShowHeatmap((prev)=>!prev)}
            className = "rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:border-gold hover:text-gold">
              히트맵 {showHeatmap ? 'ON' : 'OFF'}
            </button>

            <div className="mt-4 h-[520px] overflow-hidden rounded-xl border border-border bg-bg">
              {glbUrl ? (
                <ThreeViewer avatarUrl={glbUrl}
                garmentUrl={selectedSizeDetail?.modelUrl ?? undefined}
                showHeatmap={showHeatmap}
                vertexEase={vertexEase}
                colorScale={colorScale}/>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-text-sub">
                    아바타 3D 데이터를 불러올 수 없습니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-text">
                의류 선택
              </h2>

              {isGarmentsLoading && (
                <p className="mt-4 text-sm text-text-sub">
                  의류 목록을 불러오고 있습니다.
                </p>
              )}

              {garmentsError && (
                <div className="mt-4">
                  <p className="text-sm text-red-400">
                    {garmentsError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setGarmentsRetryKey((prev) => prev + 1)
                    }
                    className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition hover:border-gold hover:text-gold"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {!isGarmentsLoading &&
                !garmentsError &&
                garments.length === 0 && (
                  <p className="mt-4 text-sm text-text-sub">
                    등록된 의류가 없습니다.
                  </p>
                )}

              <div className="mt-4 grid gap-3">
                {garments.map((garment) => {
                  const isSelected =
                    garment.garmentId === selectedGarmentId;

                  return (
                    <button
                      key={garment.garmentId}
                      type="button"
                      onClick={() =>
                        setSelectedGarmentId(
                          garment.garmentId,
                        )
                      }
                      className={`flex items-center gap-4 rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-gold bg-gold/10'
                          : 'border-border bg-bg'
                      }`}
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
                        {garment.thumbnailUrl ? (
                          <img
                            src={garment.thumbnailUrl}
                            alt={garment.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-text-sub">
                            NO IMAGE
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-text">
                          {garment.name}
                        </p>

                        <p className="mt-1 text-sm text-text-sub">
                          {garment.category}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-text">
                사이즈
              </h2>

              {!selectedGarment && (
                <p className="mt-4 text-sm text-text-sub">
                  의류를 먼저 선택해 주세요.
                </p>
              )}

              {isFittingLoading && (
                <p className="mt-4 text-sm text-text-sub">
                  피팅 결과를 계산하고 있습니다.
                </p>
              )}

              {fittingError && (
                <div className="mt-4">
                  <p className="text-sm text-red-400">
                    {fittingError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setFittingRetryKey((prev) => prev + 1)
                    }
                    className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition hover:border-gold hover:text-gold"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {fittingResult && (
                <>
                  <div className="mt-4 flex gap-3">
                    {(
                      Object.keys(
                        fittingResult.sizes,
                      ) as GarmentSize[]
                    ).map((size) => {
                      const sizeDetail =
                        fittingResult.sizes[size];

                      const isSelected =
                        selectedSize === size;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setSelectedSize(size)
                          }
                          className={`relative flex-1 rounded-xl border px-4 py-3 font-semibold transition ${
                            isSelected
                              ? 'border-gold bg-gold text-bg'
                              : 'border-border bg-bg text-text'
                          }`}
                        >
                          {size.toUpperCase()}

                          {sizeDetail.recommended && (
                            <span className="absolute -right-2 -top-2 rounded-full bg-gold px-2 py-1 text-[10px] font-bold text-bg">
                              추천
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-xl bg-bg p-4">
                    <p className="font-semibold text-text">
                      추천 사이즈:{' '}
                      <span className="text-gold">
                        {fittingResult.recommendedSize.toUpperCase()}
                      </span>
                    </p>

                    <p className="mt-2 text-sm leading-6 text-text-sub">
                      {
                        fittingResult.recommendationReason
                      }
                    </p>
                  </div>
                </>
              )}
            </section>

            {selectedSizeDetail && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text">
                    {selectedSize?.toUpperCase()} 피팅 결과
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedSizeDetail.wearable
                        ? 'bg-green-400/10 text-green-300'
                        : 'bg-red-400/10 text-red-300'
                    }`}
                  >
                    {selectedSizeDetail.wearable
                      ? '착용 가능'
                      : '착용 어려움'}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedSizeDetail.parts.map((part) => (
                    <div
                      key={part.part}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: `${getVerdictColor(part.verdict)}4D`,
                        backgroundColor: `${getVerdictColor(part.verdict)}1A`,
                        color: getVerdictColor(part.verdict),
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold">
                          {bodyPartLabelMap[part.part] ?? part.part}
                        </p>

                        <span className="text-sm font-medium">
                          {part.verdict}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="opacity-70">
                            실제 여유
                          </p>
                          <p className="mt-1 font-semibold">
                            {part.actualEase.toFixed(1)}cm
                          </p>
                        </div>

                        <div>
                          <p className="opacity-70">
                            기준 여유
                          </p>
                          <p className="mt-1 font-semibold">
                            {part.refEase.toFixed(1)}cm
                          </p>
                        </div>

                        <div>
                          <p className="opacity-70">
                            편차
                          </p>
                          <p className="mt-1 font-semibold">
                            {part.deviation.toFixed(1)}cm
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!selectedSizeDetail.modelUrl && (
                  <p className="mt-5 text-sm text-text-sub">
                    이 사이즈의 3D 착용 모델은 아직 준비되지
                    않았습니다.
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Fitting;