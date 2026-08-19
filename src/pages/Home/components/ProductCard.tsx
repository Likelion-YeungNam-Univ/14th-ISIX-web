import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { getGarmentDetail } from '@/api/garment';
import {
  getMyLikes,
  likeGarment,
  unlikeGarment,
} from '@/api/like';

import type { Garment } from '@/types/garment';
import type { LikedGarment } from '@/types/like';

type Props = {
  garment: Garment;
};

export const formatGarmentCategory = (
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

const ProductCard = ({ garment }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [imageFailed, setImageFailed] =
    useState(false);

  const [isActionOpen, setIsActionOpen] =
    useState(false);

  /* ================================================== */
  /* 찜 상태                                             */
  /* ================================================== */

  const { data: likes = [] } = useQuery({
    queryKey: ['my-likes'],
    queryFn: getMyLikes,
  });

  const isLiked = likes.some(
    (likedGarment) =>
      likedGarment.garmentId ===
      garment.garmentId,
  );

  const likeMutation = useMutation({
    mutationFn: () => {
      if (isLiked) {
        return unlikeGarment(
          garment.garmentId,
        );
      }

      return likeGarment(
        garment.garmentId,
      );
    },

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['my-likes'],
      });

      const previousLikes =
        queryClient.getQueryData<
          LikedGarment[]
        >(['my-likes']) ?? [];

      if (isLiked) {
        queryClient.setQueryData<
          LikedGarment[]
        >(
          ['my-likes'],
          previousLikes.filter(
            (likedGarment) =>
              likedGarment.garmentId !==
              garment.garmentId,
          ),
        );
      } else {
        const newLike: LikedGarment = {
          garmentId:
            garment.garmentId,
          name:
            garment.name,
          category:
            garment.category,
          thumbnailUrl:
            garment.thumbnailUrl,
          likedAt:
            new Date().toISOString(),
        };

        queryClient.setQueryData<
          LikedGarment[]
        >(
          ['my-likes'],
          [
            newLike,
            ...previousLikes,
          ],
        );
      }

      return {
        previousLikes,
      };
    },

    onError: (
      _error,
      _variables,
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

  /* ================================================== */
  /* 의류 상세 / 구매 링크                              */
  /* ================================================== */

  const {
    data: garmentDetail,
    isLoading: isGarmentDetailLoading,
  } = useQuery({
    queryKey: [
      'garment-detail',
      garment.garmentId,
    ],
    queryFn: () =>
      getGarmentDetail(
        garment.garmentId,
      ),
    enabled: isActionOpen,
  });

  /* ================================================== */
  /* 카드 정보                                           */
  /* ================================================== */

  const showImage =
    Boolean(garment.thumbnailUrl) &&
    !imageFailed;

  const category =
    formatGarmentCategory(
      garment.category,
    );

  const sizeText =
    garment.sizes.length > 0
      ? garment.sizes
          .map((size) =>
            size.toUpperCase(),
          )
          .join(' · ')
      : '';

  return (
    <>
      <article className="relative h-[258px] w-[185px] overflow-hidden border-[0.714px] border-white/[0.07] bg-[#141414]">
        {/* 상품 카드 클릭 영역 */}
        <button
          type="button"
          onClick={() =>
            setIsActionOpen(true)
          }
          className="flex h-full w-full flex-col items-start text-left"
        >
          {/* 상품 이미지 */}
          <div className="relative h-[181px] w-[184px] shrink-0 overflow-hidden bg-[#eeeeeb]">
            {showImage ? (
              <img
                src={
                  garment.thumbnailUrl ??
                  ''
                }
                alt={garment.name}
                loading="lazy"
                className="h-full w-full object-cover"
                onError={() =>
                  setImageFailed(true)
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#9A9490]">
                <GarmentPlaceholderIcon className="h-16 w-16" />
              </div>
            )}

            <div
              className="pointer-events-none absolute bottom-[-1px] left-0 h-[181px] w-[184px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 38.12%, rgba(0, 0, 0, 0.80) 139.78%)',
              }}
            />
          </div>

          {/* 상품 정보 */}
          <div className="w-full px-[10px] pb-[12px] pt-[10px]">
            <p
              className="text-[9px] font-normal uppercase leading-[13.5px] tracking-[0.9px] text-[#C9A96E]"
              style={{
                fontFamily:
                  '"DM Mono", monospace',
              }}
            >
              {category}
            </p>

            <h3
              className="mt-[3px] truncate text-[12px] font-medium leading-[15.6px] text-[#F0EBE2]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {garment.name}
            </h3>

            {sizeText && (
              <p
                className="mt-[6px] truncate text-[11px] font-normal leading-[16.5px] text-[#9A9490]"
                style={{
                  fontFamily:
                    '"DM Mono", monospace',
                }}
              >
                {sizeText}
              </p>
            )}
          </div>
        </button>

        {/* 찜 버튼 */}
        <button
          type="button"
          aria-label={
            isLiked
              ? `${garment.name} 찜 취소`
              : `${garment.name} 찜하기`
          }
          aria-pressed={isLiked}
          disabled={
            likeMutation.isPending
          }
          onClick={() =>
            likeMutation.mutate()
          }
          className={[
            'absolute right-[14px] top-[11px] z-10 flex h-[25px] w-[25px] items-center justify-center',
            isLiked
              ? 'text-[#F87171]'
              : 'text-[#B1B1B1]',
            likeMutation.isPending
              ? 'opacity-60'
              : '',
          ].join(' ')}
        >
          <HeartIcon className="h-[25px] w-[25px]" />
        </button>
      </article>

      {/* 상품 액션 바텀시트 */}
      {isActionOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end bg-black/60"
            onClick={() =>
              setIsActionOpen(false)
            }
          >
            <section
              className="w-full rounded-t-[24px] border-t border-white/10 bg-[#141414] px-5 pb-8 pt-4"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[8px] bg-[#eeeeeb]">
                  {showImage ? (
                    <img
                      src={
                        garment.thumbnailUrl ??
                        ''
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#9A9490]">
                      <GarmentPlaceholderIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[1px] text-[#C9A96E]">
                    {category}
                  </p>

                  <h2 className="mt-1 truncate text-[16px] font-medium text-[#F0EBE2]">
                    {garment.name}
                  </h2>

                  {sizeText && (
                    <p className="mt-2 text-[12px] text-[#9A9490]">
                      {sizeText}
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
                            garment.garmentId,
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
                    isGarmentDetailLoading ||
                    !garmentDetail
                      ?.purchaseUrl
                  }
                  onClick={() => {
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
                    'h-12 rounded-[10px] bg-[#C9A96E] text-sm font-medium text-[#141414]',
                    isGarmentDetailLoading ||
                    !garmentDetail
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
    </>
  );
};

export default ProductCard;

/* ==================================================== */
/* ICONS                                                */
/* ==================================================== */

function GarmentPlaceholderIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
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

function HeartIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
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