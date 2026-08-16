import { useState } from 'react';
import {
  useQueries,
  useQuery,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { getMyFittings } from '@/api/fitting';
import { getGarments } from '@/api/garment';
import {
  fetchHistory,
  fetchSummary,
  getStoredFittingConversationIds,
} from '@/api/myChat';

type MyTab = 'fitting' | 'report';

const BellIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.56-1.03H5.3v-3h.14A1.7 1.7 0 0 0 7 9.94a1.7 1.7 0 0 0-.34-1.88L6.6 8l2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.7V4.6h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.14v3h-.14A1.7 1.7 0 0 0 19.4 15Z" />
  </svg>
);

const My = () => {
  const [activeTab, setActiveTab] =
    useState<MyTab>('fitting');

  const [openReportId, setOpenReportId] =
    useState<string | null>(null);

  const navigate = useNavigate();

  /* -------------------------------------------------- */
  /* AI 상담 리포트                                      */
  /* -------------------------------------------------- */

  const fittingConversationIds =
    getStoredFittingConversationIds();

  const summaryQueries = useQueries({
    queries: fittingConversationIds.map(
      (conversationId) => ({
        queryKey: [
          'chat-summary',
          conversationId,
        ],
        queryFn: () =>
          fetchSummary(conversationId),
      }),
    ),
  });

  const reports = fittingConversationIds.map(
    (conversationId, index) => ({
      conversationId,
      summary:
        summaryQueries[index]?.data ?? null,
      isLoading:
        summaryQueries[index]?.isLoading ??
        false,
    }),
  );

  const isChatSummaryLoading =
    summaryQueries.some(
      (query) => query.isLoading,
    );

  const totalRecommendedItems =
    reports.reduce(
      (total, report) =>
        total +
        (report.summary?.items.length ?? 0),
      0,
    );

  const {
    data: chatMessages = [],
    isLoading: isChatHistoryLoading,
  } = useQuery({
    queryKey: [
      'chat-history',
      openReportId,
    ],
    queryFn: () =>
      fetchHistory(openReportId!),
    enabled: Boolean(openReportId),
  });

  /* -------------------------------------------------- */
  /* 저장된 피팅                                         */
  /* -------------------------------------------------- */

  const {
    data: fittingData,
    isLoading: isFittingLoading,
    isError: isFittingError,
  } = useQuery({
    queryKey: ['my-fittings'],
    queryFn: getMyFittings,
  });

  const { data: garments = [] } = useQuery({
    queryKey: ['garments'],
    queryFn: getGarments,
  });

  const fittings =
    fittingData?.fittings ?? [];

  const getThumbnail = (
    garmentId: number,
  ) =>
    garments.find(
      (garment) =>
        garment.garmentId === garmentId,
    )?.thumbnailUrl ?? null;

  return (
    <main className="min-h-[100dvh] bg-[#070707] pb-32 text-white">
      <div className="mx-auto w-full max-w-[430px]">
        {/* Header */}
        <header className="flex h-[74px] items-end justify-between border-b border-[#171717] px-5 pb-4">
          <h1 className="font-serif text-[19px] font-semibold tracking-wide">
            CLOSR
          </h1>

          <button
            type="button"
            aria-label="알림"
            className="text-white"
          >
            <BellIcon />
          </button>
        </header>

        {/* Profile */}
        <section className="flex items-center border-b border-[#171717] px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#b79c4e] font-serif text-lg text-black">
            C
          </div>

          <div className="ml-3 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-semibold">
                Kim Jiyeon
              </p>

              <span className="text-xs text-[#7b7b7b]">
                ✎
              </span>
            </div>

            <p className="mt-0.5 text-[11px] text-[#8a8a8a]">
              모래시계형
              <span className="mx-2">·</span>
              168cm
              <span className="mx-2">·</span>
              54kg
            </p>
          </div>

          <button
            type="button"
            aria-label="설정"
            className="text-[#b79c4e]"
          >
            <SettingsIcon />
          </button>
        </section>

        {/* Tabs */}
        <nav className="grid h-[48px] grid-cols-2 border-b border-[#171717]">
          <button
            type="button"
            onClick={() =>
              setActiveTab('fitting')
            }
            className={`relative text-[13px] transition-colors ${
              activeTab === 'fitting'
                ? 'text-[#d0b76f]'
                : 'text-[#777777]'
            }`}
          >
            저장된 피팅

            {activeTab === 'fitting' && (
              <span className="absolute bottom-0 left-5 right-5 h-[1.5px] bg-[#c7aa59]" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('report')
            }
            className={`relative text-[13px] transition-colors ${
              activeTab === 'report'
                ? 'text-[#d0b76f]'
                : 'text-[#777777]'
            }`}
          >
            AI 대화 리포트

            {activeTab === 'report' && (
              <span className="absolute bottom-0 left-5 right-5 h-[1.5px] bg-[#c7aa59]" />
            )}
          </button>
        </nav>

        <section className="px-3 pt-4">
          {activeTab === 'fitting' ? (
            /* ================================================== */
            /* 저장된 피팅                                        */
            /* ================================================== */

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#a7a7a7]">
                  저장된 피팅
                </h2>

                <span className="text-[11px] text-[#c4aa63]">
                  {fittings.length}개
                </span>
              </div>

              {isFittingLoading && (
                <div className="flex min-h-36 items-center justify-center rounded-xl border border-[#1d1d1d] bg-[#101010]">
                  <p className="text-xs text-[#666666]">
                    피팅 기록을 불러오는
                    중입니다.
                  </p>
                </div>
              )}

              {isFittingError && (
                <div className="flex min-h-36 items-center justify-center rounded-xl border border-[#1d1d1d] bg-[#101010]">
                  <p className="text-xs text-[#777777]">
                    피팅 기록을 불러오지
                    못했습니다.
                  </p>
                </div>
              )}

              {!isFittingLoading &&
                !isFittingError &&
                fittings.length === 0 && (
                  <div className="flex min-h-36 items-center justify-center rounded-xl border border-[#1d1d1d] bg-[#101010]">
                    <p className="text-xs text-[#666666]">
                      아직 저장된 피팅이
                      없습니다.
                    </p>
                  </div>
                )}

              {!isFittingLoading &&
                !isFittingError &&
                fittings.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {fittings.map(
                      (fitting) => {
                        const thumbnail =
                          getThumbnail(
                            fitting.garmentId,
                          );

                        return (
                          <article
                            key={
                              fitting.fittingId
                            }
                            className="overflow-hidden rounded-lg border border-[#252525] bg-[#131313]"
                          >
                            <div className="relative aspect-[1/1] bg-[#efefef]">
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={
                                    fitting.garmentName
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <span className="text-[11px] text-[#999999]">
                                    이미지 준비 중
                                  </span>
                                </div>
                              )}

                              <div className="absolute bottom-2 left-2 rounded bg-[#343434] px-2 py-1 text-[9px] text-white">
                                추천{' '}
                                {fitting.recommendedSize
                                  ?.toUpperCase() ??
                                  '-'}
                              </div>
                            </div>

                            <div className="p-2.5">
                              <p className="text-[9px] uppercase tracking-wide text-[#c3a95e]">
                                CLOSR
                              </p>

                              <h3 className="mt-1 truncate text-[12px] font-medium text-white">
                                {
                                  fitting.garmentName
                                }
                              </h3>

                              <p className="mt-1 text-[10px] text-[#777777]">
                                {fitting.wearable
                                  ? '착용 가능'
                                  : '사이즈 확인 필요'}
                              </p>

                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      '/fitting',
                                      {
                                        state: {
                                          garmentId:
                                            fitting.garmentId,
                                        },
                                      },
                                    )
                                  }
                                  className="h-8 rounded bg-[#c9ae68] text-[11px] font-semibold text-black"
                                >
                                  다시 입어보기
                                </button>

                                <button
                                  type="button"
                                  disabled
                                  className="h-8 rounded border border-[#292929] text-[11px] text-[#666666]"
                                >
                                  구매하기
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                )}
            </div>
          ) : (
            /* ================================================== */
            /* AI 대화 리포트                                     */
            /* ================================================== */

            <div>
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  [
                    '총 대화',
                    fittingConversationIds.length >
                    0
                      ? `${fittingConversationIds.length}회`
                      : '-',
                  ],
                  [
                    '추천 아이템',
                    fittingConversationIds.length >
                    0
                      ? `${totalRecommendedItems}개`
                      : '-',
                  ],
                  ['평균 핏', '-'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex h-[58px] flex-col items-center justify-center rounded-lg border border-[#242424] bg-[#151515]"
                  >
                    <span className="text-[10px] text-[#777777]">
                      {label}
                    </span>

                    <strong className="mt-1 text-[16px] font-medium">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>

              {/* 리포트 목록 */}
              <div className="mt-4">
                {isChatSummaryLoading ? (
                  <div className="flex min-h-36 items-center justify-center rounded-xl border border-[#1d1d1d] bg-[#101010]">
                    <p className="text-xs text-[#666666]">
                      상담 리포트를 불러오는
                      중입니다.
                    </p>
                  </div>
                ) : fittingConversationIds.length ===
                  0 ? (
                  <div className="flex min-h-36 items-center justify-center rounded-xl border border-[#1d1d1d] bg-[#101010]">
                    <p className="text-xs text-[#666666]">
                      아직 피팅 상담 기록이
                      없습니다.
                    </p>
                  </div>
                ) : reports.every(
                    (report) =>
                      !report.summary,
                  ) ? (
                  <div className="flex min-h-36 items-center justify-center rounded-xl border border-[#1d1d1d] bg-[#101010]">
                    <p className="text-xs text-[#666666]">
                      저장된 상담 리포트가
                      없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => {
                      const summary =
                        report.summary;

                      if (!summary) {
                        return null;
                      }

                      const isOpen =
                        openReportId ===
                        report.conversationId;

                      return (
                        <article
                          key={
                            report.conversationId
                          }
                          className={`rounded-xl border bg-[#151515] p-4 transition-colors ${
                            isOpen
                              ? 'border-[#7a6836]'
                              : 'border-[#252525]'
                          }`}
                        >
                          {/* 리포트 Header */}
                          <button
                            type="button"
                            onClick={() =>
                              setOpenReportId(
                                (current) =>
                                  current ===
                                  report.conversationId
                                    ? null
                                    : report.conversationId,
                              )
                            }
                            className="flex w-full items-start justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-[#c3a95e]">
                                AI 스타일 리포트
                              </p>

                              <h3 className="mt-1 text-[14px] font-semibold text-white">
                                {summary.headline ??
                                  '피팅 상담 리포트'}
                              </h3>
                            </div>

                            <span className="pt-2 text-[18px] leading-none text-[#c3a95e]">
                              {isOpen
                                ? '⌃'
                                : '⌄'}
                            </span>
                          </button>

                          {/* 접힌 상태 */}
                          {!isOpen &&
                            summary.items
                              .length > 0 && (
                              <div className="mt-4 border-t border-[#252525] pt-3">
                                <p className="mb-2 text-[10px] text-[#777777]">
                                  추천 아이템
                                </p>

                                <div className="space-y-2">
                                  {summary.items.map(
                                    (item) => (
                                      <div
                                        key={
                                          item.garmentId
                                        }
                                        className="rounded-lg bg-[#0f0f0f] p-3"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <p className="truncate text-[12px] font-medium text-white">
                                            {
                                              item.name
                                            }
                                          </p>

                                          <span className="shrink-0 text-[10px] text-[#c3a95e]">
                                            {item.size.toUpperCase()}
                                          </span>
                                        </div>

                                        <p className="mt-1 text-[10px] leading-4 text-[#777777]">
                                          {
                                            item.note
                                          }
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {/* 펼친 상태 */}
                          {isOpen && (
                            <div className="mt-4 border-t border-[#2a2a2a] pt-4">
                              <h4 className="text-[11px] font-semibold text-[#bdbdbd]">
                                대화 기록
                              </h4>

                              {isChatHistoryLoading ? (
                                <div className="py-8 text-center text-[11px] text-[#666666]">
                                  대화 기록을
                                  불러오는 중입니다.
                                </div>
                              ) : chatMessages.length ===
                                0 ? (
                                <div className="py-8 text-center text-[11px] text-[#666666]">
                                  저장된 대화가
                                  없습니다.
                                </div>
                              ) : (
                                <div className="mt-4 space-y-3">
                                  {chatMessages.map(
                                    (message) =>
                                      message.role ===
                                      'assistant' ? (
                                        <div
                                          key={
                                            message.messageId
                                          }
                                          className="flex items-start gap-2"
                                        >
                                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#756536] text-[9px] text-[#c3a95e]">
                                            AI
                                          </div>

                                          <div className="max-w-[78%] rounded-[12px] rounded-tl-[4px] bg-[#232323] px-3 py-2.5">
                                            <p className="whitespace-pre-wrap text-[11px] leading-[18px] text-[#c8c8c8]">
                                              {
                                                message.content
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div
                                          key={
                                            message.messageId
                                          }
                                          className="flex items-start justify-end gap-2"
                                        >
                                          <div className="max-w-[78%] rounded-[12px] rounded-tr-[4px] bg-[#4a4023] px-3 py-2.5">
                                            <p className="whitespace-pre-wrap text-[11px] leading-[18px] text-[#e3d49d]">
                                              {
                                                message.content
                                              }
                                            </p>
                                          </div>

                                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b79c4e] font-serif text-[11px] text-black">
                                            C
                                          </div>
                                        </div>
                                      ),
                                  )}
                                </div>
                              )}

                              {/* 추천 아이템 */}
                              {summary.items.length >
                                0 && (
                                <div className="mt-5 border-t border-[#2a2a2a] pt-4">
                                  <p className="mb-2 text-[10px] text-[#777777]">
                                    추천 아이템
                                  </p>

                                  <div className="space-y-2">
                                    {summary.items.map(
                                      (item) => (
                                        <div
                                          key={
                                            item.garmentId
                                          }
                                          className="rounded-lg bg-[#0f0f0f] p-3"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                              <p className="truncate text-[12px] font-medium text-white">
                                                {
                                                  item.name
                                                }
                                              </p>

                                              <p className="mt-1 text-[10px] leading-4 text-[#777777]">
                                                {
                                                  item.note
                                                }
                                              </p>
                                            </div>

                                            <span className="shrink-0 text-[10px] text-[#c3a95e]">
                                              {item.size.toUpperCase()}
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              navigate(
                                                '/fitting',
                                                {
                                                  state:
                                                    {
                                                      garmentId:
                                                        item.garmentId,
                                                    },
                                                },
                                              )
                                            }
                                            className="mt-3 h-8 w-full rounded bg-[#c9ae68] text-[11px] font-semibold text-black"
                                          >
                                            다시 입어보기
                                          </button>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default My;