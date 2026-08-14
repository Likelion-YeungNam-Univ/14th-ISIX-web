/**
 * 목 상담 서버.
 *
 * 실제 ReadableStream 을 가진 Response 를 돌려줍니다. chat.ts 의 파싱 경로가
 * 목과 실서버에서 완전히 같아야, 지금 검증한 것이 나중에 그대로 유효합니다.
 * 전환은 chat.ts 의 USE_MOCK 을 false 로 바꾸는 것뿐입니다.
 *
 * 답변 수치는 전부 명세 부록 B(시연 조합)에서 가져왔습니다. 목이 지어낸 값을
 * 말하면 화면 리포트와 어긋나고, 그건 명세 정확도 항목 `사이즈 추천 일관성`
 * (MUST) 위반입니다. 없는 값은 수치 없이 말하고 지어내지 않습니다.
 */

import type { ChatRequest, Size } from '@/types/chat';

const FRAME_MS = 60; // 토큰 하나당 지연

function frame(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/** 한 문장을 2~6자 덩어리로 쪼갭니다. 실제 토큰 경계와 비슷하게. */
function chunk(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const n = 2 + Math.floor(Math.random() * 5);
    out.push(text.slice(i, i + n));
    i += n;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 시연 데이터 — 명세 부록 B, 아바타 H1B2 고정                           */
/* ------------------------------------------------------------------ */

type Part = 'shoulder_width' | 'chest_circ' | 'waist_circ' | 'hip_circ';
type Verdict = 'loose' | 'good' | 'tight';

const PART_LABEL: Record<Part, string> = {
  shoulder_width: '어깨너비',
  chest_circ: '가슴둘레',
  waist_circ: '허리둘레',
  hip_circ: '엉덩이둘레',
};

/** deviation 이 없는 칸은 명세가 범위만 준 곳입니다. 수치 없이 말합니다. */
interface PartFit {
  verdict: Verdict;
  dev?: number;
}

/**
 * `wearable` 과 `unavailableReason` 은 다른 층입니다.
 *
 * - `wearable` — 부위 중 하나라도 `tight` 면 false (백엔드 FittingService)
 * - `unavailableReason` — 3D 미리보기 파일이 없는 조합인지
 *
 * 시연 아바타 H1B2 는 **미리보기가 전부 있습니다.** 파일이 없는 3개 조합은
 * H2B2 · H2B3 에 있어서 부록 B 가 그 버킷을 피했습니다. 그래서 여기 s 들은
 * `wearable: false` 이지만 `unavailableReason` 은 `null` 입니다.
 */
interface SizeFit {
  wearable: boolean;
  unavailableReason: 'TOO_SMALL' | 'SIMULATION_FAILED' | null;
  parts: Partial<Record<Part, PartFit>>;
}

interface GarmentFit {
  label: string;
  fit: '슬림' | '레귤러' | '오버핏';
  /** 판정 대상 부위. 여기 없는 부위는 근거 수치가 없습니다 */
  judged: Part[];
  recommended: Size;
  sizes: Record<Size, SizeFit>;
}

/**
 * 네 벌 모두 m 이 정답이고 s 는 착용 불가, l 은 여유로 갈립니다.
 * verdict 는 저장값을 그대로 씁니다 — 목이 임계값을 다시 정의하지 않습니다.
 */
const FITS: Record<string, GarmentFit> = {
  shirt_slim: {
    label: '슬림 셔츠',
    fit: '슬림',
    judged: ['shoulder_width', 'chest_circ'],
    recommended: 'm',
    sizes: {
      s: {
        wearable: false,
        unavailableReason: null,
        parts: {
          chest_circ: { verdict: 'tight', dev: -9.0 },
          shoulder_width: { verdict: 'tight', dev: -3.1 },
        },
      },
      m: {
        wearable: true,
        unavailableReason: null,
        parts: {
          chest_circ: { verdict: 'good', dev: 0.0 },
          shoulder_width: { verdict: 'good', dev: 0.0 },
        },
      },
      l: {
        wearable: true,
        unavailableReason: null,
        parts: {
          chest_circ: { verdict: 'loose', dev: 6.0 },
          shoulder_width: { verdict: 'good', dev: 1.6 },
        },
      },
    },
  },

  dress_basic: {
    label: '베이직 원피스',
    fit: '레귤러',
    judged: ['shoulder_width', 'chest_circ', 'hip_circ'],
    recommended: 'm',
    sizes: {
      s: {
        wearable: false,
        unavailableReason: null,
        parts: {
          shoulder_width: { verdict: 'tight', dev: -3.1 },
          chest_circ: { verdict: 'tight', dev: -9.0 },
          hip_circ: { verdict: 'tight', dev: -7.7 },
        },
      },
      m: {
        wearable: true,
        unavailableReason: null,
        parts: {
          shoulder_width: { verdict: 'good', dev: 0.0 },
          chest_circ: { verdict: 'good', dev: 0.0 },
          hip_circ: { verdict: 'good', dev: 1.3 },
        },
      },
      /*
       * 가슴 +6.0 이 여기서는 적정입니다. shirt_slim 은 같은 값이 여유인데,
       * 레귤러 둘레 밴드가 -4~+6 이고 슬림은 -2~+3 이기 때문입니다.
       * 핏이 다르면 같은 편차도 다르게 읽힌다는 사례라 그대로 둡니다.
       */
      l: {
        wearable: true,
        unavailableReason: null,
        parts: {
          shoulder_width: { verdict: 'good', dev: 1.6 },
          chest_circ: { verdict: 'good', dev: 6.0 },
          hip_circ: { verdict: 'loose', dev: 7.3 },
        },
      },
    },
  },

  pants_slacks: {
    label: '슬랙스',
    fit: '레귤러',
    judged: ['waist_circ'],
    recommended: 'm',
    sizes: {
      s: {
        wearable: false,
        unavailableReason: null,
        parts: { waist_circ: { verdict: 'tight', dev: -5.9 } },
      },
      m: {
        wearable: true,
        unavailableReason: null,
        parts: { waist_circ: { verdict: 'good', dev: 3.1 } },
      },
      l: {
        wearable: true,
        unavailableReason: null,
        parts: { waist_circ: { verdict: 'loose', dev: 9.1 } },
      },
    },
  },

  skirt_pencil: {
    label: '펜슬 스커트',
    fit: '레귤러',
    judged: ['waist_circ', 'hip_circ'],
    recommended: 'm',
    sizes: {
      s: {
        wearable: false,
        unavailableReason: null,
        parts: {
          waist_circ: { verdict: 'tight', dev: -5.9 },
          hip_circ: { verdict: 'tight', dev: -7.7 },
        },
      },
      m: {
        wearable: true,
        unavailableReason: null,
        parts: {
          waist_circ: { verdict: 'good', dev: 3.1 },
          hip_circ: { verdict: 'good', dev: 1.3 },
        },
      },
      l: {
        wearable: true,
        unavailableReason: null,
        parts: {
          waist_circ: { verdict: 'loose', dev: 9.1 },
          hip_circ: { verdict: 'loose', dev: 7.3 },
        },
      },
    },
  },
};

/**
 * 의류 PK → design 이름.
 *
 * 2026-08-14 운영 서버 `GET /api/v1/garments` 응답에서 확인한 실제 시드입니다.
 *
 * 실서버에서는 프론트가 목록으로 받은 PK 를 그대로 보내고, design 이름으로
 * 바꾸는 것은 백엔드가 AI 로 넘길 때만 합니다. 이 표는 목이 부록 B 데이터를
 * 찾기 위한 것이라 목 안에서만 씁니다.
 */
const GARMENT_BY_PK: Record<number, string> = {
  1: 'tshirt_basic',
  2: 'shirt_slim',
  3: 'shirt_over',
  4: 'dress_basic',
  5: 'pants_slacks',
  6: 'skirt_pencil',
};

/**
 * 시연 아바타에는 팔 자세 경고가 있습니다. 명세 "어깨 수치 취급 주의" 의
 * 검증 사진과 같은 조건이라, 어깨를 말할 때 촬영 안내를 함께 붙입니다.
 */
const HAS_ARM_WARNING = true;
const ARM_WARNING = '다만 사진에서 팔이 몸에 붙어 있어 실제보다 넓게 측정됐을 수 있습니다.';

/* ------------------------------------------------------------------ */
/* 문장 만들기 — 프롬프트 규칙(2~3문장 · 120자 · deviation 기준)          */
/* ------------------------------------------------------------------ */

const UPPER: Record<Size, string> = { s: 'S', m: 'M', l: 'L' };
/** 엠 만 받침이 있어 조사가 갈립니다 */
const OBJ: Record<Size, string> = { s: '를', m: '을', l: '을' };
const TOP: Record<Size, string> = { s: '는', m: '은', l: '은' };
const WITH: Record<Size, string> = { s: '로', m: '으로', l: '로' };

const cm = (n: number) => `${Math.abs(n).toFixed(1)}cm`;

/** 부위 하나를 말합니다. deviation 이 없으면 수치를 빼고 말합니다. */
function partPhrase(part: Part, fit: PartFit): string {
  return clause([part], fit, false);
}

/**
 * 부위 묶음을 한 마디로 만듭니다.
 *
 * 부위 라벨 넷이 모두 모음으로 끝나 조사는 `와`·`가` 로 고정입니다.
 * `tail` 이 true 면 뒤에 다른 마디가 이어지므로 연결형(-고)으로 끝냅니다.
 */
function clause(parts: Part[], fit: PartFit, tail: boolean): string {
  // 둘이면 "A와 B", 셋 이상이면 "A, B, C". 셋을 전부 `와` 로 이으면 늘어집니다.
  const labels = parts.map((p) => PART_LABEL[p]);
  const subject = `${labels.length === 2 ? labels.join('와 ') : labels.join(', ')}가`;

  // good 은 수치를 붙이지 않습니다. "0.0cm 차이" 는 읽어 줄 값이 아닙니다.
  if (fit.verdict === 'good') {
    return `${subject} 기준에 ${tail ? '맞고' : '맞습니다'}`;
  }
  /*
   * tight 를 "다소 낍니다" 로 완화하지 않습니다. tight 부위가 하나라도 있으면
   * 백엔드가 그 사이즈를 wearable=false 로 판정하므로(FittingService), 화면은
   * "착용이 어렵습니다" 라고 말합니다. 챗봇만 "다소" 를 붙이면 같은 상태를
   * 두 파트가 다르게 말하는 것이 됩니다. — 2026-08-13 AI 류다영
   */
  if (fit.verdict === 'tight') {
    return fit.dev !== undefined
      ? `${subject} 기준보다 ${cm(fit.dev)} ${tail ? '부족하고' : '부족합니다'}`
      : `${subject} ${tail ? '꽉 끼고' : '꽉 낍니다'}`;
  }
  return fit.dev !== undefined
    ? `${subject} 기준보다 ${cm(fit.dev)} 여유가 ${tail ? '있고' : '있습니다'}`
    : `${subject} 다소 ${tail ? '크고' : '큽니다'}`;
}

/**
 * 판정 부위를 묶어 한 문장으로 만듭니다.
 *
 * 같은 판정끼리 묶습니다. 부위마다 한 마디씩 쓰면 "기준에 맞습니다, 기준에
 * 맞습니다" 가 되어 음성으로 들을 때 특히 지저분합니다. 수치가 있는 부위는
 * 값이 서로 다르므로 묶지 않습니다.
 */
function summarize(garment: GarmentFit, size: Size): string {
  const sf = garment.sizes[size];

  const groups: { parts: Part[]; fit: PartFit }[] = [];
  const grouped = new Map<Verdict, Part[]>();

  for (const p of garment.judged) {
    const fit = sf.parts[p];
    if (!fit) continue;

    if (fit.dev !== undefined && fit.verdict !== 'good') {
      groups.push({ parts: [p], fit }); // 수치가 있으면 개별로
      continue;
    }
    const bucket = grouped.get(fit.verdict) ?? [];
    bucket.push(p);
    grouped.set(fit.verdict, bucket);
  }

  // 잘 맞는 부위를 먼저 말하고 어긋난 쪽을 뒤에 둡니다.
  const order: Verdict[] = ['good', 'tight', 'loose'];
  const merged = order
    .filter((v) => grouped.has(v))
    .map((v) => ({ parts: grouped.get(v)!, fit: { verdict: v } as PartFit }));

  const all = [...merged, ...groups];
  if (all.length === 0) return '판정 수치를 확인하지 못했습니다';

  return all.map((g, i) => clause(g.parts, g.fit, i < all.length - 1)).join(', ');
}

/** 한 사이즈에 대한 종합 답변 */
function verdictAnswer(garment: GarmentFit, size: Size): string {
  const sf = garment.sizes[size];

  const rec = `${UPPER[garment.recommended]}${OBJ[garment.recommended]} 권해 드립니다`;

  /*
   * 착용이 어려운 사이즈. "오류" 가 아니라 정상 결과이므로 그렇게 말하지
   * 않습니다. 명세 예시 문형을 그대로 씁니다 —
   * "S는 가슴둘레가 3.0cm 부족해 착용이 어렵습니다. M을 권해 드립니다."
   * 가장 많이 모자란 부위 하나만 댑니다. 둘을 다 대면 120자를 넘습니다.
   *
   * 판단 기준은 `wearable` 이지 `unavailableReason` 이 아닙니다. 후자는 3D
   * 미리보기 파일 유무라 층이 다르고, 시연 아바타 H1B2 는 전부 파일이 있습니다.
   */
  if (!sf.wearable) {
    const worst = garment.judged
      .map((p) => ({ p, f: sf.parts[p] }))
      .filter((x) => x.f?.verdict === 'tight' && x.f.dev !== undefined)
      .sort((a, b) => (a.f!.dev ?? 0) - (b.f!.dev ?? 0))[0];

    const head = worst
      ? `${UPPER[size]}${TOP[size]} ${PART_LABEL[worst.p]}가 ${cm(worst.f!.dev!)} 부족해 착용이 어렵습니다`
      : `${UPPER[size]}${TOP[size]} 착용이 어렵습니다`;

    // 미리보기까지 없는 조합이면 그 사실도 알립니다 (명세 부록 A)
    const preview =
      sf.unavailableReason === 'TOO_SMALL'
        ? ' 옷이 작아 3D 미리보기는 제공되지 않습니다.'
        : sf.unavailableReason === 'SIMULATION_FAILED'
          ? ' 미리보기를 준비 중입니다.'
          : '';

    return `${head}. ${rec}.${preview}`;
  }

  const body = summarize(garment, size);

  if (size === garment.recommended) {
    return `${body}. ${UPPER[size]}${WITH[size]} 입으시면 잘 맞습니다.`;
  }
  return `${UPPER[size]}${TOP[size]} ${body}. 조금 넉넉하게 입고 싶으시면 이대로도 괜찮습니다.`;
}

/** 부위 하나만 물었을 때 */
function partAnswer(garment: GarmentFit, size: Size, part: Part): string {
  if (!garment.judged.includes(part)) {
    const labels = garment.judged.map((p) => PART_LABEL[p]);
    const judged = labels.length === 2 ? labels.join('와 ') : labels.join(', ');
    return `이 제품은 ${judged}로 판정합니다. ${PART_LABEL[part]}는 판정 대상이 아니라 말씀드릴 수치가 없습니다.`;
  }

  const fit = garment.sizes[size].parts[part];
  if (!fit) return `${PART_LABEL[part]} 수치를 확인하지 못했습니다.`;

  let base = `${partPhrase(part, fit)}.`;

  /*
   * tight 는 그 사이즈가 착용 불가라는 뜻이므로 대안을 함께 냅니다.
   * 부위 하나만 말하고 끝내면 사용자가 다음에 뭘 해야 할지 모릅니다.
   */
  if (fit.verdict === 'tight' && size !== garment.recommended) {
    base += ` ${UPPER[garment.recommended]}${OBJ[garment.recommended]} 권해 드립니다.`;
  }

  // 어깨 경고는 뺄 수 없는 항목입니다. 대신 다른 걸 붙이지 않습니다.
  if (part === 'shoulder_width' && HAS_ARM_WARNING) {
    return `${base} ${ARM_WARNING}`;
  }
  return base;
}

/* ------------------------------------------------------------------ */
/* 의도 파악                                                            */
/* ------------------------------------------------------------------ */

/**
 * 사이즈 언급을 찾습니다.
 *
 * "작다" 류는 쓰지 않습니다. `작` 하나로 잡으면 "시작", "작업" 에도 걸려서
 * 시연 중 "자 시작해볼게요" 에 S 답변이 튀어나옵니다.
 */
function findSize(message: string): Size | null {
  if (/(^|[^a-z])s([^a-z]|$)|에스|스몰/i.test(message)) return 's';
  if (/(^|[^a-z])m([^a-z]|$)|엠|미디엄/i.test(message)) return 'm';
  if (/(^|[^a-z])l([^a-z]|$)|엘|라지/i.test(message)) return 'l';
  return null;
}

function findPart(message: string): Part | null {
  if (/어깨/.test(message)) return 'shoulder_width';
  if (/가슴|흉위/.test(message)) return 'chest_circ';
  if (/허리/.test(message)) return 'waist_circ';
  if (/엉덩|힙/.test(message)) return 'hip_circ';
  return null;
}

/**
 * 스트리밍 없이 문구만 뽑습니다. 시연 대본과 대조하거나 AI 파트에 공유할 때
 * 씁니다. mockChatFetch 가 이 결과를 토큰으로 쪼개 흘려보냅니다.
 */
export function mockReply(req: ChatRequest): string {
  return reply(req);
}

function reply(req: ChatRequest): string {
  const m = req.message;

  /* ---- onboarding — 치수가 없습니다 ---- */
  if (req.mode === 'onboarding') {
    if (/사진|촬영|찍|자세|포즈/.test(m)) {
      return '팔을 30~45도 벌린 A자세로 전신이 나오게 찍어 주세요. 팔이 몸에 붙으면 어깨가 실제보다 넓게 측정됩니다.';
    }
    if (findPart(m) || /치수|사이즈|몇|재/.test(m)) {
      return '아직 치수가 없어 말씀드릴 수 없습니다. 먼저 사진으로 아바타를 만들어 주세요.';
    }
    return '사진 한 장으로 체형을 재고 사이즈를 맞춰 드립니다. 전신 사진과 키·몸무게만 있으면 됩니다.';
  }

  /* ---- fitting ---- */
  const design = GARMENT_BY_PK[req.garmentId ?? 0];
  const garment = FITS[design] ?? FITS.shirt_slim;
  const current: Size = req.size ?? garment.recommended;

  // 체형은 말하지 않습니다 — 프롬프트에서 금지
  if (/체형|타입|삼각|모래시계|사각/.test(m)) {
    return '체형 유형은 화면의 진단 결과를 확인해 주세요. 저는 이 옷이 어디가 맞고 어디가 남는지를 수치로 말씀드릴 수 있습니다.';
  }

  // 색으로 사이즈를 말하지 않습니다
  if (/빨|파랑|초록|색|히트맵/.test(m)) {
    return '색은 옷이 몸에 닿는 정도를 보여주는 것이라 사이즈와는 다릅니다. 사이즈는 부위별 수치로 보셔야 합니다.';
  }

  /*
   * 실제 여유량 질문 — 어깨는 actual_ease 를 그대로 읽어 주지 않습니다.
   * 정상 착용에도 -8cm 안팎의 음수라 "부족하다" 로 들립니다.
   */
  if (/실제|몇\s*cm|얼마나\s*남/.test(m)) {
    const shoulder = garment.sizes[current].parts.shoulder_width;
    if (shoulder && garment.judged.includes('shoulder_width')) {
      const tail =
        shoulder.dev !== undefined && shoulder.verdict !== 'good'
          ? `기준 대비 ${cm(shoulder.dev)} ${shoulder.verdict === 'loose' ? '여유' : '부족'}으로 보시면 됩니다`
          : '기준 대비로는 잘 맞는 범위입니다';
      return `다른 부위는 화면에 표시된 여유량만큼 남습니다. 어깨는 재는 방식이 달라 단순 비교가 어려워, ${tail}.`;
    }
    return '화면에 표시된 여유량이 실제 값입니다. 판정은 이 옷이 의도한 여유와의 차이로 봅니다.';
  }

  const part = findPart(m);
  if (part) return partAnswer(garment, current, part);

  const asked = findSize(m);
  if (asked && asked !== current) return verdictAnswer(garment, asked);

  return verdictAnswer(garment, current);
}

/* ------------------------------------------------------------------ */
/* 폴트 주입                                                            */
/* ------------------------------------------------------------------ */

export type MockFault = 'none' | 'upstream' | 'rateLimit' | 'stall' | 'notFound';

let fault: MockFault = 'none';

/** 개발 중 에러 경로를 눈으로 확인할 때 씁니다. */
export function setMockFault(next: MockFault) {
  fault = next;
}

export async function mockChatFetch(_url: string, init: RequestInit): Promise<Response> {
  const req: ChatRequest = JSON.parse(String(init.body));
  const signal = init.signal;

  /*
   * 아래 둘은 스트림이 열리기 전에 나갑니다 — 명세 "에러는 두 경로로 나갑니다".
   * 시작 전 실패(400·404·429)는 일반 HTTP, 시작 후(502)만 SSE 입니다.
   */
  if (fault === 'notFound' && req.conversationId) {
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CHAT_NOT_FOUND', message: '대화를 찾을 수 없습니다' },
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (fault === 'rateLimit') {
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CHAT_RATE_LIMITED', message: '시간당 한도를 초과했습니다' },
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const conversationId = req.conversationId ?? `cv_${Math.random().toString(36).slice(2, 8)}`;
  const text = reply(req);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const wait = (ms: number) =>
        new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, ms);
          signal?.addEventListener('abort', () => {
            clearTimeout(t);
            reject(new DOMException('aborted', 'AbortError'));
          });
        });

      try {
        controller.enqueue(frame({ conversationId }));
        await wait(220); // 첫 토큰까지의 지연

        const pieces = chunk(text);
        for (let i = 0; i < pieces.length; i++) {
          if (fault === 'upstream' && i === Math.floor(pieces.length / 3)) {
            controller.enqueue(
              frame({
                error: {
                  code: 'CHAT_UPSTREAM_ERROR',
                  message: '챗봇 서버 응답에 실패했습니다',
                },
              }),
            );
            controller.close();
            return;
          }
          if (fault === 'stall' && i === Math.floor(pieces.length / 2)) {
            await wait(8000);
          }
          controller.enqueue(frame({ delta: pieces[i] }));
          await wait(FRAME_MS);
        }

        controller.enqueue(frame({ done: true, messageId: `msg_${Date.now()}` }));
        controller.close();
      } catch {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
