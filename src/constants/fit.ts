/**
 * 핏 판정 색상.
 *
 * AI 파트가 계산한 여유량 값을 색으로 매핑합니다.
 * 값을 임의로 바꾸면 3D 뷰와 리포트의 색이 어긋납니다.
 */

export const FIT_COLORS = {
  loose: '#2E86C1',
  good: '#27AE60',
  snug: '#D68910',
  tight: '#C0392B',
} as const;

export const FIT_LABELS = {
  loose: '헐렁',
  good: '적정',
  snug: '타이트',
  tight: '착용 불가',
} as const;

/** 색상만으로 정보를 전달하지 않습니다. 항상 수치를 병기합니다. */
export const FIT_LEGEND = [
  { verdict: 'loose', range: '+8cm 이상', color: FIT_COLORS.loose, label: FIT_LABELS.loose },
  { verdict: 'good', range: '+2 ~ +8cm', color: FIT_COLORS.good, label: FIT_LABELS.good },
  { verdict: 'snug', range: '0 ~ +2cm', color: FIT_COLORS.snug, label: FIT_LABELS.snug },
  { verdict: 'tight', range: '0cm 미만', color: FIT_COLORS.tight, label: FIT_LABELS.tight },
] as const;
