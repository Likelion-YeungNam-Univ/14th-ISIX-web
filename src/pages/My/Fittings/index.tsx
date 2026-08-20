import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import {
  deleteFitting,
  getMyFittings,
} from '@/api/fitting';
import { getGarments } from '@/api/garment';
import HomeLogo from '@/components/common/HomeLogo';

const PAGE_SIZE = 12;
const MAX_VISIBLE_PAGES = 6;

const MyFittings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [isSelectMode, setIsSelectMode] =
    useState(false);
  const [
    selectedFittingIds,
    setSelectedFittingIds,
  ] = useState<number[]>([]);

  const {
    data: fittingData,
    isLoading,
    isError,
    refetch,
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

  const fittings =
    fittingData?.fittings ?? [];

  const totalPages = Math.max(
    1,
    Math.ceil(
      fittings.length / PAGE_SIZE,
    ),
  );

  const currentFittings =
    fittings.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE,
    );

  const visiblePages = useMemo(() => {
    if (
      totalPages <= MAX_VISIBLE_PAGES
    ) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    const half = Math.floor(
      MAX_VISIBLE_PAGES / 2,
    );

    let start = Math.max(
      1,
      page - half,
    );

    let end =
      start +
      MAX_VISIBLE_PAGES -
      1;

    if (end > totalPages) {
      end = totalPages;
      start =
        totalPages -
        MAX_VISIBLE_PAGES +
        1;
    }

    return Array.from(
      {
        length:
          end - start + 1,
      },
      (_, index) =>
        start + index,
    );
  }, [page, totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const getGarment = (
    garmentId: number,
  ) =>
    garments.find(
      (garment) =>
        garment.garmentId ===
        garmentId,
    );

  const toggleFittingSelection = (
    fittingId: number,
  ) => {
    setSelectedFittingIds((prev) =>
      prev.includes(fittingId)
        ? prev.filter(
            (id) => id !== fittingId,
          )
        : [...prev, fittingId],
    );
  };

  const deleteFittingsMutation =
    useMutation({
      mutationFn: async (
        fittingIds: number[],
      ) => {
        await Promise.all(
          fittingIds.map((fittingId) =>
            deleteFitting(fittingId),
          ),
        );
      },

      onSuccess: () => {
        setSelectedFittingIds([]);
        setIsSelectMode(false);
      },

      onError: () => {
        window.alert(
          '피팅 기록을 삭제하지 못했습니다. 다시 시도해 주세요.',
        );
      },

      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: ['my-fittings'],
        });
      },
    });

  const handleDeleteSelected = () => {
    if (
      selectedFittingIds.length === 0 ||
      deleteFittingsMutation.isPending
    ) {
      return;
    }

    const confirmed = window.confirm(
      `선택한 피팅 ${selectedFittingIds.length}개를 삭제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    deleteFittingsMutation.mutate(
      selectedFittingIds,
    );
  };

  return (
    <main className="min-h-[100dvh] bg-[#090909] text-[#F0EBE2]">
      <div className="mx-auto min-h-[100dvh] w-[402px] max-w-full overflow-x-hidden bg-[#090909]">
        {/* Home / MY와 동일한 Header */}
        <header className="flex h-[46px] items-center justify-between border-b border-white/10 bg-[#080808] px-[14px]">
          <HomeLogo className="text-[20px] font-bold leading-[30px] tracking-[1.2px] text-[#F0EBE2]" />

          <button
            type="button"
            aria-label="알림"
            className="grid h-8 w-8 place-items-center text-white"
          >
            <BellIcon className="h-[24px] w-[24px]" />
          </button>
        </header>

        {/* 뒤로 / 저장된 피팅 */}
        <div className="relative flex h-[48px] w-full items-center border-b-[0.7px] border-white/[0.07] bg-[#090909] px-[20px]">
          <button
            type="button"
            onClick={() =>
              navigate('/my')
            }
            className="text-[13px] font-normal leading-[19.5px] text-[#C9A96E]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            &lt; 뒤로
          </button>

          <h1
            className="absolute left-1/2 -translate-x-1/2 text-[14px] font-semibold leading-[21px] text-[#F0EBE2]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            저장된 피팅
          </h1>
        </div>

        {/* 전체 피팅 / 개수 / 선택 */}
        <div className="flex h-[45px] items-center justify-between px-[10px]">
          <h2
            className="text-[15px] font-semibold leading-[16.5px] tracking-[1.32px] text-[#9A9490]"
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            전체 피팅
          </h2>

          <div className="flex items-center gap-[8px]">
            <span
              className="text-[10px] font-normal leading-[15px] text-[#C9A96E]"
              style={{
                fontFamily:
                  '"DM Mono", monospace',
              }}
            >
              {fittings.length}개
            </span>

            {!isSelectMode ? (
              <button
                type="button"
                disabled={
                  fittings.length === 0
                }
                onClick={() => {
                  setSelectedFittingIds(
                    [],
                  );
                  setIsSelectMode(true);
                }}
                className="flex h-[20px] items-center justify-center rounded-[10px] bg-[#E4B662] px-[7px] text-[8px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
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
                onClick={
                  handleDeleteSelected
                }
                className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#E4B662] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <DeleteFittingIcon />
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-[185px_185px] gap-[12px] px-[10px]">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <FittingCardSkeleton
                key={index}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="mx-[10px] flex h-[180px] flex-col items-center justify-center rounded-[8px] border-[0.7px] border-white/[0.07] bg-[#141414]">
            <p className="text-[11px] text-[#9A9490]">
              피팅 기록을 불러오지
              못했습니다.
            </p>

            <button
              type="button"
              onClick={() =>
                void refetch()
              }
              className="mt-[12px] text-[11px] font-medium text-[#C9A96E]"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading &&
          !isError &&
          fittings.length === 0 && (
            <div className="mx-[10px] flex h-[180px] items-center justify-center rounded-[8px] border-[0.7px] border-white/[0.07] bg-[#141414]">
              <p className="text-[11px] text-[#9A9490]">
                아직 저장된 피팅이
                없습니다.
              </p>
            </div>
          )}

        {/* Grid */}
        {!isLoading &&
          !isError &&
          currentFittings.length >
            0 && (
            <>
              <div className="grid grid-cols-[185px_185px] gap-[12px] px-[10px]">
                {currentFittings.map(
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
                        fitting={fitting}
                        thumbnailUrl={
                          garment?.thumbnailUrl ??
                          null
                        }
                        selectMode={
                          isSelectMode
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

              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={
                    totalPages
                  }
                  visiblePages={
                    visiblePages
                  }
                  onChange={setPage}
                />
              )}
            </>
          )}

        <div className="h-[120px]" />
      </div>
    </main>
  );
};

export default MyFittings;

/* ==================================================== */
/* Card                                                 */
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
  return (
    <article
      className={[
        'h-[285px] w-[185px] overflow-hidden rounded-[8px] border-[0.7px] bg-[#141414]',
        selected
          ? 'border-[#E4B662]'
          : 'border-white/[0.07]',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative h-[180px] w-[184px] overflow-hidden bg-[#F3F3F3]">
        {selectMode && (
          <>
            <button
              type="button"
              aria-label={
                selected
                  ? '피팅 선택 해제'
                  : '피팅 선택'
              }
              onClick={onSelect}
              className="absolute inset-0 z-10"
            />

            <div
              className={[
                'pointer-events-none absolute right-[8px] top-[8px] z-20 flex h-[17px] w-[17px] items-center justify-center rounded-full border',
                selected
                  ? 'border-[#E4B662] bg-[#E4B662]'
                  : 'border-[#E4B662] bg-black/20',
              ].join(' ')}
            >
              {selected && (
                <CheckIcon className="h-[9px] w-[9px]" />
              )}
            </div>
          </>
        )}

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

        {/* 실제 퍼센트가 없으므로 추천 사이즈 */}
        <div className="absolute bottom-[6px] left-[6px] flex h-[21px] items-center gap-[4px] rounded-[4px] border-[0.7px] border-white/[0.07] bg-[#090909]/80 px-[7px] py-[3px]">
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

      {/* Info */}
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
            onClick={onRetry}
            className="flex h-[31px] w-[82px] items-center justify-center gap-[3px] rounded-[4px] bg-[#C9A96E] text-[#0D0A05] disabled:cursor-not-allowed disabled:opacity-40"
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
            disabled
            className="h-[31px] w-[66px] rounded-[4px] border-[0.7px] border-white/[0.07] text-[10px] font-normal leading-[15px] text-[#9A9490]"
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
/* Pagination                                           */
/* ==================================================== */

type PaginationProps = {
  page: number;
  totalPages: number;
  visiblePages: number[];
  onChange: (
    page: number,
  ) => void;
};

function Pagination({
  page,
  totalPages,
  visiblePages,
  onChange,
}: PaginationProps) {
  return (
    <nav className="mx-auto mt-[32px] flex h-[17px] w-fit items-center">
      <button
        type="button"
        disabled={page === 1}
        onClick={() =>
          onChange(
            Math.max(
              1,
              page - 1,
            ),
          )
        }
        className="whitespace-nowrap text-[10px] uppercase leading-[16.5px] tracking-[1.32px] text-white disabled:opacity-30"
      >
        &lt; 이전
      </button>

      <div className="ml-[32px] flex items-center gap-[15px]">
        {visiblePages.map(
          (pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() =>
                onChange(
                  pageNumber,
                )
              }
              className={[
                'text-[10px] leading-[17px]',
                page ===
                pageNumber
                  ? 'text-[#C9A96E]'
                  : 'text-white',
              ].join(' ')}
            >
              {pageNumber}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={
          page === totalPages
        }
        onClick={() =>
          onChange(
            Math.min(
              totalPages,
              page + 1,
            ),
          )
        }
        className="ml-[32px] whitespace-nowrap text-[10px] uppercase leading-[16.5px] tracking-[1.32px] text-white disabled:opacity-30"
      >
        다음 &gt;
      </button>
    </nav>
  );
}

function FittingCardSkeleton() {
  return (
    <div className="h-[285px] w-[185px] animate-pulse overflow-hidden rounded-[8px] border-[0.7px] border-white/[0.07] bg-[#141414]">
      <div className="h-[180px] w-[184px] bg-white/[0.04]" />

      <div className="px-[10px] pt-[9px]">
        <div className="h-[9px] w-[38px] bg-white/[0.07]" />

        <div className="mt-[5px] h-[12px] w-[130px] bg-white/[0.07]" />

        <div className="mt-[6px] h-[10px] w-[70px] bg-white/[0.07]" />
      </div>
    </div>
  );
}

/* ==================================================== */
/* Icons                                                */
/* ==================================================== */

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