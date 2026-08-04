<div align="center">

<img src="https://raw.githubusercontent.com/Likelion-YeungNam-Univ/14th-ISIX-web/main/docs/banner-closr-white.svg" width="100%" />

</div>

<br />

## 👥 팀원 소개

<div align="center">

<table>
  <tr>
    <td align="center" width="120"><a href="https://github.com/knayoung0"><img src="https://github.com/knayoung0.png" width="100"/><br/>구나영</a></td>
    <td align="center" width="120"><a href="https://github.com/copepb"><img src="https://github.com/copepb.png" width="100"/><br/>김민호</a></td>
    <td align="center" width="120"><a href="https://github.com/ryudayeong"><img src="https://github.com/ryudayeong.png" width="100"/><br/>류다영</a></td>
    <td align="center" width="120"><a href="https://github.com/hyeonseo-sung"><img src="https://github.com/hyeonseo-sung.png" width="100"/><br/>성현서</a></td>
    <td align="center" width="120"><a href="https://github.com/ckrhkdwls"><img src="https://github.com/ckrhkdwls.png" width="100"/><br/>차광진</a></td>
    <td align="center" width="120"><a href="https://github.com/user070917"><img src="https://github.com/user070917.png" width="100"/><br/>황연준</a></td>
  </tr>
</table>

</div>

## 🎯 프로젝트 소개

> **내 몸 위의 3D 가상 아틀리에**

한 장의 사진으로 3D 아바타를 생성하고, 물리 시뮬레이션 기반으로 의류 사이즈를 추천하는 가상 피팅 플랫폼입니다.

기존 가상 피팅은 대부분 2D 이미지 합성으로, 옷과 몸의 공간 관계를 계산하지 않습니다.
**CLOSR는 합성이 아니라 물리 연산을 합니다.**

<br />

## ✨ 핵심 기능

| | 기능 | 내용 |
|:---:|---|---|
| **①** | **신체 비율 판단** | 전신 사진 1장 + 키·몸무게로 3D 아바타 생성, 12개 부위 치수 자동 계측 |
| **②** | **체형 유형 진단** | 역삼각형·직사각형·모래시계형 등 체형 타입 판정 |
| **③** | **가상 피팅** | 아바타에 의류 착용 · 360° 회전 · 핏 히트맵 · 사이즈 추천 |
| **④** | **피팅 저장** | 아바타와 피팅 결과를 계정에 저장, 재방문 시 복원 |

<br />

## 🏗 AI 아키텍처

**[사전 계산 · GPU]** 표준 마네킹 → 패턴 18개 → 체형 12구간 드레이핑 → GLB 216개

**[실시간 · CPU]** 사진 → β → 3D 메시 → 치수 12개 → 최근접 GLB 조회

의류 시뮬레이션은 1벌당 30초~2분 소요 → 런타임 실행 불가.
의류 6종 × 사이즈 3 × 체형 12구간 = **216개 사전 계산**, 실시간엔 최근접 결과 조회.

<br />

## 🚀 로컬 실행

```bash
# 1. 레포 클론
git clone https://github.com/Likelion-YeungNam-Univ/14th-ISIX-ai.git
git clone https://github.com/Likelion-YeungNam-Univ/14th-ISIX-was.git
git clone https://github.com/Likelion-YeungNam-Univ/14th-ISIX-web.git

# 2. AI 서버 (Python 3.9+)
cd 14th-ISIX-ai
python -m venv venv && source venv/bin/activate
pip install -c constraints.txt -r requirements.txt   # -c 필수
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# 3. BE 서버 (Java 17+, Gradle)
cd 14th-ISIX-was && ./gradlew bootRun

# 4. FE
cd 14th-ISIX-web && npm install && npm run dev
```

> **AI 서버 두 가지 주의**
> - `pip install` 에 `-c constraints.txt` 를 빼면 numpy가 2.x로 올라가 mediapipe가 동작하지 않습니다.
> - SMPL-X 모델은 재배포 금지 라이선스라 저장소에 없습니다.
>   [직접 다운로드](https://smpl-x.is.tue.mpg.de) 후 `assets/models/smplx/SMPLX_FEMALE.npz` 에 배치하세요.

<br />

---

## 🖥 이 저장소 — 프론트엔드 (React)

3D 가상 피팅 플랫폼 프론트엔드입니다.

멋쟁이사자처럼 해커톤 ISIX 2026

---

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수

```bash
cp .env.example .env
```

### 3. 개발 서버

```bash
npm run dev
```

http://localhost:5173

백엔드(8080)와 AI 서버(8000)도 함께 켜져 있어야 전체 흐름을 확인할 수 있습니다.

---

## 폴더 구조

```
src/
├─ api/                axios 인스턴스 · API 호출 함수
│  ├─ client.ts        BE용 · AI용 인스턴스 분리
│  ├─ avatar.ts
│  └─ fitting.ts
├─ components/
│  ├─ common/          버튼, 인풋 등 공통 UI
│  └─ layout/          Header, Footer
├─ constants/          히트맵 색상, 부위 라벨
├─ hooks/              커스텀 훅 (use*.ts)
├─ pages/
│  └─ PageName/
│     ├─ index.tsx     페이지 진입점
│     └─ components/   해당 페이지 전용 컴포넌트
├─ stores/             전역 상태 (Zustand)
├─ styles/             전역 스타일 · CSS 변수
├─ types/              타입 정의
└─ utils/
```

### 어디에 뭘 넣어야 하나

| 대상 | 위치 |
|---|---|
| axios 인스턴스 · API 함수 | `api/` |
| 여러 페이지에서 쓰는 컴포넌트 | `components/common/` |
| 헤더 · 푸터 | `components/layout/` |
| 새 페이지 | `pages/페이지명/index.tsx` |
| 커스텀 훅 | `hooks/` |
| 전역 상태 | `stores/` |
| 색상 코드 · 라벨 상수 | `constants/` |

**규칙**

1. 페이지는 `pages/페이지명/` 폴더로 만들고 `index.tsx` 를 진입점으로 사용합니다
2. 컴포넌트 안에서 axios 를 직접 쓰지 않고 `api/` 함수를 호출합니다
3. 특정 페이지에서만 쓰는 컴포넌트는 `pages/페이지명/components/` 에 넣습니다

---

## 경로 alias

`@` 가 `src` 를 가리킵니다.

```ts
import Button from '@/components/common/Button';
import { FIT_COLORS } from '@/constants/fit';
```

`vite.config.ts` 와 `tsconfig.json` 양쪽에 설정되어 있습니다.

---

## 브랜드 컬러

`tailwind.config.js` 와 `src/styles/global.css` 에 정의되어 있습니다.
하드코딩하지 않고 이 값을 사용합니다.

| 용도 | 값 | Tailwind |
|---|---|---|
| 배경 | `#0D0D0F` | `bg-bg` |
| 카드 | `#17171B` | `bg-card` |
| 보더 | `#2A2A30` | `border-border` |
| 텍스트 | `#F2EFE9` | `text-text` |
| 보조 텍스트 | `#8C8880` | `text-text-sub` |
| 포인트 | `#C9A96A` | `text-gold` |

---

## 히트맵 색상 — 고정

여유량 판정 색상은 AI 파트가 계산한 값과 1:1로 대응합니다. 임의로 바꾸지 않습니다.

| 여유량 | 판정 | 색상 | Tailwind |
|---|---|---|---|
| +8cm 이상 | 헐렁 | `#2E86C1` | `text-fit-loose` |
| +2 ~ +8cm | 적정 | `#27AE60` | `text-fit-good` |
| 0 ~ +2cm | 타이트 | `#D68910` | `text-fit-snug` |
| 0cm 미만 | 불가 | `#C0392B` | `text-fit-tight` |

**색상만으로 정보를 전달하지 않습니다.** 항상 수치를 병기하고 범례를 표시합니다.

---

## 아바타 생성은 폴링

최대 30초가 걸리는 비동기 작업입니다.

```
POST /api/v1/avatars        → 202 + jobId
GET  /api/v1/avatars/{job}  → 2초 간격 폴링
```

**단계별 진행 상태를 반드시 표시합니다.**
30초 동안 스피너만 돌면 사용자가 이탈합니다.

```
사진 분석 중 → 체형 추정 중 → 치수 계측 중 → 완료
```

---

## 3D 뷰어

three.js / react-three-fiber 를 사용합니다.

**주의**

- GLB 는 수 MB 이므로 로딩 인디케이터가 필수입니다
- 이전 모델을 유지하다 새 모델 로드 완료 시 교체합니다 (깜빡임 방지)
- 30fps 이상 유지
- **피팅룸에서는 배경 애니메이션을 끕니다.** GPU 를 3D 뷰어에 집중시켜야 합니다

---

## 주의사항

**`access_token` 을 localStorage 에 저장하지 않습니다.**
메모리에 보관하고, 새로고침 시 refresh 로 복구합니다.

**`VITE_` 접두사 변수는 브라우저에 그대로 노출됩니다.**
비밀키·시크릿을 절대 넣지 않습니다.

**오류는 원인과 개선 방법을 함께 제시합니다.**
"실패했습니다"로 끝내면 사용자가 다시 시도할 수 없습니다.

---

## 라이선스

MIT License. `LICENSE` 참고.

AI 파트(`14th-ISIX-ai`)가 사용하는 SMPL-X 모델은 **비상업 학술 라이선스**로
별도 조건이 적용됩니다. 상업적 이용 검토 시 해당 저장소의 라이선스 항목을 확인하세요.

<br />

<div align="center">

<img src="https://raw.githubusercontent.com/Likelion-YeungNam-Univ/14th-ISIX-web/main/docs/footer.svg" width="100%" />

</div>
