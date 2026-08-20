import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { getGarments } from '@/api/garment';

import ProductCard, {
  formatGarmentCategory,
} from '../components/ProductCard';
import HomeLogo from '@/components/common/HomeLogo';

const PAGE_SIZE = 12;
const MAX_VISIBLE_PAGES = 6;

type CategoryFilter =
  | 'all'
  | 'top'
  | 'bottom'
  | 'dress';

const Collections = () => {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('all');

  const [page, setPage] = useState(1);

  const {
    data: garments = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['garments'],
    queryFn: getGarments,
  });

  const filteredGarments = useMemo(() => {
    if (selectedCategory === 'all') {
      return garments;
    }

    return garments.filter((garment) => {
      const category = formatGarmentCategory(
        garment.category,
      );

      if (selectedCategory === 'top') {
        return category === '상의';
      }

      if (selectedCategory === 'bottom') {
        return category === '하의';
      }

      if (selectedCategory === 'dress') {
        return category === '원피스';
      }

      return true;
    });
  }, [garments, selectedCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredGarments.length / PAGE_SIZE,
    ),
  );

  const currentGarments = filteredGarments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const visiblePages = useMemo(() => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
    }

    const half = Math.floor(
      MAX_VISIBLE_PAGES / 2,
    );

    let start = Math.max(1, page - half);
    let end =
      start + MAX_VISIBLE_PAGES - 1;

    if (end > totalPages) {
      end = totalPages;
      start =
        totalPages - MAX_VISIBLE_PAGES + 1;
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index,
    );
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <main className="min-h-screen bg-[#090909]">
      <div className="mx-auto min-h-screen w-[402px] max-w-full overflow-hidden bg-[#090909] text-white">
        {/* Home과 동일한 상단 헤더 */}
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

        {/* 뒤로 / 모든 클로저 */}
        <div className="relative flex h-[47.9974px] w-full items-center justify-between border-b-[0.7144px] border-white/[0.07] bg-[rgba(9,9,9,0.90)] px-[20px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-center text-[13px] font-normal leading-[19.5px] text-[#C9A96E]"
            style={{
              fontFamily: 'Inter, sans-serif',
            }}
          >
            &lt; 뒤로
          </button>

          <h1
            className="absolute left-1/2 -translate-x-1/2 text-[14px] font-semibold leading-[21px] text-[#F0EBE2]"
            style={{
              fontFamily: 'Inter, sans-serif',
            }}
          >
            모든 클로저
          </h1>
        </div>

        {/* 카테고리 / 인기순 */}
        <div className="flex h-[63px] w-[396px] items-start justify-between pb-[12px] pl-[20px] pt-[20px]">
          <div className="flex items-center gap-[6px]">
            <FilterButton
              label="All"
              active={selectedCategory === 'all'}
              onClick={() =>
                setSelectedCategory('all')
              }
            />

            <FilterButton
              label="상의"
              active={selectedCategory === 'top'}
              onClick={() =>
                setSelectedCategory('top')
              }
            />

            <FilterButton
              label="하의"
              active={selectedCategory === 'bottom'}
              onClick={() =>
                setSelectedCategory('bottom')
              }
            />

            <FilterButton
              label="원피스"
              active={selectedCategory === 'dress'}
              onClick={() =>
                setSelectedCategory('dress')
              }
            />
          </div>

          <button
            type="button"
            disabled
            aria-label="인기순 정렬"
            className="flex h-[31px] items-center justify-center rounded-[20px] border-[0.7144px] border-white/[0.07] bg-transparent px-[14px] py-[6px] text-center text-[12px] font-normal leading-[18px] text-[#9A9490]"
            style={{
              fontFamily: 'Inter, sans-serif',
            }}
          >
            인기순
          </button>
        </div>

        {/* 상품 영역 */}
        <section>
          {isPending && (
            <div className="grid grid-cols-[185px_185px] auto-rows-[258px] gap-x-[12px] gap-y-[12px] px-[10px]">
              {Array.from({
                length: PAGE_SIZE,
              }).map((_, index) => (
                <ProductCardSkeleton
                  key={index}
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="mx-[10px] flex h-[258px] flex-col items-center justify-center rounded-[8px] border-[0.7144px] border-white/[0.07] bg-[#141414]">
              <p
                className="text-[12px] font-normal leading-[18px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                상품을 불러오지 못했습니다.
              </p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-[12px] text-[11px] font-medium leading-[16.5px] text-[#C9A96E]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                다시 시도
              </button>
            </div>
          )}

          {!isPending &&
            !isError &&
            currentGarments.length === 0 && (
              <div className="mx-[10px] flex h-[258px] items-center justify-center rounded-[8px] border-[0.7144px] border-white/[0.07] bg-[#141414]">
                <p
                  className="text-[12px] font-normal leading-[18px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  해당 카테고리에 등록된
                  상품이 없습니다.
                </p>
              </div>
            )}

          {!isPending &&
            !isError &&
            currentGarments.length > 0 && (
              <>
                <div className="grid grid-cols-[185px_185px] auto-rows-[258px] gap-x-[12px] gap-y-[12px] px-[10px]">
                  {currentGarments.map(
                    (garment) => (
                      <ProductCard
                        key={garment.garmentId}
                        garment={garment}
                      />
                    ),
                  )}
                </div>

                
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    visiblePages={visiblePages}
                    onChange={setPage}
                />
                
              </>
            )}
        </section>

        <div className="h-[80px]" />
      </div>
    </main>
  );
};

export default Collections;

type FilterButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterButton({
  label,
  active,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex h-[31px] items-center justify-center rounded-[20px] border-[0.714px] px-[14px] py-[6px]',
        'text-center text-[12px] leading-[18px]',
        active
          ? 'border-[#C9A96E] bg-[#C9A96E] font-semibold text-[#0D0A05]'
          : 'border-white/[0.07] bg-transparent font-normal text-[#9A9490]',
      ].join(' ')}
      style={{
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {label}
    </button>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  visiblePages: number[];
  onChange: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  visiblePages,
  onChange,
}: PaginationProps) {
  return (
    <nav
      aria-label="상품 페이지"
      className="mx-auto mt-[32px] flex h-[17px] w-fit items-center"
    >
      <button
        type="button"
        disabled={page === 1}
        onClick={() =>
          onChange(Math.max(1, page - 1))
        }
        className="whitespace-nowrap text-[10px] font-normal uppercase leading-[16.5px] tracking-[1.32px] text-white"
        style={{
          fontFamily: 'Inter, sans-serif',
        }}
      >
        &lt; 이전
      </button>

      <div className="ml-[32px] flex h-[17px] items-center gap-[15px]">
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() =>
              onChange(pageNumber)
            }
            aria-current={
              page === pageNumber
                ? 'page'
                : undefined
            }
            className={[
              'flex h-[17px] w-[6px] flex-col items-center justify-center text-[10px] font-normal leading-[17px]',
              page === pageNumber
                ? 'text-[#C9A96E]'
                : 'text-white',
            ].join(' ')}
            style={{
              fontFamily:
                'Inter, sans-serif',
            }}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={page === totalPages}
        onClick={() =>
          onChange(
            Math.min(totalPages, page + 1),
          )
        }
        className="ml-[32px] whitespace-nowrap text-[10px] font-normal uppercase leading-[16.5px] tracking-[1.32px] text-white"
        style={{
          fontFamily: 'Inter, sans-serif',
        }}
      >
        다음 &gt;
      </button>
    </nav>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="h-[258px] w-[185px] animate-pulse overflow-hidden rounded-[8px] border-[0.7144px] border-white/[0.07] bg-[#141414]">
      <div className="h-[181px] w-[184px] bg-white/[0.04]" />

      <div className="px-[10px] pb-[12px] pt-[10px]">
        <div className="h-[9px] w-[38px] bg-white/[0.07]" />
        <div className="mt-[3px] h-[12px] w-[130px] bg-white/[0.07]" />
        <div className="mt-[6px] h-[11px] w-[70px] bg-white/[0.07]" />
      </div>
    </div>
  );
}

function BellIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.8657 20.5005C13.1418 20.0223 13.7527 19.8584 14.2309 20.1343C14.709 20.4104 14.8729 21.0213 14.5971 21.4995C14.3338 21.9555 13.9544 22.3349 13.4985 22.5981C13.0426 22.861 12.5248 22.9995 11.9985 22.9995C11.4723 22.9993 10.9542 22.8612 10.4985 22.5981C10.0428 22.3349 9.66448 21.9552 9.40132 21.4995C9.12561 21.0215 9.28971 20.4105 9.76753 20.1343C10.2457 19.8584 10.8566 20.0224 11.1328 20.5005C11.2204 20.6521 11.3474 20.7775 11.499 20.8653C11.6507 20.9527 11.8233 20.9998 11.9985 21C12.1739 21 12.3475 20.9529 12.4995 20.8653C12.6511 20.7775 12.778 20.6521 12.8657 20.5005ZM12.0014 0.999023C13.8575 0.999304 15.6387 1.73734 16.9512 3.0498C18.2635 4.36242 19.0003 6.14334 19.0005 7.99951C19.0005 10.1442 19.3374 11.4784 19.7769 12.4087C20.1072 13.1078 20.5132 13.6215 20.9766 14.124L21.4585 14.6309L21.4804 14.6528C21.7413 14.9394 21.9135 15.2973 21.9756 15.6797C22.0375 16.0619 21.9871 16.455 21.8305 16.8092C21.6738 17.1633 21.4168 17.4649 21.0922 17.6763C20.7676 17.8875 20.3881 18 20.001 18H4.00044C3.61305 17.9997 3.23362 17.8863 2.90913 17.6748C2.5845 17.463 2.32723 17.1609 2.17086 16.8061C2.0147 16.4517 1.9648 16.059 2.02729 15.6768C2.08996 15.2944 2.26272 14.9376 2.52388 14.6514L2.54438 14.6294C3.20863 13.9436 3.78414 13.341 4.22457 12.4087C4.6639 11.4784 5.00092 10.1439 5.00092 7.99951C5.00106 6.14334 5.73783 4.36242 7.05025 3.0498C8.36296 1.7373 10.1451 0.999023 12.0014 0.999023ZM12.0014 3C10.6757 3 9.40289 3.52617 8.46528 4.46338C7.52772 5.40096 7.00056 6.67359 7.00044 7.99951C7.00044 10.3533 6.63121 11.9973 6.03364 13.2627C5.44344 14.5121 4.65996 15.3198 4.0019 15.999H20.001C19.3413 15.3192 18.558 14.5118 17.9677 13.2627C17.37 11.9971 17.001 10.3532 17.001 7.99951C17.0008 6.67359 16.4737 5.40096 15.5361 4.46338C14.5987 3.52621 13.3269 3.00028 12.0014 3Z"
        fill="currentColor"
      />
    </svg>
  );
}