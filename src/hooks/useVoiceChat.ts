/**
 * 음성 상담 훅.
 *
 * STT/TTS 는 브라우저 Web Speech API 라 서버로 오디오가 올라가지 않습니다.
 * 서버와는 텍스트만 주고받습니다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatErrorText, fetchHistory, SentenceSplitter, streamChat } from '@/api/chat';
import {
  MESSAGE_MAX,
  type ChatMode,
  type ChatRequest,
  type Size,
  type StoredMessage,
  type Turn,
} from '@/types/chat';

export interface VoiceChatConfig {
  mode: ChatMode;
  avatarId?: number;
  /** 의류 PK. design 이름이 아닙니다 — types/chat.ts 의 ChatRequest 주석 참고 */
  garmentId?: number;
  size?: Size;
  /** 음성 출력을 끄고 텍스트만 씁니다 */
  muted?: boolean;
}

/* ------------------------------------------------------------------ */
/* 브라우저 지원                                                        */
/* ------------------------------------------------------------------ */

type SpeechRecognitionCtor = new () => any;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const sttSupported = () => getRecognitionCtor() !== null;
export const ttsSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

/** 한국어 음성을 고릅니다. getVoices 는 처음에 빈 배열을 주므로 기다립니다. */
function pickKoreanVoice(): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    if (!ttsSupported()) return resolve(null);
    const pick = () => {
      const ko = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('ko'));
      return ko.find((v) => /female|여성|유나|heami/i.test(v.name)) ?? ko[0] ?? null;
    };
    const first = pick();
    if (first) return resolve(first);
    const onChange = () => {
      speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(pick());
    };
    speechSynthesis.addEventListener('voiceschanged', onChange);
    setTimeout(() => resolve(pick()), 1200); // 이벤트가 안 오는 브라우저 대비
  });
}

function notice(text: string): Turn {
  return {
    id: `n_${Date.now()}`,
    role: 'notice',
    sentences: [text],
    tail: '',
    speakingIndex: null,
    streaming: false,
  };
}

/* ------------------------------------------------------------------ */
/* 대화 이어가기 — 명세 7.2                                             */
/* ------------------------------------------------------------------ */

/**
 * conversationId 를 저장해 둡니다. 이게 없으면 명세 7.2(새로고침 복원)를
 * 부를 대상이 없어 기능 자체가 성립하지 않습니다.
 *
 * localStorage 인 것은 session_token 과 수명을 맞추기 위해서입니다. 개인화
 * 요약이 세션 단위로 쌓이므로(명세 "세션 단위입니다"), 대화 식별자가 세션보다
 * 먼저 사라지면 2차 대화에서 profile 이 비어 보입니다.
 *
 * 홈(onboarding)과 피팅룸(fitting)은 서로 다른 대화라 mode 로 나눕니다.
 */
const cvKey = (mode: ChatMode) => `closr_chat_cv_${mode}`;

function loadConversationId(mode: ChatMode): string | undefined {
  try {
    return localStorage.getItem(cvKey(mode)) ?? undefined;
  } catch {
    return undefined; // 사파리 프라이빗 등
  }
}

function saveConversationId(mode: ChatMode, id: string | undefined) {
  try {
    if (id) localStorage.setItem(cvKey(mode), id);
    else localStorage.removeItem(cvKey(mode));
  } catch {
    /* 저장 못 해도 대화는 됩니다 */
  }
}

/** 저장된 기록을 화면 턴으로 되돌립니다. 문장 분할은 재생 때와 같은 규칙입니다. */
function toTurns(messages: StoredMessage[]): Turn[] {
  return messages.map((m) => {
    const splitter = new SentenceSplitter();
    const sentences = [...splitter.push(m.content)];
    const rest = splitter.flush();
    if (rest) sentences.push(rest);

    return {
      id: m.messageId,
      role: m.role,
      // 복원한 대화는 읽어 주지 않으므로 사용자 발화처럼 통으로 둡니다.
      sentences: m.role === 'user' ? [m.content] : sentences,
      tail: '',
      speakingIndex: null,
      streaming: false,
    };
  });
}

/* ------------------------------------------------------------------ */
/* 훅                                                                   */
/* ------------------------------------------------------------------ */

export function useVoiceChat(config: VoiceChatConfig) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [interim, setInterim] = useState('');

  const conversationId = useRef<string | undefined>(loadConversationId(config.mode));
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const mutedRef = useRef(!!config.muted);

  useEffect(() => {
    mutedRef.current = !!config.muted;
    if (config.muted && ttsSupported()) speechSynthesis.cancel();
  }, [config.muted]);

  useEffect(() => {
    pickKoreanVoice().then((v) => {
      voiceRef.current = v;
    });
  }, []);

  /**
   * 새로고침 복원 — 명세 7.2.
   *
   * 복원한 대화는 읽어 주지 않습니다. 화면을 열자마자 지난 답변이 소리로
   * 나오면 사용자가 무엇을 물었는지 모르는 채로 듣게 됩니다.
   */
  useEffect(() => {
    const id = conversationId.current;
    if (!id) return;

    let cancelled = false;
    fetchHistory(id)
      .then((messages) => {
        if (cancelled || messages.length === 0) return;
        setTurns((prev) => (prev.length > 0 ? prev : toTurns(messages)));
      })
      .catch(() => {
        /* 복원 실패는 새 대화로 시작하면 그만입니다 */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- TTS ---------------- */

  const stopSpeaking = useCallback(() => {
    if (ttsSupported()) speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /**
   * 문장 하나를 읽습니다. 재생이 시작될 때 그 문장을 화면에서 밝힙니다.
   * 마이크가 TTS 출력을 다시 듣는 것을 막기 위해 말하는 중에는 인식을 세웁니다.
   */
  const speak = useCallback((turnId: string, index: number, text: string) => {
    if (!ttsSupported() || mutedRef.current) return;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.02;
    if (voiceRef.current) u.voice = voiceRef.current;

    u.onstart = () => {
      setSpeaking(true);
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, speakingIndex: index } : t)),
      );
    };
    u.onend = () => {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId && t.speakingIndex === index ? { ...t, speakingIndex: null } : t,
        ),
      );
      if (!speechSynthesis.speaking && !speechSynthesis.pending) setSpeaking(false);
    };
    u.onerror = () => setSpeaking(false);

    speechSynthesis.speak(u);
  }, []);

  /* ---------------- 전송 ---------------- */

  const send = useCallback(
    async (raw: string) => {
      const message = (raw || '').trim();
      if (!message || busy) return;

      if (message.length > MESSAGE_MAX) {
        setTurns((prev) => [...prev, notice(chatErrorText('CHAT_MESSAGE_TOO_LONG', ''))]);
        return;
      }

      /*
       * 명세: mode=fitting 이면 avatarId 가 필수입니다 (CHAT_AVATAR_REQUIRED).
       * 서버까지 갔다 오면 세션당 30회 한도만 깎이므로 여기서 막습니다.
       */
      if (config.mode === 'fitting' && config.avatarId === undefined) {
        setTurns((prev) => [...prev, notice(chatErrorText('CHAT_AVATAR_REQUIRED', ''))]);
        return;
      }

      stopSpeaking();
      setBusy(true);
      setInterim('');

      const userTurn: Turn = {
        id: `u_${Date.now()}`,
        role: 'user',
        sentences: [message],
        tail: '',
        speakingIndex: null,
        streaming: false,
      };
      const botId = `a_${Date.now()}`;
      const botTurn: Turn = {
        id: botId,
        role: 'assistant',
        sentences: [],
        tail: '',
        speakingIndex: null,
        streaming: true,
      };
      setTurns((prev) => [...prev, userTurn, botTurn]);

      const req: ChatRequest = {
        mode: config.mode,
        conversationId: conversationId.current,
        avatarId: config.avatarId,
        garmentId: config.garmentId,
        size: config.size,
        message,
      };

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const splitter = new SentenceSplitter();

      try {
        for await (const ev of streamChat(req, { signal: ctrl.signal })) {
          if (ev.kind === 'open') {
            conversationId.current = ev.conversationId;
            saveConversationId(config.mode, ev.conversationId);
            continue;
          }

          if (ev.kind === 'delta') {
            const finished = splitter.push(ev.text);
            const tail = splitter.peek();

            setTurns((prev) =>
              prev.map((t) => {
                if (t.id !== botId) return t;
                const base = t.sentences.length;
                finished.forEach((s, i) => speak(botId, base + i, s));
                return { ...t, sentences: [...t.sentences, ...finished], tail };
              }),
            );
            continue;
          }

          if (ev.kind === 'done') {
            const last = splitter.flush();
            setTurns((prev) =>
              prev.map((t) => {
                if (t.id !== botId) return t;
                if (last) speak(botId, t.sentences.length, last);
                return {
                  ...t,
                  sentences: last ? [...t.sentences, last] : t.sentences,
                  tail: '',
                  streaming: false,
                };
              }),
            );
            continue;
          }

          if (ev.kind === 'error') {
            /*
             * 404 는 대화가 사라졌다는 뜻입니다(30일 만료 · 세션 교체).
             * 죽은 id 를 지우지 않으면 이후 모든 요청이 같은 id 로 나가
             * 상담이 영구히 막힙니다. 다음 발화는 새 대화로 시작합니다.
             */
            if (ev.code === 'CHAT_NOT_FOUND') {
              conversationId.current = undefined;
              saveConversationId(config.mode, undefined);
            }

            const text = chatErrorText(ev.code, ev.message);
            setTurns((prev) =>
              prev
                .filter((t) => !(t.id === botId && t.sentences.length === 0 && !t.tail))
                .concat(notice(text)),
            );
          }
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
        setTurns((prev) =>
          prev.map((t) => (t.id === botId ? { ...t, streaming: false } : t)),
        );
      }
    },
    [busy, config, speak, stopSpeaking],
  );

  /* ---------------- STT ---------------- */

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || busy) return;

    stopSpeaking(); // 말하는 중에 들으면 자기 목소리를 받아 적습니다

    const rec = new Ctor();
    rec.lang = 'ko-KR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onresult = (e: any) => {
      let finalText = '';
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else partial += r[0].transcript;
      }
      setInterim(partial);
      if (finalText) {
        setInterim('');
        void send(finalText);
      }
    };
    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setTurns((prev) => [
          ...prev,
          notice('마이크 사용을 허용해 주세요. 아래에 입력하셔도 됩니다.'),
        ]);
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = rec;
    rec.start();
  }, [busy, send, stopSpeaking]);

  /* ---------------- 정리 ---------------- */

  const reset = useCallback(() => {
    abortRef.current?.abort();
    stopSpeaking();
    recognitionRef.current?.abort?.();
    conversationId.current = undefined;
    saveConversationId(config.mode, undefined);
    setTurns([]);
    setInterim('');
  }, [config.mode, stopSpeaking]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      recognitionRef.current?.abort?.();
      if (ttsSupported()) speechSynthesis.cancel();
    },
    [],
  );

  return {
    turns,
    interim,
    listening,
    speaking,
    busy,
    send,
    startListening,
    stopListening,
    stopSpeaking,
    reset,
    conversationId: conversationId.current,
  };
}
