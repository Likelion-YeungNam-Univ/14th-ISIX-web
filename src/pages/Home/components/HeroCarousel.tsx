import {
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from 'react';

const AUTOPLAY_DELAY = 5000;

const heroSlides = [
  {
    id: 1,
    image: '/images/home/hero-1.jpg',
    tag: 'MCM GOTS TAG',
    title: '인증된 유기농 섬유를 사용한\nMCM 옷들을 만나보세요',
    description:
      '3D 가상 피팅',
  },
  {
    id: 2,
    image: '/images/home/hero-2.jpg',
    tag: 'MCM EDITION',
    title: 'MCM 디스코 비세토스를\n소개합니다',
    description:
      '디스코 에디션 구경하러가기',
  },
  {
    id: 3,
    image: '/images/home/hero-3.jpg',
    tag: 'MCM EDITION',
    title: 'MCM과 함께하는 하루:\n시티 스타일 가이드',
    description:
      '밀라도 에디션 입어보기',
  },
  {
    id: 4,
    image: '/images/home/hero-4.jpg',
    tag: 'NEW',
    title: 'MCM\n신상 입어보기',
    description:
      '모래시계형 체형 맞춤 추천 · 3D 가상 피팅',
  },
];

const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) => (current + 1) % heroSlides.length,
      );
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, []);

  const move = (direction: number) => {
    setActiveIndex((current) => {
      const next = current + direction;

      if (next < 0) {
        return heroSlides.length - 1;
      }

      return next % heroSlides.length;
    });
  };

  const handleTouchStart = (
    event: TouchEvent<HTMLElement>,
  ) => {
    touchStartX.current =
      event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (
    event: TouchEvent<HTMLElement>,
  ) => {
    if (touchStartX.current === null) {
      return;
    }

    const endX =
      event.changedTouches[0]?.clientX;

    if (endX === undefined) {
      return;
    }

    const diff = endX - touchStartX.current;

    if (Math.abs(diff) > 45) {
      move(diff > 0 ? -1 : 1);
    }

    touchStartX.current = null;
  };

  const scrollToCollections = () => {
    document
      .getElementById('home-collections')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  };

  const activeSlide = heroSlides[activeIndex];

  return (
    <section
      className="relative isolate h-[480px] w-full overflow-hidden bg-[#080808]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="CLOSR 메인 배너"
    >
      {/* 배너 이미지 */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={[
            'absolute inset-0 bg-cover bg-top transition-opacity duration-700',
            index === activeIndex
              ? 'opacity-100'
              : 'pointer-events-none opacity-0',
          ].join(' ')}
          style={{
            backgroundImage: `url("${slide.image}")`,
          }}
        />
      ))}

      {/* 이미지 하단 그라데이션 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(9,9,9,0) 10%, rgba(9,9,9,0.50) 52%, rgba(9,9,9,0.95) 100%)',
        }}
      />

      {/* Hero 내용 */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 text-white">
        {/* 태그 */}
        <div className="flex items-center gap-1">
          <span className="border border-[#C9A96E]/45 bg-black/20 px-[6px] py-[3px] text-[7px] leading-none tracking-[0.08em] text-[#C9A96E] rounded-sm">
            3D READY
          </span>

          <span className="border border-[#C9A96E]/45 bg-black/20 px-[6px] py-[3px] text-[7px] leading-none tracking-[0.08em] text-[#C9A96E] rounded-sm">
            {activeSlide.tag}
          </span>
        </div>

        {/* 제목 */}
        <h1
          className="mt-[9px] whitespace-pre-line text-[24px] font-semibold leading-[28.8px] text-[#F0EBE2]"
          style={{ fontFamily: '"DM Serif Display", serif' }}
        >
          {activeSlide.title}
        </h1>

        {/* 설명 */}
        <p
          className="mt-[5px] w-fit whitespace-nowrap text-[12px] font-normal leading-[18px] text-[#9A9490]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {activeSlide.description}
        </p>


        {/* 버튼 */}
        <div className="mt-[14px] flex items-center gap-[7px]">
          <button
            type="button"
            onClick={scrollToCollections}
            className="flex h-[38px] items-center justify-center rounded-[2px] bg-[#ccb476] px-[18px] text-[10px] font-bold text-[#17130b]"
          >
            지금 피팅하기
          </button>

          <button
            type="button"
            aria-label="가상 피팅 정보"
            className="grid h-[38px] w-[38px] place-items-center rounded-[2px] border border-white/10 bg-white/10 text-white/65 backdrop-blur-sm"
          >
            <InfoIcon className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;

function InfoIcon({
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
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path
        d="M12 10.5V16"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="7.5"
        r="0.9"
        fill="currentColor"
      />
    </svg>
  );
}