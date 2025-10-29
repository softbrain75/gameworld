# 🚀 Supabase 설정 가이드

## 1️⃣ Supabase SQL 실행

### 1단계: SQL Editor 열기
1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 프로젝트 선택: `sinelsiltmbsljpsmwev`
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2단계: Schema SQL 실행
1. `supabase_schema.sql` 파일의 전체 내용을 복사
2. SQL Editor에 붙여넣기
3. 우측 하단의 **RUN** 버튼 클릭
4. 성공 메시지 확인

## 2️⃣ Email Authentication 설정

### 1단계: Email Provider 활성화
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **Providers** 탭 선택
3. **Email** 찾아서 클릭

### 2단계: 이메일 인증 비활성화 (바로 가입 가능하도록)
1. **Enable Email provider** 토글 ON 상태 확인
2. **Confirm email** 옵션을 **OFF**로 설정 ⚠️ **중요!**
3. **Save** 버튼 클릭

> ⚠️ **중요**: `Confirm email`을 끄지 않으면 회원가입 후 이메일 인증을 거쳐야 로그인 가능합니다.

### 3단계: Site URL 설정 (선택사항)
1. **Settings** > **URL Configuration** 이동
2. **Site URL** 확인 (로컬 테스트: `http://localhost:3000` 또는 배포 URL)

## 3️⃣ 비밀번호 재설정 Email Template 설정 (선택사항)

### Email Templates 수정
1. **Authentication** > **Email Templates** 이동
2. **Reset Password** 템플릿 선택
3. 원하는 경우 한글 템플릿으로 수정

```html
<h2>비밀번호 재설정</h2>
<p>안녕하세요,</p>
<p>비밀번호 재설정을 요청하셨습니다.</p>
<p>아래 링크를 클릭하여 비밀번호를 재설정해주세요:</p>
<p><a href="{{ .ConfirmationURL }}">비밀번호 재설정하기</a></p>
```

## 4️⃣ 테이블 확인

### Database 확인
1. **Database** > **Tables** 이동
2. 다음 테이블이 생성되었는지 확인:
   - ✅ `profiles` - 사용자 프로필 (이메일, 포인트)
   - ✅ `game_views_logged` - 로그인 사용자 조회수
   - ✅ `game_views_anonymous` - 비로그인 사용자 조회수

### View 확인
1. **Database** > **Views** 이동
2. `game_stats` 뷰 생성 확인

## 5️⃣ Row Level Security (RLS) 정책 확인

### Policies 확인
1. **Authentication** > **Policies** 이동
2. 각 테이블별로 정책 생성 확인:

**profiles 테이블:**
- ✅ Users can view own profile (SELECT)
- ✅ Users can update own profile (UPDATE)

**game_views_logged 테이블:**
- ✅ Anyone can view game views (SELECT)
- ✅ Logged users can insert own views (INSERT)

**game_views_anonymous 테이블:**
- ✅ Anyone can insert anonymous views (INSERT)
- ✅ Anyone can view anonymous views (SELECT)

## 6️⃣ 테스트

### 회원가입 테스트
1. `index.html` 페이지 열기
2. 우측 상단 👤 버튼 클릭
3. **회원가입** 탭 선택
4. 이메일/비밀번호 입력하여 가입
5. **회원가입 완료!** 메시지 확인

### 로그인 테스트
1. 자동으로 로그인 탭으로 전환됨
2. 입력한 이메일/비밀번호로 로그인
3. 우측 상단에 이메일 표시 확인

### 포인트 테스트
1. 게임 실행
2. 게임 종료 시 포인트 획득
3. **내 정보** 클릭하여 누적 포인트 확인

### 조회수 테스트
1. 게임 카드 클릭
2. 📊 통계 버튼 클릭
3. 조회수 증가 확인

## 🔧 문제 해결

### "Email not confirmed" 오류
**원인**: Confirm email 옵션이 켜져 있음
**해결**: Authentication > Providers > Email에서 **Confirm email OFF**

### 로그인 시 "Invalid login credentials"
**원인**: 이메일/비밀번호 불일치
**해결**: 회원가입 다시 시도 또는 비밀번호 재설정

### 프로필이 생성되지 않음
**원인**: 트리거가 실행되지 않음
**해결**: SQL Editor에서 아래 쿼리 실행
```sql
SELECT * FROM auth.users;
SELECT * FROM public.profiles;
```
profiles 테이블에 데이터가 없으면 트리거 재생성

### RLS 정책 오류
**원인**: 정책이 올바르게 설정되지 않음
**해결**: supabase_schema.sql 전체를 다시 실행

## 📊 데이터 확인 쿼리

### 전체 사용자 확인
```sql
SELECT
    p.email,
    p.total_points,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
```

### 게임별 조회수 확인
```sql
SELECT * FROM game_stats
ORDER BY total_views DESC;
```

### 특정 사용자 포인트 확인
```sql
SELECT email, total_points
FROM profiles
WHERE email = 'your@email.com';
```

## ✅ 설정 완료 체크리스트

- [ ] supabase_schema.sql 실행 완료
- [ ] Email Provider 활성화
- [ ] Confirm email 옵션 OFF
- [ ] profiles 테이블 생성 확인
- [ ] game_views_logged 테이블 생성 확인
- [ ] game_views_anonymous 테이블 생성 확인
- [ ] game_stats 뷰 생성 확인
- [ ] RLS 정책 생성 확인
- [ ] 회원가입 테스트 성공
- [ ] 로그인 테스트 성공
- [ ] 포인트 시스템 작동 확인

## 🎮 다음 단계

설정이 완료되면:
1. 각 게임 파일에 Supabase 연동 추가
2. 게임 종료 시 포인트 적립 기능 구현
3. 조회수 자동 증가 기능 테스트

자세한 내용은 `js/supabaseClient.js` 파일 참조!
