import { Link } from 'react-router-dom';

/**
 * 헤더의 CLOSR 로고. 누르면 홈으로 갑니다.
 *
 * 로고가 7개 화면에 각각 하드코딩돼 있었습니다. 한곳으로 모아 두면 링크가
 * 빠진 화면이 생기지 않습니다.
 *
 * 글자 크기·굵기가 화면마다 조금 달라서 className 을 받습니다. 모양을 통일하는
 * 것은 이 변경의 목적이 아니라, 기존 화면을 그대로 두고 링크만 겁니다.
 */
type HomeLogoProps = {
  className?: string;
};

const DEFAULT_CLASS =
  'text-[20px] font-normal leading-[30px] tracking-[1.2px] text-[#F0EBE2]';

export default function HomeLogo({ className = DEFAULT_CLASS }: HomeLogoProps) {
  return (
    <Link
      to="/home"
      aria-label="홈으로 이동"
      className={className}
      style={{ fontFamily: '"DM Serif Display", serif' }}
    >
      CLOSR
    </Link>
  );
}
