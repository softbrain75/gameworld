# Firebase 설정 가이드 - 온라인 고스톱

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "gostop-online")
4. Google Analytics 사용 여부 선택 (선택사항)
5. "프로젝트 만들기" 클릭

## 2단계: Realtime Database 설정

1. 좌측 메뉴에서 "빌드" → "Realtime Database" 클릭
2. "데이터베이스 만들기" 클릭
3. 위치 선택 (asia-southeast1 추천 - 싱가포르)
4. **보안 규칙: "테스트 모드에서 시작"** 선택
   - ⚠️ 주의: 테스트 모드는 30일 후 만료됩니다
5. "사용 설정" 클릭

## 3단계: 보안 규칙 설정 (중요!)

데이터베이스가 생성되면 "규칙" 탭으로 이동하여 다음 규칙을 붙여넣기:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        ".indexOn": ["status", "createdAt"]
      }
    }
  }
}
```

"게시" 버튼을 클릭하여 규칙 적용

## 4단계: 웹 앱 추가

1. 프로젝트 개요 페이지로 이동
2. "웹 앱에 Firebase 추가" 아이콘(</>)  클릭
3. 앱 닉네임 입력 (예: "GoStop Web")
4. "Firebase Hosting 설정" 체크 해제 (선택사항)
5. "앱 등록" 클릭

## 5단계: Config 정보 복사

다음과 같은 코드가 표시됩니다:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

이 config 정보를 복사하세요!

## 6단계: gostop_online.html 파일 수정

1. `gostop_online.html` 파일을 텍스트 에디터로 열기
2. 다음 부분을 찾기:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. Firebase Console에서 복사한 config 정보로 **전체 교체**
4. 파일 저장

## 7단계: 테스트

1. `gostop_online.html` 파일을 브라우저에서 열기
2. "방 만들기" 클릭
3. 다른 브라우저/탭에서 같은 파일 열기
4. "방 참가하기" → 방 코드 입력
5. 게임 시작!

## 문제 해결

### "Firebase config가 설정되지 않았습니다" 에러
- firebaseConfig의 모든 "YOUR_XXX" 값을 실제 Firebase 정보로 교체했는지 확인

### "Permission denied" 에러
- Firebase Console → Realtime Database → 규칙 탭에서 위의 보안 규칙이 올바르게 설정되었는지 확인

### 데이터베이스에 연결되지 않음
- databaseURL이 올바른지 확인 (asia-southeast1 또는 다른 리전)
- 브라우저 콘솔(F12)에서 에러 메시지 확인

### 방에 참가할 수 없음
- 두 브라우저가 같은 Firebase 프로젝트를 사용하는지 확인
- 방 코드를 정확히 입력했는지 확인 (대소문자 구분 없음)

## Vercel 배포

이 게임은 Vercel에서 바로 배포 가능합니다:

1. GitHub 저장소에 코드 푸시
2. Vercel에서 "New Project" 클릭
3. GitHub 저장소 선택
4. 배포 완료!

Firebase는 클라이언트 사이드에서 작동하므로 Vercel 서버 설정 불필요합니다.

## 보안 강화 (운영 환경)

테스트가 끝나면 보안 규칙을 강화하세요:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "!data.exists() || data.child('player1').child('id').val() == auth.uid || data.child('player2').child('id').val() == auth.uid",
        ".indexOn": ["status", "createdAt"]
      }
    }
  }
}
```

---

## 게임 규칙

- **목표**: 7점 이상 획득 후 "스톱" 외치기
- **쪽**: 손패와 바닥 카드 1장씩 매칭
- **따닥**: 손패와 바닥 카드 2장 매칭
- **쓰리고**: 손패와 바닥 카드 3장 매칭 (11월 오동만 가능)
- **흔들기**: 바닥에 같은 달 카드 3장 이상 → 보너스 점수
- **고**: 3점 이상일 때 게임 계속 (점수 배율 x2)
- **스톱**: 게임 종료 및 승리

즐거운 게임 되세요! 🎴
