import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BrandStory = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    }, []);

  return (
    <main className="min-h-[100dvh] bg-[#080808]">
      <div className="mx-auto min-h-[100dvh] w-[402px] max-w-full overflow-hidden bg-[#080808] text-[#F0EBE2]">
        {/* Header */}
        <header className="flex h-[46px] items-center justify-between border-b border-white/10 bg-[#080808] px-[14px]">
          <span
            className="text-[20px] font-normal leading-[30px] tracking-[1.2px] text-[#F0EBE2]"
            style={{
              fontFamily: '"DM Serif Display", serif',
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

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
          className="ml-[14px] mt-[10px] grid h-[28px] w-[28px] place-items-center text-[#C9A96E]"
        >
          <BackIcon className="h-[20px] w-[20px]" />
        </button>

        {/* Intro */}
        <section className="px-[20px] pt-[14px] text-center">
          <h1
            className="m-0 text-[48px] font-normal leading-[54px] tracking-[1.2px] text-[#F0EBE2]"
            style={{
              fontFamily: '"DM Serif Display", serif',
            }}
          >
            CLOSR
          </h1>

          <p
            className="mt-[3px] text-[10px] font-normal uppercase leading-[12px] tracking-[0.45px] text-[#F0EBE2]"
            style={{
              fontFamily: '"DM Serif Display", serif',
            }}
          >
            CLOSER TO PERFECTION, CLOSER TO EARTH
          </p>

          <p
            className="mt-[5px] text-[10px] font-normal leading-[14px] text-[#D8D3CC]"
            style={{
              fontFamily: 'Pretendard, sans-serif',
            }}
          >
            완벽한 핏으로 당신에게 더 가까이,
            책임 있는 실천으로 지구에 더 가까이
          </p>
        </section>

        {/* 1. The Origin */}
        <StorySection className="mt-[49px]">
          <StoryTitle
            english="1. The Origin:"
            korean="멀어진 거리, 그리고 낭비되는 아름다움"
          />

          <StoryParagraph className="mt-[20px]">
            명품의 가치는 단순히 옷을 소유하는 데 있지 않습니다.
            <br />
            <br />
            디자이너가 정조한 원단의 무게감,
            <br />
            몸의 곡선을 타고 유연하게 떨어지는 드레이핑,
            <br />
            그리고 내 몸과 옷이 만나는
            <br />
            단 하나의 완벽한 핏에서 시작되는 완성입니다.
          </StoryParagraph>

          <img
            src="/images/brand-story/origin.jpg"
            alt=""
            className="mx-auto mt-[21px] h-[165px] w-[250px] object-cover"
          />

          <StoryParagraph className="mt-[22px]">
            하지만 지금까지의 온라인 쇼핑은 너무나 무심하게도
            평면적이었습니다.
            <br />
            수도없이 많은 정보의 부재로 매장의 문턱 너머에서,
            <br />
            수많은 옷을 2D 사진과 단 한 장의 수치표에 의존한
            <br />
            막연한 추측으로 옷을 사야 했습니다.
            <br />
            <br />
            그 결과는 참담했습니다.
            <br />
            온라인 의류 반품률 30%, 그중 70%는
            <br />
            오직 '핏'의 불일치 때문이었습니다.
            <br />
            사이즈 실패로 인한 추가 배송 과정과 좌절하는 시간과
            <br />
            버려지는 자원들은 패션 산업의 지울 수 없는 상처가
            되었습니다.
          </StoryParagraph>
        </StorySection>

        {/* 2. The Philosophy */}
        <StorySection className="mt-[96px]">
          <StoryTitle
            english="2. The Philosophy:"
            korean="지속가능성과 타협 없는 핏의 조화"
          />

          <StoryParagraph className="mt-[20px]">
            우리는 질문했습니다.
            <br />
            “왜 온라인 쇼핑은
            <br />
            고객의 시간과 지구의 환경을 낭비하면서까지 실패를 반복해야
            하는가?”
            <br />
            <br />
            “왜 온라인에서도
            <br />
            부티크 매장의 그 우아한 1:1 맞춤 케어를 경험할 수 없는가?”
          </StoryParagraph>

          <div className="mx-auto mt-[22px] flex w-[366px] max-w-full gap-[10px] px-[5px]">
            <img
              src="/images/home/story-nature.jpg"
              alt=""
              className="h-[124px] min-w-0 flex-1 object-cover"
            />

            <img
              src="/images/brand-story/craft.jpg"
              alt=""
              className="h-[124px] min-w-0 flex-1 object-cover"
            />
          </div>

          <StoryParagraph className="mt-[20px]">
            진정한 하이엔드란 단순히 비싼 옷을 파는 것이 아니라,
            <br />
            한 벌의 옷이 고객의 몸에 닿기까지의 모든 여정을
            <br />
            책임지고 품격을 지키는 것입니다.
            <br />
            <br />
            클로저는 반품으로 인한 환경 파괴의 악순환을 끊어내고,
            <br />
            스크린 너머에서도 타협 없는 장인정신을 전하기 위해
            시작되었습니다.
          </StoryParagraph>
        </StorySection>

        {/* 3. The Digital Atelier */}
        <StorySection className="mt-[100px]">
          <StoryTitle
            english="3. The Digital Atelier:"
            korean="내 손안에서 열리는 3D 초개인화 아틀리에"
          />

          <StoryParagraph className="mt-[21px]">
            클로저는 정밀한 3D 물리 연산 기술로
            <br />
            옷과 인체 사이의 공간 관계를 완벽하게 계산합니다.
          </StoryParagraph>

          {/* Avatar */}
            <div className="relative mx-auto mt-[19px] h-[196px] w-[168px]">
            {/* 아바타 아래쪽 골드 글로우 */}
            <div
                className="
                pointer-events-none
                absolute
                bottom-[-3px]
                left-1/2
                h-[26px]
                w-[120px]
                -translate-x-1/2
                blur-[13px]
                "
                style={{
                background:
                    'radial-gradient(ellipse at center, rgba(201,169,110,0.38) 0%, rgba(201,169,110,0.16) 45%, rgba(201,169,110,0) 75%)',
                }}
            />

            <img
                src="/images/brand-story/avatar.jpg"
                alt="3D 아바타"
                className="
                relative
                z-10
                h-full
                w-full
                object-contain
                object-center
                mix-blend-screen
                "
            />
            </div>

          <FeatureText
            title="정밀한 3D 디지털 트윈:"
            className="mt-[18px]"
          >
            사진 1장으로 복원된 당신만의 체형 위에
            <br />
            디자이너의 패턴을 실물같이 입힙니다.
          </FeatureText>

          <FeatureText
            title="핏 히트맵 & cm 리포트:"
            className="mt-[15px]"
          >
            360도로 둘러보며 어디가 끼고 어디가 남는지
            <br />
            시각적·정량적 데이터로 1초 만에 확인합니다.
          </FeatureText>

          <FeatureText
            title="VIP 퍼스널 컨시어지:"
            className="mt-[15px]"
          >
            오프라인 VIP 룸에서만 누릴 수 있었던
            <br />
            ‘나만을 위한 세심한 핏 큐레이션’을 온라인으로 고스란히
            옮겨왔습니다.
          </FeatureText>

          <p
            className="mx-auto mt-[20px] w-[340px] max-w-full text-center text-[9px] font-medium leading-[16px] text-[#F0EBE2]"
            style={{
              fontFamily: 'Pretendard, sans-serif',
            }}
          >
            더 이상 실패를 각오하고 여러 사이즈를 주문할 필요도,
            <br />
            맞지 않아 반품 박스를 포장할 필요도 없습니다.
          </p>
        </StorySection>

        {/* 4. The Mission & Vision */}
        <StorySection className="mt-[104px] pb-[60px]">
          <StoryTitle
            english="4. The Mission & Vision:"
            korean="클로저가 만드는 패션의 미래"
          />

          <StoryParagraph className="mt-[22px]">
            우리의 이름 CLOSR는 당신과 브랜드의 거리를 좁히고(Closer),
            <br />
            완벽한 핏으로 당신의 옷장을 완성하며(Closet),
            <br />
            환경과 인간이 공존하는 지속가능한 미래를 향한 약속입니다.
            <br />
            <br />
            “지리적 거리도, 실패에 대한 두려움도, 지구를 향한 죄책감도
            없이,
            <br />
            가장 가까운 내 손안의 3D 아틀리에에서,
            <br />
            당신만을 위해 완성되는 책임 있는 럭셔리를 만나보세요.”
          </StoryParagraph>

          <img
            src="/images/home/story-earth.jpg"
            alt=""
            className="mx-auto mt-[25px] h-[186px] w-[332px] object-cover"
          />
        </StorySection>
      </div>
    </main>
  );
};

export default BrandStory;

type StorySectionProps = {
  children: React.ReactNode;
  className?: string;
};

function StorySection({
  children,
  className = '',
}: StorySectionProps) {
  return (
    <section
      className={`px-[16px] text-center ${className}`}
    >
      {children}
    </section>
  );
}

type StoryTitleProps = {
  english: string;
  korean: string;
};

function StoryTitle({
  english,
  korean,
}: StoryTitleProps) {
  return (
    <>
      <h2
        className="m-0 text-[15px] font-normal leading-[20px] tracking-[0.2px] text-[#F0EBE2]"
        style={{
          fontFamily: '"DM Serif Display", serif',
        }}
      >
        {english}
      </h2>

      <p
        className="mt-[3px] text-[11px] font-medium leading-[17px] text-[#F0EBE2]"
        style={{
          fontFamily: 'Pretendard, sans-serif',
        }}
      >
        {korean}
      </p>
    </>
  );
}

type StoryParagraphProps = {
  children: React.ReactNode;
  className?: string;
};

function StoryParagraph({
  children,
  className = '',
}: StoryParagraphProps) {
  return (
    <p
      className={`mx-auto w-[350px] max-w-full text-center text-[10px] font-light leading-[16px] text-[#B8B3AC] ${className}`}
      style={{
        fontFamily: 'Pretendard, sans-serif',
      }}
    >
      {children}
    </p>
  );
}

type FeatureTextProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

function FeatureText({
  title,
  children,
  className = '',
}: FeatureTextProps) {
  return (
    <div className={className}>
      <p
        className="m-0 text-[9px] font-semibold leading-[16px] text-[#E4B662]"
        style={{
          fontFamily: 'Pretendard, sans-serif',
        }}
      >
        {title}
      </p>

      <p
        className="mt-[2px] text-[9px] font-normal leading-[16px] text-[#B8B3AC]"
        style={{
          fontFamily: 'Pretendard, sans-serif',
        }}
      >
        {children}
      </p>
    </div>
  );
}

function BackIcon({
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
        d="M15 18L9 12L15 6"
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