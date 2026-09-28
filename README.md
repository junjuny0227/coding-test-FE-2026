# 프론트엔드 신입 코딩테스트

**과제 설명은 [`PROBLEM.md`](./PROBLEM.md)를 먼저 읽어 주세요.**

## 실행

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run typecheck
npm run build
```

- **Node.js 22.22 이상** (LTS 24 권장, `node -v` 로 확인). 버전이 낮으면 `npm install` 이 실패합니다.
- 스택: React 19 + TypeScript + Vite, Mock API: MSW, 테스트: Vitest + Testing Library

## 폴더 구조

```
src/
├── api/                # 응답 타입 및 요청 함수
├── mocks/              # Mock 서버 (수정 금지)
├── test/setup.ts       # 테스트 환경 설정 (MSW 연결됨)
├── utils/              # 표시 규칙과 테스트
├── App.tsx             # 목록·검색·URL 상태
├── App.test.tsx        # 화면 동작 테스트
├── SlideDetailPanel.tsx # 상세·heatmap
└── main.tsx
```

---

## 지원자 작성란

### 구현한 항목

- 슬라이드 목록(20건씩 페이지 이동), 검색(300ms 디바운스), 목록·상세 로딩/오류/빈 상태 및 재시도
- 상세 이미지·Ki67/세포 수/분석 시각, heatmap 표시 토글 및 투명도 조절
- 환자명 마스킹, KST 시간 변환, 한글 상태·수치 포맷, URL 검색어/페이지/선택 동기화
- 방향키로 목록 포커스 이동·Enter 선택, Vitest 화면/API/표시 규칙 테스트
- 의료 데이터 작업 화면에 맞춰 검사 목록/이미지 판독면/분석 수치의 정보 계층을 재구성하고, 데스크톱 독립 스크롤·모바일 한 열 레이아웃을 적용 (`DESIGN.md` 참고)

### 구현하지 못한 항목 / 이유

- 현장 추가 요구사항은 아직 전달받지 않아 반영하지 않았습니다.

### 시간이 더 있었다면

- 이미지 확대/이동과 모바일 사용성 검증을 확장하고, API 응답 형식 변경에 대비한 변환 계층을 추가하고 싶습니다.
