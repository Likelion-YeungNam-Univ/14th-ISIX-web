import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ensureGuestSession } from '@/api/session';

const Splash = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestEntry = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await ensureGuestSession();
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('게스트 세션 생성 실패:', error);
      alert(
        '게스트 모드로 진입하지 못했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#080808]">
      <div
        className="relative mx-auto h-[100dvh] w-[402px] max-w-full overflow-hidden"
        style={{
          background:
            'linear-gradient(216deg, #090909 41%, #695530 96%, #E4B662 132%)',
        }}
      >
        {/* Splash content */}
        <div className="absolute left-1/2 top-[21%] flex w-full -translate-x-1/2 flex-col items-center text-center">
          {/* Brand */}
          <div>
            <h1
              className="text-[58px] font-normal leading-[1] tracking-[1.2px] text-[#E4B662]"
              style={{
                fontFamily: '"DM Serif Display", serif',
              }}
            >
              CLOSR
            </h1>

            <p
              className="mt-[17px] text-[12px] font-normal leading-[20px] text-white"
              style={{
                fontFamily: '"DM Serif Display", serif',
              }}
            >
              가장 완벽한 핏을 가장 가까이
              <br />
              내 몸 위의 3D 가상 아틀리에
            </p>
          </div>

          {/* Guest entry */}
          <button
            type="button"
            onClick={handleGuestEntry}
            disabled={isLoading}
            className="
              mt-[86px]
              flex
              h-[49px]
              w-[326px]
              max-w-[calc(100%_-_76px)]
              items-center
              justify-center
              rounded-[3px]
              border
              border-[#E4B662]
              bg-transparent
              text-[13px]
              font-normal
              leading-[20px]
              text-[#E4B662]
              transition-opacity
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            style={{
              fontFamily: '"DM Serif Display", serif',
            }}
          >
            {isLoading
              ? '진입 중...'
              : '게스트 모드로 시작하기'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default Splash;