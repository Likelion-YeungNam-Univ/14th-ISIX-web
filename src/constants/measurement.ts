/**
 * 신체 부위 12개.
 *
 * AI 파트가 정의한 키를 그대로 사용합니다. 임의로 바꾸지 않습니다.
 */

export const MEASUREMENT_LABELS: Record<string, string> = {
  shoulder_width: '어깨너비',
  chest_circ: '가슴둘레',
  waist_circ: '허리둘레',
  hip_circ: '엉덩이둘레',
  neck_circ: '목둘레',
  arm_circ: '팔둘레',
  thigh_circ: '허벅지둘레',
  back_length: '등길이',
  sleeve_length: '소매길이',
  inseam: '인심',
  total_length: '총장',
  front_width: '앞품',
};

export const MEASUREMENT_ORDER = [
  'shoulder_width',
  'chest_circ',
  'waist_circ',
  'hip_circ',
  'neck_circ',
  'arm_circ',
  'thigh_circ',
  'back_length',
  'sleeve_length',
  'inseam',
  'total_length',
  'front_width',
] as const;
