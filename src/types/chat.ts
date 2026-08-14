/** AI 상담 — 명세 7.1 */

export type ChatMode = 'onboarding' | 'fitting';
export type Size = 's' | 'm' | 'l';

/** 발화 최대 길이. 초과 시 CHAT_MESSAGE_TOO_LONG */
export const MESSAGE_MAX = 500;

/**
 * `garmentId` 는 숫자 PK 입니다.
 *
 * 명세 7.1 예시가 `"shirt_slim"` 으로 적혀 있지만 실제 계약은 PK 이고,
 * `shirt_slim` 같은 design 이름으로 바꾸는 것은 백엔드가 AI 로 넘길 때
 * (`fit_context.garment_id`) 합니다. 백엔드에 design 으로 조회하는 경로가
 * 없어서 프론트가 design 을 들고 있어도 쓸 데가 없습니다.
 * — 2026-08-13 AI 류다영 확인, 명세 예시는 수정 예정
 */
export interface ChatRequest {
  mode: ChatMode;
  conversationId?: string;
  avatarId?: number;
  garmentId?: number;
  size?: Size;
  message: string;
}

/** SSE 프레임을 해석한 결과 */
export type ChatEvent =
  | { kind: 'open'; conversationId: string }
  | { kind: 'delta'; text: string }
  | { kind: 'done'; messageId: string }
  | { kind: 'error'; code: string; message: string };

/** 명세 7.2 — 새로고침 복원 */
export interface StoredMessage {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/** 화면에 그리는 한 턴 */
export interface Turn {
  id: string;
  role: 'user' | 'assistant' | 'notice';
  /** 어시스턴트는 문장 단위로 쌓입니다. TTS 재생 단위와 화면 단위를 맞추기 위함 */
  sentences: string[];
  /** 아직 문장이 되지 못한 꼬리 */
  tail: string;
  /** 지금 소리로 나가고 있는 문장 번호 */
  speakingIndex: number | null;
  streaming: boolean;
}
