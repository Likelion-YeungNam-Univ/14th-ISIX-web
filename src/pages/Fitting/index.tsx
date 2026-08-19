import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { getMyAvatars } from '@/api/avatar';
import { fetchEaseData } from '@/api/ease';
import { getFittingResult } from '@/api/fitting';
import { getGarments } from '@/api/garment';

import ThreeViewer from '@/components/viewer/ThreeViewer';
import VoiceAssistant from '@/components/voice/VoiceAssistant';

import {
  HEATMAP_COLORS,
  type ColorScale,
} from '@/constants/heatmapColors';

import type { AvatarJob } from '@/types/avatar';
import type { FittingResult } from '@/types/fitting';
import type {
  Garment,
  GarmentSize,
} from '@/types/garment';

import {
  getCurrentAvatar,
  saveCurrentAvatar,
  type CurrentAvatar,
} from '@/utils/avatarStorage';

interface FittingPageState {
  jobId?: string;
  avatarId?: number;
  glbUrl?: string | null;
  measurements?: Record<string, number> | null;
  height?: number;
  weight?: number;
  garmentId?: number;
}

type PickerMode = 'avatar' | 'garment';
type PickerSheet = PickerMode | null;

const SIZE_ORDER: GarmentSize[] = [
  's',
  'm',
  'l',
];

const formatGarmentCategory = (
  category: string,
) => {
  const normalized = category
    .trim()
    .toLowerCase();

  const labels: Record<string, string> = {
    top: '상의',
    tops: '상의',
    upper: '상의',
    shirt: '상의',
    shirts: '상의',
    jacket: '상의',
    outer: '상의',

    bottom: '하의',
    bottoms: '하의',
    pants: '하의',
    trousers: '하의',
    skirt: '하의',

    dress: '원피스',
  };

  return labels[normalized] ?? category;
};

const Fitting = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pageState =
    location.state as FittingPageState | null;

  const lastFittingRequestRef = useRef<{
    key: string;
    promise: Promise<FittingResult>;
  } | null>(null);

  const [activeAvatar, setActiveAvatar] =
    useState<CurrentAvatar | null>(() => {
      if (pageState?.avatarId) {
        return {
          avatarId: pageState.avatarId,
          glbUrl: pageState.glbUrl ?? null,
          measurements:
            pageState.measurements ?? null,
          height: pageState.height,
          weight: pageState.weight,
        };
      }

      return getCurrentAvatar();
    });

  const [avatars, setAvatars] = useState<
    AvatarJob[]
  >([]);

  const [
    isAvatarsLoading,
    setIsAvatarsLoading,
  ] = useState(true);

  const [avatarsError, setAvatarsError] =
    useState('');

  const [
    avatarsRetryKey,
    setAvatarsRetryKey,
  ] = useState(0);

  const [garments, setGarments] = useState<
    Garment[]
  >([]);

  const [
    selectedGarmentId,
    setSelectedGarmentId,
  ] = useState<number | null>(
    () => pageState?.garmentId ?? null,
  );

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

  const [garmentsError, setGarmentsError] =
    useState('');

  const [fittingError, setFittingError] =
    useState('');

  const [
    garmentsRetryKey,
    setGarmentsRetryKey,
  ] = useState(0);

  const [
    fittingRetryKey,
    setFittingRetryKey,
  ] = useState(0);

  const [
    vertexEase,
    setVertexEase,
  ] = useState<number[]>([]);

  const [
    colorScale,
    setColorScale,
  ] = useState<ColorScale | undefined>(
    undefined,
  );

  // 옷이 시뮬된 격자 체형 구간("H1B2").
  // 옷을 아바타 모양으로 옮길 때 씁니다.
  const [
    bodyClass,
    setBodyClass,
  ] = useState<string | undefined>(
    undefined,
  );

  const [
    showHeatmap,
    setShowHeatmap,
  ] = useState(false);

  const [
    pickerSheet,
    setPickerSheet,
  ] = useState<PickerSheet>(null);

  const [
    activePickerMode,
    setActivePickerMode,
  ] = useState<PickerMode>(() =>
    pageState?.garmentId &&
    activeAvatar
      ? 'garment'
      : 'avatar',
  );

  const avatarId = activeAvatar?.avatarId;
  const glbUrl = activeAvatar?.glbUrl;

  const selectedGarment = useMemo(
    () =>
      garments.find(
        (garment) =>
          garment.garmentId ===
          selectedGarmentId,
      ) ?? null,
    [garments, selectedGarmentId],
  );

  const selectedSizeDetail =
    fittingResult && selectedSize
      ? fittingResult.sizes[selectedSize]
      : null;

  const preloadUrls = useMemo(() => {
    if (!fittingResult) {
      return undefined;
    }

    const urls = Object.values(
      fittingResult.sizes,
    )
      .map((detail) => detail.glbUrl)
      .filter(
        (url): url is string =>
          Boolean(url),
      );

    return urls.length > 0
      ? urls
      : undefined;
  }, [fittingResult]);

  const selectableAvatarCount =
    avatars.filter(
      (avatar) =>
        avatar.status === 'done' &&
        avatar.avatarId != null,
    ).length;

  const heatmapAvailable =
    Boolean(selectedSizeDetail?.glbUrl) &&
    Boolean(selectedSizeDetail?.easeUrl) &&
    vertexEase.length > 0;

  const canRenderViewer =
    Boolean(glbUrl) &&
    (
      selectedGarmentId === null ||
      Boolean(selectedSizeDetail?.glbUrl)
    );

  /*
   * 저장된 아바타 목록
   */
  useEffect(() => {
    let isCancelled = false;

    const loadAvatars = async () => {
      setIsAvatarsLoading(true);
      setAvatarsError('');

      try {
        const data =
          await getMyAvatars();

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
  }, [avatarsRetryKey]);

  /*
   * 현재 아바타 기준 의류 목록
   */
  useEffect(() => {
    if (!avatarId) {
      return;
    }

    let isCancelled = false;

    const loadGarments = async () => {
      setIsGarmentsLoading(true);
      setGarmentsError('');

      try {
        const garmentList =
          await getGarments();

        if (isCancelled) {
          return;
        }

        setGarments(garmentList);

        /*
         * 기존 구현처럼 첫 번째 상품을
         * 강제로 선택하지 않습니다.
         *
         * Home/My 등에서 garmentId를 전달받은
         * 경우에는 그 상품만 유지합니다.
         */
        setSelectedGarmentId(
          (current) => {
            if (current === null) {
              return null;
            }

            const stillExists =
              garmentList.some(
                (garment) =>
                  garment.garmentId ===
                  current,
              );

            return stillExists
              ? current
              : null;
          },
        );
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

  /*
   * 선택 아바타 + 의류 기준 피팅 결과
   */
  useEffect(() => {
    if (
      !avatarId ||
      selectedGarmentId === null
    ) {
      return;
    }

    let isCancelled = false;

    const loadFittingResult =
      async () => {
        setIsFittingLoading(true);
        setFittingError('');
        setFittingResult(null);
        setSelectedSize(null);
        setVertexEase([]);
        setColorScale(undefined);
    setBodyClass(undefined);
      setBodyClass(undefined);
        setBodyClass(undefined);
        setShowHeatmap(false);

        const requestKey =
          `${avatarId}:${selectedGarmentId}:${fittingRetryKey}`;

        let requestPromise: Promise<FittingResult>;

        if (
          lastFittingRequestRef
            .current?.key === requestKey
        ) {
          requestPromise =
            lastFittingRequestRef.current
              .promise;
        } else {
          requestPromise =
            getFittingResult(
              avatarId,
              selectedGarmentId,
            );

          lastFittingRequestRef.current = {
            key: requestKey,
            promise: requestPromise,
          };
        }

        try {
          const result =
            await requestPromise;

          if (isCancelled) {
            return;
          }

          setFittingResult(result);

          /*
           * 추천 사이즈를 기본 선택합니다.
           * 현재 지원 사이즈는 S / M / L입니다.
           */
          setSelectedSize(
            result.recommendedSize,
          );
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

  /*
   * 선택 사이즈 ease.json 조회
   */
  useEffect(() => {
    const easeUrl =
      selectedSizeDetail?.easeUrl;

    if (!easeUrl) {
      setVertexEase([]);
      setColorScale(undefined);
    setBodyClass(undefined);
      return;
    }

    let isCancelled = false;

    const loadEaseData = async () => {
      try {
        const easeData =
          await fetchEaseData(easeUrl);

        if (isCancelled) {
          return;
        }

        setVertexEase(
          easeData.vertex_ease,
        );

        setBodyClass(
          easeData.body_class,
        );

        setColorScale(
          easeData.color_scale
            ? {
                low: easeData.color_scale.tight.max,
                high: easeData.color_scale.loose.min,
              }
            : undefined,
        );
      } catch (error) {
        console.error(
          'ease.json 조회 실패:',
          error,
        );

        if (!isCancelled) {
          setVertexEase([]);
          setColorScale(undefined);
          setBodyClass(undefined);
        }
      }
    };

    void loadEaseData();

    return () => {
      isCancelled = true;
    };
  }, [selectedSizeDetail?.easeUrl]);

  /*
   * 바텀시트가 열렸을 때 배경 스크롤 방지
   */
  useEffect(() => {
    if (!pickerSheet) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setPickerSheet(null);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [pickerSheet]);

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
      avatarId:
        selectedAvatar.avatarId,
      glbUrl:
        selectedAvatar.glbUrl,
      measurements:
        selectedAvatar.measurements,
      height:
        selectedAvatar.height,
      weight:
        selectedAvatar.weight,
    };

    saveCurrentAvatar(nextAvatar);
    setActiveAvatar(nextAvatar);

    setFittingResult(null);
    setSelectedSize(null);
    setFittingError('');
    setVertexEase([]);
    setColorScale(undefined);
    setShowHeatmap(false);

    setPickerSheet(null);
  };

  const handleSelectGarment = (
    garmentId: number,
  ) => {
    setActivePickerMode('garment');

    if (
      garmentId ===
      selectedGarmentId
    ) {
      return;
    }

    setSelectedGarmentId(garmentId);
    setFittingResult(null);
    setSelectedSize(null);
    setFittingError('');
    setVertexEase([]);
    setColorScale(undefined);
    setShowHeatmap(false);
  };

  const handleSelectSize = (
    size: GarmentSize,
  ) => {
    if (!fittingResult) {
      return;
    }

    setSelectedSize(size);
    setPickerSheet(null);
  };

  const getAvatarMeta = (
    avatar: AvatarJob,
  ) => {
    if (avatar.status === 'processing') {
      return '생성 중';
    }

    if (avatar.status === 'failed') {
      return '생성 실패';
    }

    const values: string[] = [];

    if (avatar.height != null) {
      values.push(
        `${Math.round(
          avatar.height,
        )}cm`,
      );
    }

    if (avatar.weight != null) {
      values.push(
        `${Math.round(
          avatar.weight,
        )}kg`,
      );
    }

    return values.length > 0
      ? values.join(' · ')
      : '생성 완료';
  };

  const renderViewerContent = () => {
    if (!avatarId) {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p
            className="text-[17px] font-normal leading-[25px] text-[#252525]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            아바타를 선택하세요
          </p>
        </div>
      );
    }

    if (selectedGarmentId === null) {
      if (!glbUrl) {
        return (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <p
              className="text-[13px] leading-[20px] text-[#686868]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              아바타 3D 데이터를 불러올 수 없습니다.
            </p>
          </div>
        );
      }

      return (
        <ThreeViewer
          avatarUrl={glbUrl}
        />
      );
    }

    if (isFittingLoading) {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p
            className="text-[13px] font-normal text-[#686868]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            피팅 결과를 불러오고 있습니다.
          </p>
        </div>
      );
    }

    if (fittingError) {
      return (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p
            className="text-[13px] leading-[20px] text-[#9A9490]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            {fittingError}
          </p>

          <button
            type="button"
            onClick={() =>
              setFittingRetryKey(
                (prev) => prev + 1,
              )
            }
            className="mt-4 rounded-[6px] border border-white/[0.10] px-4 py-2 text-[11px] font-medium text-[#E4B662]"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (!glbUrl) {
      return (
        <div className="flex h-full items-center justify-center px-8 text-center">
          <p
            className="text-[13px] leading-[20px] text-[#686868]"
            style={{
              fontFamily: 'Inter, sans-serif',
            }}
          >
            아바타 3D 데이터를 불러올 수 없습니다.
          </p>
        </div>
      );
    }

    if (!selectedSizeDetail?.glbUrl) {
      return (
        <div className="relative h-full w-full">
          <ThreeViewer avatarUrl={glbUrl} />

          <div className="pointer-events-none absolute bottom-[42px] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-black/70 px-[10px] py-[6px]">
            <p
              className="text-[10px] text-[#77736D]"
              style={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              선택한 사이즈의 3D 착용 모델이 없습니다.
            </p>
          </div>
        </div>
      );
    }

    return (
      <ThreeViewer
        avatarUrl={glbUrl}
        garmentUrl={
          selectedSizeDetail.glbUrl
        }
        preloadUrls={preloadUrls}
        showHeatmap={showHeatmap}
        vertexEase={vertexEase}
        colorScale={colorScale}
        bodyClass={bodyClass}
      />
    );
  };

  return (
    <main className="min-h-screen bg-[#080808]">
      <div className="mx-auto min-h-screen w-[402px] max-w-full overflow-hidden bg-[#080808] pb-[18px] text-white">
        {/* 브랜드 헤더 */}
        <header className="flex h-[46px] items-center border-b border-white/10 bg-[#080808] px-[14px]">
          <span
            className="text-[20px] font-normal leading-[30px] tracking-[1.2px] text-[#F0EBE2]"
            style={{
              fontFamily:
                '"DM Serif Display", serif',
            }}
          >
            CLOSR
          </span>
        </header>

        {/* 아바타 / 의류 선택 */}
        <div className="px-[19px] pt-[12px]">
          <div className="flex h-[41px] overflow-hidden rounded-[9px] border border-white/[0.07] bg-[#191919]">
            <button
              type="button"
              onClick={() => {
                setActivePickerMode(
                  'avatar',
                );
                setPickerSheet(
                  'avatar',
                );
              }}
              className={[
                'flex flex-1 items-center justify-center text-[12px] font-semibold transition',
                activePickerMode ===
                  'avatar'
                  ? 'bg-[#E4B662] text-[#0A0A0A]'
                  : 'text-[#8D8A85]',
              ].join(' ')}
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              아바타 불러오기
            </button>

            <button
              type="button"
              disabled={!avatarId}
              onClick={() => {
                setActivePickerMode(
                  'garment',
                );
                setPickerSheet(
                  'garment',
                );
              }}
              className={[
                'flex flex-1 items-center justify-center text-[12px] font-semibold transition',
                activePickerMode ===
                  'garment'
                  ? 'bg-[#E4B662] text-[#0A0A0A]'
                  : 'text-[#8D8A85]',
                !avatarId
                  ? 'cursor-not-allowed opacity-45'
                  : '',
              ].join(' ')}
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              의류 선택
            </button>
          </div>
        </div>

        {/* 3D VIEW */}
        <section className="px-[19px] pt-[14px]">
          <div className="relative h-[clamp(460px,calc(100dvh-330px),560px)] overflow-hidden rounded-[17px] border border-white/[0.07] bg-[#0C0C0C]">
            <span
              className="pointer-events-none absolute left-[13px] top-[13px] z-10 text-[9px] font-normal uppercase leading-[13px] tracking-[1.6px] text-[#4B4B4B]"
              style={{
                fontFamily:
                  '"DM Mono", monospace',
              }}
            >
              3D VIEW
            </span>

            <button
              type="button"
              disabled={
                !heatmapAvailable
              }
              aria-pressed={
                showHeatmap
              }
              onClick={() =>
                setShowHeatmap(
                  (prev) => !prev,
                )
              }
              className={[
                'absolute right-[13px] top-[12px] z-20 flex h-[29px] items-center justify-center rounded-[6px] px-[11px] text-[11px] font-semibold transition',
                showHeatmap &&
                heatmapAvailable
                  ? 'bg-[#C9B27A] text-[#0A0A0A]'
                  : 'border border-white/[0.06] bg-[#222222] text-[#77736D]',
                !heatmapAvailable
                  ? 'cursor-not-allowed opacity-55'
                  : '',
              ].join(' ')}
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              히트맵
            </button>

            <div className="absolute inset-0">
              {renderViewerContent()}
            </div>

            {canRenderViewer && (
              <div
                className="pointer-events-none absolute bottom-[16px] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-normal text-[#5F5C58]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                ↻ 드래그하여 360° 회전
              </div>
            )}

            {showHeatmap &&
              heatmapAvailable && (
                <div className="absolute bottom-[12px] right-[12px] z-20 w-[78px] rounded-[8px] border border-white/[0.10] bg-black/80 px-[10px] py-[9px] backdrop-blur-[8px]">
                  <HeatmapLegendRow
                    color={
                      HEATMAP_COLORS.loose
                    }
                    label="여유로움"
                  />

                  <HeatmapLegendRow
                    color={
                      HEATMAP_COLORS.good
                    }
                    label="적정"
                  />

                  <HeatmapLegendRow
                    color={
                      HEATMAP_COLORS.tight
                    }
                    label="조임"
                  />
                </div>
              )}
          </div>
        </section>

        {/* 선택 의류 미니 정보 */}
        <section className="min-h-[72px] px-[31px] pt-[16px]">
          {selectedGarment && (
            <div className="w-[126px] rounded-[8px] border border-white/[0.12] bg-black/80 px-[10px] py-[8px]">
              <p
                className="text-[8px] font-medium uppercase leading-[12px] tracking-[0.6px] text-[#C9A96E]"
                style={{
                  fontFamily:
                    '"DM Mono", monospace',
                }}
              >
                MCM
              </p>

              <p
                className="mt-[3px] truncate text-[10px] font-medium leading-[14px] text-[#F0EBE2]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                {selectedGarment.name}
              </p>

              <p
                className="mt-[2px] text-[8px] font-normal uppercase leading-[12px] text-[#8C8880]"
                style={{
                  fontFamily:
                    '"DM Mono", monospace',
                }}
              >
                SIZE:{' '}
                {selectedSize
                  ? selectedSize.toUpperCase()
                  : '-'}
              </p>
            </div>
          )}
        </section>

    


        
          {/* <section className="px-[19px] pb-[18px] pt-[4px]">
            {fittingResult &&
              selectedGarment &&
              selectedSize &&
              selectedSizeDetail && (
                <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#141414]">

                  <div className="border-b border-white/[0.07] px-[17px] py-[16px]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className="text-[9px] font-normal uppercase tracking-[1.3px] text-[#6C6862]"
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          FITTING RESULT
                        </p>

                        <p
                          className="mt-[7px] truncate text-[14px] font-medium text-[#F0EBE2]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          {selectedGarment.name}
                        </p>

                        <p
                          className="mt-[3px] text-[10px] text-[#77736D]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          {formatGarmentCategory(
                            selectedGarment.category,
                          )}
                        </p>
                      </div>

                      <span
                        className="shrink-0 rounded-[5px] border border-[#C9B27A]/30 bg-[#2A251B] px-[8px] py-[5px] text-[9px] font-medium text-[#C9B27A]"
                        style={{
                          fontFamily:
                            'Inter, sans-serif',
                        }}
                      >
                        추천
                      </span>
                    </div>
                  </div>

                  <div className="px-[17px] py-[18px]">
                    <div className="flex items-end justify-between">
                      <div>
                        <p
                          className="text-[10px] font-normal text-[#77736D]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          추천 사이즈
                        </p>

                        <div className="mt-[3px] flex items-end gap-[7px]">
                          <span
                            className="text-[34px] font-semibold leading-none text-[#C9B27A]"
                            style={{
                              fontFamily:
                                'Inter, sans-serif',
                            }}
                          >
                            {fittingResult.recommendedSize.toUpperCase()}
                          </span>

                          <span
                            className="pb-[2px] text-[10px] text-[#65615C]"
                            style={{
                              fontFamily:
                                '"DM Mono", monospace',
                            }}
                          >
                            RECOMMENDED
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className="text-[9px] text-[#625F5A]"
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          SELECTED SIZE
                        </p>

                        <p
                          className="mt-[3px] text-[14px] font-medium text-[#F0EBE2]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          {selectedSize.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {fittingResult.recommendationReason && (
                      <p
                        className="mt-[15px] rounded-[8px] bg-[#101010] px-[12px] py-[10px] text-[11px] leading-[18px] text-[#8B8781]"
                        style={{
                          fontFamily:
                            'Inter, sans-serif',
                        }}
                      >
                        {
                          fittingResult.recommendationReason
                        }
                      </p>
                    )}
                  </div>

                  {selectedSizeDetail.parts.length >
                    0 && (
                    <div className="border-t border-white/[0.07] px-[17px] py-[17px]">
                      <div className="mb-[12px] flex items-center justify-between">
                        <p
                          className="text-[11px] font-medium text-[#E5E0D8]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          부위별 핏
                        </p>

                        <span
                          className="text-[8px] tracking-[1px] text-[#5D5954]"
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          FIT DETAIL
                        </span>
                      </div>

                      <div className="divide-y divide-white/[0.05]">
                        {selectedSizeDetail.parts.map(
                          (part) => (
                            <div
                              key={part.part}
                              className="flex min-h-[39px] items-center"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                                <span
                                  className="h-[7px] w-[7px] shrink-0 rounded-[2px]"
                                  style={{
                                    backgroundColor:
                                      part.color,
                                  }}
                                />

                                <span
                                  className="truncate text-[11px] text-[#BBB6AE]"
                                  style={{
                                    fontFamily:
                                      'Inter, sans-serif',
                                  }}
                                >
                                  {part.part}
                                </span>
                              </div>

                              <span
                                className="mx-[10px] text-[10px] text-[#77736D]"
                                style={{
                                  fontFamily:
                                    'Inter, sans-serif',
                                }}
                              >
                                {part.verdict}
                              </span>

                              <span
                                className="w-[52px] text-right text-[10px] text-[#9D9891]"
                                style={{
                                  fontFamily:
                                    '"DM Mono", monospace',
                                }}
                              >
                                {part.actualEase > 0
                                  ? '+'
                                  : ''}
                                {part.actualEase.toFixed(
                                  1,
                                )}
                                cm
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </section> */}
         
      </div>

      <VoiceAssistant
        mode="fitting"
        avatarId={avatarId}
        garmentId={
          selectedGarmentId ??
          undefined
        }
        size={
          selectedSize ??
          undefined
        }
      />

      {/* 아바타 선택 바텀시트 */}
      {pickerSheet === 'avatar' &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end bg-black/50"
            onClick={() =>
              setPickerSheet(null)
            }
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="내 아바타 선택"
              className="mx-auto max-h-[76dvh] w-full max-w-[402px] overflow-hidden rounded-t-[24px] border border-b-0 border-white/[0.07] bg-[#111111]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                aria-label="아바타 선택창 닫기"
                onClick={() =>
                  setPickerSheet(null)
                }
                className="flex h-[30px] w-full items-center justify-center"
              >
                <span className="h-[4px] w-[38px] rounded-full bg-white/[0.12]" />
              </button>

              <div className="flex items-center justify-between px-[20px] pb-[17px]">
                <h2
                  className="text-[16px] font-semibold leading-[24px] text-[#F0EBE2]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  내 아바타 선택
                </h2>

                <span
                  className="text-[10px] font-normal tracking-[1.2px] text-[#5F5C58]"
                  style={{
                    fontFamily:
                      '"DM Mono", monospace',
                  }}
                >
                  {selectableAvatarCount}{' '}
                  개
                </span>
              </div>

              <div className="max-h-[calc(76dvh-78px)] overflow-y-auto px-[18px] pb-[28px]">
                {isAvatarsLoading && (
                  <SheetMessage>
                    저장된 아바타를
                    불러오고 있습니다.
                  </SheetMessage>
                )}

                {avatarsError && (
                  <div className="py-8 text-center">
                    <p className="text-[12px] text-[#9A9490]">
                      {avatarsError}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setAvatarsRetryKey(
                          (prev) =>
                            prev + 1,
                        )
                      }
                      className="mt-4 rounded-[6px] border border-white/[0.10] px-4 py-2 text-[11px] font-medium text-[#C9A96E]"
                    >
                      다시 시도
                    </button>
                  </div>
                )}

                {!isAvatarsLoading &&
                  !avatarsError &&
                  avatars.length ===
                    0 && (
                    <div className="py-8 text-center">
                      <p className="text-[12px] text-[#77736D]">
                        저장된 아바타가
                        없습니다.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            '/upload',
                            {
                              state: {
                                garmentId:
                                  selectedGarmentId ??
                                  undefined,
                              },
                            },
                          )
                        }
                        className="mt-4 rounded-[6px] bg-[#C9B27A] px-4 py-2 text-[11px] font-semibold text-[#0A0A0A]"
                      >
                        새 아바타 생성하기
                      </button>
                    </div>
                  )}

                {avatars.length > 0 && (
                  <div className="space-y-[10px]">
                    {avatars.map(
                      (
                        avatar,
                        index,
                      ) => {
                        const isSelected =
                          avatar.avatarId !=
                            null &&
                          avatar.avatarId ===
                            avatarId;

                        const isSelectable =
                          avatar.status ===
                            'done' &&
                          avatar.avatarId !=
                            null;

                        return (
                          <button
                            key={
                              avatar.jobId
                            }
                            type="button"
                            disabled={
                              !isSelectable
                            }
                            onClick={() =>
                              handleSelectAvatar(
                                avatar,
                              )
                            }
                            className={[
                              'flex min-h-[77px] w-full items-center rounded-[12px] border px-[16px] py-[12px] text-left transition',
                              isSelected
                                ? 'border-[#C9A96E] bg-[#2A251B]'
                                : 'border-white/[0.07] bg-[#191919]',
                              !isSelectable
                                ? 'cursor-not-allowed opacity-45'
                                : '',
                            ].join(
                              ' ',
                            )}
                          >
                            <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[9px] border border-white/[0.04] bg-[#222222] text-[#474747]">
                              <AvatarSilhouetteIcon className="h-[31px] w-[24px]" />
                            </div>

                            <div className="min-w-0 flex-1 pl-[14px]">
                              <p
                                className="truncate text-[13px] font-medium leading-[19px] text-[#F0EBE2]"
                                style={{
                                  fontFamily:
                                    'Inter, sans-serif',
                                }}
                              >
                                나의 아바타{' '}
                                {index +
                                  1}
                              </p>

                              <p
                                className="mt-[4px] truncate text-[11px] font-normal leading-[16px] text-[#66625D]"
                                style={{
                                  fontFamily:
                                    'Inter, sans-serif',
                                }}
                              >
                                {getAvatarMeta(
                                  avatar,
                                )}
                              </p>
                            </div>

                            {isSelected && (
                              <span className="ml-[12px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#C9B27A] text-[#111111]">
                                <CheckIcon className="h-[11px] w-[11px]" />
                              </span>
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>,
          document.body,
        )}

      {/* 의류 선택 바텀시트 */}
      {pickerSheet === 'garment' &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end bg-black/50"
            onClick={() =>
              setPickerSheet(null)
            }
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="의류 선택"
              className="mx-auto max-h-[79dvh] w-full max-w-[402px] overflow-hidden rounded-t-[24px] border border-b-0 border-white/[0.07] bg-[#111111]"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                aria-label="의류 선택창 닫기"
                onClick={() =>
                  setPickerSheet(null)
                }
                className="flex h-[30px] w-full items-center justify-center"
              >
                <span className="h-[4px] w-[38px] rounded-full bg-white/[0.12]" />
              </button>

              <div className="flex items-center justify-between px-[20px] pb-[17px]">
                <h2
                  className="text-[16px] font-semibold leading-[24px] text-[#F0EBE2]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  의류 선택
                </h2>

                <span
                  className="text-[10px] font-normal tracking-[1.2px] text-[#5F5C58]"
                  style={{
                    fontFamily:
                      '"DM Mono", monospace',
                  }}
                >
                  {garments.length}{' '}
                  items
                </span>
              </div>

              <div className="max-h-[calc(79dvh-78px)] overflow-y-auto px-[18px] pb-[30px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {isGarmentsLoading && (
                  <SheetMessage>
                    의류 목록을
                    불러오고 있습니다.
                  </SheetMessage>
                )}

                {garmentsError && (
                  <div className="py-8 text-center">
                    <p className="text-[12px] text-[#9A9490]">
                      {garmentsError}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setGarmentsRetryKey(
                          (prev) =>
                            prev + 1,
                        )
                      }
                      className="mt-4 rounded-[6px] border border-white/[0.10] px-4 py-2 text-[11px] font-medium text-[#C9A96E]"
                    >
                      다시 시도
                    </button>
                  </div>
                )}

                {!isGarmentsLoading &&
                  !garmentsError &&
                  garments.length ===
                    0 && (
                    <SheetMessage>
                      등록된 의류가
                      없습니다.
                    </SheetMessage>
                  )}

                {garments.length > 0 && (
                  <div className="space-y-[10px]">
                    {garments.map(
                      (garment) => {
                        const isSelected =
                          garment.garmentId ===
                          selectedGarmentId;

                        const availableSizes =
                          SIZE_ORDER.filter(
                            (size) =>
                              garment.sizes.includes(
                                size,
                              ),
                          );

                        return (
                          <div
                            key={
                              garment.garmentId
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectGarment(
                                  garment.garmentId,
                                )
                              }
                              className={[
                                'flex min-h-[95px] w-full items-center rounded-[13px] border px-[16px] py-[13px] text-left outline-none transition',
                                isSelected
                                  ? 'border-[#C9A96E] bg-[#2A251B]'
                                  : 'border-white/[0.07] bg-[#191919]',
                              ].join(
                                ' ',
                              )}
                            >
                              <div className="flex h-[58px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-[#F1F1EE]">
                                {garment.thumbnailUrl ? (
                                  <img
                                    src={
                                      garment.thumbnailUrl
                                    }
                                    alt={
                                      garment.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <GarmentPlaceholderIcon className="h-[30px] w-[30px] text-[#AAA59E]" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1 pl-[14px]">
                                <div className="flex items-center gap-[6px]">
                                  <span
                                    className="rounded-[3px] bg-[#2E291E] px-[6px] py-[3px] text-[8px] font-medium leading-[10px] text-[#C9A96E]"
                                    style={{
                                      fontFamily:
                                        '"DM Mono", monospace',
                                    }}
                                  >
                                    MCM
                                  </span>

                                  <span
                                    className="text-[9px] font-normal leading-[13px] text-[#67635E]"
                                    style={{
                                      fontFamily:
                                        'Inter, sans-serif',
                                    }}
                                  >
                                    {formatGarmentCategory(
                                      garment.category,
                                    )}
                                  </span>
                                </div>

                                <p
                                  className="mt-[6px] truncate text-[13px] font-medium leading-[18px] text-[#F0EBE2]"
                                  style={{
                                    fontFamily:
                                      'Inter, sans-serif',
                                  }}
                                >
                                  {garment.name}
                                </p>

                                <p
                                  className="mt-[4px] text-[10px] font-normal uppercase leading-[14px] text-[#67635E]"
                                  style={{
                                    fontFamily:
                                      '"DM Mono", monospace',
                                  }}
                                >
                                  {garment.sizes
                                    .map(
                                      (
                                        size,
                                      ) =>
                                        size.toUpperCase(),
                                    )
                                    .join(
                                      ' · ',
                                    )}
                                </p>
                              </div>
                            </button>

                            {isSelected && (
                              <div className="px-[4px] pb-[1px] pt-[9px]">
                                <div className="flex gap-[8px]">
                                  {availableSizes.map(
                                    (size) => {
                                      const isSizeSelected =
                                        selectedSize ===
                                        size;

                                      return (
                                        <button
                                          key={
                                            size
                                          }
                                          type="button"
                                          disabled={
                                            !fittingResult ||
                                            isFittingLoading
                                          }
                                          onClick={() =>
                                            handleSelectSize(
                                              size,
                                            )
                                          }
                                          className={[
                                            'flex h-[37px] w-[52px] items-center justify-center rounded-[6px] border text-[12px] font-medium uppercase transition',
                                            isSizeSelected
                                              ? 'border-[#C9B27A] bg-[#C9B27A] text-[#0A0A0A]'
                                              : 'border-white/[0.07] bg-[#1A1A1A] text-[#827E78]',
                                            !fittingResult ||
                                            isFittingLoading
                                              ? 'cursor-not-allowed opacity-45'
                                              : '',
                                          ].join(
                                            ' ',
                                          )}
                                          style={{
                                            fontFamily:
                                              'Inter, sans-serif',
                                          }}
                                        >
                                          {size.toUpperCase()}
                                        </button>
                                      );
                                    },
                                  )}
                                </div>

                                {isFittingLoading && (
                                  <p className="mt-[8px] text-[10px] text-[#69655F]">
                                    추천
                                    사이즈를
                                    계산하고
                                    있습니다.
                                  </p>
                                )}

                                {fittingResult &&
                                  selectedSize && (
                                    <p
                                      className="mt-[8px] text-[10px] leading-[15px] text-[#7B7771]"
                                      style={{
                                        fontFamily:
                                          'Inter, sans-serif',
                                      }}
                                    >
                                      추천
                                      사이즈는{' '}
                                      <span className="font-semibold text-[#C9A96E]">
                                        {fittingResult.recommendedSize.toUpperCase()}
                                      </span>
                                      입니다.
                                    </p>
                                  )}

                                {fittingError && (
                                  <div className="mt-[8px] flex items-center gap-[10px]">
                                    <p className="text-[10px] text-[#9A9490]">
                                      {
                                        fittingError
                                      }
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFittingRetryKey(
                                          (
                                            prev,
                                          ) =>
                                            prev +
                                            1,
                                        )
                                      }
                                      className="shrink-0 text-[10px] font-medium text-[#C9A96E]"
                                    >
                                      다시 시도
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </main>
  );
};

export default Fitting;

function SheetMessage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="py-10 text-center">
      <p
        className="text-[12px] font-normal text-[#6E6A65]"
        style={{
          fontFamily:
            'Inter, sans-serif',
        }}
      >
        {children}
      </p>
    </div>
  );
}

function HeatmapLegendRow({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-[7px] py-[2px]">
      <span
        className="h-[8px] w-[8px] shrink-0 rounded-[2px]"
        style={{
          backgroundColor: color,
        }}
      />

      <span
        className="whitespace-nowrap text-[8px] font-normal leading-[11px] text-[#9A9490]"
        style={{
          fontFamily:
            'Inter, sans-serif',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function AvatarSilhouetteIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="20"
      height="32"
      viewBox="0 0 20 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g clipPath="url(#avatar-silhouette-clip)">
        <path
          d="M9.99511 9.00096C12.7552 9.00096 14.9927 6.76348 14.9927 4.00341C14.9927 1.24334 12.7552 -0.994141 9.99511 -0.994141C7.23504 -0.994141 4.99756 1.24334 4.99756 4.00341C4.99756 6.76348 7.23504 9.00096 9.99511 9.00096Z"
          fill="#3A3A3A"
        />
        <path
          d="M2.99853 10.0005L0.999512 19.9956H18.9907L16.9917 10.0005L12.9936 8.00146L9.9951 9.00097L6.99657 8.00146L2.99853 10.0005Z"
          fill="#3A3A3A"
        />
        <path
          d="M2.99853 19.9956L1.99902 29.9907H7.99608L9.9951 23.9936L11.9941 29.9907H17.9912L16.9917 19.9956H2.99853Z"
          fill="#2E2E2E"
        />
      </g>

      <defs>
        <clipPath id="avatar-silhouette-clip">
          <rect
            width="19.9902"
            height="31.9954"
            fill="white"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

function CheckIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 8.2 6.7 11 12 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GarmentPlaceholderIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m21 13 11 7 11-7 11 10-8 8v23H18V31l-8-8 11-10Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}