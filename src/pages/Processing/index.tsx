import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProcessingPageState {
  jobId: string;
  height: number;
  weight: number;
}

const Processing = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pageState = location.state as ProcessingPageState | null;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!pageState?.jobId) {
      navigate('/upload', { replace: true });
      return;
    }

    const progressTimer = window.setInterval(() => {
      setProgress((currentProgress) => {
        return Math.min(currentProgress + 10, 100);
      });
    }, 300);

    const completeTimer = window.setTimeout(() => {
      navigate('/fitting', {
        replace: true,
        state: {
          jobId: pageState.jobId,
          avatarId: 1,
          height: pageState.height,
          weight: pageState.weight,
        },
      });
    }, 3300);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(completeTimer);
    };
  }, [navigate, pageState]);

  const getStatusMessage = () => {
    if (progress < 30) {
      return '사진을 확인하고 있습니다.';
    }

    if (progress < 70) {
      return '신체 정보를 분석하고 있습니다.';
    }

    if (progress < 100) {
      return '3D 아바타를 생성하고 있습니다.';
    }

    return '아바타 생성이 완료되었습니다.';
  };

  if (!pageState?.jobId) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-gold">STEP 2</p>

        <h1 className="mt-3 text-3xl font-semibold text-text">
          아바타를 생성하고 있습니다
        </h1>

        <p className="mt-4 text-text-sub">
          입력한 사진과 신체 정보를 바탕으로 3D 아바타를 생성합니다.
        </p>

        <div className="mt-10">
          <div className="h-3 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 text-sm">
            <span className="text-left text-text-sub">
              {getStatusMessage()}
            </span>

            <span className="font-semibold text-text">
              {progress}%
            </span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Processing;