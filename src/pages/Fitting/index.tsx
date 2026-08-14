import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getMyAvatars } from '@/api/avatar';
import { fetchEaseData } from '@/api/ease';
import { getFittingResult } from '@/api/fitting';
import { getGarments } from '@/api/garment';

import ThreeViewer from '@/components/viewer/ThreeViewer';

import {
  FIT_COLORS,
  type FitVerdict,
} from '@/constants/fit';
import type { ColorScale } from '@/constants/heatmapColors';

import type { AvatarJob } from '@/types/avatar';
import type { FittingResult } from '@/types/fitting';
import type { Garment, GarmentSize } from '@/types/garment';

import {
  getCurrentAvatar,
  saveCurrentAvatar,
  type CurrentAvatar,
} from '@/utils/avatarStorage';

interface FittingPageState {
  jobId?: string;
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

const normalizeVerdict = (
  verdict: string,
): FitVerdict | null => {
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

  const pageState =
    location.state as FittingPageState | null;

  const [activeAvatar, setActiveAvatar] =
    useState<CurrentAvatar | null>(() => {
      if (pageState?.avatarId) {
        return {
          avatarId: pageState.avatarId,
          glbUrl: pageState.glbUrl,
          measurements: pageState.measurements,
          height: pageState.height,
          weight: pageState.weight,
        };
      }

      return getCurrentAvatar();
    });

  const [avatars, setAvatars] = useState<AvatarJob[]>([]);
  const [isAvatarsLoading, setIsAvatarsLoading] =
    useState(true);
  const [avatarsError, setAvatarsError] = useState('');

  const avatarId = activeAvatar?.avatarId;
  const glbUrl = activeAvatar?.glbUrl;

  const [garments, setGarments] = useState<Garment[]>([]);

  const [
    selectedGarmentId,
    setSelectedGarmentId,
  ] = useState<number | null>(null);

  const [
    fittingResult,
    setFittingResult,
  ] = useState<FittingResult | null>(null);

  const [
    selectedSize,
    setSelectedSize,
  ] = useState<GarmentSize | null>(null);

  const [
    isGarmentsLoading,
    setIsGarmentsLoading,
  ] = useState(false);

  const [
    isFittingLoading,
    setIsFittingLoading,
  ] = useState(false);

  const [garmentsError, setGarmentsError] = useState('');
  const [fittingError, setFittingError] = useState('');

  const [
    garmentsRetryKey,
    setGarmentsRetryKey,
  ] = useState(0);

  const [
    fittingRetryKey,
    setFittingRetryKey,
  ] = useState(0);

  // #30 히트맵 상태
  const [vertexEase, setVertexEase] = useState<number[]>(
    [],
  );

  const [colorScale, setColorScale] =
    useState<ColorScale | undefined>(undefined);

  const [showHeatmap, setShowHeatmap] = useState(true);

  const selectedGarment = useMemo(
    () =>
      garments.find(
        (garment) =>
          garment.garmentId === selectedGarmentId,
      ) ?? null,
    [garments, selectedGarmentId],
  );

  const selectedSizeDetail =
    fittingResult && selectedSize
      ? fittingResult.sizes[selectedSize]
      : null;

  // 저장된 아바타 목록 조회
  useEffect(() => {
    let isCancelled = false;

    const loadAvatars = async () => {
      setIsAvatarsLoading(true);
      setAvatarsError('');

      try {
        const data = await getMyAvatars();

        if (!isCancelled) {
          setAvatars(data);
        }
      } catch (error) {
        console.error(
          '저장 아바타 목록 조회 실패:',
          error,
        );

        if (!isCancelled) {
          setAvatarsError(
            '저장된 아바타를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsAvatarsLoading(false);
        }
      }
    };

    void loadAvatars();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 현재 아바타 기준 의류 목록 조회
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
          setSelectedGarmentId((current) => {
            const stillExists = garmentList.some(
              (garment) =>
                garment.garmentId === current,
            );

            return stillExists
              ? current
              : garmentList[0].garmentId;
          });
        }
      } catch (error) {
        console.error(
          '의류 목록 조회 실패:',
          error,
        );

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

  // 선택된 아바타 + 의류 기준 피팅 결과 조회
  useEffect(() => {
    if (
      !avatarId ||
      selectedGarmentId === null
    ) {
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
        console.error(
          '피팅 결과 조회 실패:',
          error,
        );

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
  }, [
    avatarId,
    selectedGarmentId,
    fittingRetryKey,
  ]);

  // #30: 선택된 사이즈의 ease.json 조회
  useEffect(() => {
    const easeUrl = selectedSizeDetail?.easeUrl;

    if (!easeUrl) {
      setVertexEase([]);
      setColorScale(undefined);
      return;
    }

    let isCancelled = false;

    const loadEaseData = async () => {
      try {
        const easeData = await fetchEaseData(easeUrl);

        if (isCancelled) {
          return;
        }

        setVertexEase(easeData.vertex_ease);

        setColorScale(
          easeData.color_scale
            ? {
                low: easeData.color_scale[0],
                high: easeData.color_scale[1],
              }
            : undefined,
        );
      } catch (error) {
        console.error('ease.json 조회 실패:', error);

        if (!isCancelled) {
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

  const handleSelectAvatar = (
    selectedAvatar: AvatarJob,
  ) => {
    if (
      selectedAvatar.status !== 'done' ||
      selectedAvatar.avatarId == null
    ) {
      return;
    }

    const nextAvatar: CurrentAvatar = {
      avatarId: selectedAvatar.avatarId,
      glbUrl: selectedAvatar.glbUrl,
      measurements: selectedAvatar.measurements,
      height: selectedAvatar.height,
      weight: selectedAvatar.weight,
    };

    saveCurrentAvatar(nextAvatar);
    setActiveAvatar(nextAvatar);

    // 이전 아바타의 피팅 결과가 잠시 보이지 않도록 초기화
    setFittingResult(null);
    setSelectedSize(null);
    setFittingError('');
    setVertexEase([]);
    setColorScale(undefined);
  };

  const renderAvatarList = () => (
    <>
      {isAvatarsLoading && (
        <p className="mt-4 text-sm text-text-sub">
          저장된 아바타를 불러오고 있습니다.
        </p>
      )}

      {avatarsError && (
        <p className="mt-4 text-sm text-red-400">
          {avatarsError}
        </p>
      )}

      {!isAvatarsLoading &&
        !avatarsError &&
        avatars.length === 0 && (
          <p className="mt-4 text-sm text-text-sub">
            저장된 아바타가 없습니다.
          </p>
        )}

      {avatars.length > 0 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {avatars.map((item) => {
            const isSelected =
              item.avatarId != null &&
              item.avatarId === avatarId;

            const isSelectable =
              item.status === 'done' &&
              item.avatarId != null;

            return (
              <button
                key={item.jobId}
                type="button"
                disabled={!isSelectable}
                onClick={() =>
                  handleSelectAvatar(item)
                }
                className={`min-w-[150px] shrink-0 rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-gold bg-gold/10'
                    : 'border-border bg-bg'
                } ${
                  isSelectable
                    ? 'hover:border-gold'
                    : 'cursor-default opacity-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-text">
                    {item.avatarId != null
                      ? `아바타 #${item.avatarId}`
                      : '아바타 생성 작업'}
                  </p>

                  {isSelected && (
                    <span className="shrink-0 text-xs font-semibold text-gold">
                      사용 중
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-text-sub">
                  {item.status === 'done' &&
                    '생성 완료'}
                  {item.status === 'processing' &&
                    '생성 중'}
                  {item.status === 'failed' &&
                    '생성 실패'}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  if (!avatarId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-10">
        <section className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text">
              사용할 아바타를 선택해 주세요
            </h1>

            <p className="mt-4 text-text-sub">
              저장된 아바타를 불러오거나 새로운
              아바타를 생성한 뒤 피팅룸을 이용할 수
              있습니다.
            </p>
          </div>

          {renderAvatarList()}

          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="mt-6 w-full rounded-xl bg-gold px-6 py-3 font-semibold text-bg"
          >
            새 아바타 생성하기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-6xl">
        <p className="text-sm font-medium text-gold">
          3D FITTING ROOM
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-text">
          가상 피팅룸
        </h1>

        <p className="mt-2 text-text-sub">
          아바타, 의류와 사이즈를 선택하고 피팅 결과를 확인합니다.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <section className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text">
                  아바타
                </h2>

                <p className="mt-1 text-sm text-text-sub">
                  현재 아바타 #{avatarId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHeatmap((prev) => !prev)
                }
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:border-gold hover:text-gold"
              >
                히트맵 {showHeatmap ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="mt-4 h-[420px] overflow-hidden rounded-xl border border-border bg-bg sm:h-[520px] lg:h-[calc(100vh-210px)] lg:min-h-[480px] lg:max-h-[650px]">
              {glbUrl ? (
                <ThreeViewer
                  avatarUrl={glbUrl}
                  garmentUrl={
                    selectedSizeDetail?.modelUrl ??
                    undefined
                  }
                  showHeatmap={showHeatmap}
                  vertexEase={vertexEase}
                  colorScale={colorScale}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <p className="text-text-sub">
                    아바타 3D 데이터를 불러올 수 없습니다.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="space-y-5 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto lg:pr-2">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-text">
                    아바타 선택
                  </h2>

                  <p className="mt-1 text-sm text-text-sub">
                    피팅할 아바타를 좌우로 넘겨 선택하세요.
                  </p>
                </div>
              </div>

              {renderAvatarList()}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
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
                      setGarmentsRetryKey(
                        (prev) => prev + 1,
                      )
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

              <div className="mt-4 max-h-[240px] space-y-3 overflow-y-auto pr-1">
                {garments.map((garment) => {
                  const isSelected =
                    garment.garmentId ===
                    selectedGarmentId;

                  return (
                    <button
                      key={garment.garmentId}
                      type="button"
                      onClick={() =>
                        setSelectedGarmentId(
                          garment.garmentId,
                        )
                      }
                      className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-gold bg-gold/10'
                          : 'border-border bg-bg'
                      }`}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
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

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">
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

            <section className="rounded-2xl border border-border bg-card p-5">
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
                      setFittingRetryKey(
                        (prev) => prev + 1,
                      )
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

                  <div className="mt-4 rounded-xl bg-bg p-4">
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
              <section className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-text">
                    {selectedSize?.toUpperCase()}{' '}
                    피팅 결과
                  </h2>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
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
                  {selectedSizeDetail.parts.map(
                    (part) => (
                      <div
                        key={part.part}
                        className="rounded-xl border p-4"
                        style={{
                          borderColor: `${getVerdictColor(
                            part.verdict,
                          )}4D`,
                          backgroundColor: `${getVerdictColor(
                            part.verdict,
                          )}1A`,
                          color: getVerdictColor(
                            part.verdict,
                          ),
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold">
                            {bodyPartLabelMap[
                              part.part
                            ] ?? part.part}
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
                              {part.actualEase.toFixed(
                                1,
                              )}
                              cm
                            </p>
                          </div>

                          <div>
                            <p className="opacity-70">
                              기준 여유
                            </p>

                            <p className="mt-1 font-semibold">
                              {part.refEase.toFixed(
                                1,
                              )}
                              cm
                            </p>
                          </div>

                          <div>
                            <p className="opacity-70">
                              편차
                            </p>

                            <p className="mt-1 font-semibold">
                              {part.deviation.toFixed(
                                1,
                              )}
                              cm
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {!selectedSizeDetail.modelUrl && (
                  <p className="mt-5 text-sm text-text-sub">
                    이 사이즈의 3D 착용 모델은 아직
                    준비되지 않았습니다.
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