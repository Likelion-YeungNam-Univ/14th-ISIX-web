import {
  useState,
  type ReactNode,
} from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { getMyAvatars } from '@/api/avatar';
import {
  deleteFitting,
  getMyFittings,
} from '@/api/fitting';
import {
  getGarmentDetail,
  getGarments,
} from '@/api/garment';
import {
  fetchHistory,
  fetchSummary,
  getStoredFittingConversationIds,
} from '@/api/myChat';
import {
  getMyLikes,
  unlikeGarment,
} from '@/api/like';

import type {
  ChatSummary,
  StoredMessage,
} from '@/types/chat';
import type { LikedGarment } from '@/types/like';
import { getCurrentAvatar } from '@/utils/avatarStorage';
import HomeLogo from '@/components/common/HomeLogo';

type MyTab = 'fitting' | 'report';

const My = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] =
    useState<MyTab>('fitting');

  const [
    openReportId,
    setOpenReportId,
  ] = useState<string | null>(null);

  const [
    selectedLikedGarmentId,
    setSelectedLikedGarmentId,
  ] = useState<number | null>(null);

  const [
    isFittingSelectMode,
    setIsFittingSelectMode,
  ] = useState(false);

  const [
    selectedFittingIds,
    setSelectedFittingIds,
  ] = useState<number[]>([]);

  /* ================================================== */
  /* 저장된 피팅                                        */
  /* ================================================== */

  const {
    data: fittingData,
    isLoading: isFittingLoading,
    isError: isFittingError,
  } = useQuery({
    queryKey: ['my-fittings'],
    queryFn: getMyFittings,
  });

  const {
    data: garments = [],
  } = useQuery({
    queryKey: ['garments'],
    queryFn: getGarments,
  });

  const {
    data: avatars = [],
    isLoading: isAvatarsLoading,
    isError: isAvatarsError,
  } = useQuery({
    queryKey: ['my-avatars'],
    queryFn: getMyAvatars,
  });

  const currentAvatarId =
    getCurrentAvatar()?.avatarId ?? null;

  const profileAvatar =
    avatars.find(
      (avatar) =>
        avatar.status === 'done' &&
        avatar.avatarId === currentAvatarId,
    ) ??
    avatars.find(
      (avatar) =>
        avatar.status === 'done',
    ) ??
    null;

  const profileMeta = [
    profileAvatar?.bodyTypeLabel ||
      null,

    profileAvatar?.height != null
      ? `${Math.round(
          profileAvatar.height,
        )}cm`
      : null,

    profileAvatar?.weight != null
      ? `${Math.round(
          profileAvatar.weight,
        )}kg`
      : null,
  ]
    .filter(
      (value): value is string =>
        Boolean(value),
    )
    .join(' · ');

  const {
    data: likedGarments = [],
    isLoading: isLikesLoading,
    isError: isLikesError,
  } = useQuery({
    queryKey: ['my-likes'],
    queryFn: getMyLikes,
  });

  const selectedLikedGarment =
    likedGarments.find(
      (garment) =>
        garment.garmentId ===
        selectedLikedGarmentId,
    ) ?? null;

  const {
    data: selectedGarmentDetail,
    isLoading: isSelectedGarmentLoading,
  } = useQuery({
    queryKey: [
      'garment-detail',
      selectedLikedGarmentId,
    ],
    queryFn: () => {
      if (
        selectedLikedGarmentId === null
      ) {
        throw new Error(
          '선택된 의류가 없습니다.',
        );
      }

      return getGarmentDetail(
        selectedLikedGarmentId,
      );
    },
    enabled:
      selectedLikedGarmentId !== null,
  });

  const unlikeMutation = useMutation({
    mutationFn: unlikeGarment,

    onMutate: async (
      garmentId: number,
    ) => {
      await queryClient.cancelQueries({
        queryKey: ['my-likes'],
      });

      const previousLikes =
        queryClient.getQueryData<
          LikedGarment[]
        >(['my-likes']) ?? [];

      queryClient.setQueryData<
        LikedGarment[]
      >(
        ['my-likes'],
        previousLikes.filter(
          (garment) =>
            garment.garmentId !==
            garmentId,
        ),
      );

      return {
        previousLikes,
      };
    },

    onError: (
      _error,
      _garmentId,
      context,
    ) => {
      if (
        context?.previousLikes
      ) {
        queryClient.setQueryData(
          ['my-likes'],
          context.previousLikes,
        );
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['my-likes'],
      });
    },
  });

  const selectedSizeText =
    selectedGarmentDetail?.sizes
      .map((size) =>
        size.size.toUpperCase(),
      )
      .join(' · ') ?? '';

  const fittings =
    fittingData?.fittings ?? [];

  const previewFittings =
    fittings.slice(0, 4);

  const toggleFittingSelection = (
    fittingId: number,
  ) => {
    setSelectedFittingIds(
      (currentIds) =>
        currentIds.includes(
          fittingId,
        )
          ? currentIds.filter(
              (id) =>
                id !== fittingId,
            )
          : [
              ...currentIds,
              fittingId,
            ],
    );
  };

  const exitFittingSelectMode =
    () => {
      setSelectedFittingIds([]);
      setIsFittingSelectMode(
        false,
      );
    };

  const deleteFittingsMutation =
    useMutation({
      mutationFn: async (
        fittingIds: number[],
      ) => {
        await Promise.all(
          fittingIds.map(
            (fittingId) =>
              deleteFitting(
                fittingId,
              ),
          ),
        );
      },

      onSuccess: () => {
        exitFittingSelectMode();
      },

      onSettled: () => {
        void queryClient.invalidateQueries(
          {
            queryKey: [
              'my-fittings',
            ],
          },
        );
      },
    });

  const getGarment = (
    garmentId: number,
  ) =>
    garments.find(
      (garment) =>
        garment.garmentId ===
        garmentId,
    );

  /* ================================================== */
  /* AI 상담 리포트                                     */
  /* ================================================== */

  const fittingConversationIds =
    getStoredFittingConversationIds();

  const summaryQueries = useQueries({
    queries:
      fittingConversationIds.map(
        (conversationId) => ({
          queryKey: [
            'chat-summary',
            conversationId,
          ],
          queryFn: () =>
            fetchSummary(
              conversationId,
            ),
        }),
      ),
  });

  const historyQueries = useQueries({
    queries:
      fittingConversationIds.map(
        (conversationId) => ({
          queryKey: [
            'chat-history',
            conversationId,
          ],
          queryFn: () =>
            fetchHistory(
              conversationId,
            ),
        }),
      ),
  });

  const reports =
    fittingConversationIds.map(
      (conversationId, index) => ({
        conversationId,
        summary:
          summaryQueries[index]
            ?.data ?? null,
        messages:
          historyQueries[index]
            ?.data ?? [],
        isLoading:
          Boolean(
            summaryQueries[index]
              ?.isLoading,
          ) ||
          Boolean(
            historyQueries[index]
              ?.isLoading,
          ),
      }),
    );

  const isReportLoading =
    reports.some(
      (report) =>
        report.isLoading,
    );

  const totalRecommendedItems =
    reports.reduce(
      (total, report) =>
        total +
        (report.summary?.items
          .length ?? 0),
      0,
    );

  const totalBestFitItems =
    reports.reduce(
      (total, report) =>
        total +
        (report.summary?.items.filter(
          (item) => item.bestFit,
        ).length ?? 0),
      0,
    );

  return (
    <main className="min-h-[100dvh] bg-black text-[#F0EBE2]">
      <div className="mx-auto min-h-[100dvh] w-[402px] max-w-full overflow-x-hidden bg-black">
        {/* ============================================ */}
        {/* HEADER                                       */}
        {/* ============================================ */}

        <header className="flex h-[46px] items-center justify-between border-b border-white/10 bg-[#080808] px-[14px]">
          <HomeLogo className="text-[20px] leading-[30px] tracking-[1.2px] text-[#F0EBE2]" />

          <button
            type="button"
            aria-label="알림"
            className="grid h-8 w-8 place-items-center text-white"
          >
            <BellIcon className="h-[24px] w-[24px]" />
          </button>
        </header>

        {/* ============================================ */}
        {/* PROFILE                                      */}
        {/* ============================================ */}

        <section className="flex h-[83px] items-center border-b-[0.7px] border-white/[0.07] px-[20px]">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#C9A96E]">
            <span
              className="text-[20px] leading-[30px] text-black"
              style={{
                fontFamily:
                  '"DM Serif Display", serif',
              }}
            >
              C
            </span>
          </div>

          <div className="ml-[14px] min-w-0 flex-1">
            <div className="flex items-center">
              <span
                className="text-[15px] font-semibold leading-[22.5px] text-[#F0EBE2]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                Like Lion
              </span>

              <button
                type="button"
                aria-label="프로필 수정"
                className="ml-[5px] flex h-[18px] w-[14px] items-center justify-center text-white/[0.41]"
              >
                <EditIcon className="h-[13px] w-[10px]" />
              </button>
            </div>

            <p
              className="text-[11px] font-normal leading-[16.5px] text-[#9A9490]"
              style={{
                fontFamily:
                  '"DM Mono", monospace',
              }}
            >
              {isAvatarsLoading
                ? '불러오는 중...'
                : isAvatarsError
                  ? '아바타 정보 없음'
                  : profileMeta ||
                    '아바타 정보 없음'}
            </p>
          </div>

          <button
            type="button"
            aria-label="설정"
            className="flex h-[24px] w-[24px] items-center justify-center"
          >
            <SettingsIcon className="h-[20px] w-[20px]" />
          </button>
        </section>

        {/* ============================================ */}
        {/* TAB                                          */}
        {/* ============================================ */}

        <nav className="grid h-[47px] grid-cols-2 border-b-[0.7px] border-white/[0.07] px-[20px]">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'fitting',
              )
            }
            className="relative flex h-full items-center justify-center"
          >
            <span
              className={
                activeTab ===
                'fitting'
                  ? 'text-[13px] font-semibold leading-[19.5px] tracking-[0.2px] text-[#C9A96E]'
                  : 'text-[13px] font-normal leading-[19.5px] tracking-[0.2px] text-[#9A9490]'
              }
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              저장된 피팅
            </span>

            {activeTab ===
              'fitting' && (
              <span className="absolute bottom-0 left-1/2 h-[2px] w-[176px] -translate-x-1/2 bg-[#C9A96E]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              exitFittingSelectMode();
              setActiveTab(
                'report',
              );
            }}
            className="relative flex h-full items-center justify-center"
          >
            <span
              className={
                activeTab ===
                'report'
                  ? 'text-[13px] font-semibold leading-[19.5px] tracking-[0.2px] text-[#C9A96E]'
                  : 'text-[13px] font-normal leading-[19.5px] tracking-[0.2px] text-[#9A9490]'
              }
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              AI 대화 리포트
            </span>

            {activeTab ===
              'report' && (
              <span className="absolute bottom-0 left-1/2 h-[2px] w-[176px] -translate-x-1/2 bg-[#C9A96E]" />
            )}
          </button>
        </nav>

        {/* ============================================ */}
        {/* SAVED FITTING                                */}
        {/* ============================================ */}

        {activeTab ===
          'fitting' && (
          <section className="pb-[120px]">
            <div className="flex h-[45px] items-center justify-between pl-[10px] pr-[15px]">
              <h2
                className="text-[15px] font-semibold leading-[16.5px] tracking-[1.32px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                저장된 피팅
              </h2>

              <div className="flex items-center gap-[8px]">
                {!isFittingSelectMode &&
                  fittings.length >
                    4 && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          '/my/fittings',
                        )
                      }
                      className="text-[11px] font-medium leading-[16.5px] text-[#C9A96E]"
                      style={{
                        fontFamily:
                          'Inter, sans-serif',
                      }}
                    >
                      전체보기 &gt;
                    </button>
                  )}

                {!isFittingSelectMode ? (
                  <button
                    type="button"
                    disabled={
                      fittings.length ===
                      0
                    }
                    onClick={() => {
                      setSelectedFittingIds(
                        [],
                      );
                      setIsFittingSelectMode(
                        true,
                      );
                    }}
                    className="flex h-[20px] min-w-[30px] items-center justify-center rounded-[10px] bg-[#E4B662] px-[7px] text-[8px] font-semibold leading-none text-black disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    선택
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="선택한 피팅 삭제"
                    disabled={
                      selectedFittingIds.length ===
                        0 ||
                      deleteFittingsMutation.isPending
                    }
                    onClick={() => {
                      if (
                        selectedFittingIds.length ===
                        0
                      ) {
                        return;
                      }

                      const confirmed =
                        window.confirm(
                          `선택한 피팅 ${selectedFittingIds.length}개를 삭제하시겠습니까?`,
                        );

                      if (
                        !confirmed
                      ) {
                        return;
                      }

                      deleteFittingsMutation.mutate(
                        selectedFittingIds,
                      );
                    }}
                    className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#E4B662] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <DeleteFittingIcon />
                  </button>
                )}
              </div>
            </div>

            {isFittingLoading && (
              <StatusBox>
                피팅 기록을 불러오는
                중입니다.
              </StatusBox>
            )}

            {isFittingError && (
              <StatusBox>
                피팅 기록을 불러오지
                못했습니다.
              </StatusBox>
            )}

            {!isFittingLoading &&
              !isFittingError &&
              fittings.length ===
                0 && (
                <StatusBox>
                  아직 저장된 피팅이
                  없습니다.
                </StatusBox>
              )}

            {!isFittingLoading &&
              !isFittingError &&
              previewFittings.length >
                0 && (
                <div className="grid grid-cols-[185px_185px] gap-[12px] px-[10px]">
                  {previewFittings.map(
                    (fitting) => {
                      const garment =
                        getGarment(
                          fitting.garmentId,
                        );

                      return (
                        <FittingCard
                          key={
                            fitting.fittingId
                          }
                          fitting={
                            fitting
                          }
                          thumbnailUrl={
                            garment?.thumbnailUrl ??
                            null
                          }
                          selectMode={
                            isFittingSelectMode
                          }
                          selected={selectedFittingIds.includes(
                            fitting.fittingId,
                          )}
                          onSelect={() =>
                            toggleFittingSelection(
                              fitting.fittingId,
                            )
                          }
                          onRetry={() =>
                            navigate(
                              '/fitting',
                              {
                                state: {
                                  garmentId:
                                    fitting.garmentId,
                                },
                              },
                            )
                          }
                        />
                      );
                    },
                  )}
                </div>
              )}

            {/* ============================================ */}
            {/* LIKED GARMENTS                               */}
            {/* ============================================ */}

            <div className="mt-[28px]">
              <h2
                className="px-[20px] text-[11px] font-semibold leading-[16.5px] tracking-[1.32px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                찜한 의류
              </h2>

              {isLikesLoading && (
                <p
                  className="mt-[12px] px-[20px] text-[11px] font-normal leading-[16.5px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  찜한 의류를 불러오는 중입니다.
                </p>
              )}

              {isLikesError && (
                <p
                  className="mt-[12px] px-[20px] text-[11px] font-normal leading-[16.5px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  찜한 의류를 불러오지 못했습니다.
                </p>
              )}

              {!isLikesLoading &&
                !isLikesError &&
                likedGarments.length ===
                  0 && (
                  <p
                    className="mt-[12px] px-[20px] text-[11px] font-normal leading-[16.5px] text-[#9A9490]"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    아직 찜한 의류가 없습니다.
                  </p>
                )}

              {!isLikesLoading &&
                !isLikesError &&
                likedGarments.length >
                  0 && (
                  <div className="mt-[12px] flex w-full gap-[8px] overflow-x-auto px-[20px] pb-[4px] [&::-webkit-scrollbar]:hidden">
                    {likedGarments.map(
                      (garment) => (
                        <button
                          key={
                            garment.garmentId
                          }
                          type="button"
                          onClick={() =>
                            setSelectedLikedGarmentId(
                              garment.garmentId,
                            )
                          }
                          className="flex h-[30px] shrink-0 items-center gap-[5px] rounded-[20px] border-[0.71px] border-white/[0.07] bg-[#141414] px-[12px] py-[6px]"
                        >
                          <HeartIcon className="h-[17px] w-[17px] shrink-0 text-[#F87171]" />

                          <span
                            className="whitespace-nowrap text-[11px] font-normal leading-[16.5px] text-[#9A9490]"
                            style={{
                              fontFamily:
                                'Inter, sans-serif',
                            }}
                          >
                            {
                              garment.name
                            }
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
            </div>
          </section>
        )}

        {/* ============================================ */}
        {/* AI REPORT                                    */}
        {/* ============================================ */}

        {activeTab ===
          'report' && (
          <section className="px-[24px] pb-[120px] pt-[16px]">
            {/* 통계 */}
            <div className="grid h-[62px] grid-cols-3 gap-[8px]">
              <StatCard
                label="총 대화"
                value={
                  fittingConversationIds.length >
                  0
                    ? `${fittingConversationIds.length}회`
                    : '-'
                }
              />

              <StatCard
                label="추천 아이템"
                value={
                  fittingConversationIds.length >
                  0
                    ? `${totalRecommendedItems}개`
                    : '-'
                }
              />

              <StatCard
                label="베스트 핏"
                value={
                  fittingConversationIds.length >
                  0
                    ? `${totalBestFitItems}개`
                    : '-'
                }
              />
            </div>

            <div className="mt-[16px] space-y-[10px]">
              {isReportLoading &&
                reports.length >
                  0 && (
                  <StatusBox
                    fullWidth
                  >
                    상담 리포트를
                    불러오는 중입니다.
                  </StatusBox>
                )}

              {!isReportLoading &&
                reports.length ===
                  0 && (
                  <StatusBox
                    fullWidth
                  >
                    아직 AI 상담 기록이
                    없습니다.
                  </StatusBox>
                )}

              {!isReportLoading &&
                reports.map(
                  (report) => {
                    if (
                      !report.summary
                    ) {
                      return null;
                    }

                    const isOpen =
                      openReportId ===
                      report.conversationId;

                    const metadata =
                      getConversationMetadata(
                        report.messages,
                      );

                    const description =
                      getReportDescription(
                        report.summary,
                      );

                    return (
                      <ReportCard
                        key={
                          report.conversationId
                        }
                        summary={
                          report.summary
                        }
                        messages={
                          report.messages
                        }
                        isOpen={
                          isOpen
                        }
                        date={
                          metadata.date
                        }
                        duration={
                          metadata.duration
                        }
                        description={
                          description
                        }
                        onToggle={() =>
                          setOpenReportId(
                            isOpen
                              ? null
                              : report.conversationId,
                          )
                        }
                        onRetryGarment={(
                          garmentId,
                        ) =>
                          navigate(
                            '/fitting',
                            {
                              state: {
                                garmentId,
                              },
                            },
                          )
                        }
                      />
                    );
                  },
                )}
            </div>
          </section>
        )}
      </div>
    

      {/* ============================================ */}
      {/* LIKED GARMENT BOTTOM SHEET                   */}
      {/* ============================================ */}

      {selectedLikedGarment &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end bg-black/60"
            onClick={() =>
              setSelectedLikedGarmentId(
                null,
              )
            }
          >
            <section
              className="relative w-full rounded-t-[24px] border-t border-white/10 bg-[#141414] px-5 pb-8 pt-4"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

              <button
                type="button"
                aria-label="찜 취소"
                disabled={
                  unlikeMutation.isPending
                }
                onClick={() => {
                  const garmentId =
                    selectedLikedGarment.garmentId;

                  setSelectedLikedGarmentId(
                    null,
                  );

                  unlikeMutation.mutate(
                    garmentId,
                  );
                }}
                className="absolute right-[20px] top-[18px] flex h-[25px] w-[25px] items-center justify-center text-[#F87171]"
              >
                <HeartIcon className="h-[25px] w-[25px]" />
              </button>

              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#eeeeeb]">
                  {selectedLikedGarment.thumbnailUrl ? (
                    <img
                      src={
                        selectedLikedGarment.thumbnailUrl
                      }
                      alt={
                        selectedLikedGarment.name
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GarmentPlaceholderIcon className="h-10 w-10 text-[#9A9490]" />
                  )}
                </div>

                <div className="min-w-0 pr-[32px]">
                  <p
                    className="text-[10px] uppercase tracking-[1px] text-[#C9A96E]"
                    style={{
                      fontFamily:
                        '"DM Mono", monospace',
                    }}
                  >
                    {formatGarmentCategory(
                      selectedLikedGarment.category,
                    )}
                  </p>

                  <h2
                    className="mt-1 truncate text-[16px] font-medium text-[#F0EBE2]"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    {
                      selectedLikedGarment.name
                    }
                  </h2>

                  {isSelectedGarmentLoading && (
                    <p className="mt-2 text-[12px] text-[#9A9490]">
                      상품 정보를 불러오는
                      중입니다.
                    </p>
                  )}

                  {!isSelectedGarmentLoading &&
                    selectedSizeText && (
                      <p
                        className="mt-2 text-[12px] text-[#9A9490]"
                        style={{
                          fontFamily:
                            '"DM Mono", monospace',
                        }}
                      >
                        {selectedSizeText}
                      </p>
                    )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/fitting',
                      {
                        state: {
                          garmentId:
                            selectedLikedGarment.garmentId,
                        },
                      },
                    )
                  }
                  className="h-12 rounded-[10px] border border-[#C9A96E] text-sm font-medium text-[#C9A96E]"
                >
                  입어보기
                </button>

                <button
                  type="button"
                  disabled={
                    isSelectedGarmentLoading ||
                    !selectedGarmentDetail
                      ?.purchaseUrl
                  }
                  onClick={() => {
                    const purchaseUrl =
                      selectedGarmentDetail
                        ?.purchaseUrl;

                    if (!purchaseUrl) {
                      return;
                    }

                    window.open(
                      purchaseUrl,
                      '_blank',
                      'noopener,noreferrer',
                    );
                  }}
                  className={[
                    'h-12 rounded-[10px] bg-[#C9A96E] text-sm font-medium text-[#141414]',
                    isSelectedGarmentLoading ||
                    !selectedGarmentDetail
                      ?.purchaseUrl
                      ? 'cursor-not-allowed opacity-50'
                      : '',
                  ].join(' ')}
                >
                  구매하기
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
</main>
  );
};

export default My;

/* ==================================================== */
/* FITTING CARD                                         */
/* ==================================================== */

type FittingCardProps = {
  fitting: {
    fittingId: number;
    garmentId: number;
    garmentName: string;
    recommendedSize:
      | string
      | null;
    wearable: boolean;
  };
  thumbnailUrl: string | null;
  selectMode: boolean;
  selected: boolean;
  onSelect: () => void;
  onRetry: () => void;
};

function FittingCard({
  fitting,
  thumbnailUrl,
  selectMode,
  selected,
  onSelect,
  onRetry,
}: FittingCardProps) {
  const {
    data: garmentDetail,
    isLoading: isGarmentDetailLoading,
  } = useQuery({
    queryKey: [
      'garment-detail',
      fitting.garmentId,
    ],
    queryFn: () =>
      getGarmentDetail(
        fitting.garmentId,
      ),
  });

  return (
    <article
      className={[
        'h-[285px] w-[185px] overflow-hidden border-[0.7px] bg-[#141414]',
        selected
          ? 'border-[#E4B662]'
          : 'border-white/[0.07]',
        selectMode
          ? 'cursor-pointer'
          : '',
      ].join(' ')}
      onClick={
        selectMode
          ? onSelect
          : undefined
      }
    >
      <div className="relative h-[180px] w-[184px] overflow-hidden bg-[#F3F3F3]">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={
              fitting.garmentName
            }
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#9A9490]">
            <GarmentPlaceholderIcon className="h-[64px] w-[64px]" />
          </div>
        )}

        {selectMode && (
          <div
            className={[
              'absolute right-[8px] top-[8px] z-20 flex h-[17px] w-[17px] items-center justify-center rounded-full',
              selected
                ? 'bg-[#E4B662]'
                : 'border border-[#E4B662] bg-black/20',
            ].join(' ')}
            aria-hidden="true"
          >
            {selected && (
              <CheckIcon className="h-[9px] w-[9px]" />
            )}
          </div>
        )}

        <div className="absolute bottom-[6px] left-[6px] flex h-[21px] items-center gap-[4px] rounded-[4px] border-[0.7px] border-white/[0.07] bg-[#090909]/[0.82] px-[7px] py-[3px]">
          <span
            className={[
              'h-[5px] w-[5px] rounded-full',
              fitting.wearable
                ? 'bg-[#A8D08D]'
                : 'bg-[#C9A96E]',
            ].join(' ')}
          />

          <span
            className="whitespace-nowrap text-[9px] font-normal leading-[13.5px] text-[#F0EBE2]"
            style={{
              fontFamily:
                '"DM Mono", monospace',
            }}
          >
            추천{' '}
            {fitting.recommendedSize
              ?.toUpperCase() ??
              '-'}
          </span>
        </div>
      </div>

      <div className="h-[103px] px-[10px] pb-[8px] pt-[9px]">
        <p
          className="text-[9px] font-normal leading-[13.5px] tracking-[0.9px] text-[#C9A96E]"
          style={{
            fontFamily:
              '"DM Mono", monospace',
          }}
        >
          CLOSR
        </p>

        <h3
          className="mt-[1px] truncate text-[11px] font-medium leading-[14.3px] text-[#F0EBE2]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          {fitting.garmentName}
        </h3>

        <p
          className="mt-[3px] truncate text-[10px] font-normal leading-[15px] text-[#9A9490]"
          style={{
            fontFamily:
              '"DM Mono", monospace',
          }}
        >
          {fitting.wearable
            ? '착용 가능'
            : '사이즈 확인 필요'}
        </p>

        <div className="mt-[7px] flex gap-[5px]">
          <button
            type="button"
            disabled={selectMode}
            onClick={(event) => {
              event.stopPropagation();

              if (
                selectMode
              ) {
                return;
              }

              onRetry();
            }}
            className="flex h-[31px] w-[82px] items-center justify-center gap-[3px] bg-[#E4B662] text-[#0D0A05] disabled:cursor-pointer"
          >
            <ShirtIcon className="h-[12px] w-[12px]" />

            <span
              className="text-[10px] font-bold leading-[15px]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              입어보기
            </span>
          </button>

          <button
            type="button"
            disabled={
              selectMode ||
              isGarmentDetailLoading ||
              !garmentDetail?.purchaseUrl
            }
            onClick={(event) => {
              event.stopPropagation();

              if (
                selectMode
              ) {
                return;
              }

              const purchaseUrl =
                garmentDetail
                  ?.purchaseUrl;

              if (!purchaseUrl) {
                return;
              }

              window.open(
                purchaseUrl,
                '_blank',
                'noopener,noreferrer',
              );
            }}
            className={[
              'h-[31px] w-[66px] border-[0.7px] border-white/[0.07] text-[10px] font-normal leading-[15px]',
              selectMode ||
              isGarmentDetailLoading ||
              !garmentDetail?.purchaseUrl
                ? 'cursor-not-allowed text-[#9A9490]'
                : 'text-[#C9A96E]',
            ].join(' ')}
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            구매하기
          </button>
        </div>
      </div>
    </article>
  );
}

/* ==================================================== */
/* REPORT CARD                                          */
/* ==================================================== */

type ReportCardProps = {
  summary: ChatSummary;
  messages: StoredMessage[];
  isOpen: boolean;
  date: string;
  duration: string;
  description: string;
  onToggle: () => void;
  onRetryGarment: (
    garmentId: number,
  ) => void;
};

function ReportCard({
  summary,
  messages,
  isOpen,
  date,
  duration,
  description,
  onToggle,
  onRetryGarment,
}: ReportCardProps) {
  const headline =
    summary.headline ??
    'AI 피팅 상담';

  const recommendedGarmentId =
    summary.items[0]?.garmentId ??
    null;

  const {
    data: recommendedGarmentDetail,
    isLoading:
      isRecommendedGarmentLoading,
  } = useQuery({
    queryKey: [
      'garment-detail',
      recommendedGarmentId,
    ],
    queryFn: () => {
      if (
        recommendedGarmentId ===
        null
      ) {
        throw new Error(
          '추천 의류가 없습니다.',
        );
      }

      return getGarmentDetail(
        recommendedGarmentId,
      );
    },
    enabled:
      recommendedGarmentId !==
      null,
  });

  return (
    <article
      className="w-[353px] overflow-hidden rounded-[12px] border-[0.7px] bg-[#141414]"
      style={{
        borderColor: isOpen
          ? 'rgba(201, 169, 110, 0.28)'
          : 'rgba(255, 255, 255, 0.07)',
      }}
    >
      {/* 카드 상단 */}
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[99px] w-full items-start px-[14px] py-[14px] text-left"
      >
        <div
          className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] border-[0.7px]"
          style={{
            borderColor: 'rgba(201, 169, 110, 0.28)',
            backgroundColor: 'rgba(201, 169, 110, 0.12)',
          }}
        >
          <AssistantIcon className="h-[24px] w-[24px] text-[#C9A96E]" />
        </div>

        <div className="ml-[14px] min-w-0 flex-1">
          <div className="flex items-start justify-between gap-[8px]">
            <h3
              className="truncate text-[13px] font-semibold leading-[16.9px] text-[#F0EBE2]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {headline}
            </h3>

            <ChevronIcon
              open={isOpen}
              className="mt-[6px] h-[4px] w-[8px] shrink-0 text-[#9A9490]"
            />
          </div>

          {description && (
            <p
              className="mt-[5px] line-clamp-2 text-[11px] font-normal leading-[15.4px] text-[#9A9490]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {description}
            </p>
          )}

          <div
            className="mt-[7px] flex items-center gap-[8px] whitespace-nowrap text-[9px] font-normal leading-[13.5px]"
            style={{
              fontFamily:
                '"DM Mono", monospace',
            }}
          >
            <span className="text-[#555555]">
              {date || '-'}
            </span>

            {duration && (
              <>
                <span className="text-[#333333]">
                  ·
                </span>

                <span className="text-[#555555]">
                  {duration}
                </span>
              </>
            )}

            {summary.items.length >
              0 && (
              <>
                <span className="text-[#333333]">
                  ·
                </span>

                <span className="flex items-center gap-[4px] text-[#C9A96E]">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#C9A96E]" />

                  추천{' '}
                  {
                    summary.items
                      .length
                  }
                  개
                </span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* 대화 펼침 */}
      {isOpen && (
        <div
          className="border-t-[0.7px] px-[10px] pb-[16px] pt-[16px]"
          style={{
            borderTopColor: '#1E1E1E',
          }}
        >
          <p
            className="mb-[12px] text-[9px] font-normal leading-[13.5px] text-[#9A9490]"
            style={{
              fontFamily:
                '"DM Mono", monospace',
            }}
          >
            대화 기록
          </p>

          <div className="space-y-[8px]">
            {messages.length ===
            0 ? (
              <p className="py-[24px] text-center text-[11px] text-[#555555]">
                저장된 대화가
                없습니다.
              </p>
            ) : (
              messages.map(
                (message) =>
                  message.role ===
                  'assistant' ? (
                    <AssistantMessage
                      key={
                        message.messageId
                      }
                      content={
                        message.content
                      }
                    />
                  ) : (
                    <UserMessage
                      key={
                        message.messageId
                      }
                      content={
                        message.content
                      }
                    />
                  ),
              )
            )}
          </div>

          {summary.items.length > 0 && (
            <div className="mt-[18px] flex gap-[5px]">
              <button
                type="button"
                onClick={() =>
                  onRetryGarment(
                    summary.items[0].garmentId,
                  )
                }
                className="flex h-[39.4px] flex-1 items-center justify-center gap-[5px] bg-[#C9A96E] text-[#0D0A05]"
              >
                <ShirtIcon className="h-[14px] w-[14px]" />

                <span
                  className="text-[12px] font-bold leading-[18px]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  다시 입어보기
                </span>
              </button>

              <button
                type="button"
                disabled={
                  isRecommendedGarmentLoading ||
                  !recommendedGarmentDetail
                    ?.purchaseUrl
                }
                onClick={() => {
                  const purchaseUrl =
                    recommendedGarmentDetail
                      ?.purchaseUrl;

                  if (!purchaseUrl) {
                    return;
                  }

                  window.open(
                    purchaseUrl,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
                className={[
                  'h-[39.4px] flex-1 border-[0.7px] border-white/[0.07] bg-transparent text-[12px] font-normal leading-[18px]',
                  isRecommendedGarmentLoading ||
                  !recommendedGarmentDetail
                    ?.purchaseUrl
                    ? 'cursor-not-allowed text-[#9A9490]'
                    : 'text-[#C9A96E]',
                ].join(' ')}
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                구매하기
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ==================================================== */
/* CHAT MESSAGE                                         */
/* ==================================================== */

function AssistantMessage({
  content,
}: {
  content: string;
}) {
  return (
    <div className="flex items-start gap-[8px]">
      <div
        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6px] border-[0.7px]"
        style={{
          borderColor: 'rgba(201, 169, 110, 0.28)',
          backgroundColor: 'rgba(201, 169, 110, 0.12)',
        }}
      >
        <AssistantIcon className="h-[16px] w-[16px] text-[#C9A96E]" />
      </div>

      <div className="max-w-[253px] rounded-[10px] border-[0.7px] border-white/[0.07] bg-[#1E1E1E] px-[10px] py-[8px]">
        <p
          className="whitespace-pre-wrap text-[11px] font-normal leading-[17.6px] text-[#F0EBE2]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          {content}
        </p>
      </div>
    </div>
  );
}

function UserMessage({
  content,
}: {
  content: string;
}) {
  return (
    <div className="flex items-start justify-end gap-[8px]">
      <div
        className="max-w-[253px] rounded-[10px] border-[0.7px] px-[10px] py-[8px]"
        style={{
          borderColor: 'rgba(201, 169, 110, 0.28)',
          backgroundColor: 'rgba(201, 169, 110, 0.10)',
        }}
      >
        <p
          className="whitespace-pre-wrap text-[11px] font-normal leading-[17.6px] text-[#C9A96E]"
          style={{
            fontFamily:
              'Inter, sans-serif',
          }}
        >
          {content}
        </p>
      </div>

      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#C9A96E]">
        <span
          className="text-[10px] text-black"
          style={{
            fontFamily:
              '"DM Serif Display", serif',
          }}
        >
          C
        </span>
      </div>
    </div>
  );
}

/* ==================================================== */
/* STAT                                                 */
/* ==================================================== */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-[62px] min-w-0 flex-col items-center justify-center rounded-[8px] border-[0.7px] border-white/[0.07] bg-[#141414]">
      <span
        className="text-[9px] font-normal leading-[13.5px] text-[#9A9490]"
        style={{
          fontFamily:
            'Inter, sans-serif',
        }}
      >
        {label}
      </span>

      <strong
        className="mt-[3px] text-[15px] font-medium leading-[22.5px] text-[#F0EBE2]"
        style={{
          fontFamily:
            '"DM Mono", monospace',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* ==================================================== */
/* HELPER                                               */
/* ==================================================== */

function formatGarmentCategory(
  category: string,
) {
  const normalized = category
    .trim()
    .toLowerCase();

  const labels: Record<
    string,
    string
  > = {
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
}

function getConversationMetadata(
  messages: StoredMessage[],
) {
  if (messages.length === 0) {
    return {
      date: '',
      duration: '',
    };
  }

  const first = new Date(
    messages[0].createdAt,
  );

  const last = new Date(
    messages[
      messages.length - 1
    ].createdAt,
  );

  const date = [
    first.getFullYear(),
    String(
      first.getMonth() + 1,
    ).padStart(2, '0'),
    String(
      first.getDate(),
    ).padStart(2, '0'),
  ].join('.');

  const durationMs = Math.max(
    0,
    last.getTime() -
      first.getTime(),
  );

  const totalSeconds =
    Math.floor(
      durationMs / 1000,
    );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  const duration =
    totalSeconds > 0
      ? `${minutes}분 ${seconds}초`
      : '';

  return {
    date,
    duration,
  };
}

function getReportDescription(
  summary: ChatSummary,
) {
  if (
    summary.preference?.purpose
  ) {
    return summary.preference
      .purpose;
  }

  if (
    summary.items[0]?.note
  ) {
    return summary.items[0]
      .note;
  }

  if (
    summary.preference
      ?.preferredFit
  ) {
    return `${summary.preference.preferredFit} 핏을 중심으로 분석했습니다.`;
  }

  return '';
}

function StatusBox({
  children,
  fullWidth = false,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={[
        'flex h-[120px] items-center justify-center rounded-[8px] border-[0.7px] border-white/[0.07] bg-[#141414]',
        fullWidth
          ? 'w-full'
          : 'mx-[10px]',
      ].join(' ')}
    >
      <p
        className="text-[11px] text-[#9A9490]"
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

/* ==================================================== */
/* ICON                                                 */
/* ==================================================== */


function HeartIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 21h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 10 13"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M1 10.8 1.6 8l5.9-5.9 1.8 1.8-5.9 5.9L1 10.8Z"
        fill="currentColor"
      />

      <path
        d="M1 12h8"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

/* Figma 원본 Gear */
function SettingsIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9.62272 5.3114C8.76978 5.3114 7.93601 5.56432 7.22682 6.03818C6.51763 6.51205 5.96489 7.18557 5.63849 7.97357C5.31208 8.76158 5.22668 9.62868 5.39308 10.4652C5.55948 11.3018 5.97021 12.0702 6.57332 12.6733C7.17643 13.2764 7.94485 13.6871 8.78139 13.8535C9.61793 14.0199 10.485 13.9345 11.273 13.6081C12.061 13.2817 12.7346 12.729 13.2084 12.0198C13.6823 11.3106 13.9352 10.4768 13.9352 9.6239C13.9337 8.48061 13.4789 7.38457 12.6705 6.57614C11.862 5.76771 10.766 5.31288 9.62272 5.3114ZM9.62272 12.8114C8.99229 12.8114 8.37602 12.6245 7.85184 12.2742C7.32765 11.924 6.91911 11.4261 6.67785 10.8437C6.4366 10.2613 6.37347 9.62036 6.49646 9.00205C6.61945 8.38373 6.92303 7.81577 7.36881 7.36999C7.81459 6.92421 8.38255 6.62063 9.00087 6.49764C9.61918 6.37465 10.2601 6.43778 10.8425 6.67903C11.425 6.92029 11.9228 7.32884 12.273 7.85302C12.6233 8.3772 12.8102 8.99347 12.8102 9.6239C12.8102 10.4693 12.4744 11.28 11.8766 11.8778C11.2788 12.4756 10.4681 12.8114 9.62272 12.8114ZM17.6852 9.89015C17.6908 9.71296 17.6908 9.53483 17.6852 9.35765L19.1224 7.5614C19.1773 7.49264 19.2154 7.41194 19.2334 7.32581C19.2515 7.23968 19.2491 7.1505 19.2265 7.06546C19.0016 6.21803 18.6649 5.40431 18.2252 4.64577C18.1815 4.56879 18.1203 4.50319 18.0465 4.45432C17.9727 4.40545 17.8885 4.37468 17.8005 4.36452L15.5083 4.11046C15.3877 3.98108 15.2627 3.85608 15.1333 3.73546L14.8783 1.44233C14.8682 1.35441 14.8374 1.27012 14.7885 1.19633C14.7397 1.12254 14.6741 1.06132 14.5971 1.01765C13.8395 0.579231 13.0271 0.243179 12.1812 0.0182716C12.0959 -0.00400582 12.0066 -0.00594058 11.9205 0.0126234C11.8343 0.0311874 11.7537 0.0697307 11.6852 0.125147L9.88522 1.56608C9.70803 1.56046 9.5299 1.56046 9.35272 1.56608L7.56022 0.124209C7.49146 0.0692749 7.41076 0.031242 7.32463 0.0131684C7.2385 -0.00490515 7.14932 -0.0025151 7.06428 0.0201465C6.21685 0.245007 5.40313 0.581717 4.64459 1.0214C4.56761 1.06507 4.50201 1.12629 4.45314 1.20008C4.40427 1.27387 4.3735 1.35816 4.36334 1.44608L4.11303 3.73827C3.98365 3.85952 3.85865 3.98452 3.73803 4.11327L1.44397 4.3739C1.35604 4.38406 1.27176 4.41483 1.19796 4.4637C1.12417 4.51257 1.06295 4.57816 1.01928 4.65515C0.580864 5.41276 0.244812 6.22515 0.0199042 7.07108C-0.00183541 7.15529 -0.00375242 7.2434 0.0143037 7.32847C0.0323598 7.41355 0.0698973 7.49328 0.123967 7.5614L1.5649 9.3614C1.55928 9.53858 1.55928 9.71671 1.5649 9.8939L0.123029 11.6911C0.0680951 11.7598 0.0300622 11.8405 0.0119886 11.9267C-0.00608498 12.0128 -0.00369492 12.102 0.0189666 12.187C0.244219 13.0328 0.580919 13.845 1.02022 14.602C1.06389 14.679 1.12511 14.7446 1.1989 14.7935C1.27269 14.8423 1.35698 14.8731 1.4449 14.8833L3.73709 15.1373C3.85834 15.2667 3.98334 15.3917 4.11209 15.5123L4.37272 17.8026C4.38288 17.8906 4.41364 17.9749 4.46252 18.0487C4.51139 18.1224 4.57698 18.1837 4.65397 18.2273C5.41158 18.6658 6.22397 19.0018 7.0699 19.2267C7.15495 19.2494 7.24412 19.2518 7.33025 19.2337C7.41639 19.2156 7.49708 19.1776 7.56584 19.1226L9.35647 17.6864C9.53365 17.692 9.71178 17.692 9.88897 17.6864L11.6899 19.1283C11.7897 19.2079 11.9137 19.2512 12.0415 19.2511C12.0902 19.2509 12.1387 19.2446 12.1858 19.2323C13.0317 19.0071 13.8438 18.6704 14.6008 18.2311C14.6778 18.1874 14.7434 18.1262 14.7923 18.0524C14.8412 17.9786 14.8719 17.8943 14.8821 17.8064L15.1362 15.5142C15.2655 15.3936 15.3905 15.2686 15.5112 15.1392L17.8043 14.8842C17.8922 14.874 17.9765 14.8433 18.0503 14.7944C18.1241 14.7455 18.1853 14.6799 18.229 14.603C18.6675 13.8454 19.0036 13.033 19.2283 12.187C19.251 12.102 19.2534 12.0128 19.2353 11.9267C19.2172 11.8405 19.1792 11.7598 19.1243 11.6911L17.6852 9.89015ZM17.3946 13.793L15.1783 14.0395C15.0399 14.0555 14.9122 14.1223 14.8202 14.227C14.6349 14.4358 14.4374 14.6333 14.2287 14.8186C14.1239 14.9106 14.0571 15.0382 14.0412 15.1767L13.7946 17.392C13.2757 17.6687 12.7305 17.893 12.1671 18.0614L10.4262 16.6683C10.3263 16.5886 10.2023 16.5453 10.0746 16.5455H10.0408C9.76232 16.5614 9.48311 16.5614 9.20459 16.5455C9.06549 16.537 8.92818 16.5804 8.81928 16.6673L7.07928 18.0614C6.51637 17.892 5.97179 17.6669 5.45365 17.3892L5.20709 15.1748C5.19113 15.0363 5.12431 14.9087 5.01959 14.8167C4.81086 14.6314 4.61332 14.4339 4.42803 14.2251C4.33601 14.1204 4.20839 14.0536 4.0699 14.0376L1.85459 13.7911C1.57817 13.2737 1.35394 12.7301 1.18522 12.1683L2.57834 10.4273C2.66529 10.3184 2.70873 10.1811 2.70022 10.042C2.68428 9.7635 2.68428 9.48429 2.70022 9.20577C2.70873 9.06667 2.66529 8.92936 2.57834 8.82046L1.18522 7.08046C1.35458 6.51755 1.57976 5.97297 1.8574 5.45483L4.07178 5.20827C4.21026 5.19231 4.33789 5.12549 4.4299 5.02077C4.6152 4.81204 4.81273 4.6145 5.02147 4.42921C5.12618 4.33719 5.193 4.20957 5.20897 4.07108L5.45553 1.85577C5.97291 1.57935 6.51653 1.35512 7.07834 1.1864L8.81928 2.57952C8.92818 2.66647 9.06549 2.70991 9.20459 2.7014C9.48311 2.68546 9.76232 2.68546 10.0408 2.7014C10.1799 2.70991 10.3172 2.66647 10.4262 2.57952L12.1662 1.1864C12.7291 1.35576 13.2736 1.58094 13.7918 1.85858L14.0383 4.07483C14.0543 4.21332 14.1211 4.34094 14.2258 4.43296C14.4346 4.61825 14.6321 4.81579 14.8174 5.02452C14.9094 5.12924 15.037 5.19606 15.1755 5.21202L17.3908 5.45858C17.6672 5.97537 17.8914 6.51836 18.0602 7.07952L16.6671 8.82046C16.5801 8.92936 16.5367 9.06667 16.5452 9.20577C16.5612 9.48429 16.5612 9.7635 16.5452 10.042C16.5367 10.1811 16.5801 10.3184 16.6671 10.4273L18.0602 12.1673C17.8915 12.7302 17.6669 13.2748 17.3899 13.793H17.3946Z"
        fill="#C9A96E"
        fillOpacity={0.8}
      />
    </svg>
  );
}

/* 기존 VoiceAssistant 원본 */
function AssistantIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M21.4688 20.0859C21.3135 20.2101 21.1152 20.2674 20.9176 20.2455C20.72 20.2235 20.5393 20.124 20.415 19.9687C20.2866 19.8066 17.25 15.9244 17.25 8.25C17.25 6.85761 16.6969 5.52225 15.7123 4.53769C14.7278 3.55312 13.3924 3 12 3C10.6076 3 9.27227 3.55312 8.2877 4.53769C7.30314 5.52225 6.75001 6.85761 6.75001 8.25C6.75001 15.9244 3.71533 19.8066 3.58595 19.9687C3.46163 20.1243 3.28062 20.224 3.08274 20.2461C2.88486 20.2682 2.68632 20.2107 2.53079 20.0864C2.37527 19.9621 2.2755 19.7811 2.25344 19.5832C2.23137 19.3853 2.28882 19.1868 2.41314 19.0312C2.4272 19.0125 3.13408 18.1031 3.83158 16.3369C4.47845 14.7 5.25001 11.9662 5.25001 8.25C5.25001 6.45979 5.96117 4.7429 7.22704 3.47703C8.49291 2.21116 10.2098 1.5 12 1.5C13.7902 1.5 15.5071 2.21116 16.773 3.47703C18.0389 4.7429 18.75 6.45979 18.75 8.25C18.75 11.9662 19.5216 14.7 20.1685 16.3387C20.8697 18.1144 21.5803 19.0237 21.5878 19.0331C21.7114 19.1886 21.7683 19.3868 21.746 19.5842C21.7237 19.7815 21.624 19.962 21.4688 20.0859ZM9.37501 8.25C9.15251 8.25 8.935 8.31598 8.75 8.4396C8.56499 8.56321 8.4208 8.73891 8.33565 8.94448C8.2505 9.15005 8.22822 9.37625 8.27163 9.59448C8.31504 9.81271 8.42218 10.0132 8.57952 10.1705C8.73685 10.3278 8.93731 10.435 9.15554 10.4784C9.37377 10.5218 9.59997 10.4995 9.80553 10.4144C10.0111 10.3292 10.1868 10.185 10.3104 10C10.434 9.81501 10.5 9.5975 10.5 9.375C10.5 9.07663 10.3815 8.79048 10.1705 8.5795C9.95953 8.36853 9.67338 8.25 9.37501 8.25ZM15.75 9.375C15.75 9.1525 15.684 8.93499 15.5604 8.74998C15.4368 8.56498 15.2611 8.42078 15.0555 8.33563C14.85 8.25049 14.6238 8.22821 14.4055 8.27162C14.1873 8.31502 13.9869 8.42217 13.8295 8.5795C13.6722 8.73684 13.565 8.93729 13.5216 9.15552C13.4782 9.37375 13.5005 9.59995 13.5856 9.80552C13.6708 10.0111 13.815 10.1868 14 10.3104C14.185 10.434 14.4025 10.5 14.625 10.5C14.9234 10.5 15.2095 10.3815 15.4205 10.1705C15.6315 9.95952 15.75 9.67337 15.75 9.375ZM9.33564 12.0787C9.1583 11.9945 8.955 11.9832 8.7694 12.0472C8.58379 12.1111 8.43067 12.2454 8.34292 12.421C8.25517 12.5966 8.23978 12.7996 8.30006 12.9865C8.36034 13.1733 8.49148 13.3291 8.66533 13.4203L11.6653 14.9203C11.7693 14.9727 11.8841 15 12.0005 15C12.1169 15 12.2317 14.9727 12.3356 14.9203L15.3356 13.4203C15.5135 13.3313 15.6488 13.1753 15.7116 12.9865C15.7745 12.7978 15.7598 12.5918 15.6708 12.4139C15.5818 12.236 15.4257 12.1007 15.237 12.0379C15.0483 11.975 14.8423 11.9897 14.6644 12.0787L12 13.4109L9.33564 12.0787ZM12 16.5C11.0975 16.5072 10.2132 16.7553 9.43857 17.2185C8.66395 17.6818 8.02708 18.3435 7.59376 19.1353C7.49704 19.3094 7.47342 19.5147 7.5281 19.7062C7.58278 19.8976 7.71128 20.0595 7.88533 20.1562C8.05937 20.253 8.26472 20.2766 8.45618 20.2219C8.64764 20.1672 8.80954 20.0387 8.90626 19.8647C9.20421 19.3026 9.64963 18.8324 10.1947 18.5044C10.7398 18.1764 11.3639 18.0031 12 18.0031C12.6361 18.0031 13.2603 18.1764 13.8053 18.5044C14.3504 18.8324 14.7958 19.3026 15.0938 19.8647C15.1905 20.0387 15.3524 20.1672 15.5438 20.2219C15.7353 20.2766 15.9407 20.253 16.1147 20.1562C16.2887 20.0595 16.4172 19.8976 16.4719 19.7062C16.5266 19.5147 16.503 19.3094 16.4063 19.1353C15.9729 18.3435 15.3361 17.6818 14.5615 17.2185C13.7868 16.7553 12.9026 16.5072 12 16.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronIcon({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 8 4"
      fill="none"
      className={[
        className,
        'transition-transform',
        open
          ? 'rotate-180'
          : '',
      ].join(' ')}
      aria-hidden="true"
    >
      <path
        d="M1 1 4 3 7 1"
        stroke="currentColor"
        strokeWidth="1.17"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShirtIcon({
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
        d="m5 2 3 2 3-2 3 3-2 2v7H4V7L2 5l3-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteFittingIcon() {
  return (
    <svg
      width="10"
      height="11"
      viewBox="0 0 10 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.58333 1.69231H7.5V1.26923C7.5 0.93261 7.3683 0.609776 7.13388 0.371749C6.89946 0.133722 6.58152 0 6.25 0H3.75C3.41848 0 3.10054 0.133722 2.86612 0.371749C2.6317 0.609776 2.5 0.93261 2.5 1.26923V1.69231H0.416667C0.30616 1.69231 0.200179 1.73688 0.122039 1.81622C0.0438988 1.89557 0 2.00318 0 2.11538C0 2.22759 0.0438988 2.3352 0.122039 2.41455C0.200179 2.49389 0.30616 2.53846 0.416667 2.53846H0.833333V10.1538C0.833333 10.3783 0.921131 10.5935 1.07741 10.7522C1.23369 10.9109 1.44565 11 1.66667 11H8.33333C8.55435 11 8.76631 10.9109 8.92259 10.7522C9.07887 10.5935 9.16667 10.3783 9.16667 10.1538V2.53846H9.58333C9.69384 2.53846 9.79982 2.49389 9.87796 2.41455C9.9561 2.3352 10 2.22759 10 2.11538C10 2.00318 9.9561 1.89557 9.87796 1.81622C9.79982 1.73688 9.69384 1.69231 9.58333 1.69231ZM4.16667 8.03846C4.16667 8.15067 4.12277 8.25828 4.04463 8.33762C3.96649 8.41696 3.86051 8.46154 3.75 8.46154C3.63949 8.46154 3.53351 8.41696 3.45537 8.33762C3.37723 8.25828 3.33333 8.15067 3.33333 8.03846V4.65385C3.33333 4.54164 3.37723 4.43403 3.45537 4.35469C3.53351 4.27534 3.63949 4.23077 3.75 4.23077C3.86051 4.23077 3.96649 4.27534 4.04463 4.35469C4.12277 4.43403 4.16667 4.54164 4.16667 4.65385V8.03846ZM6.66667 8.03846C6.66667 8.15067 6.62277 8.25828 6.54463 8.33762C6.46649 8.41696 6.36051 8.46154 6.25 8.46154C6.13949 8.46154 6.03351 8.41696 5.95537 8.33762C5.87723 8.25828 5.83333 8.15067 5.83333 8.03846V4.65385C5.83333 4.54164 5.87723 4.43403 5.95537 4.35469C6.03351 4.27534 6.13949 4.23077 6.25 4.23077C6.36051 4.23077 6.46649 4.27534 6.54463 4.35469C6.62277 4.43403 6.66667 4.54164 6.66667 4.65385V8.03846ZM6.66667 1.69231H3.33333V1.26923C3.33333 1.15702 3.37723 1.04941 3.45537 0.97007C3.53351 0.890728 3.63949 0.846154 3.75 0.846154H6.25C6.36051 0.846154 6.46649 0.890728 6.54463 0.97007C6.62277 1.04941 6.66667 1.15702 6.66667 1.26923V1.69231Z"
        fill="black"
        fillOpacity={0.8}
      />
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
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 6.1 4.8 8.3 9.5 3.7"
        stroke="white"
        strokeWidth="1.7"
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