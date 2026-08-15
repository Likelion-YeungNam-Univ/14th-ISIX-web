import { useState } from 'react';

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
  const [imageFailed, setImageFailed] =
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
    <article className="flex h-[258px] w-[185px] flex-col items-start overflow-hidden rounded-[8px] border-[0.714px] border-white/[0.07] bg-[#141414]">
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

        {/* 이미지 하단 그라데이션 */}
        <div
          className="pointer-events-none absolute bottom-[-1px] left-0 h-[181px] w-[184px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 38.12%, rgba(0, 0, 0, 0.80) 139.78%)',
          }}
        />

        {/* 3D 배지 */}
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
            fontFamily: 'Inter, sans-serif',
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
    </article>
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