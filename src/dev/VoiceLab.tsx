/**
 * 상담 테스트 하네스 — 개발 전용.
 *
 * 챗봇이 아직 홈·피팅룸에 붙어 있지 않아(다른 분 파일이라 협의 대기) STT/TTS 를
 * 실제 마이크로 확인할 곳이 없습니다. 그 자리를 임시로 대신합니다.
 *
 * 마운트가 끝나면 이 파일과 main.tsx 의 DEV 블록을 함께 지웁니다.
 *
 * 의류·사이즈 목록은 8/13 확정 시연 대본을 그대로 따릅니다 —
 * 아바타 하나(H1B2) + 의류 네 벌, 사이즈 변별력은 같은 옷의 S/M/L 로 보여줍니다.
 */

import { useState } from 'react';

import { setMockFault, type MockFault } from '@/api/chat.mock';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import type { ChatMode, Size } from '@/types/chat';

/**
 * 시연 대본 — H1B2 에서 단일 사이즈로 또렷하게 갈리는 네 벌.
 *
 * 실제로 보내는 값은 숫자 PK 입니다. 고르는 사람이 알아볼 수 있게 화면에는
 * design 이름을 띄웁니다. PK 는 목의 GARMENT_BY_PK 와 같은 임시값입니다.
 */
const GARMENTS = [
  { id: 1, design: 'shirt_slim' },
  { id: 2, design: 'dress_basic' },
  { id: 3, design: 'pants_slacks' },
  { id: 4, design: 'skirt_pencil' },
] as const;
const SIZES: Size[] = ['s', 'm', 'l'];
const FAULTS: MockFault[] = ['none', 'upstream', 'rateLimit', 'stall', 'notFound'];

/** 시연 아바타. 명세 부록 B 의 H1B2 구간입니다. */
const DEMO_AVATAR_ID = 3;

export default function VoiceLab() {
  const [mode, setMode] = useState<ChatMode>('fitting');
  const [garmentId, setGarmentId] = useState<number>(GARMENTS[0].id);
  const [size, setSize] = useState<Size>('m');
  const [fault, setFault] = useState<MockFault>('none');

  const applyFault = (next: MockFault) => {
    setFault(next);
    setMockFault(next);
  };

  return (
    <>
      <div className="fixed left-4 top-4 z-50 w-64 rounded-lg border border-border bg-card p-4 text-xs text-text-sub shadow-lg">
        <p className="mb-3 font-semibold uppercase tracking-[0.14em] text-gold">voice lab · dev</p>

        <label className="mb-1 block">mode</label>
        <div className="mb-3 flex gap-2">
          {(['fitting', 'onboarding'] as ChatMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded border px-2 py-1 transition ${
                mode === m ? 'border-gold text-gold' : 'border-border'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="mb-1 block">garmentId</label>
        <select
          value={garmentId}
          onChange={(e) => setGarmentId(Number(e.target.value))}
          disabled={mode === 'onboarding'}
          className="mb-3 w-full rounded border border-border bg-bg px-2 py-1 text-text disabled:opacity-40"
        >
          {GARMENTS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.id} · {g.design}
            </option>
          ))}
        </select>

        <label className="mb-1 block">size</label>
        <div className="mb-3 flex gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              disabled={mode === 'onboarding'}
              className={`flex-1 rounded border px-2 py-1 uppercase transition disabled:opacity-40 ${
                size === s ? 'border-gold text-gold' : 'border-border'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mb-1 block">목 폴트</label>
        <select
          value={fault}
          onChange={(e) => applyFault(e.target.value as MockFault)}
          className="w-full rounded border border-border bg-bg px-2 py-1 text-text"
        >
          {FAULTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <p className="mt-3 leading-relaxed text-text-sub/70">
          STT 는 Chrome · Edge 에서만 동작합니다. 마이크 권한을 허용해 주세요.
        </p>
      </div>

      <VoiceAssistant
        mode={mode}
        avatarId={mode === 'fitting' ? DEMO_AVATAR_ID : undefined}
        garmentId={mode === 'fitting' ? garmentId : undefined}
        size={mode === 'fitting' ? size : undefined}
      />
    </>
  );
}
