import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { getGarmentDetail } from '@/api/garment';
import { getMyAvatars } from '@/api/avatar';
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

const SKIP_AVATAR_PICKER_KEY ='closr_skip_avatar_picker_date';

const getTodayString = () => new Date().toISOString().slice(0,10);

const formatAvatarDate = (iso?: string | null) => {
  if(!iso) return '';

  const date = new Date(iso);
  if(Number.isNaN(date.getTime())) return '';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

const ProductCard = ({ garment }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [imageFailed, setImageFailed] =
    useState(false);

  const [isActionOpen, setIsActionOpen] =
    useState(false);

  const [showAvatarGuide, setShowAvatarGuide] =
    useState(false);
  /* 아바타 선택 팝업 관련 상태
    avatarPickerOpen : 팝업 노출 여부
    selectedAvatarId : 팝업에서 사용자가 고른 아바타
    null 이면 아바타 선택하기 버튼 비활성화
  */
  const [avatarPickerOpen, setAvatarPickerOpen] =
    useState(false);

  const [selectedAvatarId, setSelectedAvatarId] = 
    useState<number | null>(null)

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
  /* 아바타 목록 ( 입어보기 분기 )                              */
  /* ================================================== */

  const { data : avatars = [] } = useQuery({
    queryKey: ['my-avatars'],
    queryFn: getMyAvatars,
    enabled: isActionOpen,
  });

  const selectableAvatars = avatars.filter(
    (avatar) =>
      avatar.status === 'done' &&
      avatar.avatarId != null,
  );

  const handleTryOnClick = () => {
    if(selectableAvatars.length === 0) {
      setShowAvatarGuide(true);
      return;
    }

    if(selectableAvatars.length === 1){
      navigate('/fitting', {
        state: {
          garmentId: garment.garmentId,
          avatarId: selectableAvatars[0].avatarId,
        },
      });
      return;
    }

    const skippedDate = localStorage.getItem(
      SKIP_AVATAR_PICKER_KEY,
    );

    if(skippedDate === getTodayString()){
      const latest = 
      selectableAvatars[
        selectableAvatars.length -1
      ];

      navigate('/fitting', {
        state : {
          garmentId: garment.garmentId,
          avatarId: latest.avatarId,
        },
      });
      return;
    }

    setIsActionOpen(false);
    setSelectedAvatarId(null);
    setAvatarPickerOpen(true);
  };

  const handleConfirmAvatarPick = () => {
    if(selectedAvatarId == null) return;

    navigate('/fitting', {
      state: {
        garmentId: garment.garmentId,
        avatarId: selectedAvatarId,
      },
    });

    setAvatarPickerOpen(false);
  };

  /* 팝업에서 오늘 하루 묻지 않기를 눌렀을 때 */
  const handleSkipAvatarPickerToday = () => {
    localStorage.setItem(
      SKIP_AVATAR_PICKER_KEY,
      getTodayString(),
    );

    const fallbackId = 
      selectedAvatarId ??
      selectableAvatars[
        selectableAvatars.length - 1
      ]?.avatarId;

    if(fallbackId != null){
      navigate('/fitting', {
        state: {
          garmentId: garment.garmentId,
          avatarId: fallbackId,
        },
      });
    }
    setAvatarPickerOpen(false);
  };

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
              
              {showAvatarGuide ? (
                <div className="mt-6 rounded-[12px] border border-[#C9A96E]/30 bg-[#1A1A1A] px-4 py-5 text-center">
                  <p className="text-[15px] font-medium text-[#F0EBE2]">
                    피팅을 위해 먼저 아바타를 생성해야 합니다.
                  </p>

                  <p className="mt-2 text-[12px] leading-[18px] text-[#9A9490]">
                    피팅을 시작하려면
                    <br/>
                    먼저 나만의 아바타를 생성해주세요.
                  </p>

                  <button
                    type="button"
                    onClick={()=>navigate('/avatar')}
                    className="mt-4 h-11 w-full rounded-[10px] bg-[#C9A96E] text-[13px] font-semibold text-[#141414]"
                  >
                    아바타 만들기
                  </button>
                </div>
              ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                type="button"
                onClick={handleTryOnClick}
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
              )}
            </section>
          </div>,
          document.body,
        )}

        {/* 아바타 선택 팝업 - 아바타 2개 이상일 때만 노출 */}
      {avatarPickerOpen && createPortal(
        <div
            className="fixed inset-0 z-[110] flex items-end bg-black/60"
            onClick={()=> setAvatarPickerOpen(false)}>
          <section
            role="dialog"
            aira-model="ture"
            aria-label="아바타 선택하기"
            className="w-full rounded-t-[24px] border-t border-white/10 bg-[#141414] px-5 pb-8 pt-4"
            onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20"/>

              <h2 className="text-center text-[17px] text-[#F0EBE2]"
                style={{
                  fontFamily:
                  '"DM Serif Display"',
                }}>
                아바타 선택하기
              </h2>

              <p className="mt-2 text-center text-[12px] text-[#9A9490]"
                style={{
                    fontFamily:
                      'Inter, sans-serif',
                }}>
                선택한 옷을 입어보기 위한 아바타를 선택해주세요
              </p>

              <div className="mt-5 flex gap-[10px] overflow-x-auto pb-1">
                {selectableAvatars.map((avatar, index) => {
                  const isSelcted = avatar.avatarId === selectedAvatarId;
                    return (
                      <button
                      key={avatar.avatarId}
                      type="button"
                      onClick={()=> setSelectedAvatarId(avatar.avatarId)}
                      className={['flex h-[110px] w-[92px] shrink-0 flex-col items-center justify-center gap-1 rounded-[12px] border px-2 text-center transition', 
                        isSelcted 
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                          : 'border-[#303030] bg-[#141414]',
                      ].join(' ')}>
                        <AvatarIcon
                          className={[
                            'h-7 w-6',
                            isSelcted ? 'text-[#C9A96E]' : 'text-[#5C5850]', 
                          ].join(' ')}
                        />

                        <span 
                          className={[
                            'text-[11px] font-medium',
                            isSelcted ? 'text-[#C9A96E]' : 'text-[#303030]',
                          ].join(' ')}>
                            아바타 {index + 1}
                          </span>

                          <span className="text-[9px] text-[#4A4A4A]">
                            {formatAvatarDate(avatar.createdAt)}
                          </span>
                      </button>
                    );
                })}
              </div>

              <button
                type="button"
                disabled={selectedAvatarId == null}
                onClick={handleConfirmAvatarPick}
                className={[
                  'mt-5 h-12 w-full rounded-[10px] text-[14px] font-semibold transition',
                  selectedAvatarId == null
                  ? 'cursor-not-allowed bg-white/[0.08] text-[#6E6A65]'
                  : 'bg-[#E4B662] text-[#0D0A05]',
                ].join(' ')}>
                이 아바타 선택하기
              </button>

              <button
              type="button"
              onClick={handleSkipAvatarPickerToday}
              className="mt-3 w-full text-center text-[11px] text-[#6E6A65] underline underline-offset-2"
              >
                오늘 하루 묻지 않기
              </button>
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

function AvatarIcon({
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
        d="M15 3.75C15 3.15666 14.8241 2.57664 14.4944 2.08329C14.1648 1.58994 13.6962 1.20543 13.148 0.978363C12.5999 0.7513 11.9967 0.69189 11.4147 0.807646C10.8328 0.923401 10.2982 1.20912 9.87868 1.62868C9.45912 2.04824 9.1734 2.58279 9.05764 3.16473C8.94189 3.74667 9.0013 4.34987 9.22836 4.89805C9.45542 5.44623 9.83994 5.91477 10.3333 6.24441C10.8266 6.57405 11.4067 6.75 12 6.75C12.7956 6.75 13.5587 6.43393 14.1213 5.87132C14.6839 5.30871 15 4.54565 15 3.75ZM12 5.25C11.7033 5.25 11.4133 5.16203 11.1666 4.99721C10.92 4.83238 10.7277 4.59812 10.6142 4.32403C10.5006 4.04994 10.4709 3.74834 10.5288 3.45737C10.5867 3.16639 10.7296 2.89912 10.9393 2.68934C11.1491 2.47956 11.4164 2.3367 11.7074 2.27882C11.9983 2.22095 12.2999 2.25065 12.574 2.36418C12.8481 2.47771 13.0824 2.66997 13.2472 2.91665C13.412 3.16332 13.5 3.45333 13.5 3.75C13.5 4.14783 13.342 4.52936 13.0607 4.81066C12.7794 5.09197 12.3978 5.25 12 5.25ZM20.4694 12.5672L16.2347 7.76531C15.9531 7.44616 15.6069 7.19057 15.219 7.01552C14.831 6.84046 14.4103 6.74996 13.9847 6.75H10.0153C9.58971 6.74996 9.16898 6.84046 8.78105 7.01552C8.39312 7.19057 8.04687 7.44616 7.76531 7.76531L3.53063 12.5672C3.18673 12.9189 2.99482 13.3917 2.99629 13.8836C2.99775 14.3755 3.19246 14.8471 3.53844 15.1968C3.88442 15.5465 4.35396 15.7462 4.84582 15.7528C5.33768 15.7595 5.81246 15.5726 6.16781 15.2325L7.69594 14.0063L6.14531 19.9013C5.93994 20.3544 5.92298 20.8706 6.09818 21.3362C6.27338 21.8019 6.62638 22.1788 7.07953 22.3842C7.53268 22.5896 8.04885 22.6066 8.5145 22.4314C8.98015 22.2562 9.35712 21.9032 9.5625 21.45L12 17.2434L14.4375 21.45C14.6521 21.8879 15.0288 22.2251 15.4878 22.3898C15.9468 22.5546 16.4519 22.5341 16.896 22.3326C17.3401 22.1311 17.6882 21.7645 17.8665 21.3106C18.0448 20.8566 18.0392 20.3511 17.8509 19.9013L16.3041 14.0063L17.8322 15.2325C18.1875 15.5726 18.6623 15.7595 19.1542 15.7528C19.646 15.7462 20.1156 15.5465 20.4616 15.1968C20.8075 14.8471 21.0023 14.3755 21.0037 13.8836C21.0052 13.3917 20.8133 12.9189 20.4694 12.5672Z"
        fill="currentColor"
      />
    </svg>
  );
}