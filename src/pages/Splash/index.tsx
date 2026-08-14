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
      alert('게스트 모드로 진입하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-5xl font-medium tracking-tight text-gold">
          CLOSR
        </h1>

        <p className="mt-4 text-sm leading-6 text-text-sub">
          가장 완벽한 핏을 가장 가까이,
          <br />
          내 몸 위의 3D 가상 아틀리에
        </p>

        <button
          type="button"
          onClick={handleGuestEntry}
          disabled={isLoading}
          className="mt-10 w-full rounded-xl border border-gold px-5 py-3 text-sm font-medium text-gold transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? '진입 중...' : '게스트 모드로 시작하기'}
        </button>
      </div>
    </main>
  );
};

export default Splash;