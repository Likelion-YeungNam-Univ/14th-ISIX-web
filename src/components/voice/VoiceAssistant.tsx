import { useEffect, useRef, useState } from 'react';

import { sttSupported, useVoiceChat, type VoiceChatConfig } from '@/hooks/useVoiceChat';
import { MESSAGE_MAX } from '@/types/chat';

/*
 * 음성 어시스턴트.
 *
 * 채팅창이 아니라 호출창입니다. 버튼을 누르면 열리면서 바로 듣기 시작하고,
 * 답을 말한 뒤 그대로 남아 이어 묻기를 기다립니다. 3D 뷰를 가리지 않도록
 * 화면 오른쪽 아래에 붙습니다.
 *
 * 지금 소리로 나가고 있는 문장 하나만 밝습니다. TTS 가 문장 단위로 재생되니
 * 화면도 그 단위로 밝아져, 어디까지 말했는지가 눈에 보입니다.
 *
 * 호출어 인식은 추후 기능입니다. open 을 밖에서 제어할 수 있게 열어뒀으니
 * 그때는 인식기가 setOpen(true) 를 부르면 됩니다.
 *
 * 명조는 Gowun Batang 을 씁니다. index.html 에 아래를 추가하세요.
 * <link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap" rel="stylesheet">
 */
const SERIF = "font-['Gowun_Batang',serif]";

type Props = VoiceChatConfig & {
  /** 밖에서 열고 닫으려면 넘깁니다. 호출어 인식이 붙을 자리 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function VoiceAssistant({ open, onOpenChange, ...config }: Props) {
  const [selfOpen, setSelfOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);

  const isOpen = open ?? selfOpen;
  const setOpen = (next: boolean) => {
    setSelfOpen(next);
    onOpenChange?.(next);
  };

  const {
    turns,
    interim,
    listening,
    speaking,
    busy,
    send,
    startListening,
    stopListening,
    stopSpeaking,
    stop,
    reset,
  } = useVoiceChat({ ...config, muted });

  const canSpeak = sttSupported();

  /*
   * 열리면 바로 듣습니다. 시리처럼 한 번 더 누르게 하지 않습니다.
   *
   * StrictMode 가 개발 모드에서 effect 를 두 번 실행하므로 ref 로 한 번만
   * 걸리게 막습니다. 두 번 시작하면 SpeechRecognition 이 InvalidStateError 를
   * 던집니다.
   */
  useEffect(() => {
    if (!isOpen) {
      autoStarted.current = false;
      return;
    }
    if (autoStarted.current) return;
    autoStarted.current = true;
    if (canSpeak && turns.length === 0) startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, interim]);

  /* 진행 중인 응답까지 끊습니다. 안 끊으면 닫힌 창에서 소리가 계속 납니다 */
  const close = () => {
    stop();
    setOpen(false);
  };

  const last = turns[turns.length - 1];
  const thinking =
    !!last && last.role === 'assistant' && last.streaming && last.sentences.length === 0;

  const status = listening
    ? '듣고 있습니다'
    : thinking
      ? '확인하고 있습니다'
      : speaking
        ? '말하는 중'
        : turns.length === 0
          ? '무엇이 궁금하신가요'
          : '더 물어보셔도 됩니다';

  const submit = () => {
    if (!draft.trim() || draft.length > MESSAGE_MAX || busy) return;
    void send(draft);
    setDraft('');
  };

  /* ---------------- 닫힌 상태 — 호출 버튼만 ---------------- */

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="음성 상담 부르기"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full border border-border bg-card text-gold shadow-lg transition-colors hover:border-gold"
      >
        <MicIcon className="h-6 w-6" />
      </button>
    );
  }

  /* ---------------- 열린 상태 ---------------- */

  return (
    <div
      role="dialog"
      aria-label="음성 상담"
      className="fixed bottom-6 right-6 z-40 flex max-h-[70vh] w-[min(24rem,calc(100vw-3rem))] flex-col rounded-lg border border-border bg-card shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-[11px] uppercase tracking-[0.18em] text-text-sub">상담</span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMuted((m) => !m);
              stopSpeaking();
            }}
            aria-pressed={muted}
            className="text-xs text-text-sub underline-offset-4 transition hover:text-text hover:underline"
          >
            {muted ? '소리 켜기' : '소리 끄기'}
          </button>

          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="text-lg leading-none text-text-sub transition hover:text-text"
          >
            ×
          </button>
        </div>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
      >
        {turns.length === 0 && !interim && (
          <p className={`${SERIF} text-[17px] leading-[1.75] text-text-sub`}>
            사이즈나 핏을 편하게 물어보세요.
          </p>
        )}

        {turns.map((turn, ti) => {
          const faded = ti < turns.length - 2; // 지난 대화는 물러납니다

          if (turn.role === 'notice') {
            return (
              <p
                key={turn.id}
                className="mt-4 rounded-lg border border-border px-3 py-2 text-[13px] text-text-sub"
              >
                {turn.sentences.join(' ')}
              </p>
            );
          }

          if (turn.role === 'user') {
            return (
              <p
                key={turn.id}
                className={`ml-auto mt-5 max-w-[24ch] text-right text-sm ${
                  faded ? 'text-text-sub/50' : 'text-text-sub'
                }`}
              >
                {turn.sentences[0]}
              </p>
            );
          }

          return (
            <div key={turn.id} className="mt-2.5 flex flex-col gap-0.5">
              {turn.sentences.map((sentence, i) => {
                const voiced = turn.speakingIndex === i;

                return (
                  <span
                    key={i}
                    className={[
                      SERIF,
                      'border-l-2 pl-3 text-[17px] leading-[1.78] transition-colors duration-300',
                      voiced
                        ? 'border-gold text-text'
                        : faded
                          ? 'border-transparent text-text/35'
                          : 'border-transparent text-text/65',
                    ].join(' ')}
                  >
                    {sentence}
                  </span>
                );
              })}

              {turn.tail && (
                <span
                  className={`${SERIF} border-l-2 border-transparent pl-3 text-[17px] leading-[1.78] text-text/65`}
                >
                  {turn.tail}
                </span>
              )}
            </div>
          );
        })}

        {interim && (
          <p className="ml-auto mt-5 max-w-[24ch] text-right text-sm italic text-text-sub/70">
            {interim}
          </p>
        )}
      </div>

      {/* 호출부 */}
      <div className="border-t border-border px-5 py-4">
        {typing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') setTyping(false);
              }}
              maxLength={MESSAGE_MAX + 40}
              disabled={busy}
              placeholder="무엇이 궁금하신가요"
              aria-label="질문 입력"
              className="min-w-0 flex-1 border-b border-border bg-transparent py-1.5 text-[15px] text-text placeholder:text-text-sub focus:border-gold focus:outline-none"
            />

            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim() || busy}
              className="flex-none text-[13px] text-text underline-offset-4 transition hover:underline disabled:text-text-sub disabled:opacity-40 disabled:no-underline"
            >
              보내기
            </button>

            {canSpeak && (
              <button
                type="button"
                onClick={() => setTyping(false)}
                aria-label="음성으로 묻기"
                className="flex-none text-text-sub transition hover:text-text"
              >
                <MicIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={busy || !canSpeak}
              aria-pressed={listening}
              aria-label={listening ? '그만 듣기' : '말하기'}
              className={[
                'grid h-12 w-12 flex-none place-items-center rounded-full border transition-colors',
                listening
                  ? 'border-gold bg-gold text-bg'
                  : 'border-border text-text-sub hover:border-gold hover:text-gold',
                busy || !canSpeak ? 'cursor-default opacity-35' : '',
              ].join(' ')}
            >
              <MicIcon className="h-[22px] w-[22px]" />
            </button>

            <span className="flex-1 text-[13px] text-text-sub">{status}</span>

            {speaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex-none text-xs text-text-sub underline-offset-4 transition hover:text-text hover:underline"
              >
                그만
              </button>
            )}

            <button
              type="button"
              onClick={() => setTyping(true)}
              className="flex-none text-xs text-text-sub underline-offset-4 transition hover:text-text hover:underline"
            >
              입력
            </button>
          </div>
        )}

        {!canSpeak && !typing && (
          <p className="mt-3 text-xs text-text-sub">
            이 브라우저는 음성 인식을 지원하지 않습니다. 입력으로 물어보세요.
          </p>
        )}

        {turns.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-xs text-text-sub/70 underline-offset-4 transition hover:text-text-sub hover:underline"
          >
            대화 지우기
          </button>
        )}
      </div>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3.5a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-5 0V6A2.5 2.5 0 0 1 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}