import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import ThreeViewer from '@/components/viewer/ThreeViewer';
import { getCurrentAvatar } from '@/utils/avatarStorage';

const measurementLabelMap: Record<string, string> = {
  chest: '가슴',
  waist: '허리',
  hip: '엉덩이',
  hips: '엉덩이',
  shoulder: '어깨',
  shoulderWidth: '어깨',
  arm: '팔',
  armLength: '팔 길이',
  leg: '다리',
  legLength: '다리 길이',
};

const Avatar = () => {
  const navigate = useNavigate();

  const avatar = useMemo(() => getCurrentAvatar(), []);

  if (!avatar) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-semibold text-gold">
            MY AVATAR
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-text">
            아직 생성된 아바타가 없습니다
          </h1>

          <p className="mt-4 text-text-sub">
            전신 사진과 신체 정보를 입력해 나만의 3D 아바타를 생성해 주세요.
          </p>

          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-bg"
          >
            아바타 생성하기
          </button>
        </section>
      </main>
    );
  }

  const measurements = Object.entries(
    avatar.measurements ?? {},
  );

  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <section className="mx-auto w-full max-w-6xl">
        <p className="text-sm font-semibold text-gold">
          MY AVATAR
        </p>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text">
              내 아바타
            </h1>

            <p className="mt-3 text-text-sub">
              생성된 3D 아바타와 신체 정보를 확인할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="rounded-xl border border-border px-5 py-3 font-semibold text-text transition hover:border-gold hover:text-gold"
          >
            재스캔
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-text">
              3D 아바타
            </h2>

            <div className="mt-4 h-[520px] overflow-hidden rounded-xl border border-border bg-bg">
              {avatar.glbUrl ? (
                <ThreeViewer avatarUrl={avatar.glbUrl} />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <p className="text-text-sub">
                    아바타 3D 데이터를 불러올 수 없습니다.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-text">
                기본 신체 정보
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-bg p-4">
                  <p className="text-sm text-text-sub">키</p>
                  <p className="mt-2 text-xl font-semibold text-text">
                    {avatar.height != null
                      ? `${avatar.height} cm`
                      : '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-bg p-4">
                  <p className="text-sm text-text-sub">몸무게</p>
                  <p className="mt-2 text-xl font-semibold text-text">
                    {avatar.weight != null
                      ? `${avatar.weight} kg`
                      : '-'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-text">
                신체 치수
              </h2>

              {measurements.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {measurements.map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl bg-bg p-4"
                    >
                      <p className="text-sm text-text-sub">
                        {measurementLabelMap[key] ?? key}
                      </p>

                      <p className="mt-2 text-lg font-semibold text-text">
                        {Number.isFinite(value)
                          ? `${value.toFixed(1)} cm`
                          : '-'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-text-sub">
                  측정된 신체 치수 정보가 없습니다.
                </p>
              )}
            </section>

            <button
              type="button"
              onClick={() =>
                navigate('/fitting', {
                  state: {
                    avatarId: avatar.avatarId,
                    glbUrl: avatar.glbUrl,
                    measurements: avatar.measurements,
                    height: avatar.height,
                    weight: avatar.weight,
                  },
                })
              }
              className="w-full rounded-xl bg-gold px-6 py-4 font-semibold text-bg"
            >
              이 아바타로 피팅하기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Avatar;