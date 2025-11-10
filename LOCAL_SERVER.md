# 🎮 로컬 서버 실행 가이드

## 개요
이 프로젝트는 로컬 서버에서 실행해야 합니다. (CORS 정책 때문)

## 사전 준비

### 1️⃣ Node.js 설치 (필수)

Windows, Mac, Linux 모두 지원합니다.

**다운로드**: https://nodejs.org/
- **LTS 버전** (장기 지원) 추천
- 설치 후 **컴퓨터 재부팅** 필수

**설치 확인**:
```bash
node --version
npm --version
```

---

## 서버 시작 방법

### ✨ 가장 간단한 방법 (Windows)

`run_server.bat` 파일을 **더블클릭**하면 됩니다!

### 또는 명령어로 실행

게임 폴더에서 다음 명령어 실행:

```bash
node server.js
```

---

## 게임 플레이

### 1️⃣ 브라우저 열기
- 주소창에 `http://localhost:8000` 입력

### 2️⃣ 게임 선택

**Main Page (메인 페이지)**
- http://localhost:8000/

**Memory Game (애국가 학습 게임)**
- http://localhost:8000/Memory.html

### 3️⃣ 여러 MD 파일 사용하기

#### a) 새로운 MD 파일 생성
게임 폴더에 새 파일을 만듭니다:
```
game_folder/
├── Memory.html         (게임 HTML)
├── memory.md          (애국가 - 기존)
├── history.md         (역사 용어 - 새로)
├── science.md         (과학 용어 - 새로)
└── ...
```

#### b) HTML 파일 복제
```bash
# Memory.html을 History.html로 복사
cp Memory.html History.html

# Memory.html을 Science.html로 복사
cp Memory.html Science.html
```

#### c) HTML 파일 수정

각 HTML 파일에서 `loadLyrics()` 함수의 fetch 부분을 수정합니다:

**Memory.html** (애국가)
```javascript
return fetch('memory.md')
```

**History.html** (역사)
```javascript
return fetch('history.md')
```

**Science.html** (과학)
```javascript
return fetch('science.md')
```

---

## MD 파일 포맷

### 형식
```markdown
# 제목

첫 번째 라인의 내용

**bold로 처리할 중요 단어** 그 외 단어들

또 다른 라인 **strong word** 계속
```

### 예시 (memory.md)
```markdown
# 애국가 가사

동해 물과 **백두산**이 마르고 닳도록

하느님이 보우하사 **우리나라** 만세

무궁화 삼천리 화려강산

대한 사람 **대한으로** 길이 보전하세
```

### 중요!
- **각 라인은 비워야** 합니다 (빈 줄로 구분)
- **bold 처리** (`**단어**`)는 퀴즈로 나옵니다
- 일반 단어들은 정답으로 보여집니다

---

## 게임 설정

Memory.html/History.html 등에서 게임 모드 선택 가능:

### 무작위 모드 (Random Mode)
- 난이도 선택: 쉬움(30%), 보통(50%), 어려움(70%)
- 해당 비율만큼 무작위로 단어를 가림

### Bold 퀴즈 모드 (Bold Quiz Mode)
- MD 파일의 `**bold**` 처리된 단어만 퀴즈로 출제
- 난이도 선택 없음 (고정)

---

## 문제 해결

### ❌ "포트 8000이 이미 사용 중입니다"

**해결 방법**:

1️⃣ 기존 서버 종료 (Ctrl+C)

2️⃣ 또는 다른 포트 사용:

`server.js` 파일을 텍스트 에디터로 열어서:
```javascript
const PORT = 8000;  // 변경
```
을 다른 포트로 변경합니다 (예: 3000, 5000 등)

### ❌ "Node.js가 없습니다" 오류

**해결**: https://nodejs.org/ 에서 설치 후 **재부팅**

### ❌ md 파일이 로드되지 않음

확인 사항:
1. md 파일이 같은 폴더에 있는지?
2. fetch 경로가 정확한지? (`memory.md` vs `Memory.md`)
3. 브라우저 콘솔(F12)에서 오류 확인?

### ❌ 게임이 느립니다

- 로컬 서버는 빠르므로 브라우저 캐시 문제일 가능성
- **Ctrl+Shift+R** (강력 새로고침) 또는 시크릿 모드 사용

---

## 여러 게임 동시 관리

### 폴더 구조 예시
```
게임세상/
├── server.js              ← 로컬 서버
├── run_server.bat         ← 서버 시작 스크립트
├── index.html             ← 메인 페이지
├── Memory.html            ← 애국가 게임
├── History.html           ← 역사 게임
├── Science.html           ← 과학 게임
├── memory.md              ← 애국가 콘텐츠
├── history.md             ← 역사 콘텐츠
└── science.md             ← 과학 콘텐츠
```

### 새 게임 추가 방법

1. MD 파일 생성 (`newgame.md`)
2. HTML 파일 생성 (`NewGame.html`)
3. `Memory.html` 복사해서 fetch 경로 수정
4. 로컬 서버에서 `http://localhost:8000/NewGame.html` 접속

---

## 서버 중지

터미널/CMD에서 **Ctrl+C** 눌러서 중지합니다.

---

## 배포 (Vercel)

로컬 테스트 완료 후:

```bash
git add .
git commit -m "게임 추가"
git push
```

Vercel에서 자동으로 배포됩니다.
(배포 가이드: `배포.md` 참조)

---

## 참고 자료

- [Node.js 공식 사이트](https://nodejs.org/)
- [프로젝트 구조](CLAUDE.md)
- [배포 가이드](배포.md)

---

**질문이나 문제가 있으면 콘솔(F12)의 에러 메시지를 확인하세요!**
