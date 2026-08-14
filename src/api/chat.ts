/**
 * 상담 API — 명세 7.1
 *
 * axios 를 쓰지 않습니다. 브라우저 axios 는 XHR 어댑터라 응답을 스트리밍으로
 * 읽을 수 없고, EventSource 는 GET 만 지원합니다. 그래서 fetch + ReadableStream
 * 으로 직접 읽되, client.ts 의 인증 규칙(Authorization / X-Session-Token /
 * withCredentials)은 아래에서 손으로 맞춥니다.
 *
 * 에러는 HTTP 200 스트림 안으로 내려오므로 상태 코드로 실패를 알 수 없습니다.
 */

import axios from 'axios';
import { getAccessToken, setAccessToken } from '@/api/client';
import { MESSAGE_MAX, type ChatEvent, type ChatRequest, type StoredMessage } from '@/types/chat';

/** 백엔드 챗 엔드포인트가 나오면 false 로 바꾸면 됩니다. */
export const USE_MOCK = true;

const CHAT_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/chat`;

/* ------------------------------------------------------------------ */
/* 문장 분할                                                            */
/* ------------------------------------------------------------------ */

/**
 * 명세는 "문장 부호(. ? !)가 나올 때마다" 끊으라고 하지만, 그대로 구현하면
 * "가슴둘레가 기준보다 6.0cm 여유가 있습니다" 가 "6." 에서 잘립니다.
 * 답변에는 항상 수치가 들어가므로 매번 발생합니다.
 *
 * 그래서 뒤에 숫자가 오지 않는 문장 부호만 경계로 봅니다. 스트리밍 중에는
 * 다음 글자가 아직 안 왔을 수 있으므로, 부호 뒤에 한 글자가 확인될 때만 끊고
 * 나머지는 버퍼에 남깁니다. done 시점에 남은 것을 마지막 문장으로 냅니다.
 */
export class SentenceSplitter {
  private buf = '';

  push(text: string): string[] {
    this.buf += text;
    const out: string[] = [];

    for (;;) {
      let cut = -1;
      // 마지막 글자는 뒤를 확인할 수 없으므로 제외합니다.
      for (let i = 0; i < this.buf.length - 1; i++) {
        const c = this.buf[i];
        if (c !== '.' && c !== '?' && c !== '!') continue;
        const next = this.buf[i + 1];
        if (next >= '0' && next <= '9') continue; // 6.0 처럼 소수점
        cut = i;
        break;
      }
      if (cut === -1) break;

      const sentence = this.buf.slice(0, cut + 1).trim();
      this.buf = this.buf.slice(cut + 1);
      if (sentence) out.push(sentence);
    }
    return out;
  }

  /** 스트림이 끝났을 때 버퍼에 남은 것 */
  flush(): string | null {
    const rest = this.buf.trim();
    this.buf = '';
    return rest || null;
  }

  /** 아직 문장이 안 된 꼬리 */
  peek(): string {
    return this.buf;
  }
}

/* ------------------------------------------------------------------ */
/* 에러 문구 — 명세 "에러 코드" 표의 5개                                 */
/* ------------------------------------------------------------------ */

/**
 * 서버 message 를 그대로 쓰지 않습니다. 답변이 음성으로 읽히므로 에러도
 * 같은 말투여야 하고, 서버 문구는 개발자 대상이라 그대로 들려주면 어색합니다.
 */
const ERROR_TEXT: Record<string, string> = {
  CHAT_MESSAGE_TOO_LONG: `말씀이 ${MESSAGE_MAX}자를 넘었습니다. 조금 나눠서 말씀해 주세요.`,
  CHAT_AVATAR_REQUIRED: '아바타를 먼저 만들어 주세요. 치수가 있어야 사이즈를 봐 드릴 수 있습니다.',
  CHAT_NOT_FOUND: '이전 대화를 찾지 못했습니다. 새로 시작하겠습니다.',
  // 남의 아바타로 대화를 시도할 때. 공통 코드라 명세 챗봇 표에는 없습니다.
  FORBIDDEN: '이 아바타로는 상담할 수 없습니다. 내 아바타를 선택해 주세요.',
  CHAT_RATE_LIMITED: '상담 이용이 잠시 제한됐습니다. 조금 뒤에 다시 말씀해 주세요.',
  CHAT_UPSTREAM_ERROR: '상담 서버 응답에 실패했습니다. 다시 말씀해 주세요.',
  NETWORK: '연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
};

export function chatErrorText(code: string, fallback: string): string {
  return ERROR_TEXT[code] ?? fallback;
}

/* ------------------------------------------------------------------ */
/* 인증 헤더 — client.ts 의 인터셉터와 같은 규칙                          */
/* ------------------------------------------------------------------ */

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const sessionToken = localStorage.getItem('session_token');
  if (sessionToken) headers['X-Session-Token'] = sessionToken;

  return headers;
}

/** client.ts 의 응답 인터셉터를 못 타므로 여기서 한 번만 재발급합니다. */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
      {},
      { withCredentials: true },
    );
    setAccessToken(data.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* 스트리밍                                                             */
/* ------------------------------------------------------------------ */

interface StreamOptions {
  signal?: AbortSignal;
  /** 테스트 주입구 */
  fetchImpl?: typeof fetch;
}

export async function* streamChat(
  req: ChatRequest,
  opts: StreamOptions = {},
): AsyncGenerator<ChatEvent> {
  if (req.message.length > MESSAGE_MAX) {
    yield {
      kind: 'error',
      code: 'CHAT_MESSAGE_TOO_LONG',
      message: `발화가 ${MESSAGE_MAX}자를 넘었습니다`,
    };
    return;
  }

  let doFetch = opts.fetchImpl;
  if (!doFetch) {
    if (USE_MOCK) {
      const { mockChatFetch } = await import('./chat.mock');
      doFetch = mockChatFetch as unknown as typeof fetch;
    } else {
      doFetch = fetch;
    }
  }

  const open = (): Promise<Response> =>
    doFetch!(CHAT_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(req),
      credentials: 'include',
      signal: opts.signal,
    });

  let res: Response;
  try {
    res = await open();
    // 토큰 만료면 한 번만 재발급 후 재시도합니다.
    if (res.status === 401 && (await refreshAccessToken())) {
      res = await open();
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
    yield { kind: 'error', code: 'NETWORK', message: '연결하지 못했습니다' };
    return;
  }

  /*
   * 스트림이 열리기 전에 실패한 경우 — 명세 "에러는 두 경로로 나갑니다".
   * 400 · 404 · 429 는 헤더가 나가기 전에 막히므로 SSE 가 아니라 일반 HTTP
   * 응답으로 옵니다. 공통 봉투에서 error.code 를 읽습니다.
   *
   * 기본값을 CHAT_UPSTREAM_ERROR 로 두지 않습니다. 그 코드는 스트림이 시작된
   * 뒤의 502 전용이라, 여기서 쓰면 경로가 뒤섞입니다.
   */
  if (!res.ok || !res.body) {
    let code = 'HTTP_ERROR';
    let message = '상담 서버 응답에 실패했습니다';
    try {
      const body = await res.json();
      if (body?.error?.code) {
        code = body.error.code;
        message = body.error.message ?? message;
      }
    } catch {
      /* JSON 이 아니면 기본 문구 */
    }
    yield { kind: 'error', code, message };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });

      /*
       * 줄바꿈을 LF 로 맞춥니다. SSE 는 CRLF 도 허용하는데, 그대로 두면
       * 프레임 구분자가 \r\n\r\n 이 되어 아래 split('\n\n') 이 영영 안 걸리고
       * 버퍼에만 쌓입니다. 목 서버는 LF 라 드러나지 않습니다.
       *
       * 청크 끝에 \r 만 오고 다음 청크가 \n 으로 시작하는 경우가 있어, 청크가
       * 아니라 누적 버퍼 전체를 매번 바꿉니다. 끝에 남은 \r 는 다음 청크가
       * 붙은 뒤에 처리됩니다.
       */
      buf = buf.replace(/\r\n/g, '\n');

      // SSE 프레임은 빈 줄로 구분됩니다.
      const frames = buf.split('\n\n');
      buf = frames.pop() ?? '';

      for (const f of frames) {
        for (const line of f.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;

          let payload: Record<string, unknown>;
          try {
            payload = JSON.parse(raw);
          } catch {
            continue; // 깨진 프레임은 버립니다
          }

          if (payload.error) {
            const err = payload.error as { code?: string; message?: string };
            yield {
              kind: 'error',
              code: err.code ?? 'CHAT_UPSTREAM_ERROR',
              message: err.message ?? '상담 서버 응답에 실패했습니다',
            };
            return;
          }
          if (typeof payload.conversationId === 'string') {
            yield { kind: 'open', conversationId: payload.conversationId };
          }
          if (typeof payload.delta === 'string') {
            yield { kind: 'delta', text: payload.delta };
          }
          if (payload.done === true) {
            yield { kind: 'done', messageId: String(payload.messageId ?? '') };
            return;
          }
        }
      }
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      yield { kind: 'error', code: 'NETWORK', message: '연결이 끊겼습니다' };
    }
  } finally {
    reader.releaseLock();
  }
}

/* ------------------------------------------------------------------ */
/* 대화 기록 조회 — 명세 7.2                                            */
/* ------------------------------------------------------------------ */

export async function fetchHistory(conversationId: string): Promise<StoredMessage[]> {
  if (USE_MOCK) return [];
  const res = await fetch(`${CHAT_URL}/${conversationId}`, {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!res.ok) return [];
  const body = await res.json();
  return body?.data?.messages ?? [];
}
