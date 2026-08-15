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
        aria-label="AI 상담 열기"
        className="
          fixed
          bottom-[96px]
          right-[24px]
          z-40
          flex
          h-[48px]
          w-[48px]
          items-center
          justify-center
          rounded-[23.999px]
          border-[0.705px]
          border-[#2A2A2A]
          bg-[linear-gradient(135deg,#1A1A1A_0%,#252525_100%)]
          text-[#C9A96E]
          shadow-[0_4px_16px_0_rgba(0,0,0,0.50)]
        "
      >
        <AssistantIcon className="h-[24px] w-[24px]" />
      </button>
    );
  }

  /* ---------------- 열린 상태 ---------------- */

  return (
    <div
      role="dialog"
      aria-label="음성 상담"
      className="fixed bottom-24 right-5 z-40 flex max-h-[70vh] w-[min(24rem,calc(100vw-2.5rem))] flex-col rounded-lg border border-border bg-card shadow-2xl sm:bottom-6 sm:right-6"
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

function AssistantIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M21.4688 20.0859C21.3135 20.2101 21.1152 20.2674 20.9176 20.2455C20.72 20.2235 20.5393 20.124 20.415 19.9687C20.2866 19.8066 17.25 15.9244 17.25 8.25C17.25 6.85761 16.6969 5.52225 15.7123 4.53769C14.7278 3.55312 13.3924 3 12 3C10.6076 3 9.27227 3.55312 8.2877 4.53769C7.30314 5.52225 6.75001 6.85761 6.75001 8.25C6.75001 15.9244 3.71533 19.8066 3.58595 19.9687C3.46163 20.1243 3.28062 20.224 3.08274 20.2461C2.88486 20.2682 2.68632 20.2107 2.53079 20.0864C2.37527 19.9621 2.2755 19.7811 2.25344 19.5832C2.23137 19.3853 2.28882 19.1868 2.41314 19.0312C2.4272 19.0125 3.13408 18.1031 3.83158 16.3369C4.47845 14.7 5.25001 11.9662 5.25001 8.25C5.25001 6.45979 5.96117 4.7429 7.22704 3.47703C8.49291 2.21116 10.2098 1.5 12 1.5C13.7902 1.5 15.5071 2.21116 16.773 3.47703C18.0389 4.7429 18.75 6.45979 18.75 8.25C18.75 11.9662 19.5216 14.7 20.1685 16.3387C20.8697 18.1144 21.5803 19.0237 21.5878 19.0331C21.7114 19.1886 21.7683 19.3868 21.746 19.5842C21.7237 19.7815 21.624 19.962 21.4688 20.0859ZM9.37501 8.25C9.15251 8.25 8.935 8.31598 8.75 8.4396C8.56499 8.56321 8.4208 8.73891 8.33565 8.94448C8.2505 9.15005 8.22822 9.37625 8.27163 9.59448C8.31504 9.81271 8.42218 10.0132 8.57952 10.1705C8.73685 10.3278 8.93731 10.435 9.15554 10.4784C9.37377 10.5218 9.59997 10.4995 9.80553 10.4144C10.0111 10.3292 10.1868 10.185 10.3104 10C10.434 9.81501 10.5 9.5975 10.5 9.375C10.5 9.07663 10.3815 8.79048 10.1705 8.5795C9.95953 8.36853 9.67338 8.25 9.37501 8.25ZM15.75 9.375C15.75 9.1525 15.684 8.93499 15.5604 8.74998C15.4368 8.56498 15.2611 8.42078 15.0555 8.33563C14.85 8.25049 14.6238 8.22821 14.4055 8.27162C14.1873 8.31502 13.9869 8.42217 13.8295 8.5795C13.6722 8.73684 13.565 8.93729 13.5216 9.15552C13.4782 9.37375 13.5005 9.59995 13.5856 9.80552C13.6708 10.0111 13.815 10.1868 14 10.3104C14.185 10.434 14.4025 10.5 14.625 10.5C14.9234 10.5 15.2095 10.3815 15.4205 10.1705C15.6315 9.95952 15.75 9.67337 15.75 9.375ZM9.33564 12.0787C9.1583 11.9945 8.955 11.9832 8.7694 12.0472C8.58379 12.1111 8.43067 12.2454 8.34292 12.421C8.25517 12.5966 8.23978 12.7996 8.30006 12.9865C8.36034 13.1733 8.49148 13.3291 8.66533 13.4203L11.6653 14.9203C11.7693 14.9727 11.8841 15 12.0005 15C12.1169 15 12.2317 14.9727 12.3356 14.9203L15.3356 13.4203C15.5135 13.3313 15.6488 13.1753 15.7116 12.9865C15.7745 12.7978 15.7598 12.5918 15.6708 12.4139C15.5818 12.236 15.4257 12.1007 15.237 12.0379C15.0483 11.975 14.8423 11.9897 14.6644 12.0787L12 13.4109L9.33564 12.0787ZM12 16.5C11.0975 16.5072 10.2132 16.7553 9.43857 17.2185C8.66395 17.6818 8.02708 18.3435 7.59376 19.1353C7.49704 19.3094 7.47342 19.5147 7.5281 19.7062C7.58278 19.8976 7.71128 20.0595 7.88533 20.1562C8.05937 20.253 8.26472 20.2766 8.45618 20.2219C8.64764 20.1672 8.80954 20.0387 8.90626 19.8647C9.20421 19.3026 9.64963 18.8324 10.1947 18.5044C10.7398 18.1764 11.3639 18.0031 12 18.0031C12.6361 18.0031 13.2603 18.1764 13.8053 18.5044C14.3504 18.8324 14.7958 19.3026 15.0938 19.8647C15.1905 20.0387 15.3524 20.1672 15.5438 20.2219C15.7353 20.2766 15.9407 20.253 16.1147 20.1562C16.2887 20.0595 16.4172 19.8976 16.4719 19.7062C16.5266 19.5147 16.503 19.3094 16.4063 19.1353C15.9729 18.3435 15.3361 17.6818 14.5615 17.2185C13.7868 16.7553 12.9026 16.5072 12 16.5Z"
        fill="currentColor"
      />
    </svg>
  );
}