// ============================================
// Supabase Client 초기화
// ============================================

const SUPABASE_URL = 'https://sinelsiltmbsljpsmwev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbmVsc2lsdG1ic2xqcHNtd2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzYyMjEsImV4cCI6MjA3NTU1MjIyMX0.L8z-kXQGjhgx7eCexzZ_Ar9bHPQce2sVYC75hL1k8MI';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 현재 로그인된 사용자 정보
let currentUser = null;
let currentProfile = null;

// ============================================
// 인증 관련 함수
// ============================================

// 회원가입
async function signUp(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) throw error;

        // 자동으로 프로필이 생성됨 (트리거)
        return { success: true, data };
    } catch (error) {
        console.error('회원가입 오류:', error);
        return { success: false, error: error.message };
    }
}

// 로그인
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        currentUser = data.user;
        await loadUserProfile();

        return { success: true, data };
    } catch (error) {
        console.error('로그인 오류:', error);
        return { success: false, error: error.message };
    }
}

// 로그아웃
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        currentProfile = null;

        return { success: true };
    } catch (error) {
        console.error('로그아웃 오류:', error);
        return { success: false, error: error.message };
    }
}

// 현재 세션 확인
async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
            currentUser = session.user;
            await loadUserProfile();
        }

        return session;
    } catch (error) {
        console.error('세션 확인 오류:', error);
        return null;
    }
}

// 사용자 프로필 로드
async function loadUserProfile() {
    if (!currentUser) return null;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        currentProfile = data;
        return data;
    } catch (error) {
        console.error('프로필 로드 오류:', error);
        return null;
    }
}

// 비밀번호 재설정 이메일 발송
async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`,
        });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        return { success: false, error: error.message };
    }
}

// 비밀번호 업데이트
async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('비밀번호 업데이트 오류:', error);
        return { success: false, error: error.message };
    }
}

// 회원 탈퇴
async function deleteAccount() {
    try {
        if (!currentUser) {
            throw new Error('로그인이 필요합니다.');
        }

        // Supabase Admin API를 통해 사용자 삭제
        // 참고: 클라이언트에서는 직접 삭제 불가, 서버 함수 필요
        // 대신 프로필을 비활성화하거나 support에 요청하도록 안내

        // 임시 방법: 프로필 데이터 삭제 후 로그아웃
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', currentUser.id);

        if (error) throw error;

        await signOut();

        return { success: true };
    } catch (error) {
        console.error('회원 탈퇴 오류:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 포인트 관련 함수
// ============================================

// 포인트 추가
async function addPoints(points) {
    if (!currentUser) {
        console.warn('로그인하지 않은 사용자는 포인트를 저장할 수 없습니다.');
        return { success: false, error: '로그인이 필요합니다.' };
    }

    try {
        const { data, error } = await supabase.rpc('update_user_points', {
            user_id: currentUser.id,
            points_to_add: points
        });

        if (error) throw error;

        // 프로필 다시 로드
        await loadUserProfile();

        return { success: true, newTotal: data };
    } catch (error) {
        console.error('포인트 추가 오류:', error);
        return { success: false, error: error.message };
    }
}

// 현재 포인트 가져오기
function getCurrentPoints() {
    if (currentProfile) {
        return currentProfile.total_points;
    }
    // 비로그인 사용자는 localStorage에서 가져오기
    return parseInt(localStorage.getItem('guest_total_points') || '0');
}

// 비로그인 사용자 포인트 저장 (localStorage)
function saveGuestPoints(points) {
    const currentPoints = parseInt(localStorage.getItem('guest_total_points') || '0');
    const newTotal = currentPoints + points;
    localStorage.setItem('guest_total_points', newTotal.toString());
    return newTotal;
}

// 게임 시작 시 통합 포인트를 게임 점수로 사용 (포인트 차감)
async function usePointsForGameStart() {
    const currentPoints = getCurrentPoints();

    console.log('🎮 Using points for game start:', { currentPoints, currentUser: !!currentUser });

    // 통합 포인트는 유지하고, 업그레이드용 초기 점수만 반환
    if (currentUser && currentProfile) {
        console.log('✅ Points loaded from Supabase:', { startingScore: currentPoints });
        return { success: true, startingScore: currentPoints };
    } else {
        console.log('✅ Points loaded from localStorage:', { startingScore: currentPoints });
        return { success: true, startingScore: currentPoints };
    }
}

// 게임 종료 시 점수를 통합 포인트로 적립
async function addGamePoints(gameScore, gameId) {
    // 게임 점수를 그대로 포인트로 변환
    const pointsToAdd = Math.floor(gameScore);

    console.log('🎮 Adding points:', { gameScore, pointsToAdd, gameId, currentUser: !!currentUser });

    if (currentUser && currentProfile) {
        // 로그인 사용자: Supabase에 직접 포인트 추가
        try {
            const newTotal = currentProfile.total_points + pointsToAdd;

            const { data, error } = await supabase
                .from('profiles')
                .update({ total_points: newTotal })
                .eq('id', currentUser.id)
                .select();

            if (error) throw error;

            console.log('✅ Points added to Supabase:', { newTotal });

            // 프로필 다시 로드
            await loadUserProfile();

            return { success: true, newTotal };
        } catch (error) {
            console.error('❌ Error adding points:', error);
            return { success: false, error: error.message };
        }
    } else {
        // 비로그인 사용자: localStorage에 포인트 저장
        const newTotal = saveGuestPoints(pointsToAdd);
        console.log('✅ Points added to localStorage:', { newTotal });
        return { success: true, newTotal };
    }
}

// ============================================
// 조회수 관련 함수
// ============================================

// 게임 조회수 증가 (모두 anonymous_views로 기록)
async function incrementGameView(gameUrl) {
    try {
        // localStorage로 하루 1회 중복 체크
        const today = new Date().toISOString().split('T')[0];
        const viewKey = `view_${gameUrl}_${today}`;

        if (!localStorage.getItem(viewKey)) {
            // 오늘 처음 보는 경우만 카운트
            localStorage.setItem(viewKey, 'true');

            // Supabase anonymous_views 테이블에 직접 INSERT
            const { error } = await supabase
                .from('game_views_anonymous')
                .insert({ game_url: gameUrl });

            if (error) {
                console.error('조회수 기록 실패:', error);
                throw error;
            }
            console.log('✅ View recorded:', gameUrl);
        } else {
            console.log('⏭️ View already recorded today:', gameUrl);
        }

        return { success: true };
    } catch (error) {
        console.error('조회수 증가 오류:', error);
        return { success: false, error: error.message };
    }
}

// 게임별 조회수 가져오기
async function getGameViews(gameUrl) {
    try {
        const { data, error } = await supabase
            .from('game_stats')
            .select('*')
            .eq('game_url', gameUrl)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error(`조회수 조회 오류 [${gameUrl}]:`, error);
            throw error;
        }

        console.log(`📊 Views for ${gameUrl}:`, data);

        return {
            total_views: data?.total_views || 0,
            logged_views: data?.logged_views || 0,
            anonymous_views: data?.anonymous_views || 0
        };
    } catch (error) {
        console.error(`조회수 조회 오류 [${gameUrl}]:`, error);
        return { total_views: 0, logged_views: 0, anonymous_views: 0 };
    }
}

// 전체 게임 조회수 가져오기
async function getAllGameViews() {
    try {
        const { data, error } = await supabase
            .from('game_stats')
            .select('*');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('전체 조회수 조회 오류:', error);
        return [];
    }
}

// ============================================
// 인증 상태 변경 리스너
// ============================================
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        loadUserProfile().then(() => {
            // 로그인 성공 이벤트 발생
            window.dispatchEvent(new CustomEvent('userSignedIn', {
                detail: { user: currentUser, profile: currentProfile }
            }));
        });
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;

        // 로그아웃 이벤트 발생
        window.dispatchEvent(new CustomEvent('userSignedOut'));
    }
});

// ============================================
// 페이지 로드 시 세션 확인
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await getCurrentSession();
});

// ============================================
// 전역 함수 노출 (index.html에서 사용)
// ============================================
window.signUp = signUp;
window.signIn = signIn;
window.signOut = signOut;
window.getCurrentSession = getCurrentSession;
window.loadUserProfile = loadUserProfile;
window.resetPassword = resetPassword;
window.updatePassword = updatePassword;
window.getCurrentPoints = getCurrentPoints;
window.usePointsForGameStart = usePointsForGameStart;
window.addGamePoints = addGamePoints;
window.incrementGameView = incrementGameView;
window.getGameViews = getGameViews;
window.getAllGameViews = getAllGameViews;
