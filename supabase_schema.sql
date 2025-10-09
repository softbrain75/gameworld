-- ============================================
-- 게임세상 Supabase Database Schema (Revised)
-- ============================================

-- 0) 필수 확장
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 프로필
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 이메일은 소문자 정규화 권장 (선택)
CREATE OR REPLACE FUNCTION public.normalize_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := LOWER(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_normalize_email ON public.profiles;
CREATE TRIGGER trg_profiles_normalize_email
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.normalize_email();

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. 로그인 사용자 조회수
CREATE TABLE IF NOT EXISTS public.game_views_logged (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_url TEXT NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- "하루 1회" 제한용 유니크 인덱스 (Asia/Seoul 기준 날짜)
-- ※ UTC 기준이면 AT TIME ZONE 'UTC' 로 변경
DROP INDEX IF EXISTS ux_gvl_user_game_day;
CREATE UNIQUE INDEX ux_gvl_user_game_day
ON public.game_views_logged (
  user_id, 
  game_url, 
  ((viewed_at AT TIME ZONE 'Asia/Seoul')::date)
);

-- 조회 튜닝 인덱스
CREATE INDEX IF NOT EXISTS ix_gvl_game_time ON public.game_views_logged (game_url, viewed_at DESC);
CREATE INDEX IF NOT EXISTS ix_gvl_user_time ON public.game_views_logged (user_id, viewed_at DESC);

-- 3. 익명 조회수
CREATE TABLE IF NOT EXISTS public.game_views_anonymous (
    id BIGSERIAL PRIMARY KEY,
    game_url TEXT NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_gva_game_time ON public.game_views_anonymous (game_url, viewed_at DESC);

-- (선택) 간단한 중복 방지용 fingerprint 컬럼
-- ALTER TABLE public.game_views_anonymous ADD COLUMN IF NOT EXISTS fingerprint TEXT;
-- CREATE INDEX IF NOT EXISTS ix_gva_fpr_game_day
--   ON public.game_views_anonymous (fingerprint, game_url, ((viewed_at AT TIME ZONE 'Asia/Seoul')::date));

-- 4. 통계 뷰 (두 테이블의 URL 합집합 기준)
CREATE OR REPLACE VIEW public.game_stats AS
WITH urls AS (
  SELECT game_url FROM public.game_views_logged
  UNION
  SELECT game_url FROM public.game_views_anonymous
),
logged AS (
  SELECT game_url, COUNT(DISTINCT user_id) AS logged_views
  FROM public.game_views_logged
  GROUP BY game_url
),
anon AS (
  SELECT game_url, COUNT(*) AS anonymous_views
  FROM public.game_views_anonymous
  GROUP BY game_url
)
SELECT 
  u.game_url,
  COALESCE(l.logged_views, 0)       AS logged_views,
  COALESCE(a.anonymous_views, 0)    AS anonymous_views,
  COALESCE(l.logged_views, 0) + COALESCE(a.anonymous_views, 0) AS total_views
FROM urls u
LEFT JOIN logged l USING (game_url)
LEFT JOIN anon   a USING (game_url);

-- 5. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_views_logged ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_views_anonymous ENABLE ROW LEVEL SECURITY;

-- profiles: 본인만 SELECT/UPDATE
DROP POLICY IF EXISTS "Profiles: select own" ON public.profiles;
CREATE POLICY "Profiles: select own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Profiles: update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- game_views_logged: 모두 SELECT 가능, 본인만 INSERT
DROP POLICY IF EXISTS "GVL: select all" ON public.game_views_logged;
CREATE POLICY "GVL: select all" ON public.game_views_logged
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "GVL: insert own" ON public.game_views_logged;
CREATE POLICY "GVL: insert own" ON public.game_views_logged
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- game_views_anonymous: 모두 SELECT/INSERT 가능
DROP POLICY IF EXISTS "GVA: select all" ON public.game_views_anonymous;
CREATE POLICY "GVA: select all" ON public.game_views_anonymous
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "GVA: insert all" ON public.game_views_anonymous;
CREATE POLICY "GVA: insert all" ON public.game_views_anonymous
  FOR INSERT WITH CHECK (TRUE);

-- 6. 회원가입 시 프로필 생성 (auth.users 트리거)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, total_points)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(LOWER(NEW.email), LOWER(NEW.raw_user_meta_data->>'email')),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. 포인트 업데이트
CREATE OR REPLACE FUNCTION public.update_user_points(p_user_id UUID, p_points_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE public.profiles
  SET total_points = total_points + p_points_to_add
  WHERE id = p_user_id
  RETURNING total_points INTO new_total;

  RETURN new_total;
END;
$$;

-- 8. 조회수 증가 (로그인 사용자) - auth.uid() 내부 사용으로 더 안전
CREATE OR REPLACE FUNCTION public.increment_game_view_logged(p_game_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.game_views_logged (user_id, game_url)
  VALUES (uid, p_game_url)
  ON CONFLICT ON CONSTRAINT ux_gvl_user_game_day DO NOTHING;

  RETURN TRUE;
END;
$$;

-- 9. 조회수 증가 (비로그인)
CREATE OR REPLACE FUNCTION public.increment_game_view_anonymous(p_game_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.game_views_anonymous (game_url)
  VALUES (p_game_url);
  RETURN TRUE;
END;
$$;

-- 10. 권한 설정 (Supabase 권장)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.game_stats TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_user_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_game_view_logged(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_game_view_anonymous(TEXT) TO anon, authenticated;
