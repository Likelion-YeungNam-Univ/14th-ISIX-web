import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { getGarments } from '@/api/garment';
import VoiceAssistant from '@/components/voice/VoiceAssistant';

import HeroCarousel from './components/HeroCarousel';
import ProductCard, {
  formatGarmentCategory,
} from './components/ProductCard';

type CollectionFilter = 'all' | 'top' | 'bottom';

const Home = () => {
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] =
    useState<CollectionFilter>('all');

  const {
    data: garments = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['garments'],
    queryFn: getGarments,
  });

  const filteredGarments = garments.filter((garment) => {
    if (selectedFilter === 'all') {
      return true;
    }

    const category = formatGarmentCategory(
      garment.category,
    );

    if (selectedFilter === 'top') {
      return category === '상의';
    }

    return category === '하의';
  });

  const previewGarments = filteredGarments.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#080808]">
      <div className="mx-auto min-h-screen w-[402px] max-w-full overflow-hidden bg-[#080808] text-white">
        <header className="flex h-[46px] items-center justify-between border-b border-white/10 bg-[#080808] px-[14px]">
          <span
            className="text-[20px] font-normal leading-[30px] tracking-[1.2px] text-[#F0EBE2] "
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

        <HeroCarousel />

        <section
          id="home-collections"
          className="scroll-mt-4 bg-[#080808]"
        >
          {/* 모든 클로저 / 전체보기 */}
          <div className="flex h-[37px] items-center justify-between px-[20px] pt-[25px]">
            <h2
              className="text-[15px] font-semibold uppercase leading-[16.5px] tracking-[1.32px] text-[#9A9490]"
              style={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              모든 클로저
            </h2>

            <button
              type="button"
              onClick={() =>
                navigate('/home/collections')
              }
              className="w-fit text-center text-[11px] font-medium leading-[16.5px] text-[#E4B662]"
              style={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              전체보기 &gt;
            </button>
          </div>

          {/* All / 상의 / 하의 */}
          <div className="flex h-[63px] w-[396px] items-start gap-[6px] pb-[12px] pl-[20px] pt-[20px]">
            <FilterButton
              label="All"
              active={selectedFilter === 'all'}
              onClick={() =>
                setSelectedFilter('all')
              }
            />

            <FilterButton
              label="상의"
              active={selectedFilter === 'top'}
              onClick={() =>
                setSelectedFilter('top')
              }
            />

            <FilterButton
              label="하의"
              active={selectedFilter === 'bottom'}
              onClick={() =>
                setSelectedFilter('bottom')
              }
            />
          </div>

          {/* 상품 Grid */}
          <div className="grid h-[529px] grid-cols-[185px_185px] grid-rows-[257.97px_257.97px] gap-x-[12px] gap-y-[12px] px-[10px]">
            {isPending &&
              Array.from({ length: 4 }).map(
                (_, index) => (
                  <ProductCardSkeleton
                    key={index}
                  />
                ),
              )}

            {isError && (
              <div className="col-span-2 flex h-[258px] flex-col items-center justify-center rounded-[8px] border-[0.714px] border-white/[0.07] bg-[#141414]">
                <p
                  className="text-[12px] font-normal leading-[18px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  의류 목록을 불러오지 못했습니다.
                </p>

                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-[12px] text-[11px] font-medium leading-[16.5px] text-[#E4B662]"
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
              previewGarments.length === 0 && (
                <div className="col-span-2 flex h-[258px] items-center justify-center rounded-[8px] border-[0.714px] border-white/[0.07] bg-[#141414]">
                  <p
                    className="text-[12px] font-normal leading-[18px] text-[#9A9490]"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    현재 등록된 의류가 없습니다.
                  </p>
                </div>
              )}

            {!isPending &&
              !isError &&
              previewGarments.map((garment) => (
                <ProductCard
                  key={garment.garmentId}
                  garment={garment}
                />
              ))}
          </div>
        </section>

                  {/* 상품 영역과 브랜드 소개 사이 여백 */}
          <div className="h-[72px] bg-[#090909]" />

          {/* 브랜드 소개 */}
          <section className="relative h-[768px] w-full bg-[#090909] text-[#F0EBE2]">
            {/* 메인 타이틀 */}
            <h2
              className="absolute bottom-[688px] left-[47px] m-0 text-[22px] font-bold leading-[30px] tracking-[1.2px] text-[#F0EBE2]"
              style={{
                fontFamily: '"DM Serif Display", serif',
              }}
            >
              CLOSER TO PERFECTION,
              <br />
              CLOSER TO EARTH
            </h2>

            {/* 숲 이미지 */}
            <img
              src="/images/home/story-nature.jpg"
              alt=""
              className="absolute bottom-[478px] right-[10px] h-[193px] w-[289px] object-cover"
            />

            {/* 더 가까이 */}
            <h3
              className="absolute bottom-[430px] left-[11px] m-0 text-[15px] font-bold leading-[28.8px] text-[#F0EBE2]"
              style={{
                fontFamily: 'Pretendard, sans-serif',
              }}
            >
              더 가까이,
            </h3>

            {/* 첫 번째 설명 */}
            <p
              className="absolute bottom-[401px] left-[11px] m-0 w-[348px] text-[11px] font-medium leading-[28.8px] text-[#F0EBE2]"
              style={{
                fontFamily: 'Pretendard, sans-serif',
              }}
            >
              완벽한 핏으로 당신에게, 책임 있는 실천으로 지구에게 다가갑니다.
            </p>

            {/* 두 번째 설명 */}
            <p
              className="absolute bottom-[330px] left-[11px] m-0 w-[348px] text-[10px] font-medium leading-[20px] text-[#F0EBE2]"
              style={{
                fontFamily: '"DM Serif Display", serif',
              }}
            >
              온라인 의류 반품률 30%, 그중 70%는 맞지 않는 핏 때문입니다.
              CLOSR는 반품으로 인한 자원 낭비의 악순환을 끊어내고,
              내 손안의 3D 아틀리에를 통해 온라인에서도 타협 없는 1:1 럭셔리 핏을 완성합니다.
            </p>

            {/* 지구 이미지 */}
            <img
              src="/images/home/story-earth.jpg"
              alt=""
              className="absolute left-[11px] top-[465px] h-[143.5px] w-[256px] object-cover"
            />

            {/* 기능명 */}
            <p
              className="
                absolute
                left-[292px]
                top-[495px]
                m-0
                w-[96px]
                text-left
                text-[10px]
                font-normal
                leading-[20px]
                text-[#F0EBE2]
              "
              style={{
                fontFamily: '"DM Serif Display", serif',
              }}
            >
              <span className="whitespace-nowrap">
                3D Digital Twin
              </span>
              <br />
              <span className="whitespace-nowrap">
                Fit Heatmap &amp; Report
              </span>
              <br />
              <span className="whitespace-nowrap">
                Sustainable Luxury
              </span>
            </p>

            {/* 기능 설명 */}
            <div
              className="
                absolute
                left-[204px]
                top-[566px]
                w-[189px]
                text-left
                text-[9px]
                font-normal
                leading-[20px]
                tracking-[-0.2px]
                text-[#F0EBE2]
              "
              style={{
                fontFamily: 'Pretendard, sans-serif',
              }}
            >
              <p className="m-0 whitespace-nowrap">
                사진 한 장으로 구현하는 나만의 정밀 3D 체형 복원
              </p>

              <p className="m-0 whitespace-nowrap">
                360도 시각적 데이터로 1초 만에 확인하는 완벽한 핏
              </p>

              <p className="m-0 whitespace-nowrap">
                실패 없는 주문으로 지구 환경을 지키는 책임 있는 쇼핑
              </p>
            </div>

            {/* 브랜드 스토리 CTA */}
            <button
              type="button"
              onClick={() => navigate('/brand-story')}
              aria-label="CLOSR 브랜드 스토리 자세히 보기"
              className="
                absolute
                bottom-[104px]
                left-1/2
                flex
                h-[22px]
                w-[165px]
                -translate-x-1/2
                items-center
                whitespace-nowrap
                text-[#F0EBE2]
              "
            >
              <span
                className="text-[8px] font-normal leading-[20px]"
                style={{
                  fontFamily: '"DM Serif Display", serif',
                }}
              >
                CLOSR
              </span>

              <span
                className="ml-[4px] text-[10px] font-normal leading-[20px]"
                style={{
                  fontFamily: 'Pretendard, sans-serif',
                }}
              >
                브랜드 스토리 자세히 보기
              </span>

              <span
                aria-hidden="true"
                className="ml-auto pl-[8px] pb-[3px] text-[16px] font-light leading-none"
              >
                →
              </span>
            </button>
          </section>
      </div>

      <VoiceAssistant mode="onboarding" />
    </main>
  );
};

export default Home;

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
          ? 'border-[#E4B662] bg-[#E4B662] font-semibold text-[#0D0A05]'
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

function ProductCardSkeleton() {
  return (
    <div className="h-[258px] w-[185px] animate-pulse overflow-hidden rounded-[8px] border-[0.714px] border-white/[0.07] bg-[#141414]">
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