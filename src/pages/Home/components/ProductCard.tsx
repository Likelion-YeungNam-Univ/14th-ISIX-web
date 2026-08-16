import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import type { Garment } from '@/types/garment';

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
  };

  return labels[normalized] ?? category;
};

const ProductCard = ({ garment }: Props) => {
  const navigate = useNavigate();

  const [imageFailed, setImageFailed] =
    useState(false);

  const [isActionOpen, setIsActionOpen] =
    useState(false);

  const showImage =
    Boolean(garment.thumbnailUrl) &&
    !imageFailed;

  const category =
    formatGarmentCategory(garment.category);

  const sizeText =
    garment.sizes.length > 0
      ? garment.sizes
          .map((size) => size.toUpperCase())
          .join(' · ')
      : '';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsActionOpen(true)}
        className="flex h-[258px] w-[185px] flex-col items-start overflow-hidden rounded-[8px] border-[0.714px] border-white/[0.07] bg-[#141414] text-left"
      >
        {/* 상품 이미지 */}
        <div className="relative h-[181px] w-[184px] shrink-0 overflow-hidden bg-[#eeeeeb]">
          {showImage ? (
            <img
              src={garment.thumbnailUrl ?? ''}
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

          <span
            className="absolute right-[14.35px] top-[11px] flex h-[14.8457px] w-[25.6507px] items-center justify-center rounded-[2px] border-[0.714px] border-[rgba(201,169,110,0.28)] bg-[rgba(201,169,110,0.12)] text-center text-[9px] font-medium leading-[13.5px] tracking-[0.72px] text-[#C9A96E]"
            style={{
              fontFamily:
                '"DM Mono", monospace',
            }}
          >
            3D
          </span>
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
                    navigate('/fitting', {
                      state: {
                        garmentId: garment.garmentId,
                      },
                    })
                  }
                  className="h-12 rounded-[10px] border border-[#C9A96E] text-sm font-medium text-[#C9A96E]"
                >
                  입어보기
                </button>

                <button
                  type="button"
                  disabled
                  className="h-12 cursor-not-allowed rounded-[10px] bg-[#C9A96E] text-sm font-medium text-[#141414] opacity-50"
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