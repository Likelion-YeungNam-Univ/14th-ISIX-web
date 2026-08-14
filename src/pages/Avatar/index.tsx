import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getMyAvatars } from '@/api/avatar';
import ThreeViewer from '@/components/viewer/ThreeViewer';
import type { AvatarJob } from '@/types/avatar';
import {
  getCurrentAvatar,
  saveCurrentAvatar,
} from '@/utils/avatarStorage';

const measurementLabelMap: Record<string, string> = {
  shoulder_width: '어깨너비',
  chest_circ: '가슴둘레',
  waist_circ: '허리둘레',
  hip_circ: '엉덩이둘레',
  neck_circ: '목둘레',
  arm_circ: '팔둘레',
  thigh_circ: '허벅지둘레',
  back_length: '등길이',
  sleeve_length: '팔길이',
  inseam: '안쪽 다리길이',
  total_length: '전체 길이',
  front_width: '앞너비',
};

const Avatar = () => {
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(() => getCurrentAvatar());
  const [avatars, setAvatars] = useState<AvatarJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const data = await getMyAvatars();
        setAvatars(data);
      } catch {
        setLoadError('저장된 아바타를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadAvatars();
  }, []);

  const handleSelectAvatar = (selectedAvatar: AvatarJob) => {
    if (
      selectedAvatar.status !== 'done' ||
      selectedAvatar.avatarId == null
    ) {
      return;
    }

    const nextAvatar = {
      avatarId: selectedAvatar.avatarId,
      glbUrl: selectedAvatar.glbUrl,
      measurements: selectedAvatar.measurements,
      height: selectedAvatar.height,
      weight: selectedAvatar.weight,
    };

    saveCurrentAvatar(nextAvatar);
    setAvatar(nextAvatar);
  };

  const measurements = Object.entries(
    avatar?.measurements ?? {},
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
              저장된 아바타를 확인하고 피팅에 사용할 아바타를 선택하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="rounded-xl border border-border px-5 py-3 font-semibold text-text transition hover:border-gold hover:text-gold"
          >
            아바타 재스캔
          </button>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-text">
            저장된 아바타
          </h2>

          {isLoading && (
            <p className="mt-4 text-sm text-text-sub">
              아바타 목록을 불러오는 중입니다.
            </p>
          )}

          {loadError && (
            <p className="mt-4 text-sm text-red-500">
              {loadError}
            </p>
          )}

          {!isLoading && !loadError && avatars.length === 0 && (
            <div className="mt-5 rounded-xl bg-bg p-6 text-center">
              <p className="font-semibold text-text">
                아직 저장된 아바타가 없습니다.
              </p>

              <p className="mt-2 text-sm text-text-sub">
                새로운 아바타를 생성해 주세요.
              </p>

              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="mt-4 rounded-xl bg-gold px-5 py-3 font-semibold text-bg"
              >
                아바타 생성하기
              </button>
            </div>
          )}

          {avatars.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {avatars.map((item) => {
                const isSelected =
                  item.avatarId != null &&
                  avatar?.avatarId === item.avatarId;

                const isSelectable =
                  item.status === 'done' &&
                  item.avatarId != null;

                return (
                  <button
                    key={item.jobId}
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => handleSelectAvatar(item)}
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-gold bg-bg'
                        : 'border-border bg-bg'
                    } ${
                      isSelectable
                        ? 'cursor-pointer hover:border-gold'
                        : 'cursor-default opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-text">
                        {item.avatarId != null
                          ? `아바타 #${item.avatarId}`
                          : '아바타 생성 작업'}
                      </p>

                      {isSelected && (
                        <span className="text-xs font-semibold text-gold">
                          사용 중
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-text-sub">
                      {item.status === 'done' && '생성 완료'}
                      {item.status === 'processing' && '생성 중'}
                      {item.status === 'failed' && '생성 실패'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {!avatar ? (
          <section className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-text">
              사용할 아바타를 선택해 주세요
            </h2>

            <p className="mt-3 text-text-sub">
              생성이 완료된 아바타를 선택하면 3D 모델과 신체 정보를 확인할 수 있습니다.
            </p>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
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
                    <p className="text-sm text-text-sub">
                      키
                    </p>

                    <p className="mt-2 text-xl font-semibold text-text">
                      {avatar.height != null
                        ? `${avatar.height} cm`
                        : '-'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-bg p-4">
                    <p className="text-sm text-text-sub">
                      몸무게
                    </p>

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
        )}
      </section>
    </main>
  );
};

export default Avatar;