-- ============================================
-- users 테이블에 deleted_at 컬럼 추가
-- 소프트 삭제를 위한 마이그레이션
-- ============================================

-- 1. profiles 테이블에 deleted_at 컬럼 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. deleted_at에 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
ON public.profiles(deleted_at)
WHERE deleted_at IS NULL;

-- 3. RLS 정책 업데이트: 탈퇴한 사용자는 조회 불가
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 탈퇴하지 않은 본인 프로필만 조회 가능
CREATE POLICY "Users can view own active profile"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = id
    AND deleted_at IS NULL
);

-- 탈퇴하지 않은 본인 프로필만 수정 가능
CREATE POLICY "Users can update own active profile"
ON public.profiles
FOR UPDATE
USING (
    auth.uid() = id
    AND deleted_at IS NULL
);

-- 4. username UNIQUE 제약 조건 수정: 탈퇴하지 않은 사용자만 체크
-- 기존 UNIQUE 제약 삭제
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_username_key;

-- 부분 UNIQUE 인덱스로 대체 (deleted_at IS NULL인 경우만)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_active_unique
ON public.profiles(username)
WHERE deleted_at IS NULL;

-- 5. email도 동일하게 처리 (탈퇴 후 재가입 가능)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_active_unique
ON public.profiles(email)
WHERE deleted_at IS NULL;

-- ============================================
-- 완료!
-- ============================================
-- 이제 다음 작업이 가능합니다:
-- 1. 회원 탈퇴 시 deleted_at = NOW() 설정
-- 2. 동일 email/username으로 재가입 시 deleted_at = NULL, 데이터 초기화
-- 3. 탈퇴한 사용자는 로그인 불가 (RLS 정책)
-- ============================================
