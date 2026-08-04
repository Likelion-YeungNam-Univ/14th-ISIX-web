# CLOSR - 🦁멋쟁이사자처럼 해커톤🦁

<div align="center">

<img src="https://raw.githubusercontent.com/Likelion-YeungNam-Univ/14th-ISIX-web/main/docs/banner-closr-white.svg" width="100%" />

</div>

<!-- 표지 이미지가 준비되면 위 배너 아래에 추가하세요 -->

<br>

## 👨‍💻 Team

|                                                              P&D                                                              |                                                            FE                                                            |                                                           FE                                                           |                                                             AI                                                             |                                                            BE                                                            |                                                             BE                                                             |
| :---------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------: |
| <img src="https://avatars.githubusercontent.com/knayoung0" height="100"/> <br> [구나영](https://github.com/knayoung0) | <img src="https://avatars.githubusercontent.com/copepb" height="100"/> <br> [김민호](https://github.com/copepb) | <img src="https://avatars.githubusercontent.com/hyeonseo-sung" height="100"/> <br> [성현서](https://github.com/hyeonseo-sung) | <img src="https://avatars.githubusercontent.com/ryudayeong" height="100"/> <br> [류다영](https://github.com/ryudayeong) | <img src="https://avatars.githubusercontent.com/ckrhkdwls" height="100"/> <br> [차광진](https://github.com/ckrhkdwls) | <img src="https://avatars.githubusercontent.com/user070917" height="100"/> <br> [황연준](https://github.com/user070917) |

<!-- 단체 사진이 있으면 여기에 추가하세요 -->

<br>

## 📖 서비스 소개

> **내 몸 위의 3D 가상 아틀리에**

<!-- 서비스 개요 이미지 자리 -->

한 장의 사진으로 3D 아바타를 생성하고, 물리 시뮬레이션 기반으로 의류 사이즈를 추천하는 가상 피팅 플랫폼입니다.

기존 가상 피팅은 대부분 2D 이미지 합성으로, 옷과 몸의 공간 관계를 계산하지 않습니다.

**CLOSR는 합성이 아니라 물리 연산을 합니다.**

---

## ✨ 핵심 기능

<!-- 서비스 흐름도 · 주요 기능 이미지 자리 -->

### ① 신체 비율 판단
전신 사진 1장 + 키·몸무게로 3D 아바타를 생성하고, 12개 부위 치수를 자동 계측합니다.

### ② 체형 유형 진단
역삼각형·직사각형·모래시계형 등 체형 타입을 판정합니다.

### ③ 가상 피팅
아바타에 의류를 착용하고 360° 회전 · 핏 히트맵 · 사이즈 추천을 제공합니다.

### ④ 피팅 저장
아바타와 피팅 결과를 계정에 저장해 재방문 시 복원합니다.

---

## 📐 Architecture

<!-- 아키텍처 다이어그램 이미지 자리 -->

```
[React]  ──→  [Spring Boot]  ──HTTP──→  [FastAPI · AI]
```

**사전 계산 · GPU** — 표준 마네킹 → 패턴 18개 → 체형 12구간 드레이핑 → GLB 216개

**실시간 · CPU** — 사진 → β → 3D 메시 → 치수 12개 → 최근접 GLB 조회

의류 시뮬레이션은 1벌당 30초~2분이 걸려 런타임 실행이 불가능합니다.
의류 6종 × 사이즈 3 × 체형 12구간 = **216개를 사전 계산**하고, 실시간에는 최근접 결과를 조회합니다.

---

## 🚀 실행

```bash
git clone https://github.com/Likelion-YeungNam-Univ/14th-ISIX-web.git
cd 14th-ISIX-web

cp .env.example .env
npm install
npm run dev
```

> Node 18 이상이 필요합니다. 개발 서버는 `http://localhost:5173` 에서 열립니다.

---

## 👋 Commit Message 규칙

| **메시지 타입** | **설명**                                                    |
| --------------- | ----------------------------------------------------------- |
| **feat**        | ✨ 새로운 기능 추가 및 기존 기능 수정                       |
| **fix**         | 🐛 버그 수정                                                |
| **docs**        | 📚 문서 및 주석 수정                                        |
| **style**       | 🎨 코드 스타일 및 포맷팅 수정                               |
| **refactor**    | ♻️ 기능 변화 없는 코드 리팩터링                             |
| **test**        | ✅ 테스트 코드 추가/수정                                    |
| **chore**       | 🔧 패키지 매니저 수정 및 기타 잡다한 변경(ex: `.gitignore`) |
| **merge**       | 🔀 브랜치 병합                                              |

💡 **사용 예시**
feat: 아바타 생성 API 연결
fix: 목둘레 계측 실패 수정

<br>

## 🧠 Branch Strategy

### GitHub Flow

| 브랜치 | 역할 |
| ------ | ---- |
| **main** | 배포 가능한 상태만 유지 |
| **dev**  | 개발 통합 브랜치. 항상 최신 상태 유지 |
| **작업 브랜치** | dev 에서 분기해 기능 단위로 작업 |

- 모든 작업은 dev 에서 분기한 브랜치에서 진행합니다
- 이슈 생성 → 브랜치 생성 → 개발 완료 후 dev 로 PR
- 리뷰·테스트를 거쳐 main 으로 PR
- ⭐ PR 전에 로컬 dev 를 pull 해 최신 상태로 맞추고, 작업 브랜치에서 merge 해 conflict 를 해결한 뒤 push 합니다 ⭐

<br>

## 🌿 Branch Naming 규칙

| 형식 | 예시 |
| ---- | ---- |
| `타입/#이슈번호-작업내용` | `feat/#12-avatar-api` |

- 이슈를 먼저 생성하고, 부여된 번호를 브랜치명에 포함합니다
- 이슈에는 작업 내용을 상세히 작성합니다

<br>

## 📜 License

MIT License. 자세한 내용은 [LICENSE](LICENSE) 를 참고하세요.

단, **SMPL-X 모델과 그로부터 생성한 3D 메시**는 비상업 학술 라이선스가 적용되어
별도 조건을 따르며 저장소에 포함하지 않습니다. ([SMPL-X](https://smpl-x.is.tue.mpg.de))

<br>

<div align="center">

<img src="https://raw.githubusercontent.com/Likelion-YeungNam-Univ/14th-ISIX-web/main/docs/footer.svg" width="100%" />

</div>
