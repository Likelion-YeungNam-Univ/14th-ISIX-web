import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { getGarments } from '@/api/garment';
import {
  deleteAvatar,
  getMyAvatars,
} from '@/api/avatar';
import ThreeViewer from '@/components/viewer/ThreeViewer';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import type { AvatarJob } from '@/types/avatar';
import {
  clearCurrentAvatar,
  getCurrentAvatar,
  saveCurrentAvatar,
} from '@/utils/avatarStorage';
import HomeLogo from '@/components/common/HomeLogo';

const formatCreatedDate = (
  createdAt?: string | null,
) => {
  if (!createdAt) {
    return null;
  }

  const datePart = createdAt.split('T')[0];
  const [year, month, day] =
    datePart.split('-');

  if (!year || !month || !day) {
    return null;
  }

  return `${year}.${month}.${day}`;
};

const measurementLabelMap: Record<
  string,
  string
> = {
  shoulder_width: '어깨 너비',
  chest_circ: '가슴 둘레',
  waist_circ: '허리 둘레',
  hip_circ: '엉덩이 둘레',
  neck_circ: '목 둘레',
  arm_circ: '팔 둘레',
  thigh_circ: '허벅지 둘레',
  back_length: '등 길이',
  sleeve_length: '팔 길이',
  inseam: '안쪽 다리길이',
  total_length: '전체 길이',
  front_width: '앞 너비',
};

const statusLabelMap: Record<
  AvatarJob['status'],
  string
> = {
  done: '생성 완료',
  processing: '생성 중',
  failed: '생성 실패',
};

const Avatar = () => {
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(
    () => getCurrentAvatar(),
  );

  const { data: garments = [] } =
    useQuery({
      queryKey: ['garments'],
      queryFn: getGarments,
      enabled: Boolean(avatar),
    });

  const [avatars, setAvatars] = useState<
    AvatarJob[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  /*
   * 삭제 흐름.
   *
   * "선택" 을 누르면 고르는 모드로 들어가고, 카드를 눌러 지울 아바타를
   * 표시한 뒤 휴지통으로 지웁니다. 고르는 모드에서는 카드를 눌러도 사용
   * 아바타가 바뀌지 않습니다 — 지우려다 현재 아바타를 갈아치우면 안 됩니다.
   */
  const [isSelectMode, setIsSelectMode] =
    useState(false);

  const [checkedId, setCheckedId] =
    useState<number | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const [
    isConfirmOpen,
    setIsConfirmOpen,
  ] = useState(false);

  const sortedAvatars = [...avatars].sort(
    (a, b) =>
      (a.avatarId ?? 0) -
      (b.avatarId ?? 0),
  );

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const data = await getMyAvatars();
        setAvatars(data);
      } catch {
        setLoadError(
          '저장된 아바타를 불러오지 못했습니다.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAvatars();
  }, []);

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setCheckedId(null);
    setDeleteError(null);
    setIsConfirmOpen(false);
  };

  const checkedAvatar =
    sortedAvatars.find(
      (item) =>
        item.avatarId === checkedId,
    ) ?? null;

  const checkedLabel = checkedAvatar
    ? `아바타 ${
        sortedAvatars.indexOf(
          checkedAvatar,
        ) + 1
      }`
    : '';

  const handleDelete = async () => {
    if (checkedId == null || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAvatar(checkedId);

      setAvatars((prev) =>
        prev.filter(
          (item) =>
            item.avatarId !== checkedId,
        ),
      );

      // 지운 것이 지금 쓰는 아바타면 선택을 비웁니다. 안 비우면 피팅룸이
      // 사라진 아바타를 계속 붙들고 GLB 를 부르러 갑니다.
      if (
        avatar?.avatarId === checkedId
      ) {
        clearCurrentAvatar();
        setAvatar(null);
      }

      exitSelectMode();
    } catch {
      setDeleteError(
        '아바타를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAvatar = (
    selectedAvatar: AvatarJob,
  ) => {
    if (
      selectedAvatar.status !== 'done' ||
      selectedAvatar.avatarId == null
    ) {
      return;
    }

    // 고르는 모드에서는 지울 대상만 바꿉니다. 같은 것을 다시 누르면 해제합니다.
    if (isSelectMode) {
      const id = selectedAvatar.avatarId;
      setCheckedId((prev) =>
        prev === id ? null : id,
      );
      setDeleteError(null);
      return;
    }

    const nextAvatar = {
      avatarId:
        selectedAvatar.avatarId,
      glbUrl:
        selectedAvatar.glbUrl,
      measurements:
        selectedAvatar.measurements,

      createdAt:
        selectedAvatar.createdAt,

      height:
        selectedAvatar.height,
      weight:
        selectedAvatar.weight,
      confidence:
        selectedAvatar.confidence,

      bodyType:
        selectedAvatar.bodyType,
      bodyTypeLabel:
        selectedAvatar.bodyTypeLabel,
      bodyTypeMessage:
        selectedAvatar.bodyTypeMessage,
      bodyTypeStyling:
        selectedAvatar.bodyTypeStyling,
    };

    saveCurrentAvatar(nextAvatar);
    setAvatar(nextAvatar);
  };

  const measurements =
    Object.entries(
      avatar?.measurements ?? {},
    );

  const selectedIndex =
    sortedAvatars.findIndex(
      (item) =>
        item.avatarId ===
        avatar?.avatarId,
    );

  const is3DReady =
    Boolean(avatar?.glbUrl);

  const isAnalysisDone =
    measurements.length > 0;

  const hasScanAccuracy =
    avatar?.confidence != null &&
    Number.isFinite(
      avatar.confidence,
    );

  const scanAccuracyLabel =
    hasScanAccuracy
      ? `${(
          avatar!.confidence! * 100
        ).toFixed(1)}%`
      : '-';

  const bodyTypeName =
    avatar?.bodyTypeLabel ??
    avatar?.bodyType ??
    null;

  const bodyTypeDescription =
    avatar?.bodyTypeMessage ??
    null;

  const bodyTypeStyling =
    avatar?.bodyTypeStyling ??
    [];

  const hasBodyTypeResult =
    Boolean(
      bodyTypeName &&
        bodyTypeDescription,
    );

  const createdDate =
    formatCreatedDate(
      avatar?.createdAt,
    );

  return (
    <main className="min-h-screen bg-[#080808]">
      <div className="mx-auto min-h-screen w-[402px] max-w-full overflow-hidden bg-[#090909] text-[#F0EBE2]">
        <header className="flex h-[46px] items-center justify-between border-b border-white/10 bg-[#080808] px-[14px]">
          <HomeLogo className="text-[20px] font-normal leading-[30px] tracking-[1.2px] text-[#F0EBE2]" />
        </header>

        <div className="px-[20px] pb-[40px] pt-[24px]">
          <div className="flex items-center justify-between">
            <h1
              className="text-[14px] font-semibold uppercase leading-[16.5px] tracking-[1.32px] text-[#9A9490]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              나의 아바타
            </h1>

            <div className="flex items-center gap-[10px]">
              <span
                className="text-[10px] text-[#9A9490]"
                style={{
                  fontFamily:
                    '"DM Mono", monospace',
                }}
              >
                {avatars.length}개 저장됨
              </span>

              {avatars.length > 0 &&
                (isSelectMode ? (
                  <button
                    type="button"
                    onClick={() =>
                      setIsConfirmOpen(
                        true,
                      )
                    }
                    disabled={
                      checkedId == null ||
                      isDeleting
                    }
                    aria-label="선택한 아바타 삭제"
                    className={[
                      'flex h-[26px] w-[26px] items-center justify-center rounded-full transition-opacity',
                      checkedId == null ||
                      isDeleting
                        ? 'bg-[#C9A96E]/30 text-[#0D0A05]/50'
                        : 'bg-[#C9A96E] text-[#0D0A05]',
                    ].join(' ')}
                  >
                    <TrashIcon className="h-[14px] w-[14px]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setIsSelectMode(
                        true,
                      )
                    }
                    className="h-[26px] rounded-full bg-[#C9A96E] px-[12px] text-[11px] font-semibold text-[#0D0A05]"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    선택
                  </button>
                ))}
            </div>
          </div>

          {isSelectMode && (
            <div className="mt-[10px] flex items-center justify-between">
              <p
                className="text-[11px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                지울 아바타를 선택해 주세요.
              </p>

              <button
                type="button"
                onClick={exitSelectMode}
                className="text-[11px] text-[#9A9490] underline"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                취소
              </button>
            </div>
          )}

          {deleteError && (
            <p
              className="mt-[10px] text-[12px] text-[#E5695C]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {deleteError}
            </p>
          )}

          {isLoading && (
            <p
              className="mt-[16px] text-[12px] text-[#9A9490]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              아바타 목록을 불러오는 중입니다.
            </p>
          )}

          {loadError && (
            <p
              className="mt-[16px] text-[12px] text-[#E5695C]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {loadError}
            </p>
          )}

          {!isLoading &&
            !loadError &&
            avatars.length === 0 && (
              <div className="mt-[16px] rounded-[16px] border-[0.714px] border-white/10 bg-[#141414] p-[20px] text-center">
                <p
                  className="text-[13px] font-semibold text-[#F0EBE2]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  아직 저장된 아바타가 없습니다.
                </p>

                <p
                  className="mt-[6px] text-[11px] text-[#9A9490]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  새로운 아바타를 생성해 주세요.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/upload')
                  }
                  className="mt-[14px] h-[40px] w-full rounded-[10px] bg-[#C9A96E] text-[13px] font-semibold text-[#0D0A05]"
                  style={{
                    fontFamily:
                      'Inter, sans-serif',
                  }}
                >
                  아바타 생성하기
                </button>
              </div>
            )}

          {avatars.length > 0 && (
            <div className="mt-[16px] flex gap-[10px] overflow-x-auto pb-[4px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {sortedAvatars.map(
                (item, index) => {
                  const isSelected =
                    item.avatarId !=
                      null &&
                    avatar?.avatarId ===
                      item.avatarId;

                  const isSelectable =
                    item.status ===
                      'done' &&
                    item.avatarId !=
                      null;

                  // 지우려고 표시한 것. 사용 중 표시(isSelected)와 다릅니다.
                  const isChecked =
                    isSelectMode &&
                    item.avatarId !=
                      null &&
                    checkedId ===
                      item.avatarId;

                  return (
                    <button
                      key={item.jobId}
                      type="button"
                      disabled={
                        !isSelectable
                      }
                      onClick={() =>
                        handleSelectAvatar(
                          item,
                        )
                      }
                      className={[
                        // py 가 없어서 아이콘이 카드 위 모서리에 1px 까지 붙어
                        // 있었습니다. 시안의 카드가 84x92 라 위아래 8px 씩 줍니다.
                        // relative 는 체크 배지를 카드 모서리에 붙이기 위한 것입니다.
                        'relative flex w-[84px] shrink-0 flex-col items-center gap-[8px] rounded-[16px] border-[0.714px] px-[14px] py-[8px] transition-colors',
                        isChecked ||
                        isSelected
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                          : 'border-white/10 bg-[#141414]',
                        isSelectable
                          ? 'cursor-pointer'
                          : 'cursor-default opacity-50',
                      ].join(' ')}
                    >
                      {isChecked && (
                        <span
                          aria-hidden="true"
                          className="absolute right-[8px] top-[8px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-[#C9A96E] text-[#0D0A05]"
                        >
                          <CheckIcon className="h-[10px] w-[10px]" />
                        </span>
                      )}

                      <span
                        className={[
                          'flex h-[36px] w-[36px] items-center justify-center rounded-full',
                          isSelected
                            ? 'text-[#C9A96E]'
                            : 'text-[#5C5850]',
                        ].join(' ')}
                      >
                        <PersonIcon className="h-[26px] w-[26px]" />
                      </span>

                      <div className="flex flex-col items-center gap-[2px]">
                        <span
                          className={[
                            'text-[10px] font-semibold',
                            isSelected
                              ? 'text-[#C9A96E]'
                              : 'text-[#4A4A4A]',
                          ].join(' ')}
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          {item.avatarId !=
                          null
                            ? `아바타 ${index + 1}`
                            : '생성 중'}
                        </span>

                        <span
                          className={[
                            'text-[9px]',
                            isSelected
                              ? 'text-[#C9A96E]/60'
                              : 'text-[#4A4A4A]',
                          ].join(' ')}
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          {item.status ===
                            'done' &&
                          item.createdAt
                            ? formatCreatedDate(
                                item.createdAt,
                              )
                            : statusLabelMap[
                                item.status
                              ]}
                        </span>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}

          {!avatar ? (
            <section className="mt-[16px] rounded-[16px] border-[0.714px] border-white/10 bg-[#141414] p-[24px] text-center">
              <h2
                className="text-[15px] font-semibold text-[#F0EBE2]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                사용할 아바타를 선택해 주세요.
              </h2>

              <p
                className="mt-[8px] text-[12px] leading-[18px] text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                생성이 완료된 아바타를 선택하면
                3D 모델과 신체 정보를 확인할 수
                있습니다.
              </p>
            </section>
          ) : (
            <>
              {/* 아바타 상세 + 신체 치수 통합 카드 */}
              <section className="mt-[16px] overflow-hidden rounded-[16px] border-[0.714px] border-white/10 bg-[#141414]">
                {/* 상단 아바타 정보 */}
                <div className="flex min-h-[205px]">
                  {/* 3D 아바타 */}
                  <div className="w-[130px] shrink-0 bg-[#1C1C1C]">
                    {avatar.glbUrl ? (
                      <ThreeViewer
                        avatarUrl={
                          avatar.glbUrl
                        }
                      />
                    ) : (
                      <div className="flex h-full min-h-[205px] items-center justify-center text-[#4A4740]">
                        <PersonIcon className="h-[32px] w-[32px]" />
                      </div>
                    )}
                  </div>

                  {/* 오른쪽 정보 */}
                  <div className="flex min-w-0 flex-1 flex-col px-[14px] py-[15px]">
                    <div className="flex items-center gap-[5px]">
                      <p
                        className="m-0 text-[16px] font-normal leading-[22px] text-[#F0EBE2]"
                        style={{
                          fontFamily:
                            '"DM Serif Display", serif',
                        }}
                      >
                        아바타{' '}
                        {selectedIndex >=
                        0
                          ? selectedIndex +
                            1
                          : avatar.avatarId}
                      </p>

                      <EditIcon className="h-[10px] w-[10px] text-[#6F6B66]" />
                    </div>

                    {createdDate && (
                      <p
                        className="mt-[3px] text-[9px] leading-[14px] text-[#6F6B66]"
                        style={{
                          fontFamily:
                            '"DM Mono", monospace',
                        }}
                      >
                        {createdDate} 스캔
                      </p>
                    )}

                    {/* 키 / 체중 */}
                    <div className="mt-[10px] grid grid-cols-2 gap-[8px]">
                      <div className="flex h-[52px] flex-col justify-center rounded-[8px] border-[0.714px] border-white/10 px-[10px]">
                        <p
                          className="m-0 text-[9px] leading-[14px] text-[#9A9490]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          키
                        </p>

                        <p
                          className="mt-[3px] text-[14px] font-semibold leading-[18px] text-[#F0EBE2]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          {avatar.height !=
                          null
                            ? `${avatar.height} cm`
                            : '-'}
                        </p>
                      </div>

                      <div className="flex h-[52px] flex-col justify-center rounded-[8px] border-[0.714px] border-white/10 px-[10px]">
                        <p
                          className="m-0 text-[9px] leading-[14px] text-[#9A9490]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          체중
                        </p>

                        <p
                          className="mt-[3px] text-[14px] font-semibold leading-[18px] text-[#F0EBE2]"
                          style={{
                            fontFamily:
                              'Inter, sans-serif',
                          }}
                        >
                          {avatar.weight !=
                          null
                            ? `${avatar.weight} kg`
                            : '-'}
                        </p>
                      </div>
                    </div>

                    {/* 스캔 정확도 */}
                    <div className="mt-[9px] flex h-[36px] items-center justify-between rounded-[8px] border-[0.714px] border-[#C9A96E]/55 bg-[#C9A96E]/[0.07] px-[10px]">
                      <span
                        className="text-[9px] font-normal leading-[14px] text-[#9A9490]"
                        style={{
                          fontFamily:
                            'Inter, sans-serif',
                        }}
                      >
                        스캔 정확도
                      </span>

                      <span
                        className="text-[14px] font-semibold leading-[18px] text-[#C9A96E]"
                        style={{
                          fontFamily:
                            '"DM Mono", monospace',
                        }}
                      >
                        {scanAccuracyLabel}
                      </span>
                    </div>

                    {/* 상태 */}
                    <div className="mt-[8px] flex gap-[6px]">
                      {is3DReady && (
                        <span
                          className="flex h-[15px] items-center justify-center rounded-[4px] border-[0.714px] border-[#C9A96E]/55 bg-[#C9A96E]/[0.08] px-[7px] text-[7px] tracking-[0.3px] text-[#C9A96E]"
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          3D READY
                        </span>
                      )}

                      {isAnalysisDone && (
                        <span
                          className="flex h-[15px] items-center justify-center rounded-[4px] border-[0.714px] border-[#C9A96E]/55 bg-[#C9A96E]/[0.08] px-[7px] text-[7px] tracking-[0.2px] text-[#C9A96E]"
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          AI 분석 완료
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="h-px w-full bg-white/[0.07]" />

                {/* 신체 치수 */}
                <div className="px-[14px] pb-[14px] pt-[13px]">
                  <h2
                    className="m-0 text-[11px] font-semibold leading-[17px] text-[#9A9490]"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    신체 치수
                  </h2>

                  {measurements.length > 0 ? (
                    <div className="mt-[9px] grid grid-cols-2 gap-x-[16px]">
                      {measurements.map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex min-h-[25px] items-center justify-between border-b-[0.714px] border-white/[0.06]"
                          >
                            <span
                              className="text-[10px] text-[#9A9490]"
                              style={{
                                fontFamily:
                                  'Inter, sans-serif',
                              }}
                            >
                              {measurementLabelMap[
                                key
                              ] ?? key}
                            </span>

                            <span
                              className="text-[10px] font-medium text-[#F0EBE2]"
                              style={{
                                fontFamily:
                                  '"DM Mono", monospace',
                              }}
                            >
                              {Number.isFinite(
                                value,
                              )
                                ? `${value.toFixed(
                                    1,
                                  )} cm`
                                : '-'}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p
                      className="mt-[10px] text-[11px] text-[#9A9490]"
                      style={{
                        fontFamily:
                          'Inter, sans-serif',
                      }}
                    >
                      측정된 신체 치수 정보가 없습니다.
                    </p>
                  )}
                </div>
              </section>

              {/* 아바타 재스캔 */}
              <button
                type="button"
                onClick={() =>
                  navigate('/upload')
                }
                className="mt-[10px] flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[12px] border-[0.714px] border-white/[0.14] bg-[#141414] text-[12px] font-semibold text-[#9A9490] transition-colors hover:border-[#C9A96E]/60"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                <RefreshIcon className="h-[17px] w-[17px]" />
                아바타 재스캔하기
              </button>

              {/* 체형 진단 */}
              <section className="mt-[24px]">
                <div className="flex items-center gap-[6px]">
                  <span
                    className="text-[14px] font-semibold uppercase tracking-[1.32px] text-[#9A9490]"
                    style={{
                      fontFamily:
                        'Inter, sans-serif',
                    }}
                  >
                    체형 진단
                  </span>
                </div>

                {hasBodyTypeResult ? (
                  <div className="mt-[10px] rounded-[16px] border-[0.714px] border-white/10 bg-[#141414] p-[16px]">
                    <div className="flex items-center gap-[10px]">
                      <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] border-[0.714px] border-[#C9A96E]/50 text-[#C9A96E]">
                        <BodyTypeIcon
                          bodyType={avatar?.bodyType}
                          bodyTypeName={bodyTypeName}
                          className="h-[22px] w-[22px]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[9px] font-semibold uppercase tracking-[0.9px] text-[#9A9490]"
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          CLOSR
                        </p>

                        <p
                          className="text-[20px] font-bold text-[#F0EBE2]"
                          style={{
                            fontFamily:
                              '"DM Serif Display", serif',
                          }}
                        >
                          {bodyTypeName}
                        </p>
                      </div>
                    </div>

                    <p
                      className="mt-[12px] text-[12px] leading-[19.8px] text-[#9A9490]"
                      style={{
                        fontFamily:
                          'Inter, sans-serif',
                      }}
                    >
                      {bodyTypeDescription}
                    </p>

                    {bodyTypeStyling.length >
                      0 && (
                      <>
                        <p
                          className="mt-[12px] text-[9px] font-semibold text-[#C9A96E]"
                          style={{
                            fontFamily:
                              '"DM Mono", monospace',
                          }}
                        >
                          추천 스타일링
                        </p>

                        <ul className="mt-[6px] flex flex-col gap-[4px]">
                          {bodyTypeStyling.map(
                            (item) => (
                              <li
                                key={item}
                                className="flex items-start gap-[6px] text-[12px] leading-[18px] text-[#F0EBE2]"
                                style={{
                                  fontFamily:
                                    'Inter, sans-serif',
                                }}
                              >
                                <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#C9A96E]" />
                                <span>
                                  {item}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-[10px] rounded-[16px] border-[0.714px] border-white/10 bg-[#141414] p-[16px] text-center">
                    <p
                      className="text-[12px] text-[#9A9490]"
                      style={{
                        fontFamily:
                          'Inter, sans-serif',
                      }}
                    >
                      체형 진단 결과를 아직 받지 못했습니다.
                    </p>
                  </div>
                )}

                {garments.length > 0 && (
                  <>
                    <div className="mt-[18px] flex items-center justify-between">
                      <h3
                        className="text-[13px] text-[#9A9490] font-semibold"
                        style={{
                          fontFamily:
                            'Inter, sans-serif',
                        }}
                      >
                        {bodyTypeName ??
                          '내 체형'}{' '}
                        인기 의류
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            '/home/collections',
                          )
                        }
                        className="text-[11px] font-medium text-[#C9A96E]"
                        style={{
                          fontFamily:
                            'Inter, sans-serif',
                        }}
                      >
                        전체보기 &gt;
                      </button>
                    </div>

                    <div className="mt-[10px] overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <div className="grid grid-flow-col grid-rows-2 auto-cols-[112px] gap-x-[10px] gap-y-[10px] pb-[2px]">
                        {garments
                          .slice(0, 6)
                          .map((garment) => (
                            <button
                              key={garment.garmentId}
                              type="button"
                              onClick={() =>
                                navigate('/fitting', {
                                  state: {
                                    garmentId:
                                      garment.garmentId,
                                  },
                                })
                              }
                              className="
                                w-[112px]
                                overflow-hidden
                                border-[0.714px]
                                border-white/10
                                bg-[#141414]
                                text-left
                              "
                            >
                              {/* 상품 이미지 */}
                              <div className="relative h-[132px] w-full overflow-hidden bg-[#EEEEEB]">
                                {garment.thumbnailUrl ? (
                                  <img
                                    src={
                                      garment.thumbnailUrl
                                    }
                                    alt={garment.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[#9A9490]">
                                    <PersonIcon className="h-[26px] w-[26px]" />
                                  </div>
                                )}
                              </div>

                              {/* 상품 정보 */}
                              <div className="h-[66px] px-[8px] pb-[8px] pt-[7px]">
                                <p
                                  className="text-[8px] font-normal leading-[12px] tracking-[0.8px] text-[#C9A96E]"
                                  style={{
                                    fontFamily:
                                      '"DM Mono", monospace',
                                  }}
                                >
                                  MCM
                                </p>

                                <p
                                  className="mt-[3px] truncate text-[10px] font-medium leading-[15px] text-[#F0EBE2]"
                                  style={{
                                    fontFamily:
                                      'Inter, sans-serif',
                                  }}
                                >
                                  {garment.name}
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/*
        삭제 확인. 되돌릴 수 없는 동작이라 한 번 묻습니다.
        window.confirm 을 쓰지 않은 것은 화면 톤과 어긋나고 아이폰 사파리에서
        모양이 제각각이라서입니다.
      */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-[32px]">
          <div className="w-full max-w-[300px] rounded-[16px] border-[0.714px] border-white/10 bg-[#141414] p-[20px]">
            {/*
              조사를 붙이지 않습니다. "아바타 2" 는 "이" 로 읽어 "를" 이고
              "아바타 3" 은 "삼" 이라 "을" 입니다. 번호마다 달라져서 한 가지로
              고정하면 어느 쪽이든 틀립니다.
            */}
            <p
              className="text-[14px] font-semibold text-[#F0EBE2]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              {checkedLabel}
            </p>

            <p
              className="mt-[8px] text-[12px] leading-[18px] text-[#9A9490]"
              style={{
                fontFamily:
                  'Inter, sans-serif',
              }}
            >
              지우면 되돌릴 수 없습니다.
              <br />
              정말 지울까요?
            </p>

            <div className="mt-[18px] flex gap-[8px]">
              <button
                type="button"
                onClick={() =>
                  setIsConfirmOpen(false)
                }
                disabled={isDeleting}
                className="h-[40px] flex-1 rounded-[10px] border-[0.714px] border-white/10 text-[13px] font-semibold text-[#9A9490]"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                취소
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                disabled={isDeleting}
                className="h-[40px] flex-1 rounded-[10px] bg-[#E5695C] text-[13px] font-semibold text-[#0D0A05] disabled:opacity-50"
                style={{
                  fontFamily:
                    'Inter, sans-serif',
                }}
              >
                {isDeleting
                  ? '지우는 중'
                  : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      <VoiceAssistant mode="onboarding" />
    </main>
  );
};

export default Avatar;

function TrashIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function CheckIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 12.5l5.5 5.5L20 7" />
    </svg>
  );
}

function PersonIcon({
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
        d="M15 3.75C15 3.15666 14.8241 2.57664 14.4944 2.08329C14.1648 1.58994 13.6962 1.20543 13.148 0.978363C12.5999 0.7513 11.9967 0.69189 11.4147 0.807646C10.8328 0.923401 10.2982 1.20912 9.87868 1.62868C9.45912 2.04824 9.1734 2.58279 9.05764 3.16473C8.94189 3.74667 9.0013 4.34987 9.22836 4.89805C9.45542 5.44623 9.83994 5.91477 10.3333 6.24441C10.8266 6.57405 11.4067 6.75 12 6.75C12.7956 6.75 13.5587 6.43393 14.1213 5.87132C14.6839 5.30871 15 4.54565 15 3.75ZM12 5.25C11.7033 5.25 11.4133 5.16203 11.1666 4.99721C10.92 4.83238 10.7277 4.59812 10.6142 4.32403C10.5006 4.04994 10.4709 3.74834 10.5288 3.45737C10.5867 3.16639 10.7296 2.89912 10.9393 2.68934C11.1491 2.47956 11.4164 2.3367 11.7074 2.27882C11.9983 2.22095 12.2999 2.25065 12.574 2.36418C12.8481 2.47771 13.0824 2.66997 13.2472 2.91665C13.412 3.16332 13.5 3.45333 13.5 3.75C13.5 4.14783 13.342 4.52936 13.0607 4.81066C12.7794 5.09197 12.3978 5.25 12 5.25ZM20.4694 12.5672L16.2347 7.76531C15.9531 7.44616 15.6069 7.19057 15.219 7.01552C14.831 6.84046 14.4103 6.74996 13.9847 6.75H10.0153C9.58971 6.74996 9.16898 6.84046 8.78105 7.01552C8.39312 7.19057 8.04687 7.44616 7.76531 7.76531L3.53063 12.5672C3.18673 12.9189 2.99482 13.3917 2.99629 13.8836C2.99775 14.3755 3.19246 14.8471 3.53844 15.1968C3.88442 15.5465 4.35396 15.7462 4.84582 15.7528C5.33768 15.7595 5.81246 15.5726 6.16781 15.2325L7.69594 14.0063L6.14531 19.9013C5.93994 20.3544 5.92298 20.8706 6.09818 21.3362C6.27338 21.8019 6.62638 22.1788 7.07953 22.3842C7.53268 22.5896 8.04885 22.6066 8.5145 22.4314C8.98015 22.2562 9.35712 21.9032 9.5625 21.45L12 17.2434L14.4375 21.45C14.6521 21.8879 15.0288 22.2251 15.4878 22.3898C15.9468 22.5546 16.4519 22.5341 16.896 22.3326C17.3401 22.1311 17.6882 21.7645 17.8665 21.3106C18.0448 20.8566 18.0392 20.3511 17.8509 19.9013L16.3041 14.0063L17.8322 15.2325C18.1875 15.5726 18.6623 15.7595 19.1542 15.7528C19.646 15.7462 20.1156 15.5465 20.4616 15.1968C20.8075 15.5465 21.0023 15.2944 21.0037 13.8836C21.0052 13.3917 20.8133 12.9189 20.4694 12.5672Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EditIcon({
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
        d="M16.5 3.5L20.5 7.5L8 20H4V16L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon({
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
        d="M20 11A8 8 0 1 0 18.5 15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M20 5V11H14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type BodyTypeIconProps = {
  bodyType?: string | null;
  bodyTypeName?: string | null;
  className?: string;
};

function BodyTypeIcon({
  bodyType,
  bodyTypeName,
  className,
}: BodyTypeIconProps) {
  const normalizedType = `${bodyTypeName ?? ''} ${bodyType ?? ''}`
    .trim()
    .toLowerCase();

  if (
    normalizedType.includes('모래시계') ||
    normalizedType.includes('hourglass')
  ) {
    return (
      <HourglassIcon
        className={className}
      />
    );
  }

  if (
    normalizedType.includes('역삼각') ||
    normalizedType.includes('inverted triangle')
  ) {
    return (
      <InvertedTriangleIcon
        className={className}
      />
    );
  }

  if (
    normalizedType.includes('삼각') ||
    normalizedType.includes('triangle')
  ) {
    return (
      <TriangleIcon
        className={className}
      />
    );
  }

  return (
    <BodyShapeIcon
      className={className}
    />
  );
}

function HourglassIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="22"
      height="34"
      viewBox="0 0 22 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0.599854 0.599854H20.5962L14.5973 12.5977L18.5966 20.5962L20.5962 32.594H0.599854L2.59949 20.5962L6.59875 12.5977L0.599854 0.599854Z"
        fill="#C9A96E"
        fillOpacity="0.133"
        stroke="#C9A96E"
        strokeWidth="1.19978"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TriangleIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="28"
      height="34"
      viewBox="0 0 28 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 1.5L26.5 32.5H1.5L14 1.5Z"
        fill="#C9A96E"
        fillOpacity="0.133"
        stroke="#C9A96E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InvertedTriangleIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="28"
      height="34"
      viewBox="0 0 28 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M1.5 1.5H26.5L14 32.5L1.5 1.5Z"
        fill="#C9A96E"
        fillOpacity="0.133"
        stroke="#C9A96E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BodyShapeIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      width="24"
      height="34"
      viewBox="0 0 24 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 1.5H17L19 9.5L16.5 16L19 24.5L17 32.5H7L5 24.5L7.5 16L5 9.5L7 1.5Z"
        fill="#C9A96E"
        fillOpacity="0.133"
        stroke="#C9A96E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}