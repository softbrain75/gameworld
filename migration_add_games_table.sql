-- ============================================
-- 게임 메타데이터 테이블 추가 및 데이터 마이그레이션
-- ============================================

-- 1. games 테이블 생성 (게임 메타데이터)
CREATE TABLE IF NOT EXISTS public.games (
    game_url TEXT PRIMARY KEY,
    release_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS trg_games_set_updated_at ON public.games;
CREATE TRIGGER trg_games_set_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. RLS 활성화
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 SELECT 가능
DROP POLICY IF EXISTS "Games: select all" ON public.games;
CREATE POLICY "Games: select all" ON public.games
  FOR SELECT USING (TRUE);

-- 3. game_stats VIEW 업데이트 (release_date 포함)
CREATE OR REPLACE VIEW public.game_stats AS
WITH urls AS (
  SELECT game_url FROM public.game_views_logged
  UNION
  SELECT game_url FROM public.game_views_anonymous
  UNION
  SELECT game_url FROM public.games
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
  COALESCE(l.logged_views, 0) + COALESCE(a.anonymous_views, 0) AS total_views,
  g.release_date
FROM urls u
LEFT JOIN logged l USING (game_url)
LEFT JOIN anon   a USING (game_url)
LEFT JOIN public.games g USING (game_url);

-- 4. 권한 설정
GRANT SELECT ON public.games TO anon, authenticated;
GRANT SELECT ON public.game_stats TO anon, authenticated;

-- ============================================
-- 5. games.json 데이터 마이그레이션 (games.json에서 추출한 모든 게임)
-- ============================================

-- 기존 데이터 삭제 (재실행 시)
DELETE FROM public.games;

-- games.json의 모든 게임 INSERT
INSERT INTO public.games (game_url, release_date) VALUES
('galaxy_war.html', '2025-09-15'),
('xwing.html', '2025-09-20'),
('cannon_defender.html', '2025-09-22'),
('line_draw_defense.html', '2025-09-25'),
('ninja_slash.html', '2025-09-28'),
('punch_rush.html', '2025-10-01'),
('archer_master.html', '2025-10-03'),
('endless_runner.html', '2025-10-05'),
('zombie_survival.html', '2025-08-20'),
('space_invaders.html', '2025-08-15'),
('fighter_battle.html', '2025-10-07'),
('baseball_slugger.html', '2025-10-08'),
('tetris.html', '2025-08-10'),
('2048_explosion.html', '2025-08-12'),
('match3_mania.html', '2025-08-18'),
('ice_breaker.html', '2025-08-25'),
('color_flow.html', '2025-09-01'),
('maze_escape.html', '2025-09-05'),
('memory_match.html', '2025-09-10'),
('word_guess.html', '2025-09-12'),
('tab_mania.html', '2025-07-15'),
('tabtabtab.html', '2025-07-20'),
('target_shooter.html', '2025-07-25'),
('spin_master.html', '2025-08-01'),
('hoop_mania.html', '2025-08-05'),
('lightning_reaction.html', '2025-08-08'),
('whack_mole.html', '2025-07-10'),
('breakout.html', '2025-07-05'),
('pong.html', '2025-07-01'),
('balloon_pop.html', '2025-08-10'),
('piano_tiles.html', '2025-06-15'),
('drum_beat.html', '2025-06-20'),
('guitar_hero.html', '2025-06-25'),
('dance_revolution.html', '2025-07-01'),
('beat_drop.html', '2025-07-05'),
('snake_classic.html', '2025-06-10'),
('flappy_dragon.html', '2025-06-05'),
('bubble_pop.html', '2025-06-01'),
('lucky_dice.html', '2025-05-28'),
('candy_crush.html', '2025-05-25'),
('box_open.html', '2025-05-20'),
('jump_master.html', '2025-05-15'),
('speed_racing.html', '2025-05-10'),
('doodle_jump.html', '2025-05-05'),
('clicker_hero.html', '2025-05-01'),
('number_quiz.html', '2025-04-28'),
('tower_defense.html', '2025-04-25'),
('chess_master.html', '2025-04-20'),
('card_battle.html', '2025-04-15'),
('kingdom_builder.html', '2025-04-10'),
('battle_tactics.html', '2025-04-05'),
('brain_puzzle.html', '2025-04-01'),
('omok.html', '2025-03-28'),
('yut_nori.html', '2025-03-25'),
('gostop_online.html', '2025-09-18'),
('airhockey_online.html', '2025-09-30'),
('parkour_3d.html', '2025-10-09'),
('tofu_girl.html', '2025-10-09'),
('dart_game.html', '2025-10-10');
