import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { getMyFittings } from '@/api/fitting';
import { getGarments } from '@/api/garment';

const PAGE_SIZE = 12;
const MAX_VISIBLE_PAGES = 6;

const MyFittings = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);

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

  return (
    <main className="min-h-[100dvh] bg-[#090909] text-[#F0EBE2]">
      <div className="mx-auto min-h-[100dvh] w-[402px] max-w-full overflow-x-hidden bg-[#090909]">
        {/* Home / MY와 동일한 Header */}
        <header className="flex h-[46px] items-center justify-between border-b border-white/10 bg-[#080808] px-[14px]">
          <span
            className="text-[20px] font-bold leading-[30px] tracking-[1.2px] text-[#F0EBE2]"
            style={{
              fontFamily:
                '"DM Serif Display", serif',
            }}
          >
            CLOSR
          </span>

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

        {/* 개수 */}
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

          <span
            className="text-[10px] font-normal leading-[15px] text-[#C9A96E]"
            style={{
              fontFamily:
                '"DM Mono", monospace',
            }}
          >
            {fittings.length}개
          </span>
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
  onRetry: () => void;
};

function FittingCard({
  fitting,
  thumbnailUrl,
  onRetry,
}: FittingCardProps) {
  return (
    <article className="h-[285px] w-[185px] overflow-hidden rounded-[8px] border-[0.7px] border-white/[0.07] bg-[#141414]">
      {/* Image */}
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
            onClick={onRetry}
            className="flex h-[31px] w-[82px] items-center justify-center gap-[3px] rounded-[4px] bg-[#C9A96E] text-[#0D0A05]"
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