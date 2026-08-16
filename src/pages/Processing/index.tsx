import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getAvatarJob } from '@/api/avatar';
import { saveCurrentAvatar } from '@/utils/avatarStorage';

interface ProcessingPageState {
  jobId: string;
  height: number;
  weight: number;
  garmentId?: number;
}

const POLLING_INTERVAL = 2000;

const Processing = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pageState = location.state as ProcessingPageState | null;

  const jobId = pageState?.jobId;
  const height = pageState?.height;
  const weight = pageState?.weight;
  const garmentId = pageState?.garmentId;

  const [progress, setProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    '아바타 생성 상태를 확인하고 있습니다.',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!jobId) {
      navigate('/upload', { replace: true });
      return;
    }

    let isCancelled = false;
    let pollTimer: number | undefined;

    const pollAvatarJob = async () => {
      try {
        const job = await getAvatarJob(jobId);

        if (isCancelled) {
          return;
        }

        if (job.status === 'processing') {
          setProgress(null);
          setStatusMessage('3D 아바타를 생성하고 있습니다.');

          pollTimer = window.setTimeout(
            pollAvatarJob,
            POLLING_INTERVAL,
          );

          return;
        }

        if (job.status === 'done') {
          if (job.avatarId == null) {
            setErrorMessage(
              '아바타 생성은 완료됐지만 아바타 정보를 받지 못했습니다.',
            );
            return;
          }

          setProgress(100);
          setStatusMessage('아바타 생성이 완료되었습니다.');

          saveCurrentAvatar({
            avatarId: job.avatarId,
            glbUrl: job.glbUrl,
            measurements: job.measurements,
            height,
            weight,
          });

          navigate('/fitting', {
            replace: true,
            state: {
              jobId: job.jobId,
              avatarId: job.avatarId,
              glbUrl: job.glbUrl,
              measurements: job.measurements,
              height,
              weight,
              garmentId,
            },
          });

          return;
        }

        if (job.status === 'failed') {
          setErrorMessage(
            '아바타 생성에 실패했습니다. 사진과 입력 정보를 확인한 뒤 다시 시도해 주세요.',
          );
        }
      } catch (error) {
        console.error('아바타 생성 상태 조회 실패:', error);

        if (!isCancelled) {
          setErrorMessage(
            '아바타 생성 상태를 확인하지 못했습니다. 서버 연결 상태를 확인한 뒤 다시 시도해 주세요.',
          );
        }
      }
    };

    setErrorMessage('');
    void pollAvatarJob();

    return () => {
      isCancelled = true;

      if (pollTimer !== undefined) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [jobId, height, weight, garmentId, navigate, retryCount]);

  const handleRetry = () => {
    setProgress(null);
    setErrorMessage('');
    setStatusMessage('아바타 생성 상태를 다시 확인하고 있습니다.');
    setRetryCount((currentCount) => currentCount + 1);
  };

  if (!jobId) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-gold">
          STEP 2
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-text">
          아바타를 생성하고 있습니다
        </h1>

        <p className="mt-4 text-text-sub">
          입력한 사진과 신체 정보를 바탕으로 3D 아바타를 생성합니다.
        </p>

        <div className="mt-10">
          <div className="h-3 overflow-hidden rounded-full bg-bg">
            <div
              className={
                progress === null
                  ? 'h-full w-1/3 animate-pulse rounded-full bg-gold'
                  : 'h-full rounded-full bg-gold transition-all duration-300'
              }
              style={
                progress === null
                  ? undefined
                  : { width: `${progress}%` }
              }
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 text-sm">
            <span className="text-left text-text-sub">
              {statusMessage}
            </span>

            <span className="font-semibold text-text">
              {progress === null ? '처리 중' : `${progress}%`}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-8">
            <p className="text-sm leading-6 text-red-400">
              {errorMessage}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full rounded-xl bg-gold px-5 py-3 font-semibold text-bg"
              >
                다시 시도
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/upload', { replace: true })
                }
                className="w-full rounded-xl border border-border px-5 py-3 font-semibold text-text"
              >
                입력 화면으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default Processing;